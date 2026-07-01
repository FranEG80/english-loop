
# EnglishLoop

SaaS personal para aprender, refrescar y recordar inglés de nivel B1 y B2 mediante lecciones cortas, práctica escrita y repaso inteligente.

La app está pensada para una persona que quiere volver a activar su inglés B1, avanzar hacia B2 y mantenerlo fresco a largo plazo sin usar voz ni audios. Todo el aprendizaje estará centrado en lectura, escritura, gramática, vocabulario, Use of English, phrasal verbs, collocations, writing y ejercicios interactivos.

⸻

## Idea principal

EnglishLoop no será solo una biblioteca de lecciones y actividades.

La experiencia principal será un flujo diario guiado:

Entrar en la app
↓
Ver una lección recomendada
↓
Leer la lección
↓
Pasar a la siguiente lección o ir a practicar
↓
Hacer actividades relacionadas con las lecciones vistas
↓
Corregir errores con explicación
↓
Guardar progreso
↓
Repetir y reforzar en próximos días

El objetivo es que al abrir la app no haya que pensar demasiado qué estudiar. La app debe proponer una lección útil y después generar actividades relacionadas con lo que se acaba de ver.

⸻

## Objetivos del proyecto

* Refrescar nivel B1.
* Aprender y consolidar nivel B2.
* Practicar únicamente mediante ejercicios escritos.
* Tener lecciones claras de todos los puntos importantes de B1 y B2.
* Crear un dataset muy grande de actividades con respuestas y explicaciones.
* Relacionar actividades con lecciones.
* Guardar progreso por nivel, tema y tipo de ejercicio.
* Repetir errores mediante un sistema de repaso.
* Permitir elegir en settings si trabajar B1, B2 o ambos.
* Tener una rutina diaria sencilla y automática.

⸻

## Stack técnico

* Next.js
* React
* TypeScript
* TailwindCSS
* App Router
* LocalStorage para MVP
* Base de datos opcional en el futuro
    * SQLite **
    * Turso
    * PostgreSQL
* ORM opcional
    * Prisma **
    * Drizzle
* Formato de contenido
    * JSON
    * TypeScript data files
    * MDX para lecciones largas, si hace falta

⸻

## Filosofía de la app

La app debe funcionar como un entrenador diario de inglés escrito.

Debe tener una home que sea una landing page. un login y un register. 

Los usuarios guardarán su progreso, su elección de dificultad y demás

No debería ser una simple lista de temas.

La experiencia deseada es:

No me hagas decidir siempre qué estudiar.
Enséñame una lección útil.
Dame otra si quiero seguir leyendo.
Cuando pulse practicar, ponme ejercicios relacionados.
Si fallo, explícame por qué.
Mañana hazme repasar lo que fallé.

⸻

## Funcionalidades principales

### Daily Loop

El Daily Loop será la experiencia principal de la app.

Al entrar en la aplicación, se mostrará una lección recomendada de cualquier categoría:

* Gramática.
* Vocabulario.
* Use of English.
* Phrasal verbs.
* Collocations.
* Prepositions.
* Word formation.
* Writing.
* Reading.

El usuario podrá:

* Leer la lección actual.
* Pasar a la siguiente lección.
* Ir a las actividades del día.
* Ver la lección completa en detalle.
* Saltar una lección si no le interesa.
* Guardar una lección para repasar más tarde.

⸻

### Flujo diario deseado

Home
↓
Daily Lesson
↓
Next Lesson / Go to Practice
↓
Daily Practice
↓
Correction
↓
Summary

#### Paso 1: Home

La home debe mostrar el estado del día:

* Nivel activo.
* Racha.
* Lección recomendada.
* Progreso diario.
* Botón para continuar.
* Accesos rápidos a lecciones, actividades y repaso.

Ejemplo:

Today’s Loop
Nivel activo: B1 + B2
Lección recomendada:
Future forms: will vs going to
[Empezar lección]
Accesos rápidos:
[Lecciones] [Actividades] [Repasar errores] [Settings]

⸻

#### Paso 2: Lección recomendada

Al entrar, la app muestra una lección corta.

La lección debe ser clara, práctica y fácil de leer.

Cada lección tendrá:

* Título.
* Nivel.
* Categoría.
* Explicación en español.
* Ejemplos en inglés.
* Errores comunes.
* Mini resumen.
* Actividades relacionadas.
* Tags.
* Dificultad.

Ejemplo de botones:

[Anterior] [Siguiente lección] [Practicar lo visto]

También puede haber:

[Guardar para repasar]
[Ver explicación completa]
[Saltar esta lección]

