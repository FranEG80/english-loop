# Minijuegos en canvas

Especificación de los tres minijuegos de EnglishLoop. Un único tipo de
actividad (`mini_game`), un único renderer, y un módulo de código por juego.

- Contrato de datos: `DATASET/schemas/activity.schema.json` (`$defs.round`).
- Tipos de la aplicación: `core/models/types/activity.ts`.
- Código: `features/activities/games/`.
- Corrección: `core/practice/domain/activity-evaluator.ts`, estrategia
  `game_rounds`.

---

## 1. Principios

**La partida es contenido, no una agregación.** Cada item de `mini_game` lleva
sus 5–10 rondas escritas a mano dentro del propio JSON. Abrir dos veces la
misma actividad da exactamente las mismas rondas, en el mismo orden. Agruparlas
en tiempo de ejecución desde el pool de preguntas daría una partida distinta
cada vez: no se podría repetir, ni revisar un fallo concreto, ni versionar el
contenido, ni validarlo con `pnpm dataset:test-grading`.

**El juego no corrige.** El DTO que llega al cliente lleva las rondas **sin**
`correctOptionId`, igual que el resto de tipos: la respuesta correcta nunca
viaja al navegador antes del intento. Durante la partida la animación es
neutra —la rana salta y aterriza, el corredor cruza la puerta— y al terminar el
shell envía las respuestas de todas las rondas en **un solo intento**. El
servidor corrige, devuelve el desglose por ronda y entonces se muestra el
resultado.

**La lógica se separa del pintado.** Cada juego tiene un `machine.ts` con una
máquina de estados pura, sin dependencia de `canvas`, y un `draw.ts` que solo
dibuja. Se testea la máquina; el pintado no se testea unitariamente.

**Puntuación y errores, como en cualquier otra actividad.** La media de
aciertos y la lista de fallos con su explicación salen del mismo sitio que en
un `swipe_deck` o un multi-hueco: `EvaluationResult.score` y
`EvaluationResult.items`.

---

## 2. Arquitectura

```
features/activities/games/
  MiniGameRenderer.tsx       shell: canvas, HUD, controles, alternativa accesible
  game-registry.ts           MiniGameId -> GameModule
  engine/
    types.ts                 GameModule, GameMachine, GameCoreState, GameInput
    loop.ts                  requestAnimationFrame con paso fijo de 16,67 ms
    canvas.ts                contexto 2D, devicePixelRatio, paleta, primitivas
  frog-leap/
    machine.ts               máquina de estados PURA
    draw.ts                  pintado, sin lógica
    machine.test.ts
  lane-runner/               machine.ts, draw.ts, machine.test.ts
  sentence-tower/            machine.ts, draw.ts, machine.test.ts

public/games/<juego>/        sprites (ver §6)
```

### Contrato

```ts
export interface GameModule<TState extends GameCoreState> {
  id: MiniGameId;
  rounds: { min: number; max: number };
  optionsPerRound: { min: number; max: number };
  assets: readonly string[];
  machine: GameMachine<TState>;
  draw(context: CanvasRenderingContext2D, state: TState, view: GameView): void;
}

export interface GameMachine<TState extends GameCoreState> {
  create(rounds: readonly GameRound[]): TState;
  tick(state: TState, deltaMs: number, rounds: readonly GameRound[]): TState;
  handle(state: TState, input: GameInput, rounds: readonly GameRound[]): TState;
}
```

`GameCoreState` lo comparten los tres juegos: `roundIndex`, `score`, `streak`,
`answers`, `phase` (`idle | playing | resolving | finished`) y `elapsedMs`.
Cada juego lo extiende con lo suyo.

### Bucle

`engine/loop.ts` usa un acumulador con paso fijo de **16,67 ms** (60 fps) y un
tope de recuperación de **250 ms** por fotograma. Así la lógica no depende de
los fps del dispositivo: la misma secuencia de entradas produce el mismo
estado en un móvil lento y en un portátil rápido. Presupuesto por fotograma:
`update` por debajo de 2 ms y `draw` por debajo de 8 ms.

