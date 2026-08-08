import path from "node:path";
import { DATASET_ROOT, writeJson } from "./lib/io";
import { loadDataset } from "./lib/load";
import {
  composeMiniGames,
  composeSwipeDecks,
  type ComposedBatch,
} from "./lib/compose-decks-and-games";
import type { ActivityBatch, MiniGameId } from "./lib/types";

/**
 * Genera los `swipe_deck` y los `mini_game` del catálogo a partir del
 * contenido ya validado y los escribe como ficheros del DATASET.
 *
 *   pnpm dataset:compose
 *
 * Es idempotente: se borra lo generado antes de volver a escribir, así que dos
 * ejecuciones seguidas dejan exactamente los mismos ficheros.
 */

const TARGET_DECKS = 200;
const GAMES_PER_LESSON: readonly MiniGameId[] = ["frog_leap", "lane_runner"];

export async function composeContent(datasetRoot = DATASET_ROOT): Promise<{
  decks: number;
  games: number;
  files: number;
}> {
  const dataset = await loadDataset(datasetRoot);
  // Se parte solo del contenido autorado: si se compusiera sobre lo compuesto,
  // una segunda pasada haría mazos de mazos.
  const sources = dataset.activities.filter(
    (activity) => activity.type !== "swipe_deck" && activity.type !== "mini_game",
  );

  const options = { maxDecks: TARGET_DECKS, gamesPerLesson: GAMES_PER_LESSON };
  const batches = [
    ...composeSwipeDecks(sources, options),
    ...composeMiniGames(sources, options),
  ];

  await removeGenerated(dataset, datasetRoot);

  let files = 0;
  let decks = 0;
  let games = 0;

  for (const batch of batches) {
    for (const [index, chunk] of chunkActivities(batch).entries()) {
      const sequence = String(index + 1).padStart(3, "0");
      const filePath = path.join(
        datasetRoot,
        "activities",
        batch.level.toLowerCase(),
        batch.category,
        batch.topic,
        batch.lessonId,
        batch.activityType,
        `batch-${sequence}.json`,
      );
      const file: ActivityBatch = {
        schemaVersion: "2.0.0",
        batchId: `${batch.lessonId}-${batch.activityType.replaceAll("_", "-")}-${sequence}`,
        level: batch.level,
        category: batch.category,
        topic: batch.topic,
        subtopic: batch.subtopic,
        lessonId: batch.lessonId,
        activityType: batch.activityType,
        activities: chunk,
      };
      await writeJson(filePath, file);
      files += 1;
      if (batch.activityType === "swipe_deck") decks += chunk.length;
      else games += chunk.length;
    }
  }

  return { decks, games, files };
}

/** Borra los lotes generados en una pasada anterior. */
async function removeGenerated(
  dataset: Awaited<ReturnType<typeof loadDataset>>,
  datasetRoot: string,
): Promise<void> {
  const { rm } = await import("node:fs/promises");
  for (const { filePath, batch } of dataset.batches) {
    if (batch.activityType === "swipe_deck" || batch.activityType === "mini_game") {
      await rm(filePath, { force: true });
    }
  }
  void datasetRoot;
}

function chunkActivities(batch: ComposedBatch) {
  const chunks: (typeof batch.activities)[] = [];
  for (let index = 0; index < batch.activities.length; index += 25) {
    chunks.push(batch.activities.slice(index, index + 25));
  }
  return chunks;
}

async function main(): Promise<void> {
  const { decks, games, files } = await composeContent();
  console.log(
    `Compuestos ${decks} mazos y ${games} minijuegos en ${files} ficheros.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
