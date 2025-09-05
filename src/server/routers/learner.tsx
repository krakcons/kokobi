import { base, learnerProcedure, protectedProcedure } from "../middleware";
import { db } from "@/server/db";
import {
	courses,
	modules,
	organizations,
	sessions,
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
import { organizationImageUrl } from "@/lib/file";
import { ORPCError } from "@orpc/client";
import { s3 } from "../s3";
import type { Organization } from "@/types/organization";

export const learnerRouter = base.prefix("/learner").router({
	organization: {
		get: protectedProcedure
			.route({
				tags: ["Learner"],
				method: "GET",
				path: "/organizations",
				summary: "Get Organizations",
			})
			.handler(async ({ context }) => {
				let learnerOrganization = undefined;
				if (context.session.activeLearnerOrganizationId) {
					learnerOrganization =
						await db.query.organizations.findFirst({
							where: eq(
								organizations.id,
								context.session.activeLearnerOrganizationId,
							),
							with: {
								translations: true,
							},
						});
				}
				const welcomeOrganization =
					await db.query.organizations.findFirst({
						where: eq(
							organizations.id,
							env.WELCOME_ORGANIZATION_ID,
						),
						with: {
							translations: true,
						},
					});
				const courseOrganizations =
					await db.query.usersToCourses.findMany({
						where: eq(usersToCourses.userId, context.user.id),
						with: {
							organization: {
								with: {
									translations: true,
								},
							},
						},
					});
				const collectionOrganizations =
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
					...(learnerOrganization ? [learnerOrganization] : []),
					...(welcomeOrganization ? [welcomeOrganization] : []),
					...collectionOrganizations.map(
						({ organization }) => organization,
					),
					...courseOrganizations.map(
						({ organization }) => organization,
					),
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
		update: protectedProcedure
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
			.handler(async ({ context, input: { id } }) => {
				await db
					.update(sessions)
					.set({
						activeLearnerOrganizationId: id,
					})
					.where(eq(sessions.id, context.session.id));
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
						context.session.activeLearnerOrganizationId,
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
							context.session.activeLearnerOrganizationId,
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
				if (
					context.session.activeLearnerOrganizationId !==
					env.WELCOME_ORGANIZATION_ID
				)
					return [];
				// TODO: Allow learner organization members to access available courses (or something else)
				const courseList = await db.query.courses.findMany({
					where: eq(
						courses.organizationId,
						context.session.activeLearnerOrganizationId,
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
								context.session.activeLearnerOrganizationId,
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
								context.session.activeLearnerOrganizationId,
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
						organizationId:
							context.session.activeLearnerOrganizationId,
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
						organizationId:
							context.session.activeLearnerOrganizationId,
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
									context.session.activeLearnerOrganizationId,
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
											context.session
												.activeLearnerOrganizationId,
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
									const organizationBase =
										await db.query.organizations.findFirst({
											where: eq(
												organizations.id,
												context.session
													.activeLearnerOrganizationId,
											),
											with: {
												translations: true,
												domains: true,
											},
										});
									const organization = handleLocalization(
										{ locale: communicationLocale },
										organizationBase!,
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
											context.session
												.activeLearnerOrganizationId,
									});

									const t = await createTranslator({
										locale: communicationLocale,
									});

									const emailVerified = await verifyEmail(
										organization.domains,
									);

									await sendEmail({
										to: [context.user.email],
										subject:
											t.Email.CourseCompletion.subject,
										content: (
											<CourseCompletion
												name={course.name}
												organizationName={
													organization.name
												}
												logo={organizationImageUrl(
													organization,
													"logo",
												)}
												href={href}
												t={t.Email.CourseCompletion}
											/>
										),
										organization: emailVerified
											? organization
											: undefined,
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
											context.session
												.activeLearnerOrganizationId,
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
							context.session.activeLearnerOrganizationId,
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
