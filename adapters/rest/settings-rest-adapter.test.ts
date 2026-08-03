import { afterEach, describe, expect, it, vi } from "vitest";
import { settingsRestAdapter } from "./settings-rest-adapter";

afterEach(() => vi.unstubAllGlobals());

describe("settingsRestAdapter", () => {
  it("reads and patches settings and rejects mock-only reset", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await settingsRestAdapter.getSettings();
    await settingsRestAdapter.updateSettings({ locale: "en" });
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(["/api/v1/me/settings", "/api/v1/me/settings"]);
    expect((fetchMock.mock.calls[1]?.[1] as RequestInit).method).toBe("PATCH");
    await expect(settingsRestAdapter.resetMockData()).rejects.toThrow(/mock mode/iu);
  });
});
