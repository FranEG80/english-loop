# Tipos de actividad

Referencia única del sistema de actividades. El vocabulario es **el mismo en
los tres sitios**: el DATASET, el modelo de la aplicación y los renderers. Un
tipo que no esté aquí no existe.

## 1. Los once tipos canónicos

| Tipo | Presentación | Renderer | Estrategia de corrección |
|---|---|---|---|
| `gap_fill` | `gap_fill` | `GapFillRenderer` | `per_gap` |
| `word_formation` | `gap_fill` | `GapFillRenderer` | `per_gap` |
| `key_word_transformation` | `key_word_transformation` | `GapFillRenderer` | `per_gap` |
| `single_choice` | `choice` | `ChoiceRenderer` | `single_option` |
| `multiple_choice` | `choice` | `ChoiceRenderer` | `multiple_options` |
| `true_false` | `true_false` | `TrueFalseRenderer` | `boolean` |
| `swipe_deck` | `swipe_deck` | `SwipeDeckRenderer` | `deck_booleans` |
| `word_order` | `word_order` | `WordOrderRenderer` | `ordered_tokens` |
| `matching` | `matching` | `MatchingRenderer` | `matching_pairs` |
| `error_correction` | `free_text` | `FreeTextRenderer` | `one_of_texts` |
| `mini_game` | `mini_game` | `MiniGameRenderer` | `game_rounds` |

`PRESENTATION_BY_TYPE` (`core/models/types/activity.ts`) es la tabla que une
tipo y presentación, y es la **única** fuente de verdad. El DTO que viaja al
cliente es una unión discriminada por `presentation`, no por `type`: añadir un
tipo sin darle presentación es un error de compilación, no un fallback
silencioso.

**La pedagogía no se pierde con la consolidación.** Cada actividad conserva su
ejercicio de origen en `skillFocus` (`open_cloze`, `collocation_choice`,
`phrasal_verb_choice`…) y sus `taxonomyNodeIds`, así que la práctica dirigida y
la cobertura siguen midiéndose por competencia, no por tipo.

## 2. Los dos formatos de examen

`word_formation` y `key_word_transformation` son ejercicios **distintos** de
Cambridge Use of English. No se mezclan y no se fusionan.

### Part 3 — `word_formation`

Un texto con título y ocho huecos. Cada hueco lleva **su propia raíz en
mayúsculas** y se responde con una palabra derivada de ella. El hueco va dentro
del texto: es el contexto el que decide si toca un sustantivo, un adjetivo o un
adverbio, y si hace falta un prefijo negativo.

```
The reading room
The reading room in our library is very [gap1] on Saturday mornings.   (CROWD)
The librarians are extremely [gap2] and will find any book for you.    (HELP)
```

Reglas que impone `scripts/dataset/lib/activity-rules.ts`:

- la respuesta es **una sola palabra**;
- distinta del `cueWord`, y comparte raíz con él (`sharesRoot`, con tabla de
  derivaciones irregulares: `long → length`, `rely → unreliable`);
- **solo una derivación de la raíz encaja en ese contexto**; si el contexto
  admite dos, se listan todas en `answers`;
- la respuesta no aparece literalmente en el texto.

En pantalla el título va centrado y en negrita, y la raíz se muestra en
**mayúsculas y entre paréntesis justo después del hueco**.

### Part 4 — `key_word_transformation`

Dos frases y una palabra clave. La segunda se completa con **entre dos y cinco
palabras**, incluida la clave, que no se puede modificar.

```
A very friendly taxi driver drove us into town.        DRIVEN
We [gap1] a very friendly taxi driver.
→ were driven into town by
```

Reglas (`kwt-answer-length`, `kwt-contraction`, `kwt-key-word-absent`):

- `keyWord` obligatorio, en mayúsculas, presente **sin modificar** en la
  respuesta;
- respuesta de dos a cinco palabras;
- **sin contracciones**: en el examen cuentan como las palabras que
  reemplazan, así que se escribe `do not`, nunca `don't`;
- exactamente un `[gap1]`.

## 3. El marcador de hueco

**El contenido guarda un solo marcador, `[gapN]`. Cómo se pinta lo decide la
presentación.** Convivió con `___` durante la migración, y dos marcadores para
lo mismo obligan a que cada consumidor —renderers, evaluador, composición de
mazos y partidas— conozca los dos, y a que cualquier regla nueva se escriba por
duplicado.

