import {
  KWT_MAX_WORDS,
  KWT_MIN_WORDS,
  containsWord,
  countCambridgeWords,
  hasContraction,
} from "./migrate-v2-transform";
import type { Activity, ActivityBatch } from "./types";

/**
 * Reglas pedagógicas del contenido, separadas de la validación estructural de
 * `validation.ts`. Cubren lo que el JSON Schema no puede expresar: relación
 * entre respuesta y enunciado, formato de UoE Part 3 y Part 4, sesgo de
 * posición y equilibrio de verdadero/falso.
 *
 * Referencias: `cambridge-b2-first-format` y `cambridge-b1-preliminary-format`
 * en `DATASET/references/sources.json`.
 */

export type RuleSeverity = "error" | "warning";

export interface RuleIssue {
  code: string;
  location: string;
  message: string;
  severity: RuleSeverity;
}

/** Ninguna posición debe concentrar más de esta fracción de respuestas. */
export const MAX_POSITION_SHARE = 0.45;
/** Tamaño mínimo de muestra para que el sesgo de posición sea significativo. */
export const MIN_POSITION_SAMPLE = 8;
/** Reparto aceptable de verdadero/falso dentro de un lote. */
export const TRUE_FALSE_BALANCE = { min: 0.4, max: 0.6 } as const;

const GAP_MARKER = /\[(gap\d+)\]/g;

export function validateActivityRules(
  relativePath: string,
  activity: Activity,
): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const location = `${relativePath}#${activity.id}`;

  validateGapMarkers(location, activity, issues);
  validateVisibleAnswer(location, activity, issues);

  switch (activity.type) {
    case "word_formation":
      validateWordFormation(location, activity, issues);
      break;
    case "key_word_transformation":
      validateKeyWordTransformation(location, activity, issues);
      break;
    case "error_correction":
    case "sentence_rewrite":
      validateRewrite(location, activity, issues);
      break;
    case "word_order":
      validateWordOrder(location, activity, issues);
      break;
    case "swipe_deck":
      validateSwipeDeck(location, activity, issues);
      break;
    case "mini_game":
      validateMiniGame(location, activity, issues);
      break;
    default:
      break;
  }

  validateOptionQuality(location, activity, issues);
  validateAnswerVariety(location, activity, issues);

  return issues;
}

/** Reglas que solo tienen sentido mirando el lote completo. */
export function validateBatchRules(
  relativePath: string,
  batch: ActivityBatch,
): RuleIssue[] {
  return [
    ...validatePositionBias(relativePath, batch),
    ...validateTrueFalseBalance(relativePath, batch),
    ...validateSelectionVariety(relativePath, batch),
  ];
}

// ---------------------------------------------------------------- por item

function validateGapMarkers(
  location: string,
  activity: Activity,
  issues: RuleIssue[],
): void {
  if (activity.evaluator.strategy !== "per_gap") return;

  const markers = [...(activity.gapText ?? "").matchAll(GAP_MARKER)].map(
    (match) => match[1]!,
  );
  const gaps = activity.evaluator.gaps.map(({ gapId }) => gapId);

  if (markers.length === 0) {
    push(issues, "gap-marker-missing", location, "error", "El texto no contiene ningún [gapN].");
    return;
  }
  if (markers.join(",") !== gaps.join(",")) {
    push(
      issues,
      "gap-marker-mismatch",
      location,
      "error",
      `Los marcadores [${markers.join(", ")}] no casan en orden con el evaluador [${gaps.join(", ")}].`,
    );
  }
  if (new Set(markers).size !== markers.length) {
    push(issues, "gap-marker-duplicate", location, "error", "Hay marcadores [gapN] repetidos.");
  }
}

/** La respuesta de un hueco no puede estar escrita en el propio enunciado. */
function validateVisibleAnswer(
  location: string,
  activity: Activity,
  issues: RuleIssue[],
): void {
  if (activity.evaluator.strategy !== "per_gap") return;

  const visible = [
    activity.prompt,
    activity.passage,
    stripGapMarkers(activity.gapText ?? ""),
  ]
    .filter(Boolean)
    .join(" ");

  for (const gap of activity.evaluator.gaps) {
    for (const answer of gap.answers) {
      if (normalise(answer).length >= 3 && containsPhrase(visible, answer)) {
        push(
          issues,
          "answer-visible-in-prompt",
          location,
          "error",
          `La respuesta «${answer}» del hueco ${gap.gapId} ya aparece en el enunciado.`,
        );
        break;
      }
    }
  }
}

