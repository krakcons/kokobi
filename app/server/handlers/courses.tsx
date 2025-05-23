import { db } from "@/server/db";
import {
	collectionsToCourses,
	courseTranslations,
	courses,
	usersToCollections,
	usersToCourses,
	usersToModules,
} from "@/server/db/schema";
import { CourseFormSchema } from "@/types/course";
import { and, eq, inArray } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale";
import { createServerFn } from "@tanstack/react-start";
import {
	learnerMiddleware,
	localeMiddleware,
	teamMiddleware,
} from "../lib/middleware";
import { z } from "zod";
import { ExtendLearner, learnerStatuses } from "@/types/learner";
import { createS3 } from "../s3";
import { env } from "@/server/env";
import { hasTeamAccess } from "../lib/access";

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
		await hasTeamAccess({
			type: "course",
			id,
			teamId,
			access: "root",
		});

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
		await hasTeamAccess({
			type: "course",
			id: courseId,
			teamId: context.teamId,
			access: "root",
		});

		const s3 = await createS3();

		await db
			.delete(courses)
			.where(
				and(
					eq(courses.id, courseId),
					eq(courses.teamId, context.teamId),
				),
			);

		const files = await s3.list({
			prefix: `${context.teamId}/courses/${courseId}/`,
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
	.validator(
		z.object({
			courseId: z.string(),
			teamId: z.string().optional(),
		}),
	)
	.handler(async ({ context, data: { courseId, teamId: customTeamId } }) => {
		const access = await hasTeamAccess({
			type: "course",
			id: courseId,
			teamId: context.teamId,
		});

		const teamId = access === "shared" ? context.teamId : customTeamId;

		// First, get all user IDs connected to the course (directly or via collections)
		const directUserIds = await db
			.select({ userId: usersToCourses.userId })
			.from(usersToCourses)
			.where(
				and(
					eq(usersToCourses.courseId, courseId),
					eq(usersToCourses.connectStatus, "accepted"),
					teamId ? eq(usersToCourses.teamId, teamId) : undefined,
				),
			);
		const collectionUserIds = await db
			.select({ userId: usersToCollections.userId })
			.from(usersToCollections)
			.innerJoin(
				collectionsToCourses,
				eq(
					usersToCollections.collectionId,
					collectionsToCourses.collectionId,
				),
			)
			.where(
				and(
					eq(collectionsToCourses.courseId, courseId),
					eq(usersToCollections.connectStatus, "accepted"),
					teamId ? eq(usersToCollections.teamId, teamId) : undefined,
				),
			);

		// Combine all user IDs and remove duplicates
		const allUserIds = [
			...directUserIds.map((u) => u.userId),
			...collectionUserIds.map((u) => u.userId),
		];
		const uniqueUserIds = [...new Set(allUserIds)];

		const attemptList = await db.query.usersToModules.findMany({
			where: and(
				eq(usersToModules.courseId, courseId),
				inArray(usersToModules.userId, uniqueUserIds),
				teamId ? eq(usersToModules.teamId, teamId) : undefined,
			),
			with: {
				module: true,
			},
		});

		const attempts = attemptList.map((attempt) =>
			ExtendLearner(attempt.module.type).parse(attempt),
		);

		const total = attempts.length;
		const completed = attempts.filter((l) => !!l.completedAt).length;
		const totalCompletionTimeSeconds = attempts.reduce((acc, learner) => {
			if (learner.completedAt) {
				return (
					acc +
					(learner.completedAt.getTime() -
						learner.createdAt.getTime()) /
						1000
				);
			}
			return acc;
		}, 0);

		return {
			total,
			completed,
			completedPercent:
				completed > 0
					? ((completed / total) * 100).toFixed(0)
					: undefined,
			completedTimeAverage:
				completed > 0
					? (totalCompletionTimeSeconds / 60 / completed).toFixed(1)
					: undefined,
			charts: {
				status: attempts.reduce(
					(acc, learner) => {
						const index = learnerStatuses.indexOf(learner.status);
						if (index !== -1) {
							acc[index].value += 1;
						}
						return acc;
					},
					learnerStatuses.map((status) => ({
						name: status,
						value: 0,
					})),
				),
			},
		};
	});
