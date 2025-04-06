import { db } from "@/server/db";
import {
	courses,
	modules,
	users,
	usersToCourses,
	usersToModules,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import {
	localeMiddleware,
	protectedMiddleware,
	teamMiddleware,
} from "../middleware";
import { s3 } from "@/server/s3";
import {
	ExtendLearner,
	JoinCourseFormSchema,
	LearnersFormSchema,
	LearnerUpdateSchema,
} from "@/types/learner";
import { env } from "@/server/env";
import { handleLocalization } from "@/lib/locale/helpers";
import { sendEmail } from "../email";
import { createTranslator } from "@/lib/locale/actions";
import { XMLParser } from "fast-xml-parser";
import { IMSManifestSchema, Resource } from "@/types/scorm/content";
import { S3File } from "bun";
import CourseCompletion from "@/emails/CourseCompletion";
import { getInitialScormData } from "@/lib/scorm";
import CourseInvite from "@/emails/CourseInvite";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createCourseLink } from "@/lib/invite";
import { UserToCourseType } from "@/types/connections";

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "",
});

const getAllResources = (resource: Resource | Resource[]): Resource[] => {
	const resources: Resource[] = [];

	const traverseResource = (res: Resource | Resource[]): void => {
		if (Array.isArray(res)) {
			res.forEach((subRes) => {
				resources.push(subRes);
				traverseResource(subRes);
			});
		} else if (res) {
			resources.push(res);
		}
	};

	traverseResource(resource);
	return resources;
};

const parseIMSManifest = async (file: S3File) => {
	const text = await file.text();

	if (!text) throw new Error("404");

	const parsedIMSManifest = parser.parse(text);

	const scorm = IMSManifestSchema.parse(parsedIMSManifest).manifest;

	const firstOrganization = Array.isArray(scorm.organizations.organization)
		? scorm.organizations.organization[0]
		: scorm.organizations.organization;

	const resources = getAllResources(scorm.resources.resource);

	return {
		scorm,
		firstOrganization,
		resources,
	};
};

export const inviteLearnersToCourseFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware()])
	.validator(LearnersFormSchema.extend({ courseId: z.string() }))
	.handler(async ({ context: { teamId }, data }) => {
		const course = await db.query.courses.findFirst({
			where: and(
				eq(courses.id, data.courseId),
				eq(courses.teamId, teamId),
			),
			with: {
				translations: true,
				modules: true,
				team: {
					with: {
						translations: true,
						domains: true,
					},
				},
			},
		});

		if (!course) {
			throw new Error("Course not found.");
		}

		if (course.modules.length === 0) {
			throw new Error("Course has no modules.");
		}

		const userList = await db
			.insert(users)
			.values(
				data.learners.map((l) => ({
					email: l.email,
					id: Bun.randomUUIDv7(),
					teamId,
				})),
			)
			.onConflictDoUpdate({
				target: [users.email],
				set: {
					updatedAt: new Date(),
				},
			})
			.returning();

		await db
			.insert(usersToCourses)
			.values(
				userList.map((u) => ({
					userId: u.id,
					teamId,
					courseId: data.courseId,
					connectType: "invite" as UserToCourseType["connectType"],
					connectStatus:
						"pending" as UserToCourseType["connectStatus"],
				})),
			)
			.onConflictDoNothing({
				target: [
					usersToCourses.userId,
					usersToCourses.courseId,
					usersToCourses.teamId,
				],
			})
			.returning();

		data.learners
			.filter((l) => l.sendEmail)
			.forEach(async (l) => {
				const t = await createTranslator({
					locale: l.inviteLocale ?? "en",
				});
				const name = handleLocalization(
					{ locale: l.inviteLocale ?? "en" },
					course,
					l.inviteLocale,
				).name;
				const team = handleLocalization(
					{ locale: l.inviteLocale ?? "en" },
					course.team,
					l.inviteLocale,
				);

				const href = createCourseLink({
					domain:
						team.domains.length > 0 ? team.domains[0] : undefined,
					courseId: course.id,
					email: l.email,
					locale: l.inviteLocale,
				});

				await sendEmail({
					to: [l.email],
					subject: t.Email.CourseInvite.subject,
					content: (
						<CourseInvite
							href={href}
							name={name}
							teamName={team.name}
							logo={`${env.VITE_SITE_URL}/cdn/${team.id}/${team.locale}/logo?updatedAt=${team?.updatedAt.toString()}`}
							t={t.Email.CourseInvite}
						/>
					),
					team,
				});
			});

		return null;
	});

export const getLearnersFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware({ role: "owner" })])
	.validator(z.object({ id: z.string() }))
	.handler(async ({ context, data: { id } }) => {
		const { teamId } = context;
		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
			with: {
				translations: true,
				team: {
					with: {
						domains: true,
					},
				},
			},
		});
		if (!course) {
			throw new Error("Course not found.");
		}

		const learnerList = await db.query.usersToCourses.findMany({
			where: eq(modules.courseId, course.id),
			with: {
				user: true,
			},
		});

		return learnerList;
	});

