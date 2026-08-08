import { describe, expect, it } from "vitest";
import { expandPairs, TARGET_PAIRS, type MatchingPair } from "./expand-matching";

const pool: MatchingPair[] = [
  { leftId: "a", left: "In my view", rightId: "x", right: "introduces an opinion" },
  { leftId: "a", left: "For example", rightId: "x", right: "introduces evidence" },
  { leftId: "a", left: "Title", rightId: "x", right: "names the main idea" },
  { leftId: "a", left: "Overall", rightId: "x", right: "summarises the view" },
  { leftId: "a", left: "because", rightId: "x", right: "gives a reason" },
];

const twoPairs = {
  id: "b1-writing-opinion-m-001",
  pairs: [
    { leftId: "a", left: "In my view", rightId: "x", right: "introduces an opinion" },
    { leftId: "b", left: "For example", rightId: "y", right: "introduces evidence" },
  ],
};

describe("expandMatching", () => {
  it("completa hasta cuatro parejas con el fondo de la lección", () => {
    const pairs = expandPairs(twoPairs, pool);

    expect(pairs).toHaveLength(TARGET_PAIRS);
    expect(pairs.map(({ left }) => left)).toEqual(
      expect.arrayContaining(["In my view", "For example"]),
    );
  });

  it("normaliza los ids para que las prestadas no choquen con las de casa", () => {
    const pairs = expandPairs(twoPairs, pool);

    expect(pairs.map(({ leftId }) => leftId)).toEqual(["l1", "l2", "l3", "l4"]);
    expect(pairs.map(({ rightId }) => rightId)).toEqual(["r1", "r2", "r3", "r4"]);
  });

  it("nunca repite un lado izquierdo ni uno derecho", () => {
    const pairs = expandPairs(twoPairs, pool);

    expect(new Set(pairs.map(({ left }) => left)).size).toBe(TARGET_PAIRS);
    expect(new Set(pairs.map(({ right }) => right)).size).toBe(TARGET_PAIRS);
  });

  it("es determinista: el mismo id recibe siempre el mismo relleno", () => {
    expect(expandPairs(twoPairs, pool)).toEqual(expandPairs(twoPairs, pool));
  });

  it("reparte distinto relleno a actividades distintas de la misma lección", () => {
    const other = { ...twoPairs, id: "b1-writing-opinion-m-007" };
    const borrowed = (activityId: { id: string; pairs: MatchingPair[] }) =>
      expandPairs(activityId, pool)
        .slice(2)
        .map(({ left }) => left)
        .join("|");

    expect(borrowed(twoPairs)).not.toBe(borrowed(other));
  });

  it("no toca una actividad que ya tiene cuatro parejas", () => {
    const full = { id: "x", pairs: pool.slice(0, 4) };

    expect(expandPairs(full, pool)).toBe(full.pairs);
  });

  it("es idempotente: la segunda pasada devuelve las mismas parejas", () => {
    const first = expandPairs(twoPairs, pool);
    const second = expandPairs({ id: twoPairs.id, pairs: first }, pool);

    expect(second).toBe(first);
  });

  it("deja la actividad como está si el fondo se queda corto", () => {
    const pairs = expandPairs(twoPairs, pool.slice(0, 2));

    expect(pairs).toHaveLength(2);
  });
});
