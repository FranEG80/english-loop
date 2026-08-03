import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, jsonRequest, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { PATCH } from "../../../me/settings/route";
import { PUT } from "../../current/route";
import { POST as completeLesson } from "../lessons/[lessonId]/complete/route";
import { POST as startPractice } from "../practice/route";
import { POST } from "./route";

describe("POST /api/v1/daily-sessions/:sessionId/attempts", () => {
  beforeEach(() => resetApiRouteRoot());

  it("grades a valid daily attempt", async () => {
    await PATCH(routeRequest("/api/v1/me/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ dailyGoalActivities: 5 }) }));
    const session = await expectJson(await PUT(jsonRequest("/api/v1/daily-sessions/current", { timezone: "UTC" }, "PUT")));
    await completeLesson(new Request("http://test.local", { method: "POST" }), { params: Promise.resolve({ sessionId: session.id, lessonId: "lesson-1" }) });
    await startPractice(routeRequest(`/api/v1/daily-sessions/${session.id}/practice`, { method: "POST" }), { params: Promise.resolve({ sessionId: session.id }) });
    expect(await expectJson(await POST(jsonRequest(`/api/v1/daily-sessions/${session.id}/attempts`, { activityId: "activity-1", idempotencyKey: "daily-route", response: { kind: "boolean", value: true } }), { params: Promise.resolve({ sessionId: session.id }) }))).toMatchObject({ isCorrect: true });
  });
});
