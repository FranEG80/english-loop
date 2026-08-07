import path from "node:path";
import { DATASET_ROOT, writeJson } from "./lib/io";
import { loadDataset } from "./lib/load";
import { validateDataset } from "./lib/validation";

export async function runValidation(): Promise<void> {
  const dataset = await loadDataset();
  const issues = await validateDataset(dataset);
  const errors = issues.filter(({ severity }) => severity === "error");
  const warnings = issues.filter(({ severity }) => severity === "warning");

  const report = {
    schemaVersion: "1.0.0",
    valid: errors.length === 0,
    summary: {
      lessons: dataset.lessons.length,
      activities: dataset.activities.length,
      batches: dataset.batches.length,
      taxonomyNodes: dataset.taxonomy.nodes.length,
      errors: errors.length,
      warnings: warnings.length,
    },
    warningsByCode: countByCode(warnings),
    issues,
  };

  await writeJson(path.join(DATASET_ROOT, "reports", "validation.json"), report);

  if (errors.length > 0) {
    throw new Error(`Dataset inválido: ${errors.length} error(es).`);
  }

  console.log(
    `Dataset válido: ${dataset.lessons.length} lecciones y ${dataset.activities.length} actividades.`,
  );
  if (warnings.length > 0) {
    console.log(`Avisos pendientes de la fase 2 de contenido: ${warnings.length}.`);
    for (const [code, count] of Object.entries(report.warningsByCode)) {
      console.log(`  ${code}: ${count}`);
    }
  }
}

function countByCode(
  issues: Array<{ code: string }>,
): Record<string, number> {
  const counts = new Map<string, number>();
  for (const { code } of issues) counts.set(code, (counts.get(code) ?? 0) + 1);
  return Object.fromEntries(
    [...counts.entries()].sort(([, left], [, right]) => right - left),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
