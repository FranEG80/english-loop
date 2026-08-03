import { afterEach, describe, expect, it, vi } from "vitest";
import { authRestAdapter } from "./auth-rest-adapter";

afterEach(() => vi.unstubAllGlobals());

describe("authRestAdapter", () => {
  it("maps sessions and calls the Better Auth endpoints", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ user: { id: "u1", name: "User", email: "u@example.com" } }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await authRestAdapter.getSession())?.userId).toBe("u1");
    await authRestAdapter.login({ email: "u@example.com", password: "secret" });
    await authRestAdapter.register({ name: "User", email: "u@example.com", password: "secret" });
    await authRestAdapter.logout();
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(["/api/auth/get-session", "/api/auth/sign-in/email", "/api/auth/sign-up/email", "/api/auth/sign-out"]);
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(expect.objectContaining({ credentials: "include", method: "POST" }));
  });
});
