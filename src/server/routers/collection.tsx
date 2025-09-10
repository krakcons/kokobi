import { CoursesFormSchema } from "@/components/forms/CoursesForm";
import { handleLocalization } from "@/lib/locale";
import { base, publicProcedure, organizationProcedure } from "../middleware";
import { db } from "@/server/db";
import {
	collectionTranslations,
	collections,
	collectionsToCourses,
	usersToCollections,
} from "@/server/db/schema";
import { CollectionFormSchema, CollectionSchema } from "@/types/collections";
import { CourseSchema } from "@/types/course";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { ORPCError } from "@orpc/client";
import { getConnectionLink } from "../lib/connection";
import { createConnection } from "./connection";

export const collectionRouter = base.prefix("/collections").router({
	get: organizationProcedure
		.route({
			tags: ["Collection"],
			method: "GET",
			path: "/",
			summary: "Get Collections",
		})
		.output(CollectionSchema.array())
		.handler(async ({ context }) => {
			const collectionList = await db.query.collections.findMany({
				where: eq(
					collections.organizationId,
					context.activeOrganizationId,
				),
				with: {
					translations: true,
				},
			});

			return collectionList.map((collection) =>
				handleLocalization(context, collection),
			);
		}),
	id: publicProcedure
		.route({
			tags: ["Collection"],
			method: "GET",
			path: "/{id}",
			summary: "Get Collection",
		})
		.input(
			z.object({
				id: z.string(),
			}),
		)
		//.output(CollectionSchema.extend({ organization: OrganizationSchema }))
		.handler(async ({ context, input: { id } }) => {
			const collection = await db.query.collections.findFirst({
				where: and(eq(collections.id, id)),
				with: {
					translations: true,
					organization: {
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
				organization: handleLocalization(
					context,
					collection.organization,
				),
			};
		}),

	create: organizationProcedure
		.route({
			tags: ["Collection"],
			method: "POST",
			path: "/",
			summary: "Create Collection",
		})
		.input(CollectionFormSchema)
		.output(z.object({ collectionId: z.string() }))
		.handler(
			async ({ context: { locale, activeOrganizationId }, input }) => {
				const collectionId = Bun.randomUUIDv7();

				await db.insert(collections).values({
					id: collectionId,
					...input,
					organizationId: activeOrganizationId,
				});
				await db.insert(collectionTranslations).values({
					...input,
					collectionId,
					locale,
				});

				return { collectionId };
			},
		),
	update: organizationProcedure
		.route({
			tags: ["Collection"],
			method: "PUT",
			path: "/{id}",
			summary: "Update Collection",
		})
		.input(
			CollectionFormSchema.extend({
				id: z.string(),
			}),
		)
		.handler(
			async ({ context: { activeOrganizationId, locale }, input }) => {
				const id = input.id;

				const collection = await db.query.collections.findFirst({
					where: and(
						eq(collections.id, id),
						eq(collections.organizationId, activeOrganizationId),
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
			},
		),
	delete: organizationProcedure
		.route({
			tags: ["Collection"],
			method: "DELETE",
			path: "/{id}",
			summary: "Delete Collection",
		})
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ context, input: { id } }) => {
			await db
				.delete(collections)
				.where(
					and(
						eq(collections.id, id),
						eq(
							collections.organizationId,
							context.activeOrganizationId,
						),
					),
				);

			return null;
		}),
	learners: organizationProcedure
		.route({
			tags: ["Collection"],
			method: "GET",
			path: "/{id}/learners",
			summary: "Get Learners",
		})
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ context, input: { id } }) => {
			const connections = await db.query.usersToCollections.findMany({
				where: and(
					eq(
						usersToCollections.organizationId,
						context.activeOrganizationId,
					),
					id ? eq(usersToCollections.collectionId, id) : undefined,
				),
				with: {
					user: true,
				},
			});

			return connections;
		}),
	courses: {
		get: publicProcedure
			.route({
				tags: ["Collection Courses"],
				method: "GET",
				path: "/{id}/courses",
				summary: "Get Courses",
			})
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
		create: organizationProcedure
			.route({
				tags: ["Collection Courses"],
				method: "POST",
				path: "/{id}/courses",
				summary: "Create Courses",
			})
			.input(
				CoursesFormSchema.extend({
					id: z.string(),
				}),
			)
			.output(z.null())
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
		delete: organizationProcedure
			.route({
				tags: ["Collection Courses"],
				method: "DELETE",
				path: "/{id}/courses",
				summary: "Delete Course",
			})
			.input(
				z.object({
					id: z.string(),
					courseId: z.string(),
				}),
			)
			.handler(async ({ context, input: { id, courseId } }) => {
				const collection = await db.query.collections.findFirst({
					where: and(
						eq(collections.id, id),
						eq(
							collections.organizationId,
							context.activeOrganizationId,
						),
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
			}),
	},
	link: organizationProcedure
		.route({
			tags: ["Collection"],
			method: "GET",
			path: "/{id}/link",
			summary: "Get Share Link",
		})
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
				organizationId: context.activeOrganizationId,
				isPublic: true,
			});
		}),
	invite: organizationProcedure
		.route({
			tags: ["Collection"],
			method: "POST",
			path: "/{id}/invite",
			summary: "Invite Learners",
		})
		.input(
			z.object({
				id: z.string(),
				emails: z.email().toLowerCase().array().optional(),
			}),
		)
		.output(z.null())
		.handler(async ({ context, input: { id, emails } }) => {
			return await createConnection({
				...context,
				senderType: "collection",
				recipientType: "user",
				id,
				emails,
			});
		}),
});
