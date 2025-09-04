import { ORPCError, os } from "@orpc/server";
import { roles, type Role } from "@/types/team";
import type { OrpcContext } from "./context";
import { LocalizedInputSchema } from "@/lib/locale";
import { getCookie } from "@orpc/server/helpers";

export const base = os.$context<OrpcContext>();

export const logMiddleware = base.middleware(async ({ context, next }) => {
	try {
		return await next({
			context,
		});
	} catch (e) {
		console.log(e);
		throw e;
	}
});

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

export const publicProcedure = base.use(logMiddleware).use(localeMiddleware);

export const protectedProcedure = base
	.use(logMiddleware)
	.use(localeMiddleware)
	.use(
		base.middleware(async ({ next, context }) => {
			const { session, user } = context;
			if (!session || !user) {
				throw new ORPCError("UNAUTHORIZED");
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

export const teamProcedure = ({ role = "member" }: { role?: Role } = {}) =>
	protectedProcedure.use(
		base.middleware(async ({ context, next }) => {
			const { teamId, role: teamRole } = context;
			if (
				!teamId ||
				(teamRole && roles.indexOf(teamRole) > roles.indexOf(role))
			) {
				throw new ORPCError("UNAUTHORIZED");
			}

			return next({
				context: {
					...context,
					teamId,
					role: teamRole,
				},
			});
		}),
	);

export const learnerProcedure = protectedProcedure.use(
	base.middleware(async ({ context, next }) => {
		const { learnerTeamId } = context;
		if (!learnerTeamId) {
			throw new ORPCError("UNAUTHORIZED");
		}

		return next({
			context: {
				...context,
				learnerTeamId,
			},
		});
	}),
);