/** UoE Part 3: una sola palabra derivada de la raíz, distinta de la raíz. */
function validateWordFormation(
  location: string,
  activity: Activity,
  issues: RuleIssue[],
): void {
  const cue = activity.cueWord;
  if (!cue || cue === "TODO") {
    push(issues, "word-formation-cue", location, "error", "Falta la raíz en mayúsculas.");
    return;
  }
  if (activity.evaluator.strategy !== "per_gap") return;

  for (const answer of activity.evaluator.gaps.flatMap((gap) => gap.answers)) {
    const word = answer.trim();
    if (word.split(/\s+/).length > 1) {
      push(
        issues,
        "word-formation-multi-word",
        location,
        "error",
        `«${word}» tiene varias palabras; Part 3 se responde con una sola.`,
      );
    }
    if (word.toLowerCase() === cue.toLowerCase()) {
      push(
        issues,
        "word-formation-answer-equals-cue",
        location,
        "error",
        `La respuesta «${word}» es la raíz sin derivar.`,
      );
    } else if (!sharesRoot(word, cue)) {
      push(
        issues,
        "word-formation-unrelated-answer",
        location,
        "error",
        `«${word}» no parece derivar de «${cue}».`,
      );
    }
  }
}

/** UoE Part 4: dos frases, clave sin modificar, 2-5 palabras, sin contracciones. */
function validateKeyWordTransformation(
  location: string,
  activity: Activity,
  issues: RuleIssue[],
): void {
  const keyWord = activity.keyWord;
  if (!keyWord || keyWord === "TODO") {
    push(issues, "kwt-key-word", location, "error", "Falta la palabra clave en mayúsculas.");
  }
  if (!activity.firstSentence) {
    push(issues, "kwt-first-sentence", location, "error", "Falta la frase original.");
  }
  if (activity.evaluator.strategy !== "per_gap") return;

  const markers = [...(activity.gapText ?? "").matchAll(GAP_MARKER)];
  if (markers.length !== 1) {
    push(
      issues,
      "kwt-gap-count",
      location,
      "error",
      `Part 4 lleva exactamente un hueco; hay ${markers.length}.`,
    );
  }

  for (const answer of activity.evaluator.gaps.flatMap((gap) => gap.answers)) {
    const words = countCambridgeWords(answer);
    if (words < KWT_MIN_WORDS || words > KWT_MAX_WORDS) {
      push(
        issues,
        "kwt-answer-length",
        location,
        "error",
        `«${answer}» cuenta ${words} palabras; Part 4 exige entre ${KWT_MIN_WORDS} y ${KWT_MAX_WORDS}.`,
      );
    }
    if (hasContraction(answer)) {
      push(
        issues,
        "kwt-contraction",
        location,
        "error",
        `«${answer}» usa una contracción; hay que escribir la forma completa.`,
      );
    }
    if (keyWord && keyWord !== "TODO" && !containsWord(answer, keyWord)) {
      push(
        issues,
        "kwt-key-word-absent",
        location,
        "error",
        `La clave «${keyWord}» debe aparecer sin modificar en «${answer}».`,
      );
    }
  }
}

/** Reescribir algo exige que la respuesta difiera del punto de partida. */
function validateRewrite(
  location: string,
  activity: Activity,
  issues: RuleIssue[],
): void {
  const source = activity.passage ?? activity.prompt;
  for (const answer of acceptedAnswers(activity)) {
    if (normalise(answer) === normalise(activity.prompt)) {
      push(
        issues,
        "answer-equals-prompt",
        location,
        "error",
        "La respuesta es idéntica al enunciado: no hay nada que transformar.",
      );
      return;
    }
    if (activity.passage && containsPhrase(source, answer)) {
      push(
        issues,
        "answer-inside-passage",
        location,
        "error",
        "La respuesta aparece literal en el texto de partida.",
      );
      return;
    }
  }
}

function validateWordOrder(
  location: string,
  activity: Activity,
  issues: RuleIssue[],
): void {
  if (activity.evaluator.strategy !== "ordered_tokens") return;

  const tokenIds = (activity.tokens ?? []).map(({ id }) => id);
  const correct = activity.evaluator.correctTokenIds;

  if ([...tokenIds].sort().join(",") !== [...correct].sort().join(",")) {
    push(
      issues,
      "word-order-token-mismatch",
      location,
      "error",
      `correctTokenIds cubre ${correct.length} de ${tokenIds.length} fragmentos.`,
    );
  }
}

