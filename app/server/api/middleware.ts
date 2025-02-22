import { SessionValidationResult, validateSessionToken } from "@/server/auth";
import { db } from "@/server/db/db";
import { keys, Session, usersToTeams } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { Role, roles, User } from "@/types/users";
import { LocalizedInputSchema, LocalizedInputType } from "@/lib/locale/types";
import { Locale, locales, LocaleSchema } from "@/lib/locale";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export type HonoVariables = LocalizedInputType &
	SessionValidationResult & { teamId: string | null };

export const authMiddleware = createMiddleware(async (c, next) => {
	const apiKey = c.req.header("x-api-key");
	const sessionId = getCookie(c, "auth_session");

	if (apiKey) {
		const key = await db.query.keys.findFirst({
			where: eq(keys.key, apiKey),
		});

		if (key) {
			c.set("teamId", key.teamId);
			return await next();
		} else {
			return c.text("Invalid API key", 401);
		}
	}

	if (sessionId) {
		const { user, session } = await validateSessionToken(sessionId);

		if (!user) {
			c.set("teamId", null);
			c.set("user", null);
			c.set("session", null);
			return await next();
		}

		c.set("user", user);
		c.set("session", session);

		const teamId = getCookie(c, "teamId") || c.req.header("teamId");

		if (!teamId) {
			c.set("teamId", null);
			return await next();
		}

		const team = await db.query.usersToTeams.findFirst({
			where: and(
				eq(usersToTeams.userId, user.id),
				eq(usersToTeams.teamId, teamId),
			),
		});

		if (!team) {
			return c.text("Invalid team", 401);
		}

		c.set("teamId", team.teamId);

		return await next();
	}

	c.set("teamId", null);
	c.set("user", null);
	c.set("session", null);
	return await next();
});

export const protectedMiddleware = ({
	role = "member",
}: { role?: Role } = {}) =>
	createMiddleware<{
		Variables: HonoVariables & {
			user: User;
			session: Session;
			teamId: string;
			teamRole: Role;
		};
	}>(async (c, next) => {
		const teamRole = c.get("teamRole");
		if (roles.indexOf(teamRole) > roles.indexOf(role)) {
			return c.text("Invalid role", 401);
		}

		if (c.get("teamId") && c.get("user") && c.get("session")) {
			return await next();
		}
		return c.text("Unauthorized", 401);
	});

export const localeInputMiddleware = zValidator(
	"query",
	z
		.object({
			locale: LocaleSchema.optional(),
			"fallback-locale": LocaleSchema.or(z.literal("none")).optional(),
			"editing-locale": LocaleSchema.optional(),
		})
		.optional(),
);

export const localeMiddleware = createMiddleware<{ Variables: HonoVariables }>(
	async (c, next) => {
		const locale = LocalizedInputSchema.shape.locale.parse(
			c.req.query("locale") ??
				c.req.header("locale") ??
				getCookie(c, "locale") ??
				"en",
		);

		const ignorePaths = ["/api", "/cdn"];
		if (!ignorePaths.some((path) => c.req.path.startsWith(path))) {
			// Handle locale
			let pathLocale = c.req.path.split("/")[1];
			if (!locales.some(({ value }) => value === pathLocale)) {
				return c.redirect(`/${locale}${c.req.path}`);
			} else {
				c.set("locale", pathLocale as Locale);
				setCookie(c, "locale", pathLocale);
			}
		}

		const fallbackLocale = LocalizedInputSchema.shape.fallbackLocale.parse(
			c.req.query("fallback-locale") ??
				c.req.header("fallback-locale") ??
				"en",
		);

		const editingLocale =
			LocaleSchema.optional().parse(
				c.req.query("editing-locale") ??
					c.req.header("editing-locale") ??
					getCookie(c, "editing-locale"),
			) ?? locale;

		c.set("locale", locale);
		c.set("fallbackLocale", fallbackLocale);
		c.set("editingLocale", editingLocale);

		return await next();
	},
);
