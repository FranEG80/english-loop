import path from "node:path";
import { DATASET_ROOT, writeJson } from "./lib/io";
import { loadDataset } from "./lib/load";
import type { Activity, TaxonomyNode } from "./lib/types";

export async function runPracticeIndex(): Promise<void> {
  const dataset = await loadDataset();
  const children = buildChildren(dataset.taxonomy.nodes);
  const published = dataset.activities.filter(
    ({ status }) => status === "published",
  );

  const scopes = dataset.taxonomy.nodes
    .filter(({ selectableForPractice }) => selectableForPractice)
    .map((node) => {
      const descendantIds = collectDescendants(node.id, children);
      const allowedIds = new Set([node.id, ...descendantIds]);
      const activities = uniqueActivities(
        published.filter(({ taxonomyNodeIds }) =>
          taxonomyNodeIds.some((id) => allowedIds.has(id)),
        ),
      );

      return {
        taxonomyNodeId: node.id,
        descendantIds,
        activityIds: activities.map(({ id }) => id),
        counts: {
          total: activities.length,
          byLevel: countBy(activities, ({ level }) => level),
          byDifficulty: countBy(activities, ({ difficulty }) =>
            String(difficulty),
          ),
          byType: countBy(activities, ({ type }) => type),
        },
      };
    })
    .sort((left, right) =>
      left.taxonomyNodeId.localeCompare(right.taxonomyNodeId),
    );

  await writeJson(path.join(DATASET_ROOT, "catalog", "practice-index.json"), {
    schemaVersion: "1.0.0",
    generatedFromDatasetVersion: "0.1.0",
    scopes,
  });

  console.log(`Índice de práctica creado para ${scopes.length} nodos.`);
}

function buildChildren(
  nodes: TaxonomyNode[],
): Map<string, TaxonomyNode[]> {
  const children = new Map<string, TaxonomyNode[]>();
  for (const node of nodes) {
    if (node.parentId === null) continue;
    const siblings = children.get(node.parentId) ?? [];
    siblings.push(node);
    siblings.sort((left, right) => left.id.localeCompare(right.id));
    children.set(node.parentId, siblings);
  }
  return children;
}

function collectDescendants(
  id: string,
  children: Map<string, TaxonomyNode[]>,
): string[] {
  const direct = children.get(id) ?? [];
  return direct
    .flatMap((node) => [node.id, ...collectDescendants(node.id, children)])
    .sort((left, right) => left.localeCompare(right));
}

function uniqueActivities(activities: Activity[]): Activity[] {
  return [...new Map(activities.map((activity) => [activity.id, activity])).values()]
    .sort((left, right) => left.id.localeCompare(right.id));
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
  runPracticeIndex().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
