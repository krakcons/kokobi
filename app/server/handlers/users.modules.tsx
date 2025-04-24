import { db } from "@/server/db";
import { modules, teams, usersToModules } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { learnerMiddleware, localeMiddleware } from "../middleware";
import { createS3 } from "@/server/s3";
import { ExtendLearner, LearnerUpdateSchema } from "@/types/learner";
import { handleLocalization } from "@/lib/locale/helpers";
import { sendEmail, verifyEmail } from "../email";
import { createTranslator } from "@/lib/locale/actions";
import CourseCompletion from "@/emails/CourseCompletion";
import { getInitialScormData } from "@/lib/scorm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasUserAccess } from "../helpers";
import { teamImageUrl } from "@/lib/file";
import { getConnectionLink } from "@/lib/invite";
import { parseIMSManifest } from "../helpers/modules";

export const getUserModuleFn = createServerFn({ method: "GET" })
	.middleware([learnerMiddleware])
	.validator(z.object({ courseId: z.string(), attemptId: z.string() }))
	.handler(async ({ context, data: { courseId, attemptId } }) => {
		const s3 = await createS3();
		const attempt = await db.query.usersToModules.findFirst({
			where: and(
				eq(usersToModules.courseId, courseId),
				eq(usersToModules.id, attemptId),
				eq(usersToModules.userId, context.user.id),
				eq(usersToModules.teamId, context.learnerTeamId),
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
			...ExtendLearner(attempt.module.type).parse(attempt),
			meta: {
				url: `/cdn${courseFileUrl}/${resources[0].href}`,
				type: scorm.metadata.schemaversion,
			},
		};
	});

export const updateUserModuleFn = createServerFn({ method: "POST" })
	.middleware([learnerMiddleware, localeMiddleware])
	.validator(
		LearnerUpdateSchema.extend({
			attemptId: z.string(),
			courseId: z.string(),
		}),
	)
	.handler(async ({ context, data }) => {
		const attempt = await db.query.usersToModules.findFirst({
			where: and(
				eq(usersToModules.courseId, data.courseId),
				eq(usersToModules.id, data.attemptId),
				eq(usersToModules.userId, context.user.id),
				eq(usersToModules.teamId, context.learnerTeamId),
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

		await hasUserAccess({
			type: "course",
			id: data.courseId,
			userId: context.user.id,
			teamId: context.learnerTeamId,
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
					where: eq(teams.id, context.learnerTeamId),
					with: {
						translations: true,
						domains: true,
					},
				});
				const team = handleLocalization(context, teamBase!);
				const course = handleLocalization(context, attempt.course);

				const href = await getConnectionLink({
					teamId: context.learnerTeamId,
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
							logo={teamImageUrl(team, "logo")}
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
					eq(usersToModules.teamId, context.learnerTeamId),
				),
			)
			.returning();

		return ExtendLearner(attempt.module.type).parse(newAttempt[0]);
	});

export const createUserModuleFn = createServerFn({ method: "POST" })
	.middleware([learnerMiddleware, localeMiddleware])
	.validator(z.object({ courseId: z.string() }))
	.handler(async ({ context, data: { courseId } }) => {
		await hasUserAccess({
			type: "course",
			id: courseId,
			userId: context.user.id,
			teamId: context.learnerTeamId,
		});

		const moduleList = await db.query.modules.findMany({
			where: eq(modules.courseId, courseId),
		});

		if (moduleList.length === 0) {
			throw new Error("Module not found");
		}

		const module =
			moduleList.find((m) => m.locale === context.locale) ??
			moduleList[0];

		const id = Bun.randomUUIDv7();
		await db.insert(usersToModules).values({
			id,
			userId: context.user.id,
			teamId: context.learnerTeamId,
			moduleId: module.id,
			courseId,
			data: getInitialScormData(module.type),
		});

		return id;
	});
