import { z } from "zod";

const envSchema = z.object({
	VITE_SITE_URL: z.string().url(),
});

export const env = envSchema.parse({
	VITE_SITE_URL:
		import.meta.env.VITE_SITE_URL ??
		process.env.VITE_SITE_URL ??
		(typeof window !== "undefined"
			? window.location.origin
			: "http://localhost:3000"),
});
