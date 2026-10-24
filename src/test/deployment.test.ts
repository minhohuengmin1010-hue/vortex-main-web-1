import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Route } from "../routes/api/public/health";

describe("Render deployment", () => {
  it("starts the Node server on all interfaces", () => {
    const dockerfile = readFileSync("Dockerfile", "utf8");
    expect(dockerfile).toContain("ENV HOST=0.0.0.0");
    expect(dockerfile).toContain('CMD ["node", ".output/server/index.mjs"]');
    expect(dockerfile).toContain("bun install --frozen-lockfile");
  });

  it("exposes a credential-independent health check for Render", async () => {
    const handlers = Route.options.server?.handlers;
    const get = handlers && typeof handlers !== "function" ? handlers.GET : undefined;
    if (typeof get !== "function") throw new Error("Health GET handler is missing");
    const response = await (get as () => Response)();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", service: "vortex-dashboard" });
    expect(readFileSync("render.yaml", "utf8")).toContain("healthCheckPath: /api/public/health");
  });
});