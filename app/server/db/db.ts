import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { relationSchemas, tableSchemas } from "./schema";

export * from "./schema";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL not set");
}

const schema = {
	...tableSchemas,
	...relationSchemas,
};

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
