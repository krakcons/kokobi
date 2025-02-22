import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

if (!process.env.TENANT_STAGE_NAME) {
	throw new Error("TENANT_STAGE_NAME is not set: Drizzle Studio");
}

export default defineConfig({
	dialect: "postgresql",
	schema: ["./app/server/db/schema.ts"],
	out: "./migrations",
	dbCredentials: {
		database: process.env.TENANT_STAGE_NAME,
		host: Resource.Aurora.host,
		port: Resource.Aurora.port,
		user: Resource.Aurora.username,
		password: Resource.Aurora.password,
		ssl: {
			rejectUnauthorized: false,
		},
	},
	verbose: true,
	strict: true,
});
