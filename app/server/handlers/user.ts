import {
	authMiddleware,
	localeMiddleware,
	protectedMiddleware,
} from "../middleware";
import { db } from "@/server/db";
import { teams, usersToTeams } from "@/server/db/schema";
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

			return [...collectionTeams, ...courseTeams]
				.map(({ team }) => handleLocalization(context, team))
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
		}),
	)
	.handler(async ({ context, data }) => {
		if (data.teamId === context.teamId) {
			return;
		}

		const team = await db.query.usersToTeams.findFirst({
			where: and(
				eq(usersToTeams.userId, context.user.id),
				eq(usersToTeams.teamId, data.teamId),
			),
		});

		if (!team) {
			throw new Error("Team not found");
		}

		setCookie("teamId", data.teamId);
	});

export const setLearnerTeamFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware, localeMiddleware])
	.validator(
		z.object({
			teamId: z.string(),
		}),
	)
	.handler(async ({ context, data }) => {
		if (data.teamId === context.learnerTeamId) {
			return;
		}

		setCookie("learnerTeamId", data.teamId);
	});

export const signOutFn = createServerFn()
	.middleware([authMiddleware, localeMiddleware])
	.handler(async ({ context }) => {
		if (!context.user || !context.session) return;
		deleteCookie("auth_session");
		deleteCookie("teamId");
		invalidateSession(context.session.id);
		throw redirect({
			to: "/$locale/auth/login",
			params: { locale: context.locale },
		});
	});
