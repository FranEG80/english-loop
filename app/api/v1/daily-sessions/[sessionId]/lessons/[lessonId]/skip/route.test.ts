import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, jsonRequest, resetApiRouteRoot } from "@/test/support/api-route-test";
import { PUT } from "../../../../current/route";
import { POST } from "./route";

describe("POST /api/v1/daily-sessions/:sessionId/lessons/:lessonId/skip", () => {
  beforeEach(() => resetApiRouteRoot());

  it("skips the assigned lesson", async () => {
    const session = await expectJson(await PUT(jsonRequest("/api/v1/daily-sessions/current", { timezone: "UTC" }, "PUT")));
    expect(await expectJson(await POST(new Request("http://test.local", { method: "POST" }), { params: Promise.resolve({ sessionId: session.id, lessonId: "lesson-1" }) }))).toMatchObject({ id: session.id, recommendedLessonId: "" });
  });
});
