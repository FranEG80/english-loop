import { describe, expect, it } from "vitest";
import { parseArgs } from "./import";

describe("dataset import CLI", () => {
  it("parses source and dry-run flags without executing the importer", () => {
    expect(parseArgs(["--source", "./fixture", "--dry-run"])).toEqual({ source: "./fixture", dryRun: true });
    expect(parseArgs([])).toEqual({ source: "./DATASET", dryRun: false });
  });
});
