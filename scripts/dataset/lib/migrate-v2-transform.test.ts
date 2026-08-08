import { describe, expect, it } from "vitest";
import {
  countCambridgeWords,
  countGapMarkers,
  extractCue,
  hasContraction,
  hasMeaningfulOrder,
  looksLikeDialogue,
  normaliseGapMarkers,
  splitDialogueLines,
  transformActivity,
  type ActivityV1,
} from "./migrate-v2-transform";

const NORMALIZATION = {
  trim: true,
  collapseWhitespace: true,
  caseSensitive: false,
  ignoreTerminalPunctuation: true,
  normaliseApostrophes: true,
};

function makeV1(overrides: Partial<ActivityV1>): ActivityV1 {
  return {
    schemaVersion: "1.0.0",
    id: "b1-demo-fb-001",
    status: "published",
    autoGradable: true,
    level: "B1",
    type: "fill_blank",
    category: "vocabulary",
    topic: "b1-demo",
    subtopic: "b1-demo",
    taxonomyNodeIds: ["b1-demo"],
    difficulty: 2,
    instructions: "Complete the sentence with one word.",
    prompt: "I booked a return ___ to Leeds.",
    lessonIds: ["b1-demo"],
    tags: ["b1", "demo"],
    estimatedSeconds: 30,
    evaluator: { strategy: "exact_text", answer: "ticket", normalization: NORMALIZATION },
    explanation: "A return ticket incluye la ida y la vuelta.",
    ...overrides,
  };
}

describe("normaliseGapMarkers", () => {
  it("convierte cada ___ en un [gapN] correlativo", () => {
    const result = normaliseGapMarkers("There is ___ apple and ___ banana.");
    expect(result).toEqual({ text: "There is [gap1] apple and [gap2] banana.", count: 2 });
  });

  it("respeta los [gapN] que ya existen y no los duplica", () => {
    const result = normaliseGapMarkers("There is [gap1] apple and [gap2] banana.");
    expect(result.text).toBe("There is [gap1] apple and [gap2] banana.");
    expect(result.count).toBe(2);
  });

  it("cuenta cualquier racha de dos o más guiones bajos como un solo hueco", () => {
    expect(countGapMarkers("A ______ B")).toBe(1);
  });
});

describe("extractCue", () => {
  it("saca la raíz en mayúsculas y la borra del texto", () => {
    const result = extractCue("The report contains ___ evidence. (CONVINCE)");
    expect(result.cue).toBe("CONVINCE");
    expect(result.text).toBe("The report contains ___ evidence.");
  });

  it("deja el texto intacto cuando no hay cue", () => {
    expect(extractCue("No cue here.")).toEqual({ text: "No cue here.", cue: null });
  });
});

describe("recuento de palabras de UoE Part 4", () => {
  it("cuenta una palabra por token", () => {
    expect(countCambridgeWords("the decision to give up")).toBe(5);
  });

  it("cuenta las contracciones como las palabras que reemplazan", () => {
    expect(countCambridgeWords("didn't want to")).toBe(4);
    expect(countCambridgeWords("they've been")).toBe(3);
    expect(countCambridgeWords("it's raining")).toBe(3);
  });

  it("cuenta el posesivo como una sola palabra", () => {
    expect(countCambridgeWords("John's car")).toBe(2);
  });

  it("no separa las palabras con guion", () => {
    expect(countCambridgeWords("a well-known writer")).toBe(3);
  });

  it("detecta contracciones pero no posesivos", () => {
    expect(hasContraction("didn't want to")).toBe(true);
    expect(hasContraction("it's raining")).toBe(true);
    expect(hasContraction("John's car")).toBe(false);
    expect(hasContraction("the decision to give up")).toBe(false);
  });
});

