import { describe, expect, it } from "vitest";
import type { D1DatabaseLike, D1PreparedStatement } from "../types/binding";
import { handleD1SeedHttpRequest } from "./seed";

function database(): D1DatabaseLike {
  return {
    prepare() {
      const prepared: D1PreparedStatement = {
        bind: () => prepared,
        first: async () => null,
        all: async <T>() => ({ success: true, results: [] as T[] }),
        run: async <T>() => ({ success: true, results: [] as T[], meta: { changes: 1 } }),
      };
      return prepared;
    },
    batch: async <T>(statements: D1PreparedStatement[]) => statements.map(() => ({ success: true, results: [] as T[], meta: { changes: 1 } })),
  };
}

const now = 1_700_000_000_000;
let nonceCounter = 0;
function request(body: unknown, overrides: Record<string, string> = {}): Request {
  nonceCounter += 1;
  return new Request("https://proxy.example.test/seed", {
    method: "POST",
    headers: {
      authorization: "Bearer secret",
      "content-type": "application/json",
      "x-d1-timestamp": String(now),
      "x-d1-nonce": `nonce-${nonceCounter}`,
      ...overrides,
    },
    body: JSON.stringify(body),
  });
}

function options() {
  return {
    database: database(),
    sharedToken: "secret",
    now: () => now,
    replayGuard: { accept: async () => true },
  };
}

const taxonomy = [{ id: "grammar", checksum: "checksum", parentId: null, kind: "category", labels: { en: "Grammar", es: "Gramática" }, levels: ["B1"], selectableForPractice: true, order: 0 }];
const lesson = [{ id: "lesson-1", checksum: "checksum", level: "B1", category: "grammar", taxonomyNodeId: "grammar", prerequisiteLessonIds: [], title: "Lesson", summary: "Summary", explanation: "Explanation", examples: [], commonMistakes: [], tags: [], difficulty: 1, contentVersion: 1, status: "published" }];
const activity = [{ id: "activity-1", checksum: "checksum", type: "single_choice", skillFocus: "single_choice", evaluatorStrategy: "single_option", level: "B1", category: "grammar", topic: "grammar", subtopic: "present", difficulty: 1, instructions: "Choose", prompt: "Prompt", explanation: "Explanation", tags: [], lessonIds: ["lesson-1"], taxonomyNodeIds: ["grammar"], estimatedSeconds: 30, evaluator: { strategy: "single_option", correctOptionId: "correct" }, options: [], tokens: [], pairs: [], expectedAnswers: [], status: "published" }];

describe("D1 seed HTTP handler", () => {
  it("validates and handles start, references, normalized chunks, publish and fail", async () => {
    const base = options();
    const start = await handleD1SeedHttpRequest(request({ kind: "start", datasetVersion: "v1", checksum: "c1", counts: { taxonomy: 1, lessons: 1, activities: 1 } }), base);
    expect(start.status).toBe(200);
    expect((await start.json())).toMatchObject({ status: "started" });
    for (const body of [
      { kind: "references", releaseId: "r1", chunk: { activityTypes: ["choice"], evaluatorStrategies: ["single_option"], levels: ["B1"], statuses: ["published"] } },
      { kind: "taxonomy", releaseId: "r1", chunk: taxonomy },
      { kind: "lessons", releaseId: "r1", chunk: lesson },
      { kind: "activities", releaseId: "r1", chunk: activity },
      { kind: "publish", releaseId: "r1", importId: "i1", result: "{}" },
      { kind: "fail", releaseId: "r1", importId: "i1", error: "failed" },
      { kind: "demo-account" },
    ]) {
      await expect(handleD1SeedHttpRequest(request(body), base)).resolves.toMatchObject({ status: 200 });
    }
  });

  it("rejects malformed seed commands and unauthorized requests", async () => {
    const base = options();
    await expect(handleD1SeedHttpRequest(new Request("https://proxy.example.test/seed", { method: "GET" }), base)).resolves.toMatchObject({ status: 405 });
    await expect(handleD1SeedHttpRequest(new Request("https://proxy.example.test/seed", { method: "POST", headers: { authorization: "Bearer secret", "x-d1-timestamp": String(now), "x-d1-nonce": "invalid-json" }, body: "not-json" }), base)).resolves.toMatchObject({ status: 400 });
    await expect(handleD1SeedHttpRequest(request({ kind: "publish", result: "{}" }), base)).resolves.toMatchObject({ status: 400 });
    await expect(handleD1SeedHttpRequest(request({ kind: "references", releaseId: "r1", chunk: {} }), base)).resolves.toMatchObject({ status: 400 });
    await expect(handleD1SeedHttpRequest(request({ kind: "taxonomy", releaseId: "r1", chunk: [{}] }), base)).resolves.toMatchObject({ status: 400 });
    await expect(handleD1SeedHttpRequest(request({ kind: "lessons", releaseId: "r1", chunk: "not-array" }), base)).resolves.toMatchObject({ status: 400 });
    await expect(handleD1SeedHttpRequest(request({ kind: "activities", releaseId: "r1" }), base)).resolves.toMatchObject({ status: 400 });
    await expect(handleD1SeedHttpRequest(request({ kind: "start", datasetVersion: "v1", checksum: "c1", counts: { taxonomy: -1, lessons: 1, activities: 1 } }), base)).resolves.toMatchObject({ status: 400 });
    await expect(handleD1SeedHttpRequest(request({ kind: "start", datasetVersion: "v1", checksum: "c1", counts: { taxonomy: 1, lessons: 1, activities: 1 } }, { authorization: "Bearer wrong" }), base)).resolves.toMatchObject({ status: 401 });
  });
});
