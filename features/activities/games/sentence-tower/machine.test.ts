import { describe, expect, it } from "vitest";
import {
  CRANE_SWEEP_MS,
  DROP_MS,
  SETTLE_MS,
  dropEase,
  sentenceTowerMachine,
} from "./machine";
import type { GameRound } from "../engine/types";

const rounds: GameRound[] = [
  {
    id: "r1",
    prompt: "Ronda 1",
    options: [
      { id: "a", label: "first" },
      { id: "b", label: "second" },
      { id: "c", label: "third" },
    ],
  },
  {
    id: "r2",
    prompt: "Ronda 2",
    options: [
      { id: "a", label: "alpha" },
      { id: "b", label: "beta" },
    ],
  },
];

function advance(state: ReturnType<typeof sentenceTowerMachine.create>, ms: number) {
  let next = state;
  for (let elapsed = 0; elapsed < ms; elapsed += 16) {
    next = sentenceTowerMachine.tick(next, 16, rounds);
  }
  return next;
}

describe("sentenceTowerMachine", () => {
  it("empieza jugando, sin bloques y con la torre vacía", () => {
    const state = sentenceTowerMachine.create(rounds);

    expect(state).toMatchObject({
      phase: "playing",
      roundIndex: 0,
      placed: [],
      droppingIndex: null,
    });
  });

  it("la grúa pasea de un lado a otro sin salirse", () => {
    let state = sentenceTowerMachine.create(rounds);
    for (let step = 0; step < 400; step += 1) {
      state = sentenceTowerMachine.tick(state, 16, rounds);
      expect(state.craneAt).toBeGreaterThanOrEqual(0);
      expect(state.craneAt).toBeLessThanOrEqual(1);
    }
  });

  it("la grúa cambia de sentido en los extremos", () => {
    const state = advance(sentenceTowerMachine.create(rounds), CRANE_SWEEP_MS + 200);

    expect(state.craneDirection).toBe(-1);
  });

  it("elegir un bloque lo pone a caer", () => {
    const state = sentenceTowerMachine.handle(
      sentenceTowerMachine.create(rounds),
      { kind: "select", optionIndex: 2 },
      rounds,
    );

    expect(state).toMatchObject({ phase: "resolving", droppingIndex: 2, dropProgress: 0 });
  });

  it("ignora un bloque que no existe en la ronda", () => {
    const initial = sentenceTowerMachine.create(rounds);

    expect(
      sentenceTowerMachine.handle(initial, { kind: "select", optionIndex: 7 }, rounds),
    ).toBe(initial);
    expect(
      sentenceTowerMachine.handle(initial, { kind: "lane", lane: -1 }, rounds),
    ).toBe(initial);
  });

  it("al posarse apila el bloque, registra la respuesta y avanza de ronda", () => {
    let state = sentenceTowerMachine.handle(
      sentenceTowerMachine.create(rounds),
      { kind: "select", optionIndex: 1 },
      rounds,
    );
    state = advance(state, DROP_MS + 32);

    expect(state.placed).toEqual(["second"]);
    expect(state.answers).toEqual([{ roundId: "r1", optionId: "b" }]);
    expect(state.roundIndex).toBe(1);
    expect(state.settleMs).toBeGreaterThan(0);
  });

  it("no acepta otra elección durante la pausa de lectura", () => {
    let state = sentenceTowerMachine.handle(
      sentenceTowerMachine.create(rounds),
      { kind: "select", optionIndex: 0 },
      rounds,
    );
    state = advance(state, DROP_MS + 32);

    expect(
      sentenceTowerMachine.handle(state, { kind: "select", optionIndex: 1 }, rounds),
    ).toBe(state);
  });

  it("termina la partida al colocar el último bloque", () => {
    let state = sentenceTowerMachine.create(rounds);
    for (const optionIndex of [0, 1]) {
      state = sentenceTowerMachine.handle(state, { kind: "select", optionIndex }, rounds);
      state = advance(state, DROP_MS + SETTLE_MS + 64);
    }

    expect(state.phase).toBe("finished");
    expect(state.answers).toEqual([
      { roundId: "r1", optionId: "a" },
      { roundId: "r2", optionId: "b" },
    ]);
    expect(state.placed).toEqual(["first", "beta"]);
  });

  it("es determinista: mismas entradas, mismo estado", () => {
    const play = () => {
      let state = sentenceTowerMachine.create(rounds);
      state = sentenceTowerMachine.handle(state, { kind: "select", optionIndex: 2 }, rounds);
      return advance(state, DROP_MS + 32);
    };

    expect(play()).toEqual(play());
  });

  it("la caída va de cero a uno y no se pasa", () => {
    expect(dropEase(0)).toBe(0);
    expect(dropEase(1)).toBeCloseTo(1, 5);
    for (let step = 0; step <= 20; step += 1) {
      const value = dropEase(step / 20);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
