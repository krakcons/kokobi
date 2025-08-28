import { s3 } from "@/server/s3";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/cdn/$").methods({
	GET: async ({ request }) => {
		const url = new URL(request.url);

		if (url.pathname.startsWith("/cdn")) {
			let path = url.pathname.split("/cdn")[1];
			if (path.endsWith("/scormcontent/0")) {
				path = path.replace(
					"/scormcontent/0",
					"/scormcontent/index.html",
				);
			}
			if (path.startsWith("/db/")) {
				return undefined;
			}
			const file = await s3.file(path).arrayBuffer();
			return new Response(file, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET",
				},
			});
		}
	},
});
