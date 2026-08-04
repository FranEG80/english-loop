# Relevo de trabajo: ampliación y validación del dataset

Este documento sirve como instrucción reutilizable para cualquier agente que
retome la ampliación del dataset. Debe leerse al comenzar cada turno. El agente
debe detectar el punto real en los archivos fuente y continuar desde el primer
objetivo de cobertura pendiente; no debe asumir que el trabajo terminó porque
existan índices o informes generados.

## Objetivo

Completar todos los objetivos definidos en
`DATASET/catalog/coverage-targets.json` y todas las lecciones previstas en
`DATASET/catalog/curriculum-map.json`.

Cada nodo debe tener, como mínimo:

- una lección publicada, educativa y realmente útil para estudiantes del nivel;
- 100 actividades publicadas;
- al menos cuatro tipos de actividad;
- todas las dificultades exigidas por `coverage-targets.json`;
- evaluación automática correcta;
- contenido original, natural, variado y sin duplicados.

No se permite crear contenido mediante un script generador, plantillas
repetitivas o variaciones mecánicas. Las lecciones, los ejemplos, las opciones,
las respuestas y las explicaciones deben redactarse directamente y revisarse
como material pedagógico real.

## Estado exacto dejado por el agente anterior

El último estado comprobado de los archivos fuente es:

- 56 lecciones Markdown en `DATASET/lessons/`.
- 5.300 actividades en `DATASET/activities/`.
- El nodo `b2-ai-digital-life` ya tiene lección y cuatro lotes de 25
  actividades: `single_choice`, `fill_blank`, `true_false` y `word_order`.
- El primer `plannedLessonId` pendiente, siguiendo el orden real de
  `curriculum-map.json`, es `b1-vocabulary-daily-routines-life`.
- Hay 124 lecciones planificadas y 68 siguen sin Markdown; además, hay 120
  objetivos de cobertura y la cobertura todavía no está completa. No confundir
  el mínimo global de 100 lecciones con el número total de lecciones
  planificadas.

El informe generado que se encuentra ahora en
`DATASET/reports/validation.json` es anterior a los últimos 50 ejercicios de
IA: registra 56 lecciones, 5.250 actividades y 276 errores. Por tanto, sus
contadores no describen todavía los 5.300 ejercicios actuales. No se debe
editar el informe: hay que regenerarlo con `pnpm dataset:all` después de
terminar la nueva tanda de contenido.

## Archivos que hay que leer antes de editar

Leer completamente estos archivos:

```text
AGENTS.md
DOC/DATASET-PLAN.md
DOC/DATASET-CONTENT-WORKFLOWS.md
DATASET/catalog/taxonomy.json
DATASET/catalog/curriculum-map.json
DATASET/catalog/coverage-targets.json
DATASET/references/sources.json
DATASET/schemas/lesson.schema.json
DATASET/schemas/activity.schema.json
DATASET/templates/lesson.template.md
DATASET/templates/activity-batch.template.json
```

Después, consultar una lección completa y un lote válido de cada tipo que se
vaya a usar. No copiar su redacción: solo comprobar estructura, campos y
estrategia de evaluación.

## Cómo detectar dónde continuar

Los archivos de contenido son la fuente de verdad. Los índices y los informes
son derivados y pueden estar obsoletos durante una tanda de edición.

1. Obtener las unidades y objetivos de
   `DATASET/catalog/curriculum-map.json` y los mínimos de
   `DATASET/catalog/coverage-targets.json`.
2. Comprobar qué `plannedLessonIds` ya tienen un Markdown real en
   `DATASET/lessons/`.
3. Comprobar cuántas actividades existen para cada
   `taxonomyNodeIds` y qué tipos y dificultades contienen.
4. Elegir el primer nodo pendiente siguiendo el orden del mapa curricular.
5. Si el nodo tiene una lección pero menos de 100 actividades, completar ese
   nodo antes de abrir otro.

Comandos de inspección permitidos:

```bash
rg --files DATASET/lessons | sort
rg --files DATASET/activities -g 'batch-*.json' | sort
rg -n 'plannedLessonIds|taxonomyNodeId|minimumActivities|requiredDifficulties' \
  DATASET/catalog/curriculum-map.json DATASET/catalog/coverage-targets.json
git status --short
git diff -- DATASET/lessons DATASET/activities
```

