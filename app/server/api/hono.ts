import { Hono } from "hono";
import { collectionsHandler } from "./handlers/collections";
import { coursesHandler } from "./handlers/courses";
import { keysHandler } from "./handlers/keys";
import { learnersHandler } from "./handlers/learners";
import { teamsHandler } from "./handlers/teams";
import { authHandler } from "./handlers/auth";
import { userHandler } from "./handlers/user";
import { authMiddleware, HonoVariables, localeMiddleware } from "./middleware";
import { env } from "@/env";
import { logger } from "hono/logger";

const app = new Hono<{
	Variables: HonoVariables;
}>();

app.use(logger());

app.get("/cdn/**", async (c) => {
	const url = env.PUBLIC_CDN_URL + c.req.path.split("/cdn")[1];
	console.log("CDN", url);
	return fetch(url, { ...c.req.raw });
});

const routes = app
	.use(authMiddleware)
	.use(localeMiddleware)
	.route("/api/auth", authHandler)
	.route("/api/team", teamsHandler)
	.route("/api/user", userHandler)
	.route("/api/learners", learnersHandler)
	.route("/api/courses", coursesHandler)
	.route("/api/keys", keysHandler)
	.route("/api/collections", collectionsHandler);

export default app;

export type AppType = typeof routes;
