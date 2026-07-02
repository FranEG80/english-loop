import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import { getActivityDetail } from "@/core/use-cases";
import { ActivityPreviewClient } from "@/features/activities/ActivityPreviewClient";
import { getActivityDefinition } from "@/features/activities/activity-registry";
import { getDictionary } from "@/shared/i18n";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { requireSession } from "@/shared/lib/require-session";
import { Badge } from "@/shared/ui/Badge";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;
  const [session, locale, activity] = await Promise.all([
    requireSession(),
    getLocalePort().getLocale(),
    getActivityDetail(getLearningContentPort(), activityId),
  ]);
  if (!activity) notFound();
  const dictionary = getDictionary(locale);
  const definition = getActivityDefinition(activity);

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Link href="/activities" className="font-medium text-primary-dark">
          ← {dictionary.nav.activities}
        </Link>
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone={activity.level === "B1" ? "b1" : "b2"}>
              {activity.level}
            </Badge>
            <Badge tone="neutral">{activity.type.replaceAll("_", " ")}</Badge>
          </div>
          <p className="font-hand text-3xl font-bold text-coral">Activity lab</p>
          <h1 className="text-5xl font-medium capitalize tracking-tight">{activity.id.replaceAll("-", " ")}</h1>
          <p className="text-foreground/70">{activity.taxonomyNodeId}</p>
        </header>
        <ActivityPreviewClient activity={activity} dictionary={dictionary} />
        <dl className="grid gap-3 rounded-card border border-border p-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-foreground/60">
              {dictionary.catalog.activityType}
            </dt>
            <dd className="font-medium">{definition.renderer}</dd>
          </div>
          <div>
            <dt className="text-sm text-foreground/60">
              {dictionary.catalog.interactionMode}
            </dt>
            <dd className="font-medium">{activity.interactionMode}</dd>
          </div>
        </dl>
        <Link
          href={`/review/focus?taxonomyNodeId=${encodeURIComponent(activity.taxonomyNodeId)}`}
          className="inline-flex h-12 w-fit items-center rounded-control bg-primary-dark px-5 font-medium text-white"
        >
          {dictionary.catalog.practiceTopic}
        </Link>
      </div>
    </WorkspaceShell>
  );
}