No usar `git reset`, `git checkout` ni limpiezas globales. El árbol puede
contener cambios previos ajenos al dataset.

## Siguiente trabajo

Comenzar por:

```text
taxonomyNodeId: b1-daily-routines-life
plannedLessonId: b1-vocabulary-daily-routines-life
level: B1
category: vocabulary
topic: b1-daily-routines-life
```

Rutas canónicas:

```text
DATASET/lessons/b1/vocabulary/b1-daily-routines-life/
  b1-vocabulary-daily-routines-life.md

DATASET/activities/b1/vocabulary/b1-daily-routines-life/
  b1-vocabulary-daily-routines-life/{activity_type}/batch-001.json
```

Después de completar una tanda, comprobar los archivos fuente y continuar con
la siguiente tanda libre de la cola explícita de abajo.

## Organización del trabajo: tandas de cinco lecciones

El trabajo editorial restante se divide en tandas de **cinco lecciones**. Una
tanda no es un único JSON de actividades: es un bloque de trabajo que siempre
contiene cinco parejas completas:

```text
TANDA-01
├── lesson-01 + pack_actividades-01
├── lesson-02 + pack_actividades-02
├── lesson-03 + pack_actividades-03
├── lesson-04 + pack_actividades-04
└── lesson-05 + pack_actividades-05
```

Para cada pareja hay que crear:

```text
1 lección Markdown real
4 lotes JSON de 25 actividades = 100 actividades
```

Los lotes JSON siguen siendo independientes por tipo (`single_choice`,
`fill_blank`, `true_false` y `word_order`). La separación en tandas de cinco es
solo una unidad de planificación y relevo; no se deben mezclar cinco nodos en
un mismo lote JSON ni cambiar las rutas canónicas.

Las lineas de cada una de las tandas pendientes estarán en este documento con la casilla vacia `- [ ]`, las lineas de cada una de las tandas que se haya iniciadao y no se tienen que tocar estarán marcadas `- [-]` y las completadas estaran marcdas como hechas `- [x]`


### Cómo formar la siguiente tanda

En cada sesión:

1. Leer `curriculum-map.json` en su orden editorial.
2. Excluir las lecciones que ya existan realmente en `DATASET/lessons/`.
3. Tomar la primera tanda no realizada o iniciada y se marcarla en este documento
   como iniciadas cada una de las lineas de la tanda.
4. Escribir la lección y sus 100 actividades completas para cada una de esas
   cinco lecciones.
5. No empezar una nueva tanda hasta que las cinco parejas estén terminadas y
   revisadas y marcadas como completadas.
6. Registrar en el relevo los cinco `taxonomyNodeId`, los cinco
   `plannedLessonId` y el primer pendiente siguiente.

La cola concreta actual tiene 68 lecciones pendientes: 13 tandas de cinco y una
tanda final de tres. Si otro agente completa una lección antes de que comience
una tanda, hay que tachar esa entrada solo después de comprobar sus archivos y
recalcular la cola; no se deben desplazar manualmente los IDs ni reutilizar una
tanda ya marcada.

### Cola explícita y checklists

Cada agente debe reservar una tanda marcando `EN PROGRESO` y su identificador
antes de editar. El lanzamiento actual queda preparado así: Agent-01 toma
`TANDA-01`, Agent-02 toma `TANDA-02` y Agent-03 toma `TANDA-03`. Pueden trabajar
en paralelo porque no comparten archivos de contenido. Al terminar, cada agente
marca la tanda como `HECHA` únicamente si las cinco parejas tienen lección y
100 actividades válidas. Si una tanda está reservada, ningún otro agente puede
tocar sus cinco nodos.

#### TANDA-01 — Agent-01 — EN PROGRESO → HECHA

- [-] `b1-daily-routines-life` → lesson `b1-vocabulary-daily-routines-life` + pack
- [-] `b1-family-relationships` → lesson `b1-vocabulary-family-relationships` + pack
- [-] `b1-home-services` → lesson `b1-vocabulary-home-services` + pack
- [-] `b1-food-cooking` → lesson `b1-vocabulary-food-cooking` + pack
- [-] `b1-health-body` → lesson `b1-vocabulary-health-body` + pack

#### TANDA-02 — Agent-02 — EN PROGRESO → HECHA

