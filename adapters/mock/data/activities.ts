import type { ActivityQuestionDto } from "@/core/models";

/**
 * Catálogo mock, una actividad por familia de presentación. Sirve para
 * desarrollar la interfaz sin base de datos, así que cubre las nueve familias
 * con la misma forma que produce el mapper real.
 */
export const mockActivities: ActivityQuestionDto[] = [
  {
    id: "activity-true-false-present-simple",
    type: "true_false",
    skillFocus: "true_false",
    presentation: "true_false",
    level: "B1",
    taxonomyNodeId: "grammar.verb-tenses.present.simple",
    instructions: "Decide whether the statement is correct.",
    statement: "She work in a hospital.",
  },
  {
    id: "activity-swipe-deck-present-simple",
    type: "swipe_deck",
    skillFocus: "swipe_deck",
    presentation: "swipe_deck",
    level: "B1",
    taxonomyNodeId: "grammar.verb-tenses.present.simple",
    instructions: "Swipe right if the sentence is correct.",
    cards: [
      { id: "tf-present-1", statement: "She work in a hospital." },
      { id: "tf-present-2", statement: "They usually take the bus to work." },
      { id: "tf-present-3", statement: "He doesn't likes coffee." },
      { id: "tf-present-4", statement: "Water boils at 100°C." },
      { id: "tf-present-5", statement: "My brother live in Girona." },
    ],
  },
  {
    id: "activity-single-choice-future-forms",
    type: "single_choice",
    skillFocus: "single_choice",
    presentation: "choice",
    level: "B1",
    taxonomyNodeId: "grammar.verb-tenses.future.will-vs-going-to",
    instructions: "Choose the correct future form.",
    question: "Look at those clouds! It ___ rain.",
    selection: "single",
    options: [
      { id: "opt-will", label: "will" },
      { id: "opt-going-to", label: "is going to" },
      { id: "opt-present", label: "rains" },
    ],
  },
  {
    id: "activity-multiple-choice-travel-vocabulary",
    type: "multiple_choice",
    skillFocus: "multiple_select",
    presentation: "choice",
    level: "B1",
    taxonomyNodeId: "vocabulary.lexical-fields.travel",
    instructions: "Select all the words related to air travel.",
    question: "Which words are usually related to travelling by plane?",
    selection: "multiple",
    options: [
      { id: "opt-boarding-pass", label: "boarding pass" },
      { id: "opt-platform", label: "platform" },
      { id: "opt-luggage", label: "luggage" },
      { id: "opt-anchor", label: "anchor" },
    ],
  },
  {
    id: "activity-gap-fill-past-simple",
    type: "gap_fill",
    skillFocus: "fill_blank",
    presentation: "gap_fill",
    level: "B1",
    taxonomyNodeId: "grammar.verb-tenses.past.simple",
    instructions: "Complete the sentence with the past simple.",
    layout: "sentence",
    gapIds: ["gap1"],
    segments: [
      { kind: "text", value: "Yesterday, I " },
      { kind: "gap", gapId: "gap1", position: 1 },
      { kind: "text", value: " (go) to the cinema with my friends." },
    ],
  },
  {
    id: "activity-gap-fill-dialogue-requests",
    type: "gap_fill",
    skillFocus: "complete_dialogue",
    presentation: "gap_fill",
    level: "B1",
    taxonomyNodeId: "use-of-english.fixed-expressions",
    instructions: "Complete the dialogue with a natural reply.",
    layout: "dialogue",
    gapIds: ["gap1"],
    segments: [
      { kind: "speaker", label: "A" },
      { kind: "text", value: "Can you swim?" },
      { kind: "break" },
      { kind: "speaker", label: "B" },
      { kind: "text", value: "Yes, " },
      { kind: "gap", gapId: "gap1", position: 1 },
      { kind: "text", value: "." },
    ],
  },
  {
    id: "activity-word-formation-general",
    type: "word_formation",
    skillFocus: "word_formation",
    presentation: "gap_fill",
    level: "B2",
    taxonomyNodeId: "use-of-english.word-formation",
    instructions: "Complete the sentence with the correct form of the word.",
    layout: "sentence",
    cueWord: "SUCCEED",
    gapIds: ["gap1"],
    segments: [
      { kind: "text", value: "The launch was a complete " },
      { kind: "gap", gapId: "gap1", position: 1 },
      { kind: "text", value: "." },
    ],
  },
  {
    id: "activity-key-word-transformation-time",
    type: "key_word_transformation",
    skillFocus: "key_word_transformation",
    presentation: "key_word_transformation",
    level: "B2",
    taxonomyNodeId: "use-of-english.key-word-transformation",
    instructions: "Complete the second sentence using the key word.",
    firstSentence: "I haven't seen her for three years.",
    keyWord: "SINCE",
    maxWords: 5,
    gapIds: ["gap1"],
    segments: [
      { kind: "text", value: "It's been three years " },
      { kind: "gap", gapId: "gap1", position: 1 },
      { kind: "text", value: " her." },
    ],
  },
  {
    id: "activity-error-correction-first-conditional",
    type: "error_correction",
    skillFocus: "error_correction",
    presentation: "free_text",
    level: "B1",
    taxonomyNodeId: "grammar.conditionals.first",
    instructions: "Rewrite the sentence correctly.",
    prompt: "If it will rain, we will stay at home.",
    constraintHint: "Rewrite the sentence correctly.",
  },
  {
    id: "activity-matching-phrasal-verbs",
    type: "matching",
    skillFocus: "matching",
    presentation: "matching",
    level: "B1",
    taxonomyNodeId: "vocabulary.phrasal-verbs.daily-routines",
    instructions: "Match each phrasal verb with its meaning.",
    leftItems: [
      { id: "left-get-up", label: "get up" },
      { id: "left-put-off", label: "put off" },
      { id: "left-look-after", label: "look after" },
      { id: "left-give-up", label: "give up" },
    ],
    rightItems: [
      { id: "right-postpone", label: "postpone" },
      { id: "right-take-care", label: "take care of" },
      { id: "right-leave-bed", label: "leave your bed" },
      { id: "right-stop", label: "stop doing something" },
    ],
  },
  {
    id: "activity-word-order-relative-clauses",
    type: "word_order",
    skillFocus: "word_order",
    presentation: "word_order",
    level: "B2",
    taxonomyNodeId: "grammar.relative-clauses.defining",
    instructions: "Put the fragments in the correct order.",
    tokens: [
      { id: "tok-lives", text: "lives" },
      { id: "tok-the-woman", text: "The woman" },
      { id: "tok-next-door", text: "next door" },
      { id: "tok-who", text: "who" },
      { id: "tok-is-a-vet", text: "is a vet." },
    ],
  },
  {
    id: "activity-guided-writing-formal-email",
    type: "guided_writing",
    skillFocus: "guided_writing",
    presentation: "free_text",
    level: "B2",
    taxonomyNodeId: "guided-writing.formal-email",
    instructions: "Write a formal opening for an enquiry about a course.",
    prompt: "Write a formal opening for an enquiry about a course.",
  },
  {
    id: "activity-sentence-rewrite-third-conditional",
    type: "sentence_rewrite",
    skillFocus: "sentence_transformation",
    presentation: "free_text",
    level: "B2",
    taxonomyNodeId: "grammar.conditionals.third",
    instructions: "Rewrite using the third conditional.",
    prompt: "We did not reserve seats, so we could not sit together.",
    constraintHint: "Rewrite using the third conditional.",
  },
  {
    id: "activity-mini-game-phrasal-verbs",
    type: "mini_game",
    skillFocus: "mini_game",
    presentation: "mini_game",
    level: "B1",
    taxonomyNodeId: "vocabulary.phrasal-verbs.daily-routines",
    instructions: "Help the frog cross the river by choosing the right meaning.",
    game: "frog_leap",
    rounds: [
      {
        id: "round-1",
        prompt: "Which one means «to leave your bed»?",
        options: [
          { id: "r1-a", label: "get up" },
          { id: "r1-b", label: "get over" },
          { id: "r1-c", label: "get by" },
        ],
      },
      {
        id: "round-2",
        prompt: "Which one means «to postpone»?",
        options: [
          { id: "r2-a", label: "put on" },
          { id: "r2-b", label: "put off" },
          { id: "r2-c", label: "put up" },
        ],
      },
      {
        id: "round-3",
        prompt: "Which one means «to take care of»?",
        options: [
          { id: "r3-a", label: "look for" },
          { id: "r3-b", label: "look up" },
          { id: "r3-c", label: "look after" },
        ],
      },
      {
        id: "round-4",
        prompt: "Which one means «to stop doing something»?",
        options: [
          { id: "r4-a", label: "give up" },
          { id: "r4-b", label: "give away" },
          { id: "r4-c", label: "give back" },
        ],
      },
      {
        id: "round-5",
        prompt: "Which one means «to continue»?",
        options: [
          { id: "r5-a", label: "carry out" },
          { id: "r5-b", label: "carry on" },
          { id: "r5-c", label: "carry off" },
        ],
      },
    ],
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
    correctAnswer: "false",
    explanation:
      "En present simple recuerda la -s de tercera persona: «She works in a hospital».",
  },
  "activity-swipe-deck-present-simple": {
    correctAnswer: ["false", "true", "false", "true", "false"],
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
  "activity-gap-fill-past-simple": {
    correctAnswer: "went",
    explanation: "'Go' es irregular: su forma de pasado simple es 'went'.",
  },
  "activity-gap-fill-dialogue-requests": {
    correctAnswer: "I can",
    explanation: "La respuesta corta afirmativa repite el modal: «Yes, I can».",
  },
  "activity-word-formation-general": {
    correctAnswer: "success",
    explanation: "El sustantivo derivado de 'succeed' es 'success'.",
  },
  "activity-key-word-transformation-time": {
    correctAnswer: "since I last saw",
    explanation:
      "'It's been + periodo + since + pasado simple' expresa lo mismo que 'haven't + participio + for + periodo'.",
  },
  "activity-error-correction-first-conditional": {
    correctAnswer: "If it rains, we will stay at home.",
    explanation:
      "En el primer condicional, la parte del 'if' va en present simple, nunca con 'will'.",
  },
  "activity-matching-phrasal-verbs": {
    correctAnswer: [
      "left-get-up:right-leave-bed",
      "left-give-up:right-stop",
      "left-look-after:right-take-care",
      "left-put-off:right-postpone",
    ],
    explanation: "Cada phrasal verb tiene un único significado en esta lista.",
  },
  "activity-word-order-relative-clauses": {
    correctAnswer: ["tok-the-woman", "tok-who", "tok-lives", "tok-next-door", "tok-is-a-vet"],
    explanation:
      "La oración de relativo va justo detrás del sustantivo al que se refiere.",
  },
  "activity-guided-writing-formal-email": {
    correctAnswer: "I am writing to enquire about the course",
    explanation: "Esta fórmula plantea el motivo del correo de forma directa y cortés.",
  },
  "activity-sentence-rewrite-third-conditional": {
    correctAnswer: "If we had reserved seats, we would have sat together.",
    explanation:
      "La tercera condicional usa 'if + past perfect' y 'would have + participio'.",
  },
  "activity-mini-game-phrasal-verbs": {
    correctAnswer: ["r1-a", "r2-b", "r3-c", "r4-a", "r5-b"],
    explanation:
      "Cada ronda practica un phrasal verb frecuente con la partícula que cambia su significado.",
  },
};
