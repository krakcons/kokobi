// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import nodePolyfills from "vite-plugin-node-polyfills";
var app_config_default = defineConfig({
  vite: {
    plugins: [
      // @ts-ignore
      tailwindcss(),
      // @ts-ignore
      tsConfigPaths({
        projects: ["./tsconfig.json"]
      }),
      nodePolyfills({
        include: ["buffer"],
        globals: {
          Buffer: true
        }
      })
    ]
  },
  server: {
    preset: "bun",
    rollupConfig: {
      output: {
        format: "esm"
      }
    },
    esbuild: {
      options: {
        target: "es2022"
      }
    }
  },
  routers: {
    ssr: {
      middleware: "./middleware.ts"
    }
  }
});
export {
  app_config_default as default
};
