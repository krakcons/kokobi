import { Hono } from "hono";
import { collectionsHandler } from "./handlers/collections";
import { coursesHandler } from "./handlers/courses";
import { keysHandler } from "./handlers/keys";
import { learnersHandler } from "./handlers/learners";
import { modulesHandler } from "./handlers/modules";
import { teamsHandler } from "./handlers/teams";
import { authHandler } from "./handlers/auth";
import { userHandler } from "./handlers/user";

const app = new Hono()
	.basePath("/api")
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
