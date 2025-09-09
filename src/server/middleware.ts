import { ORPCError, os } from "@orpc/server";
import type { OrpcContext } from "./context";
import { auth } from "@/lib/auth";
import { getCookie } from "@orpc/server/helpers";
import { LocalizedInputSchema, parseAcceptLanguage } from "@/lib/locale";

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
	// Prevent use the api key for user sessions
	const authHeaders = new Headers(headers);
	authHeaders.delete("x-api-key");

	let authResult = await auth.api.getSession({
		headers: authHeaders,
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

export const getLocaleContext = (headers: Headers) => {
	const locale =
		headers.get("locale") ??
		getCookie(headers, "locale") ??
		parseAcceptLanguage(headers.get("accept-language"));
	const fallbackLocale = headers.get("fallbackLocale") ?? "en";

	return LocalizedInputSchema.parse({
		locale,
		fallbackLocale,
	});
};

const localeMiddleware = base.middleware(async ({ context, next }) => {
	return next({
		context: {
			...context,
			...getLocaleContext(context.headers),
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

export const protectedMiddleware = authMiddleware.concat(
	async ({ context, next }) => {
		if (!context.user || !context.session) {
			throw new ORPCError("UNAUTHORIZED");
		}

		return next({
			context: {
				...context,
				user: context.user,
				session: context.session,
			},
		});
	},
);

export const superAdminMiddleware = protectedMiddleware.concat(
	async ({ context, next }) => {
		if (context.user?.role !== "admin") {
			throw new ORPCError("UNAUTHORIZED");
		}

		return next({
			context: {
				...context,
				user: {
					...context.user,
					role: context.user.role,
				},
			},
		});
	},
);

export const organizationMiddleware = authMiddleware.concat(
	async ({ context, next }) => {
		const key = context.headers.get("x-api-key");

		let organizationId: string | null | undefined = null;
		if (key) {
			const apiKey = await auth.api.verifyApiKey({
				body: {
					key,
				},
			});

			organizationId = apiKey.key?.metadata?.organizationId;
		} else {
			organizationId = context.session?.activeOrganizationId;
		}

		if (!organizationId) {
			throw new ORPCError("UNAUTHORIZED");
		}

		return next({
			context: {
				...context,
				activeOrganizationId: organizationId,
			},
		});
	},
);

export const learnerMiddleware = protectedMiddleware.concat(
	async ({ context, next }) => {
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
	},
);

export const baseProcedure = base.use(logMiddleware).use(localeMiddleware);
export const publicProcedure = baseProcedure.use(authMiddleware);
export const protectedProcedure = baseProcedure.use(protectedMiddleware);
export const superAdminProcedure = baseProcedure.use(superAdminMiddleware);
export const organizationProcedure = baseProcedure.use(organizationMiddleware);
export const learnerProcedure = baseProcedure.use(learnerMiddleware);
