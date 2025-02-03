import { env } from "@/env";
import { AppType } from "@/server/api/hono";
import { hc } from "hono/client";

export const client = hc<AppType>(env.NEXT_PUBLIC_SITE_URL);
