import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/practice-taxonomy/:nodeId/availability", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns availability for all levels by default", async () => {
    expect(await expectJson(await GET(routeRequest("/api/v1/practice-taxonomy/topic/availability"), { params: Promise.resolve({ nodeId: "topic" }) }))).toHaveLength(3);
  });

  it("rejects an invalid level", async () => {
    expect((await GET(routeRequest("/api/v1/practice-taxonomy/topic/availability?level=C1"), { params: Promise.resolve({ nodeId: "topic" }) })).status).toBe(422);
  });
});
