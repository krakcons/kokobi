import { db } from "@/server/db";
import { courses, modules, teams, usersToModules } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import {
	localeMiddleware,
	protectedMiddleware,
	teamMiddleware,
} from "../middleware";
import { s3 } from "@/server/s3";
import { ExtendLearner, LearnerUpdateSchema } from "@/types/learner";
import { handleLocalization } from "@/lib/locale/helpers";
import { sendEmail } from "../email";
import { createTranslator } from "@/lib/locale/actions";
import { XMLParser } from "fast-xml-parser";
import { IMSManifestSchema, Resource } from "@/types/scorm/content";
import { S3File } from "bun";
import CourseCompletion from "@/emails/CourseCompletion";
import { getInitialScormData } from "@/lib/scorm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createCourseLink } from "@/lib/invite";
import { getCourseConnectionHelper } from "../helpers";

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

		const teamId = await getCourseConnectionHelper({
			courseId: attempt.module.courseId,
			userId: context.user.id,
		});

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
				const teamBase = await db.query.teams.findFirst({
					where: eq(teams.id, teamId),
					with: {
						translations: true,
						domains: true,
					},
				});
				const team = handleLocalization(context, teamBase!);
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
					eq(usersToModules.teamId, teamId),
				),
			)
			.returning();

		return ExtendLearner(attempt.module.type).parse(newAttempt[0]);
	});

export const createAttemptFn = createServerFn({ method: "POST" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(z.object({ courseId: z.string() }))
	.handler(async ({ context, data: { courseId } }) => {
		const user = context.user;

		const teamId = await getCourseConnectionHelper({
			courseId,
			userId: user.id,
		});

		const module = await db.query.modules.findFirst({
			where: eq(modules.courseId, courseId),
		});

		if (!module) {
			throw new Error("Module not found");
		}

		const id = Bun.randomUUIDv7();
		await db.insert(usersToModules).values({
			id,
			userId: context.user.id,
			teamId,
			moduleId: module.id,
			courseId,
			data: getInitialScormData(module.type),
		});

		return id;
	});
