// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	vite: {
		plugins: [
			// @ts-ignore
			tailwindcss(),
			// @ts-ignore
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
		],
	},
	server: {
		preset: "bun",
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
		ssr: {
			middleware: "./middleware.ts",
		},
	},
});