function validateSwipeDeck(
  location: string,
  activity: Activity,
  issues: RuleIssue[],
): void {
  const cards = activity.cards ?? [];
  const ids = cards.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    push(issues, "deck-duplicate-card-id", location, "error", "Hay ids de carta repetidos.");
  }
  if (activity.evaluator.strategy !== "deck_booleans") return;

  const graded = new Set(activity.evaluator.cards.map(({ cardId }) => cardId));
  for (const id of ids) {
    if (!graded.has(id)) {
      push(issues, "deck-card-ungraded", location, "error", `La carta ${id} no se corrige.`);
    }
  }
  for (const { cardId } of activity.evaluator.cards) {
    if (!ids.includes(cardId)) {
      push(issues, "deck-missing-card", location, "error", `No existe la carta ${cardId}.`);
    }
  }

  const trueCount = activity.evaluator.cards.filter(({ correct }) => correct).length;
  const share = trueCount / activity.evaluator.cards.length;
  if (share < TRUE_FALSE_BALANCE.min || share > TRUE_FALSE_BALANCE.max) {
    push(
      issues,
      "deck-unbalanced",
      location,
      "warning",
      `El mazo tiene ${trueCount} verdaderas de ${activity.evaluator.cards.length}.`,
    );
  }
}

function validateMiniGame(
  location: string,
  activity: Activity,
  issues: RuleIssue[],
): void {
  const rounds = activity.rounds ?? [];
  const ids = rounds.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    push(issues, "game-duplicate-round-id", location, "error", "Hay ids de ronda repetidos.");
  }

  for (const round of rounds) {
    const optionIds = round.options.map(({ id }) => id);
    if (new Set(optionIds).size !== optionIds.length) {
      push(
        issues,
        "game-duplicate-option-id",
        location,
        "error",
        `La ronda ${round.id} repite ids de opción.`,
      );
    }
    const texts = round.options.map(({ text }) => normalise(text));
    if (new Set(texts).size !== texts.length) {
      push(
        issues,
        "game-duplicate-option-text",
        location,
        "error",
        `La ronda ${round.id} repite el texto de una opción.`,
      );
    }
  }

  if (activity.evaluator.strategy !== "game_rounds") return;

  const byId = new Map(rounds.map((round) => [round.id, round]));
  for (const { roundId, correctOptionId } of activity.evaluator.rounds) {
    const round = byId.get(roundId);
    if (!round) {
      push(issues, "game-missing-round", location, "error", `No existe la ronda ${roundId}.`);
      continue;
    }
    if (!round.options.some(({ id }) => id === correctOptionId)) {
      push(
        issues,
        "game-missing-correct-option",
        location,
        "error",
        `La opción correcta ${correctOptionId} no existe en la ronda ${roundId}.`,
      );
    }
  }
  for (const id of ids) {
    if (!activity.evaluator.rounds.some(({ roundId }) => roundId === id)) {
      push(issues, "game-round-ungraded", location, "error", `La ronda ${id} no se corrige.`);
    }
  }
}

function validateOptionQuality(
  location: string,
  activity: Activity,
  issues: RuleIssue[],
): void {
  const options = activity.options;
  if (!options?.length) return;

  const texts = options.map(({ text }) => normalise(text));
  if (new Set(texts).size !== texts.length) {
    push(
      issues,
      "duplicate-option-text",
      location,
      "error",
      "Dos opciones comparten el mismo texto.",
    );
  }

  const distractors = options.filter(({ id }) => !isCorrectOption(activity, id));
  if (distractors.length > 0 && distractors.every(({ feedback }) => !feedback)) {
    push(
      issues,
      "missing-distractor-feedback",
      location,
      "warning",
      "Ningún distractor explica por qué es incorrecto.",
    );
  }
}

/** Producción libre con una sola respuesta aceptada es prácticamente injusta. */
function validateAnswerVariety(
  location: string,
  activity: Activity,
  issues: RuleIssue[],
): void {
  const FREE_PRODUCTION: ReadonlySet<Activity["type"]> = new Set([
    "error_correction",
    "guided_writing",
    "sentence_rewrite",
  ]);
  if (!FREE_PRODUCTION.has(activity.type)) return;
  if (acceptedAnswers(activity).length >= 2) return;

  push(
    issues,
    "single-accepted-answer",
    location,
    "warning",
    "Un ejercicio de producción libre debería aceptar al menos dos respuestas.",
  );
}

// ---------------------------------------------------------------- por lote

function validatePositionBias(
  relativePath: string,
  batch: ActivityBatch,
): RuleIssue[] {
  const positions: number[] = [];
  let maxLength = 0;

  for (const activity of batch.activities) {
    if (activity.evaluator.strategy !== "single_option") continue;
    if (activity.optionsOrdered) continue;
    const options = activity.options ?? [];
    const index = options.findIndex(({ id }) => id === activity.evaluator.correctOptionId);
    if (index < 0) continue;
    positions.push(index);
    maxLength = Math.max(maxLength, options.length);
  }

  if (positions.length < MIN_POSITION_SAMPLE) return [];

  const counts = new Array<number>(maxLength).fill(0);
  for (const index of positions) counts[index] += 1;

  const worst = Math.max(...counts);
  const share = worst / positions.length;
  if (share <= MAX_POSITION_SHARE) return [];

  const letter = String.fromCharCode(65 + counts.indexOf(worst));
  return [
    {
      code: "answer-position-bias",
      location: relativePath,
      severity: "error",
      message:
        `La posición ${letter} concentra ${worst} de ${positions.length} respuestas ` +
        `(${Math.round(share * 100)} %); el máximo es ${Math.round(MAX_POSITION_SHARE * 100)} %.`,
    },
  ];
}

