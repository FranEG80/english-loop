import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/review-queue", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns due and upcoming queues", async () => {
    expect(await expectJson(await GET())).toEqual({ dueItems: [], upcomingItems: [] });
  });
});
