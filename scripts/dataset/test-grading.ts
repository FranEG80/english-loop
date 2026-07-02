import { grade } from "./lib/grading";
import { loadDataset } from "./lib/load";
import type {
  ActivityResponse,
  Evaluator,
  NormalizationRules,
} from "./lib/types";

export async function runGradingTests(): Promise<void> {
  const dataset = await loadDataset();
  const failures: string[] = [];

  for (const activity of dataset.activities) {
    const correct = correctResponse(activity.evaluator);
    if (!grade(activity.evaluator, correct)) {
      failures.push(`${activity.id}: la respuesta correcta fue rechazada.`);
    }

    const incorrect = incorrectResponse(activity.evaluator);
    if (grade(activity.evaluator, incorrect)) {
      failures.push(`${activity.id}: una respuesta incorrecta fue aceptada.`);
    }

    for (const variant of acceptedVariants(activity.evaluator)) {
      if (!grade(activity.evaluator, variant)) {
        failures.push(`${activity.id}: una variante aceptada fue rechazada.`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Fallaron ${failures.length} pruebas de evaluación:\n${failures.join("\n")}`,
    );
  }

  console.log(
    `Evaluación comprobada para ${dataset.activities.length} actividades.`,
  );
}

function correctResponse(evaluator: Evaluator): ActivityResponse {
  switch (evaluator.strategy) {
    case "boolean":
      return evaluator.correct;
    case "single_option":
      return evaluator.correctOptionId;
    case "multiple_options":
      return [...evaluator.correctOptionIds].reverse();
    case "exact_text":
      return evaluator.answer;
    case "one_of_texts":
      return evaluator.answers[0];
    case "per_gap":
      return Object.fromEntries(
        evaluator.gaps.map(({ gapId, answers }) => [gapId, answers[0]]),
      );
    case "ordered_tokens":
      return evaluator.correctTokenIds;
    case "unordered_set":
      return [...evaluator.correctValues].reverse();
    case "matching_pairs":
      return Object.fromEntries(
        evaluator.pairs.map(({ leftId, rightId }) => [leftId, rightId]),
      );
  }
}

function incorrectResponse(evaluator: Evaluator): ActivityResponse {
  switch (evaluator.strategy) {
    case "boolean":
      return !evaluator.correct;
    case "single_option":
      return "__invalid_option__";
    case "multiple_options":
      return evaluator.correctOptionIds.slice(1);
    case "exact_text":
    case "one_of_texts":
      return "__intentionally_incorrect_answer__";
    case "per_gap": {
      const response = correctResponse(evaluator) as Record<string, string>;
      const firstGap = evaluator.gaps[0].gapId;
      return { ...response, [firstGap]: "__incorrect__" };
    }
    case "ordered_tokens":
      return evaluator.correctTokenIds.slice(1);
    case "unordered_set":
      return evaluator.correctValues.slice(1);
    case "matching_pairs": {
      const response = correctResponse(evaluator) as Record<string, string>;
      const firstLeft = evaluator.pairs[0].leftId;
      return { ...response, [firstLeft]: "__incorrect__" };
    }
  }
}

function acceptedVariants(evaluator: Evaluator): ActivityResponse[] {
  switch (evaluator.strategy) {
    case "exact_text":
      return textVariants(evaluator.answer, evaluator.normalization);
    case "one_of_texts":
      return evaluator.answers.flatMap((answer) =>
        textVariants(answer, evaluator.normalization),
      );
    case "per_gap": {
      const base = Object.fromEntries(
        evaluator.gaps.map(({ gapId, answers }) => [
          gapId,
          answers[answers.length - 1],
        ]),
      );
      return [base];
    }
    case "unordered_set":
      return [[...evaluator.correctValues].reverse()];
    case "boolean":
    case "single_option":
    case "multiple_options":
    case "ordered_tokens":
    case "matching_pairs":
      return [];
  }
}

function textVariants(
  answer: string,
  rules: NormalizationRules,
): ActivityResponse[] {
  const variants = new Set<string>();
  if (rules.trim) variants.add(`  ${answer}  `);
  if (rules.collapseWhitespace && answer.includes(" ")) {
    variants.add(answer.replace(/ /gu, "   "));
  }
  if (!rules.caseSensitive) variants.add(answer.toLocaleUpperCase("en-GB"));
  if (rules.ignoreTerminalPunctuation) variants.add(`${answer}.`);
  if (rules.normaliseApostrophes && answer.includes("'")) {
    variants.add(answer.replace(/'/gu, "’"));
  }
  return [...variants];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runGradingTests().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