### Máquina de estados

```
        ┌──────── handle(select|lane) ────────┐
        │                                     ▼
   ┌─ playing ──── tick(timeout) ──────► resolving
   │    ▲                                     │
   │    └────── tick(animación acabada) ──────┘
   │                                          │
   └────────── última ronda respondida ───────┴──► finished ──► submit
```

`finished` es terminal: el shell envía el intento una sola vez (guardado con un
`ref`, no con estado, para que un re-render no lo duplique).

---

## 3. Juego 1 — Salto de nenúfar (`frog_leap`)

Una rana en la orilla y un nenúfar por opción. El enunciado de la ronda va
encima del lienzo. Al elegir un nenúfar, la rana salta describiendo un arco
parabólico; cuando aterriza empieza la ronda siguiente.

| | |
|---|---|
| Rondas | 5–10 (recomendado 8) |
| Opciones por ronda | 2–3 |
| Duración del salto | 520 ms (`JUMP_MS`) |
| Puntuación | 10 puntos por ronda + 5 de bonus cada 3 seguidas |
| Fin | Todas las rondas respondidas |

**Controles.** Toque o clic sobre el nenúfar; `←`/`→` mueven la selección y
`Enter` o `Espacio` saltan; también hay un botón por opción debajo del lienzo.

**Reglas de la máquina** (`frog-leap/machine.ts`):

- `handle` solo acepta entradas en fase `playing`: durante el salto se ignoran,
  para que un doble toque no responda dos rondas.
- Un carril fuera de rango se descarta, no se acota: elegir un nenúfar que no
  existe no debe responder por otro.
- La respuesta se registra al **aterrizar**, no al tocar. Interrumpir la
  animación no deja una ronda a medias.
- `jumpArc(progress)` devuelve `{x, y}` con `y = 4p(1−p)`: 0 en la orilla, 1 en
  el punto más alto a mitad de salto, 0 al aterrizar.

**Escena.** Río con ondas horizontales, orilla inferior en color acento,
nenúfares como elipses con borde de tinta y la etiqueta de la opción centrada.
El nenúfar elegido se pinta en acento mientras dura el salto.

**Replay de resultados.** Al recibir la corrección, los nenúfares fallados se
hunden (traslación hacia abajo con opacidad decreciente, 400 ms cada uno,
escalonados) y los acertados quedan marcados. Después se muestra la lista de
errores con la `explanation` de cada ronda.

---

## 4. Juego 2 — Carrera de carriles (`lane_runner`)

Corredor en tres carriles con la puerta acercándose desde la derecha. Cada
carril lleva una opción y hay que estar en el correcto al cruzarla.

| | |
|---|---|
| Rondas | 5–10 (recomendado 10) |
| Opciones por ronda | exactamente 3, una por carril |
| Tiempo de la 1.ª puerta | 4200 ms (`FIRST_GATE_MS`) |
| Aceleración | −250 ms por ronda (`SPEED_UP_MS`) |
| Tiempo mínimo | 1800 ms (`MIN_GATE_MS`) |
| Puntuación | 10 puntos + hasta 5 de bonus por tiempo restante |
| Fin | Todas las rondas respondidas |

**Controles.** `←`/`→` o deslizar cambian de carril; `Enter` o `Espacio`
confirman antes de tiempo y se llevan el bonus. Botón por opción debajo del
lienzo.

**Reglas de la máquina** (`lane-runner/machine.ts`):

- Un carril fuera de rango se **acota** a los extremos (a diferencia del juego
  de la rana): moverse a la izquierda desde el carril 0 debe dejarte en el 0,
  no ignorar la pulsación.
- Si se agota el tiempo, la ronda se responde con el carril en el que esté el
  corredor y se cuenta en `timedOut`, con la racha a cero.
