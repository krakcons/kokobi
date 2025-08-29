import {
	localeMiddleware,
	protectedMiddleware,
	teamMiddleware,
} from "../lib/middleware";
import { db } from "@/server/db";
import {
	collections,
	collectionsToCourses,
	modules,
	teamsToCourses,
	users,
	usersToCollections,
	usersToCourses,
	usersToModules,
	usersToTeams,
} from "@/server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { handleLocalization } from "@/lib/locale";
import { ExtendLearner } from "@/types/learner";

export const updateUserConnectionFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["team"]),
			id: z.string(),
			connectStatus: z.enum(["accepted", "rejected"]),
		}),
	)
	.handler(async ({ context, data: { type, id, connectStatus } }) => {
		const user = context.user;

		if (type === "team") {
			await db
				.update(usersToTeams)
				.set({
					connectStatus,
				})
				.where(
					and(
						eq(usersToTeams.userId, user.id),
						eq(usersToTeams.teamId, id),
						eq(usersToTeams.connectType, "invite"),
					),
				);
		}

		return null;
	});

export const removeConnectionFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware()])
	.validator(
		z.object({
			type: z.enum(["course", "collection", "from-team"]),
			id: z.string(),
			toId: z.string(),
		}),
	)
	.handler(async ({ context, data: { type, id, toId } }) => {
		const teamId = context.teamId;

		if (type === "course") {
			// Delete connections
			await db
				.delete(usersToCourses)
				.where(
					and(
						eq(usersToCourses.courseId, id),
						eq(usersToCourses.teamId, teamId),
						eq(usersToCourses.userId, toId),
					),
				);
		}

		if (type === "collection") {
			await db
				.delete(usersToCollections)
				.where(
					and(
						eq(usersToCollections.collectionId, id),
						eq(usersToCollections.teamId, teamId),
						eq(usersToCollections.userId, toId),
					),
				);
		}

		if (type === "from-team") {
			await db
				.delete(teamsToCourses)
				.where(
					and(
						eq(teamsToCourses.fromTeamId, teamId),
						eq(teamsToCourses.courseId, id),
						eq(teamsToCourses.teamId, toId),
					),
				);
			// Remove from collections
			const collectionList = await db.query.collections.findMany({
				where: eq(collections.teamId, toId),
			});
			await db.delete(collectionsToCourses).where(
				and(
					eq(collectionsToCourses.courseId, id),
					inArray(
						collectionsToCourses.collectionId,
						collectionList.map((c) => c.id),
					),
				),
			);
		}

		return null;
	});

export const getTeamConnectionsFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["course", "collection"]),
			id: z.string().optional(),
		}),
	)
	.handler(async ({ context, data: { type, id } }) => {
		// TODO: Refactor into getCourseUsersFn
		if (type === "course") {
			const userList = await db
				.select({
					user: users,
					attempt: usersToModules,
					module: modules,
					connection: usersToCourses,
				})
				.from(usersToCourses)
				.where(
					and(
						eq(usersToCourses.teamId, context.teamId),
						id ? eq(usersToCourses.courseId, id) : undefined,
					),
				)
				.innerJoin(users, eq(users.id, usersToCourses.userId))
				.leftJoin(
					usersToModules,
					and(
						eq(usersToModules.teamId, context.teamId),
						eq(usersToModules.userId, users.id),
						id ? eq(usersToModules.courseId, id) : undefined,
					),
				)
				.leftJoin(modules, eq(modules.id, usersToModules.moduleId));

			return userList.map((user) => ({
				...user,
				attempt: user.module
					? ExtendLearner(user.module.type).parse(user.attempt)
					: undefined,
			}));
		}

		// TODO: Refactor into getCollectionUsersFn
		if (type === "collection") {
			const connections = await db.query.usersToCollections.findMany({
				where: and(
					eq(usersToCollections.teamId, context.teamId),
					id ? eq(usersToCollections.collectionId, id) : undefined,
				),
				with: {
					user: true,
				},
			});

			return connections;
		}
	});

export const getTeamCourseConnectionsFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["from", "to"]),
			id: z.string().optional(),
		}),
	)
	.handler(async ({ context, data: { type, id } }) => {
		const connections = await db.query.teamsToCourses.findMany({
			where: and(
				type === "from"
					? eq(teamsToCourses.fromTeamId, context.teamId)
					: eq(teamsToCourses.teamId, context.teamId),
				id ? eq(teamsToCourses.courseId, id) : undefined,
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

		return connections.map((connect) => ({
			...connect,
			team: handleLocalization(context, connect.team),
			course: handleLocalization(context, connect.course),
			access: connect.team.id === context.teamId ? "root" : "shared",
		}));
	});

export const getTeamCourseConnectionFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware()])
	.validator(
		z.object({
			type: z.enum(["from", "to"]),
			courseId: z.string(),
		}),
	)
	.handler(async ({ context, data: { type, courseId } }) => {
		const connection = await db.query.teamsToCourses.findFirst({
			where: and(
				type === "from"
					? eq(teamsToCourses.fromTeamId, context.teamId)
					: eq(teamsToCourses.teamId, context.teamId),
				eq(teamsToCourses.courseId, courseId),
			),
		});

		return connection;
	});
