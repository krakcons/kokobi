import { getAuth } from "@/server/lib/auth";
import { createMiddleware } from "@tanstack/react-start";
import { LocalizedInputSchema } from "@/lib/locale";
import { getCookie, getHeader } from "@tanstack/react-start/server";
import { Role, roles } from "@/types/team";

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

export const learnerMiddleware = createMiddleware()
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

export const localeMiddleware = createMiddleware().server(async ({ next }) => {
	return next({
		context: LocalizedInputSchema.parse({
			locale: getHeader("locale") ?? getCookie("locale") ?? "en",
			fallbackLocale: getHeader("fallbackLocale"),
		}),
	});
});
