import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { ActivityCatalogPort, TaxonomyCatalogPort } from "@/core/content/ports/catalog-ports";
import {
  UniqueId,
  type ClockPort,
  type IdGeneratorPort,
} from "@/core/shared/kernel";
import type { PracticeRunRepository } from "../../ports/practice-run-repository";
import { PracticeRun } from "../../domain/practice-run";
import { PracticeRunPlanner } from "../../domain/practice-run-planner";
import type { SessionSize } from "@/core/models/session-size";
import { InvalidPracticeScopeException } from "@/core/shared/exceptions";
import type { CefrLevelFilter } from "@/core/models/level";

export interface CreateFocusedPracticeRunInput {
  taxonomyNodeId: string;
  level: CefrLevelFilter;
  sessionSize: SessionSize;
}

export interface CreateFocusedPracticeRunResult {
  run: PracticeRun;
  coveredSubtopicIds: string[];
}

/**
 * Crea un run de práctica dirigida (FOCUSED) para un nodo de taxonomía.
 * Resuelve los descendientes y planifica las actividades.
 */
export async function createFocusedPracticeRun(
  identity: IdentityPort,
  runRepository: PracticeRunRepository,
  activityCatalog: ActivityCatalogPort,
  taxonomyCatalog: TaxonomyCatalogPort,
  planner: PracticeRunPlanner,
  idGenerator: IdGeneratorPort,
  clock: ClockPort,
  datasetVersion: string,
  input: CreateFocusedPracticeRunInput,
): Promise<CreateFocusedPracticeRunResult> {
  const actor = await identity.requireActor();

  const descendants = await taxonomyCatalog.resolveNodeWithDescendants(
    input.taxonomyNodeId,
  );
  if (descendants.length === 0) {
    throw new InvalidPracticeScopeException(
      `Unknown taxonomy node: ${input.taxonomyNodeId}`,
      "The selected practice scope is not valid.",
      { nodeId: input.taxonomyNodeId },
    );
  }

  const descendantIds = descendants.map((node) => node.id);
  const taxonomyPath = (await taxonomyCatalog.getNodePath(input.taxonomyNodeId)).map(
    (node) => node.id,
  );
  const planned = await planner.plan(activityCatalog, {
    level: input.level,
    taxonomyNodeId: input.taxonomyNodeId,
    descendantIds,
    requestedCount: input.sessionSize,
  });

  const run = PracticeRun.create({
    id: UniqueId.create(idGenerator).toString(),
    userId: actor.userId,
    mode: "FOCUSED",
    scope: {
      level: input.level,
      taxonomyNodeId: input.taxonomyNodeId,
      taxonomyPath,
      descendantIds,
      requestedCount: input.sessionSize,
    },
    activityIds: planned.activityIds,
    currentIndex: 0,
    status: "in_progress",
    datasetVersion,
    dailySessionId: null,
    createdAt: clock.nowIso(),
  });

  await runRepository.save(run);
  return { run, coveredSubtopicIds: planned.coveredSubtopicIds };
}
