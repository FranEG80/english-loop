import { describe, expect, it } from "vitest";
import {
  FIRST_GATE_MS,
  MIN_GATE_MS,
  clampLane,
  gateDurationMs,
  laneRunnerMachine,
} from "./machine";
import type { GameRound } from "../engine/types";

const rounds: GameRound[] = [
  {
    id: "r1",
    prompt: "Choose the correct preposition.",
    options: [
      { id: "a", label: "on" },
      { id: "b", label: "at" },
      { id: "c", label: "in" },
    ],
  },
  {
    id: "r2",
    prompt: "Choose the correct preposition.",
    options: [
      { id: "a", label: "for" },
      { id: "b", label: "since" },
      { id: "c", label: "during" },
    ],
  },
];

describe("laneRunnerMachine", () => {
  it("arranca en el carril central con el tiempo de la primera puerta", () => {
    const state = laneRunnerMachine.create(rounds);
    expect(state.lane).toBe(1);
    expect(state.remainingMs).toBe(FIRST_GATE_MS);
  });

  it("cambia de carril sin responder", () => {
    const moved = laneRunnerMachine.handle(
      laneRunnerMachine.create(rounds),
      { kind: "lane", lane: 2 },
      rounds,
    );

    expect(moved.lane).toBe(2);
    expect(moved.answers).toEqual([]);
  });

  it("responde con la opción del carril al confirmar", () => {
    let state = laneRunnerMachine.handle(
      laneRunnerMachine.create(rounds),
      { kind: "lane", lane: 2 },
      rounds,
    );
    state = laneRunnerMachine.handle(state, { kind: "confirm" }, rounds);

    expect(state.answers).toEqual([{ roundId: "r1", optionId: "c" }]);
    expect(state.roundIndex).toBe(1);
  });

  it("acota los carriles fuera de rango en vez de descartarlos", () => {
    const state = laneRunnerMachine.handle(
      laneRunnerMachine.create(rounds),
      { kind: "lane", lane: 99 },
      rounds,
    );
    expect(state.lane).toBe(2);
    expect(clampLane(-5, 3)).toBe(0);
  });

  it("responde con el carril actual cuando se agota el tiempo", () => {
    const state = laneRunnerMachine.tick(
      laneRunnerMachine.create(rounds),
      FIRST_GATE_MS + 1,
      rounds,
    );

    expect(state.answers).toEqual([{ roundId: "r1", optionId: "b" }]);
    expect(state.timedOut).toBe(1);
    expect(state.streak).toBe(0);
  });

  it("no corta la partida al agotarse el tiempo: sigue con la ronda siguiente", () => {
    let state = laneRunnerMachine.tick(laneRunnerMachine.create(rounds), FIRST_GATE_MS + 1, rounds);
    state = laneRunnerMachine.tick(state, gateDurationMs(1) + 1, rounds);

    expect(state.phase).toBe("finished");
    expect(state.answers).toHaveLength(2);
  });

  it("acelera cada ronda sin bajar del mínimo de reacción", () => {
    expect(gateDurationMs(0)).toBe(FIRST_GATE_MS);
    expect(gateDurationMs(1)).toBeLessThan(gateDurationMs(0));
    expect(gateDurationMs(50)).toBe(MIN_GATE_MS);
  });

  it("da bonus por el tiempo que sobra", () => {
    const quick = laneRunnerMachine.handle(
      laneRunnerMachine.create(rounds),
      { kind: "confirm" },
      rounds,
    );
    const slow = laneRunnerMachine.handle(
      { ...laneRunnerMachine.create(rounds), remainingMs: 100 },
      { kind: "confirm" },
      rounds,
    );

    expect(quick.score).toBeGreaterThan(slow.score);
  });

  it("es determinista: mismas entradas, mismo estado", () => {
    const run = () => {
      let state = laneRunnerMachine.create(rounds);
      state = laneRunnerMachine.handle(state, { kind: "lane", lane: 0 }, rounds);
      state = laneRunnerMachine.handle(state, { kind: "confirm" }, rounds);
      return laneRunnerMachine.tick(state, 500, rounds);
    };

    expect(run()).toEqual(run());
  });

  it("no muta el estado de entrada", () => {
    const state = laneRunnerMachine.create(rounds);
    const snapshot = structuredClone(state);
    laneRunnerMachine.handle(state, { kind: "confirm" }, rounds);
    expect(state).toEqual(snapshot);
  });
});
