import { describe, expect, it } from "vitest";
import { getScopeAvailability } from "./get-scope-availability";
import { catalog, taxonomy } from "@/test/support/core-fakes";

describe("getScopeAvailability", () => {
  it("counts activities in the selected node and its descendants", async () => {
    const result = await getScopeAvailability(catalog, taxonomy, "topic", "both", 2);

    expect(result.availableActivityCount).toBe(2);
    expect(result.isEligible).toBe(true);
  });
});
