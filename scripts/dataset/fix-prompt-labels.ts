import path from "node:path";
import { DATASET_ROOT, readJson, walkFiles, writeJson } from "./lib/io";
import type { Activity, ActivityBatch } from "./lib/types";

/**
 * Deja el enunciado de cada actividad limpio y en el sitio donde se lee.
 *
 *   pnpm dataset:fix-prompt-labels
 *
 * Dos defectos heredados del generador de contenido, ambos visibles en cuanto
 * se abre una actividad:
 *
 * 1. **El enunciado vivía en `passage`.** En 575 actividades de opción la frase
 *    con el hueco estaba en `passage` y `prompt` era una etiqueta numerada de
 *    relleno («Daily routine 001: Which phrase fits the context?»), así que en
 *    pantalla salían las dos: primero la frase en una caja de contexto y debajo,
 *    como pregunta, un rótulo que no dice nada. `passage` está reservado a
 *    contexto de lectura **sin huecos**, de modo que un `passage` con marcador
 *    es siempre el enunciado.
 *
 * 2. **La etiqueta iba incrustada en el texto.** En otras 650 el prefijo
 *    «Complete the daily-life sentence 001: » encabeza el propio `gapText`,
 *    duplicando lo que ya dice `instructions` y numerando la actividad delante
 *    del alumno.
 *
 * Idempotente: en la segunda pasada no queda ni un `passage` con hueco ni un
 * prefijo numerado.
 */

const CHOICE_TYPES = new Set(["single_choice", "multiple_choice"]);
const GAP_MARKER = /___|\[gap\d+\]/;
/**
 * Prefijo de etiqueta: texto corto sin final de frase, un número de orden de
 * tres cifras y dos puntos. El límite de longitud y la ausencia de `.?!` evitan
 * morder una frase real que empiece por una cifra.
 */
const NUMBERED_LABEL = /^[^.!?\n]{0,60}?\d{3}\s*:\s+/;

export interface FixPromptLabelsReport {
  scanned: number;
  promoted: string[];
  unlabelled: string[];
}

function stripLabel(value: string | undefined): string | undefined {
  if (!value) return value;
  const stripped = value.replace(NUMBERED_LABEL, "");
  // Si la etiqueta era todo el texto, el enunciado se quedaría vacío.
  return stripped.trim().length > 0 ? stripped : value;
}

export function fixBatch(batch: ActivityBatch): {
  batch: ActivityBatch;
  promoted: string[];
  unlabelled: string[];
} {
  const promoted: string[] = [];
  const unlabelled: string[] = [];

  const activities = batch.activities.map((activity) => {
    let next: Record<string, unknown> = { ...activity };

    if (
      CHOICE_TYPES.has(activity.type) &&
      activity.passage &&
      GAP_MARKER.test(activity.passage)
    ) {
      promoted.push(activity.id);
      // El orden de claves se conserva reconstruyendo el objeto entrada a
      // entrada: así el fichero solo cambia en lo que toca esta reparación.
      const rebuilt: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(activity)) {
        if (key === "passage") continue;
        rebuilt[key] = key === "prompt" ? activity.passage : value;
      }
      next = rebuilt;
    }

    // El enunciado real es el que lleva los huecos; si no hay, manda `prompt`.
    const carrier = typeof next.gapText === "string" ? "gapText" : "prompt";
    const original = next[carrier];
    if (typeof original === "string") {
      const cleaned = stripLabel(original);
      if (cleaned !== original) {
        unlabelled.push(activity.id);
        next = { ...next, [carrier]: cleaned };
      }
    }

    return next as unknown as Activity;
  });

  return { batch: { ...batch, activities }, promoted, unlabelled };
}

export async function fixPromptLabels(
  datasetRoot = DATASET_ROOT,
): Promise<FixPromptLabelsReport> {
  const files = await walkFiles(path.join(datasetRoot, "activities"), ".json");
  const report: FixPromptLabelsReport = { scanned: 0, promoted: [], unlabelled: [] };

  for (const file of files) {
    const batch = await readJson<ActivityBatch>(file);
    if (!Array.isArray(batch.activities)) continue;
    report.scanned += batch.activities.length;

    const { batch: fixed, promoted, unlabelled } = fixBatch(batch);
    if (promoted.length === 0 && unlabelled.length === 0) continue;

    report.promoted.push(...promoted);
    report.unlabelled.push(...unlabelled);
    await writeJson(file, fixed);
  }

  return report;
}

async function main(): Promise<void> {
  const report = await fixPromptLabels();
  console.log(
    `Enunciados promovidos: ${report.promoted.length}. Etiquetas retiradas: ${report.unlabelled.length}. Actividades revisadas: ${report.scanned}.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
