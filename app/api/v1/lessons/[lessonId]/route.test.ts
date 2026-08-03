import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/lessons/:lessonId", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns lesson detail", async () => {
    expect(await expectJson(await GET(routeRequest("/api/v1/lessons/lesson-1"), { params: Promise.resolve({ lessonId: "lesson-1" }) }))).toMatchObject({ id: "lesson-1", explanation: "Explanation" });
  });

  it("returns not found for an unknown lesson", async () => {
    expect((await GET(routeRequest("/api/v1/lessons/missing"), { params: Promise.resolve({ lessonId: "missing" }) })).status).toBe(404);
  });
});
