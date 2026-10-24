
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: { preset: "node-server" },

  tanstackStart: {
    server: { entry: "server" },
  },

  vite: {
    server: {
      host: "0.0.0.0",
      port: Number(process.env["PORT"] ?? 8080),
      strictPort: true,
      allowedHosts: true,
    },

    preview: {
      host: "0.0.0.0",
      port: Number(process.env["PORT"] ?? 8080),
      strictPort: true,
      allowedHosts: [
        "vortex-main-web-1.onrender.com",
        ".onrender.com",
      ],
    },

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
