import { db } from "@/server/db";
import { publicProcedure, teamProcedure } from "../middleware";
import { z } from "zod";
import { ORPCError } from "@orpc/client";
import { CourseFormSchema, CourseSchema } from "@/types/course";
import { TeamSchema } from "@/types/team";
import { s3 } from "../s3";
import { hasTeamAccess } from "../lib/access";
import {
	collectionsToCourses,
	courseTranslations,
	courses,
	modules,
	teamsToCourses,
	users,
	usersToCollections,
	usersToCourses,
	usersToModules,
} from "@/server/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { handleLocalization } from "@/lib/locale";
import { ExtendLearner, learnerStatuses } from "@/types/learner";
import { env } from "../env";
import { ModuleSchema } from "@/types/module";
import { shouldIgnoreFile, validateModule } from "@/lib/module";
import { getNewModuleVersionNumber } from "../lib/modules";
import { getConnectionLink } from "../lib/connection";

export const courseRouter = {
	get: teamProcedure()
		.route({ method: "GET", path: "/courses" })
		.output(CourseSchema.array())
		.handler(async ({ context }) => {
			const courseList = await db.query.courses.findMany({
				where: eq(courses.teamId, context.teamId),
				with: {
					translations: true,
				},
			});

			const connections = await db.query.teamsToCourses.findMany({
				where: and(eq(teamsToCourses.teamId, context.teamId)),
				with: {
					course: {
						with: {
							translations: true,
						},
					},
				},
			});

			return [
				...courseList,
				...connections.map(({ course, ...connect }) => ({
					...course,
					connection: {
						connectStatus: connect.connectStatus,
						connectType: connect.connectType,
					},
				})),
			].map((course) => handleLocalization(context, course));
		}),
	create: teamProcedure()
		.route({ method: "POST", path: "/courses" })
		.input(CourseFormSchema)
		.output(z.object({ courseId: z.string() }))
		.handler(async ({ context: { teamId, locale }, input }) => {
			const courseId = Bun.randomUUIDv7();

			await db.insert(courses).values({
				id: courseId,
				teamId,
				completionStatus: input.completionStatus,
			});

			await db.insert(courseTranslations).values({
				courseId,
				name: input.name,
				description: input.description,
				locale,
			});

			return { courseId };
		}),
	id: publicProcedure
		.route({ method: "GET", path: "/courses/{id}" })
		.input(
			z.object({
				id: z.string().min(1),
			}),
		)
		.output(
			CourseSchema.extend({
				team: TeamSchema,
			}),
		)
		.handler(async ({ context, input: { id } }) => {
			console.log("ID", id);
			const course = await db.query.courses.findFirst({
				where: and(eq(courses.id, id)),
				with: {
					translations: true,
					team: {
						with: {
							translations: true,
						},
					},
				},
			});

			if (!course) {
				throw new ORPCError("NOT_FOUND");
			}

			return {
				...handleLocalization(context, course),
				team: handleLocalization(context, course.team),
			};
		}),
	update: teamProcedure()
		.route({ method: "PUT", path: "/courses/{id}" })
		.input(
			CourseFormSchema.extend({
				id: z.string().min(1),
			}),
		)
		.handler(async ({ context: { teamId, locale }, input }) => {
			const id = input.id;
			await hasTeamAccess({
				type: "course",
				id,
				teamId,
				access: "root",
			});

			await db
				.update(courses)
				.set({
					completionStatus: input.completionStatus,
				})
				.where(eq(courses.id, id));

			await db
				.insert(courseTranslations)
				.values({
					courseId: id,
					name: input.name,
					description: input.description,
					locale,
				})
				.onConflictDoUpdate({
					set: {
						...input,
						updatedAt: new Date(),
					},
					target: [
						courseTranslations.courseId,
						courseTranslations.locale,
					],
				});

			return input;
		}),
	delete: teamProcedure()
		.route({ method: "DELETE", path: "/courses/{id}" })
		.input(
			z.object({
				id: z.string().min(1),
			}),
		)
		.handler(async ({ context, input: { id } }) => {
			await hasTeamAccess({
				type: "course",
				id,
				teamId: context.teamId,
				access: "root",
			});

			await db
				.delete(courses)
				.where(
					and(eq(courses.id, id), eq(courses.teamId, context.teamId)),
				);

			const files = await s3.list({
				prefix: `${context.teamId}/courses/${id}/`,
				maxKeys: 1000,
			});
			if (files.contents) {
				await Promise.all(
					files.contents.map((file) => {
						s3.delete(file.key);
					}),
				);
			}

			return null;
		}),
	learners: teamProcedure()
		.route({ method: "GET", path: "/courses/{id}/learners" })
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ context, input: { id } }) => {
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
		}),
	sharedTeams: teamProcedure()
		.route({ method: "GET", path: "/courses/{id}/shared-teams" })
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.output(TeamSchema.array())
		.handler(async ({ context, input: { id } }) => {
			const connections = await db.query.teamsToCourses.findMany({
				where: and(
					eq(teamsToCourses.fromTeamId, context.teamId),
					id ? eq(teamsToCourses.courseId, id) : undefined,
				),
				with: {
					team: {
						with: {
							translations: true,
						},
					},
				},
			});

			return connections.map((connect) => ({
				...handleLocalization(context, connect.team),
				connection: {
					connectStatus: connect.connectStatus,
					connectType: connect.connectType,
				},
			}));
		}),
	statistics: teamProcedure()
		.route({ method: "GET", path: "/courses/{id}/statistics" })
		.input(
			z.object({
				id: z.string(),
				teamId: z.string().optional(),
			}),
		)
		.output(
			z.object({
				total: z.number(),
				completed: z.number(),
				completedPercent: z.string().optional(),
				completedTimeAverage: z.string().optional(),
				charts: z.object({
					status: z.array(
						z.object({
							name: z.string(),
							value: z.number(),
						}),
					),
				}),
			}),
		)
		.handler(async ({ context, input: { id, teamId: customTeamId } }) => {
			const access = await hasTeamAccess({
				type: "course",
				id: id,
				teamId: context.teamId,
			});

			const teamId = access === "shared" ? context.teamId : customTeamId;

			const course = await db.query.courses.findFirst({
				where: and(
					eq(courses.id, id),
					teamId ? eq(courses.teamId, teamId) : undefined,
				),
			});

			if (!course) {
				throw new ORPCError("NOT_FOUND");
			}

			// First, get all user IDs connected to the course (directly or via collections)
			const directUserIds = await db
				.select({ userId: usersToCourses.userId })
				.from(usersToCourses)
				.where(
					and(
						eq(usersToCourses.courseId, id),
						eq(usersToCourses.connectStatus, "accepted"),
						teamId ? eq(usersToCourses.teamId, teamId) : undefined,
					),
				);
			const collectionUserIds = await db
				.select({ userId: usersToCollections.userId })
				.from(usersToCollections)
				.innerJoin(
					collectionsToCourses,
					eq(
						usersToCollections.collectionId,
						collectionsToCourses.collectionId,
					),
				)
				.where(
					and(
						eq(collectionsToCourses.courseId, id),
						eq(usersToCollections.connectStatus, "accepted"),
						teamId
							? eq(usersToCollections.teamId, teamId)
							: undefined,
					),
				);

			// Combine all user IDs and remove duplicates
			const allUserIds = [
				...directUserIds.map((u) => u.userId),
				...collectionUserIds.map((u) => u.userId),
			];
			const uniqueUserIds = [...new Set(allUserIds)];

			const attemptList = await db.query.usersToModules.findMany({
				where: and(
					eq(usersToModules.courseId, id),
					inArray(usersToModules.userId, uniqueUserIds),
					teamId ? eq(usersToModules.teamId, teamId) : undefined,
				),
				with: {
					module: true,
				},
			});

			const attempts = attemptList.map((attempt) =>
				ExtendLearner(attempt.module.type).parse(attempt),
			);

			const total = attempts.length;
			const completed = attempts.filter((l) => !!l.completedAt).length;
			const totalCompletionTimeSeconds = attempts.reduce(
				(acc, learner) => {
					if (learner.completedAt) {
						return (
							acc +
							(learner.completedAt.getTime() -
								learner.createdAt.getTime()) /
								1000
						);
					}
					return acc;
				},
				0,
			);

			return {
				total,
				completed,
				completedPercent:
					completed > 0
						? ((completed / total) * 100).toFixed(0)
						: undefined,
				completedTimeAverage:
					completed > 0
						? (totalCompletionTimeSeconds / 60 / completed).toFixed(
								1,
							)
						: undefined,
				charts: {
					status: attempts.reduce(
						(acc, learner) => {
							const index = learnerStatuses.indexOf(
								learner.status,
							);
							if (index !== -1) {
								acc[index].value += 1;
							}
							return acc;
						},
						learnerStatuses.map((status) => ({
							name: status,
							value: 0,
						})),
					),
				},
			};
		}),
	available: teamProcedure()
		.route({ method: "GET", path: "/courses/available" })
		.output(CourseSchema.array())
		.handler(async ({ context }) => {
			if (context.learnerTeamId !== env.WELCOME_TEAM_ID) return [];
			// TODO: Allow learner team members to access available courses (or something else)
			const courseList = await db.query.courses.findMany({
				where: eq(courses.teamId, context.learnerTeamId),
				with: {
					translations: true,
				},
			});

			return courseList.map((course) =>
				handleLocalization(context, course),
			);
		}),
	connection: {
		link: teamProcedure()
			.route({ method: "GET", path: "/courses/{id}/link" })
			.input(
				z.object({
					id: z.string(),
				}),
			)
			.output(z.string())
			.handler(async ({ context, input: { id } }) => {
				return await getConnectionLink({
					type: "course",
					id,
					teamId: context.teamId,
					locale: context.locale,
				});
			}),
	},
	modules: {
		get: teamProcedure()
			.route({ method: "GET", path: "/courses/{id}/modules" })
			.input(
				z.object({
					id: z.string(),
				}),
			)
			.output(ModuleSchema.array())
			.handler(async ({ input: { id } }) => {
				const moduleList = await db.query.modules.findMany({
					where: and(eq(modules.courseId, id)),
					orderBy: desc(modules.versionNumber),
				});

				return moduleList;
			}),
		presign: teamProcedure()
			.route({ method: "POST", path: "/courses/{id}/modules/presign" })
			.input(
				z.object({
					id: z.string(),
				}),
			)
			.output(z.string())
			.handler(async ({ context, input: { id } }) => {
				await hasTeamAccess({
					id: id,
					type: "course",
					teamId: context.teamId,
					access: "root",
				});

				const versionNumber = await getNewModuleVersionNumber(
					context.locale,
					id,
				);

				const url = s3.presign(
					`${context.teamId}/courses/${id}/tmp/${context.locale}${versionNumber > 1 ? `_${versionNumber}` : ""}.zip`,
					{
						expiresIn: 3600,
						method: "PUT",
						type: "application/zip",
					},
				);

				return url;
			}),
		create: teamProcedure()
			.route({ method: "POST", path: "/courses/{id}/modules" })
			.input(
				z.object({
					id: z.string(),
				}),
			)
			.output(z.object({ id: z.string() }))
			.handler(async ({ context, input: { id } }) => {
				await hasTeamAccess({
					id,
					type: "course",
					teamId: context.teamId,
					access: "root",
				});

				const versionNumber = await getNewModuleVersionNumber(
					context.locale,
					id,
				);

				const moduleFile = s3.file(
					`${context.teamId}/courses/${id}/tmp/${context.locale}${versionNumber > 1 ? `_${versionNumber}` : ""}.zip`,
				);

				const exists = await moduleFile.exists();
				if (!exists) {
					throw new ORPCError("NOT_FOUND", {
						message: "Module file not found",
					});
				}

				try {
					const { entries, type } = await validateModule(
						await moduleFile.arrayBuffer(),
					);
					const insertId = Bun.randomUUIDv7();

					await db.insert(modules).values({
						id: insertId,
						courseId: id,
						type,
						locale: context.locale,
						versionNumber,
					});

					Promise.all(
						Object.entries(entries).map(async ([key, file]) => {
							if (shouldIgnoreFile(key)) {
								return;
							}
							const blob = await file.blob();
							s3.write(
								`${context.teamId}/courses/${id}/${context.locale}${versionNumber > 1 ? `_${versionNumber}` : ""}/${key}`,
								blob,
							);
						}),
					);

					return { id: insertId };
				} catch (error) {
					await moduleFile.delete();
					throw error;
				} finally {
					await moduleFile.delete();
				}
			}),
		delete: teamProcedure()
			.route({
				method: "DELETE",
				path: "/courses/{id}/modules/{moduleId}",
			})
			.input(
				z.object({
					id: z.string(),
					moduleId: z.string(),
				}),
			)
			.handler(async ({ context, input: { id, moduleId } }) => {
				const teamId = context.teamId;

				const moduleExists = await db.query.modules.findFirst({
					where: and(
						eq(modules.id, moduleId),
						eq(modules.courseId, id),
					),
					with: {
						course: true,
					},
				});

				if (!moduleExists) {
					throw new ORPCError("NOT_FOUND");
				}

				// If module is not owned by the team
				if (moduleExists.course.teamId !== teamId) {
					throw new ORPCError("UNAUTHORIZED");
				}

				await db
					.delete(modules)
					.where(
						and(eq(modules.id, moduleId), eq(modules.courseId, id)),
					);

				const files = await s3.list({
					prefix: `${teamId}/courses/${id}/${moduleExists.locale}${moduleExists.versionNumber > 1 ? `_${moduleExists.versionNumber}` : ""}/`,
					maxKeys: 1000,
				});
				if (files.contents) {
					await Promise.all(
						files.contents.map((file) => {
							s3.delete(file.key);
						}),
					);
				}

				return null;
			}),
	},
};
