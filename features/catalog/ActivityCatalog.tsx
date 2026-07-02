import Link from "next/link";
import type { ActivityQuestionDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { getActivityDefinition } from "@/features/activities/activity-registry";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import Image from "next/image";
import { ACTIVITY_ILLUSTRATION_BY_TYPE } from "@/features/activities/illustrations";

export function ActivityCatalog({
  activities,
  dictionary,
}: {
  activities: ActivityQuestionDto[];
  dictionary: Dictionary;
}) {
  if (activities.length === 0) {
    return <EmptyState title={dictionary.catalog.noResults} />;
  }

  return (
    <ul className="stagger-in grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {activities.map((activity) => {
        const definition = getActivityDefinition(activity);
        return (
          <li key={activity.id}>
            <Card className="lift-on-hover group relative flex h-full min-h-[22rem] flex-col gap-3 overflow-hidden p-0">
              <div className="relative h-40 border-b-2 border-foreground/60 bg-accent/25">
                <Image
                  src={ACTIVITY_ILLUSTRATION_BY_TYPE[activity.type]}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 340px, (min-width: 768px) 45vw, 90vw"
                  className="object-contain p-3 transition-transform group-hover:scale-105 group-hover:rotate-1"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex flex-wrap gap-2">
                <Badge tone={activity.level === "B1" ? "b1" : "b2"}>
                  {activity.level}
                </Badge>
                <Badge tone="neutral">{activity.type.replaceAll("_", " ")}</Badge>
              </div>
              <h2 className="text-2xl font-semibold capitalize">{activity.id.replaceAll("-", " ")}</h2>
              <p className="flex-1 text-sm text-foreground/70">
                {activity.taxonomyNodeId}
              </p>
              <p className="text-xs text-foreground/60">
                {dictionary.catalog.interactionMode}: {activity.interactionMode}
                {" · "}
                {definition.renderer}
              </p>
              <Link
                href={`/activities/${activity.id}`}
                className="font-medium text-primary-dark underline-offset-4 hover:underline"
              >
                {dictionary.catalog.openActivity}
              </Link>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
