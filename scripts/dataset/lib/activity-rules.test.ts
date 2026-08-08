import { describe, expect, it } from "vitest";
import {
  sharesRoot,
  validateActivityRules,
  validateBatchRules,
} from "./activity-rules";
import type { Activity, ActivityBatch, Evaluator } from "./types";

const NORMALIZATION = {
  trim: true,
  collapseWhitespace: true,
  caseSensitive: false,
  ignoreTerminalPunctuation: true,
  normaliseApostrophes: true,
};

function makeActivity(overrides: Partial<Activity>): Activity {
  return {
    schemaVersion: "2.0.0",
    id: "b1-demo-001",
    status: "published",
    autoGradable: true,
    level: "B1",
    type: "gap_fill",
    skillFocus: "fill_blank",
    category: "vocabulary",
    topic: "b1-demo",
    subtopic: "b1-demo",
    taxonomyNodeIds: ["b1-demo"],
    difficulty: 2,
    instructions: "Complete the sentence with one word.",
    prompt: "Complete the sentence.",
    gapText: "I booked a return [gap1] to Leeds.",
    gapLayout: "sentence",
    lessonIds: ["b1-demo"],
    tags: ["b1", "demo"],
    estimatedSeconds: 30,
    evaluator: {
      strategy: "per_gap",
      gaps: [{ gapId: "gap1", answers: ["ticket"] }],
      normalization: NORMALIZATION,
    },
    explanation: "A return ticket incluye la ida y la vuelta.",
    ...overrides,
  };
}

function codes(activity: Activity): string[] {
  return validateActivityRules("demo.json", activity).map(({ code }) => code);
}

function makeBatch(activities: Activity[]): ActivityBatch {
  return {
    schemaVersion: "2.0.0",
    batchId: "b1-demo-001",
    level: "B1",
    category: "vocabulary",
    topic: "b1-demo",
    subtopic: "b1-demo",
    lessonId: "b1-demo",
    activityType: activities[0]!.type,
    activities,
  };
}

describe("marcadores de hueco", () => {
  it("acepta marcadores que casan con el evaluador", () => {
    expect(codes(makeActivity({}))).not.toContain("gap-marker-mismatch");
  });

  it("detecta un texto sin ningún marcador", () => {
    expect(codes(makeActivity({ gapText: "Sin hueco aquí." }))).toContain("gap-marker-missing");
  });

  it("detecta marcadores que no casan en orden con el evaluador", () => {
    const activity = makeActivity({
      gapText: "There is [gap2] apple and [gap1] banana.",
      evaluator: {
        strategy: "per_gap",
        gaps: [
          { gapId: "gap1", answers: ["an"] },
          { gapId: "gap2", answers: ["a"] },
        ],
        normalization: NORMALIZATION,
      },
    });

    expect(codes(activity)).toContain("gap-marker-mismatch");
  });
});

describe("respuesta visible en el enunciado", () => {
  it("detecta la respuesta escrita en el propio texto", () => {
    const activity = makeActivity({
      prompt: "Complete with the word ticket.",
      gapText: "I booked a return [gap1] to Leeds.",
    });

    expect(codes(activity)).toContain("answer-visible-in-prompt");
  });

  it("no se dispara con respuestas que no aparecen", () => {
    expect(codes(makeActivity({}))).not.toContain("answer-visible-in-prompt");
  });
});

