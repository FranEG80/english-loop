import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { POST, DELETE } from "./route";

describe("/api/v1/me/saved-lessons/:lessonId", () => {
  beforeEach(() => resetApiRouteRoot());

  it("saves and removes a lesson", async () => {
    const context = { params: Promise.resolve({ lessonId: "lesson-1" }) };
    expect(await expectJson(await POST(routeRequest("/api/v1/me/saved-lessons/lesson-1", { method: "POST" }), context))).toEqual({ saved: true });
    expect(await expectJson(await DELETE(routeRequest("/api/v1/me/saved-lessons/lesson-1", { method: "DELETE" }), context))).toEqual({ saved: false });
  });
});
