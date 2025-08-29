import { CollectionSchema } from "@/types/collections";
import { teamProcedure } from "../middleware";
import { db } from "@/server/db";
import {
	collectionTranslations,
	collections,
	collectionsToCourses,
	usersToCollections,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { CollectionFormSchema } from "@/types/collections";
import { handleLocalization } from "@/lib/locale";
import { TeamSchema } from "@/types/team";
import { CoursesFormSchema } from "@/components/forms/CoursesForm";
import { CourseSchema } from "@/types/course";
import { ORPCError } from "@orpc/client";
import { getConnectionLink } from "../lib/connection";

export const collectionRouter = {
	get: teamProcedure()
		.route({ method: "GET", path: "/collections" })
		.output(CollectionSchema.array())
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
		}),
	id: teamProcedure()
		.route({ method: "GET", path: "/collections/{id}" })
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.output(CollectionSchema.extend({ team: TeamSchema }))
		.handler(async ({ context, input: { id } }) => {
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
				throw new ORPCError("NOT_FOUND");
			}

			return {
				...handleLocalization(context, collection),
				team: handleLocalization(context, collection.team),
			};
		}),

	create: teamProcedure()
		.route({ method: "POST", path: "/collections" })
		.input(CollectionFormSchema)
		.output(z.object({ collectionId: z.string() }))
		.handler(async ({ context: { locale, teamId }, input }) => {
			const collectionId = Bun.randomUUIDv7();

			await db.insert(collections).values({
				id: collectionId,
				...input,
				teamId,
			});
			await db.insert(collectionTranslations).values({
				...input,
				collectionId,
				locale,
			});

			return { collectionId };
		}),
	update: teamProcedure()
		.route({ method: "PUT", path: "/collections/{id}" })
		.input(
			CollectionFormSchema.extend({
				id: z.string(),
			}),
		)
		.handler(async ({ context: { teamId, locale }, input }) => {
			const id = input.id;

			const collection = await db.query.collections.findFirst({
				where: and(
					eq(collections.id, id),
					eq(collections.teamId, teamId),
				),
			});

			if (!collection) {
				throw new ORPCError("NOT_FOUND");
			}

			await db
				.update(collections)
				.set({
					...input,
				})
				.where(eq(collections.id, id));

			await db
				.insert(collectionTranslations)
				.values({
					...input,
					collectionId: id,
					locale,
				})
				.onConflictDoUpdate({
					set: {
						...input,
						updatedAt: new Date(),
					},
					target: [
						collectionTranslations.collectionId,
						collectionTranslations.locale,
					],
				});

			return input;
		}),
	delete: teamProcedure()
		.route({ method: "DELETE", path: "/collections/{id}" })
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ context, input: { id } }) => {
			const { teamId } = context;

			await db
				.delete(collections)
				.where(
					and(eq(collections.id, id), eq(collections.teamId, teamId)),
				);

			return null;
		}),
	learners: teamProcedure()
		.route({ method: "GET", path: "/collections/{id}/learners" })
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ context, input: { id } }) => {
			const connections = await db.query.usersToCollections.findMany({
				where: and(
					eq(usersToCollections.teamId, context.teamId),
					id ? eq(usersToCollections.collectionId, id) : undefined,
				),
				with: {
					user: true,
				},
			});

			return connections;
		}),
	courses: {
		get: teamProcedure()
			.route({ method: "GET", path: "/collections/{id}/courses" })
			.input(
				z.object({
					id: z.string(),
				}),
			)
			.output(CourseSchema.array())
			.handler(async ({ context, input: { id } }) => {
				const collection = await db.query.collections.findFirst({
					where: eq(collections.id, id),
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
					throw new ORPCError("NOT_FOUND");
				}

				const courses = collection.collectionsToCourses.map(
					({ course }) => handleLocalization(context, course),
				);

				return courses;
			}),
		create: teamProcedure()
			.route({ method: "POST", path: "/collections/{id}/courses" })
			.input(
				CoursesFormSchema.extend({
					id: z.string(),
				}),
			)
			.handler(async ({ input: { id, courseIds } }) => {
				await db
					.insert(collectionsToCourses)
					.values(
						courseIds.map((courseId) => ({
							collectionId: id,
							courseId,
						})),
					)
					.onConflictDoNothing();

				return null;
			}),
		delete: teamProcedure()
			.route({ method: "POST", path: "/collections/{id}/courses" })
			.input(
				z.object({
					id: z.string(),
					courseId: z.string(),
				}),
			)
			.handler(
				async ({ context: { teamId }, input: { id, courseId } }) => {
					const collection = await db.query.collections.findFirst({
						where: and(
							eq(collections.id, id),
							eq(collections.teamId, teamId),
						),
					});

					if (!collection) {
						throw new ORPCError("NOT_FOUND");
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
				},
			),
	},
	connection: {
		link: teamProcedure()
			.route({ method: "GET", path: "/collections/{id}/link" })
			.input(
				z.object({
					id: z.string(),
				}),
			)
			.output(z.string())
			.handler(async ({ context, input: { id } }) => {
				return await getConnectionLink({
					type: "collection",
					id,
					teamId: context.teamId,
					locale: context.locale,
				});
			}),
	},
};
