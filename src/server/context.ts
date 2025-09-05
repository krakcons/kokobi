import { getWebRequest } from "@tanstack/react-start/server";

export const createOrpcContext = async () => {
	return {
		headers: getWebRequest().headers,
	};
};

export type OrpcContext = Awaited<ReturnType<typeof createOrpcContext>>;
