import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/activities/:activityId", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns a safe question DTO", async () => {
    expect(await expectJson(await GET(routeRequest("/api/v1/activities/activity-1"), { params: Promise.resolve({ activityId: "activity-1" }) }))).toMatchObject({ id: "activity-1" });
  });

  it("returns not found for an unknown activity", async () => {
    expect((await GET(routeRequest("/api/v1/activities/missing"), { params: Promise.resolve({ activityId: "missing" }) })).status).toBe(404);
  });
});
