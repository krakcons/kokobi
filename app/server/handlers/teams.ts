import { db } from "@/server/db";
import {
	learners,
	teamTranslations,
	teams,
	users,
	usersToTeams,
} from "@/server/db/schema";
import { s3 } from "@/server/s3";
import { InviteMemberFormSchema, TeamFormSchema } from "@/types/team";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import {
	localeMiddleware,
	protectedMiddleware,
	teamMiddleware,
} from "../middleware";
import { handleLocalization } from "@/lib/locale/helpers";
import { locales } from "@/lib/locale";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, setCookie } from "@tanstack/react-start/server";

export const getTeamMembersFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware({ role: "owner" })])
	.handler(async ({ context }) => {
		const teamId = context.teamId;

		const members = await db.query.usersToTeams.findMany({
			where: eq(usersToTeams.teamId, teamId),
			with: {
				user: true,
			},
		});

		return members.map(({ user, role, createdAt }) => ({
			...user,
			joinedAt: createdAt,
			role,
		}));
	});

export const getTeamStatsFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware()])
	.handler(async ({ context }) => {
		const teamId = context.teamId;
		const learnerCount = (
			await db
				.select({ count: count() })
				.from(learners)
				.where(eq(learners.teamId, teamId))
		)[0].count;

		return { learnerCount };
	});

export const getTeamFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware(), localeMiddleware])
	.handler(async ({ context }) => {
		const teamId = context.teamId;

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

export const createTeamFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(z.instanceof(FormData))
	.handler(async ({ context, data: formData }) => {
		const locale = context.locale;
		const userId = context.user.id;

		const data = TeamFormSchema.parse(
			Object.fromEntries(formData.entries()),
		);
		const id = Bun.randomUUIDv7();

		if (data.logo) {
			await s3.write(`${id}/${locale}/logo`, data.logo);
		}
		if (data.favicon) {
			await s3.write(`${id}/${locale}/favicon`, data.favicon);
		}

		await db.insert(teams).values({ id });
		await db.insert(teamTranslations).values({
			name: data.name,
			teamId: id,
			language: locale,
		});
		await db.insert(usersToTeams).values({
			userId,
			teamId: id,
			role: "owner",
		});

		setCookie("teamId", id, {
			path: "/",
			secure: true,
			httpOnly: true,
			sameSite: "lax",
		});

		return {
			id,
		};
	});

export const updateTeamFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware({ role: "owner" }), localeMiddleware])
	.validator(z.instanceof(FormData))
	.handler(async ({ context, data: formData }) => {
		const locale = context.locale;
		const teamId = context.teamId;

		const data = TeamFormSchema.parse(
			Object.fromEntries(formData.entries()),
		);

		if (data.logo) {
			await s3.write(`${teamId}/${locale}/logo`, data.logo);
		} else {
			await s3.delete(`${teamId}/${locale}/logo`);
		}

		if (data.favicon) {
			await s3.write(`${teamId}/${locale}/favicon`, data.favicon);
		} else {
			await s3.delete(`${teamId}/${locale}/favicon`);
		}

		await db
			.insert(teamTranslations)
			.values({
				name: data.name,
				language: locale,
				teamId,
			})
			.onConflictDoUpdate({
				set: {
					name: data.name,
					updatedAt: new Date(),
				},
				target: [teamTranslations.teamId, teamTranslations.language],
			});

		return null;
	});

export const inviteMemberFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware({ role: "owner" })])
	.validator(InviteMemberFormSchema)
	.handler(async ({ context, data }) => {
		const id = context.teamId;
		const { email, role } = data;

		const team = await db.query.teams.findFirst({
			where: eq(teams.id, id),
		});

		if (!team) {
			throw new Error("Team not found.");
		}

		const user = await db.query.users.findFirst({
			where: eq(users.email, email),
		});

		if (!user) {
			throw new Error(
				"User email not found. Please ask them to sign up before continuing.",
			);
		}

		const existing = await db.query.usersToTeams.findFirst({
			where: and(
				eq(usersToTeams.userId, user.id),
				eq(usersToTeams.teamId, id),
			),
		});

		if (existing) {
			throw new Error("User is already in the team.");
		}

		await db.insert(usersToTeams).values({
			userId: user.id,
			teamId: id,
			role,
		});

		return null;
	});

export const deleteTeamMemberFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware({ role: "owner" })])
	.validator(z.object({ userId: z.string() }))
	.handler(async ({ context, data: { userId } }) => {
		const id = context.teamId;

		await db
			.delete(usersToTeams)
			.where(
				and(
					eq(usersToTeams.userId, userId),
					eq(usersToTeams.teamId, id),
				),
			);

		return null;
	});

export const deleteTeamFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware({ role: "owner" })])
	.handler(async ({ context }) => {
		const userId = context.user?.id;
		const teamId = context.teamId;

		// TODO: DELETE full team data w/courses (waiting on bun s3 list function)
		locales.forEach(async (locale) => {
			await s3.delete(`/${teamId}/${locale.value}/logo`);
			await s3.delete(
				`/${teamId}/${locale.value
					.toLowerCase()
					.replaceAll("-", "_")}/favicon`,
			);
		});
		await db.delete(teams).where(eq(teams.id, teamId));

		// Find next best team or redirect to create team
		const team = await db.query.usersToTeams.findFirst({
			where: eq(usersToTeams.userId, userId),
		});

		if (!team) {
			deleteCookie("teamId");
			return {
				teamId: null,
			};
		} else {
			setCookie("teamId", team.teamId, {
				path: "/",
				secure: true,
				httpOnly: true,
				sameSite: "lax",
			});
			return {
				teamId: team.teamId,
			};
		}
	});
