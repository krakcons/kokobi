import { Hono } from "hono";
import { collectionsHandler } from "./handlers/collections";
import { coursesHandler } from "./handlers/courses";
import { keysHandler } from "./handlers/keys";
import { teamsHandler } from "./handlers/teams";
import { authHandler } from "./handlers/auth";
import { userHandler } from "./handlers/user";
import { authMiddleware, HonoVariables, localeMiddleware } from "./middleware";
import { logger } from "hono/logger";

const app = new Hono<{
	Variables: HonoVariables;
}>()
	.use(logger())
	.basePath("/api")
	.use(authMiddleware)
	.use(localeMiddleware)
	.route("/auth", authHandler)
	.route("/team", teamsHandler)
	.route("/user", userHandler)
	.route("/courses", coursesHandler)
	.route("/keys", keysHandler)
	.route("/collections", collectionsHandler);

export default app;

export type AppType = typeof app;
