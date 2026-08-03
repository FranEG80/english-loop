import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/me/saved-lessons", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns saved lesson ids", async () => {
    expect(await expectJson(await GET())).toEqual([]);
  });
});
