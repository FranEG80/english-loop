import type { D1DatabaseLike } from "../types/binding";
import type { D1Operation } from "../types/operations";
import { bind, type PreparedOperation } from "./shared";

type CatalogOperation = Extract<D1Operation, { name: "activityById" | "activityByVersionId" | "catalogLessons" | "catalogActivities" | "catalogTaxonomy" | "catalogCounts" }>;

function demoPredicate(alias: string, includeDemo = false): string {
  return includeDemo ? `${alias}.isDemo = 1` : "1 = 1";
}

function textSearch(
  columns: string[],
  terms: string[] | undefined,
): { sql: string; bindings: string[] } {
  const bindings: string[] = [];
  const clauses = (terms ?? []).map((term) => {
    bindings.push(...columns.map(() => `%${term}%`));
    return `AND (${columns.map((column) => `${column} LIKE ?`).join(" OR ")})`;
  });
  return { sql: clauses.join("\n"), bindings };
}

function lessonFilters(operation: Extract<CatalogOperation, { name: "catalogLessons" | "catalogCounts" }>) {
  const search = textSearch(
    ["v.lessonId", "v.title", "v.summary", "v.category", "v.taxonomyNodeId", "v.tags"],
    operation.queryTerms,
  );
  return {
    sql: `AND (? IS NULL OR v.levelCode = ?)
          AND (? IS NULL OR v.category = ?)
          ${search.sql}`,
    bindings: [
      operation.level ?? null,
      operation.level ?? null,
      operation.category ?? null,
      operation.category ?? null,
      ...search.bindings,
    ],
  };
}

function activityFilters(operation: Extract<CatalogOperation, { name: "catalogActivities" | "catalogCounts" }>) {
  const taxonomyNodeIds = operation.taxonomyNodeIds ??
    (operation.taxonomyNodeId ? [operation.taxonomyNodeId] : []);
  const search = textSearch(
    [
      "v.activityId",
      "v.activityTypeCode",
      "v.category",
      "v.topic",
      "v.subtopic",
      "v.instructions",
      "v.prompt",
      "v.tags",
      "COALESCE((SELECT group_concat(t.taxonomyNodeId, ' ') FROM ActivityVersionTaxonomy t WHERE t.activityVersionId = v.id), '')",
    ],
    operation.queryTerms,
  );
  const interactionSql = operation.interactionMode === "matching_pairs"
    ? "AND v.activityTypeCode = 'matching'"
    : operation.interactionMode === "sentence_builder"
      ? "AND v.activityTypeCode = 'word_order'"
      : operation.interactionMode === "standard"
        ? "AND v.activityTypeCode NOT IN ('matching', 'word_order')"
        : operation.interactionMode
          ? "AND 0 = 1"
          : "";
  return {
    sql: `AND (? IS NULL OR v.levelCode = ?)
          AND (? = 0 OR EXISTS (SELECT 1 FROM ActivityVersionTaxonomy t
            WHERE t.activityVersionId = v.id AND t.taxonomyNodeId IN (SELECT value FROM json_each(?))))
          AND (? = 0 OR EXISTS (SELECT 1 FROM ActivityVersionLesson l
            WHERE l.activityVersionId = v.id AND l.lessonId IN (SELECT value FROM json_each(?))))
          AND (? IS NULL OR v.activityTypeCode = ?)
          ${interactionSql}
          ${search.sql}`,
    bindings: [
      operation.level ?? null,
      operation.level ?? null,
      taxonomyNodeIds.length,
      JSON.stringify(taxonomyNodeIds),
      operation.lessonIds?.length ?? 0,
      JSON.stringify(operation.lessonIds ?? []),
      operation.activityType ?? null,
      operation.activityType ?? null,
      ...search.bindings,
    ],
  };
}

