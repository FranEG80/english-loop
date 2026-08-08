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
 * Torre de frases. Una grúa pasea los bloques de la ronda por encima de la
 * torre; al elegir uno, el bloque cae y se apila. Cada ronda añade un piso, así
 * que la torre es el historial visible de la partida.
 *
 * Comparte contrato con el resto de minijuegos —una opción por ronda y
 * corrección en el servidor con `game_rounds`—, así que un mismo item del
 * DATASET vale para cualquiera de los tres juegos.
 *
 * Toda la lógica es pura y determinista: mismas entradas, mismo estado.
 */

/** Duración de la caída de un bloque. */
export const DROP_MS = 460;
/** Pausa tras posarse antes de plantear la ronda siguiente. */
export const SETTLE_MS = 780;
/** Recorrido completo de la grúa de un extremo al otro. */
export const CRANE_SWEEP_MS = 2600;

export interface SentenceTowerState extends GameCoreState {
  /** Posición de la grúa entre 0 y 1, de izquierda a derecha. */
  craneAt: number;
  /** Sentido del paseo de la grúa. */
  craneDirection: 1 | -1;
  /** Bloque que está cayendo, o null si la grúa sigue paseando. */
  droppingIndex: number | null;
  /** Progreso de la caída entre 0 y 1. */
  dropProgress: number;
  /** Etiquetas ya apiladas, de abajo arriba. */
  placed: string[];
  /** Milisegundos que quedan de pausa de lectura tras posarse el bloque. */
  settleMs: number;
}

function createState(): SentenceTowerState {
  return {
    ...createCoreState(),
    craneAt: 0,
    craneDirection: 1,
    droppingIndex: null,
    dropProgress: 0,
    placed: [],
    settleMs: 0,
  };
}

/** Vaivén de la grúa. Se pliega en los extremos en vez de saltar al otro lado. */
function sweepCrane(
  state: SentenceTowerState,
  deltaMs: number,
): Pick<SentenceTowerState, "craneAt" | "craneDirection"> {
  const advanced = state.craneAt + (deltaMs / CRANE_SWEEP_MS) * state.craneDirection;
  if (advanced > 1) return { craneAt: 2 - advanced, craneDirection: -1 };
  if (advanced < 0) return { craneAt: -advanced, craneDirection: 1 };
  return { craneAt: advanced, craneDirection: state.craneDirection };
}

export const sentenceTowerMachine: GameMachine<SentenceTowerState> = {
  create: () => createState(),

  tick(state, deltaMs, rounds) {
    const elapsedMs = state.elapsedMs + deltaMs;

    // Pausa de lectura: el bloque ya está puesto y se ve la torre crecida.
    if (state.settleMs > 0) {
      return { ...state, settleMs: Math.max(0, state.settleMs - deltaMs), elapsedMs };
    }

    if (state.phase !== "resolving" || state.droppingIndex === null) {
      return { ...state, ...sweepCrane(state, deltaMs), elapsedMs };
    }

    const progress = Math.min(1, elapsedMs / DROP_MS);
    if (progress < 1) return { ...state, elapsedMs, dropProgress: progress };

    const round = rounds[state.roundIndex];
    const option = round?.options[state.droppingIndex];
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
      droppingIndex: null,
      dropProgress: 0,
      placed: [...state.placed, option.label],
      settleMs: advanced.phase === "finished" ? 0 : SETTLE_MS,
    };
  },

  handle(state, input, rounds) {
    if (state.phase !== "playing" || state.settleMs > 0) return state;

    const round = rounds[state.roundIndex];
    if (!round) return state;

    const index = blockFromInput(input, round.options.length);
    if (index === null) return state;

    return {
      ...state,
      phase: "resolving",
      droppingIndex: index,
      dropProgress: 0,
      elapsedMs: 0,
      settleMs: 0,
    };
  },
};

function blockFromInput(input: GameInput, blockCount: number): number | null {
  const index =
    input.kind === "lane"
      ? input.lane
      : input.kind === "select"
        ? input.optionIndex
        : null;
  if (index === null || !Number.isInteger(index)) return null;
  return index >= 0 && index < blockCount ? index : null;
}

/**
 * Caída con aceleración: el bloque coge velocidad y al final rebota un poco,
 * que es lo que hace que la torre parezca tener peso.
 */
export function dropEase(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped < 0.85) return (clamped / 0.85) ** 2;
  // Rebote corto en el último tramo.
  const bounce = (clamped - 0.85) / 0.15;
  return 1 - Math.sin(bounce * Math.PI) * 0.06;
}

export function currentRound(
  state: SentenceTowerState,
  rounds: readonly GameRound[],
): GameRound | undefined {
  return rounds[state.roundIndex];
}
