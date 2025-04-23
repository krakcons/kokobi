import { db } from "@/server/db";
import {
	collections,
	courses,
	domains,
	usersToCollections,
	usersToCourses,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { getRequestHost } from "@tanstack/react-start/server";
import { env } from "./env";

export const hasUserCourseAccess = async ({
	courseId,
	userId,
}: {
	courseId: string;
	userId: string;
}) => {
	// 1: Direct connection to the course
	const courseConnection = await db.query.usersToCourses.findFirst({
		where: and(
			eq(usersToCourses.courseId, courseId),
			eq(usersToCourses.userId, userId),
			eq(usersToCourses.connectStatus, "accepted"),
		),
	});

	if (courseConnection) {
		return courseConnection.teamId;
	}

	// 2: Connection to a collection with the course
	const collectionConnection = await db.query.usersToCollections.findMany({
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
	const collectionWithCourse = collectionConnection.find((connection) =>
		connection.collection.collectionsToCourses.find(
			(c) => c.courseId === courseId,
		),
	);

	if (collectionConnection && collectionWithCourse) {
		return collectionWithCourse.teamId;
	}

	throw new Error("No access to course");
};

export const hasTeamAccess = async ({
	teamId,
	type,
	id,
	access,
}: {
	teamId: string;
	type: "course" | "collection";
	id: string;
	access?: "root" | "shared";
}) => {
	if (type === "course") {
		// 1: Own the course
		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
		});

		if (course && access !== "shared") {
			return "root";
		}

		// 2: Course is shared with the team and accepted
		const connection = await db.query.teamsToCourses.findFirst({
			where: and(
				eq(usersToCourses.courseId, id),
				eq(usersToCourses.teamId, teamId),
				eq(usersToCourses.connectStatus, "accepted"),
			),
		});

		if (connection && access !== "root") {
			return "shared";
		}
	}

	if (type === "collection") {
		// 1: Own the collection
		const collection = await db.query.collections.findFirst({
			where: and(eq(collections.id, id), eq(collections.teamId, teamId)),
			with: {
				translations: true,
			},
		});

		if (collection && access !== "shared") {
			return "root";
		}
	}

	throw new Error("Access denied");
};

export const getTenant = async () => {
	const hostname = getRequestHost();

	if (hostname === env.VITE_ROOT_DOMAIN) {
		return null;
	}

	const domain = await db.query.domains.findFirst({
		where: eq(domains.hostname, hostname),
	});

	return domain ? domain.teamId : null;
};
