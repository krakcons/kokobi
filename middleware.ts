import { Resource } from "sst";
import {
	defineMiddleware,
	deleteCookie,
	getRequestHost,
	getRequestURL,
	proxyRequest,
	setCookie,
} from "vinxi/http";

export default defineMiddleware({
	onRequest: async (event) => {
		const url = getRequestURL(event);
		const host = getRequestHost(event);

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

		if (host !== "localhost:3000") {
			// TODO: Get the teamId from hostname
			setCookie(event, "customHostname", "localhost:3000", {
				httpOnly: true,
			});
		} else {
			deleteCookie(event, "customHostname");
		}
	},
});
