import { relationSchemas, tableSchemas } from "./db/schema";
import { Resource } from "sst";
import { drizzle } from "drizzle-orm/bun-sql";

const schema = {
	...tableSchemas,
	...relationSchemas,
};

export const db = drizzle({
	connection: `postgres://${Resource.Aurora.username}:${Resource.Aurora.password}@${Resource.Aurora.host}:${Resource.Aurora.port}/${Resource.App.name}-${Resource.App.stage}`,
	schema,
});
