import path from "node:path";
import { DATASET_ROOT, writeJson } from "./lib/io";
import { loadDataset } from "./lib/load";
import { normalizePrompt } from "./lib/normalize";
import type { Activity } from "./lib/types";

const NEAR_DUPLICATE_THRESHOLD = 0.86;

/**
 * Huella de lo que el alumno ve realmente. Comparar solo `prompt` da falsos
 * positivos: en `word_order` el prompt es la solución y nunca se muestra, y en
 * `gap_fill` el texto con huecos vive en `gapText`. Dos actividades solo son
 * duplicadas si plantean la misma tarea con el mismo material visible.
 */
export function visibleFingerprint(activity: Activity): string {
  const parts: string[] = [activity.type];

  switch (activity.type) {
    case "word_order":
      parts.push(...sortForComparison((activity.tokens ?? []).map(({ text }) => text)));
      break;
    case "matching":
      parts.push(
        ...sortForComparison(
          (activity.pairs ?? []).flatMap(({ left, right }) => [left, right]),
        ),
      );
      break;
    case "swipe_deck":
      parts.push(...(activity.cards ?? []).map(({ statement }) => statement));
      break;
    case "mini_game":
      parts.push(...(activity.rounds ?? []).map(({ prompt }) => prompt));
      break;
    default:
      parts.push(activity.prompt, activity.gapText ?? "", activity.passage ?? "");
      parts.push(...sortForComparison((activity.options ?? []).map(({ text }) => text)));
      break;
  }

  return normalizePrompt(parts.filter(Boolean).join(" | "));
}

/**
 * Orden estable e insensible a mayúsculas. El `sort()` por defecto ordena por
 * unidad de código, así que «I saw» iría antes que «a cat» y la huella
 * cambiaría solo por el uso de mayúsculas.
 */
function sortForComparison(values: string[]): string[] {
  return [...values].sort((left, right) =>
    normalizePrompt(left).localeCompare(normalizePrompt(right), "en"),
  );
}

export function findDuplicates(activities: Activity[]) {
  const exactGroups = new Map<string, Activity[]>();
  for (const activity of activities) {
    const key = visibleFingerprint(activity);
    const group = exactGroups.get(key) ?? [];
    group.push(activity);
    exactGroups.set(key, group);
  }

  const exact = [...exactGroups.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([normalisedPrompt, values]) => ({
      normalisedPrompt,
      activityIds: values.map(({ id }) => id).sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => left.activityIds[0].localeCompare(right.activityIds[0]));

  const buckets = new Map<string, Activity[]>();
  for (const activity of activities) {
    const key = `${activity.level}:${activity.type}:${activity.topic}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(activity);
    buckets.set(key, bucket);
  }

  const near: Array<{ leftId: string; rightId: string; similarity: number }> = [];
  for (const bucket of buckets.values()) {
    for (let leftIndex = 0; leftIndex < bucket.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < bucket.length; rightIndex += 1) {
        const left = bucket[leftIndex];
        const right = bucket[rightIndex];
        const leftText = visibleFingerprint(left);
        const rightText = visibleFingerprint(right);
        if (leftText === rightText) continue;
        const similarity = jaccard(leftText, rightText);
        if (similarity >= NEAR_DUPLICATE_THRESHOLD) near.push({ leftId: left.id, rightId: right.id, similarity: Number(similarity.toFixed(3)) });
      }
    }
  }
  near.sort((left, right) => left.leftId.localeCompare(right.leftId) || left.rightId.localeCompare(right.rightId));
  return { exact, near, nearDuplicateThreshold: NEAR_DUPLICATE_THRESHOLD };
}

export async function runDuplicateDetection(): Promise<void> {
  const dataset = await loadDataset();
  const { exact, near, nearDuplicateThreshold } = findDuplicates(dataset.activities);

  await writeJson(path.join(DATASET_ROOT, "reports", "duplicates.json"), {
    schemaVersion: "1.0.0",
    exact,
    near,
    nearDuplicateThreshold,
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
