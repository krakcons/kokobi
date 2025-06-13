import { getAuth } from "@/server/lib/auth";
import { createMiddleware } from "@tanstack/react-start";
import { LocalizedInputSchema } from "@/lib/locale";
import { getCookie, getHeader } from "@tanstack/react-start/server";
import { Role, roles } from "@/types/team";

export const authMiddleware = createMiddleware({
	type: "function",
}).server(async ({ next }) => {
	const sessionId = getCookie("auth_session");
	const auth = await getAuth(sessionId);

	return next({
		context: auth,
	});
});

export const protectedMiddleware = createMiddleware({
	type: "function",
})
	.middleware([authMiddleware])
	.server(async ({ context, next }) => {
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
	});

export const teamMiddleware = ({ role = "member" }: { role?: Role } = {}) =>
	createMiddleware({
		type: "function",
	})
		.middleware([protectedMiddleware])
		.server(async ({ context, next }) => {
			const { teamId, role: teamRole } = context;
			if (
				!teamId ||
				(teamRole && roles.indexOf(teamRole) > roles.indexOf(role))
			) {
				throw new Error("No admin team or role not permitted");
			}

			return next({
				context: {
					...context,
					teamId,
					role: teamRole,
				},
			});
		});

export const learnerMiddleware = createMiddleware({
	type: "function",
})
	.middleware([protectedMiddleware])
	.server(async ({ context, next }) => {
		const { learnerTeamId } = context;
		if (!learnerTeamId) {
			throw new Error("No learner team");
		}

		return next({
			context: {
				...context,
				learnerTeamId,
			},
		});
	});

export const localeMiddleware = createMiddleware({
	type: "function",
}).server(async ({ next }) => {
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