⸻

#### Paso 3: Siguiente lección

El botón Siguiente lección debe mostrar otra lección recomendada.

La recomendación puede basarse en:

* Nivel elegido en settings.
* Lecciones no vistas.
* Lecciones relacionadas con errores anteriores.
* Temas que hace tiempo no se repasan.
* Temas necesarios para avanzar.
* Mezcla entre B1 y B2, si el usuario tiene ambos activos.

Ejemplo:

Lección 1:
Future forms: will vs going to
Lección 2:
Future time clauses
Lección 3:
First conditional

Estas lecciones están relacionadas, así que después las actividades tendrán sentido.

⸻

#### Paso 4: Actividades del día

Cuando el usuario pulsa Practicar lo visto, la app genera actividades relacionadas con las lecciones vistas en esa sesión.

Ejemplo:

Lecciones vistas hoy:
- Future forms
- Future time clauses
- First conditional
Actividades generadas:
- 5 actividades de future forms
- 4 actividades de first conditional
- 3 actividades de time clauses
- 2 actividades de errores anteriores
- 1 actividad random de mantenimiento

La idea es que la práctica no sea aleatoria, sino conectada con lo que acaba de estudiar.

⸻

#### Paso 5: Corrección y explicación

Cada actividad debe corregirse con feedback inmediato.

Después de responder, la app muestra:

* Si la respuesta es correcta o incorrecta.
* Respuesta correcta.
* Explicación.
* Ejemplo adicional.
* Link a la lección relacionada.
* Botón para continuar.
* Botón para marcar como difícil.

Ejemplo:

Tu respuesta: will going
Respuesta correcta: will go
Explicación:
Usamos "will" + infinitivo sin "to" para predicciones u opiniones sobre el futuro.
La forma correcta es "will go", no "will going".

⸻

#### Paso 6: Resumen del día

Al terminar la sesión diaria, la app muestra un resumen.

Debe incluir:

* Lecciones vistas.
* Actividades completadas.
* Porcentaje de acierto.
* Temas fuertes.
* Temas débiles.
* Errores importantes.
* Próximo repaso recomendado.

Ejemplo:

Today’s Summary
Lecciones vistas: 3
Actividades completadas: 15
Aciertos: 11
Fallos: 4
Tema fuerte:
- Future forms
Tema débil:
- First conditional
Recomendación:
Mañana repasar first conditional y time clauses.

⸻

## Modos de uso

La app tendrá dos modos principales.

1. Modo guiado

Es el modo principal.

El usuario entra y la app le dice qué hacer:

Lección recomendada → Actividades relacionadas → Resumen → Repaso futuro

Este modo vive principalmente en:

/daily

⸻

2. Modo biblioteca

Aunque el flujo diario sea el principal, el usuario también podrá acceder libremente a todo el contenido.

Secciones disponibles:

/lessons
/activities
/review
/dashboard
/settings

Desde estas secciones se podrá buscar contenido manualmente.

⸻

## Arquitectura

### Rutas principales

/
├── daily
│   ├── lesson
│   ├── practice
│   └── summary
├── lessons
│   └── [lessonId]
├── activities
│   └── [activityId]
├── review
├── dashboard
└── settings

⸻

### Estructura Next.js propuesta

app/
├── page.tsx
├── layout.tsx
│
├── daily/
│   ├── page.tsx
│   ├── lesson/
│   │   └── page.tsx
│   ├── practice/
│   │   └── page.tsx
│   └── summary/
│       └── page.tsx
│
├── lessons/
│   ├── page.tsx
│   └── [lessonId]/
│       └── page.tsx
│
├── activities/
│   ├── page.tsx
│   └── [activityId]/
│       └── page.tsx
│
├── review/
│   └── page.tsx
│
├── dashboard/
│   └── page.tsx
│
└── settings/
    └── page.tsx

⸻

### Estructura de carpetas deseada

EnglishLoop/
├── app/
├── components/
│   ├── activities/
│   ├── daily/
│   ├── lessons/
│   ├── progress/
│   ├── settings/
│   └── ui/
│
├── data/
│   ├── lessons/
│   │   ├── b1/
│   │   └── b2/
│   ├── activities/
│   │   ├── b1/
│   │   └── b2/
│   ├── vocabulary/
│   ├── phrasal-verbs/
│   ├── collocations/
│   └── topics.ts
│
├── lib/
│   ├── activities/
│   ├── daily/
│   ├── lessons/
│   ├── progress/
│   ├── review/
│   └── settings/
│
├── types/
│   ├── activity.ts
│   ├── lesson.ts
│   ├── daily-session.ts
│   ├── progress.ts
│   └── settings.ts
│
├── public/
├── README.md
├── package.json
├── tailwind.config.ts
└── next.config.ts

