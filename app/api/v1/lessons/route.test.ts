import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/lessons", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns summaries and validates CEFR filters", async () => {
    expect(await expectJson(await GET(routeRequest("/api/v1/lessons?level=B1")))).toHaveLength(1);
    expect((await GET(routeRequest("/api/v1/lessons?level=C1"))).status).toBe(422);
  });
});
