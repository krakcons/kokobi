import app from "@/server/api/hono";
import index from "./index.html";

Bun.serve({
	port: 3000,
	static: {
		"/en/*": index,
		"/fr/*": index,
	},
	development: true,
	fetch: app.fetch,
});
