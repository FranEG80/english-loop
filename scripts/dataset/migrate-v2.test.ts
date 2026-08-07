import { mkdtemp, readFile, rm, mkdir, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrateDataset } from "./migrate-v2";

const NORMALIZATION = {
  trim: true,
  collapseWhitespace: true,
  caseSensitive: false,
  ignoreTerminalPunctuation: true,
  normaliseApostrophes: true,
};

let datasetRoot: string;

async function writeBatch(relativePath: string, batch: unknown): Promise<void> {
  const filePath = path.join(datasetRoot, "activities", relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
}

async function listBatchFiles(): Promise<string[]> {
  const root = path.join(datasetRoot, "activities");
  const found: string[] = [];

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(entryPath);
      else if (entry.name.endsWith(".json")) {
        found.push(path.relative(root, entryPath).split(path.sep).join("/"));
      }
    }
  }

  await walk(root);
  return found.sort();
}

async function readBatch(relativePath: string): Promise<Record<string, unknown>> {
  const filePath = path.join(datasetRoot, "activities", relativePath);
  return JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
}

beforeEach(async () => {
  datasetRoot = await mkdtemp(path.join(tmpdir(), "englishloop-migrate-"));
});

afterEach(async () => {
  await rm(datasetRoot, { recursive: true, force: true });
});

