// app.config.ts

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
	server: {
		port: 3000,
	},
	plugins: [
		// @ts-ignore
		tailwindcss(),
		// @ts-ignore
		tsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tanstackStart({
			target: "bun",
		}),
	],
});
