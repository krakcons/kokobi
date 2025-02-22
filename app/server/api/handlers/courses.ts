import { coursesData } from "@/server/db/courses";
import { db } from "@/server/db/db";
import { learnersData } from "@/server/db/learners";
import { courseTranslations, courses, learners } from "@/server/db/schema";
import { CourseFormSchema } from "@/types/course";
import { CreateLearnerSchema, ExtendLearner } from "@/types/learner";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
	HonoVariables,
	localeInputMiddleware,
	protectedMiddleware,
} from "../middleware";
import { env } from "@/env";
import { handleLocalization } from "@/lib/locale/helpers";
import { generateId } from "@/server/helpers";

export const coursesHandler = new Hono<{ Variables: HonoVariables }>()
	.get("/", protectedMiddleware(), async (c) => {
		const teamId = c.get("teamId");

		const courseList = await db.query.courses.findMany({
			where: eq(courses.teamId, teamId),
			with: {
				translations: true,
			},
		});

		return c.json(courseList);
	})
	.get("/:id", localeInputMiddleware, protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
			with: {
				translations: true,
			},
		});

		if (!course) {
			throw new HTTPException(404, {
				message: "Course not found",
			});
		}

		return c.json(handleLocalization(c, course));
	})
	.post(
		"/",
		localeInputMiddleware,
		protectedMiddleware(),
		zValidator("json", CourseFormSchema),
		async (c) => {
			const teamId = c.get("teamId");
			const input = c.req.valid("json");
			const language = c.get("locale");

			const courseId = generateId(15);

			await db.insert(courses).values({
				id: courseId,
				teamId,
				completionStatus: input.completionStatus,
			});

			await db.insert(courseTranslations).values({
				courseId,
				name: input.name,
				description: input.description,
				language,
				// TODO: Remove default
				default: false,
			});

			return c.json({ id: courseId });
		},
	)
	.put(
		"/:id",
		localeInputMiddleware,
		protectedMiddleware(),
		zValidator("json", CourseFormSchema),
		async (c) => {
			const { id } = c.req.param();
			const teamId = c.get("teamId");
			const input = c.req.valid("json");
			const language = c.get("locale");

			const course = await db.query.courses.findFirst({
				where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
			});

			if (!course) {
				throw new HTTPException(404, {
					message: "Course not found.",
				});
			}

			await db
				.update(courses)
				.set({
					completionStatus: input.completionStatus,
				})
				.where(eq(courses.id, id));

			await db
				.insert(courseTranslations)
				.values({
					courseId: id,
					name: input.name,
					description: input.description,
					language,
					// TODO: Remove default
					default: false,
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
	.delete("/:id", protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		await coursesData.delete({ id }, teamId);

		return c.json(null);
	})
	.get("/:id/learners", protectedMiddleware(), async (c) => {
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
							env.PUBLIC_SITE_URL !== "http://localhost:3000"
							? `https://${course.team.customDomain}/courses/${course.id}/join?learnerId=${learner.id}`
							: `${env.PUBLIC_SITE_URL}/play/${course.team?.id}/courses/${course.id}/join?learnerId=${learner.id}`
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
	);