- [-] `b1-education-study` → lesson `b1-vocabulary-education-study` + pack
- [-] `b1-work-jobs` → lesson `b1-vocabulary-work-jobs` + pack
- [-] `b1-travel-transport` → lesson `b1-vocabulary-travel-transport` + pack
- [-] `b1-shopping-clothes-money` → lesson `b1-vocabulary-shopping-clothes-money` + pack
- [-] `b1-leisure-sport-entertainment` → lesson `b1-vocabulary-leisure-sport-entertainment` + pack

#### TANDA-03 — Agent-03 — EN PROGRESO

- [-] `b1-technology-digital-life` → lesson `b1-vocabulary-technology-digital-life` + pack
- [-] `b1-environment-weather-places` → lesson `b1-vocabulary-environment-weather-places` + pack
- [-] `b2-media-communication` → lesson `b2-vocabulary-media-communication` + pack
- [-] `b2-climate-global-issues` → lesson `b2-vocabulary-climate-global-issues` + pack
- [-] `b2-health-psychology` → lesson `b2-vocabulary-health-psychology` + pack

#### TANDA-04 — DISPONIBLE

- [ ] `b2-crime-justice` → lesson `b2-vocabulary-crime-justice` + pack
- [ ] `b2-society-culture-public-life` → lesson `b2-vocabulary-society-culture-public-life` + pack
- [ ] `b2-money-economics` → lesson `b2-vocabulary-money-economics` + pack
- [ ] `b2-travel-tourism-urban-life` → lesson `b2-vocabulary-travel-tourism-urban-life` + pack
- [ ] `b2-creativity-innovation-decisions` → lesson `b2-vocabulary-creativity-innovation-decisions` + pack

#### TANDA-05 — DISPONIBLE

- [ ] `b1-multiple-choice-cloze` → lesson `b1-use-of-english-multiple-choice-cloze` + pack
- [ ] `b1-open-cloze` → lesson `b1-use-of-english-open-cloze` + pack
- [ ] `b1-word-formation` → lesson `b1-use-of-english-word-formation` + pack
- [ ] `b1-sentence-rewriting` → lesson `b1-use-of-english-sentence-rewriting` + pack
- [ ] `b1-error-correction` → lesson `b1-use-of-english-error-correction` + pack

#### TANDA-06 — DISPONIBLE

- [ ] `b1-fixed-expressions` → lesson `b1-use-of-english-fixed-expressions` + pack
- [ ] `b2-multiple-choice-cloze` → lesson `b2-use-of-english-multiple-choice-cloze` + pack
- [ ] `b2-open-cloze` → lesson `b2-use-of-english-open-cloze` + pack
- [ ] `b2-word-formation` → lesson `b2-use-of-english-word-formation` + pack
- [ ] `b2-key-word-transformations` → lesson `b2-use-of-english-key-word-transformations` + pack

#### TANDA-07 — DISPONIBLE

- [ ] `b2-register-rewriting` → lesson `b2-use-of-english-register-rewriting` + pack
- [ ] `b2-advanced-fixed-expressions` → lesson `b2-use-of-english-fixed-expressions` + pack
- [ ] `b1-reading-notices-functional-texts` → lesson `b1-reading-notices-functional-texts` + pack
- [ ] `b1-reading-gist-detail` → lesson `b1-reading-gist-detail` + pack
- [ ] `b1-reading-people-matching` → lesson `b1-reading-people-matching` + pack

#### TANDA-08 — DISPONIBLE

- [ ] `b1-reading-gapped-text` → lesson `b1-reading-gapped-text-cohesion` + pack
- [ ] `b1-reading-opinion-purpose` → lesson `b1-reading-opinion-purpose` + pack
- [ ] `b2-reading-gist-detail-inference` → lesson `b2-reading-gist-detail-inference` + pack
- [ ] `b2-reading-attitude-tone` → lesson `b2-reading-attitude-tone` + pack
- [ ] `b2-reading-gapped-text` → lesson `b2-reading-gapped-text` + pack

#### TANDA-09 — DISPONIBLE

- [ ] `b2-reading-multiple-matching` → lesson `b2-reading-multiple-matching` + pack
- [ ] `b2-reading-argument-evidence` → lesson `b2-reading-argument-evidence` + pack
- [ ] `b1-writing-informal-email` → lesson `b1-writing-informal-email` + pack
- [ ] `b1-writing-semi-formal-email` → lesson `b1-writing-semi-formal-email` + pack
- [ ] `b1-writing-story-sequencing` → lesson `b1-writing-story-sequencing` + pack

