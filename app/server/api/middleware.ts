import { validateSessionToken } from "@/server/auth";
import { db } from "@/server/db/db";
import { keys, usersToTeams } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { getTeam } from "../auth/actions";

export const authedMiddleware: MiddlewareHandler<{
	Variables: {
		teamId: string;
		userId?: string;
	};
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
	} else if (sessionId) {
		const user = await validateSessionToken(sessionId);

		if (!user.user) {
			return c.text("Invalid session", 401);
		}

		c.set("userId", user.user.id);

		const teamId = getCookie(c, "teamId");

		if (!teamId) {
			return c.text("Team ID required", 401);
		}

		const team = await getTeam({ id: teamId, userId: user.user.id });

		if (!team) {
			return c.text("Invalid team", 401);
		}

		c.set("teamId", team.id);

		return await next();
	} else {
		return c.text("API key or session required.", 401);
	}
};

export const userMiddleware: MiddlewareHandler<{
	Variables: {
		userId: string;
	};
}> = async (c, next) => {
	const sessionId = getCookie(c, "auth_session");

	if (sessionId) {
		const user = await validateSessionToken(sessionId);

		if (!user.user) {
			return c.text("Invalid session", 401);
		}

		c.set("userId", user.user.id);

		return await next();
	} else {
		return c.text("Session required", 401);
	}
};

export const ownerMiddleware: MiddlewareHandler<{
	Variables: {
		userId: string;
		teamId: string;
	};
}> = async (c, next) => {
	const userId = c.get("userId");
	const teamId = c.get("teamId");

	const userToTeam = await db.query.usersToTeams.findFirst({
		where: and(
			eq(usersToTeams.userId, userId),
			eq(usersToTeams.teamId, teamId),
		),
	});

	if (userToTeam?.role !== "owner") {
		return c.text("Not owner of team", 401);
	}

	return await next();
};
