import { seededShuffle } from "@/core/shared/kernel/seeded-shuffle";
import type { Activity, ActivityCard, ActivityRound, MiniGameId } from "./types";

/**
 * Composición de `swipe_deck` y `mini_game` a partir del contenido ya
 * validado. No es una agregación en tiempo de ejecución: el resultado se
 * escribe como ficheros del DATASET, con ids estables y explicación por
 * sub-ítem, así que una partida se repite siempre igual y se puede versionar,
 * revisar y validar como cualquier otra actividad.
 *
 * Las actividades de origen **no se consumen**: la misma pregunta puede
 * practicarse suelta y dentro de un juego. Cambiar de formato es justamente lo
 * que refuerza el recuerdo, y así la cobertura por nodo no se altera.
 */

export const DECK_MIN_CARDS = 5;
export const DECK_MAX_CARDS = 8;
export const GAME_ROUNDS = 8;
/** Los dos juegos implementados usan tres opciones por ronda. */
export const GAME_OPTIONS = 3;

export interface ComposeOptions {
  /** Tope global de mazos, para no agotar el banco de afirmaciones. */
  maxDecks: number;
  /** Juegos por lección. */
  gamesPerLesson: readonly MiniGameId[];
}

export interface ComposedBatch {
  level: Activity["level"];
  category: string;
  topic: string;
  subtopic: string;
  lessonId: string;
  activityType: "swipe_deck" | "mini_game";
  activities: Activity[];
}

/**
 * Agrupa las afirmaciones de verdadero/falso en mazos de 6 a 8 cartas,
 * repartiendo por tema para que la selección sea variada y no se llenen los
 * primeros temas y se queden los últimos vacíos.
 */
export function composeSwipeDecks(
  activities: readonly Activity[],
  options: ComposeOptions,
): ComposedBatch[] {
  const sources = activities.filter(
    (activity) => activity.type === "true_false" && activity.status === "published",
  );

  const byScope = groupBy(sources, (activity) =>
    [activity.level, activity.category, activity.topic, activity.lessonIds[0] ?? activity.topic].join("|"),
  );

  // Cada tema aporta sus mazos candidatos; luego se toman en ronda para que
  // el tope global no deje temas enteros fuera.
  const candidates = new Map<string, Activity[][]>();
  for (const [scope, items] of byScope) {
    const ordered = seededShuffle(items, `deck:${scope}`);
    const chunks: Activity[][] = [];
    for (let index = 0; index + DECK_MIN_CARDS <= ordered.length; ) {
      const size = DECK_MIN_CARDS + ((chunks.length + scope.length) % (DECK_MAX_CARDS - DECK_MIN_CARDS + 1));
      const chunk = ordered.slice(index, index + size);
      if (chunk.length < DECK_MIN_CARDS) break;
      chunks.push(chunk);
      index += chunk.length;
    }
    if (chunks.length > 0) candidates.set(scope, chunks);
  }

  const batches: ComposedBatch[] = [];
  let created = 0;
  for (let round = 0; created < options.maxDecks; round += 1) {
    let progressed = false;
    for (const scope of [...candidates.keys()].sort()) {
      if (created >= options.maxDecks) break;
      const chunk = candidates.get(scope)![round];
      if (!chunk) continue;
      progressed = true;
      batches.push(deckBatch(chunk, created));
      created += 1;
    }
    if (!progressed) break;
  }

  return mergeBatches(batches);
}

function deckBatch(cards: readonly Activity[], sequence: number): ComposedBatch {
  const first = cards[0]!;
  const lessonId = first.lessonIds[0] ?? first.topic;
  const id = `${lessonId}-sd-${String(sequence + 1).padStart(3, "0")}`;

  const deckCards: ActivityCard[] = cards.map((source, index) => ({
    id: `c${index + 1}`,
    statement: source.prompt,
    explanation: source.explanation,
  }));

  return {
    level: first.level,
    category: first.category,
    topic: first.topic,
    subtopic: first.subtopic,
    lessonId,
    activityType: "swipe_deck",
    activities: [
      {
        schemaVersion: "2.0.0",
        id,
        status: "published",
        autoGradable: true,
        level: first.level,
        type: "swipe_deck",
        skillFocus: "swipe_deck",
        category: first.category,
        topic: first.topic,
        subtopic: first.subtopic,
        taxonomyNodeIds: first.taxonomyNodeIds,
        difficulty: medianDifficulty(cards),
        instructions:
          "Desliza a la derecha si la frase es correcta y a la izquierda si no lo es.",
        prompt: `Mazo de ${cards.length} afirmaciones para repasar el tema.`,
        cards: deckCards,
        lessonIds: [lessonId],
        tags: uniqueTags(first.tags, "swipe-deck"),
        estimatedSeconds: Math.min(900, cards.length * 12),
        evaluator: {
          strategy: "deck_booleans",
          cards: cards.map((source, index) => ({
            cardId: `c${index + 1}`,
            correct:
              source.evaluator.strategy === "boolean" ? source.evaluator.correct : false,
          })),
        },
        explanation:
          "Cada carta repasa una regla del tema; revisa las falladas al terminar el mazo.",
      },
    ],
  };
}

/**
 * Compone una partida por juego y por lección a partir de las preguntas de
 * opción única de esa lección.
 */
