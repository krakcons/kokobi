import { Hono } from "hono";
import { collectionsHandler } from "./handlers/collections";
import { coursesHandler } from "./handlers/courses";
import { keysHandler } from "./handlers/keys";
import { teamsHandler } from "./handlers/teams";
import { authHandler } from "./handlers/auth";
import { userHandler } from "./handlers/user";
import { aiHandler } from "./handlers/ai";
import { serveStatic } from "hono/bun";
import { authMiddleware, HonoVariables, localeMiddleware } from "./middleware";
import { logger } from "hono/logger";
import { env } from "@/server/env";
import { cors } from "hono/cors";

const app = new Hono<{
	Variables: HonoVariables;
}>();

app.use(logger());
app.use(
	cors({
		origin: [env.VITE_SITE_URL],
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

const apiRoutes = app
	.basePath("/api")
	.use(authMiddleware)
	.use(localeMiddleware)
	.route("/ai", aiHandler)
	.route("/auth", authHandler)
	.route("/team", teamsHandler)
	.route("/user", userHandler)
	.route("/courses", coursesHandler)
	.route("/keys", keysHandler)
	.route("/collections", collectionsHandler);

app.get("/cdn/**", (c) => {
	return fetch(env.VITE_CDN_URL + c.req.url.split("/cdn")[1]);
});
app.get("*", serveStatic({ root: "./dist/" }));
app.get("*", serveStatic({ path: "./dist/index.html" }));

export default app;

export type AppType = typeof apiRoutes;
