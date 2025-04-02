import { z } from "zod";
import { env } from "@/server/env";
import { Google } from "arctic";

export const google = new Google(
	env.GOOGLE_CLIENT_ID,
	env.GOOGLE_CLIENT_SECRET,
	`${env.VITE_SITE_URL}/api/auth/google/callback`,
);

export const GoogleCallbackSchema = z
	.object({
		code: z.string(),
		state: z.string(),
		storedState: z.string(),
		storedCodeVerifier: z.string(),
	})
	.refine((data) => data.state === data.storedState, {
		message: "State mismatch",
	});
