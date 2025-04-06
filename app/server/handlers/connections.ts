import {
	authMiddleware,
	localeMiddleware,
	protectedMiddleware,
	teamMiddleware,
} from "../middleware";
import { db } from "@/server/db";
import {
	usersToCollections,
	usersToCourses,
	usersToModules,
} from "@/server/db/schema";
import { ExtendLearner } from "@/types/learner";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const getConnectionFn = createServerFn({ method: "GET" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["course", "collection"]),
			id: z.string(),
		}),
	)
	.handler(async ({ context, data: { type, id } }) => {
		const user = context.user;

		if (type === "course") {
			const connection = await db.query.usersToCourses.findFirst({
				where: and(
					eq(usersToCourses.userId, user.id),
					eq(usersToCourses.courseId, id),
				),
			});

			if (!connection) {
				throw new Error("Course not found");
			}

			return connection;
		}

		if (type === "collection") {
			const connection = await db.query.usersToCollections.findFirst({
				where: and(
					eq(usersToCollections.userId, user.id),
					eq(usersToCollections.collectionId, id),
				),
			});

			if (!connection) {
				throw new Error("Collection not found");
			}

			return connection;
		}
	});

export const getAttemptsFn = createServerFn({ method: "GET" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(
		z.object({
			courseId: z.string(),
			teamId: z.string(),
		}),
	)
	.handler(async ({ context, data: { courseId, teamId } }) => {
		const user = context.user;

		const moduleList = await db.query.usersToModules.findMany({
			where: and(
				eq(usersToModules.userId, user.id),
				eq(usersToModules.courseId, courseId),
				eq(usersToModules.teamId, teamId),
			),
			with: {
				module: true,
			},
		});

		return moduleList.map((attempt) =>
			ExtendLearner(attempt.module.type).parse(attempt),
		);
	});

export const requestConnectionFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["course", "collection"]),
			id: z.string(),
			teamId: z.string(),
		}),
	)
	.handler(async ({ context, data: { type, id, teamId } }) => {
		const user = context.user;

		if (type === "course") {
			await db
				.insert(usersToCourses)
				.values({
					userId: user.id,
					teamId,
					courseId: id,
					connectType: "request",
					connectStatus: "pending",
				})
				.onConflictDoNothing();
		}

		if (type === "collection") {
			await db
				.insert(usersToCollections)
				.values({
					userId: user.id,
					teamId,
					collectionId: id,
					connectType: "request",
					connectStatus: "pending",
				})
				.onConflictDoNothing();
		}

		return null;
	});

export const userConnectionResponseFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["course", "collection"]),
			id: z.string(),
			teamId: z.string(),
			connectStatus: z.enum(["accepted", "rejected"]),
		}),
	)
	.handler(async ({ context, data: { type, id, teamId, connectStatus } }) => {
		const user = context.user;

		if (type === "course") {
			await db
				.update(usersToCourses)
				.set({
					connectStatus,
				})
				.where(
					and(
						eq(usersToCourses.userId, user.id),
						eq(usersToCourses.teamId, teamId),
						eq(usersToCourses.courseId, id),
					),
				);
		}

		if (type === "collection") {
			await db
				.update(usersToCollections)
				.set({
					connectStatus,
				})
				.where(
					and(
						eq(usersToCollections.userId, user.id),
						eq(usersToCollections.teamId, teamId),
						eq(usersToCollections.collectionId, id),
					),
				);
		}

		return null;
	});

export const teamConnectionResponseFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware()])
	.validator(
		z.object({
			type: z.enum(["course", "collection"]),
			id: z.string(),
			userId: z.string(),
			connectStatus: z.enum(["accepted", "rejected"]),
		}),
	)
	.handler(async ({ context, data: { type, id, userId, connectStatus } }) => {
		const teamId = context.teamId;

		if (type === "course") {
			await db
				.update(usersToCourses)
				.set({
					connectStatus,
				})
				.where(
					and(
						eq(usersToCourses.teamId, teamId),
						eq(usersToCourses.courseId, id),
						eq(usersToCourses.userId, userId),
					),
				);
		}

		if (type === "collection") {
			await db
				.update(usersToCollections)
				.set({
					connectStatus,
				})
				.where(
					and(
						eq(usersToCollections.teamId, teamId),
						eq(usersToCollections.collectionId, id),
						eq(usersToCollections.userId, userId),
					),
				);
		}

		return null;
	});

export const removeConnectionFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware()])
	.validator(
		z.object({
			type: z.enum(["course", "collection"]),
			id: z.string(),
			userId: z.string(),
		}),
	)
	.handler(async ({ context, data: { type, id, userId } }) => {
		const teamId = context.teamId;

		if (type === "course") {
			await db
				.delete(usersToCourses)
				.where(
					and(
						eq(usersToCourses.courseId, id),
						eq(usersToCourses.teamId, teamId),
						eq(usersToCourses.userId, userId),
					),
				);
			await db
				.delete(usersToModules)
				.where(
					and(
						eq(usersToModules.courseId, id),
						eq(usersToModules.teamId, teamId),
						eq(usersToModules.userId, userId),
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
						eq(usersToCollections.userId, userId),
					),
				);
		}

		return null;
	});
