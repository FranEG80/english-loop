import "dotenv/config";
import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { readJson } from "./lib/io";
import { loadDataset } from "./lib/load";
import { validateDataset } from "./lib/validation";
import { planDatasetImport } from "@/core/content/application/use-cases/plan-dataset-import";
import { sha256Checksum } from "./lib/checksum";

export interface CliOptions {
  source: string;
  dryRun: boolean;
}

export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { source: "./DATASET", dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--source") options.source = argv[++i] ?? "./DATASET";
    else if (arg === "--dry-run") options.dryRun = true;
  }
  return options;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const datasetRoot = path.resolve(options.source);

  console.log(`Importando dataset desde ${datasetRoot}${options.dryRun ? " (dry-run)" : ""}`);

  // 1. Validación completa del dataset.
  const dataset = await loadDataset();
  const issues = await validateDataset(dataset);
  if (issues.length > 0) {
    console.error(`Dataset inválido: ${issues.length} error(es). Abortando.`);
    for (const issue of issues.slice(0, 10)) {
      console.error(`  - ${issue.message ?? JSON.stringify(issue)}`);
    }
    process.exitCode = 1;
    return;
  }

  const version = (await readJson<{ version?: string }>(path.join(datasetRoot, "VERSION"))).version ?? "unknown";
  const datasetVersion = version;

  // 2. Planificar la importación.
  const items = [
    ...dataset.lessons.map((lesson) => ({
      id: lesson.frontmatter.id,
      kind: "lesson" as const,
      checksum: sha256Checksum.checksum(lesson.content),
    })),
    ...dataset.activities.map((activity) => ({
      id: activity.id,
      kind: "activity" as const,
      checksum: sha256Checksum.checksum(activity),
    })),
    ...dataset.taxonomy.nodes.map((node) => ({
      id: node.id,
      kind: "taxonomy" as const,
      checksum: sha256Checksum.checksum(node),
    })),
  ];

  const plan = planDatasetImport(datasetVersion, items, new Map(), sha256Checksum);
  console.log(
    `Plan: ${plan.summary.create} crear, ${plan.summary.update} actualizar, ${plan.summary.unchanged} sin cambios.`,
  );

  if (options.dryRun) {
    console.log("Dry-run: no se escribió nada en la base de datos.");
    return;
  }

  // 3. Importar a la BD.
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  const prisma = new PrismaClient({ adapter });

  const importRecord = await prisma.datasetImport.create({
    data: {
      datasetVersion,
      checksum: plan.globalChecksum,
      status: "started",
    },
  });

  try {
    // Importar taxonomía primero.
    for (const node of dataset.taxonomy.nodes) {
      await prisma.taxonomyProgress.upsert({
        where: { id: `tax-${node.id}` },
        create: {
          id: `tax-${node.id}`,
          userId: "__taxonomy__",
          taxonomyNodeId: node.id,
          attemptsCount: 0,
          correctCount: 0,
        },
        update: {},
      });
    }

    await prisma.datasetImport.update({
      where: { id: importRecord.id },
      data: {
        status: "completed",
        finishedAt: new Date(),
        result: JSON.stringify(plan.summary),
      },
    });

    console.log("Importación completada.");
  } catch (error) {
    await prisma.datasetImport.update({
      where: { id: importRecord.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
