import { db } from "@/server/db";
import { courses, modules } from "@/server/db/schema";
import { and, desc, eq, max } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { localeMiddleware, teamMiddleware } from "../middleware";
import { ModuleFormSchema } from "@/types/module";
import { shouldIgnoreFile, validateModule } from "@/lib/module";
import { s3 } from "@/server/s3";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getModulesFn = createServerFn({ method: "GET" })
	.middleware([localeMiddleware])
	.validator(z.object({ courseId: z.string() }))
	.handler(async ({ context, data }) => {
		const locale = context.locale;

		const moduleList = await db.query.modules.findMany({
			where: and(
				eq(modules.courseId, data.courseId),
				eq(modules.language, locale),
			),
			orderBy: desc(modules.versionNumber),
		});

		return moduleList;
	});

export const createModuleFn = createServerFn({ method: "POST" })
	.middleware([localeMiddleware, teamMiddleware()])
	.validator(ModuleFormSchema.extend({ courseId: z.string() }))
	.handler(async ({ context, data }) => {
		const locale = context.locale;
		const teamId = context.teamId;

		const course = await db.query.courses.findFirst({
			where: and(
				eq(courses.id, data.courseId),
				eq(courses.teamId, teamId),
			),
		});

		if (!course) {
			throw new HTTPException(404, {
				message: "Course not found.",
			});
		}

		const moduleFile = data.file;
		if (moduleFile === "") {
			throw new HTTPException(400, {
				message: "Module empty",
			});
		}
		const { entries, type } = await validateModule(moduleFile);

		const newestModule = await db
			.select({
				versionNumber: max(modules.versionNumber),
			})
			.from(modules)
			.where(
				and(
					eq(modules.courseId, data.courseId),
					eq(modules.language, locale),
				),
			);

		const insertId = Bun.randomUUIDv7();
		const versionNumber =
			newestModule.length > 0 && newestModule[0].versionNumber
				? newestModule[0].versionNumber + 1
				: 1;

		await db.insert(modules).values({
			id: insertId,
			courseId: data.courseId,
			type,
			language: locale,
			versionNumber,
		});

		Promise.all(
			Object.entries(entries).map(async ([key, file]) => {
				console.log("File", key);
				if (shouldIgnoreFile(key)) {
					return;
				}
				const blob = await file.blob();
				s3.write(
					`/${teamId}/courses/${data.courseId}/${locale}${versionNumber > 1 ? `_${versionNumber}` : ""}/${key}`,
					blob,
				);
			}),
		);

		return { id: insertId };
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
			throw new HTTPException(404, {
				message: "Module does not exist",
			});
		}

		// If module is not owned by the team
		if (moduleExists.course.teamId !== teamId) {
			throw new HTTPException(401, {
				message: "Unauthorized",
			});
		}

		await db
			.delete(modules)
			.where(
				and(eq(modules.id, moduleId), eq(modules.courseId, courseId)),
			);

		return null;
	});
