import { describe, expect, it } from "vitest";
import type { CatalogSeedInput } from "@/core/content/ports/catalog-write-port";
import { D1HttpCatalogWriteAdapter } from "./http-client";

const input: CatalogSeedInput = {
  datasetVersion: "dataset-v1", checksum: "checksum-v1",
  taxonomy: [{ id: "grammar", checksum: "taxonomy", parentId: null, kind: "category", labels: { en: "Grammar", es: "Gramática" }, levels: ["B1"], selectableForPractice: true, order: 0 }],
  lessons: [{ id: "lesson-1", checksum: "lesson", level: "B1", category: "grammar", taxonomyNodeId: "grammar", prerequisiteLessonIds: [], title: "Lesson", summary: "Summary", explanation: "Explanation", examples: [], commonMistakes: [], tags: [], difficulty: 1, contentVersion: 1, status: "published" }],
  activities: [
    { id: "activity-1", checksum: "activity-1", type: "choice", skillFocus: "fill_blank", evaluatorStrategy: "single_option", level: "B1", category: "grammar", topic: "grammar", subtopic: "present", difficulty: 1, instructions: "Choose", prompt: "Prompt", explanation: "Explanation", tags: [], lessonIds: ["lesson-1"], taxonomyNodeIds: ["grammar"], estimatedSeconds: 30, evaluator: { strategy: "single_option", correctOptionId: "correct" }, options: [], tokens: [], pairs: [], expectedAnswers: [], status: "published" },
    { id: "activity-2", checksum: "activity-2", type: "choice", skillFocus: "fill_blank", evaluatorStrategy: "single_option", level: "B1", category: "grammar", topic: "grammar", subtopic: "past", difficulty: 1, instructions: "Choose", prompt: "x".repeat(1_200), explanation: "Explanation", tags: [], lessonIds: ["lesson-1"], taxonomyNodeIds: ["grammar"], estimatedSeconds: 30, evaluator: { strategy: "single_option", correctOptionId: "correct" }, options: [], tokens: [], pairs: [], expectedAnswers: [], status: "published" },
  ],
};

function responseFor(kind: string): Record<string, unknown> {
  if (kind === "start") return { releaseId: "release-1", importId: "import-1", status: "started" };
  return { success: true };
}

describe("D1HttpCatalogWriteAdapter", () => {
  it("sends authenticated seed chunks to the configured worker path", async () => {
    const requests: Request[] = [];
    const writer = new D1HttpCatalogWriteAdapter({
      url: "https://proxy.example.test/catalog?tenant=english-loop", token: "secret", maxBodyBytes: 5_000,
      now: () => 1_700_000_000_000, nonce: () => "nonce-1",
      fetch: async (input, init) => {
        const request = new Request(input, init);
        requests.push(request);
        const body = JSON.parse(String(init?.body)) as { kind: string };
        return new Response(JSON.stringify(responseFor(body.kind)), { status: 200, headers: { "content-type": "application/json" } });
      },
    });

    await expect(writer.seedCatalog(input)).resolves.toMatchObject({ status: "published", counts: { activities: 2 } });
    expect(requests[0]?.url).toBe("https://proxy.example.test/catalog/seed?tenant=english-loop");
    expect(requests.every((request) => request.headers.get("authorization") === "Bearer secret")).toBe(true);
    expect(requests.some((request) => request.url.endsWith("/seed?tenant=english-loop"))).toBe(true);
    expect(requests.length).toBeGreaterThan(5);
  });

  it("returns dry-run and unchanged results without loading chunks", async () => {
    const calls: string[] = [];
    const writer = new D1HttpCatalogWriteAdapter({
      url: "https://proxy.example.test", token: "secret", fetch: async (_input, init) => {
        calls.push(String(init?.body));
        return new Response(JSON.stringify({ releaseId: "release-1", importId: "", status: "unchanged", result: { releaseId: "release-1", datasetVersion: "dataset-v1", checksum: "checksum-v1", status: "unchanged", counts: { taxonomy: 1, lessons: 1, activities: 2 } } }), { status: 200 });
      },
    });

    await expect(writer.seedCatalog(input, { dryRun: true })).resolves.toMatchObject({ status: "dry_run" });
    expect(calls).toHaveLength(0);
    await expect(writer.seedCatalog(input)).resolves.toMatchObject({ status: "unchanged", releaseId: "release-1" });
    expect(calls).toHaveLength(1);
  });

  it("seeds the demo account through the authenticated worker endpoint", async () => {
    const calls: string[] = [];
    const writer = new D1HttpCatalogWriteAdapter({
      url: "https://proxy.example.test", token: "secret", fetch: async (_input, init) => {
        calls.push(String(init?.body));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      },
    });

    await expect(writer.seedDemoAccount()).resolves.toBeUndefined();
    expect(JSON.parse(calls[0] ?? "{}")).toEqual({ kind: "demo-account" });
  });

  it("reports a failed remote chunk and propagates HTTP errors", async () => {
    const kinds: string[] = [];
    const writer = new D1HttpCatalogWriteAdapter({
      url: "https://proxy.example.test", token: "secret", fetch: async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as { kind: string };
        kinds.push(body.kind);
        if (body.kind === "taxonomy") return new Response(JSON.stringify({ error: "database unavailable" }), { status: 502 });
        return new Response(JSON.stringify(responseFor(body.kind)), { status: 200 });
      },
    });

    await expect(writer.seedCatalog(input)).rejects.toMatchObject({ message: "database unavailable" });
    expect(kinds).toContain("fail");
  });
});
