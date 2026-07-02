import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const PROJECT_ROOT = process.cwd();
export const DATASET_ROOT = path.join(PROJECT_ROOT, "DATASET");

export async function readJson<T>(filePath: string): Promise<T> {
  const source = await readFile(filePath, "utf8");
  return JSON.parse(source) as T;
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  const serialised = `${JSON.stringify(value, null, 2)}\n`;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, serialised, "utf8");
}

export async function walkFiles(
  root: string,
  extension: string,
): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true }).catch((error) => {
    if (isMissingFileError(error)) return [];
    throw error;
  });

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const filePath = path.join(root, entry.name);
      if (entry.isDirectory()) return walkFiles(filePath, extension);
      return entry.isFile() && entry.name.endsWith(extension) ? [filePath] : [];
    }),
  );

  return nested.flat().sort((left, right) => left.localeCompare(right));
}

export function toPosixRelative(filePath: string): string {
  return path.relative(DATASET_ROOT, filePath).split(path.sep).join("/");
}

export function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
