import { db } from "@/server/db";
import {
	collectionTranslations,
	collections,
	collectionsToCourses,
	learners,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { localeMiddleware, teamMiddleware } from "../middleware";
import { CollectionFormSchema } from "@/types/collections";
import { handleLocalization } from "@/lib/locale/helpers";
import { ExtendLearner, LearnersFormSchema } from "@/types/learner";
import { env } from "../env";
import { createTranslator } from "@/lib/locale/actions";
import { sendEmail } from "../email";
import CollectionInvite from "@/emails/CollectionInvite";
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
	.handler(async ({ context, data }) => {
		const teamId = context.teamId;
		const language = context.locale;

		const collectionId = Bun.randomUUIDv7();

		await db.insert(collections).values({
			id: collectionId,
			...data,
			teamId,
		});
		await db.insert(collectionTranslations).values({
			...data,
			collectionId,
			language,
		});

		return { id: collectionId };
	});

export const updateCollectionFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(CollectionFormSchema.extend({ id: z.string() }))
	.handler(async ({ context, data }) => {
		const id = data.id;
		const teamId = context.teamId;
		const language = context.locale;

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
				language,
			})
			.onConflictDoUpdate({
				set: {
					...data,
					updatedAt: new Date(),
				},
				target: [
					collectionTranslations.collectionId,
					collectionTranslations.language,
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

		const learnerList = await db.query.learners.findMany({
			where: eq(learners.collectionId, id),
			with: {
				module: true,
				course: {
					with: {
						team: true,
					},
				},
			},
		});

		const extendedLearnerList = learnerList.map((learner) => {
			return {
				...ExtendLearner(learner.module?.type).parse(learner),
				module: learner.module,
				joinLink:
					context.role === "owner"
						? learner.course.team?.customDomain &&
							env.VITE_SITE_URL !== "http://localhost:3000"
							? `https://${learner.course.team.customDomain}/courses/${learner.course.id}/join?learnerId=${learner.id}`
							: `${env.VITE_SITE_URL}/play/${learner.course.team?.id}/courses/${learner.course.id}/join?learnerId=${learner.id}`
						: undefined,
			};
		});

		return extendedLearnerList;
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
	.handler(async ({ context, data: { id, courseId } }) => {
		const learnerList = await db.query.learners.findMany({
			where: and(
				eq(learners.collectionId, id),
				eq(learners.courseId, courseId),
			),
		});

		if (learnerList.length > 0) {
			throw new Error(
				"Cannot delete course while learners exist. Delete learners first.",
			);
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

				const href =
					team?.customDomain &&
					env.VITE_SITE_URL !== "http://localhost:3000"
						? `https://${team.customDomain}${l.inviteLanguage ? `/${l.inviteLanguage}` : ""}/courses/${l.course.id}/join?learnerId=${id}`
						: `${env.VITE_SITE_URL}${l.inviteLanguage ? `/${l.inviteLanguage}` : ""}/play/${team?.id}/courses/${l.course.id}/join?learnerId=${id}`;

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
						curses={courses}
						teamName={team.name}
						logo={`${env.VITE_SITE_URL}/cdn/${collection.team.id}/${team.language}/logo?updatedAt=${team?.updatedAt.toString()}`}
						t={t.Email.CollectionInvite}
					/>
				),
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
