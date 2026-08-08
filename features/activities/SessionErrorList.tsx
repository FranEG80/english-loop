import type { PracticeRunErrorDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { withVisibleGaps } from "./gap-display";

/**
 * Lista de todos los fallos de una sesión con su explicación.
 *
 * El resumen daba dos contadores y nada más: no se podía saber en qué te
 * habías equivocado ni por qué. Aquí sale cada actividad fallada con lo que
 * respondiste, lo correcto y la explicación, y con el desglose por hueco,
 * carta o ronda cuando la actividad tiene sub-ítems.
 */
export function SessionErrorList({
  errors,
  dictionary,
}: {
  errors: readonly PracticeRunErrorDto[];
  dictionary: Dictionary;
}) {
  if (errors.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 text-left">
      <h2 className="text-xs font-black uppercase tracking-[.16em] text-primary">
        {dictionary.daily.breakdownTitle}
      </h2>
      <ul className="flex flex-col gap-3">
        {errors.map((error) => (
          <li
            key={error.activityId}
            className="flex flex-col gap-2 rounded-[1.5rem] border-2 border-danger/40 bg-danger-surface/40 p-4"
          >
            <p className="font-serif text-lg leading-snug">{withVisibleGaps(error.prompt)}</p>

            <ul className="flex flex-col gap-1 text-sm">
              {error.items
                .filter((item) => !item.isCorrect)
                .map((item) => (
                  <li key={item.itemId} className="flex flex-wrap items-baseline gap-2">
                    <span className="line-through decoration-danger opacity-70">
                      {item.given || dictionary.daily.breakdownEmpty}
                    </span>
                    <span className="font-bold text-success">
                      {item.expected.join(" / ")}
                    </span>
                    {item.feedback ? (
                      <span className="w-full opacity-80">{item.feedback}</span>
                    ) : null}
                  </li>
                ))}
            </ul>

            {error.explanation ? (
              <p className="text-sm text-foreground/80">
                <span className="font-medium">{dictionary.daily.explanationLabel}:</span>{" "}
                {error.explanation}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
