import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/lessons", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns summaries and validates CEFR filters", async () => {
    const page = await expectJson(await GET(routeRequest("/api/v1/lessons?level=B1")));
    expect(page.items).toHaveLength(1);
    expect(page).toMatchObject({ nextCursor: null, hasMore: false });
    expect((await GET(routeRequest("/api/v1/lessons?level=C1"))).status).toBe(422);
    expect((await GET(routeRequest("/api/v1/lessons?limit=0"))).status).toBe(422);
    expect((await GET(routeRequest("/api/v1/lessons?cursor=invalid"))).status).toBe(422);
  });
});
