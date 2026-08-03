import { describe, expect, it, vi } from "vitest";
import { planDatasetImport } from "./plan-dataset-import";

describe("planDatasetImport", () => {
  it("classifies new, changed and unchanged records", () => {
    const checksum = { checksum: vi.fn((value: unknown) => JSON.stringify(value)) };
    const result = planDatasetImport("v2", [{ id: "new", kind: "lesson", checksum: "a" }, { id: "changed", kind: "activity", checksum: "b" }, { id: "same", kind: "taxonomy", checksum: "c" }], new Map([["changed", "old"], ["same", "c"]]), checksum);
    expect(result.items.map((item) => item.action)).toEqual(["create", "update", "unchanged"]);
    expect(result.summary).toEqual({ create: 1, update: 1, unchanged: 1, retire: 0 });
    expect(result.datasetVersion).toBe("v2");
    expect(checksum.checksum).toHaveBeenCalledOnce();
  });
});
