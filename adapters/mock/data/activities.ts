import type { ActivityQuestionDto } from "@/core/models";

export const mockActivities: ActivityQuestionDto[] = [
  {
    id: "activity-true-false-present-simple",
    type: "true_false",
    level: "B1",
    taxonomyNodeId: "grammar.verb-tenses.present.simple",
    interactionMode: "swipe",
    statement: "She work in a hospital.",
    statements: [
      { id: "tf-present-1", statement: "She work in a hospital." },
      { id: "tf-present-2", statement: "They usually take the bus to work." },
      { id: "tf-present-3", statement: "He doesn't likes coffee." },
      { id: "tf-present-4", statement: "Water boils at 100°C." },
    ],
  },
  {
    id: "activity-single-choice-future-forms",
    type: "single_choice",
    level: "B1",
    taxonomyNodeId: "grammar.verb-tenses.future.will-vs-going-to",
    interactionMode: "standard",
    question: "Look at those clouds! It ___ rain.",
    options: [
      { id: "opt-will", label: "will" },
      { id: "opt-going-to", label: "is going to" },
      { id: "opt-present", label: "rains" },
    ],
  },
  {
    id: "activity-multiple-choice-travel-vocabulary",
    type: "multiple_choice",
    level: "B1",
    taxonomyNodeId: "vocabulary.lexical-fields.travel",
    interactionMode: "standard",
    question: "Which words are usually related to travelling by plane?",
    options: [
      { id: "opt-boarding-pass", label: "boarding pass" },
      { id: "opt-platform", label: "platform" },
      { id: "opt-luggage", label: "luggage" },
      { id: "opt-anchor", label: "anchor" },
    ],
  },
  {
    id: "activity-fill-blank-past-simple",
    type: "fill_blank",
    level: "B1",
    taxonomyNodeId: "grammar.verb-tenses.past.simple",
    interactionMode: "standard",
    textWithGap: "Yesterday, I ___ (go) to the cinema with my friends.",
  },
  {
    id: "activity-sentence-transformation-time-expressions",
    type: "sentence_transformation",
    level: "B2",
    taxonomyNodeId: "use-of-english.key-word-transformation",
    interactionMode: "sentence_builder",
    originalSentence: "I haven't seen her for three years.",
    instructionHint: "Rewrite using 'It's been...'.",
    wordBank: [
      "It's",
      "been",
      "three",
      "years",
      "since",
      "I",
      "last",
      "saw",
      "her",
    ],
  },
  {
    id: "activity-error-correction-first-conditional",
    type: "error_correction",
    level: "B1",
    taxonomyNodeId: "grammar.conditionals.first",
    interactionMode: "standard",
    sentenceWithError: "If it will rain, we will stay at home.",
  },
  {
    id: "activity-word-formation-general",
    type: "word_formation",
    level: "B2",
    taxonomyNodeId: "word-formation.general",
    interactionMode: "standard",
    sentenceWithGap: "The meeting was a complete ___ (SUCCEED).",
    baseWord: "SUCCEED",
  },
  {
    id: "activity-open-cloze-general",
    type: "open_cloze",
    level: "B2",
    taxonomyNodeId: "use-of-english.open-cloze",
    interactionMode: "standard",
    textWithGaps:
      "I have been living in this city ___ (1) five years, and I still enjoy ___ (2) here.",
    gapCount: 2,
  },
  {
    id: "activity-key-word-transformation-strategies",
    type: "key_word_transformation",
    level: "B2",
    taxonomyNodeId: "use-of-english.key-word-transformation",
    interactionMode: "standard",
    firstSentence: "The last time I saw her was three years ago.",
    keyword: "SEEN",
    secondSentenceStart: "I haven't",
  },
  {
    id: "activity-matching-phrasal-verbs",
    type: "matching",
    level: "B1",
    taxonomyNodeId: "phrasal-verbs.general",
    interactionMode: "matching_pairs",
    leftItems: [
      { id: "left-give-up", label: "give up" },
      { id: "left-look-for", label: "look for" },
      { id: "left-run-out-of", label: "run out of" },
    ],
    rightItems: [
      { id: "right-stop-doing", label: "to stop doing something" },
      { id: "right-search", label: "to search for something" },
      { id: "right-have-none-left", label: "to have none left" },
    ],
  },
  {
    id: "activity-word-order-second-conditional",
    type: "word_order",
    level: "B2",
    taxonomyNodeId: "grammar.conditionals.second",
    interactionMode: "drag_drop",
    shuffledWords: [
      "would",
      "I",
      "won",
      "if",
      "I",
      "travel",
      "the",
      "lottery",
    ],
  },
  {
    id: "activity-rewrite-sentence-prepositions",
    type: "rewrite_sentence",
    level: "B2",
    taxonomyNodeId: "prepositions.general",
    interactionMode: "standard",
    originalSentence: "She is responsible of the whole project.",
    constraintHint: "Correct the preposition without changing anything else.",
  },
  {
    id: "activity-complete-dialogue-work-vocabulary",
    type: "complete_dialogue",
    level: "B1",
    taxonomyNodeId: "vocabulary.lexical-fields.work",
    interactionMode: "standard",
    dialogueLines: [
      { speaker: "A", text: "What do you do for a living?", hasGap: false },
      { speaker: "B", text: "I ___ as a graphic designer.", hasGap: true },
      { speaker: "A", text: "Do you enjoy it?", hasGap: false },
      { speaker: "B", text: "Yes, I really ___ it.", hasGap: true },
    ],
  },
  {
    id: "activity-complete-paragraph-reading",
    type: "complete_paragraph",
    level: "B2",
    taxonomyNodeId: "reading.general",
    interactionMode: "standard",
    paragraphWithGaps:
      "Reading regularly in English helps you ___ (1) your vocabulary and understand grammar patterns in ___ (2).",
    gapCount: 2,
  },
];

