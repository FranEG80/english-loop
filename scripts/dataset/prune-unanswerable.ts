import path from "node:path";
import { rm } from "node:fs/promises";
import { DATASET_ROOT, writeJson } from "./lib/io";
import { loadDataset } from "./lib/load";
import type { Activity } from "./lib/types";

/**
 * Elimina del catálogo las actividades que no se pueden corregir solas.
 *
 *   pnpm dataset:prune
 *
 * Una actividad autocorregible necesita que su respuesta quede determinada por
 * el enunciado. Eso lo cumplen las de opción, los huecos de una a cinco
 * palabras y UoE Part 4 (la frase original y la palabra clave fijan la
 * respuesta). No lo cumple pedir «escribe una frase de apertura» ni un hueco
 * cuya solución es una oración entera: hay decenas de respuestas válidas y el
 * alumno recibiría un fallo por escribir algo correcto.
 */

/** Tipos retirados por no ser autocorregibles. */
const REMOVED_TYPES = new Set(["guided_writing"]);

/**
 * Un hueco con más palabras que esto ya no es una colocación ni una forma
 * verbal: es redacción libre. Las frases hechas de UoE («with the exception
 * of») caben de sobra dentro del límite.
 */
const MAX_GAP_WORDS = 5;

export interface PruneReport {
  removedByRule: Array<{ rule: string; activities: number }>;
  removed: Array<{ activityId: string; rule: string; detail: string }>;
  remaining: number;
}

function answersOf(activity: Activity): string[] {
  const { evaluator } = activity;
  if (evaluator.strategy === "per_gap") return evaluator.gaps.flatMap((gap) => gap.answers);
  if (evaluator.strategy === "exact_text") return [evaluator.answer];
  if (evaluator.strategy === "one_of_texts") return evaluator.answers;
  return [];
}

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Motivo por el que la actividad no es autocorregible, o null si lo es. */
export function unanswerableReason(activity: Activity): { rule: string; detail: string } | null {
  if (REMOVED_TYPES.has(activity.type)) {
    return {
      rule: "type-not-auto-gradable",
      detail: `El tipo "${activity.type}" exige corrección humana.`,
    };
  }

  if (activity.evaluator.strategy !== "per_gap") return null;

  const longest = Math.max(0, ...answersOf(activity).map(words));
  if (longest > MAX_GAP_WORDS) {
    return {
      rule: "gap-answer-too-long",
      detail: `La solución del hueco tiene ${longest} palabras: es una frase libre, no un hueco.`,
    };
  }

  return null;
}

export async function pruneUnanswerable(datasetRoot = DATASET_ROOT): Promise<PruneReport> {
  const dataset = await loadDataset(datasetRoot);
  const removed: PruneReport["removed"] = [];
  let remaining = 0;

  for (const { filePath, batch } of dataset.batches) {
    const kept = batch.activities.filter((activity) => {
      const reason = unanswerableReason(activity);
      if (!reason) return true;
      removed.push({ activityId: activity.id, ...reason });
      return false;
    });

    remaining += kept.length;
    if (kept.length === batch.activities.length) continue;
    if (kept.length === 0) await rm(filePath, { force: true });
    else await writeJson(filePath, { ...batch, activities: kept });
  }

  const counts = new Map<string, number>();
  for (const item of removed) counts.set(item.rule, (counts.get(item.rule) ?? 0) + 1);

  const report: PruneReport = {
    removedByRule: [...counts.entries()]
      .map(([rule, activities]) => ({ rule, activities }))
      .sort((left, right) => right.activities - left.activities),
    removed: removed.sort((left, right) => left.activityId.localeCompare(right.activityId)),
    remaining,
  };

  await writeJson(path.join(datasetRoot, "reports", "pruned.json"), report);
  return report;
}

async function main(): Promise<void> {
  const report = await pruneUnanswerable();
  console.log(`Retiradas ${report.removed.length} actividades no autocorregibles.`);
  for (const { rule, activities } of report.removedByRule) {
    console.log(`  ${rule}: ${activities}`);
  }
  console.log(`Quedan ${report.remaining} actividades.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
