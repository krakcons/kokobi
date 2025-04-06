import { db } from "@/server/db";
import { usersToCollections, usersToCourses } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export const getCourseConnectionHelper = async ({
	courseId,
	userId,
}: {
	courseId: string;
	userId: string;
}) => {
	let teamId;
	const connection = await db.query.usersToCourses.findFirst({
		where: and(
			eq(usersToCourses.courseId, courseId),
			eq(usersToCourses.userId, userId),
			eq(usersToCourses.connectStatus, "accepted"),
		),
	});

	if (!connection) {
		const connection = await db.query.usersToCollections.findFirst({
			where: and(
				eq(usersToCollections.userId, userId),
				eq(usersToCollections.connectStatus, "accepted"),
			),
			with: {
				collection: {
					with: {
						collectionsToCourses: true,
					},
				},
			},
		});

		if (!connection) {
			throw new Error("Connection not found");
		}

		if (
			connection.collection?.collectionsToCourses.find(
				(c) => c.courseId === courseId,
			)
		) {
			teamId = connection.collection.teamId;
		}
	} else {
		teamId = connection.teamId;
	}

	if (!teamId) {
		throw new Error("Connection not found");
	}

	return teamId;
};