describe("UoE Part 3 · word_formation", () => {
  /** Texto de Part 3: dos huecos, cada uno con su propia raíz. */
  function wordFormation(cueWord: string, answer: string): Activity {
    return makeActivity({
      type: "word_formation",
      skillFocus: "word_formation",
      gapText: "The report contains [gap1] evidence.\nIt was written [gap2].",
      evaluator: {
        strategy: "per_gap",
        gaps: [
          { gapId: "gap1", cueWord, answers: [answer] },
          { gapId: "gap2", cueWord: "CARE", answers: ["carefully"] },
        ],
        normalization: NORMALIZATION,
      },
    });
  }

  it("acepta una derivación válida", () => {
    expect(codes(wordFormation("CONVINCE", "convincing"))).toEqual([]);
  });

  it("rechaza la raíz sin derivar", () => {
    expect(codes(wordFormation("CONVINCE", "convince"))).toContain(
      "word-formation-answer-equals-cue",
    );
  });

  it("rechaza una respuesta de varias palabras", () => {
    expect(codes(wordFormation("CONVINCE", "very convincing"))).toContain(
      "word-formation-multi-word",
    );
  });

  it("rechaza una respuesta sin relación con la raíz", () => {
    expect(codes(wordFormation("CONVINCE", "helpful"))).toContain(
      "word-formation-unrelated-answer",
    );
  });

  it("exige una raíz en mayúsculas por hueco", () => {
    const activity = wordFormation("CONVINCE", "convincing");
    if (activity.evaluator.strategy === "per_gap") {
      delete activity.evaluator.gaps[0]!.cueWord;
    }
    expect(codes(activity)).toContain("word-formation-cue");
  });

  it("rechaza un hueco que admite dos palabras distintas", () => {
    const activity = wordFormation("USE", "usable");
    if (activity.evaluator.strategy === "per_gap") {
      activity.evaluator.gaps[0]!.answers = ["usable", "useful"];
    }
    expect(codes(activity)).toContain("word-formation-ambiguous-gap");
  });

  it("acepta singular y plural de la misma palabra", () => {
    const activity = wordFormation("DISCUSS", "discussion");
    if (activity.evaluator.strategy === "per_gap") {
      activity.evaluator.gaps[0]!.answers = ["discussion", "discussions"];
    }
    expect(codes(activity)).not.toContain("word-formation-ambiguous-gap");
  });

  it("rechaza un Part 3 de un solo hueco: es un texto, no una frase suelta", () => {
    const activity = wordFormation("CONVINCE", "convincing");
    if (activity.evaluator.strategy === "per_gap") {
      activity.evaluator.gaps = [activity.evaluator.gaps[0]!];
      activity.gapText = "The report contains [gap1] evidence.";
    }
    expect(codes(activity)).toContain("word-formation-single-gap");
  });
});

describe("sharesRoot", () => {
  it.each([
    ["convincing", "CONVINCE"],
    ["comparison", "COMPARE"],
    ["carefully", "CARE"],
    ["disagreement", "AGREE"],
    ["happiness", "HAPPY"],
  ])("reconoce %s como derivada de %s", (answer, cue) => {
    expect(sharesRoot(answer, cue)).toBe(true);
  });

  it("no relaciona palabras sin raíz común", () => {
    expect(sharesRoot("helpful", "CONVINCE")).toBe(false);
  });
});

describe("UoE Part 4 · key_word_transformation", () => {
  function keyWordTransformation(keyWord: string, answer: string): Activity {
    return makeActivity({
      type: "key_word_transformation",
      skillFocus: "key_word_transformation",
      keyWord,
      firstSentence: "I decided to stop smoking only 3 days ago.",
      gapText: "It was only 3 days ago that I made [gap1] smoking.",
      evaluator: {
        strategy: "per_gap",
        gaps: [{ gapId: "gap1", answers: [answer] }],
        normalization: NORMALIZATION,
      },
    });
  }

  it("acepta el ejemplo canónico de Cambridge", () => {
    expect(codes(keyWordTransformation("GIVE", "the decision to give up"))).toEqual([]);
  });

  it("rechaza una respuesta de más de cinco palabras", () => {
    expect(
      codes(keyWordTransformation("GIVE", "the firm decision that I would give up")),
    ).toContain("kwt-answer-length");
  });

  it("rechaza una respuesta de una sola palabra", () => {
    expect(codes(keyWordTransformation("GIVE", "give"))).toContain("kwt-answer-length");
  });

  it("rechaza las contracciones", () => {
    expect(codes(keyWordTransformation("GIVE", "didn't give up"))).toContain("kwt-contraction");
  });

  it("exige que la clave aparezca sin modificar", () => {
    expect(codes(keyWordTransformation("GIVE", "the decision to quit"))).toContain(
      "kwt-key-word-absent",
    );
  });

  it("exige la frase original", () => {
    const activity = keyWordTransformation("GIVE", "the decision to give up");
    delete activity.firstSentence;
    expect(codes(activity)).toContain("kwt-first-sentence");
  });

  it("exige exactamente un hueco", () => {
    const activity = keyWordTransformation("GIVE", "the decision to give up");
    activity.gapText = "It was [gap1] ago that I made [gap2] smoking.";
    expect(codes(activity)).toContain("kwt-gap-count");
  });
});

describe("reescrituras", () => {
  function rewrite(prompt: string, answer: string): Activity {
    return makeActivity({
      type: "error_correction",
      skillFocus: "error_correction",
      prompt,
      gapText: undefined,
      gapLayout: undefined,
      evaluator: { strategy: "exact_text", answer, normalization: NORMALIZATION },
    });
  }

  it("rechaza una respuesta idéntica al enunciado", () => {
    expect(codes(rewrite("She goes to work by bus.", "She goes to work by bus"))).toContain(
      "answer-equals-prompt",
    );
  });

  it("acepta una corrección real", () => {
    expect(codes(rewrite("She go to work by bus.", "She goes to work by bus"))).not.toContain(
      "answer-equals-prompt",
    );
  });

  it("avisa cuando solo se acepta una respuesta", () => {
    expect(codes(rewrite("She go to work by bus.", "She goes to work by bus"))).toContain(
      "single-accepted-answer",
    );
  });
});

