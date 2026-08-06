import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/lessons", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns summaries and validates CEFR filters", async () => {
    const page = await expectJson(await GET(routeRequest("/api/v1/lessons?level=B1")));
    expect(page.items).toHaveLength(1);
    expect(page).toMatchObject({ page: 1, pageSize: 12, total: 1, totalPages: 1, hasNextPage: false });
    const search = await expectJson(await GET(routeRequest("/api/v1/lessons?q=lesson-1&page=1&pageSize=1")));
    expect(search).toMatchObject({ total: 1, items: [{ id: "lesson-1" }] });
    expect((await GET(routeRequest("/api/v1/lessons?level=C1"))).status).toBe(422);
    expect((await GET(routeRequest("/api/v1/lessons?page=0"))).status).toBe(422);
    expect((await GET(routeRequest("/api/v1/lessons?pageSize=0"))).status).toBe(422);
  });
});
