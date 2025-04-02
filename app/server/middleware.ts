import { getAuth } from "@/server/auth";
import { createMiddleware } from "@tanstack/react-start";
import { LocalizedInputSchema } from "@/lib/locale/types";
import { getCookie } from "@tanstack/react-start/server";
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
			console.log(context);
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

export const localeMiddleware = createMiddleware()
	.validator(LocalizedInputSchema)
	.server(async ({ next, data }) => {
		return next({
			context: {
				...data,
			},
		});
	});
