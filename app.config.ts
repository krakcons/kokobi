// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { Resource } from "sst";

export default defineConfig({
	server: {
		preset: "bun",
		//routeRules: {
		//	// Move to tss rewrite when available
		//	"/cdn/**": {
		//		proxy: {
		//			to: `https://${Resource.Bucket.name}.s3.amazonaws.com/**`,
		//		},
		//	},
		//},
		rollupConfig: {
			output: {
				format: "esm",
			},
		},
		esbuild: {
			options: {
				target: "es2022",
			},
		},
	},
	routers: {
		api: {
			middleware: "./middleware.ts",
		},
		server: {
			middleware: "./middleware.ts",
		},
		ssr: {
			middleware: "./middleware.ts",
		},
	},
	vite: {
		plugins: [
			tailwindcss(),
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
		],
	},
});
