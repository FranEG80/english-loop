import { describe, expect, it, vi, afterEach } from "vitest";
import { dailySessionRestAdapter } from "./daily-session-rest-adapter";
import { focusedPracticeRestAdapter } from "./focused-practice-rest-adapter";
import { learningContentRestAdapter } from "./learning-content-rest-adapter";
import { progressRestAdapter } from "./progress-rest-adapter";
import { settingsRestAdapter } from "./settings-rest-adapter";
import { authRestAdapter } from "./auth-rest-adapter";
import { restRequest, RestApiError } from "./http-client";

afterEach(() => vi.unstubAllGlobals());

function mockFetch(payload: unknown = {}) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("REST adapters", () => {
  it("maps HTTP failures and 204 responses through the shared client", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(restRequest<void>("/empty")).resolves.toBeUndefined();

    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 503 })));
    await expect(restRequest("/broken")).rejects.toMatchObject({ name: "RestApiError", status: 503 });
    await expect(restRequest("/broken")).rejects.toBeInstanceOf(RestApiError);
  });

  it("serializes request bodies and sends the JSON content type", async () => {
    const fetchMock = mockFetch({ ok: true });
    await settingsRestAdapter.updateSettings({ locale: "en", reducedMotion: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/me/settings", expect.objectContaining({
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: "en", reducedMotion: true }),
    }));
  });

  it("uses canonical daily and practice paths", async () => {
    const fetchMock = mockFetch({});
    await dailySessionRestAdapter.getTodaySession("Europe/Madrid");
    await dailySessionRestAdapter.startDailyPractice("s1");
    await focusedPracticeRestAdapter.createRun({ taxonomyNodeId: "topic", level: "both", sessionSize: 5 });
    await focusedPracticeRestAdapter.submitRunAttempt("r1", { activityId: "a1", response: { kind: "boolean", value: true } });
    const urls = fetchMock.mock.calls.map((call) => String((call as unknown[])[0]));
    expect(urls).toEqual([
      "/api/v1/daily-sessions/current?timezone=Europe%2FMadrid",
      "/api/v1/daily-sessions/s1/practice",
      "/api/v1/practice-runs",
      "/api/v1/practice-runs/r1/attempts",
    ]);
  });

  it("serializes lessonIds and canonical taxonomy/progress/settings paths", async () => {
    const fetchMock = mockFetch({});
    await learningContentRestAdapter.listActivities({ level: "both", lessonIds: ["l1", "l2"] });
    await learningContentRestAdapter.getTaxonomyTree();
    await progressRestAdapter.getTaxonomyProgress("topic");
    await progressRestAdapter.getActivityHistory("a1");
    await settingsRestAdapter.getSettings();
    const urls = fetchMock.mock.calls.map((call) => String((call as unknown[])[0]));
    expect(urls[0]).toContain("level=both");
    expect(urls[0]).toContain("lessonIds=l1");
    expect(urls[0]).toContain("lessonIds=l2");
    expect(urls.slice(1)).toEqual([
      "/api/v1/practice-taxonomy",
      "/api/v1/progress/taxonomy/topic",
      "/api/v1/progress/activities/a1/history",
      "/api/v1/me/settings",
    ]);
  });

  it("uses Better Auth's real endpoints and maps the session", async () => {
    const fetchMock = mockFetch({ user: { id: "u1", name: "User", email: "u@example.com" } });
    const session = await authRestAdapter.getSession();
    await authRestAdapter.login({ email: "u@example.com", password: "secret" });
    await authRestAdapter.register({ name: "User", email: "u@example.com", password: "secret" });
    await authRestAdapter.logout();
    expect(session?.userId).toBe("u1");
    expect(fetchMock.mock.calls.map((call) => String((call as unknown[])[0]))).toEqual([
      "/api/auth/get-session",
      "/api/auth/sign-in/email",
      "/api/auth/sign-up/email",
      "/api/auth/sign-out",
    ]);
  });
});
