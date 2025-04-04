import Cloudflare from "cloudflare";
import { env } from "./env";

export const cf = new Cloudflare({
	apiToken: env.CLOUDFLARE_API_TOKEN,
});
