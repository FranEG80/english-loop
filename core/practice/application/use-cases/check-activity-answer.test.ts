import { describe, expect, it } from "vitest";
import { checkActivityAnswer } from "./check-activity-answer";
import { catalogActivity } from "@/test/support/activity-fixtures";
import type { Activity } from "@/core/content/domain/types/activity";

function catalogWith(activity: Activity | null) {
  return {
    getActivityById: async () => activity,
    listActivities: async () => [],
    countActivitiesByNode: async () => 0,
    countActivitiesByNodes: async () => 0,
  };
}

describe("checkActivityAnswer", () => {
  it("corrige una respuesta acertada", async () => {
    const feedback = await checkActivityAnswer(catalogWith(catalogActivity()), {
      activityId: "b1-demo-001",
      response: { kind: "gaps", value: [{ gapId: "gap1", text: "ticket" }] },
    });

    expect(feedback).toMatchObject({ isCorrect: true, score: 1 });
    expect(feedback.explanation).toContain("return ticket");
  });

  it("devuelve el desglose por hueco cuando falla", async () => {
    const feedback = await checkActivityAnswer(catalogWith(catalogActivity()), {
      activityId: "b1-demo-001",
      response: { kind: "gaps", value: [{ gapId: "gap1", text: "bus" }] },
    });

    expect(feedback.isCorrect).toBe(false);
    expect(feedback.items).toEqual([
      expect.objectContaining({ itemId: "gap1", given: "bus", isCorrect: false }),
    ]);
  });

  it("no registra intento: no hay identificador ni repaso programado", async () => {
    const feedback = await checkActivityAnswer(catalogWith(catalogActivity()), {
      activityId: "b1-demo-001",
      response: { kind: "gaps", value: [{ gapId: "gap1", text: "ticket" }] },
    });

    expect(feedback.attemptId).toBe("preview");
    expect(feedback.nextReviewAt).toBeNull();
  });

  // Regresión: las opciones se numeran dentro de cada ronda, así que las ocho
  // rondas repiten los ids `a`, `b`, `c`. Con un único mapa de opciones la
  // última ronda pisaba a las demás y el resumen daba la misma respuesta
  // correcta en todas.
  it("resuelve las opciones de un minijuego dentro de su propia ronda", async () => {
    const rounds = [
      {
        id: "r1",
        prompt: "Ronda 1",
        options: [
          { id: "a", text: "do exercise" },
          { id: "b", text: "make exercise" },
        ],
        explanation: "«Do exercise».",
      },
      {
        id: "r2",
        prompt: "Ronda 2",
        options: [
          { id: "a", text: "take a photo" },
          { id: "b", text: "make a photo" },
        ],
        explanation: "«Take a photo».",
      },
    ];
    const activity = {
      ...catalogActivity(),
      rounds,
      game: "frog_leap" as const,
      evaluator: {
        strategy: "game_rounds" as const,
        rounds: [
          { roundId: "r1", correctOptionId: "a" },
          { roundId: "r2", correctOptionId: "a" },
        ],
      },
    } as unknown as Activity;

    const feedback = await checkActivityAnswer(catalogWith(activity), {
      activityId: "b1-demo-001",
      response: {
        kind: "rounds",
        value: [
          { roundId: "r1", optionId: "b" },
          { roundId: "r2", optionId: "a" },
        ],
      },
    });

    expect(feedback.score).toBe(0.5);
    expect(feedback.items).toEqual([
      expect.objectContaining({
        itemId: "r1",
        label: "Ronda 1",
        given: "make exercise",
        expected: ["do exercise"],
        isCorrect: false,
      }),
      expect.objectContaining({
        itemId: "r2",
        label: "Ronda 2",
        given: "take a photo",
        expected: ["take a photo"],
        isCorrect: true,
      }),
    ]);
  });

  // Regresión: el desglose enseñaba «t4 t3 t2 t1» en vez de la frase.
  it("traduce los ids de token de word_order a la frase", async () => {
    const activity = {
      ...catalogActivity(),
      tokens: [
        { id: "t1", text: "I saw" },
        { id: "t2", text: "a cat" },
      ],
      evaluator: {
        strategy: "ordered_tokens" as const,
        correctTokenIds: ["t1", "t2"],
      },
    } as unknown as Activity;

    const feedback = await checkActivityAnswer(catalogWith(activity), {
      activityId: "b1-demo-001",
      response: { kind: "ordered_list", value: ["t2", "t1"] },
    });

    expect(feedback.correctAnswer).toBe("I saw a cat");
    expect(feedback.items[0]).toMatchObject({
      given: "a cat I saw",
      expected: ["I saw a cat"],
    });
  });

  it("falla si la actividad no existe", async () => {
    await expect(
      checkActivityAnswer(catalogWith(null), {
        activityId: "missing",
        response: { kind: "text", value: "x" },
      }),
    ).rejects.toMatchObject({ message: "Activity not found: missing" });
  });
});
