import { db } from "@/server/db";
import {
	teamTranslations,
	teams,
	usersToCourses,
	usersToTeams,
} from "@/server/db/schema";
import { createS3 } from "@/server/s3";
import { TeamFormSchema } from "@/types/team";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import {
	localeMiddleware,
	protectedMiddleware,
	teamMiddleware,
} from "../lib/middleware";
import { handleLocalization } from "@/lib/locale/helpers";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, setCookie } from "@tanstack/react-start/server";
import { getTenant } from "../lib/tenant";

export const getTeamByIdFn = createServerFn({ method: "GET" })
	.middleware([localeMiddleware])
	.validator(z.object({ teamId: z.string() }))
	.handler(async ({ context, data: { teamId } }) => {
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
		const s3 = await createS3();

		const data = TeamFormSchema.parse(
			Object.fromEntries(formData.entries()),
		);
		const id = Bun.randomUUIDv7();

		let logo = null;
		if (data.logo) {
			const extension = data.logo.name.split(".").pop();
			const path = `${id}/${locale}/logo.${extension}`;
			await s3.write(path, data.logo, {
				type: data.logo.type,
			});
			logo = path;
		}

		let favicon = null;
		if (data.favicon) {
			const extension = data.favicon.name.split(".").pop();
			const path = `${id}/${locale}/favicon.${extension}`;
			await s3.write(path, data.favicon, {
				type: data.favicon.type,
			});
			favicon = path;
		}

		await db.insert(teams).values({ id });
		await db.insert(teamTranslations).values({
			name: data.name,
			teamId: id,
			locale,
			logo,
			favicon,
		});
		await db.insert(usersToTeams).values({
			userId,
			teamId: id,
			role: "owner",
			connectType: "invite",
			connectStatus: "accepted",
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
		const s3 = await createS3();

		const data = TeamFormSchema.parse(
			Object.fromEntries(formData.entries()),
		);

		let logo = null;
		if (data.logo) {
			const extension = data.logo.name.split(".").pop();
			const path = `${teamId}/${locale}/logo.${extension}`;
			await s3.write(path, data.logo, {
				type: data.logo.type,
			});
			logo = path;
		} else {
			await s3.delete(`${teamId}/${locale}/logo`);
		}

		let favicon = null;
		if (data.favicon) {
			const extension = data.favicon.name.split(".").pop();
			const path = `${teamId}/${locale}/favicon.${extension}`;
			await s3.write(path, data.favicon, {
				type: data.favicon.type,
			});
			favicon = path;
		} else {
			await s3.delete(`${teamId}/${locale}/favicon`);
		}

		await db
			.insert(teamTranslations)
			.values({
				name: data.name,
				locale,
				teamId,
				logo,
				favicon,
			})
			.onConflictDoUpdate({
				set: {
					name: data.name,
					logo,
					favicon,
					updatedAt: new Date(),
				},
				target: [teamTranslations.teamId, teamTranslations.locale],
			});

		return null;
	});

export const deleteTeamFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware({ role: "owner" })])
	.handler(async ({ context }) => {
		const teamId = context.teamId;
		const s3 = await createS3();

		const files = await s3.list({
			prefix: `${teamId}/`,
			maxKeys: 1000,
		});
		if (files.contents) {
			await Promise.all(
				files.contents.map((file) => {
					s3.delete(file.key);
				}),
			);
		}
		await db.delete(teams).where(eq(teams.id, teamId));

		deleteCookie("teamId");
	});

export const getTeamStatsFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware()])
	.handler(async ({ context }) => {
		const teamId = context.teamId;
		const learnerCount = (
			await db
				.select({ count: count() })
				.from(usersToCourses)
				.where(eq(usersToCourses.teamId, teamId))
		)[0].count;

		return { learnerCount };
	});

export const getTenantFn = createServerFn({ method: "GET" }).handler(
	async () => {
		return await getTenant();
		return "019663b4-9c39-7000-9aa7-9df9fb23654c";
	},
);
