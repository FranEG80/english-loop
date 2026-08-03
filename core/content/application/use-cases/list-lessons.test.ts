import { describe, expect, it } from "vitest";
import { listLessons } from "./list-lessons";
import { catalog } from "@/test/support/core-fakes";

describe("listLessons", () => {
  it("filters lessons by CEFR level", async () => {
    const result = await listLessons(catalog, { level: "B1" });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("lesson-1");
  });
});
