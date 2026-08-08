import {
  POINTS_PER_HIT,
  STREAK_BONUS,
  STREAK_LENGTH,
  createCoreState,
  recordAnswer,
  type GameCoreState,
  type GameInput,
  type GameMachine,
  type GameRound,
} from "../engine/types";

/**
 * Salto de nenúfar. La rana está en la orilla y hay un nenúfar por opción.
 * Al elegir uno, salta describiendo un arco; cuando aterriza empieza la
 * siguiente ronda.
 *
 * Toda la lógica es pura y determinista: mismas entradas, mismo estado. Es lo
 * que permite testearla sin canvas y lo que hace que una partida se pueda
 * repetir igual.
 */

/** Duración del salto en milisegundos. */
export const JUMP_MS = 520;
/**
 * Pausa tras aterrizar antes de plantear la ronda siguiente. Sin ella el
 * enunciado cambia en el mismo fotograma en que la rana toca el nenúfar y no
 * da tiempo a leer qué se preguntaba.
 */
export const SETTLE_MS = 900;

export interface FrogLeapState extends GameCoreState {
  /** Nenúfar elegido en la ronda actual, o null si aún no ha saltado. */
  targetLane: number | null;
  /** Progreso del salto entre 0 y 1. */
  jumpProgress: number;
  /** Nenúfar sobre el que descansa la rana. */
  restingLane: number;
  /** Milisegundos que quedan de pausa de lectura tras aterrizar. */
  settleMs: number;
}

function createState(): FrogLeapState {
  return { ...createCoreState(), targetLane: null, jumpProgress: 0, restingLane: 1, settleMs: 0 };
}

export const frogLeapMachine: GameMachine<FrogLeapState> = {
  create: () => createState(),

  tick(state, deltaMs, rounds) {
    // Pausa de lectura: la rana ya ha aterrizado y se muestra el resultado.
    if (state.settleMs > 0) {
      const settleMs = Math.max(0, state.settleMs - deltaMs);
      return { ...state, settleMs, elapsedMs: state.elapsedMs + deltaMs };
    }

    if (state.phase !== "resolving" || state.targetLane === null) {
      return { ...state, elapsedMs: state.elapsedMs + deltaMs };
    }

    const elapsed = state.elapsedMs + deltaMs;
    const progress = Math.min(1, elapsed / JUMP_MS);
    if (progress < 1) {
      return { ...state, elapsedMs: elapsed, jumpProgress: progress };
    }

    // Aterrizaje: se confirma la elección y arranca la ronda siguiente.
    const round = rounds[state.roundIndex];
    const option = round?.options[state.targetLane];
    if (!option) return { ...state, phase: "finished" };

    const streak = state.streak + 1;
    const bonus = streak > 0 && streak % STREAK_LENGTH === 0 ? STREAK_BONUS : 0;
    const advanced = recordAnswer(
      { ...state, streak, score: state.score + POINTS_PER_HIT + bonus },
      rounds,
      option.id,
    );

    return {
      ...advanced,
      targetLane: null,
      jumpProgress: 0,
      // La rana se queda en el nenúfar al que saltó; son los nenúfares los que
      // bajan y entran nuevos por arriba en la ronda siguiente.
      restingLane: state.targetLane,
      settleMs: advanced.phase === "finished" ? 0 : SETTLE_MS,
    };
  },

  handle(state, input, rounds) {
    if (state.phase !== "playing" || state.settleMs > 0) return state;

    const round = rounds[state.roundIndex];
    if (!round) return state;

    const lane = laneFromInput(input, round.options.length);
    if (lane === null) return state;

    return {
      ...state,
      phase: "resolving",
      targetLane: lane,
      jumpProgress: 0,
      elapsedMs: 0,
      settleMs: 0,
    };
  },
};

function laneFromInput(input: GameInput, laneCount: number): number | null {
  const lane =
    input.kind === "lane"
      ? input.lane
      : input.kind === "select"
        ? input.optionIndex
        : null;
  if (lane === null || !Number.isInteger(lane)) return null;
  return lane >= 0 && lane < laneCount ? lane : null;
}

/** Arco parabólico del salto: 0 en la orilla, 1 al aterrizar. */
export function jumpArc(progress: number): { x: number; y: number } {
  const clamped = Math.min(1, Math.max(0, progress));
  return { x: clamped, y: 4 * clamped * (1 - clamped) };
}

export function currentRound(
  state: FrogLeapState,
  rounds: readonly GameRound[],
): GameRound | undefined {
  return rounds[state.roundIndex];
}
