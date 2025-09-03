import { db } from "@/server/db";
import { modules, teams, usersToModules } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import {
	learnerMiddleware,
	localeMiddleware,
	teamMiddleware,
} from "../lib/middleware";
import { ExtendLearner, LearnerUpdateSchema } from "@/types/learner";
import { sendEmail, verifyEmail } from "../lib/email";
import { createTranslator, handleLocalization } from "@/lib/locale";
import CourseCompletion from "@/components/emails/CourseCompletion";
import { getInitialScormData, isModuleSuccessful } from "@/lib/scorm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasTeamAccess, hasUserAccess } from "../lib/access";
import { teamImageUrl } from "@/lib/file";
import { getConnectionLink } from "@/server/lib/connection";
import { parseIMSManifest } from "../lib/modules";
import { s3 } from "../s3";

export const getUserModuleFn = createServerFn({ method: "GET" })
	.middleware([learnerMiddleware])
	.validator(z.object({ courseId: z.string(), attemptId: z.string() }))
	.handler(async ({ context, data: { courseId, attemptId } }) => {
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
		await hasUserAccess({
			type: "course",
			id: data.courseId,
			userId: context.user.id,
			teamId: context.learnerTeamId,
		});

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
			return undefined;
		}

		// UPDATE LEARNER
		let completedAt = undefined;
		if (data.data) {
			// Send communications in the locale of the module
			const communicationLocale = attempt.module.locale;
			const newLearner = ExtendLearner(attempt.module.type).parse({
				...attempt,
				data: data.data,
			});

			const isComplete = ["failed", "completed", "passed"].includes(
				newLearner.status,
			);
			const isSuccess = isModuleSuccessful({
				completionStatus: attempt.course.completionStatus,
				status: newLearner.status,
			});
			const justCompleted = !attempt.completedAt && isComplete;

			completedAt =
				attempt.module && justCompleted
					? new Date()
					: attempt.completedAt;

			if (justCompleted && isSuccess) {
				const teamBase = await db.query.teams.findFirst({
					where: eq(teams.id, context.learnerTeamId),
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
					teamId: context.learnerTeamId,
					id: course.id,
					type: "course",
					locale: course.locale,
				});

				const t = await createTranslator({
					locale: communicationLocale,
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
			orderBy: desc(modules.createdAt),
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

export const resendCompletionEmailFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware(), localeMiddleware])
	.validator(
		z.object({
			attemptId: z.string(),
			courseId: z.string(),
		}),
	)
	.handler(async ({ context, data }) => {
		await hasTeamAccess({
			type: "course",
			id: data.courseId,
			teamId: context.teamId,
		});

		const attempt = await db.query.usersToModules.findFirst({
			where: and(
				eq(usersToModules.courseId, data.courseId),
				eq(usersToModules.id, data.attemptId),
				eq(usersToModules.teamId, context.teamId),
			),
			with: {
				user: true,
				team: {
					with: {
						translations: true,
						domains: true,
					},
				},
				course: {
					with: {
						translations: true,
					},
				},
				module: true,
			},
		});

		if (!attempt) {
			throw new Error("Attempt not found.");
		}

		const learner = ExtendLearner(attempt.module.type).parse(attempt);

		if (
			!attempt.completedAt ||
			!isModuleSuccessful({
				completionStatus: attempt.course.completionStatus,
				status: learner.status,
			})
		) {
			throw new Error("Attempt not complete.");
		}

		// Send communications in the locale of the module
		const communicationLocale = attempt.module.locale;

		const team = handleLocalization(
			{
				locale: communicationLocale,
			},
			attempt.team,
		);
		const course = handleLocalization(
			{
				locale: communicationLocale,
			},
			attempt.course,
		);

		const href = await getConnectionLink({
			teamId: context.teamId,
			id: course.id,
			type: "course",
			locale: course.locale,
		});

		const t = await createTranslator({
			locale: communicationLocale,
		});

		const emailVerified = await verifyEmail(team.domains);

		await sendEmail({
			to: [attempt.user.email],
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
	});
