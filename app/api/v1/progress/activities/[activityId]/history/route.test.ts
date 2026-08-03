import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/progress/activities/:activityId/history", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns the activity history envelope", async () => {
    expect(await expectJson(await GET(routeRequest("/api/v1/progress/activities/a1/history"), { params: Promise.resolve({ activityId: "a1" }) }))).toEqual({ activityId: "a1", attempts: [] });
  });
});
