import { z } from "zod";
import { D1CatalogWriteAdapter } from "../catalog-write";
import type { D1CatalogSeedChunk } from "../catalog-write/types";
import type { D1DatabaseLike } from "../types/binding";
import { D1_HTTP_MAX_CLOCK_SKEW_MS, D1_HTTP_MAX_BODY_BYTES } from "../d1-http";
import { authorizeD1HttpRequest, jsonResponse } from "./security";

const chunkSchema = z.object({
  kind: z.enum(["start", "references", "taxonomy", "lessons", "activities", "publish", "fail"]),
  datasetVersion: z.string().optional(),
  checksum: z.string().optional(),
  releaseId: z.string().optional(),
  importId: z.string().optional(),
  counts: z.object({ taxonomy: z.number(), lessons: z.number(), activities: z.number() }).optional(),
  result: z.string().optional(),
  error: z.string().optional(),
  chunk: z.unknown().optional(),
});

export interface D1SeedHttpOptions {
  database: D1DatabaseLike;
  sharedToken: string;
  replayGuard: { accept(nonce: string, expiresAt: number): Promise<boolean> };
  now?: () => number;
  maxBodyBytes?: number;
}

export async function handleD1SeedHttpRequest(request: Request, options: D1SeedHttpOptions): Promise<Response> {
  const securityResponse = await authorizeD1HttpRequest(request, {
    sharedToken: options.sharedToken,
    replayGuard: options.replayGuard,
    now: options.now,
    maxSkewMs: D1_HTTP_MAX_CLOCK_SKEW_MS,
    maxBodyBytes: options.maxBodyBytes ?? D1_HTTP_MAX_BODY_BYTES,
  });
  if (securityResponse) return securityResponse;
  let body: unknown;
  try { body = await request.json(); } catch { return jsonResponse({ error: "invalid_json" }, 400); }
  const parsed = chunkSchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: "invalid_seed_chunk" }, 400);
  const value = parsed.data;
  const writer = new D1CatalogWriteAdapter(options.database);
  try {
    if (value.kind === "start") {
      if (!value.datasetVersion || !value.checksum || !value.counts) return jsonResponse({ error: "invalid_seed_start" }, 400);
      const session = await writer.start(value.datasetVersion, value.checksum, value.counts);
      return jsonResponse(session);
    }
    if (!value.releaseId) return jsonResponse({ error: "missing_release" }, 400);
    if (value.kind === "publish") {
      if (!value.importId || !value.result) return jsonResponse({ error: "invalid_seed_publish" }, 400);
      await writer.publish({ releaseId: value.releaseId, importId: value.importId, status: "started" }, value.result);
      return jsonResponse({ success: true });
    }
    if (value.kind === "fail") {
      await writer.fail({ releaseId: value.releaseId, importId: value.importId ?? "", status: "started" }, value.error ?? "remote seed failed");
      return jsonResponse({ success: true });
    }
    if (!value.chunk) return jsonResponse({ error: "missing_seed_chunk" }, 400);
    const chunk = (value.kind === "references"
      ? { kind: value.kind, releaseId: value.releaseId, ...(value.chunk as object) }
      : { kind: value.kind, releaseId: value.releaseId, [value.kind]: value.chunk }) as D1CatalogSeedChunk;
    if (value.kind !== "references" && !Array.isArray(value.chunk)) return jsonResponse({ error: "invalid_seed_chunk" }, 400);
    await writer.applyChunk(chunk);
    return jsonResponse({ success: true });
  } catch {
    return jsonResponse({ error: "d1_seed_failed" }, 502);
  }
}
