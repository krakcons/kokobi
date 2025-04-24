import {
	authMiddleware,
	localeMiddleware,
	protectedMiddleware,
} from "../lib/middleware";
import { db } from "@/server/db";
import { teams, usersToTeams } from "@/server/db/schema";
import { and, eq, or } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale/helpers";
import { z } from "zod";
import { setCookie } from "@tanstack/react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { Team, TeamTranslation } from "@/types/team";
import { env } from "@/server/env";
import { UserToTeamType } from "@/types/connections";

export const getUserTeamFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, localeMiddleware])
	.validator(z.object({ type: z.enum(["learner", "admin"]) }))
	.handler(async ({ context, data: { type } }) => {
		const teamId =
			type === "learner" ? context.learnerTeamId : context.teamId;

		if (!teamId) {
			throw new Error("Unauthorized");
		}

		const team = await db.query.teams.findFirst({
			where: eq(teams.id, teamId),
			with: {
				translations: true,
				domains: true,
			},
		});

		if (!team) {
			throw new Error("Team not found.");
		}

		return handleLocalization(context, team);
	});

export const getAdminUserTeamsFn = createServerFn({ method: "GET" })
	.middleware([protectedMiddleware, localeMiddleware])
	.handler(async ({ context }) => {
		const user = context.user;

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

		return teams.map((connection) => ({
			...connection,
			team: handleLocalization(context, connection.team),
		}));
	});

export const getLearnerUserTeamsFn = createServerFn({ method: "GET" })
	.middleware([protectedMiddleware, localeMiddleware])
	.handler(async ({ context }) => {
		const user = context.user;

		const defaultTeams = await db.query.teams.findMany({
			where: or(
				// Welcome team
				eq(teams.id, env.WELCOME_TEAM_ID),
				// Team of the user (from tenant, old session, or query param)
				context.learnerTeamId
					? eq(teams.id, context.learnerTeamId)
					: undefined,
			),
			with: {
				translations: true,
			},
		});

		const courseTeams = await db.query.usersToCourses.findMany({
			where: eq(usersToTeams.userId, user.id),
			with: {
				team: {
					with: {
						translations: true,
					},
				},
			},
		});

		const collectionTeams = await db.query.usersToCollections.findMany({
			where: eq(usersToTeams.userId, user.id),
			with: {
				team: {
					with: {
						translations: true,
					},
				},
			},
		});

		const createAutoUserTeam = (
			team: Team & { translations: TeamTranslation[] },
		): UserToTeamType & {
			team: Team & TeamTranslation;
		} => ({
			team: handleLocalization(context, team),
			userId: user.id,
			teamId: team.id,
			connectType: "invite",
			connectStatus: "pending",
			role: "member",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return [
			...defaultTeams.map((team) => createAutoUserTeam(team)),
			...collectionTeams.map((c) => createAutoUserTeam(c.team)),
			...courseTeams.map((c) => createAutoUserTeam(c.team)),
		].reduce(
			(acc, userTeam) =>
				acc.find((t) => t.teamId === userTeam.teamId)
					? acc
					: [...acc, userTeam],
			[] as (UserToTeamType & { team: Team & TeamTranslation })[],
		);
	});

export const updateUserTeamFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(
		z.object({
			teamId: z.string(),
			type: z.enum(["learner", "admin"]),
		}),
	)
	.handler(async ({ context, data }) => {
		if (data.type === "learner" && context.learnerTeamId !== data.teamId) {
			setCookie("learnerTeamId", data.teamId);
		}
		if (data.type === "admin" && data.teamId !== context.teamId) {
			const team = await db.query.usersToTeams.findFirst({
				where: and(
					eq(usersToTeams.userId, context.user.id),
					eq(usersToTeams.teamId, data.teamId),
					eq(usersToTeams.connectStatus, "accepted"),
				),
			});

			if (!team) {
				throw new Error("You are not a member of this team");
			}

			setCookie("teamId", data.teamId);
		}
	});