⸻

### Componentes principales

components/
├── daily/
│   ├── DailyStartCard.tsx
│   ├── DailyLessonView.tsx
│   ├── DailyPracticeView.tsx
│   ├── DailySummary.tsx
│   └── NextLessonButton.tsx
│
├── lessons/
│   ├── LessonCard.tsx
│   ├── LessonContent.tsx
│   ├── LessonExamples.tsx
│   ├── CommonMistakes.tsx
│   └── RelatedActivities.tsx
│
├── activities/
│   ├── ActivityRenderer.tsx
│   ├── TrueFalseActivity.tsx
│   ├── MultipleChoiceActivity.tsx
│   ├── SingleChoiceActivity.tsx
│   ├── FillBlankActivity.tsx
│   ├── SentenceTransformationActivity.tsx
│   ├── ErrorCorrectionActivity.tsx
│   ├── WordFormationActivity.tsx
│   ├── OpenClozeActivity.tsx
│   ├── MatchingActivity.tsx
│   └── WritingPromptActivity.tsx
│
├── progress/
│   ├── ProgressOverview.tsx
│   ├── WeakTopics.tsx
│   ├── AccuracyCard.tsx
│   └── ReviewQueue.tsx
│
└── settings/
    ├── LevelSelector.tsx
    ├── DailyGoalSelector.tsx
    └── PreferencesForm.tsx

⸻

### Tipos principales

#### Settings

export type LevelMode = 'B1' | 'B2' | 'B1_B2'
export type UserSettings = {
  levelMode: LevelMode
  dailyLessonCount: number
  dailyActivityCount: number
  showTranslations: boolean
  showExplanationAfterAnswer: boolean
  strictMode: boolean
  includeReviewActivities: boolean
}

⸻

#### Lesson

export type LessonLevel = 'B1' | 'B2'
export type LessonCategory =
  | 'grammar'
  | 'vocabulary'
  | 'use_of_english'
  | 'phrasal_verbs'
  | 'collocations'
  | 'prepositions'
  | 'word_formation'
  | 'writing'
  | 'reading'
  | 'connectors'
export type Lesson = {
  id: string
  title: string
  level: LessonLevel
  category: LessonCategory
  topic: string
  subtopic?: string
  difficulty: 1 | 2 | 3 | 4 | 5
  summary: string
  content: string
  examples: LessonExample[]
  commonMistakes: CommonMistake[]
  relatedActivityIds: string[]
  tags: string[]
  estimatedMinutes: number
  status: 'draft' | 'reviewed' | 'published'
}
export type LessonExample = {
  sentence: string
  translation?: string
  note?: string
}
export type CommonMistake = {
  wrong: string
  correct: string
  explanation: string
}

⸻

#### Activity

export type ActivityLevel = 'B1' | 'B2'
export type ActivityType =
  | 'true_false'
  | 'multiple_choice'
  | 'single_choice'
  | 'fill_blank'
  | 'sentence_transformation'
  | 'error_correction'
  | 'word_formation'
  | 'open_cloze'
  | 'key_word_transformation'
  | 'matching'
  | 'word_order'
  | 'rewrite_sentence'
  | 'complete_dialogue'
  | 'complete_paragraph'
  | 'vocabulary_in_context'
  | 'phrasal_verb_meaning'
  | 'collocation_choice'
  | 'preposition_choice'
  | 'mini_writing'
  | 'reading_comprehension'
export type Activity = {
  id: string
  level: ActivityLevel
  type: ActivityType
  topic: string
  subtopic?: string
  difficulty: 1 | 2 | 3 | 4 | 5
  prompt: string
  options?: string[]
  correctAnswer: string | string[]
  acceptedAnswers?: string[]
  explanation: string
  examples?: string[]
  lessonIds: string[]
  tags: string[]
  estimatedMinutes: number
  status: 'draft' | 'reviewed' | 'published'
}

⸻

#### Daily Session

export type DailySessionStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
export type DailySession = {
  id: string
  date: string
  levelMode: 'B1' | 'B2' | 'B1_B2'
  lessonIds: string[]
  activityIds: string[]
  completedLessonIds: string[]
  completedActivityIds: string[]
  skippedLessonIds: string[]
  status: DailySessionStatus
  startedAt?: string
  completedAt?: string
}

⸻

#### Progress

