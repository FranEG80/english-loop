import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot } from "@/test/support/api-route-test";
import { GET } from "./route";

describe("GET /api/v1/ready", () => {
  beforeEach(() => resetApiRouteRoot());

  it("reports all readiness checks", async () => {
    expect(await expectJson(await GET())).toEqual({ ready: true, checks: { database: true, catalog: true, auth: true } });
  });
});
