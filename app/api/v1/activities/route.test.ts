import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/activities", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns safe activity questions and validates filters", async () => {
    const page = await expectJson(await GET(routeRequest("/api/v1/activities?level=B1&limit=2")));
    expect(page.items).toHaveLength(2);
    expect(page.items[0]).not.toHaveProperty("evaluator");
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBeTypeOf("string");
    const nextPage = await expectJson(await GET(routeRequest(`/api/v1/activities?level=B1&limit=2&cursor=${encodeURIComponent(page.nextCursor)}`)));
    expect(nextPage.items).toHaveLength(2);
    expect((await GET(routeRequest("/api/v1/activities?level=C1"))).status).toBe(422);
  });
});
