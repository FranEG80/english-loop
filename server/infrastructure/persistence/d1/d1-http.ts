import { z } from "zod";
import { isD1Operation, type D1Operation } from "./d1-operations";
import { D1BindingClient } from "./d1-operations";
import type { D1DatabaseLike, D1Result } from "./types/binding";
import { authorizeD1HttpRequest, jsonResponse } from "./http/security";

/** Protocol/security bounds, intentionally code constants rather than secrets. */
export const D1_HTTP_MAX_BATCH_OPERATIONS = 100;
export const D1_HTTP_MAX_BODY_BYTES = 1_000_000;
export const D1_HTTP_MAX_CLOCK_SKEW_MS = 5 * 60_000;
const operationSchema = z.custom<D1Operation>(isD1Operation, {
  message: "Unsupported or malformed D1 operation",
});

const requestSchema = z.union([
  z.object({ operation: operationSchema }),
  z.object({ operations: z.array(operationSchema).min(1).max(D1_HTTP_MAX_BATCH_OPERATIONS) }),
]);

export type D1HttpRequestBody = z.infer<typeof requestSchema>;

export interface ReplayGuard {
  /** Returns false when the nonce was already accepted in its validity window. */
  accept(nonce: string, expiresAt: number): Promise<boolean>;
}

/** Suitable for local tests only. Production Workers must inject KV/Durable Object/D1 storage. */
export class InMemoryReplayGuard implements ReplayGuard {
  private readonly nonces = new Map<string, number>();

  constructor(private readonly now: () => number = Date.now) {}

  async accept(nonce: string, expiresAt: number): Promise<boolean> {
    const now = this.now();
    for (const [key, expiry] of this.nonces) {
      if (expiry <= now) this.nonces.delete(key);
    }
    if (this.nonces.has(nonce)) return false;
    this.nonces.set(nonce, expiresAt);
    return true;
  }
}

export interface D1HttpProxyOptions {
  database: D1DatabaseLike;
  sharedToken: string;
  replayGuard: ReplayGuard;
  now?: () => number;
  maxSkewMs?: number;
  maxBodyBytes?: number;
}

export async function handleD1HttpRequest(
  request: Request,
  options: D1HttpProxyOptions,
): Promise<Response> {
  const now = options.now?.() ?? Date.now();
  const securityResponse = await authorizeD1HttpRequest(request, {
    sharedToken: options.sharedToken,
    replayGuard: options.replayGuard,
    now: () => now,
    maxSkewMs: options.maxSkewMs ?? D1_HTTP_MAX_CLOCK_SKEW_MS,
    maxBodyBytes: options.maxBodyBytes ?? D1_HTTP_MAX_BODY_BYTES,
  });
  if (securityResponse) return securityResponse;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: "invalid_operation" }, 400);

  try {
    const client = new D1BindingClient(options.database);
    if ("operation" in parsed.data) {
      const result = await client.execute(parsed.data.operation as D1Operation);
      return jsonResponse({ success: result.success, results: result.results, meta: result.meta });
    }
    const results = await client.batch(parsed.data.operations as D1Operation[]);
    return jsonResponse({ success: results.every((result) => result.success), results });
  } catch {
    return jsonResponse({ error: "d1_operation_failed" }, 502);
  }
}

export interface D1HttpClientOptions {
  url: string;
  token: string;
  fetch?: typeof fetch;
  now?: () => number;
  nonce?: () => string;
}

export class D1HttpClient {
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;
  private readonly nonce: () => string;

  constructor(private readonly options: D1HttpClientOptions) {
    this.fetcher = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.nonce = options.nonce ?? (() => crypto.randomUUID());
  }

  async execute(operation: D1Operation): Promise<D1Result> {
    const timestamp = this.now();
    const response = await this.fetcher(this.options.url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.options.token}`,
        "content-type": "application/json",
        "x-d1-timestamp": String(timestamp),
        "x-d1-nonce": this.nonce(),
      },
      body: JSON.stringify({ operation }),
    });
    const body = (await response.json()) as D1Result & { error?: string };
    if (!response.ok) throw new Error(body.error ?? "D1 HTTP operation failed");
    return body;
  }

  async batch(operations: D1Operation[]): Promise<D1Result[]> {
    if (operations.length === 0 || operations.length > D1_HTTP_MAX_BATCH_OPERATIONS) {
      throw new Error("D1 HTTP batches must contain between 1 and 100 operations");
    }
    const timestamp = this.now();
    const response = await this.fetcher(this.options.url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.options.token}`,
        "content-type": "application/json",
        "x-d1-timestamp": String(timestamp),
        "x-d1-nonce": this.nonce(),
      },
      body: JSON.stringify({ operations }),
    });
    const body = (await response.json()) as { results?: D1Result[]; error?: string };
    if (!response.ok || !body.results) throw new Error(body.error ?? "D1 HTTP batch failed");
    return body.results;
  }
}
