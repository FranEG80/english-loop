import { afterEach, describe, expect, it, vi } from "vitest";
import { settingsRestAdapter } from "./settings-rest-adapter";

afterEach(() => vi.unstubAllGlobals());

describe("settingsRestAdapter", () => {
  it("reads and patches settings and rejects mock-only reset", async () => {
    const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    await settingsRestAdapter.getSettings();
    await settingsRestAdapter.updateSettings({ locale: "en" });
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(["/api/v1/me/settings", "/api/v1/me/settings"]);
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe("PATCH");
    await expect(settingsRestAdapter.resetMockData()).rejects.toMatchObject({
      message: expect.stringMatching(/mock mode/iu),
    });
  });

  it("maps the UI daily goal to the REST activity goal field", async () => {
    const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await settingsRestAdapter.updateSettings({
      locale: "en",
      dailyGoal: 7,
      reducedMotion: true,
    });

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      locale: "en",
      dailyGoalActivities: 7,
      reducedMotion: true,
    });
  });
});
