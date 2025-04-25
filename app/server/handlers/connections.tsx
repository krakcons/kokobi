import {
	learnerMiddleware,
	localeMiddleware,
	protectedMiddleware,
	teamMiddleware,
} from "../lib/middleware";
import { db } from "@/server/db";
import {
	collections,
	courses,
	teams,
	teamsToCourses,
	usersToCollections,
	usersToCourses,
	usersToTeams,
} from "@/server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { sendEmail, verifyEmail } from "../lib/email";
import { createTranslator } from "@/lib/locale/actions";
import { handleLocalization } from "@/lib/locale/helpers";
import { ConnectionType, GetConnectionSchema } from "@/types/connections";
import { env } from "@/server/env";
import {
	ConnectionLinkSchema,
	getConnectionLink,
	getUserList,
} from "@/server/lib/connection";
import Invite from "@/emails/Invite";
import { teamImageUrl } from "@/lib/file";
import { hasTeamAccess } from "../lib/access";
import { locales } from "@/lib/locale";

export const getConnectionLinkFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware()])
	.validator(
		ConnectionLinkSchema.omit({
			teamId: true,
		}),
	)
	.handler(async ({ context: { teamId }, data: { type, id, locale } }) => {
		return getConnectionLink({ type, id, teamId, locale });
	});

export const getConnectionFn = createServerFn({ method: "GET" })
	.middleware([learnerMiddleware, localeMiddleware])
	.validator(GetConnectionSchema)
	.handler(async ({ context, data: { type, id } }) => {
		const user = context.user;
		await hasTeamAccess({
			teamId: context.learnerTeamId,
			type,
			id,
		});

		if (type === "course") {
			const connection = await db.query.usersToCourses.findFirst({
				where: and(
					eq(usersToCourses.userId, user.id),
					eq(usersToCourses.courseId, id),
					eq(usersToCourses.teamId, context.learnerTeamId),
				),
			});

			// If the user is a member of the collection, they are allowed to access to the course
			if (!connection) {
				const connection = await db.query.usersToCollections.findFirst({
					where: and(
						eq(usersToCollections.userId, user.id),
						eq(usersToCollections.teamId, context.learnerTeamId),
					),
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
					eq(usersToCollections.teamId, context.learnerTeamId),
				),
			});

			return connection;
		}
	});

