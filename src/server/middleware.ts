import { LocalizedInputSchema } from "@/lib/locale";
import { os } from "@orpc/server";
import { getCookie, getHeader } from "@tanstack/react-start/server";
import { getAuth, type AuthResult } from "@/server/lib/auth";

export const localeMiddleware = os.middleware(async ({ next }) => {
	const locale = getHeader("locale") ?? getCookie("locale");
	const fallbackLocale = getHeader("fallbackLocale");
	return next({
		context: LocalizedInputSchema.parse({
			locale: locale === "undefined" ? undefined : locale,
			fallbackLocale:
				fallbackLocale === "undefined" ? undefined : fallbackLocale,
		}),
	});
});

export const authMiddleware = os.middleware(async ({ next }) => {
	const sessionId = getCookie("auth_session");
	const auth = await getAuth(sessionId);

	return next({
		context: auth,
	});
});

export const publicProcedure = os.use(localeMiddleware).use(authMiddleware);

export const protectedProcedure = os
	.use(localeMiddleware)
	.use(authMiddleware)
	.use(
		os.$context<AuthResult>().middleware(async ({ next, context }) => {
			const { session, user } = context;
			if (!session || !user) {
				throw new Error("Unauthorized");
			}

			return next({
				context: {
					...context,
					session,
					user,
				},
			});
		}),
	);
