import type { LessonDetailDto } from "@/core/models";

export const mockLessons: LessonDetailDto[] = [
  {
    id: "lesson-future-forms",
    level: "B1",
    category: "grammar",
    taxonomyNodeId: "grammar.verb-tenses.future.will-vs-going-to",
    title: "Future forms: will vs going to",
    summary:
      "Cuándo usar 'will' para decisiones espontáneas y predicciones, y 'going to' para planes ya decididos.",
    tags: ["future", "will", "going-to", "b1"],
    difficulty: 1,
    status: "new",
    explanation:
      "Usamos 'will' para decisiones que tomamos en el momento de hablar y para predicciones sin evidencia clara. Usamos 'going to' para planes o intenciones que ya hemos decidido antes, y para predicciones basadas en algo que vemos ahora.",
    examples: [
      {
        english: "I think it will rain later.",
        translationEs: "Creo que lloverá más tarde.",
      },
      {
        english: "I'm going to visit my parents this weekend.",
        translationEs: "Voy a visitar a mis padres este fin de semana.",
      },
      {
        english: "Look at those clouds! It's going to rain.",
        translationEs: "¡Mira esas nubes! Va a llover.",
      },
    ],
    commonMistakes: [
      "Usar 'will' para un plan que ya estaba decidido de antemano.",
      "Usar 'going to' para una decisión tomada en el mismo momento de hablar.",
    ],
    relatedActivityIds: ["activity-single-choice-future-forms"],
  },
  {
    id: "lesson-present-tenses",
    level: "B1",
    category: "grammar",
    taxonomyNodeId: "grammar.verb-tenses.present.continuous",
    title: "Present simple vs present continuous",
    summary:
      "Diferencia entre hábitos y hechos generales (present simple) y acciones en curso ahora mismo (present continuous).",
    tags: ["present-simple", "present-continuous", "b1"],
    difficulty: 1,
    status: "viewed",
    explanation:
      "El present simple describe hábitos, rutinas y hechos generales. El present continuous describe acciones que están ocurriendo en el momento de hablar o situaciones temporales.",
    examples: [
      {
        english: "She works in a hospital.",
        translationEs: "Ella trabaja en un hospital.",
      },
      {
        english: "She's working from home this week.",
        translationEs: "Está trabajando desde casa esta semana.",
      },
    ],
    commonMistakes: [
      "Usar present continuous con verbos de estado como 'know' o 'like'.",
      "Olvidar la 's' de la tercera persona en present simple.",
    ],
    relatedActivityIds: ["activity-true-false-present-simple"],
  },
  {
    id: "lesson-first-conditional",
    level: "B1",
    category: "grammar",
    taxonomyNodeId: "grammar.conditionals.first",
    title: "First conditional in context",
    summary:
      "Cómo hablar de situaciones futuras posibles y su consecuencia con 'if + present simple, will + infinitivo'.",
    tags: ["conditionals", "first-conditional", "b1"],
    difficulty: 2,
    status: "new",
    explanation:
      "El primer condicional describe una condición real o probable en el futuro y su consecuencia. La estructura es 'if + present simple, will + infinitivo sin to'.",
    examples: [
      {
        english: "If it rains, we will stay at home.",
        translationEs: "Si llueve, nos quedaremos en casa.",
      },
      {
        english: "If she studies hard, she will pass the exam.",
        translationEs: "Si estudia mucho, aprobará el examen.",
      },
    ],
    commonMistakes: [
      "Usar 'will' también en la parte del 'if'.",
      "Confundir el primer condicional con el segundo condicional.",
    ],
    relatedActivityIds: ["activity-error-correction-first-conditional"],
  },
  {
    id: "lesson-phrasal-verbs-daily-life",
    level: "B1",
    category: "phrasal_verbs",
    taxonomyNodeId: "phrasal-verbs.general",
    title: "Phrasal verbs for everyday life",
    summary:
      "Phrasal verbs frecuentes en conversaciones cotidianas: 'get up', 'look for', 'give up', 'run out of'.",
    tags: ["phrasal-verbs", "everyday", "b1"],
    difficulty: 2,
    status: "new",
    explanation:
      "Los phrasal verbs combinan un verbo con una partícula (preposición o adverbio) y cambian de significado respecto al verbo original. Es útil aprenderlos como bloques completos, no palabra por palabra.",
    examples: [
      {
        english: "I need to look for my keys.",
        translationEs: "Necesito buscar mis llaves.",
      },
      {
        english: "We ran out of milk this morning.",
        translationEs: "Se nos acabó la leche esta mañana.",
      },
    ],
    commonMistakes: [
      "Traducir el phrasal verb palabra por palabra en lugar de aprenderlo como un bloque.",
      "Cambiar la partícula por otra con significado distinto.",
    ],
    relatedActivityIds: ["activity-matching-phrasal-verbs"],
  },
  {
    id: "lesson-key-word-transformation-strategies",
    level: "B2",
    category: "use_of_english",
    taxonomyNodeId: "use-of-english.key-word-transformation",
    title: "Key word transformation strategies",
    summary:
      "Estrategias para reescribir una frase manteniendo el significado y usando obligatoriamente una palabra clave dada.",
    tags: ["use-of-english", "key-word-transformation", "b2"],
    difficulty: 3,
    status: "new",
    explanation:
      "En este tipo de ejercicio hay que reescribir la primera frase para que signifique lo mismo, usando la palabra clave sin cambiarla y sin añadir ni quitar palabras de más de lo permitido. Conviene identificar primero qué estructura gramatical exige la palabra clave.",
    examples: [
      {
        english: "It's been three years since I last saw her. → SEEN",
        translationEs:
          "Han pasado tres años desde la última vez que la vi. → SEEN",
      },
      {
        english: "I haven't seen her for three years.",
        translationEs: "No la he visto en tres años.",
      },
    ],
    commonMistakes: [
      "Cambiar la forma de la palabra clave, que debe usarse tal cual se da.",
      "Superar el número máximo de palabras permitido.",
    ],
    relatedActivityIds: [
      "activity-key-word-transformation-strategies",
      "activity-sentence-transformation-time-expressions",
    ],
  },
  {
    id: "lesson-second-conditional",
    level: "B2",
    category: "grammar",
    taxonomyNodeId: "grammar.conditionals.second",
    title: "Second conditional for hypothetical situations",
    summary:
      "Cómo hablar de situaciones hipotéticas o improbables en el presente/futuro con 'if + past simple, would + infinitivo'.",
    tags: ["conditionals", "second-conditional", "b2"],
    difficulty: 3,
    status: "new",
    explanation:
      "El segundo condicional describe situaciones hipotéticas, improbables o contrarias a la realidad actual. La estructura es 'if + past simple, would + infinitivo sin to'.",
    examples: [
      {
        english: "If I won the lottery, I would travel around the world.",
        translationEs: "Si ganara la lotería, viajaría por todo el mundo.",
      },
      {
        english: "If I were you, I would apply for that job.",
        translationEs: "Si yo fuera tú, solicitaría ese trabajo.",
      },
    ],
    commonMistakes: [
      "Usar 'will'/'would' en la parte del 'if'.",
      "Usar 'was' en lugar de 'were' en la forma hipotética con 'if I were you'.",
    ],
    relatedActivityIds: ["activity-word-order-second-conditional"],
  },
];