export const getConnectionsFn = createServerFn({ method: "GET" })
	.middleware([learnerMiddleware, localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["course", "collection"]),
		}),
	)
	.handler(async ({ context, data: { type } }) => {
		const user = context.user;

		if (type === "course") {
			const connections = await db.query.usersToCourses.findMany({
				where: and(
					eq(usersToCourses.userId, user.id),
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
		}

		if (type === "collection") {
			const connections = await db.query.usersToCollections.findMany({
				where: and(
					eq(usersToCollections.userId, user.id),
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
		}
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
		await hasTeamAccess({
			teamId: context.teamId,
			type,
			id,
		});

		const team = (await db.query.teams.findFirst({
			where: eq(teams.id, context.teamId),
			with: {
				translations: true,
				domains: true,
			},
		}))!;

		const userList = await getUserList({ emails });

		if (type === "course") {
			const course = await db.query.courses.findFirst({
				where: eq(courses.id, id),
				with: {
					translations: true,
				},
			});

			if (!course) {
				throw new Error("Course not found");
			}

			await db
				.insert(usersToCourses)
				.values(
					userList.map((u) => ({
						userId: u.id,
						teamId: context.teamId,
						courseId: id,
						connectType: "invite" as ConnectionType["connectType"],
						connectStatus:
							"pending" as ConnectionType["connectStatus"],
					})),
				)
				.onConflictDoUpdate({
					target: [
						usersToCourses.userId,
						usersToCourses.courseId,
						usersToCourses.teamId,
					],
					set: {
						connectStatus: "accepted",
						updatedAt: new Date(),
					},
					setWhere: and(
						eq(usersToCourses.connectType, "request"),
						eq(usersToCourses.connectStatus, "pending"),
					),
				});

			const emailVerified = await verifyEmail(team.domains);

			await Promise.all(
				userList.map(async (user) => {
					const content = await Promise.all(
						locales.map(async (locale) => {
							const localizedCourse = handleLocalization(
								{ locale: locale.value },
								course,
							);
							const localizedTeam = handleLocalization(
								{ locale: locale.value },
								team,
							);
							const href = await getConnectionLink({
								teamId: context.teamId,
								type: "course",
								id: course.id,
								locale: locale.value,
							});
							const t = await createTranslator({
								locale: locale.value,
							});
							return {
								name: localizedCourse.name,
								teamName: localizedTeam.name,
								logo: teamImageUrl(localizedTeam, "logo"),
								locale: locale.value,
								t: t.Email.Invite,
								href,
							};
						}),
					);

					await sendEmail({
						to: [user.email],
						subject: content[0].t.subject,
						content: <Invite content={content} />,
						team: emailVerified
							? handleLocalization({ locale: "en" }, team)
							: undefined,
					});
				}),
			);
		}

		if (type === "collection") {
			const collection = await db.query.collections.findFirst({
				where: and(
					eq(collections.id, id),
					eq(collections.teamId, context.teamId),
				),
				with: {
					translations: true,
				},
			});

			if (!collection) {
				throw new Error("Collection not found");
			}

			await db
				.insert(usersToCollections)
				.values(
					userList.map((u) => ({
						userId: u.id,
						teamId: context.teamId,
						collectionId: id,
						connectType: "invite" as ConnectionType["connectType"],
						connectStatus:
							"pending" as ConnectionType["connectStatus"],
					})),
				)
				.onConflictDoUpdate({
					target: [
						usersToCollections.userId,
						usersToCollections.collectionId,
						usersToCollections.teamId,
					],
					set: {
						connectStatus: "accepted",
						updatedAt: new Date(),
					},
					setWhere: and(
						eq(usersToCollections.connectType, "request"),
						eq(usersToCollections.connectStatus, "pending"),
					),
				});

			const emailVerified = await verifyEmail(team.domains);

			await Promise.all([
				userList.map(async (user) => {
					const content = await Promise.all(
						locales.map(async (locale) => {
							const localizedCollection = handleLocalization(
								{ locale: locale.value },
								collection,
							);
							const localizedTeam = handleLocalization(
								{ locale: locale.value },
								team,
							);
							const href = await getConnectionLink({
								teamId: context.teamId,
								type: "collection",
								id: collection.id,
								locale: locale.value,
							});
							const t = await createTranslator({
								locale: locale.value,
							});
							return {
								name: localizedCollection.name,
								teamName: localizedTeam.name,
								logo: teamImageUrl(localizedTeam, "logo"),
								locale: locale.value,
								t: t.Email.Invite,
								href,
							};
						}),
					);

					await sendEmail({
						to: [user.email],
						subject: content[0].t.subject,
						content: <Invite content={content} />,
						team: emailVerified
							? handleLocalization({ locale: "en" }, team)
							: undefined,
					});
				}),
			]);
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
		await hasTeamAccess({
			teamId: context.teamId,
			type,
			id,
			access: "root",
		});

		if (teamIds.includes(context.teamId)) {
			throw new Error("You cannot invite yourself");
		}

		if (type === "course") {
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
	.middleware([learnerMiddleware, localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["course", "collection"]),
			id: z.string(),
		}),
	)
	.handler(async ({ context, data: { type, id } }) => {
		const user = context.user;

		const values = {
			userId: user.id,
			teamId: context.learnerTeamId,
			connectType: "request",
			connectStatus:
				context.learnerTeamId !== env.WELCOME_TEAM_ID
					? "pending"
					: "accepted",
		} as const;

		if (type === "course") {
			await db
				.insert(usersToCourses)
				.values({
					...values,
					courseId: id,
				})
				.onConflictDoNothing();
		}

		if (type === "collection") {
			await db
				.insert(usersToCollections)
				.values({
					...values,
					collectionId: id,
				})
				.onConflictDoNothing();
		}

		return null;
	});

export const updateUserConnectionFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(
		z.object({
			type: z.enum(["course", "collection", "team"]),
			id: z.string(),
			connectStatus: z.enum(["accepted", "rejected"]),
		}),
	)
	.handler(async ({ context, data: { type, id, connectStatus } }) => {
		const user = context.user;

		if (type === "course") {
			if (!context.learnerTeamId) {
				throw new Error("No learner team");
			}

			await db
				.update(usersToCourses)
				.set({
					connectStatus,
				})
				.where(
					and(
						eq(usersToCourses.userId, user.id),
						eq(usersToCourses.teamId, context.learnerTeamId),
						eq(usersToCourses.courseId, id),
						eq(usersToCourses.connectType, "invite"),
					),
				);
		}

		if (type === "collection") {
			if (!context.learnerTeamId) {
				throw new Error("No learner team");
			}
			await db
				.update(usersToCollections)
				.set({
					connectStatus,
				})
				.where(
					and(
						eq(usersToCollections.userId, user.id),
						eq(usersToCollections.teamId, context.learnerTeamId),
						eq(usersToCollections.collectionId, id),
						eq(usersToCollections.connectType, "invite"),
					),
				);
		}

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
