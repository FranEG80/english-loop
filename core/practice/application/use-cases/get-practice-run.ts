import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { PracticeRunRepository } from "../../ports/practice-run-repository";
import type { PracticeRun } from "../../domain/practice-run";
import { ResourceNotFoundException, ForbiddenException } from "@/core/shared/exceptions";

/** Obtiene un run verificando que pertenezca al usuario autenticado. */
export async function getPracticeRun(
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
  return run;
}
