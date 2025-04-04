import { Resource } from "sst";
import { defineMiddleware, getRequestURL, proxyRequest } from "vinxi/http";

export default defineMiddleware({
	onRequest: async (event) => {
		const url = getRequestURL(event);

		if (url.pathname.startsWith("/cdn")) {
			if (url.pathname.endsWith("/scormcontent/0")) {
				url.pathname = url.pathname.replace(
					"/scormcontent/0",
					"/scormcontent/index.html",
				);
			}
			return proxyRequest(
				event,
				`https://${Resource.Bucket.name}.s3.amazonaws.com/${url.pathname.split("/cdn")[1]}`,
			);
		}
	},
});
