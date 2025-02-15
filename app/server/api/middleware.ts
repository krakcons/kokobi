import { SessionValidationResult, validateSessionToken } from "@/server/auth";
import { db } from "@/server/db/db";
import { keys, usersToTeams } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { MiddlewareHandler } from "hono";
import { setCookie, getCookie } from "hono/cookie";
import { Role, roles } from "@/types/users";

export const authMiddleware = (options?: {
	role?: Role;
	requireTeam?: boolean;
}) => {
	const { role = "member", requireTeam = true } = options || {};
	const middleware: MiddlewareHandler<{
		Variables: SessionValidationResult & { teamId: string };
	}> = async (c, next) => {
		const apiKey = c.req.header("x-api-key");
		const sessionId = getCookie(c, "auth_session");

		if (apiKey) {
			const key = await db.query.keys.findFirst({
				where: eq(keys.key, apiKey),
			});

			if (key) {
				c.set("teamId", key.teamId);
				return await next();
			} else {
				return c.text("Invalid API key", 401);
			}
		}

		if (sessionId) {
			const { user, session } = await validateSessionToken(sessionId);

			if (!user) {
				return c.text("Invalid session", 401);
			}

			c.set("user", user);
			c.set("session", session);

			const teamId = getCookie(c, "teamId");

			if (!teamId && requireTeam) {
				return c.text("Team ID required", 401);
			}

			let team;
			if (teamId) {
				team = await db.query.usersToTeams.findFirst({
					where: and(
						eq(usersToTeams.userId, user.id),
						eq(usersToTeams.teamId, teamId),
					),
				});
			} else {
				team = await db.query.usersToTeams.findFirst({
					where: eq(usersToTeams.userId, user.id),
				});

				if (!team) {
					throw c.redirect("/admin/teams/create");
				} else {
					setCookie(c, "teamId", team.teamId, {
						path: "/",
						secure: true,
						httpOnly: true,
						sameSite: "lax",
					});
				}
			}

			if (!team) {
				return c.text("Invalid team", 401);
			}

			if (roles.indexOf(team.role) > roles.indexOf(role)) {
				return c.text("Invalid role", 401);
			}

			c.set("teamId", team.teamId);

			return await next();
		}

		return c.text("API key or session required.", 401);
	};
	return middleware;
};
