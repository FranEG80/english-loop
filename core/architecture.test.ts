import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function typescriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return typescriptFiles(target);
      return /\.[cm]?[jt]sx?$/.test(entry.name) &&
        !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)
        ? [target]
        : [];
    }),
  );
  return nested.flat();
}

async function offendingImports(
  directory: string,
  forbidden: RegExp,
): Promise<string[]> {
  const files = await typescriptFiles(directory);
  const violations: string[] = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (forbidden.test(source)) violations.push(path.relative(process.cwd(), file));
  }
  return violations;
}

describe("architecture boundaries", () => {
  it("keeps core independent from frameworks and outer layers", async () => {
    const violations = await offendingImports(
      path.join(process.cwd(), "core"),
      /from\s+["'](?:react|next(?:\/[^"']*)?|@\/(?:app|features|adapters|shared)(?:\/[^"']*)?)["']/,
    );
    expect(violations).toEqual([]);
  });

  it("prevents features from importing concrete mock or REST adapters", async () => {
    const violations = await offendingImports(
      path.join(process.cwd(), "features"),
      /from\s+["']@\/adapters\/(?:mock|rest)\//,
    );
    expect(violations).toEqual([]);
  });

  it("prevents shared UI and layout from depending on features", async () => {
    const violations = await offendingImports(
      path.join(process.cwd(), "shared"),
      /from\s+["']@\/features\//,
    );
    expect(violations).toEqual([]);
  });
});
