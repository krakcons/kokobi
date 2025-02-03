import CourseCompletion from "@/emails/CourseCompletion";
import { env } from "@/env";
import { translate } from "@/lib/translation";
import { db } from "@/server/db/db";
import { learnersData } from "@/server/db/learners";
import { learners } from "@/server/db/schema";
import { isResendVerified, resend } from "@/server/resend";
import { UpdateLearnerSchema } from "@/types/learner";
import { LanguageSchema } from "@/types/translations";
import { zValidator } from "@hono/zod-validator";
import { renderAsync } from "@react-email/components";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getTranslations } from "next-intl/server";
import React from "react";
import { z } from "zod";

export const learnersHandler = new Hono()
	.get("/:id", async (c) => {
		const { id } = c.req.param();

		const learner = await learnersData.get({ id });

		return c.json(learner);
	})
	.put(
		"/:id",
		zValidator(
			"json",
			UpdateLearnerSchema.omit({
				id: true,
			})
		),
		async (c) => {
			const { id } = c.req.param();
			const input = c.req.valid("json");

			const newLearner = await learnersData.update({ ...input, id });

			return c.json(newLearner);
		}
	)
	.post(
		"/:id/reinvite",
		zValidator(
			"json",
			z.object({
				inviteLanguage: LanguageSchema,
			})
		),
		async (c) => {
			const { id } = c.req.param();
			const input = c.req.valid("json");

			const learner = await db.query.learners.findFirst({
				where: eq(learners.id, id),
				with: {
					course: {
						with: {
							translations: true,
						},
					},
				},
			});

			if (!learner) {
				throw new HTTPException(404, {
					message: "Learner not found.",
				});
			}

			await learnersData.courseInvite({
				...learner,
				inviteLanguage: input.inviteLanguage,
				learnerId: id,
			});

			return c.json(null);
		}
	)
	.post("/:id/recertify", async (c) => {
		const { id } = c.req.param();

		const learner = await db.query.learners.findFirst({
			where: eq(learners.id, id),
			with: {
				module: true,
				course: {
					with: {
						team: {
							with: {
								translations: true,
							},
						},
						translations: true,
					},
				},
			},
		});

		if (!learner) {
			throw new HTTPException(404, {
				message: "Learner not found.",
			});
		}

		if (!learner.completedAt || !learner.module) {
			throw new HTTPException(400, {
				message: "Learner has not completed the course.",
			});
		}

		const href =
			learner.course.team?.customDomain &&
			env.NEXT_PUBLIC_SITE_URL !== "http://localhost:3000"
				? `${learner.course.team.customDomain}${learner.module ? `/${learner.module.language}` : ""}/courses/${learner.course.id}/certificate?learnerId=${learner.id}`
				: `${env.NEXT_PUBLIC_SITE_URL}${learner.module ? `/${learner.module.language}` : ""}/play/${learner.course.team?.id}/courses/${learner.course.id}/certificate?learnerId=${learner.id}`;

		const t = await getTranslations({
			locale: learner.module.language,
			namespace: "Email",
		});

		const teamTranslation = translate(
			learner.course.team.translations,
			learner.module?.language
		);
		const courseTranslation = translate(
			learner.course.translations,
			learner.module?.language
		);

		const html = await renderAsync(
			React.createElement(CourseCompletion, {
				course: courseTranslation.name,
				organization: teamTranslation.name,
				href,
				logo: teamTranslation.logo
					? `${env.NEXT_PUBLIC_SITE_URL}/cdn/${teamTranslation.logo}`
					: null,
				text: {
					title: t("Completion.title"),
					congratulations: t("Completion.congratulations"),
					completed: t("Completion.completed"),
					by: t("by"),
					certificate: t("Completion.certificate"),
					get: t("Completion.get"),
				},
			})
		);

		const domainVerified = await isResendVerified(
			learner.course.team.resendDomainId
		);
		const { error } = await resend.emails.send({
			html,
			to: learner.email,
			subject: courseTranslation.name,
			from: `${teamTranslation.name} <noreply@${learner.course.team.customDomain && domainVerified ? learner.course.team.customDomain : "lcds.krakconsultants.com"}>`,
			replyTo: `${teamTranslation.name} <noreply@${learner.course.team.customDomain && domainVerified ? learner.course.team.customDomain : "lcds.krakconsultants.com"}>`,
		});

		if (error) {
			throw new HTTPException(500, {
				message: "Failed to send email",
				cause: error,
			});
		}

		return c.json(null);
	})
	.delete("/:id", async (c) => {
		const { id } = c.req.param();

		await learnersData.get({ id });

		await db.delete(learners).where(and(eq(learners.id, id)));

		return c.json(null);
	})
	.delete(
		"",
		zValidator(
			"json",
			z.object({
				ids: z.array(z.string()),
			})
		),
		async (c) => {
			const { ids } = c.req.valid("json");

			await db.delete(learners).where(inArray(learners.id, ids));

			return c.json(null);
		}
	);
