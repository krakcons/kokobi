import { db } from "@/server/db";
import { usersToModules } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { localeMiddleware, teamMiddleware } from "../lib/middleware";
import { ExtendLearner } from "@/types/learner";
import { sendEmail, verifyEmail } from "../lib/email";
import { createTranslator, handleLocalization } from "@/lib/locale";
import CourseCompletion from "@/components/emails/CourseCompletion";
import { isModuleSuccessful } from "@/lib/scorm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasTeamAccess } from "../lib/access";
import { teamImageUrl } from "@/lib/file";
import { getConnectionLink } from "@/server/lib/connection";

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
