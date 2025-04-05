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
import { LearnersFormSchema } from "@/types/learner";
import { env } from "../env";
import { createTranslator } from "@/lib/locale/actions";
import { sendEmail } from "../email";
import CollectionInvite from "@/emails/CollectionInvite";
import { CoursesFormSchema } from "@/components/forms/CoursesForm";
import { createServerFn } from "@tanstack/react-start";
import { createJoinLink } from "@/lib/invite";

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
			},
		});
		if (!collection) {
			throw new Error("Collection not found");
		}
		return handleLocalization(context, collection);
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
	.handler(async ({ context, data }) => {
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

export const inviteLearnerToCollectionFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(LearnersFormSchema.extend({ id: z.string() }))
	.handler(async ({ context, data }) => {
		const teamId = context.teamId;

		const collection = await db.query.collections.findFirst({
			where: and(
				eq(collections.id, data.id),
				eq(collections.teamId, teamId),
			),
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
				team: {
					with: {
						translations: true,
						domains: true,
					},
				},
			},
		});

		if (!collection) {
			throw new Error("Collection not found.");
		}

		if (collection.collectionsToCourses.length === 0) {
			throw new Error(
				"No courses found. Inviting to a collection with no courses is not allowed.",
			);
		}

		const learnersList = data.learners.map((l) => {
			return collection.collectionsToCourses.map(({ course }) => {
				return {
					...l,
					id: Bun.randomUUIDv7(),
					courseId: course.id,
					collectionId: data.id,
					teamId,
					course,
				};
			});
		});

		const finalLearnersList = await db
			.insert(learners)
			.values(learnersList.flat())
			.onConflictDoUpdate({
				target: [learners.email, learners.courseId],
				set: {
					updatedAt: new Date(),
				},
			})
			.returning();

		// Email Invites
		learnersList.forEach(async (learner) => {
			if (learner.some((l) => !l.sendEmail)) return;
			const locale = learner[0].inviteLanguage ?? "en";
			const email = learner[0].email;

			const collectionName = handleLocalization(
				context,
				collection,
				locale,
			).name;
			const team = handleLocalization(context, collection.team, locale);

			const courses = learner.map((l) => {
				const { name } = handleLocalization(
					context,
					l.course,
					l.inviteLanguage,
				);

				// Use the final learner to get the id since there could be a conflict
				const finalLearner = finalLearnersList.find(
					(fl) => fl.email === l.email && fl.courseId === l.course.id,
				);
				if (!finalLearner) {
					throw new Error("Learner not found");
				}
				const id = finalLearner.id;

				const href = createJoinLink({
					domain:
						team.domains.length > 0 ? team.domains[0] : undefined,
					courseId: l.course.id,
					teamId: team.id,
					learnerId: id,
				});

				return {
					href,
					name,
				};
			});

			const t = await createTranslator({ locale });

			sendEmail({
				to: [email],
				subject: t.Email.CollectionInvite.subject,
				content: (
					<CollectionInvite
						name={collectionName}
						courses={courses}
						teamName={team.name}
						logo={`${env.VITE_SITE_URL}/cdn/${collection.team.id}/${team.locale}/logo?updatedAt=${team?.updatedAt.toString()}`}
						t={t.Email.CollectionInvite}
					/>
				),
				team,
			});
		});

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
