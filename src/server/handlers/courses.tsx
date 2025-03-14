import { db } from "@/server/db";
import {
	courseTranslations,
	courses,
	learners,
	modules,
} from "@/server/db/schema";
import { CourseFormSchema } from "@/types/course";
import {
	ExtendLearner,
	JoinCourseFormSchema,
	LearnersFormSchema,
	LearnerUpdateSchema,
} from "@/types/learner";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, max } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
	HonoVariables,
	localeInputMiddleware,
	protectedMiddleware,
} from "../middleware";
import { env } from "@/server/env";
import { handleLocalization } from "@/lib/locale/helpers";
import { ModuleFormSchema } from "@/types/module";
import { shouldIgnoreFile, validateModule } from "@/lib/module";
import { s3 } from "@/server/s3";
import { sendEmail } from "../email";
import CourseInvite from "@/emails/CourseInvite";
import { createTranslator } from "@/lib/locale/actions";
import { XMLParser } from "fast-xml-parser";
import { IMSManifestSchema, Resource } from "@/types/scorm/content";
import { S3File } from "bun";
import { getInitialScormData } from "@/lib/scorm";

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

export const coursesHandler = new Hono<{ Variables: HonoVariables }>()
	.get("/", protectedMiddleware(), async (c) => {
		const teamId = c.get("teamId");

		const courseList = await db.query.courses.findMany({
			where: eq(courses.teamId, teamId),
			with: {
				translations: true,
			},
		});

		return c.json(
			courseList.map((course) => handleLocalization(c, course)),
		);
	})
	.get("/:id", localeInputMiddleware, protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		const course = await db.query.courses.findFirst({
			where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
			with: {
				translations: true,
			},
		});

		if (!course) {
			throw new HTTPException(404, {
				message: "Course not found",
			});
		}

		return c.json(handleLocalization(c, course));
	})
	.post(
		"/",
		localeInputMiddleware,
		protectedMiddleware(),
		zValidator("json", CourseFormSchema),
		async (c) => {
			const teamId = c.get("teamId");
			const input = c.req.valid("json");
			const language = c.get("locale");

			const courseId = Bun.randomUUIDv7();

			await db.insert(courses).values({
				id: courseId,
				teamId,
				completionStatus: input.completionStatus,
			});

			await db.insert(courseTranslations).values({
				courseId,
				name: input.name,
				description: input.description,
				language,
				// TODO: Remove default
				default: false,
			});

			return c.json({ id: courseId });
		},
	)
	.put(
		"/:id",
		localeInputMiddleware,
		protectedMiddleware(),
		zValidator("json", CourseFormSchema),
		async (c) => {
			const { id } = c.req.param();
			const teamId = c.get("teamId");
			const input = c.req.valid("json");
			const language = c.get("locale");

			const course = await db.query.courses.findFirst({
				where: and(eq(courses.id, id), eq(courses.teamId, teamId)),
			});

			if (!course) {
				throw new HTTPException(404, {
					message: "Course not found.",
				});
			}

			await db
				.update(courses)
				.set({
					completionStatus: input.completionStatus,
				})
				.where(eq(courses.id, id));

			await db
				.insert(courseTranslations)
				.values({
					courseId: id,
					name: input.name,
					description: input.description,
					language,
					// TODO: Remove default
					default: false,
				})
				.onConflictDoUpdate({
					set: {
						...input,
						updatedAt: new Date(),
					},
					target: [
						courseTranslations.courseId,
						courseTranslations.language,
					],
				});

			return c.json(input);
		},
	)
	.delete("/:id", protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const teamId = c.get("teamId");

		await db
			.delete(courses)
			.where(and(eq(courses.id, id), eq(courses.teamId, teamId)));

		// TODO: DELETE full course (waiting on bun s3 list function)

		return c.json(null);
	})
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
							env.PUBLIC_SITE_URL !== "http://localhost:3000"
							? `https://${course.team.customDomain}/courses/${course.id}/join?learnerId=${learner.id}`
							: `${env.PUBLIC_SITE_URL}/play/${course.team?.id}/courses/${course.id}/join?learnerId=${learner.id}`
						: undefined,
			};
		});

		return c.json(extendedLearnerList);
	})
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

		// TODO:Send enrollment email (something like "You have enrolled" with a join link and a status link when we add login)
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
				teamId: course.teamId,
			}));

			const finalLearnersList = await db
				.insert(learners)
				.values(learnersList)
				.onConflictDoNothing()
				.returning();

			learnersList
				.filter((l) => l.sendEmail)
				.forEach(async (l) => {
					const id = finalLearnersList.find(
						(fl) => fl.email === l.email,
					)!.id;
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
						env.PUBLIC_SITE_URL !== "http://localhost:3000"
							? `https://${team.customDomain}${l.inviteLanguage ? `/${l.inviteLanguage}` : ""}/courses/${course.id}/join?learnerId=${id}`
							: `${env.PUBLIC_SITE_URL}${l.inviteLanguage ? `/${l.inviteLanguage}` : ""}/play/${course.team?.id}/courses/${course.id}/join?learnerId=${id}`;

					sendEmail({
						to: [l.email],
						subject: "Course Invite",
						content: (
							<CourseInvite
								href={href}
								name={name}
								teamName={team.name}
								logo={`${env.PUBLIC_SITE_URL}/cdn/${team.id}/${team.language}/logo?updatedAt=${team?.updatedAt.toString()}`}
								t={t.Email.CourseInvite}
							/>
						),
					});
				});

			return c.json(null);
		},
	)
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

		if (learner && learner.module) {
			const courseFileUrl = `/${learner.course.teamId}/courses/${learner.courseId}/${learner.module.language}${learner.module.versionNumber === 1 ? "" : "_" + learner.module.versionNumber}`;

			const imsManifest = s3.file(courseFileUrl + "/imsmanifest.xml");

			const { scorm, resources } = await parseIMSManifest(imsManifest);
			return c.json({
				learner: ExtendLearner(learner.module.type).parse(learner),
				url: `/cdn/${courseFileUrl}/${resources[0].href}`,
				type: scorm.metadata.schemaversion,
			});
		} else {
			throw new HTTPException(404, {
				message: "Learner not found",
			});
		}
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
			}

			await db
				.update(learners)
				.set({
					moduleId: courseModule!.id,
					...(input.data ? { data: input.data } : {}),
					...(completedAt ? { completedAt } : {}),
				})
				.where(
					and(eq(learners.courseId, id), eq(learners.id, learnerId)),
				);

			return c.json({ completedAt });
		},
	)
	.delete("/:id/learners/:learnerId", protectedMiddleware(), async (c) => {
		const { id, learnerId } = c.req.param();

		await db
			.delete(learners)
			.where(and(eq(learners.id, learnerId), eq(learners.courseId, id)));

		return c.json(null);
	})
	.get("/:id/modules", protectedMiddleware(), async (c) => {
		const { id } = c.req.param();
		const locale = c.get("locale");

		const moduleList = await db.query.modules.findMany({
			where: and(eq(modules.courseId, id), eq(modules.language, locale)),
			orderBy: desc(modules.versionNumber),
		});

		return c.json(moduleList);
	})
	.post(
		"/:id/modules",
		zValidator("form", ModuleFormSchema),
		protectedMiddleware(),
		async (c) => {
			const { id } = c.req.param();
			const teamId = c.get("teamId");
			const locale = c.get("locale");

			const course = await db.query.courses.findFirst({
				where: and(
					eq(courses.id, id),
					eq(courses.teamId, c.get("teamId")),
				),
			});

			if (!course) {
				throw new HTTPException(404, {
					message: "Course not found.",
				});
			}

			const moduleFile = c.req.valid("form").file;
			if (moduleFile === "") {
				throw new HTTPException(400, {
					message: "Module empty",
				});
			}
			const { entries, type } = await validateModule(moduleFile);

			const newestModule = await db
				.select({
					versionNumber: max(modules.versionNumber),
				})
				.from(modules)
				.where(
					and(eq(modules.courseId, id), eq(modules.language, locale)),
				);

			const insertId = Bun.randomUUIDv7();
			const versionNumber =
				newestModule.length > 0 && newestModule[0].versionNumber
					? newestModule[0].versionNumber + 1
					: 1;
			await db.insert(modules).values({
				id: insertId,
				courseId: id,
				type,
				language: locale,
				versionNumber,
			});

			Promise.all(
				Object.entries(entries).map(async ([key, file]) => {
					console.log("File", key);
					if (shouldIgnoreFile(key)) {
						return;
					}
					const blob = await file.blob();
					s3.write(
						`/${teamId}/courses/${id}/${locale}${versionNumber > 1 ? `_${versionNumber}` : ""}/${key}`,
						blob,
					);
				}),
			);

			return c.json({ id: insertId });
		},
	)

	.delete("/:id/modules/:moduleId", protectedMiddleware(), async (c) => {
		const { id, moduleId } = c.req.param();
		const teamId = c.get("teamId");

		const moduleExists = await db.query.modules.findFirst({
			where: and(eq(modules.id, moduleId), eq(modules.courseId, id)),
			with: {
				course: true,
			},
		});

		if (!moduleExists) {
			throw new HTTPException(404, {
				message: "Module does not exist",
			});
		}

		// If module is not owned by the team
		if (moduleExists.course.teamId !== teamId) {
			throw new HTTPException(401, {
				message: "Unauthorized",
			});
		}

		await db
			.delete(modules)
			.where(and(eq(modules.id, moduleId), eq(modules.courseId, id)));

		return c.json(null);
	});
