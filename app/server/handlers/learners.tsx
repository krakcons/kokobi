import { db } from "@/server/db";
import { modules, teams, usersToModules } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { localeMiddleware, protectedMiddleware } from "../middleware";
import { s3 } from "@/server/s3";
import { ExtendLearner, LearnerUpdateSchema } from "@/types/learner";
import { handleLocalization } from "@/lib/locale/helpers";
import { sendEmail, verifyEmail } from "../email";
import { createTranslator } from "@/lib/locale/actions";
import { XMLParser } from "fast-xml-parser";
import { IMSManifestSchema, Resource } from "@/types/scorm/content";
import { S3File } from "bun";
import CourseCompletion from "@/emails/CourseCompletion";
import { getInitialScormData } from "@/lib/scorm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createConnectionLink } from "@/lib/invite";
import { hasUserCourseAccess } from "../helpers";

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

		const teamId = await hasUserCourseAccess({
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

				const href = createConnectionLink({
					domain:
						team.domains.length > 0 ? team.domains[0] : undefined,
					id: course.id,
					type: "course",
					locale: course.locale,
				});

				const t = await createTranslator({
					locale: attempt.module?.locale ?? "en",
				});

				const emailVerified = await verifyEmail(team.domains);

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
					team: emailVerified ? team : undefined,
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

		const teamId = await hasUserCourseAccess({
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
