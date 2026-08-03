import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, jsonRequest, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { POST as createRun } from "../../route";
import { POST } from "./route";

describe("POST /api/v1/practice-runs/:runId/complete", () => {
  beforeEach(() => resetApiRouteRoot());

  it("marks a run completed", async () => {
    const run = await expectJson(await createRun(jsonRequest("/api/v1/practice-runs", { taxonomyNodeId: "topic", level: "B1", sessionSize: 5 })), 201);
    expect(await expectJson(await POST(routeRequest(`/api/v1/practice-runs/${run.id}/complete`, { method: "POST" }), { params: Promise.resolve({ runId: run.id }) }))).toMatchObject({ id: run.id, status: "completed" });
  });
});
