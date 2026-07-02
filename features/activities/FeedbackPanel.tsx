"use client";

import type { AttemptFeedbackDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";

export function FeedbackPanel({
  feedback,
  dictionary,
}: {
  feedback: AttemptFeedbackDto;
  dictionary: Dictionary;
}) {
  const correctAnswerText = Array.isArray(feedback.correctAnswer)
    ? feedback.correctAnswer.join(", ")
    : feedback.correctAnswer;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col gap-3 rounded-[2rem] border-2 p-6 shadow-[3px_4px_0_var(--color-foreground)]",
        feedback.isCorrect
          ? "border-success bg-success-surface"
          : "border-danger bg-danger-surface",
      )}
    >
      <p
        className={cn(
          "font-serif flex items-center gap-2 text-2xl font-bold",
          feedback.isCorrect ? "text-success" : "text-danger",
        )}
      >
        <span aria-hidden="true">{feedback.isCorrect ? "✓" : "✕"}</span>
        {feedback.isCorrect
          ? dictionary.daily.feedbackCorrect
          : dictionary.daily.feedbackIncorrect}
      </p>
      {!feedback.isCorrect ? (
        <p className="text-sm text-foreground/80">
          <span className="font-medium">{dictionary.daily.correctAnswerLabel}:</span>{" "}
          {correctAnswerText}
        </p>
      ) : null}
      <p className="text-sm text-foreground/80">
        <span className="font-medium">{dictionary.daily.explanationLabel}:</span>{" "}
        {feedback.explanation}
      </p>
    </div>
  );
}
