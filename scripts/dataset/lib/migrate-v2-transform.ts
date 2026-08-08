import { seededShuffle } from "@/core/shared/kernel/seeded-shuffle";
import type {
  Activity,
  ActivityOption,
  ActivityType,
  Evaluator,
  GapLayout,
  NormalizationRules,
} from "./types";

/**
 * Transformación pura v1 -> v2 de una actividad. No toca disco: el runner
 * (`scripts/dataset/migrate-v2.ts`) se encarga de leer, agrupar y escribir.
 *
 * Es determinista e idempotente: aplicar la función a una actividad ya
 * migrada devuelve exactamente la misma actividad.
 */

/** Forma v1 de una actividad, tal y como está hoy en disco. */
export interface ActivityV1 {
  schemaVersion: string;
  id: string;
  status: string;
  autoGradable: boolean;
  level: "B1" | "B2";
  type: string;
  category: string;
  topic: string;
  subtopic: string;
  taxonomyNodeIds: string[];
  difficulty: number;
  instructions: string;
  prompt: string;
  passage?: string;
  gapText?: string;
  cueWord?: string;
  keyWord?: string;
  options?: ActivityOption[];
  optionsOrdered?: boolean;
  tokens?: ActivityOption[];
  pairs?: Activity["pairs"];
  lessonIds: string[];
  tags: string[];
  estimatedSeconds: number;
  evaluator: Record<string, unknown>;
  explanation: string;
  [key: string]: unknown;
}

/** Motivo por el que un item no se puede arreglar solo. */
export interface MigrationIssue {
  activityId: string;
  rule: string;
  detail: string;
}

export interface TransformResult {
  activity: Activity;
  issues: MigrationIssue[];
}

/** Tabla §1.1 del plan: tipo v1 -> tipo canónico v2. */
export const TYPE_MAP: Readonly<Record<string, ActivityType>> = {
  // Ya canónicos
  gap_fill: "gap_fill",
  single_choice: "single_choice",
  multiple_choice: "multiple_choice",
  true_false: "true_false",
  swipe_deck: "swipe_deck",
  word_order: "word_order",
  matching: "matching",
  error_correction: "error_correction",
  word_formation: "word_formation",
  key_word_transformation: "key_word_transformation",
  mini_game: "mini_game",
  // Familia de huecos
  fill_blank: "gap_fill",
  open_cloze: "gap_fill",
  complete_paragraph: "gap_fill",
  complete_dialogue: "gap_fill",
  multi_gap_fill: "gap_fill",
  // Familia de opción única
  multiple_choice_cloze: "single_choice",
  phrasal_verb_choice: "single_choice",
  collocation_choice: "single_choice",
  preposition_choice: "single_choice",
  vocabulary_in_context: "single_choice",
  reading_comprehension: "single_choice",
  gapped_text: "single_choice",
  // Resto
  multiple_select: "multiple_choice",
  error_identification: "true_false",
  reading_matching: "matching",
};

/**
 * Estrategias de corrección que determinan el tipo por sí solas. Si un item
 * se corrige eligiendo una opción, es de elección, diga lo que diga su
 * etiqueta v1.
 */
const TYPE_BY_STRATEGY: Readonly<Record<string, ActivityType>> = {
  single_option: "single_choice",
  multiple_options: "multiple_choice",
  matching_pairs: "matching",
  ordered_tokens: "word_order",
  deck_booleans: "swipe_deck",
  game_rounds: "mini_game",
};

const DEFAULT_NORMALIZATION: NormalizationRules = {
  trim: true,
  collapseWhitespace: true,
  caseSensitive: false,
  ignoreTerminalPunctuation: true,
  normaliseApostrophes: true,
};

const GAP_TYPES: ReadonlySet<ActivityType> = new Set([
  "gap_fill",
  "word_formation",
  "key_word_transformation",
]);

const LEGACY_GAP_MARKER = /_{2,}/g;
const GAP_MARKER = /\[gap\d+\]/g;
const CUE_IN_TEXT = /\s*\(([A-Z][A-Z -]{1,20})\)\s*/;

