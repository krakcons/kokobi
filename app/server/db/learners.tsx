import CollectionInvite from "@/emails/CollectionInvite";
import CourseCompletion from "@/emails/CourseCompletion";
import { CourseInvite } from "@/emails/CourseInvite";
import { env } from "@/env";
import { translate } from "@/lib/translation";
import { db } from "@/server/db/db";
import { learners, teams } from "@/server/db/schema";
import { Collection, CollectionTranslation } from "@/types/collections";
import { Course, CourseTranslation } from "@/types/course";
import {
	CreateLearner,
	ExtendLearner,
	SelectLearner,
	UpdateLearner,
} from "@/types/learner";
import { Language } from "@/types/translations";
import { render } from "@react-email/components";
import { and, eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import React, { cache } from "react";
import { isResendVerified, resend } from "../resend";
import { svix } from "../svix";
import { modulesData } from "./modules";
import { createTranslator } from "@/lib/locale/actions";

export const learnersData = {
	get: cache(async ({ id }: SelectLearner) => {
		const learner = await db.query.learners.findFirst({
			where: and(eq(learners.id, id)),
			with: {
				module: true,
			},
		});

		if (!learner) {
			throw new HTTPException(404, {
				message: "Learner not found.",
			});
		}

		return ExtendLearner(learner.module?.type).parse(learner);
	}),
	update: async ({ id, moduleId, data }: UpdateLearner) => {
		let courseModule;
		if (moduleId) {
			courseModule = await modulesData.get({ id: moduleId });
		}
		const learner = await db.query.learners.findFirst({
			where: and(eq(learners.id, id)),
			with: {
				course: true,
			},
		});

		if (!learner) {
			throw new HTTPException(404, {
				message: "Learner not found.",
			});
		}

		if (learner.completedAt) {
			throw new HTTPException(400, {
				message: "Learner has already completed the course.",
			});
		}

		const newLearner = ExtendLearner(courseModule?.type).parse({
			...learner,
			data,
		});

		const isEitherStatus =
			learner.course.completionStatus === "either" &&
			["completed", "passed"].includes(newLearner.status);
		const justCompleted =
			!learner.completedAt &&
			(learner.course.completionStatus === newLearner.status ||
				isEitherStatus);

		const completedAt =
			courseModule && justCompleted ? new Date() : learner.completedAt;

		await db
			.update(learners)
			.set({
				data,
				completedAt,
			})
			.where(eq(learners.id, id));

		if (justCompleted) {
			const learner = await db.query.learners.findFirst({
				where: eq(learners.id, id),
				with: {
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

			try {
				await svix.message.create(`app_${learner.courseId}`, {
					eventType: "learner.complete",
					payload: newLearner,
				});
			} catch (e) {
				console.error(e);
			}

			const href =
				learner.course.team?.customDomain &&
				env.PUBLIC_SITE_URL !== "http://localhost:3000"
					? `${learner.course.team.customDomain}${courseModule ? `/${courseModule.language}` : ""}/courses/${learner.course.id}/certificate?learnerId=${learner.id}`
					: `${env.PUBLIC_SITE_URL}${courseModule ? `/${courseModule.language}` : ""}/play/${learner.course.team?.id}/courses/${learner.course.id}/certificate?learnerId=${learner.id}`;

			const t = await createTranslator({
				locale: courseModule?.language!,
			});

			const teamTranslation = translate(
				learner.course.team.translations,
				courseModule?.language,
			);
			const courseTranslation = translate(
				learner.course.translations,
				courseModule?.language,
			);

			const html = await render(
				React.createElement(CourseCompletion, {
					course: courseTranslation.name,
					organization: teamTranslation.name,
					href,
					logo: teamTranslation.logo
						? `${env.PUBLIC_SITE_URL}/cdn/${teamTranslation.logo}`
						: null,
					text: {
						title: t.Email.Completion.title,
						congratulations: t.Email.Completion.congratulations,
						completed: t.Email.Completion.completed,
						by: t.Email.by,
						certificate: t.Email.Completion.certificate,
						get: t.Email.Completion.get,
					},
				}),
			);

			const domainVerified = await isResendVerified(
				learner.course.team.resendDomainId,
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
		}

		try {
			await svix.message.create(`app_${learner.courseId}`, {
				eventType: "learner.update",
				payload: newLearner,
			});
		} catch (e) {
			console.error(e);
		}

		return { ...newLearner, completedAt };
	},
	create: async (
		input: Omit<CreateLearner, "moduleId" | "courseId" | "id">[],
		courses: (Course & { translations: CourseTranslation[] })[],
		collection?: Collection & { translations: CollectionTranslation[] },
	) => {
		const learnerList = courses.flatMap(({ id }) =>
			input.map((learner) => {
				// Create a new learner
				return {
					...learner,
					id: Bun.randomUUIDv7(),
					moduleId: null,
					courseId: id,
					data: {},
					completedAt: null,
					startedAt: null,
				};
			}),
		);

		await db.insert(learners).values(learnerList).onConflictDoNothing();

		// Get learners after insert accounting for duplicates
		const finalLearners = await db.query.learners.findMany({
			where: and(
				inArray(
					learners.courseId,
					courses.map((course) => course.id),
				),
				inArray(
					learners.email,
					learnerList.map((learner) => learner.email),
				),
			),
		});

		if (collection) {
			const emailList = input
				.filter(
					(learner) => learner.sendEmail !== false && learner.email,
				)
				// Map through learners invited
				.map((learner) => {
					// Create course invite list with each course and corresponding learner id
					const courseInvites = learnerList
						// Find learners with the same email
						.filter((l) => l.email === learner.email)
						// Map to courses
						.map((l) => {
							// Find course
							const course = courses.find(
								(c) => c.id === l.courseId,
							)!;
							// Find learner with that course
							const learnerId = finalLearners.find(
								(l) =>
									l.email === learner.email &&
									l.courseId === course.id,
							)?.id!;
							return {
								...course,
								learnerId,
							};
						});
					console.log("INVITES", courseInvites);
					return {
						email: learner.email,
						collection,
						inviteLanguage: learner.inviteLanguage,
						courses: courseInvites,
					};
				});
			await Promise.allSettled(
				emailList.map((learner) => {
					return learnersData.collectionInvite(learner);
				}),
			);
		} else {
			const emailList = learnerList
				.filter(
					(learner) => learner.sendEmail !== false && learner.email,
				)
				.map((learner) => {
					const course = courses.find(
						(course) => course.id === learner.courseId,
					)!;
					return {
						email: learner.email,
						// If the learner already exists, use the existing learner id
						learnerId: finalLearners.find(
							(l) =>
								l.email === learner.email &&
								l.courseId === learner.courseId,
						)?.id!,
						course,
						inviteLanguage: learner.inviteLanguage,
					};
				});

			await Promise.allSettled(
				emailList.map((learner) => {
					return learnersData.courseInvite(learner);
				}),
			);
		}

		if (learnerList.length === 1) {
			const newLearner = ExtendLearner().parse(learnerList[0]);

			try {
				await svix.message.create(`app_${newLearner.courseId}`, {
					eventType: "learner.created",
					payload: newLearner,
				});
			} catch (e) {
				console.error(e);
			}
			return newLearner;
		} else {
			const newLearners = ExtendLearner().array().parse(learnerList);
			try {
				await Promise.allSettled(
					newLearners.map((learner) => {
						return svix.message.create(`app_${learner.courseId}`, {
							eventType: "learner.created",
							payload: learner,
						});
					}),
				);
			} catch (e) {
				console.error(e);
			}
			return newLearners;
		}
	},
	collectionInvite: async ({
		email,
		collection,
		courses,
		inviteLanguage,
	}: {
		email: string;
		collection: Collection & { translations: CollectionTranslation[] };
		courses: (Course & {
			translations: CourseTranslation[];
			learnerId: string;
		})[];
		inviteLanguage?: Language;
	}) => {
		const team = await db.query.teams.findFirst({
			where: and(eq(teams.id, collection.teamId)),
			with: {
				translations: true,
			},
		});

		if (!team) {
			throw new HTTPException(404, {
				message: "Team not found.",
			});
		}

		const t = await createTranslator({ locale: inviteLanguage ?? "en" });

		const teamTranslation = translate(team.translations, inviteLanguage);

		const courseInvites = courses.map((course) => {
			const href =
				team?.customDomain &&
				env.PUBLIC_SITE_URL !== "http://localhost:3000"
					? `https://${team.customDomain}${inviteLanguage ? `/${inviteLanguage}` : ""}/courses/${course.id}/join?learnerId=${course.learnerId}`
					: `${env.PUBLIC_SITE_URL}${inviteLanguage ? `/${inviteLanguage}` : ""}/play/${team?.id}/courses/${course.id}/join?learnerId=${course.learnerId}`;

			const courseTranslation = translate(
				course.translations,
				inviteLanguage,
			);

			return {
				title: courseTranslation.name,
				href,
			};
		});

		const collectionTranslation = translate(
			collection.translations,
			inviteLanguage,
		);

		const html = await render(
			React.createElement(CollectionInvite, {
				collection: collectionTranslation.name,
				organization: teamTranslation.name,
				courses: courseInvites,
				logo: teamTranslation.logo
					? `${env.PUBLIC_SITE_URL}/cdn/${teamTranslation.logo}`
					: null,
				text: {
					title: t.Email.CollectionInvite.title,
					invite: t.Email.CollectionInvite.invite,
					by: t.Email.by,
					start: t.Email.CollectionInvite.start,
					below: t.Email.CollectionInvite.below,
				},
			}),
		);

		const domainVerified = await isResendVerified(team.resendDomainId);
		const { error } = await resend.emails.send({
			html,
			to: email,
			subject: `${t.Email.CollectionInvite.subject} ${collectionTranslation.name}`,
			from: `${teamTranslation.name} <noreply@${team.customDomain && domainVerified ? team.customDomain : "lcds.krakconsultants.com"}>`,
			replyTo: `${teamTranslation.name} <noreply@${team.customDomain && domainVerified ? team.customDomain : "lcds.krakconsultants.com"}>`,
		});

		if (error) {
			throw new HTTPException(500, {
				message: "Failed to send email",
				cause: error,
			});
		}
	},
	courseInvite: async ({
		email,
		learnerId,
		course,
		inviteLanguage,
	}: {
		email: string;
		learnerId: string;
		course: Course & { translations: CourseTranslation[] };
		inviteLanguage?: Language;
	}) => {
		const team = await db.query.teams.findFirst({
			where: and(eq(teams.id, course.teamId)),
			with: {
				translations: true,
			},
		});

		if (!team) {
			throw new HTTPException(404, {
				message: "Team not found.",
			});
		}

		const href =
			team?.customDomain &&
			env.PUBLIC_SITE_URL !== "http://localhost:3000"
				? `https://${team.customDomain}${inviteLanguage ? `/${inviteLanguage}` : ""}/courses/${course.id}/join?learnerId=${learnerId}`
				: `${env.PUBLIC_SITE_URL}${inviteLanguage ? `/${inviteLanguage}` : ""}/play/${team?.id}/courses/${course.id}/join?learnerId=${learnerId}`;

		const t = await createTranslator({ locale: inviteLanguage ?? "en" });

		const courseTranslation = translate(
			course.translations,
			inviteLanguage,
		);
		const teamTranslation = translate(team.translations, inviteLanguage);

		const html = await render(
			React.createElement(CourseInvite, {
				course: courseTranslation.name,
				organization: teamTranslation.name,
				href,
				logo: teamTranslation.logo
					? `${env.PUBLIC_SITE_URL}/cdn/${teamTranslation.logo}`
					: null,
				text: {
					title: t.Email.CourseInvite.title,
					invite: t.Email.CourseInvite.invite,
					start: t.Email.CourseInvite.start,
					below: t.Email.CourseInvite.below,
				},
			}),
		);

		const domainVerified = await isResendVerified(team.resendDomainId);
		const { error } = await resend.emails.send({
			html,
			to: email,
			subject: `${t.Email.CourseInvite.subject} ${courseTranslation.name}`,
			from: `${teamTranslation.name} <noreply@${team.customDomain && domainVerified ? team.customDomain : "lcds.krakconsultants.com"}>`,
			replyTo: `${teamTranslation.name} <noreply@${team.customDomain && domainVerified ? team.customDomain : "lcds.krakconsultants.com"}>`,
		});

		if (error) {
			throw new HTTPException(500, {
				message: "Failed to send email",
				cause: error,
			});
		}
	},
};
