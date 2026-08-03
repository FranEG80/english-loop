import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => store) }));

import { readLocaleCookie, writeLocaleCookie } from "./locale-cookie-server";

describe("locale cookie server adapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts supported locales and defaults invalid values to Spanish", async () => {
    store.get.mockReturnValueOnce({ value: "en" }).mockReturnValueOnce({ value: "xx" }).mockReturnValueOnce(undefined);
    await expect(readLocaleCookie()).resolves.toBe("en");
    await expect(readLocaleCookie()).resolves.toBe("es");
    await expect(readLocaleCookie()).resolves.toBe("es");
  });

  it("persists a locale for one year", async () => {
    await writeLocaleCookie("en");
    expect(store.set).toHaveBeenCalledWith("el_locale", "en", expect.objectContaining({ sameSite: "lax", path: "/", maxAge: 31_536_000 }));
  });
});
