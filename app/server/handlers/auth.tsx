import { authMiddleware, localeMiddleware } from "../middleware";
import { invalidateSession } from "@/server/auth";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

export const getAuthFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		return context;
	});

export const deleteAuthFn = createServerFn()
	.middleware([authMiddleware, localeMiddleware])
	.handler(async ({ context }) => {
		if (!context.user || !context.session) return;
		deleteCookie("auth_session");
		deleteCookie("teamId");
		deleteCookie("learnerTeamId");
		invalidateSession(context.session.id);
		throw redirect({
			to: "/$locale/auth/login",
			params: { locale: context.locale },
		});
	});
