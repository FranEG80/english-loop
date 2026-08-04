import { describe, expect, it } from "vitest";
import type { CatalogSeedInput } from "@/core/content/ports/catalog-write-port";
import type { D1DatabaseLike, D1PreparedStatement } from "../types/binding";
import { D1CatalogWriteAdapter } from "./d1-catalog-write-adapter";

function database(existing: { id: string; status: string } | null = null) {
  const queries: string[] = [];
  const batches: number[] = [];
  const db: D1DatabaseLike = {
    prepare(query) {
      queries.push(query);
      const statement: D1PreparedStatement = {
        bind: () => statement,
        first: async <T>() => existing as T,
        all: async <T>() => ({ success: true, results: [] as T[] }),
        run: async <T>() => ({ success: true, results: [] as T[], meta: { changes: 1 } }),
      };
      return statement;
    },
    batch: async <T>(statements: D1PreparedStatement[]) => {
      batches.push(statements.length);
      return statements.map(() => ({ success: true, results: [] as T[], meta: { changes: 1 } }));
    },
  };
  return { db, queries, batches };
}

const input: CatalogSeedInput = {
  datasetVersion: "2026.08.04",
  checksum: "checksum",
  taxonomy: [{ id: "grammar", checksum: "taxonomy", parentId: null, kind: "category", labels: { en: "Grammar", es: "Gramática" }, levels: ["B1"], selectableForPractice: true, order: 0 }],
  lessons: [{ id: "lesson-1", checksum: "lesson", level: "B1", category: "grammar", taxonomyNodeId: "grammar", prerequisiteLessonIds: [], title: "Lesson", summary: "Summary", explanation: "Explanation", examples: [], commonMistakes: [], tags: [], difficulty: 1, contentVersion: 1, status: "published" }],
  activities: [{ id: "activity-1", checksum: "activity", type: "choice", evaluatorStrategy: "single_option", level: "B1", category: "grammar", topic: "grammar", subtopic: "present", difficulty: 1, instructions: "Choose", prompt: "Prompt", explanation: "Explanation", tags: [], lessonIds: ["lesson-1"], taxonomyNodeIds: ["grammar"], estimatedSeconds: 30, evaluator: { strategy: "single_option", correctOptionId: "correct" }, options: [{ id: "correct", text: "Correct", feedback: "Correct" }], tokens: [], pairs: [], expectedAnswers: [{ gapId: null, answer: "correct", position: 0 }], status: "published" }],
};

describe("D1CatalogWriteAdapter", () => {
  it("publishes only after the release and import batches complete", async () => {
    const fake = database();
    const result = await new D1CatalogWriteAdapter(fake.db).seedCatalog(input);

    expect(result.status).toBe("published");
    expect(fake.batches.at(-1)).toBe(3);
    expect(fake.queries.some((query) => query.includes("CatalogPublication"))).toBe(true);
  });

  it("does not rewrite an already published checksum", async () => {
    const fake = database({ id: "release-1", status: "published" });
    const result = await new D1CatalogWriteAdapter(fake.db).seedCatalog(input);

    expect(result.status).toBe("unchanged");
    expect(result.releaseId).toBe("release-1");
    expect(fake.batches).toHaveLength(0);
  });

  it("supports dry-run without opening a write batch", async () => {
    const fake = database();
    const result = await new D1CatalogWriteAdapter(fake.db).seedCatalog(input, { dryRun: true });

    expect(result.status).toBe("dry_run");
    expect(fake.queries).toHaveLength(0);
    expect(fake.batches).toHaveLength(0);
  });

  it("restarts preparing releases and handles no-op/failure paths", async () => {
    const preparing = database({ id: "release-preparing", status: "preparing" });
    const adapter = new D1CatalogWriteAdapter(preparing.db);
    const session = await adapter.start("dataset", "checksum", { taxonomy: 0, lessons: 0, activities: 0 });
    expect(session.status).toBe("started");
    expect(preparing.queries).toContain("DELETE FROM ActivityVersion WHERE releaseId = ?");
    expect(preparing.queries).toContain("DELETE FROM LessonVersion WHERE releaseId = ?");
    expect(preparing.queries).toContain("DELETE FROM TaxonomyNodeVersion WHERE releaseId = ?");
    expect(preparing.queries).not.toContain("DELETE FROM CatalogRelease WHERE id = ?");
    await adapter.publish({ ...session, status: "unchanged" }, "ignored");
    await adapter.fail({ ...session, status: "unchanged" }, "ignored");
    await adapter.fail(session, "text failure");
    await adapter.applyChunk({ kind: "references", releaseId: session.releaseId, activityTypes: [], evaluatorStrategies: [], levels: [], statuses: [] });

    const statementFailure = database();
    statementFailure.db.prepare = () => ({
      bind: () => statementFailure.db.prepare("unused"),
      first: async () => null,
      all: async () => ({ success: true, results: [] }),
      run: async () => ({ success: false, results: [] }),
    } as never);
    await expect(new D1CatalogWriteAdapter(statementFailure.db).start("dataset", "checksum", { taxonomy: 0, lessons: 0, activities: 0 })).rejects.toMatchObject({ message: "D1 catalog statement failed" });

    const batchFailure = database();
    batchFailure.db.batch = async () => [{ success: false, results: [] }];
    await expect(new D1CatalogWriteAdapter(batchFailure.db).seedCatalog(input)).rejects.toMatchObject({ message: "D1 catalog batch failed" });
  });
});
