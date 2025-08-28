import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	server: {
		port: 3000,
	},
	build: {
		rollupOptions: {
			external: ["bun", "bun:*"],
		},
	},
	optimizeDeps: {
		exclude: ["bun"],
	},
	plugins: [
		// this is the plugin that enables path aliases
		tsconfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart({
			target: "bun",
			customViteReactPlugin: true,
		}),
		react(),
	],
});
