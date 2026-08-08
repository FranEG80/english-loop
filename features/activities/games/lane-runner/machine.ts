import {
  POINTS_PER_HIT,
  createCoreState,
  recordAnswer,
  type GameCoreState,
  type GameMachine,
  type GameRound,
} from "../engine/types";

/**
 * Carrera de carriles. El corredor avanza y cada puerta lleva una opción por
 * carril. **La respuesta es el carril en el que estés cuando la puerta te
 * alcanza**: puedes cambiarte cuantas veces quieras hasta ese momento, y no
 * hay botón de confirmar. Es una carrera, no un formulario.
 *
 * Las puertas respondidas siguen saliendo por la izquierda mientras las de la
 * ronda siguiente entran por la derecha, así que nunca hay un corte entre
 * ronda y ronda.
 */

export const FIRST_GATE_MS = 4600;
export const MIN_GATE_MS = 2200;
export const SPEED_UP_MS = 220;
/** Lo que tarda una puerta respondida en salir de pantalla. */
export const EXIT_MS = 900;

export interface LaneRunnerState extends GameCoreState {
  /** Carril en el que corre ahora mismo; es la respuesta tentativa. */
  lane: number;
  /** Milisegundos que faltan para que la puerta alcance al corredor. */
  remainingMs: number;
  /** Milisegundos que le quedan a la puerta respondida para salir. */
  exitingMs: number;
  /** Ronda de la puerta que sale, para poder seguir pintándola. */
  exitingRoundIndex: number | null;
  /** Carril elegido en la puerta que sale, para marcarlo mientras se va. */
  exitingLane: number | null;
}

export function gateDurationMs(roundIndex: number): number {
  return Math.max(MIN_GATE_MS, FIRST_GATE_MS - roundIndex * SPEED_UP_MS);
}

function createState(): LaneRunnerState {
  return {
    ...createCoreState(),
    lane: 1,
    remainingMs: gateDurationMs(0),
    exitingMs: 0,
    exitingRoundIndex: null,
    exitingLane: null,
  };
}

export const laneRunnerMachine: GameMachine<LaneRunnerState> = {
  create: () => createState(),

  tick(state, deltaMs, rounds) {
    const exitingMs = Math.max(0, state.exitingMs - deltaMs);
    const exiting =
      exitingMs > 0
        ? {
            exitingMs,
            exitingRoundIndex: state.exitingRoundIndex,
            exitingLane: state.exitingLane,
          }
        : { exitingMs: 0, exitingRoundIndex: null, exitingLane: null };

    if (state.phase !== "playing") return { ...state, ...exiting };

    const remaining = state.remainingMs - deltaMs;
    if (remaining > 0) {
      return {
        ...state,
        ...exiting,
        remainingMs: remaining,
        elapsedMs: state.elapsedMs + deltaMs,
      };
    }

    // La puerta ha alcanzado al corredor: el carril actual queda fijado.
    const round = rounds[state.roundIndex];
    if (!round) return { ...state, ...exiting, phase: "finished" };

    const lane = clampLane(state.lane, round.options.length);
    const option = round.options[lane];
    if (!option) return { ...state, ...exiting, phase: "finished" };

    const answeredIndex = state.roundIndex;
    const advanced = recordAnswer(
      { ...state, score: state.score + POINTS_PER_HIT, streak: state.streak + 1 },
      rounds,
      option.id,
    );

    return {
      ...advanced,
      lane: state.lane,
      remainingMs: gateDurationMs(advanced.roundIndex),
      // La puerta respondida sigue saliendo mientras entra la siguiente.
      exitingMs: EXIT_MS,
      exitingRoundIndex: answeredIndex,
      exitingLane: lane,
    };
  },

  handle(state, input, rounds) {
    if (state.phase !== "playing") return state;
    const round = rounds[state.roundIndex];
    if (!round) return state;

    // Solo se cambia de carril. Confirmar no adelanta la puerta: la respuesta
    // se fija sola cuando la puerta llega.
    if (input.kind !== "lane" && input.kind !== "select") return state;

    const lane = input.kind === "lane" ? input.lane : input.optionIndex;
    return { ...state, lane: clampLane(lane, round.options.length) };
  },
};

export function clampLane(lane: number, laneCount: number): number {
  if (!Number.isInteger(lane)) return 0;
  return Math.min(laneCount - 1, Math.max(0, lane));
}

/** Avance de la puerta entre 0 (acaba de entrar) y 1 (alcanza al corredor). */
export function gateProgress(state: LaneRunnerState): number {
  const total = gateDurationMs(state.roundIndex);
  return Math.min(1, Math.max(0, 1 - state.remainingMs / total));
}

/** Avance de salida de la puerta respondida, entre 0 y 1. */
export function exitProgress(state: LaneRunnerState): number {
  if (state.exitingMs <= 0) return 1;
  return 1 - state.exitingMs / EXIT_MS;
}

export function currentRound(
  state: LaneRunnerState,
  rounds: readonly GameRound[],
): GameRound | undefined {
  return rounds[state.roundIndex];
}