describe("hasMeaningfulOrder", () => {
  it("protege las opciones de cierre", () => {
    const options = [
      { id: "a", text: "Monday" },
      { id: "b", text: "Tuesday" },
      { id: "c", text: "All of the above" },
    ];
    expect(hasMeaningfulOrder(options)).toBe(true);
  });

  it("protege una escala numérica monótona", () => {
    const options = [
      { id: "a", text: "10" },
      { id: "b", text: "20" },
      { id: "c", text: "30" },
    ];
    expect(hasMeaningfulOrder(options)).toBe(true);
  });

  it("protege horas en secuencia", () => {
    const options = [
      { id: "a", text: "7:30 a.m." },
      { id: "b", text: "9:00 a.m." },
      { id: "c", text: "11:15 a.m." },
    ];
    expect(hasMeaningfulOrder(options)).toBe(true);
  });

  it("protege una secuencia ordinal correlativa", () => {
    const options = [
      { id: "a", text: "1) Boil the water" },
      { id: "b", text: "2) Add the rice" },
      { id: "c", text: "3) Drain it" },
    ];
    expect(hasMeaningfulOrder(options)).toBe(true);
  });

  it("no protege opciones léxicas normales", () => {
    const options = [
      { id: "a", text: "get up" },
      { id: "b", text: "get over" },
      { id: "c", text: "get by" },
    ];
    expect(hasMeaningfulOrder(options)).toBe(false);
  });
});

