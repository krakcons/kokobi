import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { relationSchemas, tableSchemas } from "./schema";

export * from "./schema";

const schema = {
	...tableSchemas,
	...relationSchemas,
};

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
