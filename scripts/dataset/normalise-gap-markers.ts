import path from "node:path";
import { DATASET_ROOT, readJson, walkFiles, writeJson } from "./lib/io";
import type { Activity, ActivityBatch } from "./lib/types";

/**
 * Deja un solo marcador de hueco en todo el DATASET: `[gapN]`.
 *
 *   pnpm dataset:normalise-gap-markers
 *
 * Convivían dos. `gap_fill` guardaba el hueco como `[gap1]` en `gapText` y a la
 * vez arrastraba una copia del enunciado en `prompt` con `___`; las preguntas
 * de opción y las rondas de los minijuegos usaban solo `___`. Dos marcadores
 * para lo mismo obligan a que cada consumidor conozca los dos y a que cualquier
 * regla nueva se escriba por duplicado.
 *
 * Criterio: **el contenido guarda `[gapN]`, la presentación decide cómo se
 * pinta.** En `gap_fill` el hueco es un campo de escritura; en una pregunta de
 * opción, en una carta o en una ronda es una raya, y de eso se encarga el
 * renderer (`features/activities/gap-display.ts`).
 *
 * Idempotente: en la segunda pasada no queda ni una raya.
 */

/**
 * Tres o más guiones bajos seguidos: la forma antigua del hueco.
 *
 * Dos expresiones a propósito: una con `g` para reemplazar y otra sin él para
 * comprobar. `RegExp` con `g` guarda `lastIndex` entre llamadas, así que
 * reutilizar la misma en `test()` se salta uno de cada dos textos.
 */
const UNDERSCORE_GAP_ALL = /_{3,}/g;
const HAS_UNDERSCORE_GAP = /_{3,}/;

export interface NormaliseGapMarkersReport {
  scanned: number;
  rewritten: string[];
}

/** Sustituye cada raya por `[gapN]`, numerando de izquierda a derecha. */
export function toMarkers(text: string, start = 1): string {
  let index = start;
  return text.replace(UNDERSCORE_GAP_ALL, () => `[gap${index++}]`);
}

export function fixActivity(activity: Activity): Activity | null {
  const next: Record<string, unknown> = { ...activity };
  let touched = false;

  const rewrite = (key: string) => {
    const value = next[key];
    if (typeof value !== "string" || !HAS_UNDERSCORE_GAP.test(value)) return;
    next[key] = toMarkers(value);
    touched = true;
  };

  // El enunciado con huecos vive en `gapText`. Cuando `prompt` guardaba otra
  // copia con la forma antigua, las dos versiones podían divergir: manda
  // `gapText`.
  if (
    typeof next.gapText === "string" &&
    typeof next.prompt === "string" &&
    (HAS_UNDERSCORE_GAP.test(next.prompt) || /\[gap\d+\]/.test(next.prompt)) &&
    next.prompt !== next.gapText
  ) {
    next.prompt = next.gapText;
    touched = true;
  }

  for (const key of ["prompt", "passage", "firstSentence"]) rewrite(key);

  if (Array.isArray(next.cards)) {
    const cards = next.cards.map((card) => {
      const statement = (card as { statement?: string }).statement;
      if (typeof statement !== "string" || !HAS_UNDERSCORE_GAP.test(statement)) return card;
      touched = true;
      return { ...(card as object), statement: toMarkers(statement) };
    });
    next.cards = cards;
  }

  if (Array.isArray(next.rounds)) {
    const rounds = next.rounds.map((round) => {
      const entry = round as { prompt?: string; context?: string };
      const patch: Record<string, unknown> = {};
      if (typeof entry.prompt === "string" && HAS_UNDERSCORE_GAP.test(entry.prompt)) {
        patch.prompt = toMarkers(entry.prompt);
      }
      if (typeof entry.context === "string" && HAS_UNDERSCORE_GAP.test(entry.context)) {
        patch.context = toMarkers(entry.context);
      }
      if (Object.keys(patch).length === 0) return round;
      touched = true;
      return { ...(round as object), ...patch };
    });
    next.rounds = rounds;
  }

  return touched ? (next as unknown as Activity) : null;
}

export async function normaliseGapMarkers(
  datasetRoot = DATASET_ROOT,
): Promise<NormaliseGapMarkersReport> {
  const files = await walkFiles(path.join(datasetRoot, "activities"), ".json");
  const report: NormaliseGapMarkersReport = { scanned: 0, rewritten: [] };

  for (const file of files) {
    const batch = await readJson<ActivityBatch>(file);
    if (!Array.isArray(batch.activities)) continue;
    report.scanned += batch.activities.length;

    let touched = false;
    const activities = batch.activities.map((activity) => {
      const fixed = fixActivity(activity);
      if (!fixed) return activity;
      touched = true;
      report.rewritten.push(activity.id);
      return fixed;
    });

    if (touched) await writeJson(file, { ...batch, activities });
  }

  return report;
}

async function main(): Promise<void> {
  const report = await normaliseGapMarkers();
  console.log(
    `Marcadores normalizados en ${report.rewritten.length} de ${report.scanned} actividades.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
