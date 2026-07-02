import path from "node:path";
import { DATASET_ROOT, writeJson } from "./lib/io";
import { loadDataset } from "./lib/load";
import type { Activity, TaxonomyNode } from "./lib/types";

export async function runCoverage(): Promise<void> {
  const dataset = await loadDataset();
  const activities = dataset.activities.filter(
    ({ status }) => status === "published",
  );
  const lessons = dataset.lessons.filter(
    ({ frontmatter }) => frontmatter.status === "published",
  );
  const children = buildChildren(dataset.taxonomy.nodes);

  const dimensions = {
    level: countBy(activities, ({ level }) => level),
    category: countBy(activities, ({ category }) => category),
    topic: countBy(activities, ({ topic }) => topic),
    subtopic: countBy(activities, ({ subtopic }) => subtopic),
    activityType: countBy(activities, ({ type }) => type),
    difficulty: countBy(activities, ({ difficulty }) => String(difficulty)),
  };

  const targets = dataset.coverageTargets.nodes
    .map((target) => {
      const acceptedNodeIds = new Set([
        target.taxonomyNodeId,
        ...collectDescendants(target.taxonomyNodeId, children),
      ]);
      const matching = activities.filter(({ taxonomyNodeIds }) =>
        taxonomyNodeIds.some((nodeId) => acceptedNodeIds.has(nodeId)),
      ).filter(
        ({ level }) => level === target.level,
      );
      const activityTypes = new Set(matching.map(({ type }) => type));
      const difficulties = new Set(matching.map(({ difficulty }) => difficulty));
      return {
        ...target,
        actualActivities: matching.length,
        actualActivityTypes: activityTypes.size,
        actualDifficulties: [...difficulties].sort(),
        met:
          matching.length >= target.minimumActivities &&
          activityTypes.size >= target.minimumActivityTypes &&
          target.requiredDifficulties.every((value) =>
            difficulties.has(value as Activity["difficulty"]),
          ),
      };
    })
    .sort((left, right) =>
      left.taxonomyNodeId.localeCompare(right.taxonomyNodeId),
    );

  const summary = {
    publishedLessons: lessons.length,
    publishedActivities: activities.length,
    minimumLessons: dataset.coverageTargets.global.minimumLessons,
    minimumActivities: dataset.coverageTargets.global.minimumActivities,
    globalTargetMet:
      lessons.length >= dataset.coverageTargets.global.minimumLessons &&
      activities.length >= dataset.coverageTargets.global.minimumActivities,
    nodeTargetsMet: targets.filter(({ met }) => met).length,
    nodeTargetsTotal: targets.length,
  };

  await Promise.all([
    writeJson(path.join(DATASET_ROOT, "reports", "coverage.json"), {
      schemaVersion: "1.0.0",
      summary,
      dimensions,
      targets,
    }),
    writeJson(path.join(DATASET_ROOT, "reports", "practice-coverage.json"), {
      schemaVersion: "1.0.0",
      targets: targets.map(
        ({
          taxonomyNodeId,
          actualActivities,
          actualActivityTypes,
          actualDifficulties,
          met,
        }) => ({
          taxonomyNodeId,
          actualActivities,
          actualActivityTypes,
          actualDifficulties,
          met,
        }),
      ),
    }),
  ]);

  console.log(
    `Cobertura: ${lessons.length} lecciones, ${activities.length} actividades, ${summary.nodeTargetsMet}/${summary.nodeTargetsTotal} objetivos de nodo.`,
  );
}

function buildChildren(
  nodes: TaxonomyNode[],
): Map<string, TaxonomyNode[]> {
  const children = new Map<string, TaxonomyNode[]>();
  for (const node of nodes) {
    if (node.parentId === null) continue;
    const direct = children.get(node.parentId) ?? [];
    direct.push(node);
    children.set(node.parentId, direct);
  }
  return children;
}

function collectDescendants(
  nodeId: string,
  children: Map<string, TaxonomyNode[]>,
): string[] {
  return (children.get(nodeId) ?? []).flatMap((node) => [
    node.id,
    ...collectDescendants(node.id, children),
  ]);
}

function countBy(
  activities: Activity[],
  key: (activity: Activity) => string,
): Record<string, number> {
  const counts = new Map<string, number>();
  for (const activity of activities) {
    const value = key(activity);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCoverage().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
