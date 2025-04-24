import { db } from "@/server/db";
import { domains } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getRequestHost } from "@tanstack/react-start/server";
import { env } from "@/server/env";

export const getTenant = async () => {
	const hostname = getRequestHost();

	if (hostname === env.VITE_ROOT_DOMAIN) {
		return null;
	}

	const domain = await db.query.domains.findFirst({
		where: eq(domains.hostname, hostname),
	});

	return domain ? domain.teamId : null;
};
