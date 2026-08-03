import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/progress/taxonomy/:nodeId", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns zero progress for a new taxonomy node", async () => {
    expect(await expectJson(await GET(routeRequest("/api/v1/progress/taxonomy/topic"), { params: Promise.resolve({ nodeId: "topic" }) }))).toEqual({ taxonomyNodeId: "topic", attemptsCount: 0, correctCount: 0, accuracyRate: 0 });
  });
});
