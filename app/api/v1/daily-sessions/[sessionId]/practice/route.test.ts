import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, jsonRequest, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { PATCH } from "../../../me/settings/route";
import { PUT } from "../../current/route";
import { POST as completeLesson } from "../lessons/[lessonId]/complete/route";
import { POST } from "./route";

describe("POST /api/v1/daily-sessions/:sessionId/practice", () => {
  beforeEach(() => resetApiRouteRoot());

  it("starts practice after the lesson phase", async () => {
    await PATCH(routeRequest("/api/v1/me/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ dailyGoalActivities: 5 }) }));
    const session = await expectJson(await PUT(jsonRequest("/api/v1/daily-sessions/current", { timezone: "UTC" }, "PUT")));
    await completeLesson(new Request("http://test.local", { method: "POST" }), { params: Promise.resolve({ sessionId: session.id, lessonId: "lesson-1" }) });
    expect(await expectJson(await POST(routeRequest(`/api/v1/daily-sessions/${session.id}/practice`, { method: "POST" }), { params: Promise.resolve({ sessionId: session.id }) }))).toMatchObject({ id: session.id, status: "practice" });
  });
});
