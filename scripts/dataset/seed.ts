import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import type {
  CatalogSeedActivity,
  CatalogSeedInput,
  CatalogSeedLesson,
  CatalogSeedTaxonomyNode,
} from "@/core/content/ports/catalog-write-port";
import { PrismaCatalogWriteAdapter } from "@/server/infrastructure/persistence/prisma-catalog-write-core";
import { sha256Checksum } from "./lib/checksum";
import { loadDataset } from "./lib/load";
import { validateDataset } from "./lib/validation";
import type { Evaluator } from "./lib/types";
import { loadConfig } from "@/server/infrastructure/config/config-core";
import { assertPrismaProvider, createPrismaAdapter } from "@/server/infrastructure/database/prisma-adapter-factory";
import { D1HttpCatalogWriteAdapter } from "@/server/infrastructure/persistence/d1/catalog-write";
import {
  DEMO_PROGRESS_ACTIVITY_LIMIT,
  DEMO_USER_ACTIVE_LEVELS,
  DEMO_USER_EMAIL,
  DEMO_USER_ID,
  DEMO_USER_NAME,
  DEMO_USER_PASSWORD,
  isDemoActivityId,
  isDemoLessonId,
} from "@/core/content/domain/demo-fixture";
import { parseLessonMarkdown } from "@/core/content/domain/lesson-markdown";

export {
  DEMO_LESSON_IDS,
  DEMO_USER_EMAIL,
  DEMO_USER_ID,
} from "@/core/content/domain/demo-fixture";

export interface CliOptions {
  source: string;
  dryRun: boolean;
}

export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { source: "./DATASET", dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source") options.source = argv[i + 1] ?? "./DATASET";
    else if (arg === "--dry-run") options.dryRun = true;
  }
  return options;
}

function expectedAnswers(activity: CatalogSeedActivity["evaluator"]): CatalogSeedActivity["expectedAnswers"] {
  if (activity.strategy === "per_gap") {
    return activity.gaps.flatMap((gap) => gap.answers.map((answer, position) => ({
      gapId: gap.gapId,
      answer,
      position,
    })));
  }
  if (activity.strategy === "exact_text") return [{ gapId: null, answer: activity.answer, position: 0 }];
  if (activity.strategy === "one_of_texts") {
    return activity.answers.map((answer, position) => ({ gapId: null, answer, position }));
  }
  if (activity.strategy === "unordered_set") {
    return activity.correctValues.map((answer, position) => ({ gapId: null, answer, position }));
  }
  if (activity.strategy === "single_option") return [{ gapId: null, answer: activity.correctOptionId, position: 0 }];
  if (activity.strategy === "multiple_options") {
    return activity.correctOptionIds.map((answer, position) => ({ gapId: null, answer, position }));
  }
  if (activity.strategy === "ordered_tokens") {
    return activity.correctTokenIds.map((answer, position) => ({ gapId: null, answer, position }));
  }
  return [];
}

