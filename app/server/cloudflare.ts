import Cloudflare from "cloudflare";
import { env } from "@/server/env";

export const cf = new Cloudflare({
	apiToken: env.CLOUDFLARE_API_TOKEN,
});
