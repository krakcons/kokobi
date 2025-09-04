import { base, learnerProcedure } from "../middleware";
import { db } from "@/server/db";
import {
	courses,
	modules,
	organizations,
	usersToCollections,
	usersToCourses,
	usersToModules,
} from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { createTranslator, handleLocalization } from "@/lib/locale";
import { CourseSchema } from "@/types/course";
import { env } from "../env";
import z from "zod";
import {
	ExtendLearner,
	LearnerSchema,
	LearnerUpdateSchema,
} from "@/types/learner";
import { ModuleSchema } from "@/types/module";
import { parseIMSManifest } from "../lib/modules";
import { hasUserAccess } from "../lib/access";
import { getInitialScormData, isModuleSuccessful } from "@/lib/scorm";
import { getConnectionLink } from "../lib/connection";
import CourseCompletion from "@/components/emails/CourseCompletion";
import { sendEmail, verifyEmail } from "../lib/email";
import { teamImageUrl } from "@/lib/file";
import { ORPCError } from "@orpc/client";
import { s3 } from "../s3";
import type { Organization } from "@/types/team";
import { setCookie } from "@tanstack/react-start/server";

export const learnerRouter = base.prefix("/learner").router({
	organization: {
		get: learnerProcedure
			.route({
				tags: ["Learner"],
				method: "GET",
				path: "/organizations",
				summary: "Get Organizations",
			})
			.handler(async ({ context }) => {
				let learnerTeam = undefined;
				if (context.session.activeLearnerTeamId) {
					learnerTeam = await db.query.organizations.findFirst({
						where: eq(
							organizations.id,
							context.session.activeLearnerTeamId,
						),
						with: {
							translations: true,
						},
					});
				}
				const welcomeOrganization =
					await db.query.organizations.findFirst({
						where: eq(organizations.id, env.WELCOME_TEAM_ID),
						with: {
							translations: true,
						},
					});
				const courseTeams = await db.query.usersToCourses.findMany({
					where: eq(usersToCourses.userId, context.user.id),
					with: {
						organization: {
							with: {
								translations: true,
							},
						},
					},
				});
				const collectionTeams =
					await db.query.usersToCollections.findMany({
						where: eq(usersToCollections.userId, context.user.id),
						with: {
							organization: {
								with: {
									translations: true,
								},
							},
						},
					});

				return [
					...(learnerTeam ? [learnerTeam] : []),
					...(welcomeOrganization ? [welcomeOrganization] : []),
					...collectionTeams.map(({ organization }) => organization),
					...courseTeams.map(({ organization }) => organization),
				]
					.map((o) => handleLocalization(context, o))
					.reduce(
						(acc, o) =>
							acc.find((t) => t.id === o.organizationId)
								? acc
								: [...acc, o],
						[] as Organization[],
					);
			}),
		update: learnerProcedure
			.route({
				tags: ["Learner"],
				method: "PUT",
				path: "/organizations",
				summary: "Update Organization",
			})
			.input(
				z.object({
					id: z.string(),
				}),
			)
			.handler(async ({ input: { id } }) => {
				setCookie("learnerTeamId", id);
			}),
		current: learnerProcedure
			.route({
				tags: ["Learner"],
				method: "GET",
				path: "/current",
				summary: "Get Current Organization",
			})
			.handler(async ({ context }) => {
				const organization = await db.query.organizations.findFirst({
					where: eq(
						organizations.id,
						context.session.activeLearnerTeamId,
					),
					with: {
						translations: true,
						domains: true,
					},
				});

				if (!organization) {
					throw new ORPCError("NOT_FOUND");
				}

				return handleLocalization(context, organization);
			}),
	},
	course: {
		get: learnerProcedure
			.route({
				tags: ["Learner"],
				method: "GET",
				path: "/courses",
				summary: "Get Courses",
			})
			.handler(async ({ context }) => {
				const connections = await db.query.usersToCourses.findMany({
					where: and(
						eq(usersToCourses.userId, context.user.id),
						eq(
							usersToCourses.organizationId,
							context.session.activeLearnerTeamId,
						),
					),
					with: {
						course: {
							with: {
								translations: true,
							},
						},
						organization: {
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
					organization: handleLocalization(
						context,
						connection.organization,
					),
				}));
			}),
		available: learnerProcedure
			.route({
				tags: ["Learner"],
				method: "GET",
				path: "/courses/available",
				summary: "Get Available Courses",
			})
			.output(CourseSchema.array())
			.handler(async ({ context }) => {
				if (context.session.activeLearnerTeamId !== env.WELCOME_TEAM_ID)
					return [];
				// TODO: Allow learner team members to access available courses (or something else)
				const courseList = await db.query.courses.findMany({
					where: eq(
						courses.organizationId,
						context.session.activeLearnerTeamId,
					),
					with: {
						translations: true,
					},
				});

				return courseList.map((course) =>
					handleLocalization(context, course),
				);
			}),
		attempt: {
			get: learnerProcedure
				.route({
					tags: ["Learner"],
					method: "GET",
					path: "/courses/{id}/attempts",
					summary: "Get Attempts",
				})
				.input(z.object({ id: z.string() }))
				.output(
					LearnerSchema.extend({
						module: ModuleSchema,
					}).array(),
				)
				.handler(async ({ context, input: { id } }) => {
					const user = context.user;

					const moduleList = await db.query.usersToModules.findMany({
						where: and(
							eq(usersToModules.userId, user.id),
							eq(usersToModules.courseId, id),
							eq(
								usersToModules.organizationId,
								context.session.activeLearnerTeamId,
							),
						),
						with: {
							module: true,
						},
					});

					return moduleList.map((attempt) => ({
						...ExtendLearner(attempt.module.type).parse(attempt),
						module: attempt.module,
					}));
				}),
			id: learnerProcedure
				.route({
					tags: ["Learner"],
					method: "GET",
					path: "/courses/{id}/attempts/{attemptId}",
					summary: "Get Attempt",
				})
				.input(z.object({ id: z.string(), attemptId: z.string() }))
				.output(
					LearnerSchema.extend({
						meta: z.object({
							url: z.string(),
							type: ModuleSchema.shape.type,
						}),
					}),
				)
				.handler(async ({ context, input: { id, attemptId } }) => {
					const attempt = await db.query.usersToModules.findFirst({
						where: and(
							eq(usersToModules.courseId, id),
							eq(usersToModules.id, attemptId),
							eq(usersToModules.userId, context.user.id),
							eq(
								usersToModules.organizationId,
								context.session.activeLearnerTeamId,
							),
						),
						with: {
							module: {
								with: {
									course: true,
								},
							},
						},
					});

					if (!attempt) {
						throw new ORPCError("NOT_FOUND", {
							message: "Attempt not found",
						});
					}

					const courseFileUrl = `/${attempt.module.course.organizationId}/courses/${attempt.courseId}/${attempt.module.locale}${attempt.module.versionNumber === 1 ? "" : "_" + attempt.module.versionNumber}`;

					const imsManifest = s3.file(
						courseFileUrl + "/imsmanifest.xml",
					);

					const { scorm, resources } =
						await parseIMSManifest(imsManifest);

					return {
						...ExtendLearner(attempt.module.type).parse(attempt),
						meta: {
							url: `/cdn${courseFileUrl}/${resources[0].href}`,
							type: scorm.metadata.schemaversion,
						},
					};
				}),
			create: learnerProcedure
				.route({
					tags: ["Learner"],
					method: "POST",
					path: "/courses/{id}/attempts",
					summary: "Create Attempt",
				})
				.input(
					z.object({
						id: z.string(),
					}),
				)
				.handler(async ({ context, input: { id } }) => {
					await hasUserAccess({
						type: "course",
						id,
						userId: context.user.id,
						organizationId: context.session.activeLearnerTeamId,
					});

					const moduleList = await db.query.modules.findMany({
						where: eq(modules.courseId, id),
						orderBy: desc(modules.createdAt),
					});

					if (moduleList.length === 0) {
						throw new ORPCError("NOT_FOUND");
					}

					const module =
						moduleList.find((m) => m.locale === context.locale) ??
						moduleList[0];

					const attemptId = Bun.randomUUIDv7();
					await db.insert(usersToModules).values({
						id: attemptId,
						userId: context.user.id,
						organizationId: context.session.activeLearnerTeamId,
						moduleId: module.id,
						courseId: id,
						data: getInitialScormData(module.type),
					});

					return attemptId;
				}),
			update: learnerProcedure
				.route({
					tags: ["Learner"],
					method: "PUT",
					path: "/courses/{id}/attempts/{attemptId}",
					summary: "Update Attempt",
				})
				.input(
					LearnerUpdateSchema.extend({
						id: z.string(),
						attemptId: z.string(),
					}),
				)
				.output(LearnerSchema)
				.handler(
					async ({ context, input: { attemptId, id, data } }) => {
						try {
							await hasUserAccess({
								type: "course",
								id,
								userId: context.user.id,
								organizationId:
									context.session.activeLearnerTeamId,
							});

							const attempt =
								await db.query.usersToModules.findFirst({
									where: and(
										eq(usersToModules.courseId, id),
										eq(usersToModules.id, attemptId),
										eq(
											usersToModules.userId,
											context.user.id,
										),
										eq(
											usersToModules.organizationId,
											context.session.activeLearnerTeamId,
										),
									),
									with: {
										module: true,
										course: {
											with: {
												translations: true,
											},
										},
									},
								});

							if (!attempt) {
								throw new ORPCError("NOT_FOUND", {
									message: "Attempt not found.",
								});
							}
							if (attempt.completedAt) {
								return LearnerSchema.parse(attempt);
							}

							// UPDATE LEARNER
							let completedAt = undefined;
							if (data) {
								// Send communications in the locale of the module
								const communicationLocale =
									attempt.module.locale;
								const newLearner = ExtendLearner(
									attempt.module.type,
								).parse({
									...attempt,
									data,
								});

								const isComplete = [
									"failed",
									"completed",
									"passed",
								].includes(newLearner.status);
								const isSuccess = isModuleSuccessful({
									completionStatus:
										attempt.course.completionStatus,
									status: newLearner.status,
								});
								const justCompleted =
									!attempt.completedAt && isComplete;

								completedAt =
									attempt.module && justCompleted
										? new Date()
										: attempt.completedAt;

								if (justCompleted && isSuccess) {
									const teamBase =
										await db.query.organizations.findFirst({
											where: eq(
												organizations.id,
												context.session
													.activeLearnerTeamId,
											),
											with: {
												translations: true,
												domains: true,
											},
										});
									const team = handleLocalization(
										{ locale: communicationLocale },
										teamBase!,
									);
									const course = handleLocalization(
										{ locale: communicationLocale },
										attempt.course,
									);

									const href = await getConnectionLink({
										id: course.id,
										type: "course",
										locale: course.locale,
										organizationId:
											context.session.activeLearnerTeamId,
									});

									const t = await createTranslator({
										locale: communicationLocale,
									});

									const emailVerified = await verifyEmail(
										team.domains,
									);

									await sendEmail({
										to: [context.user.email],
										subject:
											t.Email.CourseCompletion.subject,
										content: (
											<CourseCompletion
												name={course.name}
												teamName={team.name}
												logo={teamImageUrl(
													team,
													"logo",
												)}
												href={href}
												t={t.Email.CourseCompletion}
											/>
										),
										team: emailVerified ? team : undefined,
									});
								}
							}

							const newAttempt = await db
								.update(usersToModules)
								.set({
									...(data ? { data } : {}),
									...(completedAt ? { completedAt } : {}),
								})
								.where(
									and(
										eq(usersToModules.courseId, id),
										eq(usersToModules.id, attemptId),
										eq(
											usersToModules.userId,
											context.user.id,
										),
										eq(
											usersToModules.organizationId,
											context.session.activeLearnerTeamId,
										),
									),
								)
								.returning();

							return ExtendLearner(attempt.module.type).parse(
								newAttempt[0],
							);
						} catch (error) {
							console.log(error);
							throw error;
						}
					},
				),
		},
	},
	collection: {
		get: learnerProcedure
			.route({
				tags: ["Learner"],
				method: "GET",
				path: "/collections",
				summary: "Get Collections",
			})
			.handler(async ({ context }) => {
				const connections = await db.query.usersToCollections.findMany({
					where: and(
						eq(usersToCollections.userId, context.user.id),
						eq(
							usersToCollections.organizationId,
							context.session.activeLearnerTeamId,
						),
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
						organization: {
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
					organization: handleLocalization(
						context,
						connection.organization,
					),
				}));
			}),
	},
});
