import { Context, Hono } from "hono";
import {
	createSession,
	generateSessionToken,
	invalidateSession,
	validateSessionToken,
} from "@/server/auth";
import { google } from "@/server/auth/providers";
import { db, users, usersToTeams } from "@/server/db/db";
import { generateId } from "@/server/helpers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { generateCodeVerifier, generateState } from "arctic";
import { env } from "@/env";

const GoogleCallbackSchema = z
	.object({
		code: z.string(),
		state: z.string(),
		storedState: z.string(),
		storedCodeVerifier: z.string(),
	})
	.refine((data) => data.state === data.storedState, {
		message: "State mismatch",
	});

const handleUser = async (
	c: Context,
	options: {
		googleId: string;
		email: string;
	},
) => {
	const { googleId, email } = options;
	let userId: string;
	const existingUser = await db.query.users.findFirst({
		where: eq(users.googleId, googleId),
	});

	if (!existingUser) {
		userId = generateId(15);
		await db.insert(users).values({
			id: userId,
			email,
			googleId,
		});
	} else {
		userId = existingUser.id;
	}

	const token = generateSessionToken();
	await createSession(token, userId);

	setCookie(c, "auth_session", token, {
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		sameSite: "lax",
		path: "/",
	});

	const team = await db.query.usersToTeams.findFirst({
		where: eq(usersToTeams.userId, userId),
	});

	if (!team) {
		const locale = c.get("locale");
		return c.redirect(`/${locale}/create-team`);
	} else {
		setCookie(c, "teamId", team.teamId, {
			path: "/",
			secure: true,
			httpOnly: true,
			sameSite: "lax",
		});
	}

	return c.redirect("/admin");
};

export const authHandler = new Hono()
	.get("/signout", async (c) => {
		const sessionId = getCookie(c, "auth_session");
		if (!sessionId) return;
		deleteCookie(c, "auth_session");
		deleteCookie(c, "teamId");
		invalidateSession(sessionId);
		console.log("signout");
		return c.redirect(env.PUBLIC_SITE_URL);
	})
	.get("/google", async (c) => {
		const sessionId = getCookie(c, "auth_session");

		if (sessionId) {
			const { user } = await validateSessionToken(sessionId);

			if (user) {
				return c.redirect("/admin");
			}
		}

		const state = generateState();
		const codeVerifier = generateCodeVerifier();

		const url: URL = google.createAuthorizationURL(state, codeVerifier, [
			"profile",
			"email",
		]);

		setCookie(c, "state", state, {
			secure: process.env.NODE_ENV === "production",
			path: "/",
			httpOnly: true,
			maxAge: 60 * 10, // 10 min
		});

		setCookie(c, "codeVerifier", codeVerifier, {
			secure: process.env.NODE_ENV === "production",
			path: "/",
			httpOnly: true,
			maxAge: 60 * 10, // 10 min
		});

		return c.redirect(url.toString());
	})
	.get("/google/callback", async (c) => {
		// Validation
		const searchParams = c.req.query();

		const { code, storedCodeVerifier } = GoogleCallbackSchema.parse({
			code: searchParams.code,
			state: searchParams.state,
			storedState: getCookie(c, "state"),
			storedCodeVerifier: getCookie(c, "codeVerifier"),
		});

		const tokens = await google.validateAuthorizationCode(
			code,
			storedCodeVerifier,
		);

		const response = await fetch(
			"https://openidconnect.googleapis.com/v1/userinfo",
			{
				headers: {
					Authorization: `Bearer ${tokens.accessToken()}`,
				},
			},
		);
		const user: unknown = await response.json();
		const { sub: googleId, email } = z
			.object({
				sub: z.string(),
				email: z.string(),
			})
			.parse(user);

		return handleUser(c, { googleId, email });
	});
