import { Hono } from "hono";
import { userMiddleware } from "../middleware";
import { db, usersToTeams } from "@/server/db/db";
import { and, eq } from "drizzle-orm";
import { getCookie, setCookie } from "hono/cookie";

export const userHandler = new Hono()
	.get("/me", userMiddleware, async (c) => {
		const user = c.get("user");
		const session = c.get("session");
		return c.json({
			user,
			session,
		});
	})
	.get("/teams", userMiddleware, async (c) => {
		const user = c.get("user");
		const teamId = getCookie(c, "teamId");

		// If team cookie check for team and redirect
		let activeTeam;
		if (teamId) {
			const userToTeam = await db.query.usersToTeams.findFirst({
				where: and(
					eq(usersToTeams.userId, user.id),
					eq(usersToTeams.teamId, teamId),
				),
				with: {
					team: true,
				},
			});

			if (userToTeam?.team) {
				activeTeam = userToTeam.team;
			}
		}

		const teamsList = await db.query.usersToTeams.findMany({
			where: eq(usersToTeams.userId, user.id),
			with: {
				team: {
					with: {
						translations: true,
					},
				},
			},
		});

		if (teamsList.length === 0) {
			throw c.redirect("/admin/teams/create");
		} else {
			const team = teamsList[0].team;
			setCookie(c, "teamId", team.id, {
				path: "/",
				secure: true,
				httpOnly: true,
				sameSite: "lax",
			});
			activeTeam = team;
		}

		return c.json({
			teams: teamsList,
			activeTeam,
		});
	});
