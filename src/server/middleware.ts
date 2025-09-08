import { ORPCError, os } from "@orpc/server";
import type { OrpcContext } from "./context";
import { LocalizedInputSchema } from "@/lib/locale";
import { getCookie } from "@orpc/server/helpers";
import { auth, type Session } from "@/lib/auth";

export const base = os.$context<OrpcContext>();

export const logMiddleware = base.middleware(async ({ context, next }) => {
	try {
		return await next({
			context,
		});
	} catch (e) {
		if (e instanceof ORPCError) {
			if (e.code !== "UNAUTHORIZED") {
				console.log(e.message);
			}
		} else {
			console.log(e);
		}

		throw e;
	}
});

const getAuth = async (headers: Headers) => {
	const authResult = await auth.api.getSession({
		headers,
	});

	return {
		user: authResult?.user ?? null,
		session: authResult?.session ?? null,
		member: authResult?.session
			? ((await auth.api.getActiveMember({
					headers,
				})) ?? null)
			: null,
	};
};

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
	const authResult = await getAuth(context.headers);

	return next({
		context: {
			...context,
			...authResult,
		},
	});
});

export const protectedMiddleware = base.middleware(
	async ({ context, next }) => {
		const authResult = await getAuth(context.headers);

		if (!authResult.user || !authResult.session) {
			throw new ORPCError("UNAUTHORIZED");
		}

		return next({
			context: {
				...context,
				...authResult,
				user: authResult.user,
				session: authResult.session,
			},
		});
	},
);

export const superAdminMiddleware = base.middleware(
	async ({ context, next }) => {
		const authResult = await getAuth(context.headers);

		if (!authResult.user || !authResult.session) {
			throw new ORPCError("UNAUTHORIZED");
		}

		if (authResult.user.role !== "admin") {
			throw new ORPCError("UNAUTHORIZED");
		}

		return next({
			context: {
				...context,
				...authResult,
			},
		});
	},
);

export const publicProcedure = base
	.use(logMiddleware)
	.use(localeMiddleware)
	.use(authMiddleware);

export const protectedProcedure = base
	.use(logMiddleware)
	.use(localeMiddleware)
	.use(protectedMiddleware);

export const superAdminProcedure = base
	.use(logMiddleware)
	.use(localeMiddleware)
	.use(superAdminMiddleware);

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
		if (!context.session.activeLearnerOrganizationId) {
			throw new ORPCError("UNAUTHORIZED");
		}

		return next({
			context: {
				...context,
				session: {
					...context.session,
					activeLearnerOrganizationId:
						context.session.activeLearnerOrganizationId,
				},
			},
		});
	}),
);
