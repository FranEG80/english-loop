import "dotenv/config";
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
  DEMO_LESSON_IDS,
  DEMO_USER_ACTIVE_LEVELS,
  DEMO_USER_EMAIL,
  DEMO_USER_ID,
  DEMO_USER_NAME,
  isDemoActivity,
  isDemoLessonId,
} from "@/core/content/domain/demo-fixture";

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

function extractSummary(content: string): string {
  const lines = content.split("\n");
  const summaryStart = lines.findIndex((line) => line.trim() === "# Resumen");
  if (summaryStart === -1) return "";
  const paragraphs: string[] = [];
  for (let i = summaryStart + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.startsWith("#") && line !== "# Resumen") break;
    if (line) paragraphs.push(line);
    if (paragraphs.length >= 2) break;
  }
  return paragraphs.join(" ");
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
  const lessons: CatalogSeedLesson[] = dataset.lessons.map((lesson) => ({
    id: lesson.frontmatter.id,
    checksum: sha256Checksum.checksum({ frontmatter: lesson.frontmatter, content: lesson.content }),
    level: lesson.frontmatter.level,
    category: lesson.frontmatter.category,
    taxonomyNodeId: lesson.frontmatter.subtopics[0] ?? lesson.frontmatter.topic,
    prerequisiteLessonIds: lesson.frontmatter.prerequisites,
    title: lesson.frontmatter.title,
    summary: extractSummary(lesson.content),
    explanation: lesson.content,
    examples: [],
    commonMistakes: [],
    tags: lesson.frontmatter.tags,
    difficulty: lesson.frontmatter.difficulty,
    contentVersion: lesson.frontmatter.contentVersion,
    status: lesson.frontmatter.status,
    isDemo: isDemoLessonId(lesson.frontmatter.id),
  }));
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
    isDemo: isDemoActivity(activity.lessonIds),
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
    await seedDemoAccount(prisma);
    console.log(`Release ${result.status}: ${result.releaseId ?? "dry-run"}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedDemoAccount(prisma: PrismaClient): Promise<void> {
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
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
