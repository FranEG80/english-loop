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
    delete process.env.CONTENT_SOURCE;
    delete process.env.DATABASE_PROVIDER;
    delete process.env.D1_TRANSPORT;
    expect(loadConfig()).toMatchObject({
      databaseUrl: "file:./dev.db",
      contentSource: "dataset",
      databaseProvider: "sqlite",
      d1Transport: "binding",
      d1HttpUrl: null,
      d1HttpToken: null,
      betterAuthSecret: "dev-secret",
      betterAuthUrl: "http://localhost:3000",
      nodeEnv: "development",
    });
  });

  it("validates the deployment-selected persistence mode", () => {
    process.env = {
      ...process.env,
      CONTENT_SOURCE: "database",
      DATABASE_PROVIDER: "d1",
      D1_TRANSPORT: "http",
      D1_HTTP_URL: "https://d1.example.test",
      D1_HTTP_TOKEN: "test-token",
    };
    expect(loadConfig()).toMatchObject({
      contentSource: "database",
      databaseProvider: "d1",
      d1Transport: "http",
    });
  });

  it("rejects an incomplete remote D1 configuration", () => {
    process.env = {
      ...process.env,
      DATABASE_PROVIDER: "d1",
      D1_TRANSPORT: "http",
    };
    delete process.env.D1_HTTP_URL;
    delete process.env.D1_HTTP_TOKEN;
    expect(() => loadConfig()).toThrow("D1_HTTP_URL");
  });

  it("requires the auth secret in production", () => {
    delete process.env.BETTER_AUTH_SECRET;
    process.env = { ...process.env, NODE_ENV: "production" };
    expect(() => loadConfig()).toThrow("BETTER_AUTH_SECRET is required in production");
  });
});
