
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const tr46Shim = fileURLToPath(
  new URL("./src/lib/tr46-shim.cjs", import.meta.url)
);

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
      alias: [
        { find: /^tr46$/, replacement: tr46Shim },
        {
          find: /^lucide-react$/,
          replacement: fileURLToPath(
            new URL("./src/lib/lucide-icons.ts", import.meta.url)
          ),
        },
      ],
    },
  },
});
