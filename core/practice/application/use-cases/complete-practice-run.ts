import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { PracticeRunRepository } from "../../ports/practice-run-repository";
import type { PracticeRun } from "../../domain/practice-run";
import { ResourceNotFoundException, ForbiddenException } from "@/core/shared/exceptions";

/** Marca un run como completado. */
export async function completePracticeRun(
  identity: IdentityPort,
  runRepository: PracticeRunRepository,
  runId: string,
): Promise<PracticeRun> {
  const actor = await identity.requireActor();
  const run = await runRepository.findById(runId);
  if (!run) {
    throw new ResourceNotFoundException(
      `Practice run not found: ${runId}`,
      "The practice run was not found.",
    );
  }
  if (run.userId !== actor.userId) {
    throw new ForbiddenException(
      "Cannot access another user's practice run",
      "You do not have access to this practice run.",
    );
  }
  if (run.status === "completed") return run;

  // Avanza hasta el final.
  let completed = false;
  while (!completed) {
    completed = run.advance();
  }
  await runRepository.save(run);
  return run;
}
