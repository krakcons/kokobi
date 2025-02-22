import { env } from "@/env";
import { db } from "@/server/db/db";
import {
	teamTranslations,
	teams,
	users,
	usersToTeams,
} from "@/server/db/schema";
import { generateId } from "@/server/helpers";
import { s3 } from "bun";
import { deleteFolder } from "@/server/s3";
import { resend } from "@/server/resend";
import { InviteMemberFormSchema, Team, TeamFormSchema } from "@/types/team";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import {
	HonoVariables,
	localeInputMiddleware,
	protectedMiddleware,
} from "../middleware";
import { handleLocalization } from "@/lib/locale/helpers";
import { setCookie } from "hono/cookie";

const removeDomain = async ({
	customDomain,
	resendDomainId,
}: {
	customDomain: Team["customDomain"];
	resendDomainId?: Team["resendDomainId"];
}) => {
	if (customDomain) {
		const res = await fetch(
			`https://api.vercel.com/v9/projects/${env.PROJECT_ID_VERCEL}/domains/${customDomain}?teamId=${env.TEAM_ID_VERCEL}`,
			{
				headers: {
					Authorization: `Bearer ${env.AUTH_BEARER_TOKEN_VERCEL}`,
				},
				method: "DELETE",
			},
		);
		console.log("VERCEL DELETE", res.status, await res.text());
	}
	if (resendDomainId) {
		const res = await resend.domains.remove(resendDomainId);
		console.log("RESEND DELETE", res.error, res.data);
	}
};

