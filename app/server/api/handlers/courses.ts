import { coursesData } from "@/server/db/courses";
import { db } from "@/server/db/db";
import { learnersData } from "@/server/db/learners";
import { courseTranslations, courses, learners } from "@/server/db/schema";
import { getPresignedUrl } from "@/server/r2";
import { CreateCourseSchema, UpdateCourseSettingsSchema } from "@/types/course";
import { CreateLearnerSchema, ExtendLearner } from "@/types/learner";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { authMiddleware, protectedMiddleware } from "../middleware";
import { env } from "@/env";

export const coursesHandler = new Hono()
	.get("/", authMiddleware, protectedMiddleware(), async (c) => {
		const teamId = c.get("teamId");

		const courseList = await db.query.courses.findMany({
			where: eq(courses.teamId, teamId),
			with: {
				translations: true,
			},
		});

		return c.json(courseList);
	})
	.get("/:id", authMiddleware, protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		const course = await coursesData.get({ id }, teamId);

		return c.json(course);
	})
	.post(
		"/",
		authMiddleware,
		protectedMiddleware(),
		zValidator("json", CreateCourseSchema),
		async (c) => {
			const teamId = c.get("teamId");
			const input = c.req.valid("json");

			const newCourse = await coursesData.create(input, teamId);

			return c.json(newCourse);
		},
	)
	.put(
		"/:id",
		authMiddleware,
		protectedMiddleware(),
		zValidator("json", UpdateCourseSettingsSchema),
		async (c) => {
			const { id } = c.req.param();
			const teamId = c.get("teamId");
			const input = c.req.valid("json");

			const course = await db.query.courses.findFirst({
				where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
			});

			if (!course) {
				throw new HTTPException(404, {
					message: "Course not found.",
				});
			}

			await db.update(courses).set(input).where(eq(courses.id, id));

			return c.json(input);
		},
	)
	.put(
		"/:id/translations",
		authMiddleware,
		protectedMiddleware(),
		zValidator("json", CreateCourseSchema),
		async (c) => {
			const { id } = c.req.param();
			const teamId = c.get("teamId");
			const input = c.req.valid("json");

			const course = await db.query.courses.findFirst({
				where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
			});

			if (!course) {
				throw new HTTPException(404, {
					message: "Course not found.",
				});
			}

			await db
				.insert(courseTranslations)
				.values({
					courseId: id,
					...input,
				})
				.onConflictDoUpdate({
					set: input,
					target: [
						courseTranslations.courseId,
						courseTranslations.language,
					],
				});

			return c.json(input);
		},
	)
	.delete("/:id", authMiddleware, protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		await coursesData.delete({ id }, teamId);

		return c.json(null);
	})
	.get("/:id/learners", authMiddleware, protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");
		const teamRole = c.get("teamRole");

		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
			with: {
				translations: true,
				team: true,
			},
		});

		if (!course) {
			throw new HTTPException(404, {
				message: "Course not found.",
			});
		}

		const learnerList = await db.query.learners.findMany({
			where: eq(learners.courseId, course.id),
			with: {
				module: true,
			},
		});

		const extendedLearnerList = learnerList.map((learner) => {
			return {
				...ExtendLearner(learner.module?.type).parse(learner),
				module: learner.module,
				joinLink:
					teamRole === "owner"
						? course.team?.customDomain &&
							env.VITE_SITE_URL !== "http://localhost:3000"
							? `https://${course.team.customDomain}/courses/${course.id}/join?learnerId=${learner.id}`
							: `${env.VITE_SITE_URL}/play/${course.team?.id}/courses/${course.id}/join?learnerId=${learner.id}`
						: undefined,
			};
		});

		return c.json(extendedLearnerList);
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
		authMiddleware,
		protectedMiddleware(),
		async (c) => {
			const { id } = c.req.param();
			let input = c.req.valid("json");
			const teamId = c.get("teamId");

			if (!Array.isArray(input)) {
				input = [input];
			}

			const course = await db.query.courses.findFirst({
				where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
				with: {
					translations: true,
				},
			});

			if (!course) {
				throw new HTTPException(404, {
					message: "Course not found.",
				});
			}

			const learners = await learnersData.create(input, [course]);

			return c.json(learners);
		},
	)
	// Private
	.post(
		"/:id/presigned-url",
		zValidator(
			"json",
			z.object({
				key: z.string(),
			}),
		),
		authMiddleware,
		protectedMiddleware(),
		async (c) => {
			const { id } = c.req.param();
			const { key } = c.req.valid("json");
			const teamId = c.get("teamId");

			try {
				const url = await getPresignedUrl(
					`${teamId}/courses/${id}/${key}`,
				);

				return c.json({ url });
			} catch (e) {
				throw new HTTPException(500, {
					message: "Failed to get presigned URL.",
				});
			}
		},
	);
