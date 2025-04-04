import { db } from "@/server/db";
import { courseTranslations, courses } from "@/server/db/schema";
import { CourseFormSchema } from "@/types/course";
import { and, eq } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale/helpers";
import { createServerFn } from "@tanstack/react-start";
import { localeMiddleware, teamMiddleware } from "../middleware";
import { z } from "zod";

export const getCoursesFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware(), localeMiddleware])
	.handler(async ({ context }) => {
		const teamId = context.teamId;

		const courseList = await db.query.courses.findMany({
			where: eq(courses.teamId, teamId),
			with: {
				translations: true,
			},
		});

		return courseList.map((course) => handleLocalization(context, course));
	});

export const getCourseFn = createServerFn({ method: "GET" })
	.middleware([localeMiddleware])
	.validator(z.object({ courseId: z.string() }))
	.handler(async ({ context, data: { courseId } }) => {
		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, courseId)),
			with: {
				translations: true,
			},
		});

		if (!course) {
			throw new Error("Course not found");
		}

		return handleLocalization(context, course);
	});

export const createCourseFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(CourseFormSchema)
	.handler(async ({ context, data }) => {
		const teamId = context.teamId;
		const language = context.locale;

		const courseId = Bun.randomUUIDv7();

		await db.insert(courses).values({
			id: courseId,
			teamId,
			completionStatus: data.completionStatus,
		});

		await db.insert(courseTranslations).values({
			courseId,
			name: data.name,
			description: data.description,
			language,
		});

		return { id: courseId };
	});

export const updateCourseFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(CourseFormSchema.extend({ id: z.string() }))
	.handler(async ({ context, data }) => {
		const id = data.id;
		const teamId = context.teamId;
		const language = context.locale;

		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
		});

		if (!course) {
			throw new Error("Course not found");
		}

		await db
			.update(courses)
			.set({
				completionStatus: data.completionStatus,
			})
			.where(eq(courses.id, id));

		await db
			.insert(courseTranslations)
			.values({
				courseId: id,
				name: data.name,
				description: data.description,
				language,
			})
			.onConflictDoUpdate({
				set: {
					...data,
					updatedAt: new Date(),
				},
				target: [
					courseTranslations.courseId,
					courseTranslations.language,
				],
			});

		return data;
	});

export const deleteCourseFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(z.object({ id: z.string() }))
	.handler(async ({ context, data: { id } }) => {
		const teamId = context.teamId;

		await db
			.delete(courses)
			.where(and(eq(courses.id, id), eq(courses.teamId, teamId)));

		// TODO: DELETE full course (waiting on bun s3 list function)

		return null;
	});
