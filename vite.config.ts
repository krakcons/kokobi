// app.config.ts

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	server: {
		port: 3000,
	},
	build: {
		rollupOptions: {
			external: ["bun"],
		},
	},
	plugins: [
		tailwindcss(),
		tsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tanstackStart({
			target: "bun",
			customViteReactPlugin: true,
		}),
		react(),
	],
});
