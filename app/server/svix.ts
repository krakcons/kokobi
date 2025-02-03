import { env } from "@/env";
import { Svix } from "svix";
import { z } from "zod";

export const svix = new Svix(env.SVIX_AUTH_TOKEN);

export const SvixErrorSchema = z.object({
	body: z.object({
		code: z.string(),
		detail: z.string(),
	}),
});
