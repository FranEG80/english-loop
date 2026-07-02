import type {
  ActivityQuestionDto,
  ActivityResponseValue,
  ActivityType,
  InteractionMode,
} from "@/core/models";

export type ActivityRendererKey =
  | "trueFalse"
  | "choice"
  | "textResponse"
  | "sentenceBuilder"
  | "matching"
  | "wordOrder";

export type ActivityResponseKind = ActivityResponseValue["kind"];

export interface ActivityDefinition {
  renderer: ActivityRendererKey;
  interactionModes: readonly InteractionMode[];
  responseKinds: readonly ActivityResponseKind[];
}

export const ACTIVITY_REGISTRY = {
  true_false: {
    renderer: "trueFalse",
    interactionModes: ["standard", "swipe"],
    responseKinds: ["boolean", "boolean_list"],
  },
  single_choice: {
    renderer: "choice",
    interactionModes: ["standard"],
    responseKinds: ["single"],
  },
  multiple_choice: {
    renderer: "choice",
    interactionModes: ["standard"],
    responseKinds: ["multiple"],
  },
  fill_blank: {
    renderer: "textResponse",
    interactionModes: ["standard"],
    responseKinds: ["text"],
  },
  sentence_transformation: {
    renderer: "sentenceBuilder",
    interactionModes: ["sentence_builder"],
    responseKinds: ["ordered_list"],
  },
  error_correction: {
    renderer: "textResponse",
    interactionModes: ["standard"],
    responseKinds: ["text"],
  },
  word_formation: {
    renderer: "textResponse",
    interactionModes: ["standard"],
    responseKinds: ["text"],
  },
  open_cloze: {
    renderer: "textResponse",
    interactionModes: ["standard"],
    responseKinds: ["ordered_list"],
  },
  key_word_transformation: {
    renderer: "textResponse",
    interactionModes: ["standard"],
    responseKinds: ["text"],
  },
  matching: {
    renderer: "matching",
    interactionModes: ["matching_pairs"],
    responseKinds: ["pairs"],
  },
  word_order: {
    renderer: "wordOrder",
    interactionModes: ["drag_drop"],
    responseKinds: ["ordered_list"],
  },
  rewrite_sentence: {
    renderer: "textResponse",
    interactionModes: ["standard"],
    responseKinds: ["text"],
  },
  complete_dialogue: {
    renderer: "textResponse",
    interactionModes: ["standard"],
    responseKinds: ["ordered_list"],
  },
  complete_paragraph: {
    renderer: "textResponse",
    interactionModes: ["standard"],
    responseKinds: ["ordered_list"],
  },
} as const satisfies Record<ActivityType, ActivityDefinition>;

export function getActivityDefinition(
  activity: ActivityQuestionDto,
): ActivityDefinition {
  return ACTIVITY_REGISTRY[activity.type];
}

export function isSupportedActivity(activity: ActivityQuestionDto): boolean {
  const definition = getActivityDefinition(activity);
  return definition.interactionModes.includes(
    activity.interactionMode as never,
  );
}