export function buildCatalogSeedInput(
  dataset: Awaited<ReturnType<typeof loadDataset>>,
  datasetVersion: string,
): CatalogSeedInput {
  const taxonomy: CatalogSeedTaxonomyNode[] = dataset.taxonomy.nodes.map((node) => ({
    id: node.id,
    checksum: sha256Checksum.checksum(node),
    parentId: node.parentId,
    kind: node.kind,
    labels: node.labels,
    levels: node.levels,
    selectableForPractice: node.selectableForPractice,
    order: node.order,
  }));
  const lessons: CatalogSeedLesson[] = dataset.lessons.map((lesson) => {
    const content = parseLessonMarkdown(lesson.content);
    return {
      id: lesson.frontmatter.id,
      checksum: sha256Checksum.checksum({ frontmatter: lesson.frontmatter, content: lesson.content }),
      level: lesson.frontmatter.level,
      category: lesson.frontmatter.category,
      taxonomyNodeId: lesson.frontmatter.subtopics[0] ?? lesson.frontmatter.topic,
      prerequisiteLessonIds: lesson.frontmatter.prerequisites,
      title: lesson.frontmatter.title,
      summary: content.summary,
      explanation: lesson.content,
      examples: content.examples,
      commonMistakes: content.commonMistakes,
      tags: lesson.frontmatter.tags,
      difficulty: lesson.frontmatter.difficulty,
      contentVersion: lesson.frontmatter.contentVersion,
      status: lesson.frontmatter.status,
      isDemo: isDemoLessonId(lesson.frontmatter.id),
    };
  });
  const activities: CatalogSeedActivity[] = dataset.activities.map((activity) => ({
    id: activity.id,
    checksum: sha256Checksum.checksum(activity),
    type: activity.type,
    evaluatorStrategy: activity.evaluator.strategy,
    level: activity.level,
    category: activity.category,
    topic: activity.topic,
    subtopic: activity.subtopic,
    difficulty: activity.difficulty,
    instructions: activity.instructions,
    prompt: activity.prompt,
    ...(activity.passage ? { passage: activity.passage } : {}),
    explanation: activity.explanation,
    tags: activity.tags,
    lessonIds: activity.lessonIds,
    taxonomyNodeIds: activity.taxonomyNodeIds,
    estimatedSeconds: activity.estimatedSeconds,
    evaluator: activity.evaluator as Evaluator,
    options: (activity.options ?? []).map((option) => ({ id: option.id, text: option.text, feedback: option.feedback })),
    tokens: (activity.tokens ?? []).map((token) => ({ id: token.id, text: token.text, feedback: token.feedback })),
    pairs: activity.pairs ?? [],
    expectedAnswers: expectedAnswers(activity.evaluator as CatalogSeedActivity["evaluator"]),
    status: activity.status,
    isDemo: isDemoActivityId(activity.id),
  }));
  return {
    datasetVersion,
    checksum: sha256Checksum.checksum({ datasetVersion, taxonomy, lessons, activities }),
    taxonomy,
    lessons,
    activities,
  };
}

export async function runSeed(argv: string[] = process.argv.slice(2)): Promise<void> {
  const options = parseArgs(argv);
  const datasetRoot = path.resolve(options.source);
  console.log(`Sembrando catálogo desde ${datasetRoot}${options.dryRun ? " (dry-run)" : ""}`);

  const dataset = await loadDataset(datasetRoot);
  const issues = await validateDataset(dataset);
  if (issues.length > 0) {
    throw new Error(`Dataset inválido: ${issues.length} error(es).`);
  }
  const datasetVersion = (await readFile(path.join(datasetRoot, "VERSION"), "utf8")).trim();
  const input = buildCatalogSeedInput(dataset, datasetVersion);
  console.log(`Catálogo: ${input.lessons.length} lecciones, ${input.activities.length} actividades, ${input.taxonomy.length} nodos.`);

  if (options.dryRun) {
    console.log("Dry-run: no se escribió nada en la base de datos.");
    return;
  }
  const runtimeConfig = loadConfig();
  if (runtimeConfig.databaseProvider === "d1") {
    if (runtimeConfig.d1Transport !== "http" || !runtimeConfig.d1HttpUrl || !runtimeConfig.d1HttpToken) {
      throw new Error("D1 seed from the CLI requires DATABASE_PROVIDER=d1, D1_TRANSPORT=http, D1_HTTP_URL and D1_HTTP_TOKEN");
    }
    const writer = new D1HttpCatalogWriteAdapter({ url: runtimeConfig.d1HttpUrl, token: runtimeConfig.d1HttpToken });
    const result = await writer.seedCatalog(input);
    await writer.seedDemoAccount();
    console.log(`Release ${result.status}: ${result.releaseId ?? "dry-run"}`);
    return;
  }
  assertPrismaProvider(runtimeConfig.databaseProvider);

  const prisma = new PrismaClient({
    adapter: createPrismaAdapter(runtimeConfig.databaseProvider, runtimeConfig.databaseUrl),
  });
  try {
    const result = await new PrismaCatalogWriteAdapter(prisma).seedCatalog(input);
    await seedDemoAccount(prisma, input, result.releaseId);
    console.log(`Release ${result.status}: ${result.releaseId ?? "dry-run"}`);
  } finally {
    await prisma.$disconnect();
  }
}

