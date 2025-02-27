import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	schema: ["./app/api/db/schema.ts"],
	out: "./migrations",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
	verbose: true,
	strict: true,
});
