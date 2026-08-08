import { describe, expect, it } from "vitest";
import { ACTIVITY_PRESENTATIONS, ACTIVITY_TYPES } from "@/core/models";
import { es } from "@/shared/i18n/dictionaries/es";
import {
  formatActivityTitle,
  formatActivityType,
  formatPresentation,
} from "./activity-display";

describe("activity display labels", () => {
  it("removes internal level and format prefixes from activity titles", () => {
    expect(formatActivityTitle("b1-fixed-expressions-sc-002", "B1")).toBe(
      "Fixed Expressions",
    );
  });

  // Regresión: el sufijo de un minijuego lleva el nombre del juego, así que la
  // regla de «dos a cuatro letras» dejaba «Collocations Daily Life Mg Frog».
  it("quita también el sufijo con el nombre del minijuego", () => {
    expect(
      formatActivityTitle("b1-collocations-daily-life-mg-frog-leap-001", "B1"),
    ).toBe("Collocations Daily Life");
    expect(
      formatActivityTitle("b2-career-business-mg-lane-runner-001", "B2"),
    ).toBe("Career Business");
  });

  it("uses human-readable labels for activity types", () => {
    expect(formatActivityType("single_choice")).toBe("Single choice");
    expect(formatActivityType("key_word_transformation")).toBe(
      "Key word transformation",
    );
  });

  it("prefers the dictionary over the English fallback", () => {
    expect(formatActivityType("gap_fill", es)).toBe(es.activityTypes.gap_fill);
    expect(formatPresentation("free_text", es)).toBe(es.activityPresentations.free_text);
  });

  it("covers every canonical type and presentation", () => {
    for (const type of ACTIVITY_TYPES) expect(formatActivityType(type)).toBeTruthy();
    for (const presentation of ACTIVITY_PRESENTATIONS) {
      expect(formatPresentation(presentation)).toBeTruthy();
    }
  });
});
