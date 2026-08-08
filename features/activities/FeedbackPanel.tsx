"use client";

import type { AttemptFeedbackDto, AttemptItemResultDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";
import { withVisibleGaps } from "./gap-display";

/**
 * Corrección de un intento.
 *
 * Cuando la actividad tiene sub-ítems (huecos, cartas del mazo, rondas de un
 * minijuego, pares de matching) la respuesta correcta no cabe en una línea: se
 * lista ítem a ítem, marcando cuál falló y por qué. Es la petición de «media de
 * aciertos y explicar todos los errores cometidos».
 */
export function FeedbackPanel({
  feedback,
  dictionary,
}: {
  feedback: AttemptFeedbackDto;
  dictionary: Dictionary;
}) {
  // Un intento anterior a la corrección con detalle no trae desglose.
  const items = feedback.items ?? [];
  const hasBreakdown = items.length > 1;
  const correctCount = items.filter((item) => item.isCorrect).length;

  // `true_false` y el mazo viajan como booleanos: en pantalla tienen que leerse
  // en el idioma del alumno, no como literales del evaluador.
  const say = (value: string) =>
    value === "true"
      ? dictionary.activities.trueLabel
      : value === "false"
        ? dictionary.activities.falseLabel
        : value;

  const correctAnswerText = Array.isArray(feedback.correctAnswer)
    ? feedback.correctAnswer.map(say).join(", ")
    : say(feedback.correctAnswer);

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

      {hasBreakdown ? (
        <p className="text-sm font-bold text-foreground/80">
          {dictionary.daily.breakdownScore
            .replace("{correct}", String(correctCount))
            .replace("{total}", String(items.length))}
        </p>
      ) : null}

      {!feedback.isCorrect && !hasBreakdown && correctAnswerText ? (
        <p className="text-sm text-foreground/80">
          <span className="font-medium">{dictionary.daily.correctAnswerLabel}:</span>{" "}
          {correctAnswerText}
        </p>
      ) : null}

      {hasBreakdown ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-[.16em] text-foreground/55">
            {dictionary.daily.breakdownTitle}
          </p>
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <FeedbackBreakdownItem
                key={item.itemId}
                item={item}
                dictionary={dictionary}
                say={say}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {feedback.explanation ? (
        <p className="text-sm text-foreground/80">
          <span className="font-medium">{dictionary.daily.explanationLabel}:</span>{" "}
          {feedback.explanation}
        </p>
      ) : null}
    </div>
  );
}

function FeedbackBreakdownItem({
  item,
  dictionary,
  say,
}: {
  item: AttemptItemResultDto;
  dictionary: Dictionary;
  say: (value: string) => string;
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-1 rounded-control border-2 bg-surface/70 px-3 py-2 text-sm",
        item.isCorrect ? "border-success/50" : "border-danger/60",
      )}
    >
      <p className="flex items-start gap-2 font-bold">
        <span aria-hidden="true" className={item.isCorrect ? "text-success" : "text-danger"}>
          {item.isCorrect ? "✓" : "✕"}
        </span>
        {/* En un texto con huecos la etiqueta es solo el número: sin el rótulo
            «Hueco» quedaría un «2» suelto encabezando la fila. */}
        {item.itemId.startsWith("gap")
          ? dictionary.activities.gapHint.replace("{index}", item.label)
          : withVisibleGaps(item.label)}
      </p>
      <p className="text-foreground/80">
        <span className="font-medium">{dictionary.daily.breakdownGiven}:</span>{" "}
        <span className={item.isCorrect ? "" : "line-through decoration-danger"}>
          {item.given ? say(item.given) : dictionary.daily.breakdownEmpty}
        </span>
      </p>
      {!item.isCorrect && item.expected.length > 0 ? (
        <p className="text-foreground/80">
          <span className="font-medium">{dictionary.daily.breakdownExpected}:</span>{" "}
          <span className="font-bold text-success">
            {item.expected.map(say).join(" / ")}
          </span>
        </p>
      ) : null}
      {!item.isCorrect && item.feedback ? (
        <p className="text-foreground/70">{item.feedback}</p>
      ) : null}
    </li>
  );
}
