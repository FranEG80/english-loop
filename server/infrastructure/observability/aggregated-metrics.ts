import "server-only";
import type { PedagogicalMetricName, PedagogicalMetricsPort } from "@/core/shared/kernel";

export interface RequestMetricInput {
  route: string;
  method: string;
  status: number;
  durationMs: number;
  errorCode?: string;
}

interface EndpointMetric {
  count: number;
  errorCount: number;
  totalDurationMs: number;
  statuses: Record<string, number>;
}

export interface AggregatedMetricsSnapshot {
  requests: number;
  errors: number;
  totalDurationMs: number;
  averageDurationMs: number;
  errorCodes: Record<string, number>;
  endpoints: Record<string, EndpointMetric>;
  pedagogicalEvents: Record<string, number>;
  reviewQueueSize: number | null;
}

const MAX_ENDPOINT_CARDINALITY = 200;
const MAX_PEDAGOGICAL_CARDINALITY = 200;

/** Métricas acotadas por proceso para salud operativa sin almacenar payloads. */
export class AggregatedMetrics implements PedagogicalMetricsPort {
  private requestCount = 0;
  private errorCount = 0;
  private totalDurationMs = 0;
  private readonly errorCodes = new Map<string, number>();
  private readonly endpoints = new Map<string, EndpointMetric>();
  private readonly pedagogicalEvents = new Map<string, number>();
  private reviewQueueSize: number | null = null;

  recordPedagogicalEvent(
    name: PedagogicalMetricName,
    dimensions: Readonly<Record<string, string>> = {},
  ): void {
    const suffix = Object.entries(dimensions)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join(",");
    const key = suffix ? `${name}{${suffix}}` : name;
    if (!this.pedagogicalEvents.has(key) && this.pedagogicalEvents.size >= MAX_PEDAGOGICAL_CARDINALITY) return;
    this.pedagogicalEvents.set(key, (this.pedagogicalEvents.get(key) ?? 0) + 1);
  }

  recordReviewQueueSize(size: number): void {
    this.reviewQueueSize = Math.max(0, Math.floor(size));
  }

  recordRequest(input: RequestMetricInput): void {
    this.requestCount += 1;
    this.totalDurationMs += Math.max(0, input.durationMs);
    if (input.status >= 400) this.errorCount += 1;
    if (input.errorCode) this.errorCodes.set(input.errorCode, (this.errorCodes.get(input.errorCode) ?? 0) + 1);

    const key = `${input.method.toUpperCase()} ${input.route}`;
    let endpoint = this.endpoints.get(key);
    if (!endpoint) {
      if (this.endpoints.size >= MAX_ENDPOINT_CARDINALITY) return;
      endpoint = { count: 0, errorCount: 0, totalDurationMs: 0, statuses: {} };
      this.endpoints.set(key, endpoint);
    }
    endpoint.count += 1;
    endpoint.totalDurationMs += Math.max(0, input.durationMs);
    if (input.status >= 400) endpoint.errorCount += 1;
    const status = String(input.status);
    endpoint.statuses[status] = (endpoint.statuses[status] ?? 0) + 1;
  }

  snapshot(): AggregatedMetricsSnapshot {
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      totalDurationMs: this.totalDurationMs,
      averageDurationMs: this.requestCount === 0 ? 0 : this.totalDurationMs / this.requestCount,
      errorCodes: Object.fromEntries(this.errorCodes),
      endpoints: Object.fromEntries([...this.endpoints].map(([key, value]) => [key, {
        count: value.count,
        errorCount: value.errorCount,
        totalDurationMs: value.totalDurationMs,
        statuses: { ...value.statuses },
      }])),
      pedagogicalEvents: Object.fromEntries(this.pedagogicalEvents),
      reviewQueueSize: this.reviewQueueSize,
    };
  }

  reset(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.totalDurationMs = 0;
    this.errorCodes.clear();
    this.endpoints.clear();
    this.pedagogicalEvents.clear();
    this.reviewQueueSize = null;
  }
}
