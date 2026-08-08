import { describe, expect, it } from "vitest";
import { JUMP_MS, SETTLE_MS, frogLeapMachine, jumpArc } from "./machine";
import type { GameRound } from "../engine/types";

const rounds: GameRound[] = [
  {
    id: "r1",
    prompt: "Which one means «to wake up»?",
    options: [
      { id: "a", label: "get up" },
      { id: "b", label: "get over" },
      { id: "c", label: "get by" },
    ],
  },
  {
    id: "r2",
    prompt: "Which one means «to postpone»?",
    options: [
      { id: "a", label: "put off" },
      { id: "b", label: "put on" },
      { id: "c", label: "put up" },
    ],
  },
];

/** Salta al carril indicado, aterriza y agota la pausa de lectura. */
function leap(state: ReturnType<typeof frogLeapMachine.create>, lane: number) {
  const jumping = frogLeapMachine.handle(state, { kind: "lane", lane }, rounds);
  const landed = frogLeapMachine.tick(jumping, JUMP_MS, rounds);
  return frogLeapMachine.tick(landed, SETTLE_MS, rounds);
}

describe("frogLeapMachine", () => {
  it("empieza en la primera ronda sin respuestas", () => {
    const state = frogLeapMachine.create(rounds);
    expect(state.roundIndex).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.phase).toBe("playing");
  });

  it("registra la opción del nenúfar elegido al aterrizar", () => {
    const state = leap(frogLeapMachine.create(rounds), 1);

    expect(state.answers).toEqual([{ roundId: "r1", optionId: "b" }]);
    expect(state.roundIndex).toBe(1);
    expect(state.phase).toBe("playing");
  });

  it("no responde hasta que el salto termina", () => {
    const jumping = frogLeapMachine.handle(
      frogLeapMachine.create(rounds),
      { kind: "lane", lane: 0 },
      rounds,
    );
    const midAir = frogLeapMachine.tick(jumping, JUMP_MS / 2, rounds);

    expect(midAir.phase).toBe("resolving");
    expect(midAir.answers).toEqual([]);
    expect(midAir.jumpProgress).toBeCloseTo(0.5, 1);
  });

  it("da tiempo a leer el resultado antes de la ronda siguiente", () => {
    const jumping = frogLeapMachine.handle(
      frogLeapMachine.create(rounds),
      { kind: "lane", lane: 0 },
      rounds,
    );
    const landed = frogLeapMachine.tick(jumping, JUMP_MS, rounds);

    expect(landed.settleMs).toBe(SETTLE_MS);
    // Durante la pausa no se admite otro salto.
    expect(frogLeapMachine.handle(landed, { kind: "lane", lane: 2 }, rounds)).toBe(landed);
    expect(frogLeapMachine.tick(landed, SETTLE_MS, rounds).settleMs).toBe(0);
  });

  it("la rana se queda en el nenúfar al que saltó", () => {
    const state = leap(frogLeapMachine.create(rounds), 2);
    expect(state.restingLane).toBe(2);
  });

  it("ignora las entradas durante el salto", () => {
    const jumping = frogLeapMachine.handle(
      frogLeapMachine.create(rounds),
      { kind: "lane", lane: 0 },
      rounds,
    );
    const ignored = frogLeapMachine.handle(jumping, { kind: "lane", lane: 2 }, rounds);

    expect(ignored.targetLane).toBe(0);
  });

  it("ignora los carriles fuera de rango", () => {
    const state = frogLeapMachine.create(rounds);
    expect(frogLeapMachine.handle(state, { kind: "lane", lane: 9 }, rounds)).toBe(state);
    expect(frogLeapMachine.handle(state, { kind: "lane", lane: -1 }, rounds)).toBe(state);
  });

  it("termina cuando se responden todas las rondas", () => {
    const finished = leap(leap(frogLeapMachine.create(rounds), 0), 2);

    expect(finished.phase).toBe("finished");
    expect(finished.answers).toEqual([
      { roundId: "r1", optionId: "a" },
      { roundId: "r2", optionId: "c" },
    ]);
  });

  it("da bonus al completar una cadena de tres", () => {
    const three: GameRound[] = [rounds[0]!, rounds[1]!, { ...rounds[0]!, id: "r3" }];
    let state = frogLeapMachine.create(three);
    for (let index = 0; index < 3; index += 1) {
      const jumping = frogLeapMachine.handle(state, { kind: "lane", lane: 0 }, three);
      const landed = frogLeapMachine.tick(jumping, JUMP_MS, three);
      state = frogLeapMachine.tick(landed, SETTLE_MS, three);
    }

    // 3 aciertos × 10 puntos + 5 de bonus por la cadena.
    expect(state.score).toBe(35);
  });

  it("es determinista: mismas entradas, mismo estado", () => {
    const first = leap(leap(frogLeapMachine.create(rounds), 1), 0);
    const second = leap(leap(frogLeapMachine.create(rounds), 1), 0);
    expect(second).toEqual(first);
  });

  it("no muta el estado de entrada", () => {
    const state = frogLeapMachine.create(rounds);
    const snapshot = structuredClone(state);
    frogLeapMachine.handle(state, { kind: "lane", lane: 1 }, rounds);
    expect(state).toEqual(snapshot);
  });
});

describe("jumpArc", () => {
  it("empieza y acaba a ras de agua", () => {
    expect(jumpArc(0)).toEqual({ x: 0, y: 0 });
    expect(jumpArc(1)).toEqual({ x: 1, y: 0 });
  });

  it("alcanza el punto más alto a mitad de salto", () => {
    expect(jumpArc(0.5).y).toBe(1);
  });

  it("acota el progreso fuera de rango", () => {
    expect(jumpArc(-1)).toEqual({ x: 0, y: 0 });
    expect(jumpArc(2)).toEqual({ x: 1, y: 0 });
  });
});
