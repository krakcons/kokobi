import { base, learnerProcedure } from "../middleware";
import { db } from "@/server/db";
import {
	courses,
	usersToCollections,
	usersToCourses,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale";
import { CourseSchema } from "@/types/course";
import { env } from "../env";

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