export type UserActivityProgress = {
  activityId: string
  attempts: number
  correctAttempts: number
  wrongAttempts: number
  lastAttemptAt?: string
  nextReviewAt?: string
  confidence: 1 | 2 | 3 | 4 | 5
  isMarkedAsDifficult: boolean
}
export type UserLessonProgress = {
  lessonId: string
  timesViewed: number
  completedAt?: string
  lastViewedAt?: string
  isSavedForLater: boolean
  confidence: 1 | 2 | 3 | 4 | 5
}

⸻

## Reglas de generación del Daily Loop

La sesión diaria debe mezclar contenido nuevo, contenido relacionado y repaso.

Regla inicial recomendada:

60% actividades relacionadas con las lecciones vistas hoy
25% actividades basadas en errores anteriores
15% actividades aleatorias de mantenimiento

Ejemplo:

Lecciones vistas:
- Passive voice
- Modal verbs
Actividades:
- 6 passive voice
- 5 modal verbs
- 3 errores anteriores
- 2 vocabulario random

⸻

## Función conceptual para generar sesión diaria

type GenerateDailySessionInput = {
  settings: UserSettings
  allLessons: Lesson[]
  allActivities: Activity[]
  lessonProgress: UserLessonProgress[]
  activityProgress: UserActivityProgress[]
}
export function generateDailySession(input: GenerateDailySessionInput): DailySession {
  // 1. Filtrar lecciones por nivel activo.
  // 2. Priorizar lecciones no vistas.
  // 3. Añadir lecciones relacionadas con errores anteriores.
  // 4. Crear lista de lecciones del día.
  // 5. Buscar actividades relacionadas con esas lecciones.
  // 6. Añadir actividades de errores anteriores.
  // 7. Añadir actividades random de mantenimiento.
  // 8. Mezclar dificultad.
  // 9. Devolver sesión diaria.
}

⸻

## Recomendador de lecciones

La app debería puntuar las lecciones candidatas.

Criterios:

* Nivel activo.
* Si la lección no se ha visto nunca.
* Si pertenece a un tema débil.
* Si está relacionada con errores recientes.
* Si hace mucho que no se revisa.
* Si pertenece al siguiente bloque lógico del temario.
* Si el usuario la guardó para más tarde.

Ejemplo de scoring:

function getLessonScore(lesson: Lesson) {
  let score = 0
  if (lessonHasNeverBeenSeen(lesson.id)) score += 30
  if (lessonBelongsToWeakTopic(lesson.topic)) score += 25
  if (lessonWasSavedForLater(lesson.id)) score += 20
  if (lessonWasNotReviewedRecently(lesson.id)) score += 15
  if (lesson.difficulty <= 3) score += 5
  return score
}

⸻

## Tipos de actividades

La app debe soportar varios tipos de ejercicios escritos.

### True / False

El usuario decide si una frase es verdadera o falsa.

Ejemplo:

"Will" is often used for spontaneous decisions.
True / False

⸻

### Single choice

Una sola respuesta correcta.

I think it ___ tomorrow.
A. rains
B. is raining
C. will rain
D. has rained

⸻

### Multiple choice

Varias respuestas pueden ser correctas.

Select all correct future forms:
A. I will call you later.
B. I going to call you later.
C. I am meeting John tomorrow.
D. The train leaves at 8.

⸻

### Fill in the blank

El usuario completa huecos.

If I ___ more time, I would travel more.
Answer: had

⸻

### Sentence transformation

El usuario transforma una frase.

Rewrite in passive voice:
Someone stole my bike yesterday.
Answer:
My bike was stolen yesterday.

⸻

### Key word transformation

Ejercicio típico de Use of English.

Complete the second sentence using the word given.
Do not change the word.
I regret not studying harder.
WISH
I ___ harder.
Answer:
I wish I had studied harder.

⸻

### Error correction

El usuario corrige una frase incorrecta.

Incorrect:
She suggested to go to the cinema.
Correct:
She suggested going to the cinema.

⸻

### Word formation

El usuario transforma una palabra.

The city has changed a lot because of new ___.
DEVELOP
Answer:
development

⸻

### Open cloze

El usuario completa huecos sin opciones.

I have lived here ___ 2020.
Answer:
since

⸻

### Matching

El usuario une conceptos.

Match the phrasal verb with its meaning:
give up → stop doing something
look after → take care of
run out of → have no more left

⸻

### Word order

### El usuario ordena palabras.

Order the sentence:
never / I / have / been / to London
Answer:
I have never been to London.

⸻

### Dataset deseado

El proyecto debería tener un dataset muy grande, revisado y bien organizado.