export const createAttemptFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(z.object({ courseId: z.string() }))
	.handler(async ({ context, data: { courseId } }) => {
		const user = context.user;

		const connection = await db.query.usersToCourses.findFirst({
			where: and(
				eq(usersToCourses.courseId, courseId),
				eq(usersToCourses.userId, user.id),
			),
			with: {
				course: {
					with: {
						modules: true,
					},
				},
			},
		});

		if (!connection) {
			throw new Error("Course not found");
		}

		const id = Bun.randomUUIDv7();
		await db.insert(usersToModules).values({
			id,
			userId: context.user.id,
			teamId: connection.teamId,
			moduleId: connection.course.modules[0].id,
			courseId,
			data: getInitialScormData(connection.course.modules[0].type),
		});

		return id;
	});

export const playFn = createServerFn({ method: "GET" })
	.middleware([protectedMiddleware])
	.validator(z.object({ courseId: z.string(), attemptId: z.string() }))
	.handler(async ({ context, data: { courseId, attemptId } }) => {
		const attempt = await db.query.usersToModules.findFirst({
			where: and(
				eq(usersToModules.courseId, courseId),
				eq(usersToModules.id, attemptId),
				eq(usersToModules.userId, context.user.id),
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
			throw new Error("Attempt not found");
		}

		const courseFileUrl = `/${attempt.module.course.teamId}/courses/${attempt.courseId}/${attempt.module.locale}${attempt.module.versionNumber === 1 ? "" : "_" + attempt.module.versionNumber}`;

		const imsManifest = s3.file(courseFileUrl + "/imsmanifest.xml");

		const { scorm, resources } = await parseIMSManifest(imsManifest);
		return {
			attempt: ExtendLearner(attempt.module.type).parse(attempt),
			url: `/cdn${courseFileUrl}/${resources[0].href}`,
			type: scorm.metadata.schemaversion,
		};
	});

export const getLearnerCertificateFn = createServerFn({ method: "GET" })
	.middleware([localeMiddleware])
	.validator(z.object({ courseId: z.string(), learnerId: z.string() }))
	.handler(async ({ context, data: { courseId, learnerId } }) => {
		const learner = await db.query.learners.findFirst({
			where: and(
				eq(learners.courseId, courseId),
				eq(learners.id, learnerId),
			),
			with: {
				module: true,
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

		if (!learner || !learner.module) {
			throw new Error("Learner not found");
		}

		if (!learner.completedAt) {
			throw new Error("Learner has not completed the course.");
		}

		return {
			learner: ExtendLearner(learner.module.type).parse(learner),
			course: handleLocalization(context, learner.course),
			team: handleLocalization(context, learner.team),
		};
	});

export const updateAttemptFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(
		LearnerUpdateSchema.extend({
			attemptId: z.string(),
			courseId: z.string(),
		}),
	)
	.handler(async ({ context, data }) => {
		const attempt = await db.query.usersToModules.findFirst({
			where: and(
				eq(usersToModules.id, data.attemptId),
				eq(usersToModules.userId, context.user.id),
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
			throw new Error("Attempt not found.");
		}
		if (attempt.completedAt) {
			throw new Error("Learner has already completed the course.");
		}

		const courseConnection = await db.query.usersToCourses.findFirst({
			where: and(
				eq(usersToCourses.courseId, attempt.module.courseId),
				eq(usersToCourses.userId, context.user.id),
			),
			with: {
				team: {
					with: {
						translations: true,
						domains: true,
					},
				},
			},
		});

		if (!courseConnection) {
			throw new Error("Course not found");
		}

		// UPDATE LEARNER
		let completedAt = undefined;
		if (data.data) {
			const newLearner = ExtendLearner(attempt.module.type).parse({
				...attempt,
				data: data.data,
			});

			const isEitherStatus =
				attempt.course.completionStatus === "either" &&
				["completed", "passed"].includes(newLearner.status);
			const justCompleted =
				!attempt.completedAt &&
				(attempt.course.completionStatus === newLearner.status ||
					isEitherStatus);

			completedAt =
				attempt.module && justCompleted
					? new Date()
					: attempt.completedAt;

			if (justCompleted) {
				const team = handleLocalization(context, courseConnection.team);
				const course = handleLocalization(context, attempt.course);

				const href = createCourseLink({
					domain:
						team.domains.length > 0 ? team.domains[0] : undefined,
					courseId: course.id,
					locale: course.locale,
					email: context.user.email,
				});

				const t = await createTranslator({
					locale: attempt.module?.locale ?? "en",
				});

				await sendEmail({
					to: [context.user.email],
					subject: t.Email.CourseCompletion.subject,
					content: (
						<CourseCompletion
							name={course.name}
							teamName={team.name}
							href={href}
							t={t.Email.CourseCompletion}
						/>
					),
					team,
				});
			}
		}

		const newAttempt = await db
			.update(usersToModules)
			.set({
				...(data.data ? { data: data.data } : {}),
				...(completedAt ? { completedAt } : {}),
			})
			.where(
				and(
					eq(usersToModules.courseId, data.courseId),
					eq(usersToModules.id, data.attemptId),
					eq(usersToModules.userId, context.user.id),
					eq(usersToModules.teamId, courseConnection.teamId),
				),
			)
			.returning();

		return ExtendLearner(attempt.module.type).parse(newAttempt[0]);
	});
