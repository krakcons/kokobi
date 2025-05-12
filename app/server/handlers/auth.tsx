import { authMiddleware, localeMiddleware } from "../lib/middleware";
import { invalidateSession } from "@/server/lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";

export const getAuthFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		return context;
	});

export const deleteAuthFn = createServerFn()
	.middleware([authMiddleware, localeMiddleware])
	.validator(
		z
			.object({
				redirect: z.string().optional(),
			})
			.optional(),
	)
	.handler(async ({ context, data }) => {
		if (!context.user || !context.session) return;
		deleteCookie("auth_session");
		deleteCookie("teamId");
		deleteCookie("learnerTeamId");
		invalidateSession(context.session.id);
		if (data && data.redirect) {
			throw redirect({
				href: data.redirect,
			});
		} else {
			throw redirect({
				to: "/$locale/auth/login",
				params: { locale: context.locale },
			});
		}
	});
