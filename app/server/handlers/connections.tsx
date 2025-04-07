import { createCourseLink } from "@/lib/invite";
import {
	localeMiddleware,
	protectedMiddleware,
	teamMiddleware,
} from "../middleware";
import { db } from "@/server/db";
import {
	courses,
	modules,
	teams,
	users,
	usersToCollections,
	usersToCourses,
	usersToModules,
} from "@/server/db/schema";
import { ExtendLearner } from "@/types/learner";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { sendEmail } from "../email";
import CourseInvite from "@/emails/CourseInvite";
import { createTranslator } from "@/lib/locale/actions";
import { handleLocalization } from "@/lib/locale/helpers";
import { ConnectionType } from "@/types/connections";
import { env } from "../env";
import { getInitialScormData } from "@/lib/scorm";
import { getCourseConnectionHelper } from "../helpers";

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

			// If the user is a member of the collection, they are allowed to access to the course
			if (!connection) {
				const connection = await db.query.usersToCollections.findFirst({
					where: and(eq(usersToCollections.userId, user.id)),
					with: {
						collection: {
							with: {
								collectionsToCourses: true,
							},
						},
					},
				});

				if (
					connection?.collection?.collectionsToCourses.find(
						(c) => c.courseId === id,
					)
				) {
					return connection;
				}
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

			return connection;
		}
	});

export const getConnectionsFn = createServerFn({ method: "GET" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["course", "collection"]),
		}),
	)
	.handler(async ({ context, data: { type } }) => {
		const user = context.user;

		if (type === "course") {
			const connections = await db.query.usersToCourses.findMany({
				where: eq(usersToCourses.userId, user.id),
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
				course: handleLocalization(context, connection.course),
				team: handleLocalization(context, connection.team),
			}));
		}

		if (type === "collection") {
			const connections = await db.query.usersToCollections.findMany({
				where: eq(usersToCollections.userId, user.id),
				with: {
					collection: {
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
				collection: handleLocalization(context, connection.collection),
				team: handleLocalization(context, connection.team),
			}));
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

export const inviteConnectionFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["course", "collection"]),
			id: z.string(),
			emails: z.string().email().array(),
		}),
	)
	.handler(async ({ context, data: { type, id, emails } }) => {
		const teamId = context.teamId;

		const teamBase = await db.query.teams.findFirst({
			where: and(eq(teams.id, teamId)),
			with: {
				translations: true,
				domains: true,
			},
		});

		const team = handleLocalization(context, teamBase!);

		const userList = await db
			.insert(users)
			.values(
				emails.map((email) => ({
					email,
					id: Bun.randomUUIDv7(),
				})),
			)
			.onConflictDoUpdate({
				target: [users.email],
				set: {
					updatedAt: new Date(),
				},
			})
			.returning();

		if (type === "course") {
			await db
				.insert(usersToCourses)
				.values(
					userList.map((u) => ({
						userId: u.id,
						teamId,
						courseId: id,
						connectType: "invite" as ConnectionType["connectType"],
						connectStatus:
							"pending" as ConnectionType["connectStatus"],
					})),
				)
				.onConflictDoNothing();

			const courseBase = await db.query.courses.findFirst({
				where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
				with: {
					translations: true,
				},
			});

			if (!courseBase) {
				throw new Error("Course not found");
			}

			const course = handleLocalization(context, courseBase);

			userList.forEach(async (user) => {
				const href = createCourseLink({
					domain:
						team.domains.length > 0 ? team.domains[0] : undefined,
					courseId: course.id,
					email: user.email,
					locale: "en",
				});

				const t = await createTranslator({
					locale: "en",
				});

				await sendEmail({
					to: [user.email],
					subject: t.Email.CourseInvite.subject,
					content: (
						<CourseInvite
							href={href}
							name={course.name}
							teamName={team.name}
							logo={`${env.VITE_SITE_URL}/cdn/${team.id}/${team.locale}/logo?updatedAt=${team?.updatedAt.toString()}`}
							t={t.Email.CourseInvite}
						/>
					),
					team,
				});
			});
		}

		if (type === "collection") {
			await db
				.insert(usersToCollections)
				.values(
					userList.map((u) => ({
						userId: u.id,
						teamId,
						collectionId: id,
						connectType: "invite" as ConnectionType["connectType"],
						connectStatus:
							"pending" as ConnectionType["connectStatus"],
					})),
				)
				.onConflictDoNothing();
		}

		return null;
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
