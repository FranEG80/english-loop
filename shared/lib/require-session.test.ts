import { describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/adapters/adapter-factory", () => ({ getAuthPort: () => auth }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));

import { requireSession } from "./require-session";

describe("requireSession", () => {
  it("returns the authenticated session", async () => {
    const session = { user: { id: "user-1", email: "user@example.com", name: "User" } } as never;
    auth.getSession.mockResolvedValueOnce(session);
    await expect(requireSession()).resolves.toBe(session);
  });

  it("redirects unauthenticated requests to the supplied destination", async () => {
    auth.getSession.mockResolvedValueOnce(null);
    await expect(requireSession("/signin")).rejects.toThrow("REDIRECT:/signin");
  });
});
