import { createServerFileRoute } from "@tanstack/react-start/server";
import { Resource } from "sst";

export const ServerRoute = createServerFileRoute("/cdn/$").methods({
	GET: async ({ request }) => {
		const url = new URL(request.url);

		if (url.pathname.startsWith("/cdn")) {
			if (url.pathname.endsWith("/scormcontent/0")) {
				url.pathname = url.pathname.replace(
					"/scormcontent/0",
					"/scormcontent/index.html",
				);
			}
			return fetch(
				`https://${Resource.Bucket.name}.s3.amazonaws.com${url.pathname.split("/cdn")[1]}`,
			);
		}
	},
});
