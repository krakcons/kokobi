import { db } from "@/server/db";
import { collections, collectionsToCourses } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { localeMiddleware, teamMiddleware } from "../lib/middleware";
import { handleLocalization } from "@/lib/locale";
import { CoursesFormSchema } from "@/components/forms/CoursesForm";
import { createServerFn } from "@tanstack/react-start";

export const getCollectionCoursesFn = createServerFn({ method: "GET" })
	.middleware([localeMiddleware])
	.validator(z.object({ collectionId: z.string() }))
	.handler(async ({ context, data: { collectionId } }) => {
		const collection = await db.query.collections.findFirst({
			where: eq(collections.id, collectionId),
			with: {
				translations: true,
				collectionsToCourses: {
					with: {
						course: {
							with: {
								translations: true,
							},
						},
					},
				},
			},
		});
		if (!collection) {
			throw new Error("Collection not found.");
		}
		const courses = collection.collectionsToCourses.map(({ course }) =>
			handleLocalization(context, course),
		);
		return courses;
	});

export const createCollectionCourseFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(CoursesFormSchema.extend({ id: z.string() }))
	.handler(async ({ data }) => {
		await db
			.insert(collectionsToCourses)
			.values(
				data.courseIds.map((courseId) => ({
					collectionId: data.id,
					courseId,
				})),
			)
			.onConflictDoNothing();

		return null;
	});

export const deleteCollectionCourseFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(z.object({ id: z.string(), courseId: z.string() }))
	.handler(async ({ context: { teamId }, data: { id, courseId } }) => {
		const collection = await db.query.collections.findFirst({
			where: and(eq(collections.id, id), eq(collections.teamId, teamId)),
		});

		if (!collection) {
			throw new Error("Collection not found.");
		}

		await db
			.delete(collectionsToCourses)
			.where(
				and(
					eq(collectionsToCourses.collectionId, id),
					eq(collectionsToCourses.courseId, courseId),
				),
			);

		return null;
	});
