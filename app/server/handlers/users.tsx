import {
	authMiddleware,
	localeMiddleware,
	protectedMiddleware,
} from "../lib/middleware";
import { db } from "@/server/db";
import { teams, users, usersToTeams } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale/helpers";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { Team, TeamTranslation } from "@/types/team";
import { env } from "@/server/env";
import { UserFormSchema } from "@/types/users";

export const updateUserFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(UserFormSchema)
	.handler(async ({ context, data }) => {
		await db.update(users).set(data).where(eq(users.id, context.user.id));
	});

export const getTeamsFn = createServerFn({ method: "GET" })
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