export const teamsHandler = new Hono<{ Variables: HonoVariables }>()
	.get("/", protectedMiddleware(), localeInputMiddleware, async (c) => {
		const teamId = c.get("teamId");

		const team = await db.query.teams.findFirst({
			where: eq(teams.id, teamId),
			with: {
				translations: true,
			},
		});

		if (!team) {
			throw new HTTPException(404, {
				message: "Team not found.",
			});
		}

		return c.json(handleLocalization(c, team));
	})
	.post("/", zValidator("form", TeamFormSchema), async (c) => {
		const locale = c.get("locale");
		const userId = c.get("user")?.id;
		const teamId = c.get("teamId");
		const input = c.req.valid("form");

		if (!userId) {
			throw new HTTPException(401, {
				message: "Must be logged into dashboard",
			});
		}

		if (input.logo) {
			await s3.write(`${teamId}/${c.get("locale")}/logo`, input.logo);
		}

		if (input.favicon) {
			await s3.write(
				`${teamId}/${c.get("locale")}/favicon`,
				input.favicon,
			);
		}

		const id = generateId(15);
		await db.insert(teams).values({ id });
		await db.insert(teamTranslations).values({
			name: input.name,
			teamId: id,
			language: locale,
			default: true,
		});
		await db.insert(usersToTeams).values({
			userId,
			teamId: id,
			role: "owner",
		});

		setCookie(c, "teamId", id, {
			path: "/",
			secure: true,
			httpOnly: true,
			sameSite: "lax",
		});

		return c.json({
			id,
		});
	})
	.put(
		"/",
		zValidator("form", TeamFormSchema),
		protectedMiddleware(),
		async (c) => {
			const locale = c.get("locale");
			const teamId = c.get("teamId");
			const input = c.req.valid("form");

			if (input.logo) {
				await s3.write(`${teamId}/${c.get("locale")}/logo`, input.logo);
			}

			if (input.favicon) {
				await s3.write(
					`${teamId}/${c.get("locale")}/favicon`,
					input.favicon,
				);
			}

			await db
				.insert(teamTranslations)
				.values({
					name: input.name,
					language: locale,
					default: false,
					teamId,
				})
				.onConflictDoUpdate({
					set: {
						name: input.name,
					},
					target: [
						teamTranslations.teamId,
						teamTranslations.language,
					],
				});

			return c.json({
				success: true,
			});
		},
	)
	.post(
		"/invite",
		zValidator("json", InviteMemberFormSchema),
		protectedMiddleware({ role: "owner" }),
		async (c) => {
			const id = c.get("teamId");
			const { email, role } = c.req.valid("json");

			const team = await db.query.teams.findFirst({
				where: eq(teams.id, id),
			});

			if (!team) {
				throw new HTTPException(404, {
					message: "Team not found.",
				});
			}

			const user = await db.query.users.findFirst({
				where: eq(users.email, email),
			});

			if (!user) {
				throw new HTTPException(404, {
					message:
						"User email not found. Please ask them to sign up before continuing.",
				});
			}

			const existing = await db.query.usersToTeams.findFirst({
				where: and(
					eq(usersToTeams.userId, user.id),
					eq(usersToTeams.teamId, id),
				),
			});

			if (existing) {
				throw new HTTPException(400, {
					message: "User is already in the team.",
				});
			}

			await db.insert(usersToTeams).values({
				userId: user.id,
				teamId: id,
				role,
			});

			return c.json(null);
		},
	)
	.delete(
		"/member/:userId",
		protectedMiddleware({ role: "owner" }),
		async (c) => {
			const id = c.get("teamId");
			const { userId } = c.req.param();

			await db
				.delete(usersToTeams)
				.where(
					and(
						eq(usersToTeams.userId, userId),
						eq(usersToTeams.teamId, id),
					),
				);

			return c.json(null);
		},
	)
	.put(
		"/:id/domain",
		zValidator(
			"json",
			z.object({
				customDomain: z.string(),
			}),
		),
		protectedMiddleware(),
		async (c) => {
			const { id } = c.req.param();
			const { customDomain } = c.req.valid("json");

			const team = await db.query.teams.findFirst({
				where: eq(teams.id, id),
			});

			if (!team) {
				throw new HTTPException(404, {
					message: "Team not found.",
				});
			}

			let resendDomainId: string | null = null;

			if (team.customDomain !== customDomain) {
				// Add the new domain
				const res = await fetch(
					`https://api.vercel.com/v10/projects/${env.PROJECT_ID_VERCEL}/domains?teamId=${env.TEAM_ID_VERCEL}`,
					{
						method: "POST",
						headers: {
							Authorization: `Bearer ${env.AUTH_BEARER_TOKEN_VERCEL}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							name: customDomain,
						}),
					},
				);
				if (!res.ok) {
					console.log("ERROR (VERCEL)", await res.text());
					throw new HTTPException(500, {
						message: "Failed to add domain to Vercel.",
					});
				}
				const resendRes = await resend.domains.create({
					name: customDomain,
				});
				if (resendRes.error) {
					// Rollback
					await removeDomain({
						customDomain,
					});
					console.log("ERROR (RESEND)", resendRes.error.message);
					throw new HTTPException(500, {
						message: "Failed to add domain to Resend.",
					});
				}
				resendDomainId = resendRes.data!.id;
				// Remove the old domain
				if (team.customDomain)
					await removeDomain({
						customDomain: team.customDomain,
						resendDomainId: team.resendDomainId,
					});
			} else {
				throw new HTTPException(400, {
					message: "That domain is already set.",
				});
			}

			// Update the team in the database
			await db
				.update(teams)
				.set({
					customDomain,
					resendDomainId,
				})
				.where(eq(teams.id, id));

			return c.json(null);
		},
	)
	// TODO: Fix this breaking cdn catchall
	//.delete("/:id/domain", protectedMiddleware(), async (c) => {
	//	const { id } = c.req.param();
	//
	//	const team = await db.query.teams.findFirst({
	//		where: eq(teams.id, id),
	//	});
	//
	//	if (!team) {
	//		throw new HTTPException(404, {
	//			message: "Team not found.",
	//		});
	//	}
	//
	//	if (team.customDomain)
	//		await removeDomain({
	//			customDomain: team.customDomain,
	//			resendDomainId: team.resendDomainId,
	//		});
	//
	//	await db
	//		.update(teams)
	//		.set({
	//			customDomain: null,
	//			resendDomainId: null,
	//		})
	//		.where(eq(teams.id, id));
	//
	//	return c.json(null);
	//})
	.delete("/", protectedMiddleware({ role: "owner" }), async (c) => {
		const teamId = c.get("teamId");

		await deleteFolder(`${teamId}`);
		await db.delete(teams).where(eq(teams.id, teamId));

		return c.json({
			success: true,
		});
	});
