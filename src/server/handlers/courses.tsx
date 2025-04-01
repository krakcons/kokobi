import { db } from "@/server/db";
import { courseTranslations, courses } from "@/server/db/schema";
import { CourseFormSchema } from "@/types/course";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
	HonoVariables,
	localeInputMiddleware,
	protectedMiddleware,
} from "../middleware";
import { handleLocalization } from "@/lib/locale/helpers";

export const coursesHandler = new Hono<{ Variables: HonoVariables }>()
	.get("/", protectedMiddleware(), async (c) => {
		const teamId = c.get("teamId");

		const courseList = await db.query.courses.findMany({
			where: eq(courses.teamId, teamId),
			with: {
				translations: true,
			},
		});

		return c.json(
			courseList.map((course) => handleLocalization(c, course)),
		);
	})
	.get("/:id", localeInputMiddleware, async (c) => {
		const { id } = c.req.param();

		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, id)),
			with: {
				translations: true,
			},
		});

		if (!course) {
			throw new HTTPException(404, {
				message: "Course not found",
			});
		}

		return c.json(handleLocalization(c, course));
	})
	.post(
		"/",
		localeInputMiddleware,
		protectedMiddleware(),
		zValidator("json", CourseFormSchema),
		async (c) => {
			const teamId = c.get("teamId");
			const input = c.req.valid("json");
			const language = c.get("locale");

			const courseId = Bun.randomUUIDv7();

			await db.insert(courses).values({
				id: courseId,
				teamId,
				completionStatus: input.completionStatus,
			});

			await db.insert(courseTranslations).values({
				courseId,
				name: input.name,
				description: input.description,
				language,
			});

			return c.json({ id: courseId });
		},
	)
	.put(
		"/:id",
		localeInputMiddleware,
		protectedMiddleware(),
		zValidator("json", CourseFormSchema),
		async (c) => {
			const { id } = c.req.param();
			const teamId = c.get("teamId");
			const input = c.req.valid("json");
			const language = c.get("locale");

			const course = await db.query.courses.findFirst({
				where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
			});

			if (!course) {
				throw new HTTPException(404, {
					message: "Course not found.",
				});
			}

			await db
				.update(courses)
				.set({
					completionStatus: input.completionStatus,
				})
				.where(eq(courses.id, id));

			await db
				.insert(courseTranslations)
				.values({
					courseId: id,
					name: input.name,
					description: input.description,
					language,
				})
				.onConflictDoUpdate({
					set: {
						...input,
						updatedAt: new Date(),
					},
					target: [
						courseTranslations.courseId,
						courseTranslations.language,
					],
				});

			return c.json(input);
		},
	)
	.delete("/:id", protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		await db
			.delete(courses)
			.where(and(eq(courses.id, id), eq(courses.teamId, teamId)));

		// TODO: DELETE full course (waiting on bun s3 list function)

		return c.json(null);
	});
