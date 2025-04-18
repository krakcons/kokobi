import {
	authMiddleware,
	localeMiddleware,
	protectedMiddleware,
} from "../middleware";
import { db } from "@/server/db";
import { teams, users, usersToTeams } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { createI18n } from "@/lib/locale/actions";
import { handleLocalization } from "@/lib/locale/helpers";
import { z } from "zod";
import { LocaleSchema } from "@/lib/locale";
import { setCookie } from "@tanstack/react-start/server";
import { invalidateSession } from "@/server/auth";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { Team, TeamTranslation } from "@/types/team";

export const updateI18nFn = createServerFn({ method: "POST" })
	.validator(z.object({ locale: LocaleSchema }))
	.handler(async ({ data: { locale } }) => {
		setCookie("locale", locale);
		return { locale };
	});

export const getI18nFn = createServerFn({ method: "GET" })
	.middleware([localeMiddleware])
	.handler(async ({ context }) => {
		const locale = context.locale;
		const i18n = await createI18n({ locale });
		return i18n;
	});

export const getAuthFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		return context;
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

export const setTeamFn = createServerFn({ method: "POST" })
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

export const signOutFn = createServerFn()
	.middleware([authMiddleware, localeMiddleware])
	.handler(async ({ context }) => {
		if (!context.user || !context.session) return;
		deleteCookie("auth_session");
		deleteCookie("teamId");
		deleteCookie("learnerTeamId");
		invalidateSession(context.session.id);
		throw redirect({
			to: "/$locale/auth/login",
			params: { locale: context.locale },
		});
	});

export const UserFormSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
});
export type UserFormType = z.infer<typeof UserFormSchema>;
export const updateUserFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(UserFormSchema)
	.handler(async ({ context, data }) => {
		await db.update(users).set(data).where(eq(users.id, context.user.id));
	});
