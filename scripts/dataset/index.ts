import path from "node:path";
import { DATASET_ROOT, writeJson } from "./lib/io";
import { loadDataset } from "./lib/load";

export async function runIndexing(): Promise<void> {
  const dataset = await loadDataset();
  const lessonIndex = {
    schemaVersion: "1.0.0",
    generatedFromDatasetVersion: "0.1.0",
    lessons: dataset.lessons
      .map(({ relativePath, frontmatter }) => ({
        id: frontmatter.id,
        path: relativePath,
        title: frontmatter.title,
        level: frontmatter.level,
        category: frontmatter.category,
        topic: frontmatter.topic,
        subtopics: frontmatter.subtopics,
        difficulty: frontmatter.difficulty,
        estimatedMinutes: frontmatter.estimatedMinutes,
        status: frontmatter.status,
        contentVersion: frontmatter.contentVersion,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  };

  const activityRows = dataset.batches.flatMap(({ relativePath, batch }) =>
    batch.activities.map((activity) => ({
      id: activity.id,
      batchId: batch.batchId,
      path: relativePath,
      level: activity.level,
      type: activity.type,
      category: activity.category,
      topic: activity.topic,
      subtopic: activity.subtopic,
      taxonomyNodeIds: activity.taxonomyNodeIds,
      lessonIds: activity.lessonIds,
      difficulty: activity.difficulty,
      estimatedSeconds: activity.estimatedSeconds,
      status: activity.status,
    })),
  );
  const activityIndex = {
    schemaVersion: "1.0.0",
    generatedFromDatasetVersion: "0.1.0",
    activities: activityRows.sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
  };

  await Promise.all([
    writeJson(
      path.join(DATASET_ROOT, "catalog", "lesson-index.json"),
      lessonIndex,
    ),
    writeJson(
      path.join(DATASET_ROOT, "catalog", "activity-index.json"),
      activityIndex,
    ),
  ]);

  console.log(
    `Índices creados: ${lessonIndex.lessons.length} lecciones y ${activityIndex.activities.length} actividades.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runIndexing().catch(handleFailure);
}

function handleFailure(error: unknown): void {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
