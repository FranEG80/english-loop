import path from "node:path";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { DATASET_ROOT, readJson } from "./io";
import type {
  Activity,
  ActivityBatch,
  LoadedDataset,
  TaxonomyNode,
} from "./types";

export interface ValidationIssue {
  code: string;
  location: string;
  message: string;
}

const REQUIRED_LESSON_SECTIONS = [
  "Resumen",
  "Objetivos",
  "Explicación",
  "Forma o estructura",
  "Usos principales",
  "Contrastes importantes",
  "Ejemplos",
  "Errores frecuentes",
  "Excepciones relevantes",
  "Mini resumen",
  "Comprobación rápida autocorregible",
] as const;

export async function validateDataset(
  dataset: LoadedDataset,
): Promise<ValidationIssue[]> {
  const [lessonSchema, activitySchema, taxonomySchema, coverageSchema] =
    await Promise.all([
      readJson<object>(path.join(DATASET_ROOT, "schemas", "lesson.schema.json")),
      readJson<object>(
        path.join(DATASET_ROOT, "schemas", "activity.schema.json"),
      ),
      readJson<object>(
        path.join(DATASET_ROOT, "schemas", "taxonomy.schema.json"),
      ),
      readJson<object>(
        path.join(DATASET_ROOT, "schemas", "coverage.schema.json"),
      ),
    ]);

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validators = {
    lesson: ajv.compile(lessonSchema),
    activity: ajv.compile(activitySchema),
    taxonomy: ajv.compile(taxonomySchema),
    coverage: ajv.compile(coverageSchema),
  };

  const issues: ValidationIssue[] = [];
  validateSchema(
    validators.taxonomy,
    dataset.taxonomy,
    "catalog/taxonomy.json",
    issues,
  );
  validateSchema(
    validators.coverage,
    dataset.coverageTargets,
    "catalog/coverage-targets.json",
    issues,
  );

  for (const lesson of dataset.lessons) {
    validateSchema(
      validators.lesson,
      lesson.frontmatter,
      lesson.relativePath,
      issues,
    );
    validateLessonPath(lesson.relativePath, lesson.frontmatter, issues);
    validateLessonSections(lesson.relativePath, lesson.content, issues);
  }

  for (const { relativePath, batch } of dataset.batches) {
    validateSchema(validators.activity, batch, relativePath, issues);
    validateBatchPath(relativePath, batch, issues);
    validateBatchConsistency(relativePath, batch, issues);
    for (const activity of batch.activities) {
      validateActivityContract(relativePath, activity, issues);
    }
  }

  validateUniqueIds(dataset, issues);
  validateTaxonomy(dataset, issues);
  validateReferences(dataset, issues);
  validateCoverage(dataset, issues);

  return issues.sort(
    (left, right) =>
      left.location.localeCompare(right.location) ||
      left.code.localeCompare(right.code) ||
      left.message.localeCompare(right.message),
  );
}

function validateSchema(
  validator: ValidateFunction,
  value: unknown,
  location: string,
  issues: ValidationIssue[],
): void {
  if (validator(value)) return;
  for (const error of validator.errors ?? []) {
    issues.push({
      code: "schema",
      location: `${location}${error.instancePath}`,
      message: formatAjvError(error),
    });
  }
}

function formatAjvError(error: ErrorObject): string {
  const detail =
    "allowedValues" in error.params
      ? `: ${JSON.stringify(error.params.allowedValues)}`
      : "";
  return `${error.message ?? "invalid value"}${detail}`;
}

function validateLessonPath(
  relativePath: string,
  lesson: {
    id: string;
    level: string;
    category: string;
    topic: string;
  },
  issues: ValidationIssue[],
): void {
  const expected = `lessons/${lesson.level.toLowerCase()}/${lesson.category}/${lesson.topic}/${lesson.id}.md`;
  if (relativePath !== expected) {
    addIssue(
      issues,
      "lesson-path",
      relativePath,
      `La ruta esperada es ${expected}.`,
    );
  }
}

function validateLessonSections(
  relativePath: string,
  content: string,
  issues: ValidationIssue[],
): void {
  for (const section of REQUIRED_LESSON_SECTIONS) {
    if (!content.includes(`# ${section}`)) {
      addIssue(
        issues,
        "lesson-section",
        relativePath,
        `Falta la sección obligatoria "${section}".`,
      );
    }
  }
}

function validateBatchPath(
  relativePath: string,
  batch: ActivityBatch,
  issues: ValidationIssue[],
): void {
  const prefix = `activities/${batch.level.toLowerCase()}/${batch.category}/${batch.topic}/${batch.lessonId}/${batch.activityType}/`;
  if (!relativePath.startsWith(prefix) || !/\/batch-\d{3}\.json$/u.test(relativePath)) {
    addIssue(
      issues,
      "activity-path",
      relativePath,
      `La ruta debe comenzar por ${prefix} y terminar en batch-NNN.json.`,
    );
  }
}

