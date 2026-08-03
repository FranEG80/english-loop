import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  limited: false,
  response: new Response(JSON.stringify({ ok: true }), { status: 200 }),
}));

vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: () => ({
    GET: vi.fn(async () => authState.response),
    POST: vi.fn(async () => authState.response),
  }),
}));

vi.mock("@/server/infrastructure/auth/auth", () => ({ auth: {} }));

vi.mock("@/server/infrastructure/composition/composition-root", () => ({
  compositionRoot: {
    authRateLimiter: {
      isLimited: vi.fn(async () => authState.limited),
    },
  },
}));

import { GET, POST } from "./route";

function request(method: "GET" | "POST", headers?: HeadersInit) {
  return new Request("http://test.local/api/auth/get-session", { method, headers });
}

describe("/api/auth/[...all]", () => {
  beforeEach(() => {
    authState.limited = false;
    authState.response = new Response(JSON.stringify({ ok: true }), { status: 200 });
  });

  it("delegates GET and preserves the auth response", async () => {
    const response = await GET(request("GET", { "x-forwarded-for": "203.0.113.4, 10.0.0.1" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("delegates POST", async () => {
    const response = await POST(request("POST"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("returns 429 before calling Better Auth when the client is rate limited", async () => {
    authState.limited = true;
    const response = await GET(request("GET", { "x-real-ip": "203.0.113.8" }));
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: { code: "RATE_LIMITED", message: "Too many requests." },
    });
  });
});
