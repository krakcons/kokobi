import { LocaleSchema } from "@/lib/locale";
import { cf } from "@/server/cloudflare";
import { db } from "@/server/db";
import { domains, users } from "@/server/db/schema";
import { env } from "@/server/env";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const ConnectionLinkSchema = z.object({
	type: z.enum(["course", "collection"]),
	id: z.string(),
	organizationId: z.string(),
	locale: LocaleSchema.optional(),
	isPublic: z.boolean().default(false).optional(),
});
export type ConnectionLink = z.infer<typeof ConnectionLinkSchema>;

export const getConnectionLink = async ({
	type,
	id,
	organizationId,
	locale,
	isPublic,
}: ConnectionLink) => {
	const domain = await db.query.domains.findFirst({
		where: and(eq(domains.organizationId, organizationId)),
	});
	let isCustomDomain = false;
	let base = env.VITE_SITE_URL;

	if (domain) {
		const cloudflare = await cf.customHostnames.get(domain.hostnameId, {
			zone_id: env.CLOUDFLARE_ZONE_ID,
		});
		if (cloudflare.status === "active") {
			base = `https://${domain.hostname}`;
			isCustomDomain = true;
		}
	}

	const url = new URL(base);

	url.pathname = `${locale ? `/${locale}` : ""}${isPublic ? "/" : /learner/}${type}s/${id}`;

	if (organizationId && !isCustomDomain) {
		url.searchParams.set("organizationId", organizationId);
	}
	return url.toString();
};

export const getUserList = async ({ emails }: { emails: string[] }) => {
	return await db
		.insert(users)
		.values(
			emails.map((email) => ({
				email,
				name: "",
				id: Bun.randomUUIDv7(),
			})),
		)
		.onConflictDoUpdate({
			target: [users.email],
			set: {
				updatedAt: new Date(),
			},
		})
		.returning();
};
