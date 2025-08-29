import { getCookie, getWebRequest } from "@tanstack/react-start/server";
import { getAuth } from "./lib/auth";

export const createOrpcContext = async () => {
	const sessionId = getCookie("auth_session");
	const auth = await getAuth(sessionId);

	return {
		...auth,
		headers: getWebRequest().headers,
	};
};

export type OrpcContext = Awaited<ReturnType<typeof createOrpcContext>>;
