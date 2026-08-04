import type { CatalogSeedActivity } from "@/core/content/ports/catalog-write-port";
import type { D1DatabaseLike, D1PreparedStatement } from "../types/binding";
import { generatedId, statement } from "./shared";

export function activityStatements(database: D1DatabaseLike, releaseId: string, activities: CatalogSeedActivity[]): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = [];
  for (const activity of activities) {
    statements.push(statement(database, "INSERT INTO Activity (id) VALUES (?) ON CONFLICT(id) DO NOTHING", [activity.id]));
    const versionId = generatedId();
    statements.push(statement(database, `INSERT INTO ActivityVersion
      (id, releaseId, activityId, checksum, activityTypeCode, evaluatorStrategyCode, levelCode, category,
       topic, subtopic, difficulty, instructions, prompt, passage, explanation, tags, lessonIds,
       estimatedSeconds, evaluatorData, statusCode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [versionId, releaseId, activity.id,
      activity.checksum, activity.type, activity.evaluatorStrategy, activity.level, activity.category, activity.topic,
      activity.subtopic, activity.difficulty, activity.instructions, activity.prompt, activity.passage ?? null,
      activity.explanation, JSON.stringify(activity.tags), JSON.stringify(activity.lessonIds), activity.estimatedSeconds,
      JSON.stringify(activity.evaluator), activity.status]));
    for (const [position, lessonId] of activity.lessonIds.entries()) statements.push(statement(database,
      "INSERT INTO ActivityVersionLesson (id, activityVersionId, lessonId, position) VALUES (?, ?, ?, ?)", [generatedId(), versionId, lessonId, position]));
    for (const [position, taxonomyNodeId] of activity.taxonomyNodeIds.entries()) statements.push(statement(database,
      "INSERT INTO ActivityVersionTaxonomy (id, activityVersionId, taxonomyNodeId, position) VALUES (?, ?, ?, ?)", [generatedId(), versionId, taxonomyNodeId, position]));
    for (const [position, option] of activity.options.entries()) statements.push(statement(database,
      "INSERT INTO ActivityVersionOption (id, activityVersionId, optionId, label, feedback, position) VALUES (?, ?, ?, ?, ?, ?)", [generatedId(), versionId, option.id, option.text, option.feedback ?? null, position]));
    for (const [position, token] of activity.tokens.entries()) statements.push(statement(database,
      "INSERT INTO ActivityVersionToken (id, activityVersionId, tokenId, label, feedback, position) VALUES (?, ?, ?, ?, ?, ?)", [generatedId(), versionId, token.id, token.text, token.feedback ?? null, position]));
    for (const [position, pair] of activity.pairs.entries()) statements.push(statement(database,
      "INSERT INTO ActivityVersionPair (id, activityVersionId, leftId, leftLabel, rightId, rightLabel, position) VALUES (?, ?, ?, ?, ?, ?, ?)", [generatedId(), versionId, pair.leftId, pair.left, pair.rightId, pair.right, position]));
    for (const answer of activity.expectedAnswers) statements.push(statement(database,
      "INSERT INTO ActivityExpectedAnswer (id, activityVersionId, gapId, answer, position) VALUES (?, ?, ?, ?, ?)", [generatedId(), versionId, answer.gapId, answer.answer, answer.position]));
  }
  return statements;
}
