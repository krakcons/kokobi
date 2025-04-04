import { relationSchemas, tableSchemas } from "./schema";
import { drizzle } from "drizzle-orm/bun-sql";
import { sql } from "bun";

const schema = {
	...tableSchemas,
	...relationSchemas,
};

export const db = drizzle({
	client: sql,
	schema,
});
