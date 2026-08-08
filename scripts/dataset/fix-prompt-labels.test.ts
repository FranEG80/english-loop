import { describe, expect, it } from "vitest";
import { fixBatch } from "./fix-prompt-labels";
import type { ActivityBatch } from "./lib/types";

function batchWith(activities: unknown[]): ActivityBatch {
  return {
    schemaVersion: "2.0.0",
    batchId: "b1-demo-single-choice-001",
    level: "B1",
    category: "collocations",
    topic: "b1-demo",
    subtopic: "b1-demo",
    lessonId: "b1-demo",
    activityType: "single_choice",
    activities,
  } as unknown as ActivityBatch;
}

const withFillerPrompt = {
  id: "b1-demo-cc-001",
  type: "single_choice",
  prompt: "Daily routine 001: Which phrase fits the context?",
  passage: "I finally decided to ___ today.",
  difficulty: 1,
};

describe("fixPromptLabels", () => {
  it("promueve el passage con hueco a prompt y elimina el passage", () => {
    const { batch, promoted } = fixBatch(batchWith([withFillerPrompt]));

    expect(promoted).toEqual(["b1-demo-cc-001"]);
    expect(batch.activities[0]).toMatchObject({
      prompt: "I finally decided to ___ today.",
    });
    expect(batch.activities[0]).not.toHaveProperty("passage");
  });

  it("conserva el orden de claves para no ensuciar el diff", () => {
    const { batch } = fixBatch(batchWith([withFillerPrompt]));

    expect(Object.keys(batch.activities[0] as object)).toEqual([
      "id",
      "type",
      "prompt",
      "difficulty",
    ]);
  });

  it("reconoce también el marcador [gapN]", () => {
    const { promoted } = fixBatch(
      batchWith([{ ...withFillerPrompt, passage: "I decided to [gap1] today." }]),
    );

    expect(promoted).toEqual(["b1-demo-cc-001"]);
  });

  it("no toca un passage de lectura sin huecos", () => {
    const { batch, promoted } = fixBatch(
      batchWith([{ ...withFillerPrompt, passage: "Read the text and answer." }]),
    );

    expect(promoted).toEqual([]);
    expect(batch.activities[0]).toMatchObject({ passage: "Read the text and answer." });
  });

  it("no toca tipos que no son de opción", () => {
    const { promoted } = fixBatch(
      batchWith([{ ...withFillerPrompt, type: "gap_fill" }]),
    );

    expect(promoted).toEqual([]);
  });

  it("retira el prefijo numerado incrustado en el texto con huecos", () => {
    const { batch, unlabelled } = fixBatch(
      batchWith([
        {
          id: "b1-demo-fb-001",
          type: "gap_fill",
          gapText: "Complete the daily-life sentence 001: We share the [gap1] at weekends.",
        },
      ]),
    );

    expect(unlabelled).toEqual(["b1-demo-fb-001"]);
    expect(batch.activities[0]).toMatchObject({
      gapText: "We share the [gap1] at weekends.",
    });
  });

  it("no muerde una frase real que empiece por una cifra", () => {
    const { unlabelled } = fixBatch(
      batchWith([
        {
          id: "b1-demo-fb-002",
          type: "gap_fill",
          gapText: "In 1869 the line reached the coast. The journey [gap1] months.",
        },
      ]),
    );

    expect(unlabelled).toEqual([]);
  });

  it("no deja el enunciado vacío si la etiqueta era todo el texto", () => {
    const { batch } = fixBatch(
      batchWith([{ id: "b1-demo-fb-003", type: "gap_fill", gapText: "Sentence 001: " }]),
    );

    expect(batch.activities[0]).toMatchObject({ gapText: "Sentence 001: " });
  });

  it("es idempotente: la segunda pasada no cambia nada", () => {
    const first = fixBatch(batchWith([withFillerPrompt]));
    const second = fixBatch(first.batch);

    expect(second.promoted).toEqual([]);
    expect(second.unlabelled).toEqual([]);
    expect(second.batch).toEqual(first.batch);
  });
});
