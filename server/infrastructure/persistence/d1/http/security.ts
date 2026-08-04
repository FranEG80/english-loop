export interface D1HttpSecurityOptions {
  sharedToken: string;
  replayGuard: { accept(nonce: string, expiresAt: number): Promise<boolean> };
  now?: () => number;
  maxSkewMs: number;
  maxBodyBytes: number;
}

export function jsonResponse(data: unknown, status = 200): Response {
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
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function authToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

export async function authorizeD1HttpRequest(request: Request, options: D1HttpSecurityOptions): Promise<Response | null> {
  if (request.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
  const timestampRaw = request.headers.get("x-d1-timestamp");
  const nonce = request.headers.get("x-d1-nonce");
  const timestamp = timestampRaw ? Number(timestampRaw) : Number.NaN;
  const now = options.now?.() ?? Date.now();
  if (!nonce || !Number.isFinite(timestamp) || Math.abs(now - timestamp) > options.maxSkewMs) return jsonResponse({ error: "invalid_timestamp" }, 401);
  if (!(await tokenMatches(authToken(request) ?? "", options.sharedToken))) return jsonResponse({ error: "unauthorized" }, 401);
  if (!(await options.replayGuard.accept(nonce, now + options.maxSkewMs))) return jsonResponse({ error: "replay_detected" }, 409);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > options.maxBodyBytes) return jsonResponse({ error: "payload_too_large" }, 413);
  return null;
}
