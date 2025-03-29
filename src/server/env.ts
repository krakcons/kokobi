import { z } from "zod";

const envSchema = z.object({
	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),
	VITE_SITE_URL: z.string().url(),
	VITE_ROOT_DOMAIN: z.string().min(1),
	VITE_CDN_URL: z.string().url(),
	VITE_API_URL: z.string().url(),
	NODE_ENV: z.string().optional(),
});

export const env = envSchema.parse(process.env);
