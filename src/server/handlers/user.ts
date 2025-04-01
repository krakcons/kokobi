import { Hono } from "hono";
import {
	authenticatedMiddleware,
	HonoVariables,
	localeInputMiddleware,
	protectedMiddleware,
} from "../middleware";
import { db } from "@/server/db";
import { learners, usersToTeams } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { setCookie } from "hono/cookie";
import { LocaleSchema } from "@/lib/locale";
import { createI18n } from "@/lib/locale/actions";
import { handleLocalization } from "@/lib/locale/helpers";
import { ExtendLearner } from "@/types/learner";

export const userHandler = new Hono<{ Variables: HonoVariables }>()
	.get("/me", async (c) => {
		return c.json({
			user: c.get("user"),
			session: c.get("session"),
			teamId: c.get("teamId"),
		});
	})
	.get("/teams", protectedMiddleware(), localeInputMiddleware, async (c) => {
		const user = c.get("user");

		if (!user) {
			return c.text("Invalid session", 401);
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

		return c.json(teams.map(({ team }) => handleLocalization(c, team)));
	})
	.get("/i18n", async (c) => {
		const locale = c.get("locale");

		const i18n = await createI18n({ locale });

		return c.json(i18n);
	})
	.get("/preferences", async (c) => {
		let teamId = c.get("teamId");
		const user = c.get("user");

		if (user && !teamId) {
			console.log("getting team");
			const team = await db.query.usersToTeams.findFirst({
				where: and(eq(usersToTeams.userId, user.id)),
			});

			if (team) {
				setCookie(c, "teamId", team.teamId, {
					path: "/",
					secure: true,
					httpOnly: true,
					sameSite: "lax",
				});
				teamId = team.teamId;
			}
		}

		return c.json({
			teamId: c.get("teamId"),
			locale: c.get("locale"),
		});
	})
	.put(
		"/preferences",
		zValidator(
			"json",
			z.object({
				teamId: z.string().optional(),
				locale: LocaleSchema.optional(),
			}),
		),
		async (c) => {
			const { teamId, locale } = c.req.valid("json");

			if (teamId) {
				const user = c.get("user");

				if (!user) {
					return c.text("Invalid session", 401);
				}

				const team = await db.query.usersToTeams.findFirst({
					where: and(
						eq(usersToTeams.teamId, teamId),
						eq(usersToTeams.userId, user.id),
					),
				});

				if (!team) {
					return c.text("Invalid teamId", 400);
				}

				setCookie(c, "teamId", team.teamId, {
					path: "/",
					secure: true,
					httpOnly: true,
					sameSite: "lax",
				});
			}

			if (locale) {
				setCookie(c, "locale", locale, {
					path: "/",
					httpOnly: true,
					secure: true,
					sameSite: "lax",
				});
			}

			return c.json({
				success: true,
			});
		},
	)
	.get("/learners", authenticatedMiddleware(), async (c) => {
		const user = c.get("user");

		const learnerList = await db.query.learners.findMany({
			where: eq(learners.email, user!.email),
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
				module: true,
			},
		});

		return c.json(
			learnerList.map(({ course, team, module, ...learner }) => ({
				learner: ExtendLearner(module?.type).parse(learner),
				course: handleLocalization(c, course),
				team: handleLocalization(c, team),
			})),
		);
	})
	.get("/learners/:id", authenticatedMiddleware(), async (c) => {
		const user = c.get("user");
		const id = c.req.param("id");

		const learner = await db.query.learners.findFirst({
			where: and(eq(learners.email, user!.email), eq(learners.id, id)),
			with: {
				course: {
					with: {
						translations: true,
						team: {
							with: {
								translations: true,
							},
						},
					},
				},
				team: {
					with: {
						translations: true,
					},
				},
				module: true,
			},
		});

		if (!learner) {
			return c.text("Learner not found", 404);
		}

		return c.json({
			learner: ExtendLearner(learner.module?.type).parse(learner),
			course: handleLocalization(c, {
				...learner.course,
				team: handleLocalization(c, learner.course.team),
			}),
			team: handleLocalization(c, learner.team),
		});
	});
