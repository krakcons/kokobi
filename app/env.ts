import { z } from "zod";

const envSchema = z.object({
	VITE_SITE_URL: z.string().url(),
});

export const env = envSchema.parse({
	...import.meta.env,
	VITE_SITE_URL: import.meta.env.VITE_SITE_URL ?? window.origin,
});
