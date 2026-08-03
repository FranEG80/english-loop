import { z } from "zod";
import type { D1Operation, D1OperationName } from "./d1-operations";
import { D1BindingClient } from "./d1-operations";
import type { D1DatabaseLike, D1Result } from "./d1-types";

/** Protocol/security bounds, intentionally code constants rather than secrets. */
export const D1_HTTP_MAX_BATCH_OPERATIONS = 100;
export const D1_HTTP_MAX_BODY_BYTES = 1_000_000;
export const D1_HTTP_MAX_CLOCK_SKEW_MS = 5 * 60_000;
const D1_HTTP_MAX_IDENTIFIER_LENGTH = 500;
const D1_HTTP_MAX_ACTIVITY_ID_LENGTH = 200;

const operationSchema = z.discriminatedUnion("name", [
    z.object({ name: z.literal("health") }),
    z.object({ name: z.literal("activeCatalogMetadata") }),
    z.object({ name: z.literal("activityById"), activityId: z.string().min(1).max(D1_HTTP_MAX_ACTIVITY_ID_LENGTH) }),
    z.object({
      name: z.literal("consumeVerification"),
      identifier: z.string().min(1).max(D1_HTTP_MAX_IDENTIFIER_LENGTH),
      value: z.string().min(1).max(D1_HTTP_MAX_IDENTIFIER_LENGTH),
      nowIso: z.string().datetime(),
    }),
    z.object({
      name: z.literal("acceptReplayNonce"),
      nonce: z.string().min(1).max(200),
      nowIso: z.string().datetime(),
      expiresAtIso: z.string().datetime(),
    }),
  ]);

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

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function tokenMatches(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [providedDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(providedDigest);
  const right = new Uint8Array(expectedDigest);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function authToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export async function handleD1HttpRequest(
  request: Request,
  options: D1HttpProxyOptions,
): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const timestampRaw = request.headers.get("x-d1-timestamp");
  const nonce = request.headers.get("x-d1-nonce");
  const timestamp = timestampRaw ? Number(timestampRaw) : Number.NaN;
  const now = options.now?.() ?? Date.now();
  const maxSkewMs = options.maxSkewMs ?? D1_HTTP_MAX_CLOCK_SKEW_MS;
  if (!nonce || !Number.isFinite(timestamp) || Math.abs(now - timestamp) > maxSkewMs) {
    return json({ error: "invalid_timestamp" }, 401);
  }
  if (!(await tokenMatches(authToken(request) ?? "", options.sharedToken))) {
    return json({ error: "unauthorized" }, 401);
  }
  if (!(await options.replayGuard.accept(nonce, now + maxSkewMs))) {
    return json({ error: "replay_detected" }, 409);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > (options.maxBodyBytes ?? D1_HTTP_MAX_BODY_BYTES)) {
    return json({ error: "payload_too_large" }, 413);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid_operation" }, 400);

  try {
    const client = new D1BindingClient(options.database);
    if ("operation" in parsed.data) {
      const result = await client.execute(parsed.data.operation as D1Operation);
      return json({ success: result.success, results: result.results, meta: result.meta });
    }
    const results = await client.batch(parsed.data.operations as D1Operation[]);
    return json({ success: results.every((result) => result.success), results });
  } catch {
    return json({ error: "d1_operation_failed" }, 502);
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

export function isD1OperationName(value: string): value is D1OperationName {
  return ["health", "activeCatalogMetadata", "activityById", "consumeVerification", "acceptReplayNonce"].includes(
    value as D1OperationName,
  );
}
