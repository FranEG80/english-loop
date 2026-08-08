import path from "node:path";
import { DATASET_ROOT, readJson, walkFiles, writeJson } from "./lib/io";
import type { Activity, ActivityBatch } from "./lib/types";

/**
 * Lleva a cuatro parejas las actividades de emparejar que solo tenían dos.
 *
 *   pnpm dataset:expand-matching
 *
 * Con dos parejas el ejercicio se resuelve por descarte: acertar la primera
 * regala la segunda. Las parejas nuevas salen de las **otras actividades de
 * emparejar de la misma lección**, que ya están validadas y son del mismo tema,
 * así que no se inventa contenido: se reparte el que hay.
 *
 * La elección es determinista —se recorre el fondo común desde una posición
 * derivada del id— para que dos actividades de la misma lección no reciban
 * siempre el mismo relleno y acaben pareciéndose.
 */

export const TARGET_PAIRS = 4;

export interface MatchingPair {
  leftId: string;
  left: string;
  rightId: string;
  right: string;
}

export interface ExpandMatchingReport {
  scanned: number;
  expanded: string[];
  short: string[];
}

/** FNV-1a: mismo id, mismo relleno en cada ejecución. */
function hashSeed(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function expandPairs(
  activity: { id: string; pairs?: MatchingPair[] },
  pool: readonly MatchingPair[],
): MatchingPair[] {
  const current = activity.pairs ?? [];
  if (current.length >= TARGET_PAIRS || pool.length === 0) return current;

  const usedLeft = new Set(current.map(({ left }) => left));
  const usedRight = new Set(current.map(({ right }) => right));
  const chosen = [...current];

  const start = hashSeed(activity.id) % pool.length;
  for (let step = 0; step < pool.length && chosen.length < TARGET_PAIRS; step += 1) {
    const candidate = pool[(start + step) % pool.length]!;
    if (usedLeft.has(candidate.left) || usedRight.has(candidate.right)) continue;
    usedLeft.add(candidate.left);
    usedRight.add(candidate.right);
    chosen.push(candidate);
  }

  // Ids normalizados: el original mezclaba `a`/`x` con `l1`/`r1` y las parejas
  // prestadas podrían chocar con las de casa.
  return chosen.map((pair, index) => ({
    leftId: `l${index + 1}`,
    left: pair.left,
    rightId: `r${index + 1}`,
    right: pair.right,
  }));
}

function poolByLesson(batches: ActivityBatch[]): Map<string, MatchingPair[]> {
  const pool = new Map<string, MatchingPair[]>();

  for (const batch of batches) {
    for (const activity of batch.activities) {
      if (activity.type !== "matching") continue;
      const entries = pool.get(batch.lessonId) ?? [];
      for (const pair of (activity.pairs ?? []) as MatchingPair[]) {
        if (entries.some((existing) => existing.left === pair.left)) continue;
        entries.push(pair);
      }
      pool.set(batch.lessonId, entries);
    }
  }

  return pool;
}

export async function expandMatching(
  datasetRoot = DATASET_ROOT,
): Promise<ExpandMatchingReport> {
  const files = await walkFiles(path.join(datasetRoot, "activities"), ".json");
  const loaded: Array<{ file: string; batch: ActivityBatch }> = [];

  for (const file of files) {
    const batch = await readJson<ActivityBatch>(file);
    if (Array.isArray(batch.activities)) loaded.push({ file, batch });
  }

  const pool = poolByLesson(loaded.map(({ batch }) => batch));
  const report: ExpandMatchingReport = { scanned: 0, expanded: [], short: [] };

  for (const { file, batch } of loaded) {
    let touched = false;

    const activities = batch.activities.map((activity) => {
      if (activity.type !== "matching") return activity;
      report.scanned += 1;

      const pairs = expandPairs(
        activity as { id: string; pairs?: MatchingPair[] },
        pool.get(batch.lessonId) ?? [],
      );
      if (pairs === activity.pairs) return activity;

      touched = true;
      if (pairs.length < TARGET_PAIRS) report.short.push(activity.id);
      else report.expanded.push(activity.id);

      return {
        ...activity,
        pairs,
        evaluator: {
          strategy: "matching_pairs",
          pairs: pairs.map(({ leftId, rightId }) => ({ leftId, rightId })),
        },
      } as Activity;
    });

    if (touched) await writeJson(file, { ...batch, activities });
  }

  return report;
}

async function main(): Promise<void> {
  const report = await expandMatching();
  console.log(
    `Emparejamientos revisados: ${report.scanned}. Ampliados a ${TARGET_PAIRS} parejas: ${report.expanded.length}. Sin fondo suficiente: ${report.short.length}.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
