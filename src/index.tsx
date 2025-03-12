import { serve } from "bun";
import app from "./server";

const server = serve({
	fetch: app.fetch,
	maxRequestBodySize: 1024 * 1024 * 1024, // 1GB
});

console.log(`Server running at ${server.url}`);
