import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/activities", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns safe activity questions and validates filters", async () => {
    const activities = await expectJson(await GET(routeRequest("/api/v1/activities?level=B1")));
    expect(activities).toHaveLength(8);
    expect(activities[0]).not.toHaveProperty("evaluator");
    expect((await GET(routeRequest("/api/v1/activities?level=C1"))).status).toBe(422);
  });
});
