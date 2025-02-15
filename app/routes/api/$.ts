import app from "@/server/api/hono";
import { createAPIFileRoute } from "@tanstack/start/api";

export const APIRoute = createAPIFileRoute("/api/$")({
	GET: ({ request }) => {
		console.log(request);
		return app.fetch(request);
	},
	POST: ({ request }) => {
		return app.fetch(request);
	},
	PUT: ({ request }) => {
		return app.fetch(request);
	},
	DELETE: ({ request }) => {
		return app.fetch(request);
	},
});
