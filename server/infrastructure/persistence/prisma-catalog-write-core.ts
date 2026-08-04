import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import type {
  CatalogSeedInput,
  CatalogSeedResult,
  CatalogWritePort,
} from "@/core/content/ports/catalog-write-port";
import {
  ACTIVE_CATALOG_PUBLICATION_ID,
  PUBLISHED_CONTENT_STATUS,
} from "@/core/content/domain/content-version";

function id(): string {
  return randomUUID();
}

function distinct<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/**
 * Prisma implementation of the catalog write port. Release creation and
 * publication are separated from the atomic population transaction so a
 * failed import remains auditable without exposing partial content.
 */
export class PrismaCatalogWriteAdapter implements CatalogWritePort {
  constructor(private readonly client: PrismaClient) {}

  async seedCatalog(
    input: CatalogSeedInput,
    options: { dryRun?: boolean } = {},
  ): Promise<CatalogSeedResult> {
    const counts = {
      taxonomy: input.taxonomy.length,
      lessons: input.lessons.length,
      activities: input.activities.length,
    };
    if (options.dryRun) {
      return {
        releaseId: null,
        datasetVersion: input.datasetVersion,
        checksum: input.checksum,
        status: "dry_run",
        counts,
      };
    }

    const existing = await this.client.catalogRelease.findUnique({
      where: {
        datasetVersion_checksum: {
          datasetVersion: input.datasetVersion,
          checksum: input.checksum,
        },
      },
    });
    if (existing?.status === PUBLISHED_CONTENT_STATUS) {
      const publication = await this.client.catalogPublication.findUnique({
        where: { id: ACTIVE_CATALOG_PUBLICATION_ID },
      });
      if (publication?.releaseId !== existing.id) {
        await this.client.catalogPublication.upsert({
          where: { id: ACTIVE_CATALOG_PUBLICATION_ID },
          create: { id: ACTIVE_CATALOG_PUBLICATION_ID, releaseId: existing.id },
          update: { releaseId: existing.id, publishedAt: new Date() },
        });
      }
      return {
        releaseId: existing.id,
        datasetVersion: input.datasetVersion,
        checksum: input.checksum,
        status: "unchanged",
        counts,
      };
    }

    const release = existing
      ? await this.client.catalogRelease.update({
          where: { id: existing.id },
          data: { status: "preparing", publishedAt: null },
        })
      : await this.client.catalogRelease.create({
          data: {
            datasetVersion: input.datasetVersion,
            checksum: input.checksum,
            status: "preparing",
          },
        });
    const importRecord = await this.client.datasetImport.create({
      data: {
        datasetVersion: input.datasetVersion,
        checksum: input.checksum,
        status: "started",
        releaseId: release.id,
      },
    });

    try {
      await this.client.$transaction(async (tx) => {
        const activityTypes = distinct(input.activities.map((activity) => activity.type));
        const evaluatorStrategies = distinct(input.activities.map((activity) => activity.evaluatorStrategy));
        const levels = distinct([
          ...input.lessons.map((lesson) => lesson.level),
          ...input.activities.map((activity) => activity.level),
        ]);
        const statuses = distinct([
          ...input.lessons.map((lesson) => lesson.status),
          ...input.activities.map((activity) => activity.status),
        ]);

        for (const code of activityTypes) {
          await tx.activityType.upsert({ where: { code }, update: {}, create: { code } });
        }
        for (const code of evaluatorStrategies) {
          await tx.evaluatorStrategy.upsert({ where: { code }, update: {}, create: { code } });
        }
        for (const code of levels) {
          await tx.cefrLevel.upsert({ where: { code }, update: {}, create: { code } });
        }
        for (const code of statuses) {
          await tx.editorialStatus.upsert({ where: { code }, update: {}, create: { code } });
        }

        for (const node of input.taxonomy) {
          await tx.taxonomyNode.upsert({ where: { id: node.id }, update: {}, create: { id: node.id } });
          await tx.taxonomyNodeVersion.create({
            data: {
              releaseId: release.id,
              nodeId: node.id,
              checksum: node.checksum,
              parentId: node.parentId,
              kind: node.kind,
              labelsEn: node.labels.en,
              labelsEs: node.labels.es,
              levels: JSON.stringify(node.levels),
              selectableForPractice: node.selectableForPractice,
              sortOrder: node.order,
            },
          });
        }

        for (const lesson of input.lessons) {
          await tx.lesson.upsert({ where: { id: lesson.id }, update: {}, create: { id: lesson.id } });
          const version = await tx.lessonVersion.create({
            data: {
              releaseId: release.id,
              lessonId: lesson.id,
              checksum: lesson.checksum,
              levelCode: lesson.level,
              category: lesson.category,
              taxonomyNodeId: lesson.taxonomyNodeId,
              prerequisites: JSON.stringify(lesson.prerequisiteLessonIds),
              title: lesson.title,
              summary: lesson.summary,
              explanation: lesson.explanation,
              examples: JSON.stringify(lesson.examples),
              commonMistakes: JSON.stringify(lesson.commonMistakes),
              tags: JSON.stringify(lesson.tags),
              difficulty: lesson.difficulty,
              contentVersion: lesson.contentVersion,
              statusCode: lesson.status,
            },
          });
          await tx.lessonVersionTaxonomy.create({
            data: { lessonVersionId: version.id, taxonomyNodeId: lesson.taxonomyNodeId },
          });
        }

        for (const activity of input.activities) {
          await tx.activity.upsert({ where: { id: activity.id }, update: {}, create: { id: activity.id } });
          const version = await tx.activityVersion.create({
            data: {
              releaseId: release.id,
              activityId: activity.id,
              checksum: activity.checksum,
              activityTypeCode: activity.type,
              evaluatorStrategyCode: activity.evaluatorStrategy,
              levelCode: activity.level,
              category: activity.category,
              topic: activity.topic,
              subtopic: activity.subtopic,
              difficulty: activity.difficulty,
              instructions: activity.instructions,
              prompt: activity.prompt,
              passage: activity.passage ?? null,
              explanation: activity.explanation,
              tags: JSON.stringify(activity.tags),
              lessonIds: JSON.stringify(activity.lessonIds),
              estimatedSeconds: activity.estimatedSeconds,
              evaluatorData: JSON.stringify(activity.evaluator),
              statusCode: activity.status,
            },
          });
          await tx.activityVersionLesson.createMany({
            data: activity.lessonIds.map((lessonId, position) => ({
              id: id(), activityVersionId: version.id, lessonId, position,
            })),
          });
          await tx.activityVersionTaxonomy.createMany({
            data: activity.taxonomyNodeIds.map((taxonomyNodeId, position) => ({
              id: id(), activityVersionId: version.id, taxonomyNodeId, position,
            })),
          });
          await tx.activityVersionOption.createMany({
            data: activity.options.map((option, position) => ({
              id: id(), activityVersionId: version.id, optionId: option.id,
              label: option.text, feedback: option.feedback ?? null, position,
            })),
          });
          await tx.activityVersionToken.createMany({
            data: activity.tokens.map((token, position) => ({
              id: id(), activityVersionId: version.id, tokenId: token.id,
              label: token.text, feedback: token.feedback ?? null, position,
            })),
          });
          await tx.activityVersionPair.createMany({
            data: activity.pairs.map((pair, position) => ({
              id: id(), activityVersionId: version.id, leftId: pair.leftId,
              leftLabel: pair.left, rightId: pair.rightId, rightLabel: pair.right,
              position,
            })),
          });
          await tx.activityExpectedAnswer.createMany({
            data: activity.expectedAnswers.map((answer) => ({
              id: id(), activityVersionId: version.id, gapId: answer.gapId,
              answer: answer.answer, position: answer.position,
            })),
          });
        }

        await tx.catalogRelease.update({
          where: { id: release.id },
          data: { status: PUBLISHED_CONTENT_STATUS, publishedAt: new Date() },
        });
        await tx.catalogPublication.upsert({
          where: { id: ACTIVE_CATALOG_PUBLICATION_ID },
          create: { id: ACTIVE_CATALOG_PUBLICATION_ID, releaseId: release.id },
          update: { releaseId: release.id, publishedAt: new Date() },
        });
        await tx.datasetImport.update({
          where: { id: importRecord.id },
          data: {
            status: "completed",
            finishedAt: new Date(),
            releaseId: release.id,
            result: JSON.stringify({ ...counts, checksum: input.checksum }),
          },
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.client.catalogRelease.update({
        where: { id: release.id },
        data: { status: "failed" },
      });
      await this.client.datasetImport.update({
        where: { id: importRecord.id },
        data: { status: "failed", finishedAt: new Date(), error: message },
      });
      throw error;
    }

    return {
      releaseId: release.id,
      datasetVersion: input.datasetVersion,
      checksum: input.checksum,
      status: PUBLISHED_CONTENT_STATUS,
      counts,
    };
  }
}
