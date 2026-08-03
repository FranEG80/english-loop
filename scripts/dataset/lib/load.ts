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

export async function loadDataset(datasetRoot = DATASET_ROOT): Promise<LoadedDataset> {
  const [
    lessonPaths,
    activityPaths,
    taxonomy,
    coverageTargets,
    curriculumMap,
    sources,
  ] =
    await Promise.all([
      walkFiles(path.join(datasetRoot, "lessons"), ".md"),
      walkFiles(path.join(datasetRoot, "activities"), ".json"),
      readJson<Taxonomy>(path.join(datasetRoot, "catalog", "taxonomy.json")),
      readJson<CoverageTargets>(
        path.join(datasetRoot, "catalog", "coverage-targets.json"),
      ),
      readJson<CurriculumMap>(
        path.join(datasetRoot, "catalog", "curriculum-map.json"),
      ),
      readJson<SourcesCatalog>(
        path.join(datasetRoot, "references", "sources.json"),
      ),
    ]);

  const lessons = await Promise.all(
    lessonPaths.map(async (filePath): Promise<LessonDocument> => {
      const source = await readFile(filePath, "utf8");
      const parsed = matter(source);
      return {
        filePath,
        relativePath: toPosixRelative(filePath, datasetRoot),
        frontmatter: parsed.data as LessonFrontmatter,
        content: parsed.content.trim(),
      };
    }),
  );

  const batches = await Promise.all(
    activityPaths.map(async (filePath) => ({
      filePath,
      relativePath: toPosixRelative(filePath, datasetRoot),
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
