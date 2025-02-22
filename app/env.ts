import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		RESEND_API_KEY: z.string().min(1),
		CRON_SECRET: z.string().min(1),
		SVIX_AUTH_TOKEN: z.string().min(1),
		GOOGLE_CLIENT_ID: z.string().min(1),
		GOOGLE_CLIENT_SECRET: z.string().min(1),
		TEAM_ID_VERCEL: z.string().min(1),
		PROJECT_ID_VERCEL: z.string().min(1),
		AUTH_BEARER_TOKEN_VERCEL: z.string().min(1),
	},
	clientPrefix: "PUBLIC_",
	client: {
		PUBLIC_SITE_URL: z.string().url(),
		PUBLIC_ROOT_DOMAIN: z.string().min(1),
		PUBLIC_R2_URL: z.string().url(),
	},
	runtimeEnv: { ...Bun.env },
});
