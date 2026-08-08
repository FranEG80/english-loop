import { z } from "zod";
import { D1CatalogWriteAdapter } from "../catalog-write";
import type { D1CatalogSeedChunk } from "../catalog-write/types";
import type { D1DatabaseLike } from "../types/binding";
import { D1_HTTP_MAX_CLOCK_SKEW_MS, D1_HTTP_MAX_BODY_BYTES } from "../d1-http";
import { authorizeD1HttpRequest, jsonResponse } from "./security";

const requiredString = z.string().min(1);
const stringArray = z.array(requiredString);
const countsSchema = z.object({
  taxonomy: z.number().int().nonnegative(),
  lessons: z.number().int().nonnegative(),
  activities: z.number().int().nonnegative(),
});
const referencesSchema = z.object({
  activityTypes: stringArray,
  evaluatorStrategies: stringArray,
  levels: stringArray,
  statuses: stringArray,
});
const taxonomyNodeSchema = z.object({
  id: requiredString,
  checksum: requiredString,
  parentId: z.string().nullable(),
  kind: requiredString,
  labels: z.object({ en: requiredString, es: requiredString }),
  levels: stringArray,
  selectableForPractice: z.boolean(),
  order: z.number().int(),
}).passthrough();
const lessonSchema = z.object({
  id: requiredString,
  checksum: requiredString,
  level: requiredString,
  category: requiredString,
  taxonomyNodeId: requiredString,
  prerequisiteLessonIds: stringArray,
  title: requiredString,
  summary: z.string(),
  explanation: z.string(),
  examples: z.array(z.unknown()),
  commonMistakes: z.array(z.string()),
  tags: z.array(z.string()),
  difficulty: z.number().finite(),
  contentVersion: z.number().int(),
  status: requiredString,
}).passthrough();
const activitySchema = z.object({
  id: requiredString,
  checksum: requiredString,
  type: requiredString,
  skillFocus: requiredString,
  evaluatorStrategy: requiredString,
  level: requiredString,
  category: requiredString,
  topic: requiredString,
  subtopic: requiredString,
  difficulty: z.number().finite(),
  instructions: z.string(),
  prompt: z.string(),
  gapText: z.string().optional(),
  gapLayout: z.string().optional(),
  passage: z.string().optional(),
  cueWord: z.string().optional(),
  keyWord: z.string().optional(),
  firstSentence: z.string().optional(),
  optionsOrdered: z.boolean().optional(),
  game: z.string().optional(),
  cards: z.array(z.unknown()).optional(),
  rounds: z.array(z.unknown()).optional(),
  explanation: z.string(),
  tags: z.array(z.string()),
  lessonIds: stringArray,
  taxonomyNodeIds: stringArray,
  estimatedSeconds: z.number().int().nonnegative(),
  evaluator: z.unknown(),
  options: z.array(z.unknown()),
  tokens: z.array(z.unknown()),
  pairs: z.array(z.unknown()),
  expectedAnswers: z.array(z.unknown()),
  status: requiredString,
}).passthrough();

const chunkSchema = z.object({
  kind: z.enum(["start", "references", "taxonomy", "lessons", "activities", "publish", "fail", "demo-account"]),
  datasetVersion: z.string().optional(),
  checksum: z.string().optional(),
  releaseId: z.string().optional(),
  importId: z.string().optional(),
  counts: countsSchema.optional(),
  result: z.string().optional(),
  error: z.string().optional(),
  chunk: z.unknown().optional(),
});

function parseSeedChunk(
  kind: "references" | "taxonomy" | "lessons" | "activities",
  releaseId: string,
  value: unknown,
): D1CatalogSeedChunk | null {
  if (kind === "references") {
    const parsed = referencesSchema.safeParse(value);
    return parsed.success ? { kind, releaseId, ...parsed.data } : null;
  }
  const schema = kind === "taxonomy" ? taxonomyNodeSchema : kind === "lessons" ? lessonSchema : activitySchema;
  const parsed = z.array(schema).safeParse(value);
  if (!parsed.success) return null;
  if (kind === "taxonomy") return { kind, releaseId, nodes: parsed.data } as D1CatalogSeedChunk;
  if (kind === "lessons") return { kind, releaseId, lessons: parsed.data } as D1CatalogSeedChunk;
  return { kind, releaseId, activities: parsed.data } as D1CatalogSeedChunk;
}

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
    if (value.kind === "demo-account") {
      await writer.seedDemoAccount();
      return jsonResponse({ success: true });
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
    const chunk = parseSeedChunk(value.kind, value.releaseId, value.chunk);
    if (!chunk) return jsonResponse({ error: "invalid_seed_chunk" }, 400);
    await writer.applyChunk(chunk);
    return jsonResponse({ success: true });
  } catch {
    return jsonResponse({ error: "d1_seed_failed" }, 502);
  }
}
