import { invalidateSession } from "@/server/auth";
import { env } from "@/server/env";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { authMiddleware } from "../middleware";

export const signOutFn = createServerFn()
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		if (!context.user || !context.session) return;
		deleteCookie("auth_session");
		deleteCookie("teamId");
		invalidateSession(context.session.id);
		throw redirect({ to: env.VITE_SITE_URL });
	});
