import { getAuth } from "@/server/lib/auth";
import { createMiddleware } from "@tanstack/react-start";
import { LocalizedInputSchema } from "@/lib/locale/types";
import { getCookie, getHeader } from "@tanstack/react-start/server";
import { Role, roles } from "@/types/users";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const sessionId = getCookie("auth_session");
	const auth = await getAuth(sessionId);

	return next({
		context: auth,
	});
});

export const protectedMiddleware = createMiddleware()
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
	createMiddleware()
		.middleware([protectedMiddleware])
		.server(async ({ context, next }) => {
			const { teamId, role: teamRole } = context;
			if (
				!teamId ||
				(teamRole && roles.indexOf(teamRole) > roles.indexOf(role))
			) {
				throw new Error("Unauthorized");
			}

			return next({
				context: {
					...context,
					teamId,
					role: teamRole,
				},
			});
		});

export const learnerMiddleware = createMiddleware()
	.middleware([protectedMiddleware])
	.server(async ({ context, next }) => {
		const { learnerTeamId } = context;
		if (!learnerTeamId) {
			throw new Error("Unauthorized");
		}

		return next({
			context: {
				...context,
				learnerTeamId,
			},
		});
	});

export const localeMiddleware = createMiddleware().server(async ({ next }) => {
	return next({
		context: LocalizedInputSchema.parse({
			locale: getHeader("locale") ?? getCookie("locale"),
			fallbackLocale: getHeader("fallbackLocale"),
		}),
	});
});
