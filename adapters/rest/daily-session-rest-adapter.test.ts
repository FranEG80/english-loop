import { afterEach, describe, expect, it, vi } from "vitest";
import { dailySessionRestAdapter } from "./daily-session-rest-adapter";

afterEach(() => vi.unstubAllGlobals());

describe("dailySessionRestAdapter", () => {
  it("encodes the timezone and uses POST for commands", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await dailySessionRestAdapter.getTodaySession("Europe/Madrid");
    await dailySessionRestAdapter.startDailyPractice("s1");
    await dailySessionRestAdapter.submitDailyAttempt("s1", { activityId: "a1", response: { kind: "boolean", value: true } });
    await dailySessionRestAdapter.completeDailySession("s1");
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(["/api/v1/daily-sessions/current?timezone=Europe%2FMadrid", "/api/v1/daily-sessions/s1/practice", "/api/v1/daily-sessions/s1/attempts", "/api/v1/daily-sessions/s1/complete"]);
    expect(fetchMock.mock.calls.slice(1).every(([, init]) => (init as RequestInit).method === "POST")).toBe(true);
  });
});
