import { redirect } from "next/navigation";
import {
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import type { ActivityQuestionDto } from "@/core/models";
import { FocusedPracticeClient } from "@/features/review/FocusedPracticeClient";
import { getDictionary } from "@/shared/i18n";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { requireSession } from "@/shared/lib/require-session";

export default async function FocusedSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ activityId?: string | string[] }>;
}) {
  const [{ runId }, query, session, locale] = await Promise.all([
    params,
    searchParams,
    requireSession(),
    getLocalePort().getLocale(),
  ]);
  const ids = Array.isArray(query.activityId)
    ? query.activityId
    : query.activityId
      ? [query.activityId]
      : [];
  const fetched = await Promise.all(
    ids.map((id) => getLearningContentPort().getActivityById(id)),
  );
  const activities = fetched.filter(
    (activity): activity is ActivityQuestionDto => activity !== null,
  );
  if (activities.length === 0) redirect("/review/focus");
  const dictionary = getDictionary(locale);

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <div className="mx-auto max-w-3xl">
        <FocusedPracticeClient
          runId={runId}
          activities={activities}
          dictionary={dictionary}
        />
      </div>
    </WorkspaceShell>
  );
}