export async function seedDemoAccount(
  prisma: PrismaClient,
  input: CatalogSeedInput,
  releaseId: string | null,
): Promise<void> {
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    create: {
      id: DEMO_USER_ID,
      name: DEMO_USER_NAME,
      email: DEMO_USER_EMAIL,
      emailVerified: true,
      isDemo: true,
    },
    update: {
      name: DEMO_USER_NAME,
      emailVerified: true,
      isDemo: true,
    },
  });
  await prisma.userSettings.upsert({
    where: { userId: demoUser.id },
    create: {
      userId: demoUser.id,
      activeLevels: JSON.stringify(DEMO_USER_ACTIVE_LEVELS),
      dailyGoalLessons: 1,
      dailyGoalActivities: 3,
      timezone: "UTC",
    },
    update: {
      activeLevels: JSON.stringify(DEMO_USER_ACTIVE_LEVELS),
      dailyGoalLessons: 1,
      dailyGoalActivities: 3,
      timezone: "UTC",
    },
  });
  const passwordHash = await hashPassword(DEMO_USER_PASSWORD);
  await prisma.account.deleteMany({
    where: { userId: demoUser.id, providerId: "credential" },
  });
  await prisma.account.create({
    data: {
      accountId: demoUser.id,
      providerId: "credential",
      password: passwordHash,
      userId: demoUser.id,
    },
  });

  const demoLessons = input.lessons.filter((lesson) => lesson.isDemo);
  const demoActivities = input.activities
    .filter((activity) => activity.isDemo)
    .sort((left, right) => left.id.localeCompare(right.id))
    .slice(0, DEMO_PROGRESS_ACTIVITY_LIMIT);
  const versions = releaseId
    ? await prisma.activityVersion.findMany({
      where: { releaseId, activityId: { in: demoActivities.map((activity) => activity.id) } },
      select: { id: true, activityId: true },
    })
    : [];
  const versionByActivity = new Map(versions.map((version) => [version.activityId, version.id]));
  const taxonomyStats = new Map<string, { attemptsCount: number; correctCount: number }>();
  demoActivities.forEach((activity, index) => {
    const correctCount = index % 5 === 0 ? 0 : 1;
    for (const taxonomyNodeId of activity.taxonomyNodeIds) {
      const current = taxonomyStats.get(taxonomyNodeId) ?? { attemptsCount: 0, correctCount: 0 };
      current.attemptsCount += 1;
      current.correctCount += correctCount;
      taxonomyStats.set(taxonomyNodeId, current);
    }
  });

  await prisma.$transaction(async (tx) => {
    await tx.userLessonProgress.deleteMany({ where: { userId: DEMO_USER_ID } });
    await tx.userActivityProgress.deleteMany({ where: { userId: DEMO_USER_ID } });
    await tx.taxonomyProgress.deleteMany({ where: { userId: DEMO_USER_ID } });
    await tx.reviewItem.deleteMany({ where: { userId: DEMO_USER_ID } });

    for (const lesson of demoLessons) {
      await tx.userLessonProgress.create({
        data: { userId: DEMO_USER_ID, lessonId: lesson.id, viewed: true, viewedAt: new Date("2026-07-01T09:00:00.000Z"), errorsPending: 0 },
      });
    }
    for (const [index, activity] of demoActivities.entries()) {
      const attemptsCount = 1;
      await tx.userActivityProgress.create({
        data: { userId: DEMO_USER_ID, activityId: activity.id, attemptsCount, correctCount: index % 5 === 0 ? 0 : 1, lastResult: index % 5 !== 0, lastAttemptAt: new Date("2026-07-02T09:00:00.000Z") },
      });
    }
    for (const [taxonomyNodeId, stats] of taxonomyStats) {
      await tx.taxonomyProgress.create({ data: { userId: DEMO_USER_ID, taxonomyNodeId, ...stats } });
    }
    for (const [index, activity] of demoActivities.slice(0, 3).entries()) {
      await tx.reviewItem.create({
        data: {
          id: `demo-review-${index + 1}`,
          userId: DEMO_USER_ID,
          activityId: activity.id,
          activityVersionId: versionByActivity.get(activity.id) ?? null,
          lessonId: activity.lessonIds[0] ?? null,
          taxonomyNodeId: activity.taxonomyNodeIds[0] ?? "demo",
          level: activity.level,
          stage: 0,
          consecutiveCorrect: 0,
          dueAt: new Date(index < 2 ? "2026-07-03T00:00:00.000Z" : "2026-08-10T00:00:00.000Z"),
          failedAt: new Date("2026-07-01T09:00:00.000Z"),
          attemptsCount: 1,
        },
      });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
