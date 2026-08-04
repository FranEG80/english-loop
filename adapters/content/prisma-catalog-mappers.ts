import type { Activity } from "@/core/content/domain/types/activity";
import type { Lesson } from "@/core/content/domain/types/lesson";

export function parseCatalogJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export interface PrismaLessonVersionRow {
  id: string;
  lessonId: string;
  levelCode: string;
  category: string;
  taxonomyNodeId: string;
  prerequisites: string;
  title: string;
  summary: string;
  explanation: string;
  examples: string;
  commonMistakes: string;
  tags: string;
  difficulty: number;
  statusCode: string;
  contentVersion: number;
}

export function mapPrismaLesson(row: PrismaLessonVersionRow, relatedActivityIds: string[]): Lesson {
  return {
    id: row.lessonId,
    versionId: row.id,
    level: row.levelCode as Lesson["level"],
    category: row.category as Lesson["category"],
    taxonomyNodeId: row.taxonomyNodeId,
    prerequisiteLessonIds: parseCatalogJson(row.prerequisites, []),
    title: row.title,
    summary: row.summary,
    explanation: row.explanation,
    examples: parseCatalogJson(row.examples, []),
    commonMistakes: parseCatalogJson(row.commonMistakes, []),
    relatedActivityIds: [...new Set(relatedActivityIds)].sort(),
    tags: parseCatalogJson(row.tags, []),
    difficulty: row.difficulty as 1 | 2 | 3,
    status: row.statusCode as Lesson["status"],
    contentVersion: row.contentVersion,
  };
}

export interface PrismaActivityVersionRow {
  id: string;
  activityId: string;
  levelCode: string;
  activityTypeCode: string;
  category: string;
  topic: string;
  subtopic: string;
  difficulty: number;
  instructions: string;
  prompt: string;
  passage: string | null;
  explanation: string;
  tags: string;
  lessonIds: string;
  estimatedSeconds: number;
  evaluatorData: string;
  statusCode: string;
  options: Array<{ optionId: string; label: string; feedback: string | null; position: number }>;
  tokens: Array<{ tokenId: string; label: string; feedback: string | null; position: number }>;
  pairs: Array<{ leftId: string; leftLabel: string; rightId: string; rightLabel: string; position: number }>;
  lessonLinks: Array<{ lessonId: string; position: number }>;
  taxonomyLinks: Array<{ taxonomyNodeId: string; position: number }>;
}

function optionalFeedback(feedback: string | null): { feedback?: string } {
  return feedback === null ? {} : { feedback };
}

export function mapPrismaActivity(row: PrismaActivityVersionRow): Activity {
  const options = [...row.options]
    .sort((a, b) => a.position - b.position)
    .map((option) => ({ id: option.optionId, text: option.label, ...optionalFeedback(option.feedback) }));
  const tokens = [...row.tokens]
    .sort((a, b) => a.position - b.position)
    .map((token) => ({ id: token.tokenId, text: token.label, ...optionalFeedback(token.feedback) }));
  const pairs = [...row.pairs]
    .sort((a, b) => a.position - b.position)
    .map((pair) => ({
      leftId: pair.leftId,
      left: pair.leftLabel,
      rightId: pair.rightId,
      right: pair.rightLabel,
    }));
  const lessonIds = row.lessonLinks.length > 0
    ? [...row.lessonLinks].sort((a, b) => a.position - b.position).map((link) => link.lessonId)
    : parseCatalogJson(row.lessonIds, []);
  const taxonomyNodeIds = [...row.taxonomyLinks]
    .sort((a, b) => a.position - b.position)
    .map((link) => link.taxonomyNodeId);

  return {
    id: row.activityId,
    versionId: row.id,
    level: row.levelCode as Activity["level"],
    type: row.activityTypeCode,
    category: row.category,
    topic: row.topic,
    subtopic: row.subtopic,
    taxonomyNodeIds,
    difficulty: row.difficulty,
    instructions: row.instructions,
    prompt: row.prompt,
    ...(row.passage ? { passage: row.passage } : {}),
    options: options.length > 0 ? options : undefined,
    tokens: tokens.length > 0 ? tokens : undefined,
    pairs: pairs.length > 0 ? pairs : undefined,
    lessonIds,
    tags: parseCatalogJson(row.tags, []),
    estimatedSeconds: row.estimatedSeconds,
    evaluator: parseCatalogJson(row.evaluatorData, {
      strategy: "exact_text",
      answer: "",
      normalization: {
        trim: true,
        collapseWhitespace: true,
        caseSensitive: false,
        ignoreTerminalPunctuation: true,
        normaliseApostrophes: true,
      },
    }) as Activity["evaluator"],
    explanation: row.explanation,
    status: row.statusCode as Activity["status"],
  };
}