Objetivo a largo plazo:

10.000+ actividades
100+ lecciones
B1 completo
B2 completo
Use of English completo
Writing prompts
Reading texts
Repaso inteligente

Ejemplos de volumen por tema:

300 actividades de cada tiempo verbal
300 actividades de future forms
300 actividades de conditionals
300 actividades de passive voice
300 actividades de reported speech
300 actividades de modal verbs
300 actividades de phrasal verbs
300 actividades de collocations
300 actividades de prepositions
300 actividades de word formation
300 actividades de connectors
300 actividades de writing
300 actividades de reading comprehension
??? actividades de vocabulary??

⸻

### Organización del dataset

data/
├── lessons/
│   ├── b1/
│   │   ├── grammar/
│   │   ├── vocabulary/
│   │   ├── use-of-english/
│   │   └── writing/
│   │
│   └── b2/
│       ├── grammar/
│       ├── vocabulary/
│       ├── use-of-english/
│       └── writing/
│
├── activities/
│   ├── b1/
│   │   ├── future-forms.ts
│   │   ├── conditionals.ts
│   │   ├── passive-voice.ts
│   │   └── phrasal-verbs.ts
│   │
│   └── b2/
│       ├── advanced-conditionals.ts
│       ├── passive-reporting-verbs.ts
│       ├── modal-perfects.ts
│       └── key-word-transformations.ts

⸻

Ejemplo de lección

export const b1FutureFormsLesson: Lesson = {
  id: 'b1-future-forms',
  title: 'Future forms: will, going to and present continuous',
  level: 'B1',
  category: 'grammar',
  topic: 'future_forms',
  difficulty: 2,
  summary: 'Learn when to use will, going to and present continuous to talk about the future.',
  content: `
En inglés hay varias formas de hablar del futuro.
Usamos "will" para predicciones, decisiones espontáneas y promesas.
Usamos "going to" para planes e intenciones.
Usamos present continuous para planes organizados o acuerdos futuros.
  `,
  examples: [
    {
      sentence: 'I think it will rain tomorrow.',
      translation: 'Creo que lloverá mañana.',
      note: 'Prediction based on opinion.'
    },
    {
      sentence: 'I am going to study tonight.',
      translation: 'Voy a estudiar esta noche.',
      note: 'Plan or intention.'
    },
    {
      sentence: 'I am meeting Ana at 7.',
      translation: 'He quedado con Ana a las 7.',
      note: 'Arrangement.'
    }
  ],
  commonMistakes: [
    {
      wrong: 'I will going to study.',
      correct: 'I am going to study.',
      explanation: 'Do not mix "will" and "going to".'
    }
  ],
  relatedActivityIds: [
    'b1-future-forms-001',
    'b1-future-forms-002'
  ],
  tags: ['B1', 'grammar', 'future', 'will', 'going-to'],
  estimatedMinutes: 5,
  status: 'published'
}

⸻

Ejemplo de actividad

export const activity: Activity = {
  id: 'b1-future-forms-001',
  level: 'B1',
  type: 'single_choice',
  topic: 'future_forms',
  subtopic: 'will_vs_going_to',
  difficulty: 2,
  prompt: 'Choose the best option: I think it ___ tomorrow.',
  options: [
    'is raining',
    'will rain',
    'rains',
    'is going rain'
  ],
  correctAnswer: 'will rain',
  acceptedAnswers: ['will rain'],
  explanation:
    'We often use "will" for predictions based on opinion, especially with expressions like "I think", "I believe" or "probably".',
  examples: [
    'I think she will pass the exam.',
    'I believe they will arrive soon.'
  ],
  lessonIds: ['b1-future-forms'],
  tags: ['B1', 'future', 'will', 'prediction'],
  estimatedMinutes: 1,
  status: 'published'
}

⸻

## Temario B1

### B1 Grammar

#### Present tenses

* Present simple.
* Present continuous.
* Present perfect simple.
* Present perfect with for and since.
* Present perfect vs past simple.
* Stative verbs.
* Adverbs of frequency.

#### Past tenses

* Past simple.
* Past continuous.
* Past perfect simple.
* Used to.
* Would for past habits.
* Narrative tenses.

#### Future forms

* Will for predictions.
* Will for spontaneous decisions.
* Going to for plans.
* Going to for predictions based on evidence.
* Present continuous for arrangements.
* Present simple for timetables.
* Future time clauses.

#### Modals

* Can.
* Could.
* Be able to.
* Must.
* Have to.
* Should.
* Ought to.
* May.
* Might.
* Mustn’t.
* Don’t have to.
* Needn’t.