const activityProjection = `v.id, v.activityId, v.levelCode,
          v.activityTypeCode, v.category, v.topic, v.subtopic, v.difficulty,
          v.instructions, v.prompt, v.passage, v.explanation, v.tags, v.lessonIds,
          v.estimatedSeconds, v.evaluatorData, v.statusCode,
          COALESCE((SELECT json_group_array(json_object(
            'optionId', o.optionId, 'label', o.label, 'feedback', o.feedback, 'position', o.position))
            FROM ActivityVersionOption o WHERE o.activityVersionId = v.id), '[]') AS options,
          COALESCE((SELECT json_group_array(json_object(
            'tokenId', t.tokenId, 'label', t.label, 'feedback', t.feedback, 'position', t.position))
            FROM ActivityVersionToken t WHERE t.activityVersionId = v.id), '[]') AS tokens,
          COALESCE((SELECT json_group_array(json_object(
            'leftId', p.leftId, 'leftLabel', p.leftLabel, 'rightId', p.rightId,
            'rightLabel', p.rightLabel, 'position', p.position))
            FROM ActivityVersionPair p WHERE p.activityVersionId = v.id), '[]') AS pairs,
          COALESCE((SELECT json_group_array(json_object('lessonId', l.lessonId, 'position', l.position))
            FROM ActivityVersionLesson l WHERE l.activityVersionId = v.id), '[]') AS lessonLinks,
          COALESCE((SELECT json_group_array(json_object('taxonomyNodeId', t.taxonomyNodeId, 'position', t.position))
            FROM ActivityVersionTaxonomy t WHERE t.activityVersionId = v.id), '[]') AS taxonomyLinks`;

