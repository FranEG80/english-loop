import path from "node:path";
import { DATASET_ROOT, readJson, walkFiles, writeJson } from "./lib/io";
import { findDuplicates } from "./duplicates";
import { loadDataset } from "./lib/load";
import type { ActivityBatch } from "./lib/types";

/**
 * Elimina las actividades exactamente duplicadas.
 *
 *   pnpm dataset:dedupe-exact
 *
 * Un duplicado exacto es el mismo tipo, el mismo enunciado normalizado y las
 * mismas opciones: al alumno le sale dos veces la misma pregunta y el repaso
 * espaciado la trata como dos ítems distintos. De cada grupo se conserva el id
 * menor y se borran los demás.
 *
 * Buena parte de estos duplicados venían de bancos de frases compartidos entre
 * ejercicios que la homogeneización de tipos ha unificado (`collocation_choice`
 * y `multiple_choice_cloze` sobre las mismas frases, por ejemplo), así que solo
 * se ven una vez que el enunciado real está en `prompt`.
 */

export interface DedupeReport {
  groups: number;
  removed: string[];
}

export async function dedupeExact(datasetRoot = DATASET_ROOT): Promise<DedupeReport> {
  const dataset = await loadDataset(datasetRoot);
  const { exact } = findDuplicates(dataset.activities);

  const doomed = new Set<string>();
  for (const group of exact) {
    const [, ...rest] = [...group.activityIds].sort((left, right) =>
      left.localeCompare(right),
    );
    for (const id of rest) doomed.add(id);
  }

  if (doomed.size === 0) return { groups: exact.length, removed: [] };

  const removed: string[] = [];
  const files = await walkFiles(path.join(datasetRoot, "activities"), ".json");

  for (const file of files) {
    const batch = await readJson<ActivityBatch>(file);
    if (!Array.isArray(batch.activities)) continue;

    const kept = batch.activities.filter((activity) => !doomed.has(activity.id));
    if (kept.length === batch.activities.length) continue;

    removed.push(
      ...batch.activities
        .filter((activity) => doomed.has(activity.id))
        .map(({ id }) => id),
    );
    await writeJson(file, { ...batch, activities: kept });
  }

  return { groups: exact.length, removed };
}

async function main(): Promise<void> {
  const report = await dedupeExact();
  console.log(
    `Duplicados exactos: ${report.groups} grupos, ${report.removed.length} actividades eliminadas.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
