import { Hono } from "hono";
import { collectionsHandler } from "./handlers/collections";
import { coursesHandler } from "./handlers/courses";
import { keysHandler } from "./handlers/keys";
import { learnersHandler } from "./handlers/learners";
import { modulesHandler } from "./handlers/modules";
import { teamsHandler } from "./handlers/teams";
import { authHandler } from "./handlers/auth";
import { logger } from "hono/logger";
import { userHandler } from "./handlers/user";
import { authMiddleware, HonoVariables, localeMiddleware } from "./middleware";
import { createI18n } from "@/lib/locale/actions";

const app = new Hono<{
	Variables: HonoVariables;
}>()
	.use(logger())
	.use(authMiddleware)
	.use(localeMiddleware)
	.basePath("/api")
	.get("/test", (c) => {
		return c.json({
			message: "Test",
		});
	})
	.route("/auth", authHandler)
	.route("/learners", learnersHandler)
	.route("/modules", modulesHandler)
	.route("/courses", coursesHandler)
	.route("/keys", keysHandler)
	.route("/teams", teamsHandler)
	.route("/collections", collectionsHandler)
	.route("/user", userHandler);

export default app;

export type AppType = typeof app;
