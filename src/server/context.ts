import { LocalizedInputSchema } from "@/lib/locale";
import { getCookie, getHeaders } from "@tanstack/react-start/server";
import { getAuth } from "./lib/auth";

export const createOrpcContext = async () => {
	const locale = getHeaders().locale ?? getCookie("locale");
	const fallbackLocale = getHeaders().fallbackLocale;

	const sessionId = getCookie("auth_session");
	const auth = await getAuth(sessionId);

	return {
		...auth,
		...LocalizedInputSchema.parse({
			locale: locale === "undefined" ? undefined : locale,
			fallbackLocale:
				fallbackLocale === "undefined" ? undefined : fallbackLocale,
		}),
	};
};

export type OrpcContext = Awaited<ReturnType<typeof createOrpcContext>>;
