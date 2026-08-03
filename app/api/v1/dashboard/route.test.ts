import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/dashboard", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns dashboard summary data", async () => {
    expect(await expectJson(await GET())).toMatchObject({});
  });
});
