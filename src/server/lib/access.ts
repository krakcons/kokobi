import { db } from "@/server/db";
import {
	collections,
	courses,
	usersToCollections,
	usersToCourses,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

export const hasUserAccess = async ({
	id,
	type,
	userId,
	organizationId,
}: {
	id: string;
	type: "course" | "collection";
	userId: string;
	organizationId: string;
}) => {
	if (type === "course") {
		// 1: Direct connection to the course
		const courseConnection = await db.query.usersToCourses.findFirst({
			where: and(
				eq(usersToCourses.courseId, id),
				eq(usersToCourses.userId, userId),
				eq(usersToCourses.connectStatus, "accepted"),
				eq(usersToCourses.organizationId, organizationId),
			),
		});

		if (courseConnection) {
			return "course";
		}

		// 2: Connection to a collection with the course
		const collectionConnection = await db.query.usersToCollections.findMany(
			{
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
			},
		);
		const collectionWithCourse = collectionConnection.find((connection) =>
			connection.collection.collectionsToCourses.find(
				(c) => c.courseId === id,
			),
		);

		if (collectionConnection && collectionWithCourse) {
			return "collection";
		}
	}

	throw new Error("No access to course");
};

export const hasOrganizationAccess = async ({
	organizationId,
	type,
	id,
	access,
}: {
	organizationId: string;
	type: "course" | "collection";
	id: string;
	access?: "root" | "shared";
}) => {
	if (type === "course") {
		// 1: Own the course
		const course = await db.query.courses.findFirst({
			where: and(
				eq(courses.id, id),
				eq(courses.organizationId, organizationId),
			),
		});

		if (!course && access === "root") {
			throw new Error("Course not found");
		}

		if (course && access !== "shared") {
			return "root";
		}

		// 2: Course is shared with the organization and accepted
		const connection = await db.query.organizationsToCourses.findFirst({
			where: and(
				eq(usersToCourses.courseId, id),
				eq(usersToCourses.organizationId, organizationId),
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
			where: and(
				eq(collections.id, id),
				eq(collections.organizationId, organizationId),
			),
			with: {
				translations: true,
			},
		});

		if (!collection && access === "root") {
			throw new Error("Collection not found");
		}

		if (collection && access !== "shared") {
			return "root";
		}
	}

	throw new Error("Access denied");
};
