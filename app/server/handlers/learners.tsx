import { db } from "@/server/db";
import {
	courses,
	modules,
	users,
	usersToCourses,
	usersToModules,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { localeMiddleware, teamMiddleware } from "../middleware";
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

export const joinCourseFn = createServerFn({ method: "POST" })
	.validator(JoinCourseFormSchema.extend({ courseId: z.string() }))
	.handler(async ({ data }) => {
		const courseModule = await db.query.modules.findFirst({
			where: and(
				eq(modules.id, data.moduleId),
				eq(modules.courseId, data.courseId),
			),
			with: {
				course: true,
			},
		});
		if (!courseModule) {
			throw new Error("Course module not found");
		}

		const existingLearner = await db.query.learners.findFirst({
			where: and(
				eq(learners.email, data.email),
				eq(learners.courseId, data.courseId),
			),
		});
		if (existingLearner && existingLearner.moduleId) {
			return { learnerId: existingLearner.id };
		}

		const learnerId = data.id ?? Bun.randomUUIDv7();
		const learner = await db
			.insert(learners)
			.values({
				id: learnerId,
				...data,
				teamId: courseModule.course.teamId,
				data: getInitialScormData(courseModule.type),
				startedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [learners.id],
				set: {
					startedAt: new Date(),
					data: getInitialScormData(courseModule.type),
					moduleId: data.moduleId,
				},
			})
			.returning();

		return { learnerId: learner[0].id };
	});

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
					connectType: "shared" as UserToCourseType["connectType"],
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

export const getLearnerFn = createServerFn({ method: "GET" })
	.validator(z.object({ courseId: z.string(), learnerId: z.string() }))
	.handler(async ({ data: { courseId, learnerId } }) => {
		const learner = await db.query.learners.findFirst({
			where: and(
				eq(learners.courseId, courseId),
				eq(learners.id, learnerId),
			),
			with: {
				module: true,
			},
		});

		if (!learner) {
			throw new Error("Learner not found");
		}

		return {
			...ExtendLearner(learner.module?.type).parse(learner),
			module: learner.module,
		};
	});

export const playFn = createServerFn({ method: "GET" })
	.validator(z.object({ courseId: z.string(), learnerId: z.string() }))
	.handler(async ({ data: { courseId, learnerId } }) => {
		const learner = await db.query.learners.findFirst({
			where: and(
				eq(learners.courseId, courseId),
				eq(learners.id, learnerId),
			),
			with: {
				module: true,
				course: true,
			},
		});

		if (!learner || !learner.module) {
			throw new Error("Learner not found");
		}

		const courseFileUrl = `/${learner.course.teamId}/courses/${learner.courseId}/${learner.module.locale}${learner.module.versionNumber === 1 ? "" : "_" + learner.module.versionNumber}`;

		const imsManifest = s3.file(courseFileUrl + "/imsmanifest.xml");

		const { scorm, resources } = await parseIMSManifest(imsManifest);
		return {
			learner: ExtendLearner(learner.module.type).parse(learner),
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

export const updateLearnerFn = createServerFn({ method: "POST" })
	.middleware([localeMiddleware])
	.validator(
		LearnerUpdateSchema.extend({
			learnerId: z.string(),
			courseId: z.string(),
		}),
	)
	.handler(async ({ context, data }) => {
		const learner = await db.query.learners.findFirst({
			where: and(
				eq(learners.id, data.learnerId),
				eq(learners.courseId, data.courseId),
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
						domains: true,
					},
				},
			},
		});

		if (!learner) {
			throw new Error("Learner not found.");
		}
		if (learner.completedAt) {
			throw new Error("Learner has already completed the course.");
		}

		let courseModule = learner.module;
		if (!courseModule) {
			throw new Error("Module id does not belong to course");
		}

		// UPDATE LEARNER
		let completedAt = undefined;
		if (data.data) {
			const newLearner = ExtendLearner(courseModule!.type).parse({
				...learner,
				data: data.data,
			});

			const isEitherStatus =
				learner.course.completionStatus === "either" &&
				["completed", "passed"].includes(newLearner.status);
			const justCompleted =
				!learner.completedAt &&
				(learner.course.completionStatus === newLearner.status ||
					isEitherStatus);

			completedAt =
				learner.module && justCompleted
					? new Date()
					: learner.completedAt;

			if (justCompleted) {
				const team = handleLocalization(context, learner.team);
				const course = handleLocalization(context, learner.course);

				const href = createCourseLink({
					domain:
						team.domains.length > 0 ? team.domains[0] : undefined,
					courseId: course.id,
					locale: course.locale,
					email: learner.email,
				});

				const t = await createTranslator({
					locale: learner.module?.locale ?? "en",
				});

				await sendEmail({
					to: [learner.email],
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

		const newLearner = await db
			.update(learners)
			.set({
				moduleId: courseModule.id,
				...(data.data ? { data: data.data } : {}),
				...(completedAt ? { completedAt } : {}),
			})
			.where(
				and(
					eq(learners.courseId, data.courseId),
					eq(learners.id, data.learnerId),
				),
			)
			.returning();

		return ExtendLearner(courseModule.type).parse(newLearner[0]);
	});

export const deleteLearnerFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware()])
	.validator(z.object({ courseId: z.string(), learnerId: z.string() }))
	.handler(async ({ data: { courseId, learnerId } }) => {
		await db
			.delete(learners)
			.where(
				and(
					eq(learners.id, learnerId),
					eq(learners.courseId, courseId),
				),
			);

		return null;
	});
