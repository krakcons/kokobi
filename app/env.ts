import { z } from "zod";

const envSchema = z.object({
	RESEND_API_KEY: z.string().min(1),
	CRON_SECRET: z.string().min(1),
	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),
	TEAM_ID_VERCEL: z.string().min(1),
	PROJECT_ID_VERCEL: z.string().min(1),
	AUTH_BEARER_TOKEN_VERCEL: z.string().min(1),
	PUBLIC_SITE_URL: z.string().url(),
	PUBLIC_ROOT_DOMAIN: z.string().min(1),
	PUBLIC_CDN_URL: z.string().url(),
});

export const env = envSchema.parse(Bun.env);