#### TANDA-10 — DISPONIBLE

- [ ] `b1-writing-opinion-article` → lesson `b1-writing-opinion-article` + pack
- [ ] `b1-writing-review-description` → lesson `b1-writing-review-description` + pack
- [ ] `b2-writing-essay-structure` → lesson `b2-writing-essay-structure` + pack
- [ ] `b2-writing-formal-email` → lesson `b2-writing-formal-email` + pack
- [ ] `b2-writing-article-review` → lesson `b2-writing-article-review` + pack

#### TANDA-11 — DISPONIBLE

- [ ] `b2-writing-report` → lesson `b2-writing-report` + pack
- [ ] `b2-writing-argument-cohesion` → lesson `b2-writing-argument-cohesion` + pack
- [ ] `b1-phrasal-everyday-actions` → lesson `b1-phrasal-verbs-everyday-actions` + pack
- [ ] `b1-phrasal-travel-services` → lesson `b1-phrasal-verbs-travel-services` + pack
- [ ] `b1-phrasal-study-relationships` → lesson `b1-phrasal-verbs-study-relationships` + pack

#### TANDA-12 — DISPONIBLE

- [ ] `b2-phrasal-change-progress` → lesson `b2-phrasal-verbs-change-progress` + pack
- [ ] `b2-phrasal-work-problems` → lesson `b2-phrasal-verbs-work-problems` + pack
- [ ] `b2-phrasal-attitudes-relationships` → lesson `b2-phrasal-verbs-attitudes-relationships` + pack
- [ ] `b1-collocations-daily-life` → lesson `b1-collocations-daily-life` + pack
- [ ] `b1-collocations-travel-work` → lesson `b1-collocations-travel-work` + pack

#### TANDA-13 — DISPONIBLE

- [ ] `b2-collocations-academic-business` → lesson `b2-collocations-academic-business` + pack
- [ ] `b2-collocations-impact-attitudes` → lesson `b2-collocations-impact-attitudes` + pack
- [ ] `b1-prepositions-time-place` → lesson `b1-prepositions-time-place` + pack
- [ ] `b1-prepositions-movement-travel` → lesson `b1-prepositions-movement-travel` + pack
- [ ] `b1-dependent-prepositions` → lesson `b1-dependent-prepositions` + pack

#### TANDA-14 — DISPONIBLE — 3 lecciones

- [ ] `b2-dependent-prepositions` → lesson `b2-dependent-prepositions` + pack
- [ ] `b2-prepositions-abstract-relations` → lesson `b2-prepositions-abstract-relations` + pack
- [ ] `b2-prepositional-fixed-phrases` → lesson `b2-prepositional-fixed-phrases` + pack

### Formato de registro de cada tanda

Añadir al mensaje de relevo una sección como esta, sustituyendo los datos por
los reales:

```markdown
## TANDA-01 — completada

| # | taxonomyNodeId | plannedLessonId | lección | actividades |
|---|---|---|---:|---:|
| 1 | ... | ... | sí | 100 |
| 2 | ... | ... | sí | 100 |
| 3 | ... | ... | sí | 100 |
| 4 | ... | ... | sí | 100 |
| 5 | ... | ... | sí | 100 |

Siguiente tanda: TANDA-02
Primer nodo pendiente: ...
Última validación global: pendiente / resultado exacto
Incidencias abiertas: ...
```

La tanda solo puede marcarse como completada cuando las cinco lecciones tienen
su pack completo, los ejemplos y actividades han sido revisados manualmente y
no quedan archivos a medio escribir.

## Requisitos de una lección real

Cada lección debe enseñar una capacidad concreta, no ser una lista de
definiciones. Debe incluir, como mínimo, las once secciones exigidas por el
esquema y por la guía editorial:

```text
# Resumen
# Objetivos
# Explicación
# Forma o estructura
# Usos principales
# Contrastes importantes
# Ejemplos
# Errores frecuentes
# Excepciones relevantes
# Mini resumen
# Comprobación rápida autocorregible
```

La explicación debe corresponder al nivel CEFR del nodo. Los ejemplos deben
parecer frases que un estudiante encontraría o necesitaría en la vida real:
trabajo, estudios, viajes, servicios, conversaciones, noticias o situaciones
cotidianas según el tema. Deben mostrar el uso, no limitarse a repetir el
nombre de la regla. Incluir contrastes auténticos, errores plausibles y
explicaciones claras en español cuando ayuden a aprender.

