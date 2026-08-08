import path from "node:path";
import { DATASET_ROOT, readJson, walkFiles, writeJson } from "./lib/io";
import type { Activity, ActivityBatch } from "./lib/types";

/**
 * Cuadra los huecos del texto con los del evaluador.
 *
 *   pnpm dataset:repair-gaps
 *
 * Un hueco que aparece en el texto pero no en el evaluador **no se corrige**:
 * el alumno escribe algo y no cuenta ni bien ni mal. Y un `gapId` que no coincide
 * con su marcador rompe el emparejamiento por id, así que la actividad entera
 * se da por fallada aunque esté perfecta.
 *
 * Tres averías, todas heredadas de la migración:
 *
 * 1. **Identificadores con guion.** `gap-1` frente a `[gap1]`.
 * 2. **Marcador duplicado.** `[gap1] [gap2]` pegados para un solo hueco, de
 *    partir mal una respuesta larga.
 * 3. **Verbo separable partido en dos huecos.** «It will [gap1] us [gap2] at
 *    the hotel» con la respuesta «drop off» entera en el primero; el segundo
 *    quedaba huérfano. Se reparte una palabra por hueco.
 *
 * Se aprovecha para retirar la respuesta que algunos enunciados llevaban
 * regalada entre paréntesis al final.
 */

const MARKER = /\[gap(\d+)\]/g;
/** Dos marcadores separados solo por espacios: son el mismo hueco. */
const ADJACENT_MARKERS = /\[gap\d+\]\s+\[gap\d+\]/;

export interface RepairGapsReport {
  scanned: number;
  renamedIds: string[];
  collapsed: string[];
  split: string[];
  unveiled: string[];
  unresolved: string[];
}

function markersOf(text: string): string[] {
  return [...text.matchAll(MARKER)].map(([, index]) => `gap${index}`);
}

/** Renumera los marcadores de izquierda a derecha desde `gap1`. */
function renumber(text: string): string {
  let index = 1;
  return text.replace(MARKER, () => `[gap${index++}]`);
}

export function repairActivity(activity: Activity): {
  activity: Activity;
  renamedId: boolean;
  collapsed: boolean;
  split: boolean;
  unveiled: boolean;
  unresolved: boolean;
} {
  const flags = {
    renamedId: false,
    collapsed: false,
    split: false,
    unveiled: false,
    unresolved: false,
  };
  if (activity.evaluator.strategy !== "per_gap") {
    return { activity, ...flags };
  }

  const carrierKey = typeof activity.gapText === "string" ? "gapText" : "prompt";
  let carrier = String(activity[carrierKey as "gapText" | "prompt"] ?? "");
  let gaps = activity.evaluator.gaps.map((gap) => ({ ...gap }));

  // 1. Identificadores con guion: se renombran al marcador que usa el texto.
  const renamed = gaps.map((gap) => ({
    ...gap,
    gapId: gap.gapId.replace(/^gap-(\d+)$/, "gap$1"),
  }));
  if (renamed.some((gap, index) => gap.gapId !== gaps[index]!.gapId)) {
    gaps = renamed;
    flags.renamedId = true;
  }

  // La respuesta regalada al final del enunciado. Se quita antes de contar
  // marcadores para no confundirla con contexto.
  const unveiled = carrier.replace(/\s*\((?:[^()]{1,40})\)\s*$/, "");
  if (
    unveiled !== carrier &&
    gaps.some((gap) => gap.answers.some((answer) => carrier.includes(`(${answer})`)))
  ) {
    carrier = unveiled;
    flags.unveiled = true;
  }

  // 2. Marcadores pegados: el segundo sobra.
  while (markersOf(carrier).length > gaps.length && ADJACENT_MARKERS.test(carrier)) {
    carrier = carrier.replace(ADJACENT_MARKERS, (match) => match.split(/\s+/)[0]!);
    flags.collapsed = true;
  }
  if (flags.collapsed) carrier = renumber(carrier);

  // 3. Verbo separable: una palabra por hueco.
  const markers = markersOf(carrier);
  if (markers.length > gaps.length && gaps.length === 1) {
    const only = gaps[0]!;
    const canSplit = only.answers.every(
      (answer) => answer.trim().split(/\s+/).length === markers.length,
    );
    if (canSplit) {
      gaps = markers.map((gapId, position) => ({
        ...only,
        gapId,
        answers: only.answers.map((answer) => answer.trim().split(/\s+/)[position]!),
      }));
      flags.split = true;
    }
  }

  // Los marcadores mandan sobre los ids guardados: si el texto dice `[gap2]`,
  // el evaluador tiene que responder a `gap2`.
  const finalMarkers = markersOf(carrier);
  if (finalMarkers.length === gaps.length) {
    gaps = gaps.map((gap, index) => ({ ...gap, gapId: finalMarkers[index]! }));
  } else {
    flags.unresolved = true;
  }

  const touched =
    flags.renamedId || flags.collapsed || flags.split || flags.unveiled;
  if (!touched) return { activity, ...flags };

  return {
    activity: {
      ...activity,
      [carrierKey]: carrier,
      ...(carrierKey === "gapText" ? { prompt: carrier } : {}),
      evaluator: { ...activity.evaluator, gaps },
    } as Activity,
    ...flags,
  };
}

export async function repairGaps(datasetRoot = DATASET_ROOT): Promise<RepairGapsReport> {
  const files = await walkFiles(path.join(datasetRoot, "activities"), ".json");
  const report: RepairGapsReport = {
    scanned: 0,
    renamedIds: [],
    collapsed: [],
    split: [],
    unveiled: [],
    unresolved: [],
  };

  for (const file of files) {
    const batch = await readJson<ActivityBatch>(file);
    if (!Array.isArray(batch.activities)) continue;
    report.scanned += batch.activities.length;

    let touched = false;
    const activities = batch.activities.map((source) => {
      const result = repairActivity(source);
      if (result.renamedId) report.renamedIds.push(source.id);
      if (result.collapsed) report.collapsed.push(source.id);
      if (result.split) report.split.push(source.id);
      if (result.unveiled) report.unveiled.push(source.id);
      if (result.unresolved) report.unresolved.push(source.id);
      if (result.activity !== source) touched = true;
      return result.activity;
    });

    if (touched) await writeJson(file, { ...batch, activities });
  }

  return report;
}

async function main(): Promise<void> {
  const report = await repairGaps();
  console.log(
    [
      `Actividades revisadas: ${report.scanned}.`,
      `Identificadores renombrados: ${report.renamedIds.length}.`,
      `Marcadores duplicados unidos: ${report.collapsed.length}.`,
      `Respuestas repartidas por hueco: ${report.split.length}.`,
      `Respuestas regaladas retiradas: ${report.unveiled.length}.`,
      `Sin cuadrar: ${report.unresolved.length}.`,
    ].join(" "),
  );
  if (report.unresolved.length > 0) console.log(report.unresolved.join(", "));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
