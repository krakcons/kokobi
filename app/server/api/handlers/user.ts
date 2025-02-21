import { Hono } from "hono";
import { HonoVariables, protectedMiddleware } from "../middleware";
import { db, usersToTeams } from "@/server/db/db";
import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { setCookie } from "hono/cookie";

export const userHandler = new Hono<{ Variables: HonoVariables }>()
	.get("/me", async (c) => {
		return c.json({
			user: c.get("user"),
			session: c.get("session"),
			teamId: c.get("teamId"),
		});
	})
	.get("/teams", protectedMiddleware(), async (c) => {
		const user = c.get("user");

		if (!user) {
			return c.text("Invalid session", 401);
		}

		const teams = await db.query.usersToTeams.findMany({
			where: eq(usersToTeams.userId, user.id),
			with: {
				team: {
					with: {
						translations: true,
					},
				},
			},
		});

		return c.json(teams.map((t) => t.team));
	})
	.post(
		"/team",
		protectedMiddleware(),
		zValidator(
			"json",
			z.object({
				teamId: z.string(),
			}),
		),
		async (c) => {
			const { teamId } = c.req.valid("json");
			const user = c.get("user");

			const team = await db.query.usersToTeams.findFirst({
				where: and(
					eq(usersToTeams.teamId, teamId),
					eq(usersToTeams.userId, user.id),
				),
			});

			if (!team) {
				return c.text("Invalid teamId", 400);
			}

			setCookie(c, "teamId", team.teamId, {
				path: "/",
				secure: true,
				httpOnly: true,
				sameSite: "lax",
			});

			return c.json({
				success: true,
			});
		},
	);
