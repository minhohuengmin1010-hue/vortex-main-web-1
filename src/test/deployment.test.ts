import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Route } from "../routes/api/public/health";

describe("Render deployment", () => {
  it("starts the Node server on all interfaces", () => {
    const blueprint = readFileSync("render.yaml", "utf8");
    expect(blueprint.match(/runtime: node/g)).toHaveLength(2);
    expect(blueprint).not.toContain("runtime: docker");
    expect(blueprint).toContain("startCommand: node .output/server/index.mjs");
    expect(blueprint).toContain("value: 0.0.0.0");
    expect(blueprint).toContain("bun install --frozen-lockfile");
    expect(existsSync("Dockerfile")).toBe(false);
    expect(existsSync(".dockerignore")).toBe(false);
  });

  it("deploys the separate bot as Node with persistent sessions", () => {
    const blueprint = readFileSync("render.yaml", "utf8");
    expect(blueprint).toContain("rootDir: services/vortex-bot");
    expect(blueprint).toContain("startCommand: node src/server.mjs");
    expect(blueprint).toContain("mountPath: /var/data");
    expect(blueprint).toContain("value: /var/data/vortex");
    expect(existsSync("services/vortex-bot/src/server.mjs")).toBe(true);
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