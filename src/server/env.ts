import { z } from "zod";

const envSchema = z.object({
	VITE_SITE_URL: z.url(),
	VITE_ROOT_DOMAIN: z.string().min(1),
	NODE_ENV: z.string().optional(),
	CLOUDFLARE_API_TOKEN: z.string().min(1),
	CLOUDFLARE_ZONE_ID: z.string().min(1),
	WELCOME_ORGANIZATION_ID: z.string().min(1),
	S3_BUCKET: z.string().min(1),
	AWS_ACCESS_KEY_ID: z.string().min(1),
	AWS_SECRET_ACCESS_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
