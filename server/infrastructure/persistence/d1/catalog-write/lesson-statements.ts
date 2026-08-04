import type { CatalogSeedLesson } from "@/core/content/ports/catalog-write-port";
import type { D1DatabaseLike, D1PreparedStatement } from "../types/binding";
import { generatedId, statement } from "./shared";

export function lessonStatements(database: D1DatabaseLike, releaseId: string, lessons: CatalogSeedLesson[]): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = [];
  for (const lesson of lessons) {
    statements.push(statement(database, "INSERT INTO Lesson (id) VALUES (?) ON CONFLICT(id) DO NOTHING", [lesson.id]));
    const versionId = generatedId();
    statements.push(statement(database, `INSERT INTO LessonVersion
      (id, releaseId, lessonId, checksum, levelCode, category, taxonomyNodeId, title, summary,
       prerequisites, title, summary, explanation, examples, commonMistakes, tags, difficulty, contentVersion, statusCode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [versionId, releaseId, lesson.id, lesson.checksum,
      lesson.level, lesson.category, lesson.taxonomyNodeId, JSON.stringify(lesson.prerequisiteLessonIds), lesson.title, lesson.summary, lesson.explanation,
      JSON.stringify(lesson.examples), JSON.stringify(lesson.commonMistakes), JSON.stringify(lesson.tags), lesson.difficulty,
      lesson.contentVersion, lesson.status]));
    statements.push(statement(database, "INSERT INTO LessonVersionTaxonomy (id, lessonVersionId, taxonomyNodeId) VALUES (?, ?, ?)", [generatedId(), versionId, lesson.taxonomyNodeId]));
  }
  return statements;
}
