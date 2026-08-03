import type { PracticeScopeAvailabilityDto } from "../models/types/taxonomy";
import type {
  CreateFocusedPracticeRunDto,
  PracticeRunDto,
  PracticeRunSummaryDto,
} from "../models/types/practice";
import type { SubmitAttemptInputDto, AttemptFeedbackDto } from "../models/types/attempt";

export interface FocusedPracticePort {
  /** Disponibilidad del nodo indicado (y sus descendientes) por nivel. */
  getScopeAvailability(
    taxonomyNodeId: string,
  ): Promise<PracticeScopeAvailabilityDto[]>;
  createRun(input: CreateFocusedPracticeRunDto): Promise<PracticeRunDto>;
  submitRunAttempt(
    runId: string,
    input: SubmitAttemptInputDto,
  ): Promise<AttemptFeedbackDto>;
  getRunSummary(runId: string): Promise<PracticeRunSummaryDto>;
}
