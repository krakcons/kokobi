import app from "./server/api/hono";
import index from "./index.html";

const server = Bun.serve({
	port: 3000,
	static: {
		"/en/*": index,
		"/fr/*": index,
	},
	development: true,
	fetch: app.fetch,
	maxRequestBodySize: 1024 * 1024 * 1024, // 1GB
});

console.log(`Server running at ${server.url}`);
