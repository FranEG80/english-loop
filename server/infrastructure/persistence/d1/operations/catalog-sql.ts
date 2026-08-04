import type { D1DatabaseLike } from "../types/binding";
import type { D1Operation } from "../types/operations";
import { bind, type PreparedOperation } from "./shared";

type CatalogOperation = Extract<D1Operation, { name: "activityById" | "activityByVersionId" | "catalogLessons" | "catalogActivities" | "catalogTaxonomy" | "catalogCounts" }>;

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
        FROM ActivityVersion v JOIN CatalogPublication p ON p.releaseId = v.releaseId
        WHERE p.id = 'active' AND v.statusCode = 'published' AND v.activityId = ?
        ORDER BY v.id DESC LIMIT 1`, [operation.activityId]);
    case "activityByVersionId":
      return bind(database, `SELECT ${activityProjection}
        FROM ActivityVersion v
        WHERE v.id = ? AND v.statusCode = 'published'`, [operation.activityVersionId]);
    case "catalogLessons":
      return bind(database, `SELECT v.id, v.lessonId, v.levelCode, v.category, v.taxonomyNodeId,
          v.prerequisites, v.title, v.summary, v.explanation, v.examples, v.commonMistakes,
          v.tags, v.difficulty, v.contentVersion, v.statusCode,
          COALESCE((SELECT json_group_array(av.activityId)
            FROM ActivityVersionLesson l JOIN ActivityVersion av ON av.id = l.activityVersionId
            WHERE l.lessonId = v.lessonId AND av.releaseId = v.releaseId AND av.statusCode = 'published'), '[]') AS relatedActivityIds
        FROM LessonVersion v JOIN CatalogPublication p ON p.releaseId = v.releaseId
        WHERE p.id = 'active' AND v.statusCode = 'published'
          AND (? IS NULL OR v.levelCode = ?) AND (? IS NULL OR v.category = ?)
          ${operation.limit === undefined ? "" : "AND (? IS NULL OR v.lessonId > ?)"}
        ORDER BY v.lessonId ASC${operation.limit === undefined ? "" : " LIMIT ?"}`,
        [operation.level ?? null, operation.level ?? null, operation.category ?? null, operation.category ?? null,
          ...(operation.limit === undefined ? [] : [operation.cursor ?? null, operation.cursor ?? null, operation.limit])]);
    case "catalogActivities":
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
        FROM ActivityVersion v JOIN CatalogPublication p ON p.releaseId = v.releaseId
        WHERE p.id = 'active' AND v.statusCode = 'published'
          AND (? IS NULL OR v.levelCode = ?)
          AND (? IS NULL OR EXISTS (SELECT 1 FROM ActivityVersionTaxonomy t
            WHERE t.activityVersionId = v.id AND t.taxonomyNodeId = ?))
          AND (? = 0 OR EXISTS (SELECT 1 FROM ActivityVersionLesson l
            WHERE l.activityVersionId = v.id AND l.lessonId IN (SELECT value FROM json_each(?))))
          ${operation.limit === undefined ? "" : "AND (? IS NULL OR v.activityId > ?)"}
        ORDER BY v.activityId ASC${operation.limit === undefined ? "" : " LIMIT ?"}`,
        [operation.level ?? null, operation.level ?? null, operation.taxonomyNodeId ?? null,
          operation.taxonomyNodeId ?? null, operation.lessonIds?.length ?? 0, JSON.stringify(operation.lessonIds ?? []),
          ...(operation.limit === undefined ? [] : [operation.cursor ?? null, operation.cursor ?? null, operation.limit])]);
    case "catalogTaxonomy":
      return bind(database, `SELECT nodeId, parentId, kind, labelsEn, labelsEs, levels,
          selectableForPractice, sortOrder
        FROM TaxonomyNodeVersion v JOIN CatalogPublication p ON p.releaseId = v.releaseId
        WHERE p.id = 'active' ORDER BY parentId ASC, sortOrder ASC`, []);
    case "catalogCounts":
      return bind(database,
        operation.kind === "lessons"
          ? `SELECT COUNT(*) AS count FROM LessonVersion v JOIN CatalogPublication p ON p.releaseId = v.releaseId WHERE p.id = 'active' AND v.statusCode = 'published'`
          : operation.kind === "activities"
            ? `SELECT COUNT(*) AS count FROM ActivityVersion v JOIN CatalogPublication p ON p.releaseId = v.releaseId WHERE p.id = 'active' AND v.statusCode = 'published'`
            : `SELECT COUNT(*) AS count FROM TaxonomyNodeVersion v JOIN CatalogPublication p ON p.releaseId = v.releaseId WHERE p.id = 'active'`, []);
  }
}
