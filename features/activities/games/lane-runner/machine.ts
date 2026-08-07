import {
  POINTS_PER_HIT,
  createCoreState,
  recordAnswer,
  type GameCoreState,
  type GameInput,
  type GameMachine,
  type GameRound,
} from "../engine/types";

/**
 * Carrera de carriles. El corredor avanza y cada puerta lleva una opción por
 * carril; hay que estar en el carril correcto al cruzarla. El tiempo de
 * reacción baja con cada ronda, pero nunca por debajo de `MIN_GATE_MS`.
 *
 * Si el tiempo se agota, la ronda se responde con el carril en el que esté el
 * corredor. Nunca se corta la actividad: todas las rondas producen respuesta y
 * se explican al final.
 */

export const FIRST_GATE_MS = 4200;
export const MIN_GATE_MS = 1800;
export const SPEED_UP_MS = 250;

export interface LaneRunnerState extends GameCoreState {
  /** Carril en el que corre ahora mismo. */
  lane: number;
  /** Milisegundos restantes hasta cruzar la puerta. */
  remainingMs: number;
  /** Rondas que se resolvieron por tiempo agotado. */
  timedOut: number;
}

export function gateDurationMs(roundIndex: number): number {
  return Math.max(MIN_GATE_MS, FIRST_GATE_MS - roundIndex * SPEED_UP_MS);
}

function createState(): LaneRunnerState {
  return {
    ...createCoreState(),
    lane: 1,
    remainingMs: gateDurationMs(0),
    timedOut: 0,
  };
}

export const laneRunnerMachine: GameMachine<LaneRunnerState> = {
  create: () => createState(),

  tick(state, deltaMs, rounds) {
    if (state.phase !== "playing") return state;

    const remaining = state.remainingMs - deltaMs;
    if (remaining > 0) {
      return { ...state, remainingMs: remaining, elapsedMs: state.elapsedMs + deltaMs };
    }

    // Tiempo agotado: cuenta el carril actual.
    const round = rounds[state.roundIndex];
    const option = round?.options[clampLane(state.lane, round.options.length)];
    if (!option) return { ...state, phase: "finished" };

    const advanced = recordAnswer(
      { ...state, streak: 0, timedOut: state.timedOut + 1 },
      rounds,
      option.id,
    );
    return {
      ...advanced,
      lane: state.lane,
      remainingMs: gateDurationMs(advanced.roundIndex),
    };
  },

  handle(state, input, rounds) {
    if (state.phase !== "playing") return state;
    const round = rounds[state.roundIndex];
    if (!round) return state;

    const laneCount = round.options.length;

    if (input.kind === "lane" || input.kind === "select") {
      const lane = input.kind === "lane" ? input.lane : input.optionIndex;
      return { ...state, lane: clampLane(lane, laneCount) };
    }

    if (input.kind !== "confirm") return state;

    const option = round.options[clampLane(state.lane, laneCount)];
    if (!option) return state;

    const advanced = recordAnswer(
      { ...state, streak: state.streak + 1, score: state.score + POINTS_PER_HIT + timeBonus(state) },
      rounds,
      option.id,
    );
    return {
      ...advanced,
      lane: state.lane,
      remainingMs: gateDurationMs(advanced.roundIndex),
    };
  },
};

/** Un punto por cada medio segundo que sobra, hasta cinco. */
function timeBonus(state: LaneRunnerState): number {
  return Math.min(5, Math.max(0, Math.floor(state.remainingMs / 500)));
}

export function clampLane(lane: number, laneCount: number): number {
  if (!Number.isInteger(lane)) return 0;
  return Math.min(laneCount - 1, Math.max(0, lane));
}

export function currentRound(
  state: LaneRunnerState,
  rounds: readonly GameRound[],
): GameRound | undefined {
  return rounds[state.roundIndex];
}
