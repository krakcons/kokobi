import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { and, eq } from "drizzle-orm";
import { deleteCookie, getCookie } from "vinxi/http";
import { z } from "zod";
import {
	invalidateSession,
	SessionValidationResult,
	validateSessionToken,
} from ".";
import { db } from "../db/db";
import { usersToTeams } from "../db/schema";

export const getAuth = createServerFn({
	method: "GET",
}).handler(async (): Promise<SessionValidationResult> => {
	const sessionId = getCookie("auth_session");

	if (!sessionId) {
		return {
			user: null,
			session: null,
		};
	}

	return await validateSessionToken(sessionId);
});

export const logout = createServerFn({
	method: "POST",
}).handler(async () => {
	const sessionId = getCookie("auth_session");
	if (!sessionId) return;
	deleteCookie("auth_session");
	deleteCookie("teamId");
	invalidateSession(sessionId);
});

export const getTeam = async ({
	id,
	userId,
}: {
	id: string;
	userId: string;
}) => {
	const userToTeam = await db.query.usersToTeams.findFirst({
		where: and(
			eq(usersToTeams.teamId, id),
			eq(usersToTeams.userId, userId),
		),
		with: {
			team: true,
		},
	});
	return userToTeam?.team;
};

export const getUserRole = createServerFn({
	method: "GET",
})
	.validator(
		z.object({
			teamId: z.string(),
		}),
	)
	.handler(async ({ data: { teamId } }) => {
		const user = await getAuth();

		if (!user.user) {
			throw redirect({ href: "/api/auth/google" });
		}

		const userToTeam = await db.query.usersToTeams.findFirst({
			where: and(
				eq(usersToTeams.userId, user.user?.id),
				eq(usersToTeams.teamId, teamId),
			),
		});

		return userToTeam!.role;
	});
