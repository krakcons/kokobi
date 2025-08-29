import { db } from "@/server/db";
import { publicProcedure, teamProcedure } from "../middleware";
import { z } from "zod";
import { ORPCError } from "@orpc/client";
import { CourseFormSchema, CourseSchema } from "@/types/course";
import { TeamSchema } from "@/types/team";
import { s3 } from "../s3";
import { hasTeamAccess } from "../lib/access";
import {
	collectionsToCourses,
	courseTranslations,
	courses,
	usersToCollections,
	usersToCourses,
	usersToModules,
} from "@/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale";
import { ExtendLearner, learnerStatuses } from "@/types/learner";
import { env } from "../env";

export const courseRouter = {
	get: teamProcedure()
		.route({ method: "GET", path: "/courses" })
		.output(CourseSchema.array())
		.handler(async ({ context }) => {
			const courseList = await db.query.courses.findMany({
				where: eq(courses.teamId, context.teamId),
				with: {
					translations: true,
				},
			});

			return courseList.map((course) =>
				handleLocalization(context, course),
			);
		}),
	create: teamProcedure()
		.route({ method: "POST", path: "/courses" })
		.input(CourseFormSchema)
		.output(z.object({ courseId: z.string() }))
		.handler(async ({ context: { teamId, locale }, input }) => {
			const courseId = Bun.randomUUIDv7();

			await db.insert(courses).values({
				id: courseId,
				teamId,
				completionStatus: input.completionStatus,
			});

			await db.insert(courseTranslations).values({
				courseId,
				name: input.name,
				description: input.description,
				locale,
			});

			return { courseId };
		}),
	id: publicProcedure
		.route({ method: "GET", path: "/courses/{id}" })
		.input(
			z.object({
				id: z.string().min(1),
			}),
		)
		.output(CourseSchema.extend({ team: TeamSchema }))
		.handler(async ({ context, input: { id } }) => {
			console.log("ID", id);
			const course = await db.query.courses.findFirst({
				where: and(eq(courses.id, id)),
				with: {
					translations: true,
					team: {
						with: {
							translations: true,
						},
					},
				},
			});

			console.log("COURSE", course);

			if (!course) {
				throw new ORPCError("NOT_FOUND");
			}

			return {
				...handleLocalization(context, course),
				team: handleLocalization(context, course.team),
			};
		}),
	update: teamProcedure()
		.route({ method: "POST", path: "/courses/{id}" })
		.input(
			CourseFormSchema.extend({
				id: z.string().min(1),
			}),
		)
		.handler(async ({ context: { teamId, locale }, input }) => {
			const id = input.id;
			await hasTeamAccess({
				type: "course",
				id,
				teamId,
				access: "root",
			});

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
					locale,
				})
				.onConflictDoUpdate({
					set: {
						...input,
						updatedAt: new Date(),
					},
					target: [
						courseTranslations.courseId,
						courseTranslations.locale,
					],
				});

			return input;
		}),
	delete: teamProcedure()
		.route({ method: "POST", path: "/courses/{id}" })
		.input(
			z.object({
				id: z.string().min(1),
			}),
		)
		.handler(async ({ context, input: { id } }) => {
			await hasTeamAccess({
				type: "course",
				id,
				teamId: context.teamId,
				access: "root",
			});

			await db
				.delete(courses)
				.where(
					and(eq(courses.id, id), eq(courses.teamId, context.teamId)),
				);

			const files = await s3.list({
				prefix: `${context.teamId}/courses/${id}/`,
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
		}),
	statistics: teamProcedure()
		.route({ method: "GET", path: "/courses/{id}/statistics" })
		.input(
			z.object({
				id: z.string(),
				teamId: z.string().optional(),
			}),
		)
		.output(
			z.object({
				total: z.number(),
				completed: z.number(),
				completedPercent: z.string().optional(),
				completedTimeAverage: z.string().optional(),
				charts: z.object({
					status: z.array(
						z.object({
							name: z.string(),
							value: z.number(),
						}),
					),
				}),
			}),
		)
		.handler(async ({ context, input: { id, teamId: customTeamId } }) => {
			const access = await hasTeamAccess({
				type: "course",
				id: id,
				teamId: context.teamId,
			});

			const teamId = access === "shared" ? context.teamId : customTeamId;

			const course = await db.query.courses.findFirst({
				where: and(
					eq(courses.id, id),
					teamId ? eq(courses.teamId, teamId) : undefined,
				),
			});

			if (!course) {
				throw new ORPCError("NOT_FOUND");
			}

			// First, get all user IDs connected to the course (directly or via collections)
			const directUserIds = await db
				.select({ userId: usersToCourses.userId })
				.from(usersToCourses)
				.where(
					and(
						eq(usersToCourses.courseId, id),
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
						eq(collectionsToCourses.courseId, id),
						eq(usersToCollections.connectStatus, "accepted"),
						teamId
							? eq(usersToCollections.teamId, teamId)
							: undefined,
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
					eq(usersToModules.courseId, id),
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
			const totalCompletionTimeSeconds = attempts.reduce(
				(acc, learner) => {
					if (learner.completedAt) {
						return (
							acc +
							(learner.completedAt.getTime() -
								learner.createdAt.getTime()) /
								1000
						);
					}
					return acc;
				},
				0,
			);

			return {
				total,
				completed,
				completedPercent:
					completed > 0
						? ((completed / total) * 100).toFixed(0)
						: undefined,
				completedTimeAverage:
					completed > 0
						? (totalCompletionTimeSeconds / 60 / completed).toFixed(
								1,
							)
						: undefined,
				charts: {
					status: attempts.reduce(
						(acc, learner) => {
							const index = learnerStatuses.indexOf(
								learner.status,
							);
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
		}),
	available: teamProcedure()
		.route({ method: "GET", path: "/courses/available" })
		.output(CourseSchema.array())
		.handler(async ({ context }) => {
			if (context.learnerTeamId !== env.WELCOME_TEAM_ID) return [];
			// TODO: Allow learner team members to access available courses (or something else)
			const courseList = await db.query.courses.findMany({
				where: eq(courses.teamId, context.learnerTeamId),
				with: {
					translations: true,
				},
			});

			return courseList.map((course) =>
				handleLocalization(context, course),
			);
		}),
};