#### Conditionals

* Zero conditional.
* First conditional.
* Second conditional.
* Unless.
* If / when.
* As soon as.
* Before / after.
* Real vs hypothetical situations.

#### Passive voice

* Present simple passive.
* Past simple passive.
* Present perfect passive.
* Passive with modal verbs.
* Active vs passive.
* By + agent.

#### Reported speech

* Reported statements.
* Reported questions.
* Reported commands.
* Basic backshift.
* Say vs tell.
* Pronoun changes.
* Time expression changes.

#### Questions

* Direct questions.
* Indirect questions.
* Subject questions.
* Object questions.
* Question tags.
* Yes / no questions.
* Wh- questions.

#### Gerunds and infinitives

* Verb + ing.
* Verb + to infinitive.
* Verb + object + to infinitive.
* Like / love / hate + ing.
* Want / need / decide + to infinitive.
* Common verb patterns.

#### Comparatives and superlatives

* Comparative adjectives.
* Superlative adjectives.
* As … as.
* Not as … as.
* Too.
* Enough.
* Much / a bit / far + comparative.

#### Articles and determiners

* A.
* An.
* The.
* No article.
* Some.
* Any.
* Much.
* Many.
* A lot of.
* Few.
* Little.
* Each.
* Every.
* Both.
* Either.
* Neither.

#### Relative clauses

* Defining relative clauses.
* Who.
* Which.
* That.
* Where.
* Whose.
* Omitting relative pronouns.

#### Linking words

* And.
* But.
* So.
* Because.
* Although.
* However.
* Therefore.
* While.
* Whereas.
* In addition.
* For example.
* First.
* Then.
* Finally.

#### Prepositions

* Prepositions of time.
* Prepositions of place.
* Prepositions of movement.
* Verb + preposition.
* Adjective + preposition.
* Noun + preposition.

⸻

### B1 Vocabulary

* Daily routines.
* Family.
* Relationships.
* Home.
* Furniture.
* Food.
* Cooking.
* Health.
* Body.
* Education.
* Work.
* Jobs.
* Travel.
* Holidays.
* Transport.
* Shopping.
* Clothes.
* Hobbies.
* Free time.
* Sports.
* Technology.
* Internet.
* Social media.
* Environment.
* Weather.
* City.
* Countryside.
* Feelings.
* Emotions.
* Personality.
* Money.
* Services.
* Entertainment.
* Films.
* Books.
* Music.
* Problems and solutions.
* Plans and ambitions.

⸻

### B1 Use of English

* Multiple choice cloze.
* Open cloze básico.
* Sentence completion.
* Verb tense gaps.
* Preposition gaps.
* Phrasal verb gaps.
* Fixed expressions.
* Basic word formation.
* Error correction.
* Sentence rewriting.

⸻

### B1 Writing

* Informal email.
* Semi-formal email.
* Short story.
* Opinion paragraph.
* Description of a person.
* Description of a place.
* Simple review.
* Simple article.
* Personal experience.
* Advice message.

⸻

## Temario B2

### B2 Grammar

#### Advanced tense contrast

* Present perfect simple vs continuous.
* Past perfect simple vs continuous.
* Future continuous.
* Future perfect.
* Future perfect continuous.
* Advanced narrative tenses.
* Mixed time references.

#### Advanced future forms

* Future continuous.
* Future perfect.
* Be about to.
* Be due to.
* Be likely to.
* Future in the past.
* Future time clauses.

#### Advanced modals

* Must have.
* Might have.
* Could have.
* Should have.
* Can’t have.
* Needn’t have.
* Modal perfects for deduction.
* Modal perfects for regret.
* Be supposed to.
* Be allowed to.
* Be bound to.

#### Conditionals

* Third conditional.
* Mixed conditionals.
* In case.
* Provided that.
* As long as.
* Even if.
* Unless.
* Wish.
* If only.
* Would rather.
* It’s time + past.

#### Passive voice

* Passive with all main tenses.
* Passive with reporting verbs.
* It is said that…
* He is believed to…
* Have something done.
* Get something done.
* Passive infinitive.
* Passive gerund.

#### Reported speech

* Advanced backshift.
* Reporting verbs.
* Admit.
* Deny.
* Suggest.
* Recommend.
* Warn.
* Accuse.
* Apologise.
* Reporting verbs + gerund.
* Reporting verbs + infinitive.
* Reporting verbs + object + infinitive.

#### Relative clauses

