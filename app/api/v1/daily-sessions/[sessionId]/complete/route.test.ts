import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, jsonRequest, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { PATCH } from "../../../me/settings/route";
import { PUT } from "../../current/route";
import { POST as completeLesson } from "../lessons/[lessonId]/complete/route";
import { POST as startPractice } from "../practice/route";
import { POST } from "./route";

describe("POST /api/v1/daily-sessions/:sessionId/complete", () => {
  beforeEach(() => resetApiRouteRoot());

  it("completes a daily session after practice", async () => {
    await PATCH(routeRequest("/api/v1/me/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ dailyGoalActivities: 5 }) }));
    const session = await expectJson(await PUT(jsonRequest("/api/v1/daily-sessions/current", { timezone: "UTC" }, "PUT")));
    await completeLesson(new Request("http://test.local", { method: "POST" }), { params: Promise.resolve({ sessionId: session.id, lessonId: "lesson-1" }) });
    await startPractice(routeRequest(`/api/v1/daily-sessions/${session.id}/practice`, { method: "POST" }), { params: Promise.resolve({ sessionId: session.id }) });
    expect(await expectJson(await POST(routeRequest(`/api/v1/daily-sessions/${session.id}/complete`, { method: "POST" }), { params: Promise.resolve({ sessionId: session.id }) }))).toMatchObject({ id: session.id, status: "completed" });
  });
});
