import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/practice-taxonomy", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns the taxonomy tree DTO", async () => {
    expect(await expectJson(await GET())).toEqual([]);
  });
});