describe("transformActivity", () => {
  it("convierte fill_blank en gap_fill con per_gap", () => {
    const { activity } = transformActivity(makeV1({}));

    expect(activity.schemaVersion).toBe("2.0.0");
    expect(activity.type).toBe("gap_fill");
    expect(activity.skillFocus).toBe("fill_blank");
    expect(activity.gapText).toBe("I booked a return [gap1] to Leeds.");
    expect(activity.gapLayout).toBe("sentence");
    expect(activity.evaluator).toEqual({
      strategy: "per_gap",
      gaps: [{ gapId: "gap1", answers: ["ticket"] }],
      normalization: NORMALIZATION,
    });
  });

  it("usa el passage como portador cuando el hueco está allí", () => {
    const { activity } = transformActivity(
      makeV1({
        type: "complete_paragraph",
        prompt: "Which article completes the paragraph?",
        passage: "On Saturday, I visited ___ small market near my flat.",
      }),
    );

    expect(activity.gapText).toBe("On Saturday, I visited [gap1] small market near my flat.");
    expect(activity.prompt).toBe("Which article completes the paragraph?");
    expect(activity.passage).toBeUndefined();
    expect(activity.gapLayout).toBe("paragraph");
  });

  it("clasifica como word_formation el hueco de una sola frase con raíz", () => {
    const { activity } = transformActivity(
      makeV1({
        type: "key_word_transformation",
        prompt: "The report contains ___ evidence. (CONVINCE)",
        evaluator: { strategy: "exact_text", answer: "convincing", normalization: NORMALIZATION },
      }),
    );

    expect(activity.type).toBe("word_formation");
    expect(activity.cueWord).toBe("CONVINCE");
    expect(activity.gapText).toBe("The report contains [gap1] evidence.");
  });

  it("mantiene en Part 4 las reescrituras de dos frases aunque quepan en una palabra", () => {
    const { activity } = transformActivity(
      makeV1({
        type: "key_word_transformation",
        prompt:
          "Someone washes the uniforms every Friday. The uniforms are ___ every Friday. (WASHED)",
        evaluator: { strategy: "exact_text", answer: "washed", normalization: NORMALIZATION },
      }),
    );

    expect(activity.type).toBe("key_word_transformation");
    expect(activity.keyWord).toBe("WASHED");
    expect(activity.firstSentence).toBe("Someone washes the uniforms every Friday.");
    expect(activity.gapText).toBe("The uniforms are [gap1] every Friday.");
  });

  it("clasifica como key_word_transformation la respuesta multi-palabra y parte las frases", () => {
    const { activity } = transformActivity(
      makeV1({
        type: "key_word_transformation",
        prompt:
          "The green coat is cheaper than the black coat. The black coat is ___ the green coat. (EXPENSIVE)",
        evaluator: {
          strategy: "exact_text",
          answer: "more expensive than",
          normalization: NORMALIZATION,
        },
      }),
    );

    expect(activity.type).toBe("key_word_transformation");
    expect(activity.keyWord).toBe("EXPENSIVE");
    expect(activity.firstSentence).toBe("The green coat is cheaper than the black coat.");
    expect(activity.gapText).toBe("The black coat is [gap1] the green coat.");
  });

  it("señala las contracciones en las respuestas de Part 4", () => {
    const { issues } = transformActivity(
      makeV1({
        type: "key_word_transformation",
        prompt: "She did not want to go. She ___ go. (WANT)",
        evaluator: {
          strategy: "exact_text",
          answer: "didn't want to",
          normalization: NORMALIZATION,
        },
      }),
    );

    expect(issues.map((issue) => issue.rule)).toContain("kwt-contraction");
  });

  it("señala las respuestas de Part 4 de una sola palabra", () => {
    const { issues } = transformActivity(
      makeV1({
        type: "key_word_transformation",
        prompt: "Someone washes the uniforms. The uniforms are ___ weekly. (WASHED)",
        evaluator: { strategy: "exact_text", answer: "washed", normalization: NORMALIZATION },
      }),
    );

    const lengthIssue = issues.find((issue) => issue.rule === "kwt-answer-length");
    expect(lengthIssue?.detail).toContain("cuenta 1 palabras");
  });

  it("acepta una respuesta de Part 4 de 2 a 5 palabras sin incidencias de longitud", () => {
    const { issues } = transformActivity(
      makeV1({
        type: "key_word_transformation",
        prompt:
          "I decided to stop smoking only 3 days ago. It was only 3 days ago that I made ___ smoking. (GIVE)",
        evaluator: {
          strategy: "exact_text",
          answer: "the decision to give up",
          normalization: NORMALIZATION,
        },
      }),
    );

    expect(issues.map((issue) => issue.rule)).not.toContain("kwt-answer-length");
    expect(issues.map((issue) => issue.rule)).not.toContain("kwt-key-word-absent");
  });

  it("señala como incidencia la clave que no aparece en la respuesta", () => {
    const { issues } = transformActivity(
      makeV1({
        type: "key_word_transformation",
        prompt: "She was forced to leave. He ___ go home early. (LEAVE)",
        evaluator: { strategy: "exact_text", answer: "had to", normalization: NORMALIZATION },
      }),
    );

    expect(issues.map((issue) => issue.rule)).toContain("kwt-key-word-absent");
  });

  it("deja los tokens en el orden canónico de correctTokenIds", () => {
    const { activity } = transformActivity(
      makeV1({
        type: "word_order",
        prompt: "I saw a cat.",
        tokens: [
          { id: "t3", text: "a cat." },
          { id: "t1", text: "I" },
          { id: "t2", text: "saw" },
        ],
        evaluator: { strategy: "ordered_tokens", correctTokenIds: ["t1", "t2", "t3"] },
      }),
    );

    expect(activity.tokens?.map((token) => token.id)).toEqual(["t1", "t2", "t3"]);
  });

  it("señala los word_order cuyos correctTokenIds no cubren todos los tokens", () => {
    const { issues } = transformActivity(
      makeV1({
        type: "word_order",
        tokens: [
          { id: "t1", text: "I" },
          { id: "t2", text: "saw" },
        ],
        evaluator: { strategy: "ordered_tokens", correctTokenIds: ["t1"] },
      }),
    );

    expect(issues.map((issue) => issue.rule)).toContain("word-order-token-mismatch");
  });

  it("baraja las opciones de forma determinista", () => {
    const source = makeV1({
      type: "single_choice",
      prompt: "Which one fits?",
      options: [
        { id: "a", text: "held" },
        { id: "b", text: "made" },
        { id: "c", text: "did" },
        { id: "d", text: "set" },
      ],
      evaluator: { strategy: "single_option", correctOptionId: "a" },
    });

    const first = transformActivity(source).activity;
    const second = transformActivity(source).activity;

    expect(first.options).toEqual(second.options);
    expect(first.options?.map((option) => option.id).sort()).toEqual(["a", "b", "c", "d"]);
    expect(first.optionsOrdered).toBeUndefined();
  });

  it("no vuelve a barajar unas opciones ya barajadas", () => {
    const source = makeV1({
      type: "single_choice",
      prompt: "Which one fits?",
      options: [
        { id: "a", text: "held" },
        { id: "b", text: "made" },
        { id: "c", text: "did" },
        { id: "d", text: "set" },
      ],
      evaluator: { strategy: "single_option", correctOptionId: "a" },
    });

    const once = transformActivity(source).activity;
    const twice = transformActivity(once as unknown as ActivityV1).activity;

    expect(twice.options).toEqual(once.options);
  });

  it("el barajado no depende del orden de entrada, solo del conjunto", () => {
    const options = [
      { id: "a", text: "held" },
      { id: "b", text: "made" },
      { id: "c", text: "did" },
      { id: "d", text: "set" },
    ];
    const base = {
      type: "single_choice" as const,
      prompt: "Which one fits?",
      evaluator: { strategy: "single_option", correctOptionId: "a" },
    };

    const inOrder = transformActivity(makeV1({ ...base, options })).activity;
    const reversed = transformActivity(makeV1({ ...base, options: [...options].reverse() }))
      .activity;

    expect(reversed.options).toEqual(inOrder.options);
  });

  it("no baraja cuando el orden de las opciones es significativo", () => {
    const options = [
      { id: "a", text: "10" },
      { id: "b", text: "20" },
      { id: "c", text: "30" },
    ];
    const { activity } = transformActivity(
      makeV1({
        type: "single_choice",
        prompt: "How many?",
        options,
        evaluator: { strategy: "single_option", correctOptionId: "a" },
      }),
    );

    expect(activity.options).toEqual(options);
    expect(activity.optionsOrdered).toBe(true);
  });

  it("respeta optionsOrdered declarado en el contenido", () => {
    const options = [
      { id: "a", text: "get up" },
      { id: "b", text: "get by" },
    ];
    const { activity } = transformActivity(
      makeV1({
        type: "single_choice",
        prompt: "Which one?",
        options,
        optionsOrdered: true,
        evaluator: { strategy: "single_option", correctOptionId: "a" },
      }),
    );

    expect(activity.options).toEqual(options);
  });

  it("es idempotente: migrar una actividad ya migrada no la cambia", () => {
    const once = transformActivity(makeV1({})).activity;
    const twice = transformActivity(once as unknown as ActivityV1).activity;
    expect(twice).toEqual(once);
  });

  it("es idempotente también para key_word_transformation", () => {
    const source = makeV1({
      type: "key_word_transformation",
      prompt:
        "The green coat is cheaper than the black coat. The black coat is ___ the green coat. (EXPENSIVE)",
      evaluator: {
        strategy: "exact_text",
        answer: "more expensive than",
        normalization: NORMALIZATION,
      },
    });
    const once = transformActivity(source).activity;
    const twice = transformActivity(once as unknown as ActivityV1).activity;
    expect(twice).toEqual(once);
  });

  it("detecta opciones con texto duplicado", () => {
    const { issues } = transformActivity(
      makeV1({
        type: "single_choice",
        prompt: "Which one?",
        options: [
          { id: "a", text: "held" },
          { id: "b", text: "Held" },
        ],
        evaluator: { strategy: "single_option", correctOptionId: "a" },
      }),
    );

    expect(issues.map((issue) => issue.rule)).toContain("duplicate-option-text");
  });

  it("detecta error_correction sin nada que corregir", () => {
    const { issues } = transformActivity(
      makeV1({
        type: "error_correction",
        prompt: "She goes to work by bus.",
        evaluator: {
          strategy: "exact_text",
          answer: "She goes to work by bus",
          normalization: NORMALIZATION,
        },
      }),
    );

    expect(issues.map((issue) => issue.rule)).toContain("answer-equals-prompt");
  });

  it("marca los diálogos con el layout correspondiente", () => {
    const { activity } = transformActivity(
      makeV1({
        type: "complete_dialogue",
        prompt: "A: What time do you ___? B: At seven.",
        evaluator: { strategy: "exact_text", answer: "get up", normalization: NORMALIZATION },
      }),
    );

    expect(activity.type).toBe("gap_fill");
    expect(activity.gapLayout).toBe("dialogue");
    expect(activity.gapText).toBe("A: What time do you [gap1]? B: At seven.");
  });
});

describe("diálogos", () => {
  it("reconoce dos turnos o más", () => {
    expect(looksLikeDialogue("A: Can you swim? B: Yes, I can.")).toBe(true);
    expect(looksLikeDialogue("The meeting starts at nine.")).toBe(false);
  });

  it("parte los turnos en líneas", () => {
    expect(splitDialogueLines("A: What time do you [gap1]? B: At seven.")).toBe(
      "A: What time do you [gap1]?\nB: At seven.",
    );
  });
});
