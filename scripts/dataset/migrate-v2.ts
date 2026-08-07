import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import {
  DATASET_ROOT,
  isMissingFileError,
  readJson,
  toPosixRelative,
  walkFiles,
  writeJson,
} from "./lib/io";
import {
  splitDialogueLines,
  transformActivity,
  type ActivityV1,
  type MigrationIssue,
} from "./lib/migrate-v2-transform";
import type { Activity, ActivityBatch, ActivityType, Level } from "./lib/types";

/**
 * Codemod DATASET v1 -> v2. Idempotente y determinista: dos pasadas seguidas
 * producen exactamente los mismos ficheros.
 *
 *   pnpm dataset:migrate-v2
 *
 * Lo que el codemod NO puede arreglar solo queda listado en
 * `DATASET/reports/migration-v2.json` para repararlo a mano.
 */

const MAX_BATCH_SIZE = 25;

interface BatchFileV1 {
  schemaVersion: string;
  batchId: string;
  level: Level;
  category: string;
  topic: string;
  subtopic: string;
  lessonId: string;
  activityType: string;
  activities: ActivityV1[];
}

interface GroupKey {
  level: Level;
  category: string;
  topic: string;
  subtopic: string;
  lessonId: string;
  activityType: ActivityType;
}

export interface MigrationReport {
  generatedFrom: string;
  totals: {
    sourceFiles: number;
    sourceActivities: number;
    targetFiles: number;
    targetActivities: number;
  };
  typeMoves: Array<{ from: string; to: ActivityType; activities: number }>;
  issuesByRule: Array<{ rule: string; activities: number }>;
  issues: MigrationIssue[];
}

export async function migrateDataset(
  datasetRoot = DATASET_ROOT,
): Promise<MigrationReport> {
  const activitiesRoot = path.join(datasetRoot, "activities");
  const sourceFiles = await walkFiles(activitiesRoot, ".json");

  const issues: MigrationIssue[] = [];
  const typeMoves = new Map<string, number>();
  const groups = new Map<string, { key: GroupKey; activities: Activity[] }>();
  let sourceActivities = 0;

  for (const filePath of sourceFiles) {
    const batch = await readJson<BatchFileV1>(filePath);
    for (const source of batch.activities) {
      sourceActivities += 1;
      const { activity, issues: activityIssues } = transformActivity(source);
      issues.push(...activityIssues);

      applyDialogueLayout(activity);

      const originalType = typeof source.skillFocus === "string" ? source.skillFocus : source.type;
      const moveKey = `${originalType}->${activity.type}`;
      typeMoves.set(moveKey, (typeMoves.get(moveKey) ?? 0) + 1);

      const key: GroupKey = {
        level: activity.level,
        category: activity.category,
        topic: activity.topic,
        subtopic: activity.subtopic,
        lessonId: batch.lessonId,
        activityType: activity.type,
      };
      const groupId = groupIdOf(key);
      const group = groups.get(groupId) ?? { key, activities: [] };
      group.activities.push(activity);
      groups.set(groupId, group);
    }
  }

  const written = new Set<string>();
  let targetActivities = 0;

  for (const groupId of [...groups.keys()].sort()) {
    const { key, activities } = groups.get(groupId)!;
    activities.sort((left, right) => left.id.localeCompare(right.id));

    const chunks = chunk(activities, MAX_BATCH_SIZE);
    for (const [index, chunkActivities] of chunks.entries()) {
      const sequence = String(index + 1).padStart(3, "0");
      const directory = path.join(
        activitiesRoot,
        key.level.toLowerCase(),
        key.category,
        key.topic,
        key.lessonId,
        key.activityType,
      );
      const filePath = path.join(directory, `batch-${sequence}.json`);

      const batch: ActivityBatch = {
        schemaVersion: "2.0.0",
        batchId: `${key.lessonId}-${key.activityType.replaceAll("_", "-")}-${sequence}`,
        level: key.level,
        category: key.category,
        topic: key.topic,
        subtopic: key.subtopic,
        lessonId: key.lessonId,
        activityType: key.activityType,
        activities: chunkActivities,
      };

      await writeJson(filePath, batch);
      written.add(path.resolve(filePath));
      targetActivities += chunkActivities.length;
    }
  }

  for (const filePath of sourceFiles) {
    if (!written.has(path.resolve(filePath))) await rm(filePath);
  }
  await removeEmptyDirectories(activitiesRoot);

  const report: MigrationReport = {
    generatedFrom: toPosixRelative(activitiesRoot, datasetRoot),
    totals: {
      sourceFiles: sourceFiles.length,
      sourceActivities,
      targetFiles: written.size,
      targetActivities,
    },
    typeMoves: [...typeMoves.entries()]
      .map(([move, activities]) => {
        const [from, to] = move.split("->") as [string, ActivityType];
        return { from, to, activities };
      })
      .sort((left, right) => right.activities - left.activities),
    issuesByRule: countByRule(issues),
    issues: issues.sort(
      (left, right) =>
        left.rule.localeCompare(right.rule) || left.activityId.localeCompare(right.activityId),
    ),
  };

  await writeJson(path.join(datasetRoot, "reports", "migration-v2.json"), report);
  return report;
}

/** Los diálogos se guardan con un turno por línea para que el renderer los pinte. */
function applyDialogueLayout(activity: Activity): void {
  if (activity.gapLayout !== "dialogue" || !activity.gapText) return;
  activity.gapText = splitDialogueLines(activity.gapText);
}

function groupIdOf(key: GroupKey): string {
  return [key.level, key.category, key.topic, key.lessonId, key.activityType].join("/");
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function countByRule(issues: MigrationIssue[]): Array<{ rule: string; activities: number }> {
  const counts = new Map<string, number>();
  for (const issue of issues) counts.set(issue.rule, (counts.get(issue.rule) ?? 0) + 1);
  return [...counts.entries()]
    .map(([rule, activities]) => ({ rule, activities }))
    .sort((left, right) => right.activities - left.activities);
}

/** Borra recursivamente los directorios que quedan sin ficheros. */
async function removeEmptyDirectories(root: string): Promise<boolean> {
  const entries = await readdir(root, { withFileTypes: true }).catch((error) => {
    if (isMissingFileError(error)) return [];
    throw error;
  });

  let hasFiles = false;
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      const childHasFiles = await removeEmptyDirectories(entryPath);
      hasFiles ||= childHasFiles;
    } else {
      hasFiles = true;
    }
  }

  if (!hasFiles) {
    const info = await stat(root).catch(() => null);
    if (info?.isDirectory()) await rm(root, { recursive: true });
  }
  return hasFiles;
}

async function main(): Promise<void> {
  const report = await migrateDataset();
  const { totals } = report;

  console.log(
    `Migrados ${totals.sourceActivities} items de ${totals.sourceFiles} ficheros ` +
      `a ${totals.targetActivities} items en ${totals.targetFiles} ficheros.`,
  );

  if (totals.sourceActivities !== totals.targetActivities) {
    throw new Error(
      `Pérdida de items: ${totals.sourceActivities} de origen frente a ${totals.targetActivities} de destino.`,
    );
  }

  for (const { rule, activities } of report.issuesByRule) {
    console.log(`  pendiente de reparar · ${rule}: ${activities}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
