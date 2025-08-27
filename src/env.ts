import { z } from "zod";

const envSchema = z.object({
	VITE_SITE_URL: z.url(),
});

export const env = envSchema.parse({
	VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
});