function validateTrueFalseBalance(
  relativePath: string,
  batch: ActivityBatch,
): RuleIssue[] {
  const booleans = batch.activities.filter(
    (activity) => activity.evaluator.strategy === "boolean",
  );
  if (booleans.length < MIN_POSITION_SAMPLE) return [];

  const trueCount = booleans.filter(
    (activity) =>
      activity.evaluator.strategy === "boolean" && activity.evaluator.correct,
  ).length;
  const share = trueCount / booleans.length;
  if (share >= TRUE_FALSE_BALANCE.min && share <= TRUE_FALSE_BALANCE.max) return [];

  return [
    {
      code: "true-false-balance",
      location: relativePath,
      severity: "warning",
      message:
        `${trueCount} de ${booleans.length} afirmaciones son verdaderas ` +
        `(${Math.round(share * 100)} %); el reparto debe quedar entre ` +
        `${TRUE_FALSE_BALANCE.min * 100} % y ${TRUE_FALSE_BALANCE.max * 100} %.`,
    },
  ];
}

/** Si todos los `multiple_choice` de un lote tienen el mismo número de aciertos, es adivinable. */
function validateSelectionVariety(
  relativePath: string,
  batch: ActivityBatch,
): RuleIssue[] {
  const counts = batch.activities
    .filter((activity) => activity.evaluator.strategy === "multiple_options")
    .map((activity) =>
      activity.evaluator.strategy === "multiple_options"
        ? activity.evaluator.correctOptionIds.length
        : 0,
    );

  if (counts.length < MIN_POSITION_SAMPLE || new Set(counts).size > 1) return [];

  return [
    {
      code: "selection-count-uniform",
      location: relativePath,
      severity: "warning",
      message: `Los ${counts.length} items de selección múltiple tienen siempre ${counts[0]} respuestas correctas.`,
    },
  ];
}

// ------------------------------------------------------------------ apoyo

function push(
  issues: RuleIssue[],
  code: string,
  location: string,
  severity: RuleSeverity,
  message: string,
): void {
  issues.push({ code, location, message, severity });
}

function acceptedAnswers(activity: Activity): string[] {
  const { evaluator } = activity;
  switch (evaluator.strategy) {
    case "exact_text":
      return [evaluator.answer];
    case "one_of_texts":
      return evaluator.answers;
    case "per_gap":
      return evaluator.gaps.flatMap((gap) => gap.answers);
    default:
      return [];
  }
}

function isCorrectOption(activity: Activity, optionId: string): boolean {
  const { evaluator } = activity;
  if (evaluator.strategy === "single_option") return evaluator.correctOptionId === optionId;
  if (evaluator.strategy === "multiple_options") {
    return evaluator.correctOptionIds.includes(optionId);
  }
  return false;
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Contención por palabras completas: «ticket» no casa dentro de «tickets». */
function containsPhrase(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return ` ${normalise(haystack)} `.includes(` ${normalise(needle)} `);
}

function stripGapMarkers(text: string): string {
  return text.replace(GAP_MARKER, " ");
}

/**
 * ¿La respuesta deriva de la raíz? Comparación tolerante: comparte un prefijo
 * significativo o la raíz aparece dentro de la respuesta. Cubre `care ->
 * carefully`, `convince -> convincing`, `decide -> decision` y los prefijos
 * negativos (`agree -> disagreement`).
 */
export function sharesRoot(answer: string, cue: string): boolean {
  const word = answer.toLowerCase().replace(/[^a-z]/g, "");
  const root = cue.toLowerCase().replace(/[^a-z]/g, "");
  if (!word || !root) return false;
  if (word.includes(root) || root.includes(word)) return true;

  const prefixLength = Math.min(4, root.length, word.length);
  if (prefixLength >= 3) {
    // La raíz puede aparecer tras un prefijo negativo (`disagreement`).
    const stem = root.slice(0, prefixLength);
    if (word.includes(stem)) return true;
  }

  // Alternancias ortográficas frecuentes: -e final, y/i, doble consonante.
  const flexible = root.replace(/e$/, "").replace(/y$/, "i");
  return flexible.length >= 3 && word.includes(flexible);
}
