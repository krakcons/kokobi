import { Hono } from "hono";
import { collectionsHandler } from "./handlers/collections";
import { coursesHandler } from "./handlers/courses";
import { keysHandler } from "./handlers/keys";
import { learnersHandler } from "./handlers/learners";
import { modulesHandler } from "./handlers/modules";
import { teamsHandler } from "./handlers/teams";
import { authHandler } from "./handlers/auth";

const app = new Hono()
  .basePath("/api")
  .get("/test", (c) => {
    return c.json({ message: "Hello World" });
  })
  .route("/auth", authHandler)
  .route("/learners", learnersHandler)
  .route("/modules", modulesHandler)
  .route("/courses", coursesHandler)
  .route("/keys", keysHandler)
  .route("/teams", teamsHandler)
  .route("/collections", collectionsHandler);

export default app;

export type AppType = typeof app;