## Uso obligatorio de las fuentes

Consultar `DATASET/references/sources.json` y usar sus referencias de forma
proporcional:

- `cefr-companion-volume-2020` y `cefr-descriptors`: nivel, objetivos
  comunicativos y progresión B1/B2.
- `cambridge-b1-preliminary-format`: categorías abstractas de tareas B1,
  reading, cloze y writing guiado.
- `cambridge-b2-first-format`: categorías abstractas de Reading and Use of
  English, transformaciones, cloze y writing B2.

Las fuentes justifican el nivel y el tipo de tarea; no se copian textos,
ejercicios ni ejemplos. Todo el material debe ser original y respetar el campo
`permittedUse` de cada fuente.

## Requisitos de las 100 actividades por nodo

La distribución normal es:

- 25 `single_choice`;
- 25 `fill_blank`;
- 25 `true_false`;
- 25 `word_order`.

Si el mapa curricular recomienda otros tipos compatibles, respetar el mapa y
el esquema. Cada actividad debe:

- tener un `id` único y estable;
- usar el `taxonomyNodeIds` del nodo correcto;
- enlazar con la lección correcta mediante `lessonIds`;
- tener una situación o frase distinta de las demás;
- evaluar exactamente un objetivo claro;
- incluir opciones plausibles pero una sola respuesta correcta cuando proceda;
- incluir una explicación que enseñe por qué la respuesta es correcta;
- usar dificultad coherente con B1/B2 y cubrir todas las dificultades requeridas;
- ser autocorregible según la estrategia declarada.

No hacer cambios cosméticos para ocultar incidencias. No reutilizar prompts con
sinónimos, cambiar solo nombres propios, ni duplicar la misma frase entre
tipos. En `word_order`, comprobar manualmente que cada token aparece una sola
vez, que los `correctTokenIds` forman exactamente la oración de la explicación
y que la oración resultante es idiomática.

## Orden de edición recomendado

Para cada nodo:

1. Leer el nodo en la taxonomía y el mapa curricular.
2. Redactar la lección completa.
3. Redactar los cuatro lotes de 25 actividades originales.
4. Revisar manualmente gramática, colocaciones, contexto, respuesta y
   explicación de cada actividad.
5. Comprobar JSON y rutas del nodo.
6. Solo entonces pasar al siguiente nodo.

Durante la generación no editar manualmente estos archivos:

```text
DATASET/catalog/lesson-index.json
DATASET/catalog/activity-index.json
DATASET/catalog/practice-index.json
DATASET/reports/validation.json
DATASET/reports/coverage.json
DATASET/reports/practice-coverage.json
DATASET/reports/duplicates.json
```

## Validación final, sin trampas

Cuando se haya generado todo el contenido pendiente, ejecutar:

```bash
cd /Users/fran/Desarrollo/english-loop
pnpm dataset:all
```

Si aparece un error de permisos del proceso de Node, usar únicamente la
alternativa documentada en `DOC/DATASET-CONTENT-WORKFLOWS.md` o en el relevo
del proyecto. No modificar el validador ni los informes para hacer desaparecer
errores.

La validación solo se considera terminada cuando:

- termina con código 0;
- no hay errores de esquema, rutas, referencias, consistencia o evaluación;
- la cobertura global alcanza 100 lecciones y 10.000 actividades;
- todos los objetivos tienen sus 100 actividades, tipos y dificultades;
- la evaluación automática está comprobada para todas las actividades;
- `duplicates.json` informa 0 grupos exactos y 0 pares cercanos.

Si falla, leer el error, corregir el archivo fuente responsable y volver a
ejecutar la validación. Nunca editar los informes generados ni declarar el
trabajo terminado mientras queden incidencias de cobertura.

## Entrega del siguiente relevo

Al terminar cada sesión, dejar anotado en este documento o en el mensaje de
relevo:

- nodos completados;
- lecciones y número real de actividades añadidas;
- primer nodo pendiente siguiente;
- resultado de la última validación y si los informes ya están actualizados;
- incidencias conocidas que todavía requieren corrección.

La sesión siguiente debe verificar ese resumen contra los archivos fuente
antes de continuar.
