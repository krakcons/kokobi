import { env } from "@/env";
import { Google } from "arctic";

console.log(env.VITE_SITE_URL);

export const google = new Google(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  `${env.VITE_SITE_URL}/api/auth/google/callback`,
);
