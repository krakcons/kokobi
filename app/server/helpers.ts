import { db } from "@/server/db";
import {
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

export const hasTeamCourseAccess = async ({
	teamId,
	courseId,
}: {
	teamId: string;
	courseId: string;
}) => {
	// 1: Own the course
	const course = await db.query.courses.findFirst({
		where: and(eq(courses.id, courseId), eq(courses.teamId, teamId)),
		with: {
			translations: true,
		},
	});

	if (course) {
		return { course, access: "root" };
	}

	// 2: Course is shared with the team and accepted
	const connection = await db.query.teamsToCourses.findFirst({
		where: and(
			eq(usersToCourses.courseId, courseId),
			eq(usersToCourses.teamId, teamId),
			eq(usersToCourses.connectStatus, "accepted"),
		),
		with: {
			course: {
				with: {
					translations: true,
				},
			},
		},
	});

	if (connection) {
		return { course: connection.course, access: "shared" };
	}

	throw new Error("No access to course");
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
