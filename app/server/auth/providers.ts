import { env } from "@/env";
import { Google } from "arctic";

export const google = new Google(
	env.GOOGLE_CLIENT_ID,
	env.GOOGLE_CLIENT_SECRET,
	`${env.PUBLIC_SITE_URL}/api/auth/google/callback`,
);
