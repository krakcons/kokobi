// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
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
	vite: {
		plugins: [
			tailwindcss(),
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
		],
	},
});
