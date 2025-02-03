import { env } from "@/env";
import { coursesData } from "@/server/db/courses";
import { db } from "@/server/db/db";
import {
	collectionTranslations,
	collections,
	courses,
	keys,
	teamTranslations,
	teams,
	users,
	usersToTeams,
} from "@/server/db/schema";
import { generateId } from "@/server/helpers";
import { deleteFolder, getPresignedUrl } from "@/server/r2";
import { resend } from "@/server/resend";
import {
	InviteMemberFormSchema,
	Team,
	UpdateTeamTranslationSchema,
} from "@/types/team";
import { LanguageSchema } from "@/types/translations";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import {
	authedMiddleware,
	ownerMiddleware,
	userMiddleware,
} from "../middleware";

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
			}
		);
		console.log("VERCEL DELETE", res.status, await res.text());
	}
	if (resendDomainId) {
		const res = await resend.domains.remove(resendDomainId);
		console.log("RESEND DELETE", res.error, res.data);
	}
};

export const teamsHandler = new Hono()
	.post(
		"/",
		zValidator(
			"json",
			z.object({ name: z.string(), language: LanguageSchema })
		),
		userMiddleware,
		async (c) => {
			const { name, language } = c.req.valid("json");
			const userId = c.get("userId");

			if (!userId) {
				throw new HTTPException(401, {
					message: "Must be logged into dashboard",
				});
			}

			const id = generateId(15);

			await db.insert(teams).values({ id });
			await db.insert(teamTranslations).values({
				teamId: id,
				name,
				language,
				default: true,
			});
			await db.insert(usersToTeams).values({
				userId,
				teamId: id,
				role: "owner",
			});

			return c.json({
				id,
			});
		}
	)
	.post(
		"/:id/invite",
		zValidator("json", InviteMemberFormSchema),
		authedMiddleware,
		ownerMiddleware,
		async (c) => {
			const { id } = c.req.param();
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
					eq(usersToTeams.teamId, id)
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
		}
	)
	.delete(
		"/:id/member/:userId",
		authedMiddleware,
		ownerMiddleware,
		async (c) => {
			const { id, userId } = c.req.param();

			await db
				.delete(usersToTeams)
				.where(
					and(
						eq(usersToTeams.userId, userId),
						eq(usersToTeams.teamId, id)
					)
				);

			return c.json(null);
		}
	)
	.put(
		"/:id",
		zValidator("json", UpdateTeamTranslationSchema),
		authedMiddleware,
		async (c) => {
			const id = c.req.param("id");
			const teamId = c.get("teamId");

			if (id !== teamId) {
				throw new HTTPException(401, {
					message: "Unauthorized",
				});
			}

			const input = c.req.valid("json");

			await db
				.insert(teamTranslations)
				.values({
					...input,
					teamId,
				})
				.onConflictDoUpdate({
					set: input,
					target: [
						teamTranslations.teamId,
						teamTranslations.language,
					],
				});

			return c.json(null);
		}
	)
	.put(
		"/:id/domain",
		zValidator(
			"json",
			z.object({
				customDomain: z.string(),
			})
		),
		authedMiddleware,
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
					}
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
		}
	)
	.delete("/:id/domain", authedMiddleware, async (c) => {
		const { id } = c.req.param();

		const team = await db.query.teams.findFirst({
			where: eq(teams.id, id),
		});

		if (!team) {
			throw new HTTPException(404, {
				message: "Team not found.",
			});
		}

		await removeDomain({
			customDomain: team.customDomain,
			resendDomainId: team.resendDomainId,
		});

		await db
			.update(teams)
			.set({
				customDomain: null,
				resendDomainId: null,
			})
			.where(eq(teams.id, id));

		return c.json(null);
	})
	.post(
		"/logo",
		zValidator(
			"json",
			z.object({
				language: LanguageSchema,
			})
		),
		authedMiddleware,
		async (c) => {
			const language = c.req.valid("json").language;
			const teamId = c.get("teamId");

			const imageUrl = `${teamId}/${language}/logo`;
			const url = await getPresignedUrl(imageUrl);

			return c.json({ url, imageUrl });
		}
	)
	.post(
		"/favicon",
		zValidator(
			"json",
			z.object({
				language: LanguageSchema,
			})
		),
		authedMiddleware,
		async (c) => {
			const language = c.req.valid("json").language;
			const teamId = c.get("teamId");

			const imageUrl = `${teamId}/${language}/favicon`;
			const url = await getPresignedUrl(imageUrl);

			return c.json({ url, imageUrl });
		}
	)
	// Private
	.delete("/:id", authedMiddleware, ownerMiddleware, async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		await deleteFolder(`${teamId}`);

		// Delete all courses/modules/translations/collection relations
		const courseList = await db.query.courses.findMany({
			where: eq(courses.teamId, id),
		});
		await Promise.all(
			courseList.map(async (course) => {
				return coursesData.delete({ id: course.id }, teamId);
			})
		);
		await db
			.delete(teamTranslations)
			.where(eq(teamTranslations.teamId, id));

		// Delete all collections and translations
		const collectionList = await db.query.collections.findMany({
			where: eq(collections.teamId, id),
		});
		await Promise.all(
			collectionList.map(async (collection) => {
				return db
					.delete(collectionTranslations)
					.where(
						eq(collectionTranslations.collectionId, collection.id)
					);
			})
		);
		await db.delete(collections).where(eq(collections.teamId, id));

		// Delete all keys
		await db.delete(keys).where(eq(keys.teamId, id));

		// Delete team and translations
		await db
			.delete(teamTranslations)
			.where(eq(teamTranslations.teamId, id));
		await db.delete(usersToTeams).where(eq(usersToTeams.teamId, id));
		await db.delete(teams).where(eq(teams.id, id));

		return c.json(null);
	});
