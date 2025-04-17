import { db } from "@/server/db";
import {
	collectionTranslations,
	collections,
	collectionsToCourses,
	usersToCollections,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { localeMiddleware, teamMiddleware } from "../middleware";
import { CollectionFormSchema } from "@/types/collections";
import { handleLocalization } from "@/lib/locale/helpers";
import { CoursesFormSchema } from "@/components/forms/CoursesForm";
import { createServerFn } from "@tanstack/react-start";

export const getCollectionsFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware(), localeMiddleware])
	.handler(async ({ context }) => {
		const teamId = context.teamId;

		const collectionList = await db.query.collections.findMany({
			where: eq(collections.teamId, teamId),
			with: {
				translations: true,
			},
		});

		return collectionList.map((collection) =>
			handleLocalization(context, collection),
		);
	});

export const createCollectionFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(CollectionFormSchema)
	.handler(async ({ context: { locale, teamId }, data }) => {
		const collectionId = Bun.randomUUIDv7();

		await db.insert(collections).values({
			id: collectionId,
			...data,
			teamId,
		});
		await db.insert(collectionTranslations).values({
			...data,
			collectionId,
			locale,
		});

		return { id: collectionId };
	});

export const updateCollectionFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(CollectionFormSchema.extend({ id: z.string() }))
	.handler(async ({ context: { teamId, locale }, data }) => {
		const id = data.id;

		const collection = await db.query.collections.findFirst({
			where: and(eq(collections.id, id), eq(collections.teamId, teamId)),
		});

		if (!collection) {
			throw new Error("Collection not found");
		}

		await db
			.update(collections)
			.set({
				...data,
			})
			.where(eq(collections.id, id));

		await db
			.insert(collectionTranslations)
			.values({
				...data,
				collectionId: id,
				locale,
			})
			.onConflictDoUpdate({
				set: {
					...data,
					updatedAt: new Date(),
				},
				target: [
					collectionTranslations.collectionId,
					collectionTranslations.locale,
				],
			});

		return data;
	});

export const getCollectionFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(z.object({ id: z.string() }))
	.handler(async ({ context, data: { id } }) => {
		const collection = await db.query.collections.findFirst({
			where: and(eq(collections.id, id)),
			with: {
				translations: true,
				team: {
					with: {
						translations: true,
					},
				},
			},
		});

		if (!collection) {
			throw new Error("Collection not found");
		}

		return {
			...handleLocalization(context, collection),
			team: handleLocalization(context, collection.team),
		};
	});

export const getCollectionLearnersFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(z.object({ id: z.string() }))
	.handler(async ({ context, data: { id } }) => {
		const { teamId } = context;

		const collection = await db.query.collections.findFirst({
			where: and(eq(collections.id, id), eq(collections.teamId, teamId)),
			with: {
				translations: true,
			},
		});

		if (!collection) {
			throw new Error("Course not found.");
		}

		const learnerList = await db.query.usersToCollections.findMany({
			where: eq(usersToCollections.collectionId, id),
			with: {
				user: true,
			},
		});

		// TODO: Break down progress in multiple courses

		return learnerList;
	});

export const getCollectionCoursesFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(z.object({ id: z.string() }))
	.handler(async ({ context, data: { id } }) => {
		const { teamId } = context;
		const collection = await db.query.collections.findFirst({
			where: and(eq(collections.id, id), eq(collections.teamId, teamId)),
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

export const deleteCollectionFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(z.object({ id: z.string() }))
	.handler(async ({ context, data: { id } }) => {
		const { teamId } = context;

		await db
			.delete(collections)
			.where(and(eq(collections.id, id), eq(collections.teamId, teamId)));

		return null;
	});