describe("word_order", () => {
  it("exige que correctTokenIds cubra todos los fragmentos", () => {
    const activity = makeActivity({
      type: "word_order",
      skillFocus: "word_order",
      gapText: undefined,
      gapLayout: undefined,
      tokens: [
        { id: "t1", text: "I" },
        { id: "t2", text: "saw" },
        { id: "t3", text: "a cat." },
      ],
      evaluator: { strategy: "ordered_tokens", correctTokenIds: ["t1", "t2"] },
    });

    expect(codes(activity)).toContain("word-order-token-mismatch");
  });
});

describe("mini_game", () => {
  function miniGame(evaluator: Evaluator): Activity {
    return makeActivity({
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
      evaluator,
    });
  }

  it("exige que la opción correcta exista en su ronda", () => {
    const activity = miniGame({
      strategy: "game_rounds",
      rounds: [{ roundId: "r1", correctOptionId: "z" }],
    });

    expect(codes(activity)).toContain("game-missing-correct-option");
  });

  it("exige que toda ronda se corrija", () => {
    const activity = miniGame({
      strategy: "game_rounds",
      rounds: [{ roundId: "otra", correctOptionId: "a" }],
    });

    expect(codes(activity)).toContain("game-round-ungraded");
  });
});

describe("swipe_deck", () => {
  it("exige que toda carta se corrija", () => {
    const activity = makeActivity({
      type: "swipe_deck",
      skillFocus: "swipe_deck",
      gapText: undefined,
      gapLayout: undefined,
      cards: [
        { id: "c1", statement: "A shuttle links the clinics.", explanation: "Aparece en el texto." },
        { id: "c2", statement: "The shuttle is free.", explanation: "No se dice en el texto." },
      ],
      evaluator: { strategy: "deck_booleans", cards: [{ cardId: "c1", correct: true }] },
    });

    expect(codes(activity)).toContain("deck-card-ungraded");
  });
});

describe("reglas de lote", () => {
  function choice(id: string, correctIndex: number): Activity {
    const options = ["alpha", "beta", "gamma", "delta"].map((text, index) => ({
      id: String.fromCharCode(97 + index),
      text: `${text} ${id}`,
    }));
    return makeActivity({
      id,
      type: "single_choice",
      skillFocus: "single_choice",
      gapText: undefined,
      gapLayout: undefined,
      options,
      evaluator: { strategy: "single_option", correctOptionId: options[correctIndex]!.id },
    });
  }

  it("detecta el sesgo de posición cuando una posición concentra las respuestas", () => {
    const batch = makeBatch(
      Array.from({ length: 12 }, (_, index) => choice(`b1-demo-${index}`, 0)),
    );

    const issue = validateBatchRules("demo.json", batch).find(
      ({ code }) => code === "answer-position-bias",
    );
    expect(issue?.message).toContain("La posición A");
  });

  it("no se dispara con un reparto equilibrado", () => {
    const batch = makeBatch(
      Array.from({ length: 12 }, (_, index) => choice(`b1-demo-${index}`, index % 4)),
    );

    expect(validateBatchRules("demo.json", batch).map(({ code }) => code)).not.toContain(
      "answer-position-bias",
    );
  });

  it("ignora los lotes con muestra insuficiente", () => {
    const batch = makeBatch(Array.from({ length: 4 }, (_, index) => choice(`b1-demo-${index}`, 0)));

    expect(validateBatchRules("demo.json", batch)).toEqual([]);
  });

  it("respeta las opciones con orden significativo", () => {
    const batch = makeBatch(
      Array.from({ length: 12 }, (_, index) => ({
        ...choice(`b1-demo-${index}`, 0),
        optionsOrdered: true,
      })),
    );

    expect(validateBatchRules("demo.json", batch)).toEqual([]);
  });

  it("avisa del desequilibrio de verdadero/falso", () => {
    const batch = makeBatch(
      Array.from({ length: 10 }, (_, index) =>
        makeActivity({
          id: `b1-demo-tf-${index}`,
          type: "true_false",
          skillFocus: "true_false",
          gapText: undefined,
          gapLayout: undefined,
          evaluator: { strategy: "boolean", correct: true },
        }),
      ),
    );

    const issue = validateBatchRules("demo.json", batch).find(
      ({ code }) => code === "true-false-balance",
    );
    expect(issue?.severity).toBe("warning");
  });
});
