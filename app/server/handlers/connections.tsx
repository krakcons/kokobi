import { createCourseLink } from "@/lib/invite";
import {
	localeMiddleware,
	protectedMiddleware,
	teamMiddleware,
} from "../middleware";
import { db } from "@/server/db";
import {
	courses,
	teams,
	teamsToCourses,
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
import { hasTeamCourseAccess } from "../helpers";

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

export const inviteUsersConnectionFn = createServerFn({ method: "POST" })
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
			const courseBase = await hasTeamCourseAccess({
				teamId,
				courseId: id,
			});
			const course = handleLocalization(context, courseBase);

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

			userList.forEach(async (user) => {
				const href = createCourseLink({
					domain:
						team.domains.length > 0 ? team.domains[0] : undefined,
					courseId: course.id,
					email: user.email,
					teamId,
					path: "invite",
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

export const inviteTeamsConnectionFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["course"]),
			id: z.string(),
			teamIds: z.string().array(),
		}),
	)
	.handler(async ({ context, data: { type, id, teamIds } }) => {
		if (type === "course") {
			const course = await db.query.courses.findFirst({
				where: and(
					eq(courses.id, id),
					eq(courses.teamId, context.teamId),
				),
				with: {
					translations: true,
				},
			});

			if (!course) {
				throw new Error("Course not found");
			}

			if (teamIds.includes(context.teamId)) {
				throw new Error("You cannot invite yourself");
			}

			await db.insert(teamsToCourses).values(
				teamIds.map((teamId) => ({
					fromTeamId: context.teamId,
					teamId,
					courseId: id,
					connectType: "invite" as ConnectionType["connectType"],
					connectStatus: "pending" as ConnectionType["connectStatus"],
				})),
			);
		}
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
			type: z.enum(["course", "collection", "from-team", "to-team"]),
			id: z.string(),
			toId: z.string(),
			connectStatus: z.enum(["accepted", "rejected"]),
		}),
	)
	.handler(async ({ context, data: { type, id, toId, connectStatus } }) => {
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
						eq(usersToCourses.userId, toId),
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
						eq(usersToCollections.userId, toId),
					),
				);
		}

		if (type === "from-team" || type === "to-team") {
			await db
				.update(teamsToCourses)
				.set({
					connectStatus,
				})
				.where(
					and(
						type === "from-team"
							? and(
									eq(teamsToCourses.fromTeamId, teamId),
									eq(teamsToCourses.teamId, toId),
								)
							: and(
									eq(teamsToCourses.fromTeamId, toId),
									eq(teamsToCourses.teamId, teamId),
								),
						eq(teamsToCourses.courseId, id),
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
		}

		return null;
	});

export const getTeamConnectionsFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["course", "collection", "from-team", "to-team"]),
			id: z.string().optional(),
		}),
	)
	.handler(async ({ context, data: { type, id } }) => {
		if (type === "course") {
			const connections = await db.query.usersToCourses.findMany({
				where: and(
					eq(usersToCourses.teamId, context.teamId),
					id ? eq(usersToCourses.courseId, id) : undefined,
				),
				with: {
					user: true,
				},
			});

			return connections;
		}

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

		if (type === "from-team" || type === "to-team") {
			const connections = await db.query.teamsToCourses.findMany({
				where: and(
					type === "from-team"
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
			}));
		}
	});
