import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: ["./src/server/db/schema.ts"],
	out: "./migrations",
	dbCredentials: {
		url: "file:persist/sqlite.db",
	},
	verbose: true,
	strict: true,
});
