import { authMiddleware, localeMiddleware } from "../lib/middleware";
import { invalidateSession } from "@/server/lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie } from "@tanstack/react-start/server";

export const getAuthFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		return context;
	});

export const deleteAuthFn = createServerFn({
	method: "POST",
})
	.middleware([authMiddleware, localeMiddleware])
	.handler(async ({ context }) => {
		if (!context.user || !context.session) return;
		deleteCookie("auth_session");
		deleteCookie("teamId");
		deleteCookie("learnerTeamId");
		invalidateSession(context.session.id);
	});
