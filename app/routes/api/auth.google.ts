import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getEvent, setCookie } from "@tanstack/react-start/server";
import { generateCodeVerifier, generateState } from "arctic";
import { google } from "@/server/oauth";

export const APIRoute = createAPIFileRoute("/api/auth/google")({
	GET: async () => {
		const event = getEvent();
		const state = generateState();

		const codeVerifier = generateCodeVerifier();

		const url: URL = google.createAuthorizationURL(state, codeVerifier, [
			"profile",
			"email",
		]);

		setCookie(event, "state", state, {
			secure: process.env.NODE_ENV === "production",
			path: "/",
			httpOnly: true,
			maxAge: 60 * 10, // 10 min
		});

		setCookie(event, "codeVerifier", codeVerifier, {
			secure: process.env.NODE_ENV === "production",
			path: "/",
			httpOnly: true,
			maxAge: 60 * 10, // 10 min
		});

		return new Response(null, {
			status: 302,
			headers: { Location: url.toString() },
		});
	},
});
