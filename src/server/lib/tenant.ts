import { db } from "@/server/db";
import { domains } from "@/server/db/schema";
import { env } from "@/server/env";
import { getRequestHost } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";

export const getTenant = async () => {
	const hostname = getRequestHost();
	// return "0196631a-340f-7000-87f5-fc9b8941417b"; // For local development

	if (hostname === env.VITE_ROOT_DOMAIN) {
		return null;
	}

	const domain = await db.query.domains.findFirst({
		where: eq(domains.hostname, hostname),
	});

	return domain?.organizationId || null;
};