* Non-defining relative clauses.
* Participle clauses.
* Reduced relative clauses.
* Which referring to a whole sentence.
* Prepositions in relative clauses.
* Whoever.
* Whatever.
* Whenever.

#### Gerunds and infinitives

* Perfect infinitive.
* Passive infinitive.
* Perfect gerund.
* Advanced verb patterns.
* Remember doing / remember to do.
* Stop doing / stop to do.
* Try doing / try to do.
* Regret doing / regret to say.

#### Inversion

* Never have I…
* Rarely do we…
* Not only did he…
* So / such inversion.
* Had I known…
* Should you need…
* Were I to…

#### Emphasis

* Cleft sentences.
* What I need is…
* It was John who…
* Do / did for emphasis.
* Fronting.

#### Advanced comparisons

* The more…, the more…
* Far / slightly / considerably.
* By far the best.
* Like vs as.
* As if.
* As though.

#### Connectors and discourse markers

* Nevertheless.
* Nonetheless.
* Whereas.
* Provided that.
* As a result.
* Consequently.
* In contrast.
* On the other hand.
* Despite.
* In spite of.
* Even though.
* Due to.
* Owing to.
* As far as I’m concerned.
* To some extent.

⸻

### B2 Vocabulary

* Work and career.
* Business.
* Entrepreneurship.
* Education.
* Learning.
* Science.
* Technology.
* Artificial intelligence.
* Digital life.
* Media.
* Communication.
* Environment.
* Climate.
* Global issues.
* Society.
* Culture.
* Health.
* Lifestyle.
* Psychology.
* Behaviour.
* Crime.
* Justice.
* Politics.
* Public life.
* Money.
* Economics.
* Travel.
* Tourism.
* Urban life.
* Relationships.
* Personal development.
* Success.
* Failure.
* Risk.
* Decision-making.
* Creativity.
* Innovation.
* Advertising.
* Consumerism.

⸻

### B2 Use of English

* Multiple-choice cloze.
* Open cloze.
* Word formation.
* Key word transformation.
* Gapped text.
* Advanced sentence transformation.
* Collocations.
* Phrasal verbs.
* Register and style.
* Formal vs informal rewriting.
* Connector transformation.
* Passive transformation.
* Reported speech transformation.
* Conditional transformation.
* Advanced prepositions.
* Idiomatic expressions.

⸻

### B2 Writing

* Essay.
* Formal email.
* Informal email avanzado.
* Article.
* Review.
* Report.
* Proposal.
* Opinion text.
* For and against essay.
* Problem-solution essay.

⸻

## Phrasal verbs

### B1 phrasal verbs

* get up
* wake up
* look for
* look after
* look at
* turn on
* turn off
* put on
* take off
* go out
* come back
* find out
* give up
* pick up
* take away
* come in
* sit down
* stand up
* fill in
* write down
* put away
* try on
* run out of
* get on with
* look forward to
* carry on
* check in
* check out
* break down
* grow up

### B2 phrasal verbs

* bring up
* come across
* come up with
* get away with
* get over
* get rid of
* give in
* go through
* look into
* make up
* make up for
* put off
* put up with
* run into
* set up
* sort out
* take after
* take over
* turn down
* work out
* point out
* rule out
* bring about
* come down to
* carry out
* cut down on
* drop out
* end up
* fall behind
* keep up with
* live up to
* look down on
* look up to
* pull out of
* put forward
* stand for
* turn out
* come up against
* get around to
* go along with

⸻

## Collocations

### B1 collocations

* make a mistake
* make a decision
* do homework
* do exercise
* take a photo
* take a break
* have a shower
* have fun
* get ready
* get lost
* spend time
* save money
* tell the truth
* tell a lie
* keep in touch
* pay attention
* miss the bus
* catch a train
* heavy rain
* strong coffee

### B2 collocations

* raise awareness
* reach a conclusion
* draw attention to
* make an effort
* make progress
* take responsibility
* pose a threat
* play a role
* meet expectations
* face a challenge
* gain experience
* highly unlikely
* deeply concerned
* strictly forbidden
* widely available
* bitterly disappointed
* fully aware
* strongly recommend
* take into account
* come to terms with

⸻

## Sistema de repaso

La app debe guardar errores y convertirlos en futuras actividades de repaso.

Reglas iniciales:

* Si una actividad se falla, se añade a la cola de repaso.
* Si se falla varias veces, se marca como difícil.
* Si muchas actividades del mismo tema se fallan, el tema se marca como débil.
* Si un tema es débil, la app recomienda más lecciones y actividades de ese tema.
* Si una actividad se acierta varias veces, se retrasa su próxima revisión.

