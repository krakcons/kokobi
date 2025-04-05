import {
	authMiddleware,
	localeMiddleware,
	protectedMiddleware,
	teamMiddleware,
} from "../middleware";
import { db } from "@/server/db";
import {
	users,
	usersToCourses,
	usersToModules,
	usersToTeams,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { createI18n } from "@/lib/locale/actions";
import { handleLocalization } from "@/lib/locale/helpers";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LocaleSchema } from "@/lib/locale";
import { setCookie } from "@tanstack/react-start/server";
import { ExtendLearner } from "@/types/learner";

export const updateI18nFn = createServerFn({ method: "POST" })
	.validator(z.object({ locale: LocaleSchema }))
	.handler(async ({ data: { locale } }) => {
		setCookie("locale", locale);
		return { locale };
	});

export const getI18nFn = createServerFn({ method: "GET" })
	.middleware([localeMiddleware])
	.handler(async ({ context }) => {
		const locale = context.locale;
		const i18n = await createI18n({ locale });
		return i18n;
	});

export const getAuthFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		return context;
	});

export const getTeamsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware, localeMiddleware])
	.handler(async ({ context }) => {
		const user = context.user;

		if (!user) {
			throw new Error("Unauthorized");
		}

		const teams = await db.query.usersToTeams.findMany({
			where: eq(usersToTeams.userId, user.id),
			with: {
				team: {
					with: {
						translations: true,
					},
				},
			},
		});

		return teams.map(({ team }) => handleLocalization(context, team));
	});

export const getMyCoursesFn = createServerFn({ method: "GET" })
	.middleware([protectedMiddleware, localeMiddleware])
	.handler(async ({ context }) => {
		const user = context.user;

		if (!user) {
			throw new Error("Unauthorized");
		}

		const courseList = await db.query.usersToCourses.findMany({
			where: eq(usersToCourses.userId, user.id),
			with: {
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

		return courseList.map(({ course, team }) => ({
			...handleLocalization(context, course),
			team: handleLocalization(context, team),
		}));
	});

export const getMyCourseFn = createServerFn({ method: "GET" })
	.middleware([protectedMiddleware, localeMiddleware])
	.validator(z.object({ courseId: z.string() }))
	.handler(async ({ context, data: { courseId } }) => {
		const user = context.user;
		const course = await db.query.usersToCourses.findFirst({
			where: and(
				eq(usersToCourses.userId, user.id),
				eq(usersToCourses.courseId, courseId),
			),
			with: {
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

		if (!course) {
			return undefined;
		}

		const attempts = await db.query.usersToModules.findMany({
			where: and(
				eq(usersToModules.userId, user.id),
				eq(usersToModules.courseId, courseId),
			),
			with: {
				module: true,
			},
		});

		return {
			...handleLocalization(context, course.course),
			team: handleLocalization(context, course.team),
			attempts: attempts.map(({ module }) =>
				ExtendLearner(module.type).parse(module),
			),
		};
	});

//
//export const getMyLearnerFn = createServerFn({ method: "GET" })
//	.middleware([authMiddleware, localeMiddleware])
//	.validator(z.object({ learnerId: z.string() }))
//	.handler(async ({ context, data: { learnerId } }) => {
//		const user = context.user;
//
//		const learner = await db.query.learners.findFirst({
//			where: and(
//				eq(learners.email, user!.email),
//				eq(learners.id, learnerId),
//			),
//			with: {
//				course: {
//					with: {
//						translations: true,
//						team: {
//							with: {
//								translations: true,
//							},
//						},
//					},
//				},
//				team: {
//					with: {
//						translations: true,
//					},
//				},
//				module: true,
//			},
//		});
//
//		if (!learner) {
//			throw new Error("Learner not found");
//		}
//
//		return {
//			learner: ExtendLearner(learner.module?.type).parse(learner),
//			course: handleLocalization(context, {
//				...learner.course,
//				team: handleLocalization(context, learner.course.team),
//			}),
//			team: handleLocalization(context, learner.team),
//		};
//	});

export const setTeamFn = createServerFn({ method: "POST" })
	.middleware([teamMiddleware()])
	.validator(
		z.object({
			teamId: z.string(),
		}),
	)
	.handler(async ({ context, data }) => {
		if (data.teamId === context.teamId) {
			return;
		}

		const team = await db.query.usersToTeams.findFirst({
			where: and(
				eq(usersToTeams.userId, context.user.id),
				eq(usersToTeams.teamId, data.teamId),
			),
		});

		if (!team) {
			throw new Error("Team not found");
		}

		setCookie("teamId", data.teamId);
	});
