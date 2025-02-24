import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

export default defineConfig({
	dialect: "postgresql",
	schema: ["./app/server/db/schema.ts"],
	out: "./migrations",
	dbCredentials: {
		database: `${Resource.App.name}-${Resource.App.stage}`,
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