/** Tipos v1 que se disponen como diálogo o como párrafo. */
const DIALOGUE_SOURCES = new Set(["complete_dialogue"]);
const PARAGRAPH_SOURCES = new Set(["complete_paragraph", "gapped_text"]);

export function transformActivity(source: ActivityV1): TransformResult {
  const issues: MigrationIssue[] = [];
  const skillFocus = typeof source.skillFocus === "string" ? source.skillFocus : source.type;
  const canonicalType = resolveType(source, skillFocus, issues);

  const base: Activity = {
    schemaVersion: "2.0.0",
    id: source.id,
    status: source.status as Activity["status"],
    autoGradable: true,
    level: source.level,
    type: canonicalType,
    skillFocus,
    category: source.category,
    topic: source.topic,
    subtopic: source.subtopic,
    taxonomyNodeIds: source.taxonomyNodeIds,
    difficulty: source.difficulty as Activity["difficulty"],
    instructions: source.instructions,
    prompt: source.prompt,
    lessonIds: source.lessonIds,
    tags: source.tags,
    estimatedSeconds: source.estimatedSeconds,
    evaluator: source.evaluator as unknown as Evaluator,
    explanation: source.explanation,
  };

  if (source.passage) base.passage = source.passage;
  if (source.pairs) base.pairs = source.pairs;
  if (source.cards) base.cards = source.cards as Activity["cards"];
  if (source.game) base.game = source.game as Activity["game"];
  if (source.rounds) base.rounds = source.rounds as Activity["rounds"];
  if (typeof source.firstSentence === "string") base.firstSentence = source.firstSentence;

  applyOptions(base, source);
  applyTokens(base, source, issues);

  if (GAP_TYPES.has(canonicalType)) {
    applyGaps(base, source, skillFocus, issues);
  }

  collectContentIssues(base, issues);

  return { activity: canonicaliseKeyOrder(base), issues };
}

/**
 * Orden de claves estable al serializar. Sin esto la salida no es
 * byte-idéntica entre pasadas: campos como `firstSentence` se escriben en un
 * punto distinto según existan ya o no en la entrada.
 */
const KEY_ORDER: ReadonlyArray<keyof Activity> = [
  "schemaVersion",
  "id",
  "status",
  "autoGradable",
  "level",
  "type",
  "skillFocus",
  "category",
  "topic",
  "subtopic",
  "taxonomyNodeIds",
  "difficulty",
  "instructions",
  "prompt",
  "firstSentence",
  "keyWord",
  "cueWord",
  "gapText",
  "gapLayout",
  "passage",
  "options",
  "optionsOrdered",
  "tokens",
  "pairs",
  "cards",
  "game",
  "rounds",
  "lessonIds",
  "tags",
  "estimatedSeconds",
  "evaluator",
  "explanation",
];

export function canonicaliseKeyOrder(activity: Activity): Activity {
  const ordered: Partial<Activity> = {};
  for (const key of KEY_ORDER) {
    if (activity[key] !== undefined) {
      (ordered as Record<string, unknown>)[key] = activity[key];
    }
  }
  return ordered as Activity;
}

/**
 * `key_word_transformation` v1 mezcla UoE Part 3 y Part 4. El corte es
 * **estructural**, no de longitud de la respuesta:
 *
 * - Part 3 (`word_formation`): UNA frase con un hueco y una raíz en
 *   mayúsculas de la que derivar («The report contains ___ evidence.
 *   (CONVINCE)» → *convincing*).
 * - Part 4 (`key_word_transformation`): DOS frases, la original y su
 *   reescritura con hueco, más una palabra clave que debe aparecer sin
 *   modificar («I decided to stop smoking… / GIVE / It was only 3 days ago
 *   that I made ___ smoking.» → *the decision to give up*).
 *
 * Contar palabras clasificaba mal 16 items de Part 4 cuya reescritura cabe en
 * una palabra («The uniforms are ___ every Friday. (WASHED)» → *washed*):
 * son pasivas legítimas, no derivaciones.
 */