interface MockAnswerKeyEntry {
  correctAnswer: string | string[];
  explanation: string;
}

/**
 * Claves de corrección internas del adapter mock. Nunca se exponen a través
 * de `LearningContentPort`; solo las usa el "grader" mock al evaluar intentos.
 */
export const mockActivityAnswerKeys: Record<string, MockAnswerKeyEntry> = {
  "activity-true-false-present-simple": {
    correctAnswer: ["false", "true", "false", "true"],
    explanation:
      "En present simple recuerda la -s de tercera persona y usa el infinitivo después de doesn't.",
  },
  "activity-single-choice-future-forms": {
    correctAnswer: "opt-going-to",
    explanation:
      "Usamos 'going to' para una predicción basada en algo que vemos ahora mismo (las nubes).",
  },
  "activity-multiple-choice-travel-vocabulary": {
    correctAnswer: ["opt-boarding-pass", "opt-luggage"],
    explanation:
      "'Boarding pass' y 'luggage' son términos habituales en viajes en avión; 'platform' es de tren y 'anchor' es de barco.",
  },
  "activity-fill-blank-past-simple": {
    correctAnswer: "went",
    explanation: "'Go' es irregular: su forma de pasado simple es 'went'.",
  },
  "activity-sentence-transformation-time-expressions": {
    correctAnswer: "It's been three years since I last saw her.",
    explanation:
      "'It's been + periodo + since + pasado simple' expresa lo mismo que 'haven't + participio + for + periodo'.",
  },
  "activity-error-correction-first-conditional": {
    correctAnswer: "If it rains, we will stay at home.",
    explanation:
      "En el primer condicional, la parte del 'if' va en present simple, nunca con 'will'.",
  },
  "activity-word-formation-general": {
    correctAnswer: "success",
    explanation: "El sustantivo derivado de 'succeed' es 'success'.",
  },
  "activity-open-cloze-general": {
    correctAnswer: ["for", "living"],
    explanation:
      "'For' se usa con periodos de tiempo; 'living' completa la expresión 'enjoy living here'.",
  },
  "activity-key-word-transformation-strategies": {
    correctAnswer: "I haven't seen her for three years.",
    explanation:
      "'Haven't seen ... for' expresa la misma idea que 'The last time I saw her was ... ago'.",
  },
  "activity-matching-phrasal-verbs": {
    correctAnswer: [
      "left-give-up:right-stop-doing",
      "left-look-for:right-search",
      "left-run-out-of:right-have-none-left",
    ],
    explanation:
      "'Give up' = dejar de hacer algo; 'look for' = buscar; 'run out of' = quedarse sin algo.",
  },
  "activity-word-order-second-conditional": {
    correctAnswer: "If I won the lottery, I would travel the world.",
    explanation:
      "Segundo condicional: 'if + past simple, would + infinitivo sin to'.",
  },
  "activity-rewrite-sentence-prepositions": {
    correctAnswer: "She is responsible for the whole project.",
    explanation: "La expresión correcta es 'responsible for', no 'responsible of'.",
  },
  "activity-complete-dialogue-work-vocabulary": {
    correctAnswer: ["work", "enjoy"],
    explanation:
      "'Work as' describe una profesión; 'enjoy' se usa para expresar que algo te gusta hacer.",
  },
  "activity-complete-paragraph-reading": {
    correctAnswer: ["improve", "context"],
    explanation:
      "'Improve your vocabulary' es la colocación habitual; 'in context' describe cómo se entienden las palabras al leer.",
  },
};