describe("migrateDataset", () => {
  beforeEach(async () => {
    await writeBatch("b1/vocabulary/b1-demo/b1-demo/fill_blank/batch-001.json", {
      schemaVersion: "1.0.0",
      batchId: "b1-demo-fb-001",
      level: "B1",
      category: "vocabulary",
      topic: "b1-demo",
      subtopic: "b1-demo",
      lessonId: "b1-demo",
      activityType: "fill_blank",
      activities: [
        {
          schemaVersion: "1.0.0",
          id: "b1-demo-fb-001",
          status: "published",
          autoGradable: true,
          level: "B1",
          type: "fill_blank",
          category: "vocabulary",
          topic: "b1-demo",
          subtopic: "b1-demo",
          taxonomyNodeIds: ["b1-demo"],
          difficulty: 2,
          instructions: "Complete the sentence with one word.",
          prompt: "I booked a return ___ to Leeds.",
          lessonIds: ["b1-demo"],
          tags: ["b1", "demo"],
          estimatedSeconds: 30,
          evaluator: { strategy: "exact_text", answer: "ticket", normalization: NORMALIZATION },
          explanation: "A return ticket incluye la ida y la vuelta.",
        },
      ],
    });

    await writeBatch("b1/vocabulary/b1-demo/b1-demo/phrasal_verb_choice/batch-001.json", {
      schemaVersion: "1.0.0",
      batchId: "b1-demo-pvc-001",
      level: "B1",
      category: "vocabulary",
      topic: "b1-demo",
      subtopic: "b1-demo",
      lessonId: "b1-demo",
      activityType: "phrasal_verb_choice",
      activities: [
        {
          schemaVersion: "1.0.0",
          id: "b1-demo-pvc-001",
          status: "published",
          autoGradable: true,
          level: "B1",
          type: "phrasal_verb_choice",
          category: "vocabulary",
          topic: "b1-demo",
          subtopic: "b1-demo",
          taxonomyNodeIds: ["b1-demo"],
          difficulty: 2,
          instructions: "Choose the correct phrasal verb.",
          prompt: "I usually ___ at seven on weekdays.",
          options: [
            { id: "a", text: "get up" },
            { id: "b", text: "get over" },
            { id: "c", text: "get into" },
            { id: "d", text: "get by" },
          ],
          lessonIds: ["b1-demo"],
          tags: ["b1", "demo"],
          estimatedSeconds: 35,
          evaluator: { strategy: "single_option", correctOptionId: "a" },
          explanation: "«Get up» es levantarse de la cama.",
        },
      ],
    });

    await writeBatch("b1/vocabulary/b1-demo/b1-demo/open_cloze/batch-001.json", {
      schemaVersion: "1.0.0",
      batchId: "b1-demo-oc-001",
      level: "B1",
      category: "vocabulary",
      topic: "b1-demo",
      subtopic: "b1-demo",
      lessonId: "b1-demo",
      activityType: "open_cloze",
      activities: [
        {
          schemaVersion: "1.0.0",
          id: "b1-demo-oc-001",
          status: "published",
          autoGradable: true,
          level: "B1",
          type: "open_cloze",
          category: "vocabulary",
          topic: "b1-demo",
          subtopic: "b1-demo",
          taxonomyNodeIds: ["b1-demo"],
          difficulty: 3,
          instructions: "Complete the sentence with one preposition.",
          prompt: "Open pattern 001: Supply the missing preposition.",
          passage: "The team relies ___ the dashboard when checking live figures.",
          lessonIds: ["b1-demo"],
          tags: ["b1", "demo"],
          estimatedSeconds: 45,
          evaluator: { strategy: "exact_text", answer: "on", normalization: NORMALIZATION },
          explanation: "La dependencia fija es «rely on».",
        },
      ],
    });
  });

  it("reagrupa los tipos absorbidos en un único directorio canónico", async () => {
    await migrateDataset(datasetRoot);

    expect(await listBatchFiles()).toEqual([
      "b1/vocabulary/b1-demo/b1-demo/gap_fill/batch-001.json",
      "b1/vocabulary/b1-demo/b1-demo/single_choice/batch-001.json",
    ]);
  });

  it("escribe la cabecera del batch en v2", async () => {
    await migrateDataset(datasetRoot);
    const batch = await readBatch("b1/vocabulary/b1-demo/b1-demo/gap_fill/batch-001.json");

    expect(batch.schemaVersion).toBe("2.0.0");
    expect(batch.activityType).toBe("gap_fill");
    expect(batch.batchId).toBe("b1-demo-gap-fill-001");
    expect((batch.activities as unknown[]).length).toBe(2);
  });

  it("conserva la procedencia de cada item en skillFocus", async () => {
    await migrateDataset(datasetRoot);
    const batch = await readBatch("b1/vocabulary/b1-demo/b1-demo/gap_fill/batch-001.json");
    const activities = batch.activities as Array<Record<string, unknown>>;

    expect(activities.map((activity) => activity.skillFocus).sort()).toEqual([
      "fill_blank",
      "open_cloze",
    ]);
  });

  it("no pierde ningún item", async () => {
    const report = await migrateDataset(datasetRoot);

    expect(report.totals.sourceActivities).toBe(3);
    expect(report.totals.targetActivities).toBe(3);
  });

  it("es idempotente: dos pasadas producen ficheros byte a byte idénticos", async () => {
    const readRaw = (relativePath: string) =>
      readFile(path.join(datasetRoot, "activities", relativePath), "utf8");

    await migrateDataset(datasetRoot);
    const filesAfterFirst = await listBatchFiles();
    const rawAfterFirst = await Promise.all(filesAfterFirst.map(readRaw));

    await migrateDataset(datasetRoot);
    const filesAfterSecond = await listBatchFiles();
    const rawAfterSecond = await Promise.all(filesAfterSecond.map(readRaw));

    expect(filesAfterSecond).toEqual(filesAfterFirst);
    expect(rawAfterSecond).toEqual(rawAfterFirst);
  });

  it("borra los directorios que quedan vacíos", async () => {
    await migrateDataset(datasetRoot);
    const entries = await readdir(
      path.join(datasetRoot, "activities", "b1", "vocabulary", "b1-demo", "b1-demo"),
    );

    expect(entries.sort()).toEqual(["gap_fill", "single_choice"]);
  });

  it("escribe el informe de migración con el desglose por regla", async () => {
    await migrateDataset(datasetRoot);
    const report = JSON.parse(
      await readFile(path.join(datasetRoot, "reports", "migration-v2.json"), "utf8"),
    ) as { typeMoves: Array<{ from: string; to: string }> };

    expect(report.typeMoves).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "fill_blank", to: "gap_fill" }),
        expect.objectContaining({ from: "open_cloze", to: "gap_fill" }),
      ]),
    );
  });

  it("parte en varios ficheros cuando un grupo supera los 25 items", async () => {
    await rm(path.join(datasetRoot, "activities"), { recursive: true, force: true });
    await writeBatch("b1/vocabulary/b1-big/b1-big/fill_blank/batch-001.json", {
      schemaVersion: "1.0.0",
      batchId: "b1-big-fb-001",
      level: "B1",
      category: "vocabulary",
      topic: "b1-big",
      subtopic: "b1-big",
      lessonId: "b1-big",
      activityType: "fill_blank",
      activities: Array.from({ length: 30 }, (_, index) => ({
        schemaVersion: "1.0.0",
        id: `b1-big-fb-${String(index + 1).padStart(3, "0")}`,
        status: "published",
        autoGradable: true,
        level: "B1",
        type: "fill_blank",
        category: "vocabulary",
        topic: "b1-big",
        subtopic: "b1-big",
        taxonomyNodeIds: ["b1-big"],
        difficulty: 2,
        instructions: "Complete the sentence with one word.",
        prompt: `Sentence ${index + 1} needs a ___ here.`,
        lessonIds: ["b1-big"],
        tags: ["b1", "demo"],
        estimatedSeconds: 30,
        evaluator: { strategy: "exact_text", answer: "word", normalization: NORMALIZATION },
        explanation: "Explicación de ejemplo suficientemente larga.",
      })),
    });

    await migrateDataset(datasetRoot);

    expect(await listBatchFiles()).toEqual([
      "b1/vocabulary/b1-big/b1-big/gap_fill/batch-001.json",
      "b1/vocabulary/b1-big/b1-big/gap_fill/batch-002.json",
    ]);
  });
});
