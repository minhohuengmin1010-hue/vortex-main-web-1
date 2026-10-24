import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: () => Response.json({ status: "ok", service: "vortex-dashboard" }),
    },
  },
});