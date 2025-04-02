import { db } from "@/server/db";
import { courses, modules } from "@/server/db/schema";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, max } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
	HonoVariables,
	localeInputMiddleware,
	protectedMiddleware,
} from "../middleware";
import { ModuleFormSchema } from "@/types/module";
import { shouldIgnoreFile, validateModule } from "@/lib/module";
import { s3 } from "@/server/s3";

export const moduleHandler = new Hono<{ Variables: HonoVariables }>()
	.get("/:id/modules", localeInputMiddleware, async (c) => {
		const { id } = c.req.param();
		const locale = c.get("locale");

		const moduleList = await db.query.modules.findMany({
			where: and(eq(modules.courseId, id), eq(modules.language, locale)),
			orderBy: desc(modules.versionNumber),
		});

		return c.json(moduleList);
	})
	.post(
		"/:id/modules",
		zValidator("form", ModuleFormSchema),
		localeInputMiddleware,
		protectedMiddleware(),
		async (c) => {
			const { id } = c.req.param();
			const teamId = c.get("teamId");
			const locale = c.get("locale");

			const course = await db.query.courses.findFirst({
				where: and(
					eq(courses.id, id),
					eq(courses.teamId, c.get("teamId")),
				),
			});

			if (!course) {
				throw new HTTPException(404, {
					message: "Course not found.",
				});
			}

			const moduleFile = c.req.valid("form").file;
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
					and(eq(modules.courseId, id), eq(modules.language, locale)),
				);

			const insertId = Bun.randomUUIDv7();
			const versionNumber =
				newestModule.length > 0 && newestModule[0].versionNumber
					? newestModule[0].versionNumber + 1
					: 1;
			await db.insert(modules).values({
				id: insertId,
				courseId: id,
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
						`/${teamId}/courses/${id}/${locale}${versionNumber > 1 ? `_${versionNumber}` : ""}/${key}`,
						blob,
					);
				}),
			);

			return c.json({ id: insertId });
		},
	)

	.delete("/:id/modules/:moduleId", protectedMiddleware(), async (c) => {
		const { id, moduleId } = c.req.param();
		const teamId = c.get("teamId");

		const moduleExists = await db.query.modules.findFirst({
			where: and(eq(modules.id, moduleId), eq(modules.courseId, id)),
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
			.where(and(eq(modules.id, moduleId), eq(modules.courseId, id)));

		return c.json(null);
	});
