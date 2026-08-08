import { describe, expect, it } from "vitest";
import {
  EXIT_MS,
  FIRST_GATE_MS,
  MIN_GATE_MS,
  clampLane,
  exitProgress,
  gateDurationMs,
  gateProgress,
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

/** Deja que la puerta llegue al corredor. */
function arrive(state: ReturnType<typeof laneRunnerMachine.create>) {
  return laneRunnerMachine.tick(state, state.remainingMs, rounds);
}

describe("laneRunnerMachine", () => {
  it("arranca en el carril central con el tiempo de la primera puerta", () => {
    const state = laneRunnerMachine.create(rounds);
    expect(state.lane).toBe(1);
    expect(state.remainingMs).toBe(FIRST_GATE_MS);
  });

  it("cambiar de carril no responde: solo mueve al corredor", () => {
    const moved = laneRunnerMachine.handle(
      laneRunnerMachine.create(rounds),
      { kind: "lane", lane: 2 },
      rounds,
    );

    expect(moved.lane).toBe(2);
    expect(moved.answers).toEqual([]);
    expect(moved.remainingMs).toBe(FIRST_GATE_MS);
  });

  it("confirmar no adelanta la puerta", () => {
    const state = laneRunnerMachine.create(rounds);
    expect(laneRunnerMachine.handle(state, { kind: "confirm" }, rounds)).toBe(state);
  });

  it("permite cambiar de opinión hasta que la puerta llega", () => {
    let state = laneRunnerMachine.handle(
      laneRunnerMachine.create(rounds),
      { kind: "lane", lane: 0 },
      rounds,
    );
    state = laneRunnerMachine.tick(state, FIRST_GATE_MS / 2, rounds);
    state = laneRunnerMachine.handle(state, { kind: "lane", lane: 2 }, rounds);
    state = arrive(state);

    expect(state.answers).toEqual([{ roundId: "r1", optionId: "c" }]);
  });

  it("fija el carril en el que está el corredor cuando la puerta llega", () => {
    const state = arrive(laneRunnerMachine.create(rounds));

    expect(state.answers).toEqual([{ roundId: "r1", optionId: "b" }]);
    expect(state.roundIndex).toBe(1);
  });

  it("la puerta respondida sigue saliendo mientras entra la siguiente", () => {
    const state = arrive(laneRunnerMachine.create(rounds));

    expect(state.exitingMs).toBe(EXIT_MS);
    expect(state.exitingRoundIndex).toBe(0);
    expect(state.exitingLane).toBe(1);
    // La puerta nueva ya está en marcha: no hay pantalla vacía entre rondas.
    expect(state.remainingMs).toBe(gateDurationMs(1));
    expect(exitProgress(state)).toBe(0);
    expect(exitProgress(laneRunnerMachine.tick(state, EXIT_MS, rounds))).toBe(1);
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

  it("acelera cada ronda sin bajar del mínimo de reacción", () => {
    expect(gateDurationMs(0)).toBe(FIRST_GATE_MS);
    expect(gateDurationMs(1)).toBeLessThan(gateDurationMs(0));
    expect(gateDurationMs(50)).toBe(MIN_GATE_MS);
  });

  it("el avance de la puerta va de cero a uno", () => {
    const state = laneRunnerMachine.create(rounds);
    expect(gateProgress(state)).toBe(0);
    expect(gateProgress(laneRunnerMachine.tick(state, FIRST_GATE_MS / 2, rounds))).toBeCloseTo(
      0.5,
      1,
    );
  });

  it("termina cuando se responden todas las rondas", () => {
    const state = arrive(arrive(laneRunnerMachine.create(rounds)));

    expect(state.phase).toBe("finished");
    expect(state.answers).toHaveLength(2);
  });

  it("es determinista: mismas entradas, mismo estado", () => {
    const run = () => {
      let state = laneRunnerMachine.create(rounds);
      state = laneRunnerMachine.handle(state, { kind: "lane", lane: 0 }, rounds);
      return arrive(state);
    };

    expect(run()).toEqual(run());
  });

  it("no muta el estado de entrada", () => {
    const state = laneRunnerMachine.create(rounds);
    const snapshot = structuredClone(state);
    laneRunnerMachine.handle(state, { kind: "lane", lane: 2 }, rounds);
    expect(state).toEqual(snapshot);
  });
});
