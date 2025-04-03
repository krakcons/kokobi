import { handleUser } from "@/server/auth";
import { google, GoogleCallbackSchema } from "@/server/oauth";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getCookie, getQuery } from "@tanstack/react-start/server";
import { z } from "zod";

export const APIRoute = createAPIFileRoute("/api/auth/google/callback")({
	GET: async () => {
		const searchParams = getQuery();

		const { code, storedCodeVerifier } = GoogleCallbackSchema.parse({
			code: searchParams.code,
			state: searchParams.state,
			storedState: getCookie("state"),
			storedCodeVerifier: getCookie("codeVerifier"),
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

		const url = await handleUser({ googleId, email });

		return new Response(null, { status: 302, headers: { Location: url } });
	},
});
