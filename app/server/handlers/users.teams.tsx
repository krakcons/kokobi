import {
	authMiddleware,
	localeMiddleware,
	protectedMiddleware,
} from "../lib/middleware";
import { db } from "@/server/db";
import { teams, usersToTeams } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale/helpers";
import { z } from "zod";
import { setCookie } from "@tanstack/react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { Team, TeamTranslation } from "@/types/team";
import { env } from "../env";

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

export const getUserTeamsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["learner", "admin"]),
		}),
	)
	.handler(async ({ context, data: { type } }) => {
		const user = context.user;

		if (!user) {
			throw new Error("Unauthorized");
		}

		if (type === "learner") {
			let learnerTeam = undefined;
			if (context.learnerTeamId) {
				learnerTeam = await db.query.teams.findFirst({
					where: eq(teams.id, context.learnerTeamId),
					with: {
						translations: true,
					},
				});
			}
			const welcomeTeam = await db.query.teams.findFirst({
				where: eq(teams.id, env.WELCOME_TEAM_ID),
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

			return [
				...(learnerTeam ? [learnerTeam] : []),
				...(welcomeTeam ? [welcomeTeam] : []),
				...collectionTeams.map(({ team }) => team),
				...courseTeams.map(({ team }) => team),
			]
				.map((team) => handleLocalization(context, team))
				.reduce(
					(acc, team) =>
						acc.find((t) => t.id === team.teamId)
							? acc
							: [...acc, team],
					[] as (Team & TeamTranslation)[],
				);
		}

		if (type === "admin") {
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

			return teams.map(({ team }) => handleLocalization(context, team));
		}

		return [];
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
				),
			});

			if (!team) {
				throw new Error("You are not a member of this team");
			}

			setCookie("teamId", data.teamId);
		}
	});
