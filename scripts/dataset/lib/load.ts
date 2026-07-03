import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import {
  DATASET_ROOT,
  readJson,
  toPosixRelative,
  walkFiles,
} from "./io";
import type {
  ActivityBatch,
  CoverageTargets,
  CurriculumMap,
  LessonDocument,
  LessonFrontmatter,
  LoadedDataset,
  SourcesCatalog,
  Taxonomy,
} from "./types";

export async function loadDataset(): Promise<LoadedDataset> {
  const [
    lessonPaths,
    activityPaths,
    taxonomy,
    coverageTargets,
    curriculumMap,
    sources,
  ] =
    await Promise.all([
      walkFiles(path.join(DATASET_ROOT, "lessons"), ".md"),
      walkFiles(path.join(DATASET_ROOT, "activities"), ".json"),
      readJson<Taxonomy>(path.join(DATASET_ROOT, "catalog", "taxonomy.json")),
      readJson<CoverageTargets>(
        path.join(DATASET_ROOT, "catalog", "coverage-targets.json"),
      ),
      readJson<CurriculumMap>(
        path.join(DATASET_ROOT, "catalog", "curriculum-map.json"),
      ),
      readJson<SourcesCatalog>(
        path.join(DATASET_ROOT, "references", "sources.json"),
      ),
    ]);

  const lessons = await Promise.all(
    lessonPaths.map(async (filePath): Promise<LessonDocument> => {
      const source = await readFile(filePath, "utf8");
      const parsed = matter(source);
      return {
        filePath,
        relativePath: toPosixRelative(filePath),
        frontmatter: parsed.data as LessonFrontmatter,
        content: parsed.content.trim(),
      };
    }),
  );

  const batches = await Promise.all(
    activityPaths.map(async (filePath) => ({
      filePath,
      relativePath: toPosixRelative(filePath),
      batch: await readJson<ActivityBatch>(filePath),
    })),
  );

  return {
    lessons,
    batches,
    activities: batches.flatMap(({ batch }) => batch.activities),
    taxonomy,
    coverageTargets,
    curriculumMap,
    sources,
  };
}
