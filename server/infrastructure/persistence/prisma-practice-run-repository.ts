import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { PracticeRunRepository } from "@/core/practice/ports/practice-run-repository";
import { PracticeRun } from "@/core/practice/domain/practice-run";
import { PUBLISHED_CONTENT_STATUS } from "@/core/content/domain/content-version";
import type { Activity } from "@/core/content/domain/types/activity";
import { getPrismaClient } from "../database/prisma-transaction-context";

interface ScopeSnapshot {
  level: string;
  taxonomyNodeId: string;
  taxonomyPath: string[];
  descendantIds: string[];
  requestedCount: number;
}

function parseActivitySnapshot(value: string | null): Activity | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as Activity;
  } catch {
    return null;
  }
}

/**
 * Adaptador Prisma del repositorio de practice runs.
 */
export class PrismaPracticeRunRepository implements PracticeRunRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(runId: string): Promise<PracticeRun | null> {
    const row = await getPrismaClient(this.client).practiceRun.findUnique({
      where: { id: runId },
      include: {
        dailySession: { select: { id: true } },
        items: {
          orderBy: { position: "asc" },
          select: {
            activityId: true,
            activityVersionId: true,
            activitySnapshot: true,
            isRepetition: true,
          },
        },
      },
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
      activityIds: row.items.map((item) => item.activityId),
      activityVersionIds: row.items.map((item) => item.activityVersionId),
      activitySnapshots: row.items.map((item) => parseActivitySnapshot(item.activitySnapshot)),
      repetitionActivityIds: row.items.filter((item) => item.isRepetition).map((item) => item.activityId),
      originalActivityCount: row.originalActivityCount || row.items.filter((item) => !item.isRepetition).length,
      currentIndex: row.currentIndex,
      status: row.status as never,
      datasetVersion: row.datasetVersion,
      dailySessionId: row.dailySession?.id ?? null,
      createdAt: row.createdAt.toISOString(),
    });
  }

  async save(run: PracticeRun): Promise<void> {
    const snapshot = run.toSnapshot();
    const originalActivityCount = run.originalActivityCount;
    const scope: ScopeSnapshot = {
      level: snapshot.scope.level,
      taxonomyNodeId: snapshot.scope.taxonomyNodeId,
      taxonomyPath: snapshot.scope.taxonomyPath,
      descendantIds: snapshot.scope.descendantIds,
      requestedCount: snapshot.scope.requestedCount,
    };
    const db = getPrismaClient(this.client);
    await db.practiceRun.upsert({
      where: { id: snapshot.id },
      create: {
        id: snapshot.id,
        userId: snapshot.userId,
        mode: snapshot.mode,
        status: snapshot.status,
        scopeSnapshot: JSON.stringify(scope),
        currentIndex: snapshot.currentIndex,
        originalActivityCount,
        datasetVersion: snapshot.datasetVersion,
        createdAt: new Date(snapshot.createdAt),
      },
      update: {
        status: snapshot.status,
        currentIndex: snapshot.currentIndex,
        originalActivityCount,
      },
    });

    // A run is a server snapshot. Never rebind its items to the currently
    // active release after a newer dataset has been published.
    const release = await db.catalogRelease.findFirst({
      where: {
        datasetVersion: snapshot.datasetVersion,
        status: PUBLISHED_CONTENT_STATUS,
      },
      orderBy: { publishedAt: "desc" },
      select: { id: true },
    });
    for (let position = 0; position < snapshot.activityIds.length; position += 1) {
      const activityId = snapshot.activityIds[position];
      const isRepetition = position >= originalActivityCount;
      const pinnedActivityVersionId = snapshot.activityVersionIds?.[position] ?? null;
      const activityVersion = pinnedActivityVersionId
        ? { id: pinnedActivityVersionId }
        : release
        ? await db.activityVersion.findFirst({
            where: { releaseId: release.id, activityId, statusCode: PUBLISHED_CONTENT_STATUS },
            select: { id: true },
          })
        : null;
      const activitySnapshot = snapshot.activitySnapshots?.[position] ?? null;
      await db.practiceRunItem.upsert({
        where: { practiceRunId_position: { practiceRunId: snapshot.id, position } },
        create: {
          id: `${snapshot.id}:${position}`,
          practiceRunId: snapshot.id,
          position,
          lessonId: null,
          activityId,
          activityVersionId: activityVersion?.id ?? null,
          activitySnapshot: activitySnapshot ? JSON.stringify(activitySnapshot) : null,
          origin: snapshot.mode,
          status: isRepetition
            ? "repetition"
            : position === snapshot.currentIndex
              ? "active"
              : position < snapshot.currentIndex
                ? "answered"
                : "pending",
          isRepetition,
          repetitionOfItemId: isRepetition ? `${snapshot.id}:${snapshot.activityIds.findIndex((id) => id === activityId)}` : null,
        },
        update: {
          activityVersionId: activityVersion?.id ?? null,
          activitySnapshot: activitySnapshot ? JSON.stringify(activitySnapshot) : null,
          status: isRepetition
            ? "repetition"
            : position === snapshot.currentIndex
              ? "active"
              : position < snapshot.currentIndex
                ? "answered"
                : "pending",
          isRepetition,
        },
      });
    }
  }
}