function validateBatchConsistency(
  relativePath: string,
  batch: ActivityBatch,
  issues: ValidationIssue[],
): void {
  for (const activity of batch.activities) {
    const expected: Array<[keyof Activity, unknown]> = [
      ["level", batch.level],
      ["category", batch.category],
      ["topic", batch.topic],
      ["subtopic", batch.subtopic],
      ["type", batch.activityType],
    ];
    for (const [field, value] of expected) {
      if (activity[field] !== value) {
        addIssue(
          issues,
          "batch-consistency",
          `${relativePath}#${activity.id}`,
          `${String(field)} debe coincidir con el valor del lote.`,
        );
      }
    }
    if (!activity.lessonIds.includes(batch.lessonId)) {
      addIssue(
        issues,
        "batch-lesson",
        `${relativePath}#${activity.id}`,
        `lessonIds debe incluir ${batch.lessonId}.`,
      );
    }
  }
}

function validateActivityContract(
  relativePath: string,
  activity: Activity,
  issues: ValidationIssue[],
): void {
  const location = `${relativePath}#${activity.id}`;
  const optionIds = new Set(activity.options?.map(({ id }) => id) ?? []);

  switch (activity.evaluator.strategy) {
    case "single_option":
      if (!optionIds.has(activity.evaluator.correctOptionId)) {
        addIssue(
          issues,
          "missing-correct-option",
          location,
          "La opción correcta no existe en options.",
        );
      }
      break;
    case "multiple_options":
      for (const id of activity.evaluator.correctOptionIds) {
        if (!optionIds.has(id)) {
          addIssue(
            issues,
            "missing-correct-option",
            location,
            `La opción correcta ${id} no existe en options.`,
          );
        }
      }
      break;
    case "ordered_tokens": {
      const tokenIds = new Set(activity.tokens?.map(({ id }) => id) ?? []);
      for (const id of activity.evaluator.correctTokenIds) {
        if (!tokenIds.has(id)) {
          addIssue(
            issues,
            "missing-token",
            location,
            `El token correcto ${id} no existe en tokens.`,
          );
        }
      }
      break;
    }
    case "matching_pairs": {
      const leftIds = activity.evaluator.pairs.map(({ leftId }) => leftId);
      const rightIds = activity.evaluator.pairs.map(({ rightId }) => rightId);
      if (
        new Set(leftIds).size !== leftIds.length ||
        new Set(rightIds).size !== rightIds.length
      ) {
        addIssue(
          issues,
          "matching-cardinality",
          location,
          "Matching debe contener pares únicos a ambos lados.",
        );
      }
      const available = new Set(
        activity.pairs?.flatMap(({ leftId, rightId }) => [leftId, rightId]) ?? [],
      );
      for (const id of [...leftIds, ...rightIds]) {
        if (!available.has(id)) {
          addIssue(
            issues,
            "missing-pair",
            location,
            `El elemento de matching ${id} no existe en pairs.`,
          );
        }
      }
      break;
    }
    case "per_gap": {
      const gapIds = activity.evaluator.gaps.map(({ gapId }) => gapId);
      if (new Set(gapIds).size !== gapIds.length) {
        addIssue(
          issues,
          "gap-cardinality",
          location,
          "Los IDs de hueco deben ser únicos.",
        );
      }
      break;
    }
    case "boolean":
    case "exact_text":
    case "one_of_texts":
    case "unordered_set":
      break;
  }

  const actualOptionIds = activity.options?.map(({ id }) => id) ?? [];
  if (new Set(actualOptionIds).size !== actualOptionIds.length) {
    addIssue(
      issues,
      "duplicate-option-id",
      location,
      "Los IDs de opción deben ser únicos.",
    );
  }
}

function validateUniqueIds(
  dataset: LoadedDataset,
  issues: ValidationIssue[],
): void {
  findDuplicates(
    dataset.lessons.map(({ frontmatter }) => frontmatter.id),
    "duplicate-lesson-id",
    issues,
  );
  findDuplicates(
    dataset.batches.map(({ batch }) => batch.batchId),
    "duplicate-batch-id",
    issues,
  );
  findDuplicates(
    dataset.activities.map(({ id }) => id),
    "duplicate-activity-id",
    issues,
  );
  findDuplicates(
    dataset.taxonomy.nodes.map(({ id }) => id),
    "duplicate-taxonomy-id",
    issues,
  );
}

function findDuplicates(
  values: string[],
  code: string,
  issues: ValidationIssue[],
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      addIssue(issues, code, value, `ID duplicado: ${value}.`);
    }
    seen.add(value);
  }
}

