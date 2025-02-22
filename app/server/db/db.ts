import { relationSchemas, tableSchemas } from "./schema";
import { Resource } from "sst";
import { drizzle } from "drizzle-orm/bun-sql";
import { env } from "@/env";

export * from "./schema";

const schema = {
	...tableSchemas,
	...relationSchemas,
};

export const db = drizzle({
	connection: `postgres://${Resource.Aurora.username}:${Resource.Aurora.password}@${Resource.Aurora.host}:${Resource.Aurora.port}/${env.TENANT_STAGE_NAME}`,
	schema,
});
