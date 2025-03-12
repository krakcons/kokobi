import { z } from "zod";

const envSchema = z.object({
	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),
	PUBLIC_SITE_URL: z.string().url(),
	PUBLIC_ROOT_DOMAIN: z.string().min(1),
	PUBLIC_CDN_URL: z.string().url(),
	NODE_ENV: z.string().optional(),
});

export const env = envSchema.parse(process.env);
