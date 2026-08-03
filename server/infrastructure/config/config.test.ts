// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "./config";

const original = { ...process.env };
afterEach(() => {
  process.env = { ...original };
});

describe("loadConfig", () => {
  it("uses safe development defaults", () => {
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_URL;
    process.env = { ...process.env, NODE_ENV: "development" };
    expect(loadConfig()).toMatchObject({ databaseUrl: "file:./dev.db", betterAuthSecret: "dev-secret", betterAuthUrl: "http://localhost:3000", nodeEnv: "development" });
  });

  it("requires the auth secret in production", () => {
    delete process.env.BETTER_AUTH_SECRET;
    process.env = { ...process.env, NODE_ENV: "production" };
    expect(() => loadConfig()).toThrow("BETTER_AUTH_SECRET is required in production");
  });
});
