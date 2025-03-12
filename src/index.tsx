import { serve } from "bun";
import app from "./api";
import index from "./index.html";
import { env } from "./env";

const server = serve({
	routes:
		env.NODE_ENV === "production"
			? {
					"/*": {
						GET: app.fetch,
						PUT: app.fetch,
						POST: app.fetch,
						DELETE: app.fetch,
					},
				}
			: { "/*": index },
	// Global error handler
	error: (error) => {
		console.error(error);
		return new Response(`Internal Error: ${error.message}`, {
			status: 500,
			headers: {
				"Content-Type": "text/plain",
			},
		});
	},
	development: env.NODE_ENV !== "production",
	maxRequestBodySize: 1024 * 1024 * 1024, // 1GB
});

console.log(`Server running at ${server.url}`);
