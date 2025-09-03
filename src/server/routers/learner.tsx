import { base, learnerProcedure } from "../middleware";
import { db } from "@/server/db";
import {
	courses,
	usersToCollections,
	usersToCourses,
	usersToModules,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale";
import { CourseSchema } from "@/types/course";
import { env } from "../env";
import z from "zod";
import { ExtendLearner, LearnerSchema } from "@/types/learner";
import { ModuleSchema } from "@/types/module";

export const learnerRouter = base.prefix("/learner").router({
	course: {
		get: learnerProcedure
			.route({
				tags: ["Learner"],
				method: "GET",
				path: "/courses",
				summary: "Get Courses",
			})
			.handler(async ({ context }) => {
				const connections = await db.query.usersToCourses.findMany({
					where: and(
						eq(usersToCourses.userId, context.user.id),
						eq(usersToCourses.teamId, context.learnerTeamId),
					),
					with: {
						course: {
							with: {
								translations: true,
							},
						},
						team: {
							with: {
								translations: true,
							},
						},
					},
				});

				return connections.map((connection) => ({
					...connection,
					collection: undefined,
					course: handleLocalization(context, connection.course),
					team: handleLocalization(context, connection.team),
				}));
			}),
		available: learnerProcedure
			.route({
				tags: ["Learner"],
				method: "GET",
				path: "/courses/available",
				summary: "Get Available Courses",
			})
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
		attempts: learnerProcedure
			.route({
				tags: ["Learner"],
				method: "GET",
				path: "/courses/{id}/attempts",
				summary: "Get Attempts",
			})
			.input(z.object({ id: z.string() }))
			.output(
				LearnerSchema.extend({
					module: ModuleSchema,
				}).array(),
			)
			.handler(async ({ context, input: { id } }) => {
				const user = context.user;

				const moduleList = await db.query.usersToModules.findMany({
					where: and(
						eq(usersToModules.userId, user.id),
						eq(usersToModules.courseId, id),
						eq(usersToModules.teamId, context.learnerTeamId),
					),
					with: {
						module: true,
					},
				});

				return moduleList.map((attempt) => ({
					...ExtendLearner(attempt.module.type).parse(attempt),
					module: attempt.module,
				}));
			}),
	},
	collection: {
		get: learnerProcedure
			.route({
				tags: ["Learner"],
				method: "GET",
				path: "/collections",
				summary: "Get Collections",
			})
			.handler(async ({ context }) => {
				const connections = await db.query.usersToCollections.findMany({
					where: and(
						eq(usersToCollections.userId, context.user.id),
						eq(usersToCollections.teamId, context.learnerTeamId),
					),
					with: {
						collection: {
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
						},
						team: {
							with: {
								translations: true,
							},
						},
					},
				});

				return connections.map((connection) => ({
					...connection,
					collection: handleLocalization(context, {
						...connection.collection,
						courses: connection.collection.collectionsToCourses.map(
							(c) => handleLocalization(context, c.course),
						),
					}),
					course: undefined,
					team: handleLocalization(context, connection.team),
				}));
			}),
	},
});