- **La partida nunca se corta.** Fallar no termina la carrera: todas las rondas
  producen respuesta y todas se explican al final. Sin esto, las rondas no
  jugadas no tendrían explicación que mostrar.
- El tiempo por puerta baja con la ronda pero nunca por debajo del mínimo de
  reacción.

**Escena.** Pista con carriles alternos, líneas discontinuas de separación,
puerta como tres rectángulos de tinta (el del carril activo en acento) y
corredor a la izquierda. La posición de la puerta se deriva del tiempo
restante, no de un contador propio: el dibujo nunca se desincroniza de la
lógica.

---

## 5. Juego 3 — Torre de frases (`sentence_tower`)

Una grúa pasea los bloques de la ronda por encima de la torre; al elegir uno,
cae y se apila. Cada ronda añade un piso, así que **la torre es el historial
visible de la partida**: al terminar se lee entera de abajo arriba.

| | |
|---|---|
| Rondas | 5–10 |
| Bloques por ronda | 2–3 |
| Puntuación | 10 por acierto, +5 de bonus por cadena de 3 |
| Caída | 460 ms con aceleración y rebote corto al posarse |
| Pausa de lectura | 780 ms antes de plantear la ronda siguiente |
| Vaivén de la grúa | 2600 ms de un extremo al otro, plegándose en los bordes |
| Fin | Todas las rondas colocadas |

La cámara sigue a la cima: cuando un bloque se posa, la vista baja un piso, de
modo que la torre crece sin salirse del lienzo por muchas rondas que tenga la
partida.

**Comparte contrato con los otros dos juegos** —una opción por ronda y
corrección en el servidor con `game_rounds`—, así que un mismo item del DATASET
vale para cualquiera de los tres. La versión inicial planteaba rondas de
ordenar fragmentos con `ordered_tokens`, que habría obligado a un evaluador
propio y a un contrato de ronda distinto: apilar la opción elegida da la misma
sensación de construir la frase sin partir el modelo en dos.

Estado: implementado en `features/activities/games/sentence-tower/`, registrado
en `game-registry.ts` y compuesto para todas las lecciones.

---

## 6. Assets

Ninguno existe todavía. `engine/canvas.ts` dibuja la escena con formas
primitivas y la paleta de `app/globals.css`, así que **los juegos son jugables
desde el primer día** y el arte entra después sin tocar la máquina de estados.

| Juego | Fichero | Tamaño | Notas |
|---|---|---|---|
| `frog_leap` | `frog-idle.webp` | 96×96 | reposo |
| | `frog-jump.webp` | 96×96 | en el aire |
| | `frog-splash.webp` | 96×96 | chapuzón |
| | `lilypad.webp` | 160×80 | normal |
| | `lilypad-ok.webp` | 160×80 | acertado |
| | `lilypad-sunk.webp` | 160×80 | hundido |
| | `river-tile.webp` | 256×256 | fondo repetible |
| | `splash.webp` | 128×128 | salpicadura |
| `lane_runner` | `runner-sheet.webp` | 4×(64×96) | ciclo de carrera |
| | `gate.webp` | 160×120 | marco de puerta |
| | `bg-far.webp` | 1024×360 | parallax lejano |
| | `bg-near.webp` | 1024×360 | parallax cercano |
| | `dust.webp` | 64×64 | partículas |
| `sentence_tower` | `block.webp` | 180×64 | fragmento |
| | `block-wrong.webp` | 180×64 | mal colocado |
| | `crane.webp` | 200×140 | grúa |
| | `ground.webp` | 1024×80 | suelo |

Ruta: `public/games/<juego>/`. Formato WebP con transparencia.

Paleta disponible en `engine/canvas.ts` (`PALETTE`): `background`,
`foreground`, `primary`, `primaryDark`, `accent`, `coral`, `surface`, `water`,
`waterDeep`, `success`, `danger`.

---

## 7. Accesibilidad

Un canvas no es operable por sí solo, así que:

