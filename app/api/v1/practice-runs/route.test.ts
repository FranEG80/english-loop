import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, jsonRequest, resetApiRouteRoot } from "@/test/support/api-route-test";
import { POST } from "./route";

describe("POST /api/v1/practice-runs", () => {
  beforeEach(() => resetApiRouteRoot());

  it("creates a focused practice run", async () => {
    expect(await expectJson(await POST(jsonRequest("/api/v1/practice-runs", { taxonomyNodeId: "topic", level: "B1", sessionSize: 5 })), 201)).toMatchObject({ status: "in_progress", activityIds: expect.any(Array) });
  });

  it("rejects invalid payloads", async () => {
    expect((await POST(jsonRequest("/api/v1/practice-runs", { taxonomyNodeId: "topic", level: "C1", sessionSize: 5 }))).status).toBe(422);
  });
});
