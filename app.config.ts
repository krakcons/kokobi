// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { env } from "@/server/env";

export default defineConfig({
	server: {
		preset: "bun",
		routeRules: {
			"/cdn/**": {
				proxy: {
					to: env.VITE_CDN_URL + "/**",
				},
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
