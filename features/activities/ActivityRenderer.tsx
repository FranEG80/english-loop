"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type {
  ActivityQuestionDto,
  ActivityResponseValue,
  AttemptFeedbackDto,
} from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";
import { ChoiceRenderer } from "./renderers/ChoiceRenderer";
import { FreeTextRenderer } from "./renderers/FreeTextRenderer";
import { GapFillRenderer } from "./renderers/GapFillRenderer";
import { MatchingRenderer } from "./renderers/MatchingRenderer";
import { MiniGameRenderer } from "./games/MiniGameRenderer";
import { SwipeDeckRenderer } from "./renderers/SwipeDeckRenderer";
import { TrueFalseRenderer } from "./renderers/TrueFalseRenderer";
import { WordOrderRenderer } from "./renderers/WordOrderRenderer";
import { activityIllustration } from "./illustrations";
import { formatActivityType } from "./activity-display";

export interface ActivityRendererProps {
  activity: ActivityQuestionDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
  /**
   * Corrección ya recibida del servidor. Los renderers que pueden señalar el
   * acierto sobre el propio enunciado la usan para pintarlo.
   */
  feedback?: AttemptFeedbackDto | null;
}

/**
 * Una familia de presentación, un renderer. El `switch` es exhaustivo sobre la
 * unión discriminada del DTO y termina en `assertNever`: no hay rama por
 * defecto donde una actividad pueda caer sin que nadie se entere.
 */
export function ActivityRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
  feedback,
}: ActivityRendererProps) {
  const shared = { dictionary, onSubmit, disabled };
  let renderer: ReactNode;

  switch (activity.presentation) {
    case "gap_fill":
    case "key_word_transformation":
      renderer = <GapFillRenderer activity={activity} {...shared} />;
      break;
    case "choice":
      renderer = <ChoiceRenderer activity={activity} {...shared} />;
      break;
    case "true_false":
      renderer = <TrueFalseRenderer activity={activity} {...shared} />;
      break;
    case "swipe_deck":
      renderer = <SwipeDeckRenderer activity={activity} {...shared} />;
      break;
    case "word_order":
      renderer = <WordOrderRenderer activity={activity} {...shared} />;
      break;
    case "matching":
      renderer = <MatchingRenderer activity={activity} {...shared} feedback={feedback} />;
      break;
    case "free_text":
      renderer = <FreeTextRenderer activity={activity} {...shared} />;
      break;
    case "mini_game":
      renderer = <MiniGameRenderer activity={activity} {...shared} feedback={feedback} />;
      break;
    default:
      return assertNever(activity);
  }

  // Estas presentaciones necesitan todo el ancho: la frase, el mazo y el
  // canvas no caben junto a la ilustración.
  const isWide =
    activity.presentation === "word_order" ||
    activity.presentation === "mini_game" ||
    activity.presentation === "swipe_deck";

  return (
    <section
      className={cn(
        "w-full min-w-0 rounded-[2rem] border-2 border-foreground bg-surface shadow-[6px_8px_0_var(--color-foreground)]",
        // El mazo sale volando fuera de la tarjeta: recortarlo lo cortaba a
        // media animación.
        activity.presentation === "swipe_deck" ? "overflow-visible" : "overflow-hidden",
      )}
    >
      <header className="flex flex-col items-start gap-2 border-b-2 border-foreground bg-surface-muted px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-primary">
            {formatActivityType(activity.type, dictionary)}
          </p>
          <p className="mt-0.5 text-sm font-bold text-foreground/60">{activity.level}</p>
        </div>
        <span className="font-hand -rotate-2 self-end text-2xl font-bold text-coral sm:self-auto">
          {dictionary.activities.yourTurnLabel}
        </span>
      </header>
      <div className={isWide ? "" : "grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]"}>
        <div className="min-w-0 p-6 sm:p-8 lg:p-10 xl:p-12">{renderer}</div>
        {isWide ? null : (
          <aside className="relative hidden min-h-72 border-l-2 border-foreground bg-accent/35 lg:block">
            <Image
              src={activityIllustration(activity)}
              alt=""
              fill
              sizes="272px"
              className="object-contain p-5"
            />
          </aside>
        )}
      </div>
    </section>
  );
}

function assertNever(value: never): never {
  throw new Error(
    `Presentación de actividad sin renderer: ${JSON.stringify(value).slice(0, 120)}`,
  );
}
