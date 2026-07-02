import path from "node:path";
import { DATASET_ROOT, writeJson } from "./lib/io";
import { loadDataset } from "./lib/load";
import { validateDataset } from "./lib/validation";

export async function runValidation(): Promise<void> {
  const dataset = await loadDataset();
  const issues = await validateDataset(dataset);
  const report = {
    schemaVersion: "1.0.0",
    valid: issues.length === 0,
    summary: {
      lessons: dataset.lessons.length,
      activities: dataset.activities.length,
      batches: dataset.batches.length,
      taxonomyNodes: dataset.taxonomy.nodes.length,
      errors: issues.length,
    },
    issues,
  };

  await writeJson(path.join(DATASET_ROOT, "reports", "validation.json"), report);

  if (issues.length > 0) {
    throw new Error(`Dataset inválido: ${issues.length} error(es).`);
  }

  console.log(
    `Dataset válido: ${dataset.lessons.length} lecciones y ${dataset.activities.length} actividades.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
