import { Hono } from "hono";
import { collectionsHandler } from "./handlers/collections";
import { coursesHandler } from "./handlers/courses";
import { keysHandler } from "./handlers/keys";
import { learnersHandler } from "./handlers/learners";
import { modulesHandler } from "./handlers/modules";
import { teamsHandler } from "./handlers/teams";
import { authHandler } from "./handlers/auth";
import { userHandler } from "./handlers/user";
import { authMiddleware, HonoVariables, localeMiddleware } from "./middleware";

const app = new Hono<{
	Variables: HonoVariables;
}>()
	.use(authMiddleware)
	.use(localeMiddleware)
	.basePath("/api")
	.route("/auth", authHandler)
	.route("/team", teamsHandler)
	.route("/user", userHandler)
	.route("/learners", learnersHandler)
	.route("/modules", modulesHandler)
	.route("/courses", coursesHandler)
	.route("/keys", keysHandler)
	.route("/collections", collectionsHandler);

export default app;

export type AppType = typeof app;
