import type { MiniGameId, MiniGameRoundDto } from "@/core/models";

/**
 * Contrato común de los minijuegos. La lógica de cada juego vive en su
 * `machine.ts` como función pura `(state, event, dt) => state`, sin tocar el
 * canvas: es lo que se testea. `draw.ts` solo pinta.
 *
 * Los juegos NO corrigen: reciben las rondas sin la opción correcta y
 * devuelven la elección del jugador. La corrección la hace el servidor con la
 * estrategia `game_rounds`, igual que el resto de tipos.
 */

export interface GameRound {
  id: string;
  prompt: string;
  /** Frase de apoyo de la ronda; sin ella algunos enunciados no se entienden. */
  context?: string;
  options: Array<{ id: string; label: string }>;
}

export type GameInput =
  | { kind: "pointer"; x: number; y: number }
  | { kind: "lane"; lane: number }
  | { kind: "select"; optionIndex: number }
  | { kind: "confirm" };

/** Estado compartido por todos los juegos; cada uno lo extiende con el suyo. */
export interface GameCoreState {
  roundIndex: number;
  score: number;
  streak: number;
  answers: Array<{ roundId: string; optionId: string }>;
  phase: "idle" | "playing" | "resolving" | "finished";
  /** Milisegundos acumulados dentro de la fase actual. */
  elapsedMs: number;
}

export interface GameMachine<TState extends GameCoreState> {
  create(rounds: readonly GameRound[]): TState;
  /** Avanza el tiempo. Puro: no muta la entrada. */
  tick(state: TState, deltaMs: number, rounds: readonly GameRound[]): TState;
  /** Procesa una entrada del jugador. Puro. */
  handle(state: TState, input: GameInput, rounds: readonly GameRound[]): TState;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- el registro guarda
   módulos con estados distintos; cada uno es coherente consigo mismo. */
export interface GameModule<TState extends GameCoreState = any> {
  id: MiniGameId;
  rounds: { min: number; max: number };
  optionsPerRound: { min: number; max: number };
  /** Sprites que el juego usa. Si faltan, `sprites.ts` dibuja formas. */
  assets: readonly string[];
  machine: GameMachine<TState>;
  draw(context: CanvasRenderingContext2D, state: TState, view: GameView): void;
}

export interface GameView {
  width: number;
  height: number;
  rounds: readonly GameRound[];
  /** Verdadero cuando el usuario pidió menos movimiento. */
  reducedMotion: boolean;
}

export function toGameRounds(rounds: readonly MiniGameRoundDto[]): GameRound[] {
  return rounds.map((round) => ({
    id: round.id,
    prompt: round.prompt,
    ...(round.context ? { context: round.context } : {}),
    options: round.options.map(({ id, label }) => ({ id, label })),
  }));
}

/** Estado inicial común. */
export function createCoreState(): GameCoreState {
  return {
    roundIndex: 0,
    score: 0,
    streak: 0,
    answers: [],
    phase: "playing",
    elapsedMs: 0,
  };
}

/** Puntuación compartida: 10 por acierto y 5 de bonus por cadena de tres. */
export const POINTS_PER_HIT = 10;
export const STREAK_BONUS = 5;
export const STREAK_LENGTH = 3;

/**
 * Registra la elección de una ronda y avanza. No sabe si es correcta: la
 * puntuación en pantalla es provisional y el servidor manda.
 */
export function recordAnswer<TState extends GameCoreState>(
  state: TState,
  rounds: readonly GameRound[],
  optionId: string,
): TState {
  const round = rounds[state.roundIndex];
  if (!round || state.phase === "finished") return state;

  const answers = [...state.answers, { roundId: round.id, optionId }];
  const isLast = answers.length >= rounds.length;

  return {
    ...state,
    answers,
    roundIndex: isLast ? state.roundIndex : state.roundIndex + 1,
    phase: isLast ? "finished" : "playing",
    elapsedMs: 0,
  };
}
