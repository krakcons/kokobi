import { SessionValidationResult, validateSessionToken } from "@/server/auth";
import { db } from "@/server/db/db";
import { keys, Session, usersToTeams } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { Role, roles, User } from "@/types/users";

export const authMiddleware = createMiddleware<{
	Variables: SessionValidationResult & {
		teamId: string | null;
		teamRole: Role;
	};
}>(async (c, next) => {
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
			c.set("teamId", null);
			c.set("user", null);
			c.set("session", null);
			return await next();
		}

		c.set("user", user);
		c.set("session", session);

		const teamId = getCookie(c, "teamId") || c.req.header("teamId");

		if (!teamId) {
			c.set("teamId", null);
			return await next();
		}

		const team = await db.query.usersToTeams.findFirst({
			where: and(
				eq(usersToTeams.userId, user.id),
				eq(usersToTeams.teamId, teamId),
			),
		});

		if (!team) {
			return c.text("Invalid team", 401);
		}

		c.set("teamId", team.teamId);

		return await next();
	}

	return c.text("API key or session required.", 401);
});

export const protectedMiddleware = ({
	role = "member",
}: { role?: Role } = {}) =>
	createMiddleware<{
		Variables: {
			user: User;
			session: Session;
			teamId: string;
			teamRole: Role;
		};
	}>(async (c, next) => {
		const teamRole = c.get("teamRole");
		if (roles.indexOf(teamRole) > roles.indexOf(role)) {
			return c.text("Invalid role", 401);
		}

		if (c.get("teamId") && c.get("user") && c.get("session")) {
			return await next();
		}
		return c.text("Unauthorized", 401);
	});
