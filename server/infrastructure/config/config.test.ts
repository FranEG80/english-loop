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

  it("loads operational policies from environment variables", () => {
    process.env = {
      ...process.env,
      AUTH_SESSION_EXPIRES_IN_SECONDS: "3600",
      AUTH_SESSION_UPDATE_AGE_SECONDS: "900",
      AUTH_COOKIE_CACHE_MAX_AGE_SECONDS: "120",
      ATTEMPT_RATE_LIMIT_WINDOW_MS: "30000",
      ATTEMPT_RATE_LIMIT_MAX: "12",
      AUTH_RATE_LIMIT_WINDOW_MS: "15000",
      AUTH_RATE_LIMIT_MAX: "4",
    };

    expect(loadConfig()).toMatchObject({
      authSessionExpiresInSeconds: 3600,
      authSessionUpdateAgeSeconds: 900,
      authCookieCacheMaxAgeSeconds: 120,
      attemptRateLimitWindowMs: 30000,
      attemptRateLimitMax: 12,
      authRateLimitWindowMs: 15000,
      authRateLimitMax: 4,
    });
  });

  it("rejects invalid operational policy values", () => {
    process.env = { ...process.env, AUTH_RATE_LIMIT_MAX: "not-a-number" };
    expect(() => loadConfig()).toThrow("AUTH_RATE_LIMIT_MAX must be a positive integer");
  });
});