export function prepareCatalogOperation(database: D1DatabaseLike, operation: CatalogOperation): PreparedOperation {
  switch (operation.name) {
    case "activityById":
      return bind(database, `SELECT ${activityProjection}
        FROM ActivityVersion v JOIN Activity a ON a.id = v.activityId JOIN CatalogPublication p ON p.releaseId = v.releaseId
        WHERE p.id = 'active' AND v.statusCode = 'published' AND ${demoPredicate("a", operation.includeDemo)} AND v.activityId = ?
        ORDER BY v.id DESC LIMIT 1`, [operation.activityId]);
    case "activityByVersionId":
      return bind(database, `SELECT ${activityProjection}
        FROM ActivityVersion v JOIN Activity a ON a.id = v.activityId
        WHERE v.id = ? AND v.statusCode = 'published' AND ${demoPredicate("a", operation.includeDemo)}`, [operation.activityVersionId]);
    case "catalogLessons":
      {
      const filters = lessonFilters(operation);
      const pageSql = operation.limit === undefined
        ? ""
        : operation.offset !== undefined
          ? "LIMIT ? OFFSET ?"
          : "AND (? IS NULL OR v.lessonId > ?) ORDER BY v.lessonId ASC LIMIT ?";
      const pageBindings = operation.limit === undefined
        ? []
        : operation.offset !== undefined
          ? [operation.limit, operation.offset]
          : [operation.cursor ?? null, operation.cursor ?? null, operation.limit];
      return bind(database, `SELECT v.id, v.lessonId, v.levelCode, v.category, v.taxonomyNodeId,
          v.prerequisites, v.title, v.summary, v.explanation, v.examples, v.commonMistakes,
          v.tags, v.difficulty, v.contentVersion, v.statusCode,
          COALESCE((SELECT json_group_array(av.activityId)
            FROM ActivityVersionLesson l JOIN ActivityVersion av ON av.id = l.activityVersionId JOIN Activity a ON a.id = av.activityId
            WHERE l.lessonId = v.lessonId AND av.releaseId = v.releaseId AND av.statusCode = 'published' AND ${demoPredicate("a", operation.includeDemo)}), '[]') AS relatedActivityIds
        FROM LessonVersion v JOIN Lesson le ON le.id = v.lessonId JOIN CatalogPublication p ON p.releaseId = v.releaseId
        WHERE p.id = 'active' AND v.statusCode = 'published' AND ${demoPredicate("le", operation.includeDemo)}
          ${filters.sql}
        ${operation.offset !== undefined ? "ORDER BY v.lessonId ASC" : operation.limit === undefined ? "ORDER BY v.lessonId ASC" : ""} ${pageSql}`,
        [...filters.bindings, ...pageBindings]);
      }
    case "catalogActivities":
      {
      const filters = activityFilters(operation);
      const pageSql = operation.limit === undefined
        ? ""
        : operation.offset !== undefined
          ? "LIMIT ? OFFSET ?"
          : "AND (? IS NULL OR v.activityId > ?) ORDER BY v.activityId ASC LIMIT ?";
      const pageBindings = operation.limit === undefined
        ? []
        : operation.offset !== undefined
          ? [operation.limit, operation.offset]
          : [operation.cursor ?? null, operation.cursor ?? null, operation.limit];
      return bind(database, `SELECT v.id, v.activityId, v.levelCode, v.activityTypeCode,
          v.category, v.topic, v.subtopic, v.difficulty, v.instructions, v.prompt,
          v.passage, v.explanation, v.tags, v.lessonIds, v.estimatedSeconds,
          v.evaluatorData, v.statusCode,
          COALESCE((SELECT json_group_array(json_object(
            'optionId', o.optionId, 'label', o.label, 'feedback', o.feedback, 'position', o.position))
            FROM ActivityVersionOption o WHERE o.activityVersionId = v.id), '[]') AS options,
          COALESCE((SELECT json_group_array(json_object(
            'tokenId', t.tokenId, 'label', t.label, 'feedback', t.feedback, 'position', t.position))
            FROM ActivityVersionToken t WHERE t.activityVersionId = v.id), '[]') AS tokens,
          COALESCE((SELECT json_group_array(json_object(
            'leftId', p.leftId, 'leftLabel', p.leftLabel, 'rightId', p.rightId,
            'rightLabel', p.rightLabel, 'position', p.position))
            FROM ActivityVersionPair p WHERE p.activityVersionId = v.id), '[]') AS pairs,
          COALESCE((SELECT json_group_array(json_object('lessonId', l.lessonId, 'position', l.position))
            FROM ActivityVersionLesson l WHERE l.activityVersionId = v.id), '[]') AS lessonLinks,
          COALESCE((SELECT json_group_array(json_object('taxonomyNodeId', t.taxonomyNodeId, 'position', t.position))
            FROM ActivityVersionTaxonomy t WHERE t.activityVersionId = v.id), '[]') AS taxonomyLinks
        FROM ActivityVersion v JOIN Activity a ON a.id = v.activityId JOIN CatalogPublication p ON p.releaseId = v.releaseId
        WHERE p.id = 'active' AND v.statusCode = 'published' AND ${demoPredicate("a", operation.includeDemo)}
          ${filters.sql}
        ${operation.offset !== undefined ? "ORDER BY v.activityId ASC" : operation.limit === undefined ? "ORDER BY v.activityId ASC" : ""} ${pageSql}`,
        [...filters.bindings, ...pageBindings]);
      }
    case "catalogTaxonomy":
      return bind(database, `SELECT nodeId, parentId, kind, labelsEn, labelsEs, levels,
          selectableForPractice, sortOrder
        FROM TaxonomyNodeVersion v JOIN CatalogPublication p ON p.releaseId = v.releaseId
        WHERE p.id = 'active' ORDER BY parentId ASC, sortOrder ASC`, []);
    case "catalogCounts":
      if (operation.kind === "lessons") {
        const filters = lessonFilters(operation);
        return bind(database,
          `SELECT COUNT(*) AS count FROM LessonVersion v JOIN Lesson le ON le.id = v.lessonId JOIN CatalogPublication p ON p.releaseId = v.releaseId WHERE p.id = 'active' AND v.statusCode = 'published' AND ${demoPredicate("le", operation.includeDemo)} ${filters.sql}`,
          filters.bindings,
        );
      }
      if (operation.kind === "activities") {
        const filters = activityFilters(operation);
        return bind(database,
          `SELECT COUNT(*) AS count FROM ActivityVersion v JOIN Activity a ON a.id = v.activityId JOIN CatalogPublication p ON p.releaseId = v.releaseId WHERE p.id = 'active' AND v.statusCode = 'published' AND ${demoPredicate("a", operation.includeDemo)} ${filters.sql}`,
          filters.bindings,
        );
      }
      return bind(database,
        `SELECT COUNT(*) AS count FROM TaxonomyNodeVersion v JOIN CatalogPublication p ON p.releaseId = v.releaseId WHERE p.id = 'active'`, []);
  }
}
