import { learnerProcedure } from "../middleware";
import { db } from "@/server/db";
import { usersToCollections, usersToCourses } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale";

export const learnerRouter = {
	course: {
		get: learnerProcedure
			.route({ method: "GET", path: "/learner/courses" })
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
	},
	collection: {
		get: learnerProcedure
			.route({ method: "GET", path: "/learner/collections" })
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
};
