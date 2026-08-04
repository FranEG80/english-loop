import { describe, expect, it } from "vitest";
import { AggregatedMetrics } from "./aggregated-metrics";

describe("AggregatedMetrics", () => {
  it("aggregates requests, statuses, errors and latency without payloads", () => {
    const metrics = new AggregatedMetrics();
    metrics.recordRequest({ route: "/api/v1/lessons", method: "get", status: 200, durationMs: 4 });
    metrics.recordRequest({ route: "/api/v1/lessons", method: "GET", status: 422, durationMs: -2, errorCode: "VALIDATION_ERROR" });

    expect(metrics.snapshot()).toMatchObject({
      requests: 2,
      errors: 1,
      totalDurationMs: 4,
      averageDurationMs: 2,
      errorCodes: { VALIDATION_ERROR: 1 },
      endpoints: {
        "GET /api/v1/lessons": { count: 2, errorCount: 1, totalDurationMs: 4, statuses: { "200": 1, "422": 1 } },
      },
    });
  });

  it("resets process-local aggregates", () => {
    const metrics = new AggregatedMetrics();
    metrics.recordRequest({ route: "/health", method: "GET", status: 200, durationMs: 1 });
    metrics.reset();
    expect(metrics.snapshot()).toEqual({ requests: 0, errors: 0, totalDurationMs: 0, averageDurationMs: 0, errorCodes: {}, endpoints: {} });
  });
});
