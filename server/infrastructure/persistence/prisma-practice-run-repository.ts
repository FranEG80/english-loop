import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { PracticeRunRepository } from "@/core/practice/ports/practice-run-repository";
import { PracticeRun } from "@/core/practice/domain/practice-run";
import { getPrismaClient } from "../database/prisma-transaction-context";

interface ScopeSnapshot {
  level: string;
  taxonomyNodeId: string;
  taxonomyPath: string[];
  descendantIds: string[];
  requestedCount: number;
}

/**
 * Adaptador Prisma del repositorio de practice runs.
 */
export class PrismaPracticeRunRepository implements PracticeRunRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(runId: string): Promise<PracticeRun | null> {
    const row = await getPrismaClient(this.client).practiceRun.findUnique({
      where: { id: runId },
      include: { dailySession: { select: { id: true } } },
    });
    if (!row) return null;
    const scope = JSON.parse(row.scopeSnapshot) as ScopeSnapshot;
    return PracticeRun.create({
      id: row.id,
      userId: row.userId,
      mode: row.mode as never,
      scope: {
        level: scope.level as "B1" | "B2" | "both",
        taxonomyNodeId: scope.taxonomyNodeId,
        taxonomyPath: scope.taxonomyPath,
        descendantIds: scope.descendantIds,
        requestedCount: scope.requestedCount,
      },
      activityIds: JSON.parse(row.activityIds) as string[],
      currentIndex: row.currentIndex,
      status: row.status as never,
      datasetVersion: row.datasetVersion,
      dailySessionId: row.dailySession?.id ?? null,
      createdAt: row.createdAt.toISOString(),
    });
  }

  async save(run: PracticeRun): Promise<void> {
    const snapshot = run.toSnapshot();
    const scope: ScopeSnapshot = {
      level: snapshot.scope.level,
      taxonomyNodeId: snapshot.scope.taxonomyNodeId,
      taxonomyPath: snapshot.scope.taxonomyPath,
      descendantIds: snapshot.scope.descendantIds,
      requestedCount: snapshot.scope.requestedCount,
    };
    await getPrismaClient(this.client).practiceRun.upsert({
      where: { id: snapshot.id },
      create: {
        id: snapshot.id,
        userId: snapshot.userId,
        mode: snapshot.mode,
        status: snapshot.status,
        scopeSnapshot: JSON.stringify(scope),
        activityIds: JSON.stringify(snapshot.activityIds),
        currentIndex: snapshot.currentIndex,
        datasetVersion: snapshot.datasetVersion,
        createdAt: new Date(snapshot.createdAt),
      },
      update: {
        status: snapshot.status,
        currentIndex: snapshot.currentIndex,
      },
    });
  }
}
