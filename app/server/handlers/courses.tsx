import { db } from "@/server/db";
import {
	courseTranslations,
	courses,
	usersToCourses,
	usersToModules,
} from "@/server/db/schema";
import { CourseFormSchema } from "@/types/course";
import { and, eq } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale/helpers";
import { createServerFn } from "@tanstack/react-start";
import {
	learnerMiddleware,
	localeMiddleware,
	teamMiddleware,
} from "../middleware";
import { z } from "zod";
import { ExtendLearner } from "@/types/learner";
import { createS3 } from "../s3";
import { env } from "../env";

export const getCoursesFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware(), localeMiddleware])
	.handler(async ({ context }) => {
		const courseList = await db.query.courses.findMany({
			where: eq(courses.teamId, context.teamId),
			with: {
				translations: true,
			},
		});

		return courseList.map((course) => handleLocalization(context, course));
	});

export const getAvailableCoursesFn = createServerFn({ method: "GET" })
	.middleware([learnerMiddleware, localeMiddleware])
	.handler(async ({ context }) => {
		if (context.learnerTeamId !== env.WELCOME_TEAM_ID) return [];
		// TODO: Allow learner team members to access available courses (or something else)
		const courseList = await db.query.courses.findMany({
			where: eq(courses.teamId, context.learnerTeamId),
			with: {
				translations: true,
			},
		});

		return courseList.map((course) => handleLocalization(context, course));
	});

export const getCourseFn = createServerFn({ method: "GET" })
	.middleware([localeMiddleware])
	.validator(z.object({ courseId: z.string() }))
	.handler(async ({ context, data: { courseId } }) => {
		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, courseId)),
			with: {
				translations: true,
				team: {
					with: {
						translations: true,
					},
				},
			},
		});

		if (!course) {
			throw new Error("Course not found");
		}

		return {
			...handleLocalization(context, course),
			team: handleLocalization(context, course.team),
		};
	});

export const createCourseFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(CourseFormSchema)
	.handler(async ({ context: { teamId, locale }, data }) => {
		const courseId = Bun.randomUUIDv7();

		await db.insert(courses).values({
			id: courseId,
			teamId,
			completionStatus: data.completionStatus,
		});

		await db.insert(courseTranslations).values({
			courseId,
			name: data.name,
			description: data.description,
			locale,
		});

		return { courseId };
	});

export const updateCourseFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(CourseFormSchema.extend({ id: z.string() }))
	.handler(async ({ context: { teamId, locale }, data }) => {
		const id = data.id;

		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
		});

		if (!course) {
			throw new Error("Course not found");
		}

		await db
			.update(courses)
			.set({
				completionStatus: data.completionStatus,
			})
			.where(eq(courses.id, id));

		await db
			.insert(courseTranslations)
			.values({
				courseId: id,
				name: data.name,
				description: data.description,
				locale,
			})
			.onConflictDoUpdate({
				set: {
					...data,
					updatedAt: new Date(),
				},
				target: [
					courseTranslations.courseId,
					courseTranslations.locale,
				],
			});

		return data;
	});

export const deleteCourseFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(z.object({ courseId: z.string() }))
	.handler(async ({ context, data: { courseId } }) => {
		const s3 = await createS3();
		const teamId = context.teamId;

		await db
			.delete(courses)
			.where(and(eq(courses.id, courseId), eq(courses.teamId, teamId)));

		const files = await s3.list({
			prefix: `${teamId}/courses/${courseId}/`,
			maxKeys: 1000,
		});
		if (files.contents) {
			await Promise.all(
				files.contents.map((file) => {
					s3.delete(file.key);
				}),
			);
		}

		return null;
	});

export const getCourseStatisticsFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(z.object({ courseId: z.string() }))
	.handler(async ({ context, data: { courseId } }) => {
		const { access } = await hasTeamCourseAccess({
			courseId,
			teamId: context.teamId,
		});

		const connections = await db.query.usersToCourses.findMany({
			where: and(
				eq(usersToCourses.courseId, courseId),
				access === "shared"
					? eq(usersToCourses.teamId, context.teamId)
					: undefined,
			),
		});

		const learners = await db.query.usersToModules.findMany({
			where: and(
				eq(usersToModules.courseId, courseId),
				access === "shared"
					? eq(usersToModules.teamId, context.teamId)
					: undefined,
			),
			with: {
				module: true,
			},
		});

		return {
			connections,
			learners: learners.map((learner) =>
				ExtendLearner(learner.module.type).parse(learner),
			),
		};
	});
