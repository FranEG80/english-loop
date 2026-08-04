import { describe, expect, it, vi } from "vitest";

const createAuth = vi.hoisted(() => vi.fn((options: unknown) => options));
const nextCookies = vi.hoisted(() => vi.fn(() => ({ id: "next-cookies" })));

vi.mock("./auth", () => ({ createAuth }));
vi.mock("better-auth/next-js", () => ({ nextCookies }));

import { createNextAuth } from "./next-auth";

describe("createNextAuth", () => {
  it("adds the Next.js cookie bridge after configured plugins", () => {
    const existingPlugin = { id: "existing" };
    const initialCookiePluginCalls = nextCookies.mock.calls.length;
    expect(createNextAuth({ plugins: [existingPlugin] })).toEqual({
      plugins: [existingPlugin, { id: "next-cookies" }],
    });
    expect(nextCookies).toHaveBeenCalledTimes(initialCookiePluginCalls + 1);
    expect(createAuth).toHaveBeenLastCalledWith({
      plugins: [existingPlugin, { id: "next-cookies" }],
    });
  });
});
