import { db } from "@/server/db/db";
import { learnersData } from "@/server/db/learners";
import {
	collectionTranslations,
	collections,
	collectionsToCourses,
} from "@/server/db/schema";
import { CreateCollectionTranslationSchema } from "@/types/collections";
import { CreateLearnerSchema } from "@/types/learner";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { protectedMiddleware } from "../middleware";

export const collectionsHandler = new Hono()
	.get("/", protectedMiddleware(), async (c) => {
		const teamId = c.get("teamId");

		const collectionList = await db.query.collections.findMany({
			where: eq(collections.teamId, teamId),
			with: {
				translations: true,
			},
		});

		return c.json(collectionList);
	})
	.post(
		"/",
		protectedMiddleware(),
		zValidator("json", CreateCollectionTranslationSchema),
		async (c) => {
			const teamId = c.get("teamId");
			const input = c.req.valid("json");

			const collection = await db
				.insert(collections)
				.values({
					...input,
					teamId,
				})
				.returning();

			await db.insert(collectionTranslations).values({
				...input,
				collectionId: collection[0].id,
			});

			return c.json(null);
		},
	)
	.put(
		"/:id",
		protectedMiddleware(),
		zValidator("json", CreateCollectionTranslationSchema),
		async (c) => {
			const { id } = c.req.param();
			const teamId = c.get("teamId");
			const input = c.req.valid("json");

			const collection = await db.query.collections.findFirst({
				where: and(
					eq(collections.id, id),
					eq(collections.teamId, teamId),
				),
			});

			if (!collection) {
				throw new HTTPException(404, {
					message: "Collection not found.",
				});
			}

			await db
				.insert(collectionTranslations)
				.values({
					...input,
					collectionId: id,
				})
				.onConflictDoUpdate({
					set: {
						...input,
						updatedAt: new Date(),
					},
					target: [
						collectionTranslations.collectionId,
						collectionTranslations.language,
					],
				});

			return c.json(null);
		},
	)
	.post(
		"/:id/courses",
		protectedMiddleware(),
		zValidator(
			"json",
			z.object({
				id: z.string(),
			}),
		),
		async (c) => {
			const { id } = c.req.param();
			const input = c.req.valid("json");

			await db.insert(collectionsToCourses).values({
				collectionId: id,
				courseId: input.id,
			});

			return c.json(null);
		},
	)
	.delete("/:id/courses/:courseId", protectedMiddleware(), async (c) => {
		const { id, courseId } = c.req.param();

		await db
			.delete(collectionsToCourses)
			.where(
				and(
					eq(collectionsToCourses.collectionId, id),
					eq(collectionsToCourses.courseId, courseId),
				),
			);

		return c.json(null);
	})
	.post(
		"/:id/learners",
		zValidator(
			"json",
			CreateLearnerSchema.omit({
				moduleId: true,
				courseId: true,
			})
				.array()
				.or(
					CreateLearnerSchema.omit({
						moduleId: true,
						courseId: true,
					}),
				),
		),
		async (c) => {
			const { id } = c.req.param();
			let input = c.req.valid("json");

			if (!Array.isArray(input)) {
				input = [input];
			}

			const collection = await db.query.collections.findFirst({
				where: and(eq(collections.id, id)),
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
				throw new HTTPException(404, {
					message: "Collection not found.",
				});
			}

			const learners = await learnersData.create(
				input,
				collection.collectionsToCourses.map((c) => c.course),
				collection,
			);

			return c.json(learners);
		},
	)
	.delete("/:id", protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		await db
			.delete(collections)
			.where(and(eq(collections.id, id), eq(collections.teamId, teamId)));
		await db
			.delete(collectionsToCourses)
			.where(eq(collectionsToCourses.collectionId, id));

		return c.json(null);
	});
