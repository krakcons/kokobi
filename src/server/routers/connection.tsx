import z from "zod";
import { base, protectedProcedure } from "../middleware";
import { db } from "../db";
import {
	collections,
	collectionsToCourses,
	courses,
	organizations,
	organizationsToCourses,
	usersToCollections,
	usersToCourses,
	usersToTeams,
} from "../db/schema";
import { ORPCError } from "@orpc/client";
import { env } from "../env";
import { and, eq, inArray } from "drizzle-orm";
import { hasOrganizationAccess } from "../lib/access";
import { getConnectionLink, getUserList } from "../lib/connection";
import type { ConnectionType } from "@/types/connections";
import { createTranslator, handleLocalization, locales } from "@/lib/locale";
import Invite from "@/components/emails/Invite";
import { sendEmail, verifyEmail } from "../lib/email";
import { organizationImageUrl } from "@/lib/file";
import type { Session } from "@/lib/auth";

const SelectConnectionSchema = z.object({
	senderType: z.enum(["user", "team", "collection", "course"]),
	recipientType: z.enum(["user", "team", "collection", "course"]),
	id: z.string(),
});

const CreateConnectionSchema = SelectConnectionSchema.extend({
	emails: z.email().toLowerCase().array().optional(),
	teamIds: z.string().array().optional(),
});
type CreateConnection = z.infer<typeof CreateConnectionSchema>;

