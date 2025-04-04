import { db } from "@/server/db";
import { courses, learners, modules } from "@/server/db/schema";
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
	.middleware([teamMiddleware({ role: "owner" })])
	.validator(LearnersFormSchema.extend({ courseId: z.string() }))
	.handler(async ({ context, data }) => {
		const teamId = context.teamId;

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
					},
				},
			},
		});

		if (!course) {
			throw new Error("Course not found.");
		}

		const learnersList = data.learners.map((l) => ({
			...l,
			id: Bun.randomUUIDv7(),
			courseId: data.courseId,
			teamId,
		}));

		const finalLearnersList = await db
			.insert(learners)
			.values(learnersList)
			.onConflictDoUpdate({
				target: [learners.email, learners.courseId],
				set: {
					updatedAt: new Date(),
				},
			})
			.returning();

		learnersList
			.filter((l) => l.sendEmail)
			.forEach(async (l) => {
				const finalLearner = finalLearnersList.find(
					(fl) => fl.email === l.email,
				);
				if (!finalLearner) {
					return;
				}
				const id = finalLearner.id;
				const t = await createTranslator({
					locale: l.inviteLanguage ?? "en",
				});
				const name = handleLocalization(
					{ locale: l.inviteLanguage ?? "en" },
					course,
					l.inviteLanguage,
				).name;
				const team = handleLocalization(
					{ locale: l.inviteLanguage ?? "en" },
					course.team,
					l.inviteLanguage,
				);

				const href =
					team?.customDomain &&
					env.VITE_SITE_URL !== "http://localhost:3000"
						? `https://${team.customDomain}${l.inviteLanguage ? `/${l.inviteLanguage}` : ""}/play/${team?.id}/courses/${course.id}/join?learnerId=${id}`
						: `${env.VITE_SITE_URL}${l.inviteLanguage ? `/${l.inviteLanguage}` : ""}/play/${team?.id}/courses/${course.id}/join?learnerId=${id}`;

				await sendEmail({
					to: [l.email],
					subject: t.Email.CourseInvite.subject,
					content: (
						<CourseInvite
							href={href}
							name={name}
							teamName={team.name}
							logo={`${env.VITE_SITE_URL}/cdn/${team.id}/${team.language}/logo?updatedAt=${team?.updatedAt.toString()}`}
							t={t.Email.CourseInvite}
						/>
					),
				});
			});

		return null;
	});

export const getLearnersFn = createServerFn({ method: "GET" })
	.middleware([teamMiddleware({ role: "owner" })])
	.validator(z.object({ id: z.string() }))
	.handler(async ({ context, data: { id } }) => {
		const { teamId } = context;
		const teamRole = context.role;
		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
			with: {
				translations: true,
				team: true,
			},
		});
		if (!course) {
			throw new Error("Course not found.");
		}
		const learnerList = await db.query.learners.findMany({
			where: eq(learners.courseId, course.id),
			with: {
				module: true,
			},
		});
		const extendedLearnerList = learnerList.map((learner) => {
			return {
				...ExtendLearner(learner.module?.type).parse(learner),
				module: learner.module,
				joinLink:
					teamRole === "owner"
						? course.team?.customDomain &&
							env.VITE_SITE_URL !== "http://localhost:3000"
							? `https://${course.team.customDomain}/courses/${course.id}/join?learnerId=${learner.id}`
							: `${env.VITE_SITE_URL}/play/${course.team?.id}/courses/${course.id}/join?learnerId=${learner.id}`
						: undefined,
			};
		});
		return extendedLearnerList;
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

		const courseFileUrl = `/${learner.course.teamId}/courses/${learner.courseId}/${learner.module.language}${learner.module.versionNumber === 1 ? "" : "_" + learner.module.versionNumber}`;

		const imsManifest = s3.file(courseFileUrl + "/imsmanifest.xml");

		const { scorm, resources } = await parseIMSManifest(imsManifest);
		return {
			learner: ExtendLearner(learner.module.type).parse(learner),
			url: `${env.VITE_SITE_URL}/cdn${courseFileUrl}/${resources[0].href}`,
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

				const href =
					team?.customDomain &&
					env.VITE_SITE_URL !== "http://localhost:3000"
						? `https://${team.customDomain}${course.language ? `/${course.language}` : ""}/play/${team?.id}/courses/${course.id}/join?learnerId=${learner.id}`
						: `${env.VITE_SITE_URL}/play/${team?.id}/courses/${course.id}/join?learnerId=${learner.id}`;

				const t = await createTranslator({
					locale: learner.module?.language ?? "en",
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
