import { authMiddleware, localeMiddleware } from "../middleware";
import { db } from "@/server/db";
import { usersToTeams } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { createI18n } from "@/lib/locale/actions";
import { handleLocalization } from "@/lib/locale/helpers";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LocaleSchema } from "@/lib/locale";
import { setCookie } from "@tanstack/react-start/server";

export const updateI18nFn = createServerFn({ method: "POST" })
	.validator(z.object({ locale: LocaleSchema }))
	.handler(async ({ data: { locale } }) => {
		setCookie("locale", locale);
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

//.get("/learners", authenticatedMiddleware(), async (c) => {
//	const user = c.get("user");
//
//	const learnerList = await db.query.learners.findMany({
//		where: eq(learners.email, user!.email),
//		with: {
//			course: {
//				with: {
//					translations: true,
//				},
//			},
//			team: {
//				with: {
//					translations: true,
//				},
//			},
//			module: true,
//		},
//	});
//
//	return c.json(
//		learnerList.map(({ course, team, module, ...learner }) => ({
//			learner: ExtendLearner(module?.type).parse(learner),
//			course: handleLocalization(c, course),
//			team: handleLocalization(c, team),
//		})),
//	);
//})
//.get("/learners/:id", authenticatedMiddleware(), async (c) => {
//	const user = c.get("user");
//	const id = c.req.param("id");
//
//	const learner = await db.query.learners.findFirst({
//		where: and(eq(learners.email, user!.email), eq(learners.id, id)),
//		with: {
//			course: {
//				with: {
//					translations: true,
//					team: {
//						with: {
//							translations: true,
//						},
//					},
//				},
//			},
//			team: {
//				with: {
//					translations: true,
//				},
//			},
//			module: true,
//		},
//	});
//
//	if (!learner) {
//		return c.text("Learner not found", 404);
//	}
//
//	return c.json({
//		learner: ExtendLearner(learner.module?.type).parse(learner),
//		course: handleLocalization(c, {
//			...learner.course,
//			team: handleLocalization(c, learner.course.team),
//		}),
//		team: handleLocalization(c, learner.team),
//	});
//});
