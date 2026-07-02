"use server";

import { redirect } from "next/navigation";
import { getFocusedPracticePort } from "@/adapters/adapter-factory";
import type {
  AttemptFeedbackDto,
  CefrLevelFilter,
  PracticeRunSummaryDto,
  SubmitAttemptInputDto,
} from "@/core/models";

export async function createFocusedPracticeAction(formData: FormData) {
  const taxonomyNodeId = String(formData.get("taxonomyNodeId") ?? "");
  const rawLevel = String(formData.get("level") ?? "both");
  const level: CefrLevelFilter =
    rawLevel === "B1" || rawLevel === "B2" ? rawLevel : "both";
  const rawSize = Number(formData.get("sessionSize") ?? 5);
  const sessionSize =
    rawSize === 10 || rawSize === 15 || rawSize === 20 ? rawSize : 5;

  const run = await getFocusedPracticePort().createRun({
    taxonomyNodeId,
    level,
    sessionSize,
  });
  const query = new URLSearchParams();
  run.activityIds.forEach((id) => query.append("activityId", id));
  redirect(`/review/session/${run.id}?${query.toString()}`);
}

export async function submitFocusedAttemptAction(
  runId: string,
  input: SubmitAttemptInputDto,
): Promise<AttemptFeedbackDto> {
  return getFocusedPracticePort().submitRunAttempt(runId, input);
}

export async function getFocusedSummaryAction(
  runId: string,
): Promise<PracticeRunSummaryDto> {
  return getFocusedPracticePort().getRunSummary(runId);
}