Ejemplo:

function getNextReviewDate(isCorrect: boolean, confidence: number): Date {
  const now = new Date()
  if (!isCorrect) {
    now.setDate(now.getDate() + 1)
    return now
  }
  if (confidence <= 2) {
    now.setDate(now.getDate() + 2)
    return now
  }
  if (confidence === 3) {
    now.setDate(now.getDate() + 5)
    return now
  }
  now.setDate(now.getDate() + 10)
  return now
}

⸻

## Settings

La pantalla de settings debe permitir configurar:

* Nivel activo:
    * B1
    * B2
    * B1 + B2
* Número de lecciones por sesión.
* Número de actividades por sesión.
* Mostrar traducciones.
* Mostrar explicación después de responder.
* Incluir actividades de repaso.
* Modo estricto.
* Resetear progreso.
* Exportar progreso.
* Importar progreso.

⸻

## Dashboard

El dashboard debe mostrar:

* Progreso general.
* Progreso B1.
* Progreso B2.
* Actividades completadas.
* Lecciones vistas.
* Porcentaje de acierto.
* Temas fuertes.
* Temas débiles.
* Errores frecuentes.
* Próximos repasos.
* Racha.
* Última sesión completada.

⸻

## MVP

Primera versión mínima:

* Crear proyecto Next.js + TailwindCSS.
* Crear estructura de rutas.
* Crear tipos Lesson, Activity, DailySession, UserProgress.
* Crear dataset inicial pequeño.
* Crear home con Daily Loop.
* Mostrar una lección recomendada.
* Botón de siguiente lección.
* Botón para practicar lo visto.
* Crear actividades relacionadas con lecciones vistas.
* Soportar:
    * Single choice.
    * Multiple choice.
    * True / false.
    * Fill in the blank.
* Mostrar corrección y explicación.
* Guardar progreso en LocalStorage.
* Crear página de settings.
* Permitir elegir B1, B2 o ambos.
* Crear página de resumen diario.

⸻

## Roadmap

### Versión 0.1

* Setup Next.js.
* Setup TailwindCSS.
* Crear layout principal.
* Crear rutas principales.
* Crear tipos base.
* Crear dataset inicial.
* Crear Daily Loop básico.
* Mostrar lección recomendada.
* Botón siguiente lección.
* Botón practicar lo visto.
* Actividades relacionadas.
* Corrección básica.
* Progreso en LocalStorage.

### Versión 0.2

* Añadir biblioteca de lecciones.
* Añadir biblioteca de actividades.
* Añadir filtros por nivel.
* Añadir filtros por tema.
* Añadir sentence transformation.
* Añadir error correction.
* Añadir word formation.
* Añadir open cloze.
* Añadir key word transformation.
* Añadir cola de repaso.

### Versión 0.3

* Crear 1.000 actividades.
* Crear lecciones B1 completas.
* Crear primeras lecciones B2.
* Añadir dashboard.
* Añadir temas débiles.
* Añadir recomendaciones.
* Añadir writing prompts.
* Añadir reading comprehension.

### Versión 1.0

* Dataset grande B1/B2.
* Lecciones completas B1.
* Lecciones completas B2.
* Use of English completo.
* Phrasal verbs completos.
* Collocations completas.
* Repaso inteligente.
* Dashboard avanzado.
* Exportar/importar progreso.
* Modo offline.
* Diseño responsive completo.

⸻

## Instalación

pnpm create next-app@latest EnglishLoop
cd EnglishLoop
pnpm install
pnpm dev

Durante la instalación seleccionar:

TypeScript: Yes
ESLint: Yes
Tailwind CSS: Yes
src directory: Optional
App Router: Yes
Import alias: Yes

⸻

Scripts recomendados

{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}

⸻

## Principios de diseño

* Mobile-first.
* Limpio.
* Claro.
* Sin distracciones.
* Mucho espacio para leer.
* Feedback inmediato.
* Explicaciones visibles.
* Progreso siempre visible.
* Acceso rápido a repaso.
* Diseño agradable para uso diario.

⸻

Nombre provisional

EnglishLoop

Significado:

* "English" de language.
* “Loop” de repetición, rutina y repaso.
* Encaja con la idea de Daily Loop.

⸻

## Licencia

Proyecto personal privado.

Si se publica en el futuro, valorar:

* MIT
* Private
* Custom license

⸻

Nota

El contenido del dataset debe ser original y revisado. La app puede inspirarse en estructuras habituales de aprendizaje B1/B2, CEFR y Use of English, pero no debe copiar ejercicios oficiales ni material propietario.