function resolveType(
  source: ActivityV1,
  skillFocus: string,
  issues: MigrationIssue[],
): ActivityType {
  const mapped = TYPE_MAP[source.type];
  if (!mapped) {
    issues.push({
      activityId: source.id,
      rule: "unknown-type",
      detail: `Tipo v1 sin correspondencia canónica: "${source.type}".`,
    });
    return "gap_fill";
  }

  // El evaluador manda sobre la etiqueta v1: 25 `complete_dialogue` se corrigen
  // con `single_option` y son de elección, no de hueco. Mapearlos por nombre
  // producía un `per_gap` con la respuesta a null.
  const byEvaluator = TYPE_BY_STRATEGY[source.evaluator.strategy as string];
  if (byEvaluator && byEvaluator !== mapped) return byEvaluator;

  if (mapped !== "key_word_transformation") return mapped;
  if (skillFocus === "word_formation") return "word_formation";
  // Una pasada anterior ya dejó la primera frase en su campo: es Part 4.
  if (typeof source.firstSentence === "string") return "key_word_transformation";

  return countSentences(source.prompt) >= 2 ? "key_word_transformation" : "word_formation";
}

/** Frases del enunciado, ignorando el cue en mayúsculas y los fragmentos sueltos. */
export function countSentences(text: string): number {
  return extractCue(text)
    .text.split(/(?<=[.!?][”"']?)\s+/)
    .filter((sentence) => sentence.trim().length > 3).length;
}

/**
 * Baraja las opciones con semilla estable. Corrige el sesgo de posición del
 * 87,7 % sin tocar ids, así que `correctOptionId` sigue siendo válido.
 *
 * NO baraja cuando el orden es significativo (ver `hasMeaningfulOrder`): en
 * ese caso reordenar cambiaría el ejercicio o lo haría irresoluble.
 */
function applyOptions(target: Activity, source: ActivityV1): void {
  if (!source.options?.length) return;

  if (source.optionsOrdered === true || hasMeaningfulOrder(source.options)) {
    target.options = source.options;
    target.optionsOrdered = true;
    return;
  }

  // Se ordena por id antes de barajar para que el resultado dependa solo del
  // conjunto de opciones y no de su orden actual. Sin esto, una segunda
  // pasada aplicaría la permutación dos veces (P²), y en conjuntos de cuatro
  // P² es la identidad el 42 % de las veces: la respuesta correcta volvería a
  // su posición original y reaparecería el sesgo.
  const canonical = [...source.options].sort((left, right) => left.id.localeCompare(right.id));
  target.options = seededShuffle(canonical, `${source.id}:options`);
}

const CLOSING_OPTION = /\b(all|none|both|neither|any)\s+of\s+(the\s+)?(above|these|them|others)\b/i;
const NUMERIC_ONLY = /^[-+]?\d+(?:[.,]\d+)?$/;
const ISO_DATE = /^\d{4}(?:-\d{2}){0,2}$/;

/**
 * Un conjunto de opciones tiene orden significativo cuando reordenarlo rompe
 * el ejercicio. Tres casos:
 *
 * 1. Alguna opción es de cierre («all of the above»): debe quedarse al final.
 * 2. Todas son magnitudes comparables (números, horas, años) y vienen en
 *    secuencia monótona: el alumno las lee como una escala.
 * 3. Todas empiezan por un marcador ordinal correlativo («1.», «a)», «First»).
 */
export function hasMeaningfulOrder(options: readonly ActivityOption[]): boolean {
  const texts = options.map((option) => option.text.trim());
  if (texts.some((text) => CLOSING_OPTION.test(text))) return true;
  if (isMonotonicScale(texts)) return true;
  return isOrdinalSequence(texts);
}

function isMonotonicScale(texts: readonly string[]): boolean {
  const values = texts.map(toComparableNumber);
  if (values.some((value) => value === null)) return false;

  const numbers = values as number[];
  const ascending = numbers.every(
    (value, index) => index === 0 || value > numbers[index - 1]!,
  );
  const descending = numbers.every(
    (value, index) => index === 0 || value < numbers[index - 1]!,
  );
  return ascending || descending;
}

function toComparableNumber(text: string): number | null {
  if (NUMERIC_ONLY.test(text)) return Number(text.replace(",", "."));
  if (ISO_DATE.test(text)) return Number(text.replaceAll("-", ""));
  const clock = text.match(/^(\d{1,2})[:.](\d{2})(?:\s*(a\.?m\.?|p\.?m\.?))?$/i);
  if (clock) {
    const hours = Number(clock[1]) % 12;
    const offset = /^p/i.test(clock[3] ?? "") ? 12 : 0;
    return (hours + offset) * 60 + Number(clock[2]);
  }
  return null;
}

const ORDINAL_PREFIX = /^(?:(\d+)|([a-z])|(i{1,3}|iv|v))[).:]\s/i;
const ORDINAL_WORD = /^(first|second|third|fourth|fifth)\b/i;

function isOrdinalSequence(texts: readonly string[]): boolean {
  if (texts.every((text) => ORDINAL_WORD.test(text))) return true;
  const ranks = texts.map((text) => {
    const match = text.match(ORDINAL_PREFIX);
    if (!match) return null;
    if (match[1]) return Number(match[1]);
    if (match[2]) return match[2].toLowerCase().charCodeAt(0) - 96;
    return ["i", "ii", "iii", "iv", "v"].indexOf(match[3]!.toLowerCase()) + 1;
  });
  if (ranks.some((rank) => rank === null)) return false;
  return (ranks as number[]).every((rank, index) => index === 0 || rank === ranks[index - 1]! + 1);
}

/**
 * Deja `tokens` en el orden canónico de `correctTokenIds`. Barajar es
 * responsabilidad exclusiva del mapper de presentación.
 */
function applyTokens(
  target: Activity,
  source: ActivityV1,
  issues: MigrationIssue[],
): void {
  if (!source.tokens?.length) return;

  const evaluator = source.evaluator as { strategy?: string; correctTokenIds?: string[] };
  const correctIds = evaluator.correctTokenIds;
  if (evaluator.strategy !== "ordered_tokens" || !correctIds) {
    target.tokens = source.tokens;
    return;
  }

  const byId = new Map(source.tokens.map((token) => [token.id, token]));
  const ordered = correctIds.map((id) => byId.get(id)).filter(Boolean) as ActivityOption[];

  if (ordered.length !== source.tokens.length) {
    issues.push({
      activityId: source.id,
      rule: "word-order-token-mismatch",
      detail: `correctTokenIds cubre ${ordered.length} de ${source.tokens.length} tokens.`,
    });
    target.tokens = source.tokens;
    return;
  }

  target.tokens = ordered;
}

/**
 * Normaliza los huecos: `___` -> `[gapN]`, elige el texto portador entre
 * `prompt` y `passage`, extrae el cue `(CAPS)` a campo propio y convierte
 * `exact_text`/`one_of_texts` a `per_gap`.
 */
function applyGaps(
  target: Activity,
  source: ActivityV1,
  skillFocus: string,
  issues: MigrationIssue[],
): void {
  // Prioridad del texto portador: el `gapText` que dejó una pasada anterior,
  // luego el `passage` si es quien lleva el hueco, y por último el `prompt`.
  const alreadyMigrated = typeof source.gapText === "string" && source.gapText.length > 0;
  const carrierIsPassage =
    !alreadyMigrated && hasAnyGapMarker(source.passage) && !hasAnyGapMarker(source.prompt);
  const rawCarrier = alreadyMigrated
    ? source.gapText!
    : carrierIsPassage
      ? source.passage!
      : source.prompt;

  const { text: withoutCue, cue: cueInText } = extractCue(rawCarrier);
  const { text: gapText, count } = normaliseGapMarkers(withoutCue);

  // En una segunda pasada el cue ya vive en su campo y no está en el texto.
  const cue = cueInText ?? existingCue(source, target.type);

  if (count === 0) {
    issues.push({
      activityId: source.id,
      rule: "missing-gap",
      detail: "El texto no contiene ningún hueco tras la normalización.",
    });
    target.gapText = `${gapText.trim()} [gap1]`;
  } else {
    target.gapText = gapText;
  }

  target.prompt = stripCue(source.prompt);
  if (!carrierIsPassage && source.passage && !hasAnyGapMarker(source.passage)) {
    target.passage = source.passage;
  } else {
    delete target.passage;
  }

  if (target.type === "word_formation") {
    if (cue) target.cueWord = cue;
    else {
      issues.push({
        activityId: source.id,
        rule: "word-formation-missing-cue",
        detail: "UoE Part 3 sin palabra raíz en mayúsculas.",
      });
      target.cueWord = "TODO";
    }
  }

  if (target.type === "key_word_transformation") {
    applyKeyWordTransformation(target, source, cue, issues);
  }

  if (target.type === "gap_fill") {
    target.gapLayout = resolveGapLayout(skillFocus, target.gapText ?? "");
  }

  target.evaluator = toPerGap(source.evaluator, target.gapText ?? "", source.id, issues);
}

/**
 * UoE Part 4: la primera frase es el enunciado y el `gapText` es la segunda.
 * Cuando v1 las trae juntas en `prompt`, se parten por el último punto que
 * precede al hueco.
 */
function applyKeyWordTransformation(
  target: Activity,
  source: ActivityV1,
  cue: string | null,
  issues: MigrationIssue[],
): void {
  if (cue) target.keyWord = cue;
  else {
    issues.push({
      activityId: source.id,
      rule: "kwt-missing-key-word",
      detail: "UoE Part 4 sin palabra clave en mayúsculas.",
    });
    target.keyWord = "TODO";
  }

  const carrier = target.gapText ?? "";
  const gapAt = carrier.search(GAP_MARKER);
  const splitAt = carrier.lastIndexOf(". ", gapAt === -1 ? carrier.length : gapAt);

  if (splitAt > 0) {
    target.firstSentence = carrier.slice(0, splitAt + 1).trim();
    target.gapText = carrier.slice(splitAt + 2).trim();
  } else if (typeof target.firstSentence !== "string") {
    target.firstSentence = target.prompt;
  }

  for (const answer of allAnswers(source.evaluator)) {
    const words = countCambridgeWords(answer);
    if (words < KWT_MIN_WORDS || words > KWT_MAX_WORDS) {
      issues.push({
        activityId: source.id,
        rule: "kwt-answer-length",
        detail:
          `«${answer}» cuenta ${words} palabras; ` +
          `Part 4 exige entre ${KWT_MIN_WORDS} y ${KWT_MAX_WORDS}.`,
      });
    }
    if (hasContraction(answer)) {
      issues.push({
        activityId: source.id,
        rule: "kwt-contraction",
        detail: `«${answer}» usa una contracción; Part 4 exige la forma completa.`,
      });
    }
    if (target.keyWord !== "TODO" && !containsWord(answer, target.keyWord!)) {
      issues.push({
        activityId: source.id,
        rule: "kwt-key-word-absent",
        detail: `La clave "${target.keyWord}" no aparece sin modificar en «${answer}».`,
      });
    }
  }
}

/**
 * Reglas de recuento de UoE Part 4 (Cambridge B2 First, referencia
 * `cambridge-b2-first-format` de `DATASET/references/sources.json`):
 * la respuesta ocupa de 2 a 5 palabras, las contracciones cuentan como las
 * palabras que reemplazan («don't» = «do not» = 2) y los guiones no separan.
 */
export const KWT_MIN_WORDS = 2;
export const KWT_MAX_WORDS = 5;

const CONTRACTION = /[\p{L}]+['’](t|s|re|ve|ll|d|m)\b/giu;
/** `John's book` es un posesivo, no una contracción: cuenta una palabra. */
const POSSESSIVE = /[\p{L}]+['’]s\b/iu;
const AUXILIARY_S = /\b(it|he|she|that|there|what|who|let|here|one)['’]s\b/iu;

export function countCambridgeWords(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.reduce((total, word) => total + (isContraction(word) ? 2 : 1), 0);
}

export function hasContraction(text: string): boolean {
  return text.trim().split(/\s+/).some(isContraction);
}

function isContraction(word: string): boolean {
  CONTRACTION.lastIndex = 0;
  if (!CONTRACTION.test(word)) return false;
  // `'s` es ambiguo: solo cuenta doble cuando es «is»/«has», no un posesivo.
  if (POSSESSIVE.test(word)) return AUXILIARY_S.test(word);
  return true;
}

/** Todas las respuestas aceptadas, sea cual sea la estrategia de origen. */
function allAnswers(evaluator: Record<string, unknown>): string[] {
  if (typeof evaluator.answer === "string") return [evaluator.answer];
  const answers = evaluator.answers as string[] | undefined;
  if (answers?.length) return answers;
  const gaps = evaluator.gaps as Array<{ answers: string[] }> | undefined;
  if (gaps?.length) return gaps.flatMap((gap) => gap.answers);
  return [];
}

function resolveGapLayout(skillFocus: string, gapText: string): GapLayout {
  if (DIALOGUE_SOURCES.has(skillFocus) || looksLikeDialogue(gapText)) return "dialogue";
  if (PARAGRAPH_SOURCES.has(skillFocus)) return "paragraph";
  return countGapMarkers(gapText) > 1 && gapText.length > 140 ? "paragraph" : "sentence";
}

/** `A: ... B: ...` con al menos dos turnos. */
export function looksLikeDialogue(text: string): boolean {
  const turns = text.match(/(^|\s)([A-Z][A-Za-z ]{0,11}):\s/g);
  return (turns?.length ?? 0) >= 2;
}

/**
 * Parte un diálogo en línea (`A: ... B: ...`) en líneas separadas, para que el
 * renderer pueda pintar cada turno en su propia fila.
 */
export function splitDialogueLines(text: string): string {
  return text.replace(/\s+(?=[A-Z][A-Za-z ]{0,11}:\s)/g, "\n").trim();
}

export function hasAnyGapMarker(text: string | undefined): boolean {
  if (!text) return false;
  return countGapMarkers(text) > 0;
}

export function countGapMarkers(text: string): number {
  const legacy = text.match(LEGACY_GAP_MARKER)?.length ?? 0;
  const modern = text.match(GAP_MARKER)?.length ?? 0;
  return legacy + modern;
}

/** `___` -> `[gap1]`, `[gap2]`… respetando los `[gapN]` que ya existan. */
export function normaliseGapMarkers(text: string): { text: string; count: number } {
  const existing = text.match(GAP_MARKER)?.length ?? 0;
  let next = existing;
  const replaced = text.replace(LEGACY_GAP_MARKER, () => {
    next += 1;
    return `[gap${next}]`;
  });
  return { text: replaced.replace(/\s+/g, " ").trim(), count: next };
}

export function extractCue(text: string): { text: string; cue: string | null } {
  const match = text.match(CUE_IN_TEXT);
  if (!match) return { text, cue: null };
  return {
    text: text.replace(CUE_IN_TEXT, " ").replace(/\s+([.,;:!?])/g, "$1").trim(),
    cue: match[1]!.trim(),
  };
}

function stripCue(text: string): string {
  return extractCue(text).text;
}

/** El cue que una pasada anterior ya movió a su campo propio. */
function existingCue(source: ActivityV1, type: ActivityType): string | null {
  const field = type === "word_formation" ? source.cueWord : source.keyWord;
  return typeof field === "string" && field !== "TODO" ? field : null;
}

/** Convierte cualquier evaluador de texto a `per_gap` casando por `gapId`. */
export function toPerGap(
  evaluator: Record<string, unknown>,
  gapText: string,
  activityId: string,
  issues: MigrationIssue[],
): Evaluator {
  const strategy = evaluator.strategy as string;
  const gapIds = [...gapText.matchAll(/\[(gap\d+)\]/g)].map((match) => match[1]!);
  const normalization =
    (evaluator.normalization as NormalizationRules | undefined) ?? DEFAULT_NORMALIZATION;

  if (strategy === "per_gap") {
    const gaps = evaluator.gaps as Array<{ gapId: string; answers: string[] }>;
    if (gaps.length !== gapIds.length) {
      issues.push({
        activityId,
        rule: "per-gap-marker-mismatch",
        detail: `${gapIds.length} marcadores frente a ${gaps.length} entradas en el evaluador.`,
      });
    }
    return { strategy: "per_gap", gaps, normalization };
  }

  const answers = (
    strategy === "one_of_texts"
      ? ((evaluator.answers as string[]) ?? [])
      : [evaluator.answer as string]
  ).filter((answer): answer is string => typeof answer === "string" && answer.length > 0);

  if (answers.length === 0) {
    issues.push({
      activityId,
      rule: "no-accepted-answer",
      detail: `La estrategia "${strategy}" no aporta ninguna respuesta de texto.`,
    });
  }

  if (gapIds.length > 1) {
    issues.push({
      activityId,
      rule: "single-answer-multi-gap",
      detail: `${gapIds.length} huecos con una sola respuesta; hay que desglosarla.`,
    });
  }

  return {
    strategy: "per_gap",
    gaps: [{ gapId: gapIds[0] ?? "gap1", answers }],
    normalization,
  };
}

/** Defectos que el codemod detecta pero no puede arreglar solo. */
function collectContentIssues(activity: Activity, issues: MigrationIssue[]): void {
  if (activity.options) {
    const texts = activity.options.map((option) => option.text.trim().toLowerCase());
    if (new Set(texts).size !== texts.length) {
      issues.push({
        activityId: activity.id,
        rule: "duplicate-option-text",
        detail: "Dos opciones comparten el mismo texto.",
      });
    }
  }

  if (activity.type === "error_correction") {
    const answer = primaryAnswer(activity.evaluator as unknown as Record<string, unknown>);
    const sourceText = activity.passage ?? activity.prompt;
    if (answer && looseEquals(answer, activity.prompt)) {
      issues.push({
        activityId: activity.id,
        rule: "answer-equals-prompt",
        detail: "La respuesta es idéntica al enunciado: no hay nada que transformar.",
      });
    } else if (answer && activity.passage && looseIncludes(sourceText, answer)) {
      issues.push({
        activityId: activity.id,
        rule: "answer-inside-passage",
        detail: "La respuesta aparece literal en el pasaje de partida.",
      });
    }
  }

  if (activity.type === "word_formation" && activity.cueWord) {
    const answer = primaryAnswer(activity.evaluator as unknown as Record<string, unknown>);
    if (answer && answer.trim().toLowerCase() === activity.cueWord.toLowerCase()) {
      issues.push({
        activityId: activity.id,
        rule: "word-formation-answer-equals-cue",
        detail: "La respuesta es la raíz sin derivar.",
      });
    }
  }
}

export function primaryAnswer(evaluator: Record<string, unknown>): string {
  if (typeof evaluator.answer === "string") return evaluator.answer;
  const answers = evaluator.answers as string[] | undefined;
  if (answers?.length) return answers[0]!;
  const gaps = evaluator.gaps as Array<{ answers: string[] }> | undefined;
  if (gaps?.length) return gaps[0]!.answers[0] ?? "";
  return "";
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function containsWord(haystack: string, needle: string): boolean {
  const escaped = needle.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped.replace(/\s+/g, "\\s+")}\\b`).test(haystack.toLowerCase());
}

function looseNormalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looseEquals(left: string, right: string): boolean {
  return looseNormalise(left) === looseNormalise(right);
}

function looseIncludes(haystack: string, needle: string): boolean {
  const normalisedNeedle = looseNormalise(needle);
  return normalisedNeedle.length > 0 && looseNormalise(haystack).includes(normalisedNeedle);
}
