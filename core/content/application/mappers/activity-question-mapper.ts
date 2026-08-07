import { seededShuffleDistinct } from "@/core/shared/kernel/seeded-shuffle";
import type {
  ActivityOptionDto,
  ActivityQuestionDto,
  ActivityType,
  GapLayout,
  MiniGameId,
} from "@/core/models/types/activity";
import { ACTIVITY_TYPES } from "@/core/models/types/activity";
import { gapIdsOf, parseGapSegments } from "../parse-gap-segments";
import type { Activity, ActivityOption } from "../../domain/types/activity";

/**
 * Convierte una actividad de catálogo (lado servidor, con evaluador) en un
 * DTO de pregunta seguro para el cliente. NUNCA incluye el evaluador, la
 * respuesta correcta ni la explicación.
 *
 * El `switch` es exhaustivo sobre `ActivityType` y termina en `assertNever`:
 * añadir un tipo sin darle presentación es un error de compilación, no un
 * fallback silencioso.
 */

/** Límite de palabras de UoE Part 4 (`cambridge-b2-first-format`). */
const KEY_WORD_MAX_WORDS = 5;

export function toActivityQuestionDto(activity: Activity): ActivityQuestionDto {
  const base = {
    id: activity.id,
    level: activity.level,
    taxonomyNodeId: activity.taxonomyNodeIds[0]!,
    type: asActivityType(activity),
    skillFocus: activity.skillFocus ?? activity.type,
    instructions: activity.instructions,
    ...(activity.passage ? { context: activity.passage } : {}),
  };

  switch (base.type) {
    case "gap_fill":
    case "word_formation": {
      const segments = parseGapSegments(activity.gapText ?? "");
      return {
        ...base,
        presentation: "gap_fill",
        ...(isQuestionPrompt(activity) ? { question: activity.prompt } : {}),
        segments,
        layout: resolveLayout(activity),
        gapIds: gapIdsOf(segments),
        ...(activity.cueWord ? { cueWord: activity.cueWord } : {}),
      };
    }

    case "key_word_transformation": {
      const segments = parseGapSegments(activity.gapText ?? "");
      return {
        ...base,
        presentation: "key_word_transformation",
        firstSentence: activity.firstSentence ?? activity.prompt,
        keyWord: activity.keyWord ?? "",
        segments,
        gapIds: gapIdsOf(segments),
        maxWords: KEY_WORD_MAX_WORDS,
      };
    }

    case "single_choice":
    case "multiple_choice":
      return {
        ...base,
        presentation: "choice",
        question: activity.prompt,
        options: toOptions(activity.options),
        selection: base.type === "multiple_choice" ? "multiple" : "single",
      };

    case "true_false":
      return { ...base, presentation: "true_false", statement: activity.prompt };

    case "swipe_deck":
      return {
        ...base,
        presentation: "swipe_deck",
        cards: (activity.cards ?? []).map(({ id, statement }) => ({ id, statement })),
      };

    case "word_order":
      return {
        ...base,
        presentation: "word_order",
        // `tokens` se guarda en orden canónico (= la solución), así que hay
        // que barajarlo antes de enviarlo. Semilla estable por actividad.
        tokens: seededShuffleDistinct(
          (activity.tokens ?? []).map(({ id, text }) => ({ id, text })),
          `${activity.id}:tokens`,
          (token) => token.id,
        ),
      };

    case "matching":
      return {
        ...base,
        presentation: "matching",
        leftItems: (activity.pairs ?? []).map((pair) => ({
          id: pair.leftId,
          label: pair.left,
        })),
        // La columna derecha se baraja: si no, el emparejamiento es trivial.
        rightItems: seededShuffleDistinct(
          (activity.pairs ?? []).map((pair) => ({ id: pair.rightId, label: pair.right })),
          `${activity.id}:right`,
          (item) => item.id,
        ),
      };

    case "error_correction":
    case "guided_writing":
    case "sentence_rewrite":
      return {
        ...base,
        presentation: "free_text",
        prompt: activity.prompt,
        ...(activity.instructions ? { constraintHint: activity.instructions } : {}),
      };

    case "mini_game":
      return {
        ...base,
        presentation: "mini_game",
        game: (activity.game ?? "frog_leap") as MiniGameId,
        rounds: (activity.rounds ?? []).map((round) => ({
          id: round.id,
          prompt: round.prompt,
          options: toOptions(round.options),
        })),
      };

    default:
      return assertNever(base.type);
  }
}

function toOptions(options: readonly ActivityOption[] | undefined): ActivityOptionDto[] {
  return (options ?? []).map(({ id, text }) => ({ id, label: text }));
}

/**
 * El `prompt` de un `gap_fill` solo se muestra si aporta algo: en muchos items
 * el texto con huecos ya es la actividad completa y el prompt es una copia.
 */
function isQuestionPrompt(activity: Activity): boolean {
  const prompt = activity.prompt?.trim();
  if (!prompt) return false;
  const gapText = (activity.gapText ?? "").replace(/\[gap\d+\]/g, "").trim();
  return normalise(prompt) !== normalise(gapText);
}

function resolveLayout(activity: Activity): GapLayout {
  if (activity.gapLayout) return activity.gapLayout;
  return (activity.gapText ?? "").includes("\n") ? "dialogue" : "sentence";
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function asActivityType(activity: Activity): ActivityType {
  if ((ACTIVITY_TYPES as readonly string[]).includes(activity.type)) {
    return activity.type as ActivityType;
  }
  throw new Error(
    `Tipo de actividad desconocido "${activity.type}" en ${activity.id}. ` +
      "Ejecuta pnpm dataset:migrate-v2 para migrar el catálogo a v2.",
  );
}

function assertNever(value: never): never {
  throw new Error(`Tipo de actividad sin presentación asignada: ${String(value)}`);
}
