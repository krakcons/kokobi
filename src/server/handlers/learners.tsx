import { db } from "@/server/db";
import { courses, learners, modules } from "@/server/db/schema";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { HonoVariables, protectedMiddleware } from "../middleware";
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

export const learnerHandler = new Hono<{ Variables: HonoVariables }>()
	.post("/:id/join", zValidator("json", JoinCourseFormSchema), async (c) => {
		const { id } = c.req.param();
		const input = c.req.valid("json");

		const courseModule = await db.query.modules.findFirst({
			where: and(
				eq(modules.id, input.moduleId),
				eq(modules.courseId, id),
			),
			with: {
				course: true,
			},
		});
		if (!courseModule) {
			throw new HTTPException(404, {
				message: "Course module not found",
			});
		}

		const existingLearner = await db.query.learners.findFirst({
			where: and(
				eq(learners.email, input.email),
				eq(learners.courseId, id),
			),
		});
		if (existingLearner && existingLearner.moduleId) {
			return c.json({ learnerId: existingLearner.id });
		}

		const learnerId = input.id ?? Bun.randomUUIDv7();
		const learner = await db
			.insert(learners)
			.values({
				id: learnerId,
				...input,
				teamId: courseModule.course.teamId,
				data: getInitialScormData(courseModule.type),
				startedAt: new Date(),
				courseId: id,
			})
			.onConflictDoUpdate({
				target: [learners.id],
				set: {
					startedAt: new Date(),
					data: getInitialScormData(courseModule.type),
					moduleId: input.moduleId,
				},
			})
			.returning();

		return c.json({ learnerId: learner[0].id });
	})
	.post(
		"/:id/invite",
		zValidator("json", LearnersFormSchema.shape.learners),
		protectedMiddleware(),
		async (c) => {
			const { id } = c.req.param();
			let input = c.req.valid("json");
			const teamId = c.get("teamId");

			const course = await db.query.courses.findFirst({
				where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
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
				throw new HTTPException(404, {
					message: "Course not found.",
				});
			}

			const learnersList = input.map((l) => ({
				...l,
				id: Bun.randomUUIDv7(),
				courseId: id,
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
						c,
						course,
						l.inviteLanguage,
					).name;
					const team = handleLocalization(
						c,
						course.team,
						l.inviteLanguage,
					);

					const href =
						team?.customDomain &&
						env.VITE_SITE_URL !== "http://localhost:3000"
							? `https://${team.customDomain}${l.inviteLanguage ? `/${l.inviteLanguage}` : ""}/courses/${course.id}/join?learnerId=${id}`
							: `${env.VITE_SITE_URL}${l.inviteLanguage ? `/${l.inviteLanguage}` : ""}/play/${course.team?.id}/courses/${course.id}/join?learnerId=${id}`;

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

			return c.json(null);
		},
	)
	.get("/:id/learners", protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");
		const teamRole = c.get("teamRole");

		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
			with: {
				translations: true,
				team: true,
			},
		});

		if (!course) {
			throw new HTTPException(404, {
				message: "Course not found.",
			});
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

		return c.json(extendedLearnerList);
	})
	.get("/:id/learners/:learnerId", async (c) => {
		const { id, learnerId } = c.req.param();

		const learner = await db.query.learners.findFirst({
			where: and(eq(learners.courseId, id), eq(learners.id, learnerId)),
			with: {
				module: true,
			},
		});

		if (!learner) {
			throw new HTTPException(404, {
				message: "Learner not found",
			});
		}

		return c.json({
			...ExtendLearner(learner.module?.type).parse(learner),
			module: learner.module,
		});
	})
	.get("/:id/learners/:learnerId/play", async (c) => {
		const { id, learnerId } = c.req.param();

		const learner = await db.query.learners.findFirst({
			where: and(eq(learners.courseId, id), eq(learners.id, learnerId)),
			with: {
				module: true,
				course: true,
			},
		});

		if (!learner || !learner.module) {
			throw new HTTPException(404, {
				message: "Learner not found",
			});
		}

		const courseFileUrl = `/${learner.course.teamId}/courses/${learner.courseId}/${learner.module.language}${learner.module.versionNumber === 1 ? "" : "_" + learner.module.versionNumber}`;

		const imsManifest = s3.file(courseFileUrl + "/imsmanifest.xml");

		const { scorm, resources } = await parseIMSManifest(imsManifest);
		return c.json({
			learner: ExtendLearner(learner.module.type).parse(learner),
			url: `${env.VITE_API_URL}/cdn${courseFileUrl}/${resources[0].href}`,
			type: scorm.metadata.schemaversion,
		});
	})
	.get("/:id/learners/:learnerId/certificate", async (c) => {
		const { id, learnerId } = c.req.param();

		const learner = await db.query.learners.findFirst({
			where: and(eq(learners.courseId, id), eq(learners.id, learnerId)),
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
			throw new HTTPException(404, {
				message: "Learner not found",
			});
		}

		return c.json({
			learner: ExtendLearner(learner.module.type).parse(learner),
			course: handleLocalization(c, learner.course),
			team: handleLocalization(c, learner.team),
		});
	})
	.put(
		"/:id/learners/:learnerId",
		zValidator("json", LearnerUpdateSchema),
		async (c) => {
			const { id, learnerId } = c.req.param();
			const input = c.req.valid("json");

			const learner = await db.query.learners.findFirst({
				where: and(
					eq(learners.id, learnerId),
					eq(learners.courseId, id),
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
				throw new HTTPException(404, {
					message: "Learner not found.",
				});
			}
			if (learner.completedAt) {
				throw new HTTPException(400, {
					message: "Learner has already completed the course.",
				});
			}

			let courseModule = learner.module;
			if (!courseModule) {
				throw new HTTPException(400, {
					message: "Module id does not belong to course",
				});
			}

			// UPDATE LEARNER
			let completedAt = undefined;
			if (input.data) {
				const newLearner = ExtendLearner(courseModule!.type).parse({
					...learner,
					data: input.data,
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
					const team = handleLocalization(c, learner.team);
					const course = handleLocalization(c, learner.course);

					const href =
						team?.customDomain &&
						env.VITE_SITE_URL !== "http://localhost:3000"
							? `https://${team.customDomain}${course.language ? `/${course.language}` : ""}/courses/${course.id}/join?learnerId=${learner.id}`
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
					...(input.data ? { data: input.data } : {}),
					...(completedAt ? { completedAt } : {}),
				})
				.where(
					and(eq(learners.courseId, id), eq(learners.id, learnerId)),
				)
				.returning();

			return c.json(
				ExtendLearner(courseModule.type).parse(newLearner[0]),
			);
		},
	)
	.delete("/:id/learners/:learnerId", protectedMiddleware(), async (c) => {
		const { id, learnerId } = c.req.param();

		await db
			.delete(learners)
			.where(and(eq(learners.id, learnerId), eq(learners.courseId, id)));

		return c.json(null);
	});
