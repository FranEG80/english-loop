import { afterEach, describe, expect, it, vi } from "vitest";
import { focusedPracticeRestAdapter } from "./focused-practice-rest-adapter";

afterEach(() => vi.unstubAllGlobals());

describe("focusedPracticeRestAdapter", () => {
  it("uses canonical scope, run, attempt and summary endpoints", async () => {
    const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    await focusedPracticeRestAdapter.getScopeAvailability("topic");
    await focusedPracticeRestAdapter.createRun({ taxonomyNodeId: "topic", level: "both", sessionSize: 5 });
    await focusedPracticeRestAdapter.submitRunAttempt("run", { activityId: "a", idempotencyKey: "run:0", response: { kind: "text", value: "x" } });
    await focusedPracticeRestAdapter.getRunSummary("run");
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(["/api/v1/practice-taxonomy/topic/availability", "/api/v1/practice-runs", "/api/v1/practice-runs/run/attempts", "/api/v1/practice-runs/run/summary"]);
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({
      activityId: "a",
      idempotencyKey: "run:0",
      response: { kind: "text", value: "x" },
    });
  });
});
