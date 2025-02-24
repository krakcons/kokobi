import { relationSchemas, tableSchemas } from "./schema";
import { Resource } from "sst";
import { drizzle } from "drizzle-orm/bun-sql";

export * from "./schema";

const schema = {
	...tableSchemas,
	...relationSchemas,
};

export const db = drizzle({
	connection: `postgres://${Resource.Aurora.username}:${Resource.Aurora.password}@${Resource.Aurora.host}:${Resource.Aurora.port}/${Resource.App.name}-${Resource.App.stage}`,
	schema,
});
