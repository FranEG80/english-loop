import path from "node:path";
import { DATASET_ROOT, writeJson } from "./lib/io";
import { loadDataset } from "./lib/load";
import { normalizePrompt } from "./lib/normalize";
import type { Activity } from "./lib/types";

const NEAR_DUPLICATE_THRESHOLD = 0.86;

export async function runDuplicateDetection(): Promise<void> {
  const dataset = await loadDataset();
  const exactGroups = new Map<string, Activity[]>();
  for (const activity of dataset.activities) {
    const key = normalizePrompt(activity.prompt);
    const group = exactGroups.get(key) ?? [];
    group.push(activity);
    exactGroups.set(key, group);
  }

  const exact = [...exactGroups.entries()]
    .filter(([, activities]) => activities.length > 1)
    .map(([normalisedPrompt, activities]) => ({
      normalisedPrompt,
      activityIds: activities
        .map(({ id }) => id)
        .sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) =>
      left.activityIds[0].localeCompare(right.activityIds[0]),
    );

  const buckets = new Map<string, Activity[]>();
  for (const activity of dataset.activities) {
    const key = `${activity.level}:${activity.type}:${activity.topic}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(activity);
    buckets.set(key, bucket);
  }

  const near: Array<{
    leftId: string;
    rightId: string;
    similarity: number;
  }> = [];
  for (const bucket of buckets.values()) {
    for (let leftIndex = 0; leftIndex < bucket.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < bucket.length;
        rightIndex += 1
      ) {
        const left = bucket[leftIndex];
        const right = bucket[rightIndex];
        if (normalizePrompt(left.prompt) === normalizePrompt(right.prompt)) {
          continue;
        }
        const similarity = jaccard(left.prompt, right.prompt);
        if (similarity >= NEAR_DUPLICATE_THRESHOLD) {
          near.push({
            leftId: left.id,
            rightId: right.id,
            similarity: Number(similarity.toFixed(3)),
          });
        }
      }
    }
  }
  near.sort(
    (left, right) =>
      left.leftId.localeCompare(right.leftId) ||
      left.rightId.localeCompare(right.rightId),
  );

  await writeJson(path.join(DATASET_ROOT, "reports", "duplicates.json"), {
    schemaVersion: "1.0.0",
    exact,
    near,
    nearDuplicateThreshold: NEAR_DUPLICATE_THRESHOLD,
  });

  console.log(
    `Duplicados: ${exact.length} grupos exactos y ${near.length} pares cercanos.`,
  );
}

function jaccard(left: string, right: string): number {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);
  const intersection = [...leftTokens].filter((token) =>
    rightTokens.has(token),
  ).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 1 : intersection / union;
}

function tokenSet(value: string): Set<string> {
  return new Set(
    normalizePrompt(value)
      .replace(/[^\p{L}\p{N}']+/gu, " ")
      .split(" ")
      .filter(Boolean),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDuplicateDetection().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
