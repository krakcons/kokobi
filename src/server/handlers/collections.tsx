import { db } from "@/server/db";
import {
	collectionTranslations,
	collections,
	collectionsToCourses,
	learners,
} from "@/server/db/schema";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { localeInputMiddleware, protectedMiddleware } from "../middleware";
import { CollectionFormSchema } from "@/types/collections";
import { handleLocalization } from "@/lib/locale/helpers";
import { ExtendLearner, LearnersFormSchema } from "@/types/learner";
import { env } from "../env";
import { createTranslator } from "@/lib/locale/actions";
import { sendEmail } from "../email";
import CollectionInvite from "@/emails/CollectionInvite";
import { CoursesFormSchema } from "@/components/forms/CoursesForm";

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
	.get(
		"/:id/learners",
		protectedMiddleware(),
		localeInputMiddleware,
		async (c) => {
			const { id } = c.req.param();
			const teamId = c.get("teamId");
			const teamRole = c.get("teamRole");

			const collection = await db.query.collections.findFirst({
				where: and(
					eq(collections.id, id),
					eq(collections.teamId, teamId),
				),
				with: {
					translations: true,
				},
			});

			if (!collection) {
				throw new HTTPException(404, {
					message: "Course not found.",
				});
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
						teamRole === "owner"
							? learner.course.team?.customDomain &&
								env.VITE_SITE_URL !== "http://localhost:3000"
								? `https://${learner.course.team.customDomain}/courses/${learner.course.id}/join?learnerId=${learner.id}`
								: `${env.VITE_SITE_URL}/play/${learner.course.team?.id}/courses/${learner.course.id}/join?learnerId=${learner.id}`
							: undefined,
				};
			});

			return c.json(extendedLearnerList);
		},
	)
	.get("/:id/courses", protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

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
			throw new HTTPException(404, {
				message: "Collection not found.",
			});
		}

		const courses = collection.collectionsToCourses.map(({ course }) =>
			handleLocalization(c, course),
		);

		return c.json(courses);
	})
	.post(
		"/:id/courses",
		protectedMiddleware(),
		zValidator("json", CoursesFormSchema),
		async (c) => {
			const { id } = c.req.param();
			const input = c.req.valid("json");

			await db
				.insert(collectionsToCourses)
				.values(
					input.ids.map((courseId) => ({
						collectionId: id,
						courseId,
					})),
				)
				.onConflictDoNothing();

			return c.json(null);
		},
	)
	.delete("/:id/courses/:courseId", protectedMiddleware(), async (c) => {
		const { id, courseId } = c.req.param();

		const learnerList = await db.query.learners.findMany({
			where: and(
				eq(learners.collectionId, id),
				eq(learners.courseId, courseId),
			),
		});

		if (learnerList.length > 0) {
			throw new HTTPException(400, {
				message:
					"Cannot delete course while learners exist. Delete learners first.",
			});
		}

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
		"/:id/invite",
		zValidator("json", LearnersFormSchema.shape.learners),
		protectedMiddleware(),
		async (c) => {
			const { id } = c.req.param();
			let input = c.req.valid("json");
			const teamId = c.get("teamId");

			const collection = await db.query.collections.findFirst({
				where: and(
					eq(collections.id, id),
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
				throw new HTTPException(404, {
					message: "Collection not found.",
				});
			}

			if (collection.collectionsToCourses.length === 0) {
				throw new HTTPException(400, {
					message:
						"No courses found. Inviting to a collection with no courses is not allowed.",
				});
			}

			const learnersList = input.map((l) => {
				return collection.collectionsToCourses.map(({ course }) => {
					return {
						...l,
						id: Bun.randomUUIDv7(),
						courseId: course.id,
						collectionId: id,
						teamId,
						course,
					};
				});
			});

			const finalLearnersList = await db
				.insert(learners)
				.values(learnersList.flat())
				.onConflictDoNothing()
				.returning();

			// Email Invites
			learnersList.forEach(async (learner) => {
				if (learner.some((l) => !l.sendEmail)) return;
				const locale = learner[0].inviteLanguage ?? "en";
				const email = learner[0].email;

				const collectionName = handleLocalization(
					c,
					collection,
					locale,
				).name;
				const team = handleLocalization(c, collection.team, locale);

				const courses = learner.map((l) => {
					const { name } = handleLocalization(
						c,
						l.course,
						l.inviteLanguage,
					);

					// Use the final learner to get the id since there could be a conflict
					const finalLearner = finalLearnersList.find(
						(fl) =>
							fl.email === l.email && fl.courseId === l.course.id,
					);
					if (!finalLearner) {
						throw new HTTPException(500, {
							message: "Server error sending email.",
						});
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
							courses={courses}
							teamName={team.name}
							logo={`${env.VITE_SITE_URL}/cdn/${collection.team.id}/${team.language}/logo?updatedAt=${team?.updatedAt.toString()}`}
							t={t.Email.CollectionInvite}
						/>
					),
				});
			});

			return c.json(null);
		},
	)
	.delete("/:id", protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		await db
			.delete(collections)
			.where(and(eq(collections.id, id), eq(collections.teamId, teamId)));

		return c.json(null);
	});
