import { afterEach, describe, expect, it, vi } from "vitest";
import { dailySessionRestAdapter } from "./daily-session-rest-adapter";

afterEach(() => vi.unstubAllGlobals());

describe("dailySessionRestAdapter", () => {
  it("encodes the timezone and uses POST for commands", async () => {
    const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    await dailySessionRestAdapter.getTodaySession("Europe/Madrid");
    await dailySessionRestAdapter.startDailyPractice("s1");
    await dailySessionRestAdapter.submitDailyAttempt("s1", { activityId: "a1", idempotencyKey: "s1:0", response: { kind: "boolean", value: true } });
    await dailySessionRestAdapter.completeDailySession("s1");
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(["/api/v1/daily-sessions/current?timezone=Europe%2FMadrid", "/api/v1/daily-sessions/s1/practice", "/api/v1/daily-sessions/s1/attempts", "/api/v1/daily-sessions/s1/complete"]);
    expect(fetchMock.mock.calls.slice(1).every(([, init]) => init?.method === "POST")).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({
      activityId: "a1",
      idempotencyKey: "s1:0",
      response: { kind: "boolean", value: true },
    });
  });

  it("creates the daily session when the read endpoint has no session yet", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("null", { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await dailySessionRestAdapter.getTodaySession("UTC");

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "/api/v1/daily-sessions/current?timezone=UTC",
      "/api/v1/daily-sessions/current",
    ]);
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ timezone: "UTC" }),
    }));
  });
});
