import type { FocusedPracticePort } from "@/core/ports";
import type {
  AttemptFeedbackDto,
  CreateFocusedPracticeRunDto,
  PracticeRunDto,
  PracticeRunSummaryDto,
  PracticeScopeAvailabilityDto,
  SubmitAttemptInputDto,
} from "@/core/models";
import { restRequest } from "./http-client";

export const focusedPracticeRestAdapter: FocusedPracticePort = {
  getScopeAvailability: (taxonomyNodeId) =>
    restRequest<PracticeScopeAvailabilityDto[]>(
      `/practice/scope-availability/${taxonomyNodeId}`,
    ),
  createRun: (input: CreateFocusedPracticeRunDto) =>
    restRequest<PracticeRunDto>("/practice/runs", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  submitRunAttempt: (runId, input: SubmitAttemptInputDto) =>
    restRequest<AttemptFeedbackDto>(`/practice/runs/${runId}/attempts`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getRunSummary: (runId) =>
    restRequest<PracticeRunSummaryDto>(`/practice/runs/${runId}/summary`),
};
