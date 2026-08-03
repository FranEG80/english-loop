import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, jsonRequest, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { POST as createRun } from "../../route";
import { GET } from "./route";

describe("GET /api/v1/practice-runs/:runId/summary", () => {
  beforeEach(() => resetApiRouteRoot());

  it("returns a run summary", async () => {
    const run = await expectJson(await createRun(jsonRequest("/api/v1/practice-runs", { taxonomyNodeId: "topic", level: "B1", sessionSize: 5 })), 201);
    expect(await expectJson(await GET(routeRequest(`/api/v1/practice-runs/${run.id}/summary`), { params: Promise.resolve({ runId: run.id }) }))).toMatchObject({ runId: run.id, correctCount: 0, incorrectCount: 0 });
  });
});
