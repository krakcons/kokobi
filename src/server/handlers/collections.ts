import { db } from "@/server/db";
import {
	collectionTranslations,
	collections,
	collectionsToCourses,
} from "@/server/db/schema";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { localeInputMiddleware, protectedMiddleware } from "../middleware";
import { CollectionFormSchema } from "@/types/collections";
import { handleLocalization } from "@/lib/locale/helpers";

export const collectionsHandler = new Hono()
	.get("/", protectedMiddleware(), async (c) => {
		const teamId = c.get("teamId");

		const collectionList = await db.query.collections.findMany({
			where: eq(collections.teamId, teamId),
			with: {
				translations: true,
			},
		});

		return c.json(
			collectionList.map((collection) =>
				handleLocalization(c, collection),
			),
		);
	})
	.post(
		"/",
		protectedMiddleware(),
		zValidator("json", CollectionFormSchema),
		async (c) => {
			const teamId = c.get("teamId");
			const input = c.req.valid("json");
			const locale = c.get("locale");

			const collectionId = Bun.randomUUIDv7();

			await db.insert(collections).values({
				id: collectionId,
				...input,
				teamId,
			});
			await db.insert(collectionTranslations).values({
				...input,
				language: locale,
				collectionId,
			});

			return c.json({
				id: collectionId,
			});
		},
	)
	.put(
		"/:id",
		protectedMiddleware(),
		zValidator("json", CollectionFormSchema),
		async (c) => {
			const { id } = c.req.param();
			const teamId = c.get("teamId");
			const input = c.req.valid("json");
			const locale = c.get("locale");

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
					language: locale,
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
	.get("/:id", protectedMiddleware(), localeInputMiddleware, async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		const collection = await db.query.collections.findFirst({
			where: and(eq(collections.id, id), eq(collections.teamId, teamId)),
			with: {
				translations: true,
			},
		});

		if (!collection) {
			throw new HTTPException(404, {
				message: "Collection not found",
			});
		}

		return c.json(handleLocalization(c, collection));
	})
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
	//.post(
	//	"/:id/learners",
	//	zValidator("json", CreateLearnerSchema.array().or(CreateLearnerSchema)),
	//	async (c) => {
	//		const { id } = c.req.param();
	//		let input = c.req.valid("json");
	//
	//		if (!Array.isArray(input)) {
	//			input = [input];
	//		}
	//
	//		const collection = await db.query.collections.findFirst({
	//			where: and(eq(collections.id, id)),
	//			with: {
	//				translations: true,
	//				collectionsToCourses: {
	//					with: {
	//						course: {
	//							with: {
	//								translations: true,
	//							},
	//						},
	//					},
	//				},
	//			},
	//		});
	//
	//		if (!collection) {
	//			throw new HTTPException(404, {
	//				message: "Collection not found.",
	//			});
	//		}
	//
	//		return c.json({ message: "Not implemented" });
	//	},
	//)
	.delete("/:id", protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		await db
			.delete(collections)
			.where(and(eq(collections.id, id), eq(collections.teamId, teamId)));

		return c.json(null);
	});
