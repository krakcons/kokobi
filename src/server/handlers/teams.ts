import { db } from "@/server/db";
import {
	learners,
	teamTranslations,
	teams,
	users,
	usersToTeams,
} from "@/server/db/schema";
import { s3 } from "@/server/s3";
import { InviteMemberFormSchema, TeamFormSchema } from "@/types/team";
import { zValidator } from "@hono/zod-validator";
import { and, count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import {
	HonoVariables,
	localeInputMiddleware,
	protectedMiddleware,
} from "../middleware";
import { handleLocalization } from "@/lib/locale/helpers";
import { deleteCookie, setCookie } from "hono/cookie";
import { locales } from "@/lib/locale";

export const teamsHandler = new Hono<{ Variables: HonoVariables }>()
	.get("/members", protectedMiddleware(), async (c) => {
		const teamId = c.get("teamId");

		const members = await db.query.usersToTeams.findMany({
			where: eq(usersToTeams.teamId, teamId),
			with: {
				user: true,
			},
		});

		return c.json(
			members.map(({ user, role, createdAt }) => ({
				...user,
				joinedAt: createdAt,
				role,
			})),
		);
	})
	.get("/stats", protectedMiddleware(), async (c) => {
		const teamId = c.get("teamId");
		const learnerCount = (
			await db
				.select({ count: count() })
				.from(learners)
				.where(eq(learners.teamId, teamId))
		)[0].count;

		return c.json({ learnerCount });
	})
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
	.post(
		"/",
		zValidator("form", TeamFormSchema),
		localeInputMiddleware,
		async (c) => {
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
				await s3.write(`${teamId}/${locale}/logo`, input.logo);
			}
			if (input.favicon) {
				await s3.write(`${teamId}/${locale}/favicon`, input.favicon);
			}

			const id = Bun.randomUUIDv7();
			await db.insert(teams).values({ id });
			await db.insert(teamTranslations).values({
				name: input.name,
				teamId: id,
				language: locale,
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
		},
	)
	.put(
		"/",
		zValidator("form", TeamFormSchema),
		protectedMiddleware(),
		localeInputMiddleware,
		async (c) => {
			const locale = c.get("locale");
			const teamId = c.get("teamId");
			const input = c.req.valid("form");

			if (input.logo) {
				await s3.write(`${teamId}/${locale}/logo`, input.logo);
			} else {
				await s3.delete(`${teamId}/${locale}/logo`);
			}

			if (input.favicon) {
				await s3.write(`${teamId}/${locale}/favicon`, input.favicon);
			} else {
				await s3.delete(`${teamId}/${locale}/favicon`);
			}

			await db
				.insert(teamTranslations)
				.values({
					name: input.name,
					language: locale,
					teamId,
				})
				.onConflictDoUpdate({
					set: {
						name: input.name,
						updatedAt: new Date(),
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
	.delete("/", protectedMiddleware({ role: "owner" }), async (c) => {
		const userId = c.get("user").id;
		const teamId = c.get("teamId");

		// TODO: DELETE full team data w/courses (waiting on bun s3 list function)
		locales.forEach(async (locale) => {
			await s3.delete(`/${teamId}/${locale.value}/logo`);
			await s3.delete(`/${teamId}/${locale.value}/favicon`);
		});
		await db.delete(teams).where(eq(teams.id, teamId));

		// Find next best team or redirect to create team
		const team = await db.query.usersToTeams.findFirst({
			where: eq(usersToTeams.userId, userId),
		});

		if (!team) {
			deleteCookie(c, "teamId");
			return c.json({
				teamId: null,
			});
		} else {
			setCookie(c, "teamId", team.teamId, {
				path: "/",
				secure: true,
				httpOnly: true,
				sameSite: "lax",
			});
			return c.json({
				teamId: team.teamId,
			});
		}
	});
