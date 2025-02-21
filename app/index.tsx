import app from "@/server/api/hono";
import index from "./index.html";

Bun.serve({
	port: 3000,
	static: {
		"/": index,
	},
	fetch: app.fetch,
});
