import type { PracticeRun } from "../domain/practice-run";

export interface PracticeRunRepository {
  findById(runId: string): Promise<PracticeRun | null>;
  save(run: PracticeRun): Promise<void>;
}
