import { db } from "@/server/db";
import { modules } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { localeMiddleware, teamMiddleware } from "../lib/middleware";
import { shouldIgnoreFile, validateModule } from "@/lib/module";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getNewModuleVersionNumber } from "../lib/modules";
import { hasTeamAccess } from "../lib/access";
import { s3 } from "../s3";

export const getModulesFn = createServerFn({ method: "GET" })
	.middleware([localeMiddleware])
	.validator(z.object({ courseId: z.string() }))
	.handler(async ({ data }) => {
		const moduleList = await db.query.modules.findMany({
			where: and(eq(modules.courseId, data.courseId)),
			orderBy: desc(modules.versionNumber),
		});

		return moduleList;
	});

export const createModulePresignedURLFn = createServerFn({ method: "POST" })
	.middleware([localeMiddleware, teamMiddleware()])
	.validator(z.object({ courseId: z.string() }))
	.handler(async ({ context, data }) => {
		await hasTeamAccess({
			id: data.courseId,
			type: "course",
			teamId: context.teamId,
			access: "root",
		});

		const versionNumber = await getNewModuleVersionNumber(
			context.locale,
			data.courseId,
		);

		const url = s3.presign(
			`${context.teamId}/courses/${data.courseId}/tmp/${context.locale}${versionNumber > 1 ? `_${versionNumber}` : ""}.zip`,
			{
				expiresIn: 3600,
				method: "PUT",
				type: "application/zip",
			},
		);

		return url;
	});

export const createModuleFn = createServerFn({ method: "POST" })
	.middleware([localeMiddleware, teamMiddleware()])
	.validator(z.object({ courseId: z.string() }))
	.handler(async ({ context, data }) => {
		await hasTeamAccess({
			id: data.courseId,
			type: "course",
			teamId: context.teamId,
			access: "root",
		});

		const versionNumber = await getNewModuleVersionNumber(
			context.locale,
			data.courseId,
		);

		const moduleFile = s3.file(
			`${context.teamId}/courses/${data.courseId}/tmp/${context.locale}${versionNumber > 1 ? `_${versionNumber}` : ""}.zip`,
		);

		const exists = await moduleFile.exists();
		if (!exists) {
			throw new Error("File not found");
		}

		try {
			const { entries, type } = await validateModule(
				await moduleFile.arrayBuffer(),
			);
			const insertId = Bun.randomUUIDv7();

			await db.insert(modules).values({
				id: insertId,
				courseId: data.courseId,
				type,
				locale: context.locale,
				versionNumber,
			});

			Promise.all(
				Object.entries(entries).map(async ([key, file]) => {
					if (shouldIgnoreFile(key)) {
						return;
					}
					const blob = await file.blob();
					s3.write(
						`${context.teamId}/courses/${data.courseId}/${context.locale}${versionNumber > 1 ? `_${versionNumber}` : ""}/${key}`,
						blob,
					);
				}),
			);

			return { id: insertId };
		} catch (error) {
			await moduleFile.delete();
			throw error;
		} finally {
			await moduleFile.delete();
		}
	});

export const deleteModuleFn = createServerFn({ method: "POST" })
	.middleware([localeMiddleware, teamMiddleware()])
	.validator(z.object({ courseId: z.string(), moduleId: z.string() }))
	.handler(async ({ context, data: { courseId, moduleId } }) => {
		const teamId = context.teamId;

		const moduleExists = await db.query.modules.findFirst({
			where: and(
				eq(modules.id, moduleId),
				eq(modules.courseId, courseId),
			),
			with: {
				course: true,
			},
		});

		if (!moduleExists) {
			throw new Error("Module does not exist");
		}

		// If module is not owned by the team
		if (moduleExists.course.teamId !== teamId) {
			throw new Error("Unauthorized");
		}

		await db
			.delete(modules)
			.where(
				and(eq(modules.id, moduleId), eq(modules.courseId, courseId)),
			);

		const files = await s3.list({
			prefix: `${teamId}/courses/${courseId}/${moduleExists.locale}${moduleExists.versionNumber > 1 ? `_${moduleExists.versionNumber}` : ""}/`,
			maxKeys: 1000,
		});
		if (files.contents) {
			await Promise.all(
				files.contents.map((file) => {
					s3.delete(file.key);
				}),
			);
		}

		return null;
	});
