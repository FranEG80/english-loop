import type {
  ActivityQuestionDto,
  ActivityResponseValue,
  AttemptFeedbackDto,
} from "@/core/models";
import { generateId } from "@/shared/lib/id";
import { mockActivityAnswerKeys } from "./data/activities";

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function arraysMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => normalizeText(value) === normalizeText(b[index]));
}

function isCorrectResponse(
  response: ActivityResponseValue,
  correctAnswer: string | string[],
): boolean {
  switch (response.kind) {
    case "boolean":
      return String(response.value) === correctAnswer;
    case "boolean_list":
      return Array.isArray(correctAnswer)
        ? arraysMatch(
            response.value.map(String),
            correctAnswer,
          )
        : false;
    case "single":
      return Array.isArray(correctAnswer)
        ? correctAnswer.includes(response.value)
        : normalizeText(response.value) === normalizeText(correctAnswer);
    case "multiple":
      return Array.isArray(correctAnswer)
        ? arraysMatch([...response.value].sort(), [...correctAnswer].sort())
        : false;
    case "text":
      return Array.isArray(correctAnswer)
        ? correctAnswer.some(
            (option) => normalizeText(option) === normalizeText(response.value),
          )
        : normalizeText(response.value) === normalizeText(correctAnswer);
    case "ordered_list":
      return Array.isArray(correctAnswer)
        ? arraysMatch(response.value, correctAnswer)
        : normalizeText(response.value.join(" ")) === normalizeText(correctAnswer);
    case "pairs": {
      const submittedPairs = response.value
        .map((pair) => `${pair.leftId}:${pair.rightId}`)
        .sort();
      return Array.isArray(correctAnswer)
        ? arraysMatch(submittedPairs, [...correctAnswer].sort())
        : false;
    }
    default:
      return false;
  }
}

/**
 * "Grader" mock: nunca se expone a través de un puerto. Solo lo usan los
 * adapters mock de `DailySessionPort` y `FocusedPracticePort`.
 */
export function gradeMockAttempt(
  activity: ActivityQuestionDto,
  response: ActivityResponseValue,
): AttemptFeedbackDto {
  const answerKey = mockActivityAnswerKeys[activity.id];
  if (!answerKey) {
    throw new Error(`No hay clave de corrección mock para "${activity.id}".`);
  }
  return {
    attemptId: generateId("attempt"),
    activityId: activity.id,
    isCorrect: isCorrectResponse(response, answerKey.correctAnswer),
    correctAnswer: answerKey.correctAnswer,
    explanation: answerKey.explanation,
    submittedAt: new Date().toISOString(),
  };
}
