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
    case "deck":
      return Array.isArray(correctAnswer)
        ? arraysMatch(response.value.map((card) => String(card.value)), correctAnswer)
        : false;
    case "rounds":
      return Array.isArray(correctAnswer)
        ? arraysMatch(response.value.map((round) => round.optionId), correctAnswer)
        : false;
    case "gaps":
      return Array.isArray(correctAnswer)
        ? arraysMatch(
            response.value.map((gap) => normalizeText(gap.text)),
            correctAnswer.map(normalizeText),
          )
        : normalizeText(response.value.map((gap) => gap.text).join(" ")) ===
            normalizeText(correctAnswer);
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
    score: isCorrectResponse(response, answerKey.correctAnswer) ? 1 : 0,
    correctAnswer: answerKey.correctAnswer,
    normalizedResponse: response,
    items: [
      {
        itemId: "answer",
        label: "answer",
        given: describeResponse(response),
        expected: Array.isArray(answerKey.correctAnswer)
          ? answerKey.correctAnswer
          : [answerKey.correctAnswer],
        isCorrect: isCorrectResponse(response, answerKey.correctAnswer),
      },
    ],
    explanation: answerKey.explanation,
    nextReviewAt: null,
    submittedAt: new Date().toISOString(),
  };
}

/** Representación legible de la respuesta, solo para el feedback mock. */
function describeResponse(response: ActivityResponseValue): string {
  switch (response.kind) {
    case "boolean":
      return String(response.value);
    case "single":
    case "text":
      return response.value;
    case "multiple":
    case "ordered_list":
      return response.value.join(", ");
    case "pairs":
      return response.value.map((pair) => `${pair.leftId}:${pair.rightId}`).join(", ");
    case "gaps":
      return response.value.map((gap) => gap.text).join(", ");
    case "deck":
      return response.value.map((card) => `${card.cardId}:${card.value}`).join(", ");
    case "rounds":
      return response.value.map((round) => round.optionId).join(", ");
  }
}
