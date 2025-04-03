// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { Resource } from "sst";

export default defineConfig({
	server: {
		preset: "bun",
		routeRules: {
			"/cdn/**": {
				proxy: {
					to: `https://${Resource.Bucket.name}.s3.amazonaws.com/**`,
				},
			},
		},
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
	vite: {
		plugins: [
			tailwindcss(),
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
		],
	},
});