export function composeMiniGames(
  activities: readonly Activity[],
  options: ComposeOptions,
): ComposedBatch[] {
  const sources = activities.filter(
    (activity) =>
      activity.type === "single_choice" &&
      activity.status === "published" &&
      activity.evaluator.strategy === "single_option" &&
      hasDistinctOptions(activity),
  );

  const byLesson = groupBy(sources, (activity) => activity.lessonIds[0] ?? activity.topic);
  const batches: ComposedBatch[] = [];

  for (const [lessonId, items] of [...byLesson.entries()].sort()) {
    if (items.length < GAME_ROUNDS) continue;
    const ordered = seededShuffle(items, `game:${lessonId}`);

    for (const [gameIndex, game] of options.gamesPerLesson.entries()) {
      // Cada juego de la misma lección arranca en un punto distinto del banco
      // para que las dos partidas no repitan las mismas preguntas.
      const offset = (gameIndex * GAME_ROUNDS) % ordered.length;
      const picked = Array.from(
        { length: GAME_ROUNDS },
        (_, index) => ordered[(offset + index) % ordered.length]!,
      );
      batches.push(gameBatch(lessonId, game, picked));
    }
  }

  return mergeBatches(batches);
}

function gameBatch(
  lessonId: string,
  game: MiniGameId,
  sources: readonly Activity[],
): ComposedBatch {
  const first = sources[0]!;
  const id = `${lessonId}-mg-${game.replaceAll("_", "-")}-001`;

  const rounds: ActivityRound[] = sources.map((source, index) => {
    const roundId = `r${index + 1}`;
    const correctId =
      source.evaluator.strategy === "single_option" ? source.evaluator.correctOptionId : "";
    const correct = source.options!.find((option) => option.id === correctId)!;
    // Se recorta a tres opciones: los dos juegos tienen tres nenúfares y tres
    // carriles. La correcta siempre entra; los distractores se eligen con
    // semilla estable para que la partida sea reproducible.
    // Ocho items del catálogo tienen dos opciones con el mismo texto. Al
    // recortar a tres, un duplicado dejaría la ronda sin respuesta única.
    const seen = new Set([normalise(correct.text)]);
    const distractors = seededShuffle(
      source.options!.filter((option) => option.id !== correctId),
      `${id}:${roundId}`,
    )
      .filter((option) => {
        const key = normalise(option.text);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, GAME_OPTIONS - 1);

    return {
      id: roundId,
      prompt: source.prompt,
      // Sin el pasaje, enunciados como «Everyday English cloze 002» no dicen
      // nada: la frase con el hueco vive ahí.
      ...(source.passage ? { context: source.passage } : {}),
      options: seededShuffle([correct, ...distractors], `${id}:${roundId}:order`).map(
        (option) => ({
          id: option.id,
          text: option.text,
          ...(option.feedback ? { feedback: option.feedback } : {}),
        }),
      ),
      explanation: source.explanation,
    };
  });

  return {
    level: first.level,
    category: first.category,
    topic: first.topic,
    subtopic: first.subtopic,
    lessonId,
    activityType: "mini_game",
    activities: [
      {
        schemaVersion: "2.0.0",
        id,
        status: "published",
        autoGradable: true,
        level: first.level,
        type: "mini_game",
        skillFocus: "mini_game",
        category: first.category,
        topic: first.topic,
        subtopic: first.subtopic,
        taxonomyNodeIds: first.taxonomyNodeIds,
        difficulty: medianDifficulty(sources),
        instructions: GAME_INSTRUCTIONS[game],
        prompt: `Partida de ${rounds.length} rondas para repasar el tema jugando.`,
        game,
        rounds,
        lessonIds: [lessonId],
        tags: uniqueTags(first.tags, "mini-game"),
        estimatedSeconds: Math.min(900, rounds.length * 15),
        evaluator: {
          strategy: "game_rounds",
          rounds: sources.map((source, index) => ({
            roundId: `r${index + 1}`,
            correctOptionId:
              source.evaluator.strategy === "single_option"
                ? source.evaluator.correctOptionId
                : "",
          })),
        },
        explanation:
          "Al terminar la partida verás la media de aciertos y la explicación de cada ronda fallada.",
      },
    ],
  };
}

const GAME_INSTRUCTIONS: Record<MiniGameId, string> = {
  frog_leap: "Ayuda a la rana a cruzar el río eligiendo el nenúfar correcto en cada salto.",
  lane_runner: "Colócate en el carril de la respuesta correcta antes de cruzar cada puerta.",
  sentence_tower: "Apila los fragmentos en orden para levantar la frase.",
};

// ------------------------------------------------------------------ apoyo

/** Misma normalización que usa el validador, para no dejar pasar duplicados
 *  que solo difieren en puntuación o acentos. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** ¿La pregunta da opciones suficientes y distintas para una ronda? */
function hasDistinctOptions(activity: Activity): boolean {
  if (activity.evaluator.strategy !== "single_option") return false;
  const texts = (activity.options ?? []).map((option) => normalise(option.text));
  return new Set(texts).size >= GAME_OPTIONS;
}

function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(key(item)) ?? [];
    group.push(item);
    groups.set(key(item), group);
  }
  return groups;
}

/** Une los lotes que caen en el mismo destino, respetando el máximo de 25. */
function mergeBatches(batches: readonly ComposedBatch[]): ComposedBatch[] {
  const merged = new Map<string, ComposedBatch>();
  for (const batch of batches) {
    const key = [batch.level, batch.category, batch.topic, batch.lessonId, batch.activityType].join("|");
    const existing = merged.get(key);
    if (existing) existing.activities.push(...batch.activities);
    else merged.set(key, { ...batch, activities: [...batch.activities] });
  }
  return [...merged.values()].sort((left, right) =>
    left.activities[0]!.id.localeCompare(right.activities[0]!.id),
  );
}

function medianDifficulty(activities: readonly Activity[]): Activity["difficulty"] {
  const sorted = [...activities].map((activity) => activity.difficulty).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 2;
}

function uniqueTags(tags: readonly string[], extra: string): string[] {
  return [...new Set([...tags, extra])];
}
