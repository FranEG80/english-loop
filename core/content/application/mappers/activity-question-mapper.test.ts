import { describe, expect, it } from "vitest";
import { ACTIVITY_TYPES } from "@/core/models";
import { toActivityQuestionDto } from "./activity-question-mapper";
import { catalogActivity, NORMALIZATION } from "@/test/support/activity-fixtures";

describe("toActivityQuestionDto", () => {
  it("nunca expone el evaluador, la respuesta ni la explicación", () => {
    const dto = toActivityQuestionDto(catalogActivity());
    const serialised = JSON.stringify(dto);

    expect(serialised).not.toContain("evaluator");
    expect(serialised).not.toContain("ticket");
    expect(serialised).not.toContain("explanation");
  });

  it("lleva siempre las instrucciones al cliente", () => {
    const dto = toActivityQuestionDto(catalogActivity());
    expect(dto.instructions).toBe("Complete the sentence with one word.");
  });

  it("segmenta el texto con huecos para pintarlos en línea", () => {
    const dto = toActivityQuestionDto(catalogActivity());
    if (dto.presentation !== "gap_fill") throw new Error("presentación inesperada");

    expect(dto.gapIds).toEqual(["gap1"]);
    expect(dto.segments).toEqual([
      { kind: "text", value: "I booked a return " },
      { kind: "gap", gapId: "gap1", position: 1 },
      { kind: "text", value: " to Leeds." },
    ]);
  });

  it("numera los huecos por orden de aparición", () => {
    const dto = toActivityQuestionDto(
      catalogActivity({
        gapText: "There is [gap1] apple and [gap2] banana.",
        evaluator: {
          strategy: "per_gap",
          gaps: [
            { gapId: "gap1", answers: ["an"] },
            { gapId: "gap2", answers: ["a"] },
          ],
          normalization: NORMALIZATION,
        },
      }),
    );
    if (dto.presentation !== "gap_fill") throw new Error("presentación inesperada");

    expect(dto.gapIds).toEqual(["gap1", "gap2"]);
    expect(dto.segments.filter((segment) => segment.kind === "gap")).toHaveLength(2);
  });

  it("conserva los turnos de un diálogo como líneas separadas", () => {
    const dto = toActivityQuestionDto(
      catalogActivity({
        skillFocus: "complete_dialogue",
        gapLayout: "dialogue",
        gapText: "A: Can you swim?\nB: Yes, [gap1].",
      }),
    );
    if (dto.presentation !== "gap_fill") throw new Error("presentación inesperada");

    expect(dto.layout).toBe("dialogue");
    expect(dto.segments).toContainEqual({ kind: "speaker", label: "A" });
    expect(dto.segments).toContainEqual({ kind: "break" });
  });

  it("pasa la raíz de UoE Part 3 en su campo", () => {
    const dto = toActivityQuestionDto(
      catalogActivity({ type: "word_formation", cueWord: "CONVINCE" }),
    );
    if (dto.presentation !== "gap_fill") throw new Error("presentación inesperada");

    expect(dto.cueWord).toBe("CONVINCE");
  });

  it("separa la frase original y la palabra clave en UoE Part 4", () => {
    const dto = toActivityQuestionDto(
      catalogActivity({
        type: "key_word_transformation",
        firstSentence: "I decided to stop smoking only 3 days ago.",
        keyWord: "GIVE",
        gapText: "It was only 3 days ago that I made [gap1] smoking.",
      }),
    );
    if (dto.presentation !== "key_word_transformation") {
      throw new Error("presentación inesperada");
    }

    expect(dto.firstSentence).toBe("I decided to stop smoking only 3 days ago.");
    expect(dto.keyWord).toBe("GIVE");
    expect(dto.maxWords).toBe(5);
  });

  describe("word_order", () => {
    const activity = catalogActivity({
      id: "b1-word-order-001",
      type: "word_order",
      skillFocus: "word_order",
      prompt: "I saw a cat in the garden.",
      gapText: undefined,
      gapLayout: undefined,
      tokens: [
        { id: "t1", text: "I saw" },
        { id: "t2", text: "a cat" },
        { id: "t3", text: "in" },
        { id: "t4", text: "the garden." },
      ],
      evaluator: { strategy: "ordered_tokens", correctTokenIds: ["t1", "t2", "t3", "t4"] },
    });

    it("baraja los fragmentos en vez de mandarlos resueltos", () => {
      const dto = toActivityQuestionDto(activity);
      if (dto.presentation !== "word_order") throw new Error("presentación inesperada");

      expect(dto.tokens.map((token) => token.id)).not.toEqual(["t1", "t2", "t3", "t4"]);
      expect(dto.tokens.map((token) => token.id).sort()).toEqual(["t1", "t2", "t3", "t4"]);
    });

    it("baraja de forma determinista: mismo id, mismo orden", () => {
      const first = toActivityQuestionDto(activity);
      const second = toActivityQuestionDto(activity);
      expect(second).toEqual(first);
    });

    it("no filtra la solución en el prompt", () => {
      const dto = toActivityQuestionDto(activity);
      expect(JSON.stringify(dto)).not.toContain("I saw a cat in the garden.");
    });
  });

  it("baraja la columna derecha de un matching", () => {
    const activity = catalogActivity({
      id: "b1-matching-001",
      type: "matching",
      skillFocus: "matching",
      gapText: undefined,
      gapLayout: undefined,
      pairs: [
        { leftId: "l1", left: "rely on", rightId: "r1", right: "depend" },
        { leftId: "l2", left: "insist on", rightId: "r2", right: "demand" },
        { leftId: "l3", left: "consist of", rightId: "r3", right: "be made up of" },
      ],
      evaluator: {
        strategy: "matching_pairs",
        pairs: [
          { leftId: "l1", rightId: "r1" },
          { leftId: "l2", rightId: "r2" },
          { leftId: "l3", rightId: "r3" },
        ],
      },
    });

    const dto = toActivityQuestionDto(activity);
    if (dto.presentation !== "matching") throw new Error("presentación inesperada");

    expect(dto.leftItems.map((item) => item.id)).toEqual(["l1", "l2", "l3"]);
    expect(dto.rightItems.map((item) => item.id)).not.toEqual(["r1", "r2", "r3"]);
    expect(dto.rightItems.map((item) => item.id).sort()).toEqual(["r1", "r2", "r3"]);
  });

  it("manda las rondas de un minijuego sin la opción correcta", () => {
    const dto = toActivityQuestionDto(
      catalogActivity({
        type: "mini_game",
        skillFocus: "mini_game",
        gapText: undefined,
        gapLayout: undefined,
        game: "frog_leap",
        rounds: [
          {
            id: "r1",
            prompt: "Which one means «to wake up»?",
            options: [
              { id: "a", text: "get up" },
              { id: "b", text: "get over" },
            ],
            explanation: "«Get up» es levantarse.",
          },
        ],
        evaluator: {
          strategy: "game_rounds",
          rounds: [{ roundId: "r1", correctOptionId: "a" }],
        },
      }),
    );
    if (dto.presentation !== "mini_game") throw new Error("presentación inesperada");

    expect(dto.game).toBe("frog_leap");
    expect(JSON.stringify(dto)).not.toContain("correctOptionId");
    expect(JSON.stringify(dto)).not.toContain("Es levantarse");
  });

  it("manda las cartas de un mazo sin su valor de verdad", () => {
    const dto = toActivityQuestionDto(
      catalogActivity({
        type: "swipe_deck",
        skillFocus: "swipe_deck",
        gapText: undefined,
        gapLayout: undefined,
        cards: [
          { id: "c1", statement: "A shuttle links the clinics.", explanation: "Está en el texto." },
        ],
        evaluator: {
          strategy: "deck_booleans",
          cards: [{ cardId: "c1", correct: true }],
        },
      }),
    );
    if (dto.presentation !== "swipe_deck") throw new Error("presentación inesperada");

    expect(dto.cards).toEqual([{ id: "c1", statement: "A shuttle links the clinics." }]);
    expect(JSON.stringify(dto)).not.toContain("correct");
  });

  it("asigna presentación a todos los tipos canónicos, sin ramas por defecto", () => {
    const overridesByType: Partial<Record<string, Parameters<typeof catalogActivity>[0]>> = {
      word_order: {
        tokens: [
          { id: "t1", text: "I" },
          { id: "t2", text: "agree" },
        ],
        evaluator: { strategy: "ordered_tokens", correctTokenIds: ["t1", "t2"] },
      },
      matching: {
        pairs: [
          { leftId: "l1", left: "a", rightId: "r1", right: "b" },
          { leftId: "l2", left: "c", rightId: "r2", right: "d" },
        ],
        evaluator: {
          strategy: "matching_pairs",
          pairs: [
            { leftId: "l1", rightId: "r1" },
            { leftId: "l2", rightId: "r2" },
          ],
        },
      },
      mini_game: { game: "frog_leap", rounds: [] },
    };

    for (const type of ACTIVITY_TYPES) {
      const dto = toActivityQuestionDto(
        catalogActivity({ type, skillFocus: type, ...overridesByType[type] }),
      );
      expect(dto.presentation, `tipo ${type}`).toBeTruthy();
      expect(dto.type).toBe(type);
    }
  });

  it("falla de forma explícita ante un tipo no migrado", () => {
    expect(() => toActivityQuestionDto(catalogActivity({ type: "fill_blank" }))).toThrow(
      /dataset:migrate-v2/u,
    );
  });
});
