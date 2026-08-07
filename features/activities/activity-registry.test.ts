import { describe, expect, it } from "vitest";
import {
  ACTIVITY_PRESENTATIONS,
  ACTIVITY_TYPES,
  PRESENTATION_BY_TYPE,
  activityTypesForPresentation,
} from "@/core/models";
import {
  RESPONSE_KINDS_BY_PRESENTATION,
  getActivityDefinition,
  isSupportedActivity,
  presentationOf,
} from "./activity-registry";
import { gapFillQuestion, trueFalseQuestion } from "@/test/support/activity-fixtures";

describe("registro de actividades", () => {
  it("asigna una presentación a cada tipo canónico", () => {
    for (const type of ACTIVITY_TYPES) {
      expect(ACTIVITY_PRESENTATIONS).toContain(PRESENTATION_BY_TYPE[type]);
    }
  });

  it("declara las respuestas admitidas de cada presentación", () => {
    for (const presentation of ACTIVITY_PRESENTATIONS) {
      expect(RESPONSE_KINDS_BY_PRESENTATION[presentation].length).toBeGreaterThan(0);
    }
  });

  it("agrupa los tipos que comparten renderer", () => {
    expect(activityTypesForPresentation("gap_fill").sort()).toEqual([
      "gap_fill",
      "word_formation",
    ]);
    expect(activityTypesForPresentation("free_text").sort()).toEqual([
      "error_correction",
      "guided_writing",
      "sentence_rewrite",
    ]);
    expect(activityTypesForPresentation("choice").sort()).toEqual([
      "multiple_choice",
      "single_choice",
    ]);
  });

  it("cubre todos los tipos entre las presentaciones, sin solapes", () => {
    const covered = ACTIVITY_PRESENTATIONS.flatMap((presentation) =>
      activityTypesForPresentation(presentation),
    );
    expect(covered.sort()).toEqual([...ACTIVITY_TYPES].sort());
    expect(new Set(covered).size).toBe(ACTIVITY_TYPES.length);
  });

  it("resuelve la presentación de una actividad concreta", () => {
    expect(presentationOf("word_formation")).toBe("gap_fill");
    expect(getActivityDefinition(gapFillQuestion()).responseKinds).toEqual(["gaps"]);
    expect(getActivityDefinition(trueFalseQuestion()).responseKinds).toEqual(["boolean"]);
  });

  it("da por soportada cualquier actividad del DTO tipado", () => {
    expect(isSupportedActivity(gapFillQuestion())).toBe(true);
    expect(isSupportedActivity(trueFalseQuestion())).toBe(true);
  });
});
