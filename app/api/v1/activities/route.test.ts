import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/activities", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns safe activity questions and validates filters", async () => {
    const page = await expectJson(await GET(routeRequest("/api/v1/activities?level=B1&pageSize=2")));
    expect(page.items).toHaveLength(2);
    expect(page.items[0]).not.toHaveProperty("evaluator");
    expect(page).toMatchObject({ total: 8, page: 1, totalPages: 4, hasNextPage: true });
    const nextPage = await expectJson(await GET(routeRequest("/api/v1/activities?level=B1&pageSize=2&page=2")));
    expect(nextPage.items).toHaveLength(2);
    expect(nextPage.items[0].id).toBe("activity-3");
    const search = await expectJson(await GET(routeRequest("/api/v1/activities?q=activity-8")));
    expect(search).toMatchObject({ total: 1, items: [{ id: "activity-8" }] });
    expect((await GET(routeRequest("/api/v1/activities?level=C1"))).status).toBe(422);
    expect((await GET(routeRequest("/api/v1/activities?type=unknown"))).status).toBe(422);
    expect((await GET(routeRequest("/api/v1/activities?interaction=unknown"))).status).toBe(422);
  });
});