export const createConnection = async ({
	senderType,
	recipientType,
	id,
	emails,
	teamIds,
	session: { activeOrganizationId, activeLearnerOrganizationId },
	user,
}: CreateConnection & Session) => {
	console.log("CREATE CONNECTION");
	// GLOBAL CHECKS
	if (recipientType === "user" && !emails) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Emails are required",
		});
	}
	if (recipientType === "team" && !teamIds) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Team IDs are required",
		});
	}

	if (senderType === "user") {
		if (!activeLearnerOrganizationId) {
			throw new ORPCError("UNAUTHORIZED");
		}

		// USER COURSE REQUEST
		if (recipientType === "course") {
			await db
				.insert(usersToCourses)
				.values({
					userId: user.id,
					organizationId: activeLearnerOrganizationId,
					connectType: "request",
					connectStatus:
						activeLearnerOrganizationId !== env.WELCOME_TEAM_ID
							? "pending"
							: "accepted",
					courseId: id,
				})
				.onConflictDoNothing();
		}

		// USER COLLECTION REQUEST
		if (recipientType === "collection") {
			await db
				.insert(usersToCollections)
				.values({
					userId: user.id,
					organizationId: activeLearnerOrganizationId,
					connectType: "request",
					connectStatus:
						activeLearnerOrganizationId !== env.WELCOME_TEAM_ID
							? "pending"
							: "accepted",
					collectionId: id,
				})
				.onConflictDoNothing();
		}
	}

	if (senderType === "team") {
		if (!activeOrganizationId) {
			throw new ORPCError("UNAUTHORIZED");
		}

		// TEAM COURSE REQUEST
		if (recipientType === "course") {
			const course = await db.query.courses.findFirst({
				where: eq(courses.id, id),
			});
			if (!course) {
				throw new ORPCError("NOT_FOUND");
			}
			await db.insert(organizationsToCourses).values({
				fromOrganizationId: course.organizationId,
				organizationId: activeOrganizationId,
				courseId: id,
				connectType: "request" as const,
				connectStatus: "pending" as const,
			});
		}
	}

	// INVITE
	if (senderType === "course") {
		if (!activeOrganizationId) {
			throw new ORPCError("UNAUTHORIZED");
		}

		// INVITE TO COURSE
		if (recipientType === "user") {
			console.log("ACCESS");
			await hasOrganizationAccess({
				organizationId: activeOrganizationId,
				type: "course",
				id,
			});
			console.log("ACCESSED");

			const team = (await db.query.organizations.findFirst({
				where: eq(organizations.id, activeOrganizationId),
				with: {
					translations: true,
					domains: true,
				},
			}))!;

			const userList = await getUserList({ emails: emails! });

			const course = await db.query.courses.findFirst({
				where: eq(courses.id, id),
				with: {
					translations: true,
				},
			});

			if (!course) {
				throw new ORPCError("NOT_FOUND");
			}

			await db
				.insert(usersToCourses)
				.values(
					userList.map((u) => ({
						userId: u.id,
						organizationId: activeOrganizationId,
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
						usersToCourses.organizationId,
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
								organizationId: activeOrganizationId,
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
								logo: organizationImageUrl(
									localizedTeam,
									"logo",
								),
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

		// INVITE TO TEAM
		if (recipientType === "team") {
			if (teamIds!.includes(activeOrganizationId)) {
				throw new Error("You cannot include your own team");
			}

			await hasOrganizationAccess({
				organizationId: activeOrganizationId,
				type: "course",
				id,
				access: "root",
			});

			await db.insert(organizationsToCourses).values(
				teamIds!.map((otherTeamId) => ({
					fromOrganizationId: activeOrganizationId,
					organizationId: otherTeamId,
					courseId: id,
					connectType: "invite" as const,
					connectStatus: "pending" as const,
				})),
			);

			return null;
		}
	}

	if (senderType === "collection") {
		if (!activeOrganizationId) {
			throw new ORPCError("UNAUTHORIZED");
		}

		// INVITE TO COLLECTION
		if (recipientType === "user") {
			await hasOrganizationAccess({
				organizationId: activeOrganizationId,
				type: "collection",
				id,
			});

			const team = (await db.query.organizations.findFirst({
				where: eq(organizations.id, activeOrganizationId),
				with: {
					translations: true,
					domains: true,
				},
			}))!;

			const userList = await getUserList({ emails: emails! });

			const collection = await db.query.collections.findFirst({
				where: and(
					eq(collections.id, id),
					eq(collections.organizationId, activeOrganizationId),
				),
				with: {
					translations: true,
				},
			});

			if (!collection) {
				throw new ORPCError("NOT_FOUND");
			}

			await db
				.insert(usersToCollections)
				.values(
					userList.map((u) => ({
						userId: u.id,
						organizationId: activeOrganizationId,
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
						usersToCollections.organizationId,
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
								organizationId: activeOrganizationId,
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
								logo: organizationImageUrl(
									localizedTeam,
									"logo",
								),
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
	}

	return null;
};

export const connectionRouter = base.prefix("/connections").router({
	getOne: protectedProcedure
		.route({
			tags: ["Connection"],
			method: "GET",
			path: "/",
			summary: "Get Connection",
		})
		.input(SelectConnectionSchema)
		.handler(
			async ({
				context: {
					user,
					session: {
						activeOrganizationId,
						activeLearnerOrganizationId,
					},
				},
				input: { senderType, recipientType, id },
			}) => {
				if (senderType === "user") {
					if (!activeLearnerOrganizationId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// USER COURSE
					if (recipientType === "course") {
						await hasOrganizationAccess({
							organizationId: activeLearnerOrganizationId,
							type: "course",
							id,
						});

						const connection =
							await db.query.usersToCourses.findFirst({
								where: and(
									eq(usersToCourses.userId, user.id),
									eq(usersToCourses.courseId, id),
									eq(
										usersToCourses.organizationId,
										activeLearnerOrganizationId,
									),
								),
							});

						// If the user is a member of the collection, they are allowed to access to the course
						if (!connection) {
							const connection =
								await db.query.usersToCollections.findFirst({
									where: and(
										eq(usersToCollections.userId, user.id),
										eq(
											usersToCollections.organizationId,
											activeLearnerOrganizationId,
										),
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

						return connection ?? null;
					}

					if (recipientType === "collection") {
						const connection =
							await db.query.usersToCollections.findFirst({
								where: and(
									eq(usersToCollections.userId, user.id),
									eq(usersToCollections.collectionId, id),
									eq(
										usersToCollections.organizationId,
										activeLearnerOrganizationId,
									),
								),
							});

						return connection ?? null;
					}
				}

				if (senderType === "team") {
					if (!activeOrganizationId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// TEAM COURSE INVITE
					if (recipientType === "course") {
						const connection =
							await db.query.organizationsToCourses.findFirst({
								where: and(
									eq(
										organizationsToCourses.organizationId,
										activeOrganizationId,
									),
									eq(organizationsToCourses.courseId, id),
								),
							});

						return connection ?? null;
					}
				}

				throw new ORPCError("NOT_FOUND");
			},
		),
	create: protectedProcedure
		.route({
			tags: ["Connection"],
			method: "POST",
			path: "/",
			summary: "Create Connection",
		})
		.input(CreateConnectionSchema)
		.output(z.null())
		.handler(async ({ context, input }) => {
			return await createConnection({
				...input,
				...context,
			});
		}),
	update: protectedProcedure
		.route({
			tags: ["Connection"],
			method: "PUT",
			path: "/",
			summary: "Update Connection",
		})
		.input(
			SelectConnectionSchema.extend({
				connectToId: z.string().optional(),
				connectStatus: z.enum(["accepted", "rejected"]),
			}),
		)
		.handler(
			async ({
				context: {
					user,
					session: {
						activeOrganizationId,
						activeLearnerOrganizationId,
					},
				},
				input: {
					senderType,
					recipientType,
					id,
					connectStatus,
					connectToId,
				},
			}) => {
				// USER INVITE RESPONSE
				if (recipientType === "user") {
					if (!activeLearnerOrganizationId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// USER COURSE INVITE
					if (senderType === "course") {
						await db
							.update(usersToCourses)
							.set({
								connectStatus,
							})
							.where(
								and(
									eq(usersToCourses.userId, user.id),
									eq(
										usersToCourses.organizationId,
										activeLearnerOrganizationId,
									),
									eq(usersToCourses.courseId, id),
									eq(usersToCourses.connectType, "invite"),
								),
							);
					}

					// USER COLLECTION INVITE
					if (senderType === "collection") {
						await db
							.update(usersToCollections)
							.set({
								connectStatus,
							})
							.where(
								and(
									eq(usersToCollections.userId, user.id),
									eq(
										usersToCollections.organizationId,
										activeLearnerOrganizationId,
									),
									eq(usersToCollections.collectionId, id),
									eq(
										usersToCollections.connectType,
										"invite",
									),
								),
							);
					}

					// TEAM INVITE
					if (senderType === "team") {
						await db
							.update(usersToTeams)
							.set({
								connectStatus,
							})
							.where(
								and(
									eq(usersToTeams.userId, user.id),
									eq(usersToTeams.organizationId, id),
									eq(usersToTeams.connectType, "invite"),
								),
							);
					}
				}

				// TEAM INVITE RESPONSE
				if (recipientType === "team") {
					if (!activeOrganizationId || !connectToId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// TEAM COURSE INVITE
					if (senderType === "course") {
						await db
							.update(organizationsToCourses)
							.set({
								connectStatus,
							})
							.where(
								and(
									eq(
										organizationsToCourses.fromOrganizationId,
										connectToId,
									),
									eq(
										organizationsToCourses.organizationId,
										activeOrganizationId,
									),
									eq(organizationsToCourses.courseId, id),
								),
							);
					}
				}

				// COURSE REQUEST RESPONSE
				if (recipientType === "course") {
					if (!activeOrganizationId || !connectToId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// REQUEST FROM USER
					if (senderType === "user") {
						await db
							.update(usersToCourses)
							.set({
								connectStatus,
							})
							.where(
								and(
									eq(
										usersToCourses.organizationId,
										activeOrganizationId,
									),
									eq(usersToCourses.courseId, id),
									eq(usersToCourses.userId, connectToId),
								),
							);
					}

					// REQUEST FROM TEAM
					if (senderType === "team") {
						await db
							.update(organizationsToCourses)
							.set({
								connectStatus,
							})
							.where(
								and(
									eq(
										organizationsToCourses.fromOrganizationId,
										activeOrganizationId,
									),
									eq(
										organizationsToCourses.organizationId,
										connectToId,
									),
									eq(organizationsToCourses.courseId, id),
								),
							);
					}
				}

				// COLLECTION REQUEST RESPONSE
				if (recipientType === "collection") {
					if (!activeOrganizationId || !connectToId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					if (senderType === "user") {
						await db
							.update(usersToCollections)
							.set({
								connectStatus,
							})
							.where(
								and(
									eq(
										usersToCollections.organizationId,
										activeOrganizationId,
									),
									eq(usersToCollections.collectionId, id),
									eq(usersToCollections.userId, connectToId),
								),
							);
					}
				}
			},
		),
	delete: protectedProcedure
		.route({
			tags: ["Connection"],
			method: "DELETE",
			path: "/",
			summary: "Delete Connection",
		})
		.input(
			SelectConnectionSchema.extend({
				connectToId: z.string().optional(),
			}),
		)
		.output(z.null())
		.handler(
			async ({
				context: {
					session: { activeOrganizationId },
				},
				input: { senderType, recipientType, id, connectToId },
			}) => {
				// USER INVITE
				if (recipientType === "user") {
					if (!activeOrganizationId || !connectToId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// USER COURSE INVITE
					if (senderType === "course") {
						await db
							.delete(usersToCourses)
							.where(
								and(
									eq(usersToCourses.courseId, id),
									eq(
										usersToCourses.organizationId,
										activeOrganizationId,
									),
									eq(usersToCourses.userId, connectToId),
								),
							);
						return null;
					}

					// USER COLLECTION INVITE
					if (senderType === "collection") {
						await db
							.delete(usersToCollections)
							.where(
								and(
									eq(usersToCollections.collectionId, id),
									eq(
										usersToCollections.organizationId,
										activeOrganizationId,
									),
									eq(usersToCollections.userId, connectToId),
								),
							);
						return null;
					}
				}

				if (senderType === "team") {
					if (!activeOrganizationId || !connectToId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// TEAM COURSE INVITE
					if (recipientType === "course") {
						await db
							.delete(organizationsToCourses)
							.where(
								and(
									eq(
										organizationsToCourses.fromOrganizationId,
										activeOrganizationId,
									),
									eq(
										organizationsToCourses.organizationId,
										connectToId,
									),
									eq(organizationsToCourses.courseId, id),
								),
							);
						// Remove from collections
						const collectionList =
							await db.query.collections.findMany({
								where: eq(
									collections.organizationId,
									connectToId,
								),
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
						return null;
					}
				}

				throw new ORPCError("NOT_FOUND");
			},
		),
});