- **Alternativa DOM equivalente.** Con `prefers-reduced-motion: reduce`, o si
  el juego no está registrado, el shell renderiza las mismas rondas como grupos
  de botones. Cuenta igual y produce el mismo intento.
- **Controles visibles siempre.** Incluso en modo canvas hay un botón por
  opción debajo del lienzo: el juego se puede terminar entero sin gestos.
- El lienzo lleva `role="application"`, `tabIndex={0}` y un `aria-label` con el
  enunciado de la ronda en curso.
- Ningún juego depende del color para transmitir información: el estado se
  refuerza con posición y forma.
- Sin destellos ni parpadeos por encima de 3 Hz.

---

## 8. Contrato de datos

Ejemplo completo de un item, tal y como se guarda en el DATASET:

```json
{
  "schemaVersion": "2.0.0",
  "id": "b1-food-eating-out-mg-001",
  "status": "published",
  "autoGradable": true,
  "level": "B1",
  "type": "mini_game",
  "skillFocus": "mini_game",
  "category": "vocabulary",
  "topic": "b1-food-eating-out",
  "subtopic": "b1-food-eating-out",
  "taxonomyNodeIds": ["b1-food-eating-out"],
  "difficulty": 2,
  "instructions": "Ayuda a la rana a cruzar el río eligiendo la palabra correcta.",
  "prompt": "Vocabulario de restaurante: cinco saltos.",
  "game": "frog_leap",
  "rounds": [
    {
      "id": "r1",
      "prompt": "What do you ask for to pay at the end of a meal?",
      "options": [
        { "id": "a", "text": "the bill" },
        { "id": "b", "text": "the receipt", "feedback": "El recibo se entrega después de pagar." },
        { "id": "c", "text": "the menu", "feedback": "La carta se pide al principio." }
      ],
      "explanation": "En un restaurante se pide «the bill» para saber cuánto hay que pagar."
    }
  ],
  "lessonIds": ["b1-vocabulary-food-eating-out"],
  "tags": ["b1", "food", "mini-game"],
  "estimatedSeconds": 120,
  "evaluator": {
    "strategy": "game_rounds",
    "rounds": [{ "roundId": "r1", "correctOptionId": "a" }]
  },
  "explanation": "Vocabulario básico para pedir y pagar en un restaurante."
}
```

Nota: el JSON de ejemplo muestra una sola ronda por brevedad; el schema exige
entre 5 y 10.

### Validación

`scripts/dataset/lib/activity-rules.ts` comprueba, por item:

- ids de ronda únicos dentro del item;
- ids de opción únicos y sin texto repetido dentro de cada ronda;
- `correctOptionId` existente entre las opciones de **su** ronda;
- toda ronda declarada se corrige y toda ronda corregida existe;
- `explanation` no vacía en cada ronda.

---

## 9. Guía de autoría

- **5–10 rondas.** Menos de cinco no da sensación de partida; más de diez
  cansa.
- **Dificultad creciente dentro de la partida.** Las dos primeras rondas deben
  resolverse casi sin pensar; las dos últimas son las difíciles.
- **Distractores plausibles.** Un distractor que nadie elegiría no enseña nada.
  En vocabulario, usar la partícula equivocada del mismo verbo (`get up` /
  `get over`) o el falso amigo habitual.
- **`feedback` en cada distractor.** Es lo que convierte la lista de errores en
  algo útil: no basta con decir cuál era la correcta, hay que explicar por qué
  la elegida no lo es.
- **`explanation` por ronda, en español**, y centrada en la regla, no en la
  respuesta.
- **`frog_leap`: 2–3 opciones.** Tres nenúfares es el máximo que cabe legible.
- **`lane_runner`: exactamente 3.** Son los carriles.
- **Una sola idea por ronda.** Si la ronda necesita contexto largo, el
  minijuego no es el formato: usa `single_choice`.

---

## 10. Pendiente

- Sprites de §6: hoy se dibujan formas primitivas.
- Efectos de sonido (`engine/audio.ts`), silenciados por defecto.
