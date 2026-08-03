import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, jsonRequest, resetApiRouteRoot } from "@/test/support/api-route-test";
import { POST as createRun } from "../../route";
import { POST } from "./route";

describe("POST /api/v1/practice-runs/:runId/attempts", () => {
  beforeEach(() => resetApiRouteRoot());

  it("accepts an attempt and returns feedback", async () => {
    const run = await expectJson(await createRun(jsonRequest("/api/v1/practice-runs", { taxonomyNodeId: "topic", level: "B1", sessionSize: 5 })), 201);
    expect(await expectJson(await POST(jsonRequest(`/api/v1/practice-runs/${run.id}/attempts`, { activityId: run.activityIds[0], idempotencyKey: "focused-route", response: { kind: "boolean", value: true } }), { params: Promise.resolve({ runId: run.id }) }))).toMatchObject({ isCorrect: true });
  });

  it("rejects malformed attempts", async () => {
    expect((await POST(jsonRequest("/api/v1/practice-runs/run/attempts", { activityId: "a" }), { params: Promise.resolve({ runId: "run" }) })).status).toBe(422);
  });
});