function validateTaxonomy(
  dataset: LoadedDataset,
  issues: ValidationIssue[],
): void {
  const nodes = new Map(dataset.taxonomy.nodes.map((node) => [node.id, node]));
  for (const node of dataset.taxonomy.nodes) {
    if (node.parentId !== null && !nodes.has(node.parentId)) {
      addIssue(
        issues,
        "orphan-taxonomy-node",
        node.id,
        `No existe el padre ${node.parentId}.`,
      );
    }
    detectCycle(node, nodes, issues);
  }
}

function detectCycle(
  node: TaxonomyNode,
  nodes: Map<string, TaxonomyNode>,
  issues: ValidationIssue[],
): void {
  const visited = new Set([node.id]);
  let current = node;
  while (current.parentId !== null) {
    if (visited.has(current.parentId)) {
      addIssue(
        issues,
        "taxonomy-cycle",
        node.id,
        `Ciclo detectado a través de ${current.parentId}.`,
      );
      return;
    }
    visited.add(current.parentId);
    const parent = nodes.get(current.parentId);
    if (!parent) return;
    current = parent;
  }
}

function validateReferences(
  dataset: LoadedDataset,
  issues: ValidationIssue[],
): void {
  const lessonIds = new Set(
    dataset.lessons.map(({ frontmatter }) => frontmatter.id),
  );
  const nodes = new Map(dataset.taxonomy.nodes.map((node) => [node.id, node]));
  const sourceIds = new Set<string>();

  for (const lesson of dataset.lessons) {
    for (const id of [...lesson.frontmatter.prerequisites, ...lesson.frontmatter.relatedLessonIds]) {
      if (!lessonIds.has(id)) {
        addIssue(
          issues,
          "broken-lesson-reference",
          lesson.relativePath,
          `No existe la lección ${id}.`,
        );
      }
    }
    for (const nodeId of [
      lesson.frontmatter.category,
      lesson.frontmatter.topic,
      ...lesson.frontmatter.subtopics,
    ]) {
      if (!nodes.has(nodeId)) {
        addIssue(
          issues,
          "broken-taxonomy-reference",
          lesson.relativePath,
          `No existe el nodo ${nodeId}.`,
        );
      }
    }
  }

  for (const activity of dataset.activities) {
    for (const lessonId of activity.lessonIds) {
      if (!lessonIds.has(lessonId)) {
        addIssue(
          issues,
          "broken-lesson-reference",
          activity.id,
          `No existe la lección ${lessonId}.`,
        );
      }
    }
    for (const nodeId of activity.taxonomyNodeIds) {
      const node = nodes.get(nodeId);
      if (!node) {
        addIssue(
          issues,
          "broken-taxonomy-reference",
          activity.id,
          `No existe el nodo ${nodeId}.`,
        );
      } else if (!node.selectableForPractice) {
        addIssue(
          issues,
          "non-selectable-taxonomy-reference",
          activity.id,
          `El nodo ${nodeId} no es seleccionable para práctica.`,
        );
      }
    }
    if (!activity.taxonomyNodeIds.includes(activity.subtopic)) {
      addIssue(
        issues,
        "non-specific-taxonomy-reference",
        activity.id,
        "taxonomyNodeIds debe incluir el subtopic más específico.",
      );
    }
  }

  void sourceIds;
  const lessonActivityCounts = new Map<string, number>();
  for (const activity of dataset.activities.filter(
    ({ status }) => status === "published",
  )) {
    for (const lessonId of activity.lessonIds) {
      lessonActivityCounts.set(
        lessonId,
        (lessonActivityCounts.get(lessonId) ?? 0) + 1,
      );
    }
  }
  for (const lesson of dataset.lessons.filter(
    ({ frontmatter }) => frontmatter.status === "published",
  )) {
    if (!lessonActivityCounts.has(lesson.frontmatter.id)) {
      addIssue(
        issues,
        "lesson-without-activities",
        lesson.relativePath,
        "Una lección publicada debe tener actividades publicadas.",
      );
    }
  }
}

function validateCoverage(
  dataset: LoadedDataset,
  issues: ValidationIssue[],
): void {
  const publishedLessons = dataset.lessons.filter(
    ({ frontmatter }) => frontmatter.status === "published",
  ).length;
  const publishedActivities = dataset.activities.filter(
    ({ status }) => status === "published",
  ).length;

  if (publishedLessons < dataset.coverageTargets.global.minimumLessons) {
    addIssue(
      issues,
      "global-lesson-coverage",
      "catalog/coverage-targets.json",
      `Hay ${publishedLessons} lecciones publicadas; se requieren ${dataset.coverageTargets.global.minimumLessons}.`,
    );
  }
  if (publishedActivities < dataset.coverageTargets.global.minimumActivities) {
    addIssue(
      issues,
      "global-activity-coverage",
      "catalog/coverage-targets.json",
      `Hay ${publishedActivities} actividades publicadas; se requieren ${dataset.coverageTargets.global.minimumActivities}.`,
    );
  }
}

function addIssue(
  issues: ValidationIssue[],
  code: string,
  location: string,
  message: string,
): void {
  issues.push({ code, location, message });
}
