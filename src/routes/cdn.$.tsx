import { s3 } from "@/server/s3";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/cdn/$").methods({
	GET: async ({ pathname }) => {
		if (pathname.startsWith("/cdn")) {
			let path = pathname.split("/cdn")[1];
			if (path.endsWith("/scormcontent/0")) {
				path = path.replace(
					"/scormcontent/0",
					"/scormcontent/index.html",
				);
			}
			if (path.startsWith("/db/")) {
				return undefined;
			}
			path = decodeURIComponent(path);
			const file = s3.file(path);
			const stat = await s3.stat(path);
			const buffer = await file.arrayBuffer();
			return new Response(buffer, {
				headers: {
					"Content-Type": stat.type,
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET",
				},
			});
		}
	},
});
