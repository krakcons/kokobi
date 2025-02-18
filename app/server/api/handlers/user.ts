import { Hono } from "hono";
import { authMiddleware } from "../middleware";
import { db, usersToTeams } from "@/server/db/db";
import { eq } from "drizzle-orm";

export const userHandler = new Hono()
	.get("/me", authMiddleware({ protect: false }), async (c) => {
		return c.json({
			user: c.get("user"),
			session: c.get("session"),
			teamId: c.get("teamId"),
		});
	})
	.get("/teams", authMiddleware(), async (c) => {
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
	});
