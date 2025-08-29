import z from "zod";
import { protectedProcedure } from "../middleware";
import { db } from "../db";
import {
	collections,
	collectionsToCourses,
	courses,
	teams,
	teamsToCourses,
	usersToCollections,
	usersToCourses,
} from "../db/schema";
import { ORPCError } from "@orpc/client";
import { env } from "../env";
import { and, eq, inArray } from "drizzle-orm";
import { hasTeamAccess } from "../lib/access";
import { getConnectionLink, getUserList } from "../lib/connection";
import type { ConnectionType } from "@/types/connections";
import { createTranslator, handleLocalization, locales } from "@/lib/locale";
import Invite from "@/components/emails/Invite";
import { sendEmail, verifyEmail } from "../lib/email";
import { teamImageUrl } from "@/lib/file";

const SelectConnectionSchema = z.object({
	senderType: z.enum(["user", "team", "collection", "course"]),
	recipientType: z.enum(["user", "team", "collection", "course"]),
	id: z.string(),
});

const CreateConnectionSchema = SelectConnectionSchema.extend({
	emails: z.email().toLowerCase().array().optional(),
	teamIds: z.string().array().optional(),
});

export const connectionRouter = {
	getOne: protectedProcedure
		.route({ method: "GET", path: "/connections" })
		.input(SelectConnectionSchema)
		.handler(
			async ({
				context: { user, learnerTeamId, teamId },
				input: { senderType, recipientType, id },
			}) => {
				if (senderType === "user") {
					if (!learnerTeamId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// USER COURSE
					if (recipientType === "course") {
						await hasTeamAccess({
							teamId: learnerTeamId,
							type: "course",
							id,
						});

						const connection =
							await db.query.usersToCourses.findFirst({
								where: and(
									eq(usersToCourses.userId, user.id),
									eq(usersToCourses.courseId, id),
									eq(usersToCourses.teamId, learnerTeamId),
								),
							});

						// If the user is a member of the collection, they are allowed to access to the course
						if (!connection) {
							const connection =
								await db.query.usersToCollections.findFirst({
									where: and(
										eq(usersToCollections.userId, user.id),
										eq(
											usersToCollections.teamId,
											learnerTeamId,
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
										usersToCollections.teamId,
										learnerTeamId,
									),
								),
							});

						return connection ?? null;
					}
				}

				if (senderType === "team") {
					if (!teamId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// TEAM COURSE INVITE
					if (recipientType === "course") {
						const connection =
							await db.query.teamsToCourses.findFirst({
								where: and(
									eq(teamsToCourses.teamId, teamId),
									eq(teamsToCourses.courseId, id),
								),
							});

						return connection ?? null;
					}
				}

				throw new ORPCError("NOT_FOUND");
			},
		),
	create: protectedProcedure
		.route({ method: "POST", path: "/connections" })
		.input(CreateConnectionSchema)
		.output(z.null())
		.handler(
			async ({
				context: { user, learnerTeamId, teamId },
				input: { senderType, recipientType, id, emails, teamIds },
			}) => {
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
					if (!learnerTeamId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// USER COURSE REQUEST
					if (recipientType === "course") {
						await db
							.insert(usersToCourses)
							.values({
								userId: user.id,
								teamId: learnerTeamId,
								connectType: "request",
								connectStatus:
									learnerTeamId !== env.WELCOME_TEAM_ID
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
								teamId: learnerTeamId,
								connectType: "request",
								connectStatus:
									learnerTeamId !== env.WELCOME_TEAM_ID
										? "pending"
										: "accepted",
								collectionId: id,
							})
							.onConflictDoNothing();
					}
				}

				if (senderType === "team") {
					if (!teamId) {
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
						await db.insert(teamsToCourses).values({
							fromTeamId: course.teamId,
							teamId,
							courseId: id,
							connectType: "request" as const,
							connectStatus: "pending" as const,
						});
					}
				}

				// INVITE
				if (senderType === "course") {
					if (!teamId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// INVITE TO COURSE
					if (recipientType === "user") {
						await hasTeamAccess({
							teamId,
							type: "course",
							id,
						});

						const team = (await db.query.teams.findFirst({
							where: eq(teams.id, teamId),
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
									teamId,
									courseId: id,
									connectType:
										"invite" as ConnectionType["connectType"],
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
										const localizedCourse =
											handleLocalization(
												{ locale: locale.value },
												course,
											);
										const localizedTeam =
											handleLocalization(
												{ locale: locale.value },
												team,
											);
										const href = await getConnectionLink({
											teamId,
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
											logo: teamImageUrl(
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
										? handleLocalization(
												{ locale: "en" },
												team,
											)
										: undefined,
								});
							}),
						);
					}

					// INVITE TO TEAM
					if (recipientType === "team") {
						if (teamIds!.includes(teamId)) {
							throw new Error("You cannot include your own team");
						}

						await hasTeamAccess({
							teamId,
							type: "course",
							id,
							access: "root",
						});

						await db.insert(teamsToCourses).values(
							teamIds!.map((otherTeamId) => ({
								fromTeamId: teamId,
								teamId: otherTeamId,
								courseId: id,
								connectType: "invite" as const,
								connectStatus: "pending" as const,
							})),
						);

						return null;
					}
				}

				if (senderType === "collection") {
					if (!teamId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// INVITE TO COLLECTION
					if (recipientType === "user") {
						await hasTeamAccess({
							teamId,
							type: "collection",
							id,
						});

						const team = (await db.query.teams.findFirst({
							where: eq(teams.id, teamId),
							with: {
								translations: true,
								domains: true,
							},
						}))!;

						const userList = await getUserList({ emails: emails! });

						const collection = await db.query.collections.findFirst(
							{
								where: and(
									eq(collections.id, id),
									eq(collections.teamId, teamId),
								),
								with: {
									translations: true,
								},
							},
						);

						if (!collection) {
							throw new ORPCError("NOT_FOUND");
						}

						await db
							.insert(usersToCollections)
							.values(
								userList.map((u) => ({
									userId: u.id,
									teamId,
									collectionId: id,
									connectType:
										"invite" as ConnectionType["connectType"],
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
									eq(
										usersToCollections.connectType,
										"request",
									),
									eq(
										usersToCollections.connectStatus,
										"pending",
									),
								),
							});

						const emailVerified = await verifyEmail(team.domains);

						await Promise.all([
							userList.map(async (user) => {
								const content = await Promise.all(
									locales.map(async (locale) => {
										const localizedCollection =
											handleLocalization(
												{ locale: locale.value },
												collection,
											);
										const localizedTeam =
											handleLocalization(
												{ locale: locale.value },
												team,
											);
										const href = await getConnectionLink({
											teamId,
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
											logo: teamImageUrl(
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
										? handleLocalization(
												{ locale: "en" },
												team,
											)
										: undefined,
								});
							}),
						]);
					}
				}

				return null;
			},
		),
	update: protectedProcedure
		.route({ method: "PUT", path: "/connections" })
		.input(
			SelectConnectionSchema.extend({
				connectToId: z.string().optional(),
				connectStatus: z.enum(["accepted", "rejected"]),
			}),
		)
		.handler(
			async ({
				context: { user, learnerTeamId, teamId },
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
					if (!learnerTeamId) {
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
									eq(usersToCourses.teamId, learnerTeamId),
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
										usersToCollections.teamId,
										learnerTeamId,
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
									eq(usersToTeams.teamId, id),
									eq(usersToTeams.connectType, "invite"),
								),
							);
					}
				}

				// TEAM INVITE RESPONSE
				if (recipientType === "team") {
					if (!teamId || !connectToId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// TEAM COURSE INVITE
					if (senderType === "course") {
						await db
							.update(teamsToCourses)
							.set({
								connectStatus,
							})
							.where(
								and(
									eq(teamsToCourses.fromTeamId, connectToId),
									eq(teamsToCourses.teamId, teamId),
									eq(teamsToCourses.courseId, id),
								),
							);
					}
				}

				// COURSE REQUEST RESPONSE
				if (recipientType === "course") {
					if (!teamId || !connectToId) {
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
									eq(usersToCourses.teamId, teamId),
									eq(usersToCourses.courseId, id),
									eq(usersToCourses.userId, connectToId),
								),
							);
					}

					// REQUEST FROM TEAM
					if (senderType === "team") {
						await db
							.update(teamsToCourses)
							.set({
								connectStatus,
							})
							.where(
								and(
									eq(teamsToCourses.fromTeamId, teamId),
									eq(teamsToCourses.teamId, connectToId),
									eq(teamsToCourses.courseId, id),
								),
							);
					}
				}

				// COLLECTION REQUEST RESPONSE
				if (recipientType === "collection") {
					if (!teamId || !connectToId) {
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
									eq(usersToCollections.teamId, teamId),
									eq(usersToCollections.collectionId, id),
									eq(usersToCollections.userId, connectToId),
								),
							);
					}
				}
			},
		),
	delete: protectedProcedure
		.route({ method: "DELETE", path: "/connections" })
		.input(
			SelectConnectionSchema.extend({
				connectToId: z.string().optional(),
			}),
		)
		.output(z.null())
		.handler(
			async ({
				context: { teamId },
				input: { senderType, recipientType, id, connectToId },
			}) => {
				// USER INVITE
				if (recipientType === "user") {
					if (!teamId || !connectToId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// USER COURSE INVITE
					if (senderType === "course") {
						await db
							.delete(usersToCourses)
							.where(
								and(
									eq(usersToCourses.courseId, id),
									eq(usersToCourses.teamId, teamId),
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
									eq(usersToCollections.teamId, teamId),
									eq(usersToCollections.userId, connectToId),
								),
							);
						return null;
					}
				}

				if (senderType === "team") {
					if (!teamId || !connectToId) {
						throw new ORPCError("UNAUTHORIZED");
					}

					// TEAM COURSE INVITE
					if (recipientType === "course") {
						await db
							.delete(teamsToCourses)
							.where(
								and(
									eq(teamsToCourses.fromTeamId, teamId),
									eq(teamsToCourses.courseId, id),
									eq(teamsToCourses.teamId, connectToId),
								),
							);
						// Remove from collections
						const collectionList =
							await db.query.collections.findMany({
								where: eq(collections.teamId, connectToId),
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
};
