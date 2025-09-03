import { ORPCError, os } from "@orpc/server";
import type { OrpcContext } from "./context";
import { LocalizedInputSchema } from "@/lib/locale";
import { getCookie } from "@orpc/server/helpers";
import { auth, type Session } from "@/lib/auth";

export const base = os.$context<OrpcContext>();

const localeMiddleware = base.middleware(async ({ context, next }) => {
	const locale =
		context.headers.get("locale") ?? getCookie(context.headers, "locale");
	const fallbackLocale = context.headers.get("fallbackLocale");

	return next({
		context: {
			...context,
			...LocalizedInputSchema.parse({
				locale: locale === "undefined" ? undefined : locale,
				fallbackLocale:
					fallbackLocale === "undefined" ? undefined : fallbackLocale,
			}),
		},
	});
});

const authMiddleware = base.middleware(async ({ context, next }) => {
	const authResult = await auth.api.getSession({
		headers: context.headers,
	});

	if (!authResult) {
		throw new ORPCError("UNAUTHORIZED");
	}

	return next({
		context: {
			...context,
			...authResult,
			member: authResult.session
				? ((await auth.api.getActiveMember({
						headers: context.headers,
					})) ?? undefined)
				: undefined,
		},
	});
});

export const publicProcedure = base.use(localeMiddleware);

export const protectedProcedure = base
	.use(localeMiddleware)
	.use(authMiddleware);

export const organizationProcedure = protectedProcedure.use(
	base.$context<Session>().middleware(async ({ context, next }) => {
		if (!context.session.activeOrganizationId) {
			throw new ORPCError("UNAUTHORIZED");
		}

		return next({
			context: {
				...context,
				session: {
					...context.session,
					activeOrganizationId: context.session.activeOrganizationId,
				},
			},
		});
	}),
);

export const learnerProcedure = protectedProcedure.use(
	base.$context<Session>().middleware(async ({ context, next }) => {
		if (!context.session.activeLearnerTeamId) {
			throw new ORPCError("UNAUTHORIZED");
		}

		return next({
			context: {
				...context,
				session: {
					...context.session,
					activeLearnerTeamId: context.session.activeLearnerTeamId,
				},
			},
		});
	}),
);
