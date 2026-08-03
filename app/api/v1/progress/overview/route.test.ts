import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/progress/overview", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns the authenticated user's overview", async () => {
    expect(await expectJson(await GET())).toMatchObject({ totalActivitiesCompleted: 0, activeLevels: ["B1", "B2"] });
  });
});