| Presentación | Qué se ve en el hueco |
|---|---|
| `gap_fill`, `key_word_transformation` | un campo de escritura, en línea dentro de la frase |
| `choice`, `true_false`, `swipe_deck`, `mini_game` | una raya: no hay nada que escribir |

De la segunda columna se encarga `withVisibleGaps`
(`features/activities/gap-display.ts`). La regla `underscore-gap-marker`
rechaza cualquier guion bajo que vuelva a colarse.

Dos invariantes que se pagan caras si se rompen, y que valida
`gap-marker-mismatch`:

- **los marcadores del texto casan uno a uno y en orden con `evaluator.gaps`.**
  Un hueco que aparece en el texto pero no en el evaluador no se corrige: el
  alumno escribe algo y no cuenta ni bien ni mal;
- **el `gapId` es el del marcador.** La respuesta se empareja por id, no por
  posición, así que un `gap-1` frente a `[gap1]` da la actividad entera por
  fallada aunque esté perfecta. Como contrapartida, el cliente puede enviar los
  huecos en cualquier orden.

En Part 3 el paréntesis del texto es **la raíz**, no la solución: `(CONVINCE)`
es la pista de la que hay que derivar. No confundirlo con las respuestas que
algunos enunciados llevaban regaladas al final y que `pnpm dataset:repair-gaps`
retiró.

## 4. Contenido compuesto

`swipe_deck` y `mini_game` **no son agregaciones en tiempo de ejecución**: son
ficheros del DATASET con sus sub-ítems dentro y con id estable. Agruparlos al
vuelo daría una partida distinta cada vez, y entonces no se podría repetir, ni
revisar un fallo concreto, ni versionar el contenido, ni validarlo.

`pnpm dataset:compose` los deriva del contenido ya validado y los escribe como
lotes normales:

- **200 mazos** de 5 a 8 cartas, cada una con su `explanation`.
- **Una partida de cada juego por lección** (`frog_leap`, `lane_runner`,
  `sentence_tower`), de 8 rondas, todas del **mismo tema**: si la partida sirve
  para practicar una lección, sus rondas tienen que ser de esa lección.

Los juegos **no corrigen**. El DTO lleva las rondas sin `correctOptionId`: la
respuesta correcta nunca viaja al cliente antes del intento. Al terminar, el
shell envía las respuestas en un único intento, el servidor corrige con
`game_rounds` y la pantalla de resultados muestra la media de aciertos y la
explicación de cada ronda fallada.

## 5. Corrección con detalle

`evaluate()` devuelve `EvaluationResult { isCorrect, score, items }`, no un
booleano. `score` es la media de aciertos entre 0 y 1, así que un texto de ocho
huecos con siete bien vale 0,875 y no cero.

Cada `EvaluationItem` identifica su sub-ítem: `gapId`, `cardId`, `roundId`,
`leftId` o `answer`. `describeEvaluationItems` los traduce a algo legible antes
de salir al cliente —el texto de la opción, el enunciado de la carta, la frase
reconstruida de `word_order`— porque los ids internos (`a`, `t3`, `r1`) no
dicen nada.

Dos detalles que se pagan si se olvidan:

- **las opciones de un minijuego se numeran dentro de cada ronda**, así que las
  ocho rondas repiten `a`, `b`, `c`; hay que resolverlas contra su propia ronda
  o el resumen dará la misma respuesta correcta ocho veces;
- una elección sobrante de opción múltiple llega como `b#0`: el sufijo la
  distingue, pero no se enseña.

## 6. Herramientas del DATASET

| Comando | Qué hace |
|---|---|
| `pnpm dataset:all` | Índices, cobertura, duplicados, corrección y validación |
| `pnpm dataset:compose` | Compone mazos y partidas desde el contenido validado |
| `pnpm dataset:fix-prompt-labels` | Sube el enunciado a `prompt` y quita las etiquetas numeradas |
| `pnpm dataset:dedupe-exact` | Elimina actividades exactamente duplicadas |
| `pnpm dataset:expand-matching` | Lleva a cuatro parejas los emparejamientos cortos |
| `pnpm dataset:normalise-gap-markers` | Deja `[gapN]` como único marcador |
| `pnpm dataset:repair-gaps` | Cuadra los huecos del texto con los del evaluador |
| `pnpm dataset:prune` | Retira lo que no es autocorregible |
| `pnpm dataset:migrate-v2` | Migración v1 → v2 (idempotente) |

Todos son **idempotentes**: una segunda pasada no cambia ningún fichero.
