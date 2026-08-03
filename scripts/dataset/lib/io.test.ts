// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isMissingFileError, readJson, toPosixRelative, walkFiles, writeJson } from "./io";

describe("dataset file IO", () => {
  it("writes, reads and walks JSON files deterministically", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "english-loop-io-"));
    try {
      await writeJson(path.join(root, "nested", "b.json"), { b: 2 });
      await writeJson(path.join(root, "a.json"), { a: 1 });
      expect(await readJson(path.join(root, "a.json"))).toEqual({ a: 1 });
      expect((await walkFiles(root, ".json")).map((file) => path.basename(file))).toEqual(["a.json", "b.json"]);
      expect(await walkFiles(path.join(root, "missing"), ".json")).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("normalizes dataset-relative paths and detects ENOENT", () => {
    expect(toPosixRelative(path.join(process.cwd(), "DATASET", "lessons", "b1", "lesson.md"))).toBe("lessons/b1/lesson.md");
    expect(isMissingFileError(Object.assign(new Error("missing"), { code: "ENOENT" }))).toBe(true);
    expect(isMissingFileError(new Error("other"))).toBe(false);
  });
});
