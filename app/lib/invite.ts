import { env } from "@/server/env";
import { LocaleSchema } from "./locale";
import { and, eq } from "drizzle-orm";
import { domains } from "@/server/db/schema";
import { db } from "@/server/db";
import { cf } from "@/server/cloudflare";
import { z } from "zod";

export const ConnectionLinkSchema = z.object({
	type: z.enum(["course", "collection"]),
	id: z.string(),
	teamId: z.string(),
	locale: LocaleSchema.optional(),
});
export type ConnectionLink = z.infer<typeof ConnectionLinkSchema>;

export const getConnectionLink = async ({
	type,
	id,
	teamId,
	locale,
}: ConnectionLink) => {
	const domain = await db.query.domains.findFirst({
		where: and(eq(domains.teamId, teamId)),
	});
	let verified = false;
	if (domain) {
		const cloudflare = await cf.customHostnames.get(domain.hostnameId, {
			zone_id: env.CLOUDFLARE_ZONE_ID,
		});
		verified = cloudflare.status === "active";
	}
	const base =
		domain && verified ? `https://${domain.hostname}` : env.VITE_SITE_URL;
	const url = new URL(base);
	url.pathname = `${locale ? `/${locale}` : ""}/learner/${type}s/${id}`;
	if (teamId && !domain) {
		url.searchParams.set("teamId", teamId);
	}
	return url.toString();
};
