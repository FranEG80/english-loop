import type {
  ActivityPresentation,
  ActivityQuestionDto,
  ActivityResponseValue,
  ActivityType,
} from "@/core/models";
import { PRESENTATION_BY_TYPE } from "@/core/models";

export type ActivityResponseKind = ActivityResponseValue["kind"];

export interface ActivityDefinition {
  presentation: ActivityPresentation;
  responseKinds: readonly ActivityResponseKind[];
}

/**
 * Contrato entre presentación y corrección: qué forma de respuesta puede
 * emitir cada familia de renderer. La tabla tipo -> presentación vive en
 * `core/models` para que servidor y cliente compartan la misma.
 */
export const RESPONSE_KINDS_BY_PRESENTATION = {
  gap_fill: ["gaps"],
  key_word_transformation: ["gaps"],
  choice: ["single", "multiple"],
  true_false: ["boolean"],
  swipe_deck: ["deck"],
  word_order: ["ordered_list"],
  matching: ["pairs"],
  free_text: ["text"],
  mini_game: ["rounds"],
} as const satisfies Record<ActivityPresentation, readonly ActivityResponseKind[]>;

export function getActivityDefinition(
  activity: Pick<ActivityQuestionDto, "presentation">,
): ActivityDefinition {
  return {
    presentation: activity.presentation,
    responseKinds: RESPONSE_KINDS_BY_PRESENTATION[activity.presentation],
  };
}

export function presentationOf(type: ActivityType): ActivityPresentation {
  return PRESENTATION_BY_TYPE[type];
}

/** El DTO está discriminado por presentación, así que todo lo tipado es soportado. */
export function isSupportedActivity(activity: ActivityQuestionDto): boolean {
  return activity.presentation in RESPONSE_KINDS_BY_PRESENTATION;
}
