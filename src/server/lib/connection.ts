import { env } from "@/server/env";
import { LocaleSchema } from "@/lib/locale";
import { and, eq } from "drizzle-orm";
import { domains, users } from "@/server/db/schema";
import { db } from "@/server/db";
import { cf } from "@/server/cloudflare";
import { z } from "zod";

export const ConnectionLinkSchema = z.object({
	type: z.enum(["course", "collection"]),
	id: z.string(),
	organizationId: z.string(),
	locale: LocaleSchema.optional(),
});
export type ConnectionLink = z.infer<typeof ConnectionLinkSchema>;

export const getConnectionLink = async ({
	type,
	id,
	organizationId,
	locale,
}: ConnectionLink) => {
	const domain = await db.query.domains.findFirst({
		where: and(eq(domains.organizationId, organizationId)),
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
	if (organizationId && !verified) {
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
