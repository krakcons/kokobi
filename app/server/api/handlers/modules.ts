import { getInitialScormData } from "@/lib/scorm";
import { coursesData } from "@/server/db/courses";
import { db } from "@/server/db/db";
import { learnersData } from "@/server/db/learners";
import { modulesData } from "@/server/db/modules";
import { learners, modules } from "@/server/db/schema";
import { generateId } from "@/server/helpers";
import { deleteFolder } from "@/server/r2";
import { svix } from "@/server/svix";
import { CreateLearnerSchema, ExtendLearner } from "@/types/learner";
import { UploadModuleSchema } from "@/types/module";
import { zValidator } from "@hono/zod-validator";
import { and, eq, max } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { authedMiddleware } from "../middleware";

export const modulesHandler = new Hono()
	.get("/:id/learners", authedMiddleware, async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		const courseModule = await db.query.modules.findFirst({
			where: and(eq(modules.id, id)),
			with: {
				course: true,
				learners: true,
			},
		});

		if (!courseModule) {
			throw new HTTPException(404, {
				message: "Module not found",
			});
		}

		if (courseModule.course.teamId !== teamId) {
			throw new HTTPException(401, {
				message: "Unauthorized",
			});
		}

		const learners = courseModule.learners.map((learner) =>
			ExtendLearner(courseModule.type).parse(learner)
		);

		return c.json(learners);
	})
	.post(
		"/:id/learners",
		zValidator(
			"json",
			CreateLearnerSchema.omit({
				moduleId: true,
				courseId: true,
			})
		),
		async (c) => {
			const { id } = c.req.param();
			const learner = c.req.valid("json");

			const courseModule = await db.query.modules.findFirst({
				where: and(eq(modules.id, id)),
				with: {
					course: {
						with: {
							translations: true,
						},
					},
				},
			});

			if (!courseModule) {
				throw new HTTPException(401, {
					message: "Module not found",
				});
			}

			const existingLearner = await db.query.learners.findFirst({
				where: and(
					eq(learners.email, learner.email),
					eq(learners.courseId, courseModule.courseId)
				),
			});

			if (existingLearner && existingLearner.moduleId) {
				return c.json(
					ExtendLearner(courseModule.type).parse(existingLearner)
				);
			}

			// Create a new learner
			const newLearner = {
				...learner,
				id: learner.id ?? generateId(32),
				moduleId: courseModule.id,
				courseId: courseModule.courseId,
				data: getInitialScormData(courseModule.type),
				startedAt: new Date(),
				completedAt: null,
			};

			const createdLearner = await db
				.insert(learners)
				.values(newLearner)
				.onConflictDoUpdate({
					target: [learners.email, learners.courseId],
					set: {
						moduleId: newLearner.moduleId,
						data: newLearner.data,
						startedAt: newLearner.startedAt,
					},
				})
				.returning();

			if (learner.sendEmail !== false && learner.email) {
				await learnersData.courseInvite({
					email: newLearner.email,
					learnerId: newLearner.id,
					course: courseModule.course,
					inviteLanguage: newLearner.inviteLanguage,
				});
			}

			const startedLearner = ExtendLearner(courseModule.type).parse(
				createdLearner[0]
			);

			try {
				await svix.message.create(`app_${startedLearner.courseId}`, {
					eventType: "learner.started",
					payload: startedLearner,
				});
			} catch (e) {
				console.error(e);
			}

			return c.json(
				ExtendLearner(courseModule.type).parse(createdLearner[0])
			);
		}
	)
	.delete("/:id", authedMiddleware, async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		const courseModule = await modulesData.get({ id });

		await coursesData.get({ id: courseModule.courseId }, teamId);

		await db.delete(modules).where(and(eq(modules.id, courseModule.id)));

		await db.delete(learners).where(eq(learners.moduleId, courseModule.id));

		await deleteFolder(
			`${teamId}/courses/${courseModule.courseId}/${courseModule.language}${courseModule.versionNumber === 1 ? "" : `_${courseModule.versionNumber}`}`
		);

		return c.json(null);
	})
	// Private
	.post(
		"/",
		zValidator("json", UploadModuleSchema),
		authedMiddleware,
		async (c) => {
			let { type, id, courseId, language } = c.req.valid("json");
			const teamId = c.get("teamId");

			if (id === "") {
				id = undefined;
			}

			await coursesData.get({ id: courseId }, teamId);

			const newestModule = await db
				.select({
					versionNumber: max(modules.versionNumber),
				})
				.from(modules)
				.where(
					and(
						eq(modules.courseId, courseId),
						eq(modules.language, language)
					)
				);

			const insertId = id ?? generateId(15);

			console.log("Inserting module", insertId);
			console.log(newestModule);

			await db.insert(modules).values({
				id: insertId,
				courseId,
				type,
				language,
				versionNumber:
					newestModule.length > 0 && newestModule[0].versionNumber
						? newestModule[0].versionNumber + 1
						: 1,
			});

			return c.json({ id: insertId });
		}
	);
