import { relationSchemas, tableSchemas } from "./schema";
import { Resource } from "sst";
import { drizzle } from "drizzle-orm/bun-sql";

export * from "./schema";

if (!process.env.TENANT_STAGE_NAME) {
	throw new Error("TENANT_STAGE_NAME is not set");
}

const schema = {
	...tableSchemas,
	...relationSchemas,
};

export const db = drizzle({
	connection: `postgres://${Resource.Aurora.username}:${Resource.Aurora.password}@${Resource.Aurora.host}:${Resource.Aurora.port}/${process.env.TENANT_STAGE_NAME}`,
	schema,
});
