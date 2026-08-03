import { describe, expect, it } from "vitest";
import { getDictionary } from "./get-dictionary";

describe("getDictionary", () => {
  it("returns the complete dictionary for each supported locale", () => {
    expect(getDictionary("es").app.name).toBeTruthy();
    expect(getDictionary("en").nav.login).toBeTruthy();
    expect(getDictionary("es").common.skipToContent).toBeTruthy();
  });
});
