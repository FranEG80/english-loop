import type { FocusedPracticePort } from "@/core/ports";
import type {
  CefrLevel,
  PracticeRunDto,
  PracticeScopeAvailabilityDto,
} from "@/core/models";
import { generateId } from "@/shared/lib/id";
import { mockActivities } from "./data/activities";
import {
  collectDescendantIds,
  findTaxonomyNode,
  findTaxonomyPath,
} from "./data/taxonomy";
import { gradeMockAttempt } from "./grading";

const MIN_REQUIRED_ACTIVITIES = 3;

/** Estado en memoria del proceso de desarrollo (mock de un único usuario). */
const runsById = new Map<string, PracticeRunDto>();
const runStatsById = new Map<string, { correct: number; incorrect: number }>();

function activitiesForScope(taxonomyNodeId: string, level?: CefrLevel) {
  const node = findTaxonomyNode(taxonomyNodeId);
  const scopedIds = node
    ? new Set(collectDescendantIds(node))
    : new Set([taxonomyNodeId]);
  return mockActivities.filter(
    (activity) =>
      scopedIds.has(activity.taxonomyNodeId) &&
      (!level || activity.level === level),
  );
}

function findRunById(runId: string): PracticeRunDto {
  const run = runsById.get(runId);
  if (!run) throw new Error(`No existe la sesión de práctica "${runId}".`);
  return run;
}

export const focusedPracticeMockAdapter: FocusedPracticePort = {
  async getScopeAvailability(taxonomyNodeId) {
    const levels: CefrLevel[] = ["B1", "B2"];
    return levels.map((level): PracticeScopeAvailabilityDto => {
      const availableActivityCount = activitiesForScope(
        taxonomyNodeId,
        level,
      ).length;
      return {
        nodeId: taxonomyNodeId,
        level,
        availableActivityCount,
        minRequiredActivities: MIN_REQUIRED_ACTIVITIES,
        isEligible: availableActivityCount >= MIN_REQUIRED_ACTIVITIES,
      };
    });
  },

  async createRun(input) {
    const level = input.level === "both" ? undefined : input.level;
    const scoped = activitiesForScope(input.taxonomyNodeId, level);
    const activityIds = scoped
      .slice(0, input.sessionSize)
      .map((activity) => activity.id);
    const taxonomyPath =
      findTaxonomyPath(input.taxonomyNodeId) ?? [input.taxonomyNodeId];

    const run: PracticeRunDto = {
      id: generateId("run"),
      scope: {
        taxonomyNodeId: input.taxonomyNodeId,
        taxonomyPath,
        level: input.level,
      },
      activityIds,
      currentIndex: 0,
      status: "in_progress",
    };
    runsById.set(run.id, run);
    runStatsById.set(run.id, { correct: 0, incorrect: 0 });
    return run;
  },

  async submitRunAttempt(runId, input) {
    const run = findRunById(runId);
    const activity = mockActivities.find((item) => item.id === input.activityId);
    if (!activity) {
      throw new Error(`No existe la actividad "${input.activityId}".`);
    }
    const feedback = gradeMockAttempt(activity, input.response);

    const stats = runStatsById.get(runId) ?? { correct: 0, incorrect: 0 };
    if (feedback.isCorrect) stats.correct += 1;
    else stats.incorrect += 1;
    runStatsById.set(runId, stats);

    run.currentIndex = Math.min(run.activityIds.length, run.currentIndex + 1);
    if (run.currentIndex >= run.activityIds.length) run.status = "completed";

    return feedback;
  },

  async getRunSummary(runId) {
    const run = findRunById(runId);
    const stats = runStatsById.get(runId) ?? { correct: 0, incorrect: 0 };
    const coveredSubtopicIds = Array.from(
      new Set(
        run.activityIds
          .map(
            (id) =>
              mockActivities.find((activity) => activity.id === id)
                ?.taxonomyNodeId,
          )
          .filter((id): id is string => Boolean(id)),
      ),
    );
    return {
      runId: run.id,
      correctCount: stats.correct,
      incorrectCount: stats.incorrect,
      coveredSubtopicIds,
      scope: run.scope,
    };
  },
};
