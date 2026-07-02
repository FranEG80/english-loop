import Link from "next/link";
import type { LessonSummaryDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";

export function LessonCatalog({
  lessons,
  dictionary,
}: {
  lessons: LessonSummaryDto[];
  dictionary: Dictionary;
}) {
  if (lessons.length === 0) {
    return <EmptyState title={dictionary.catalog.noResults} />;
  }

  return (
    <ul className="stagger-in grid gap-5 md:grid-cols-2">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <Card className="lift-on-hover relative flex h-full min-h-64 flex-col gap-3 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={lesson.level === "B1" ? "b1" : "b2"}>
                {lesson.level}
              </Badge>
              <Badge tone="neutral">{lesson.category.replaceAll("_", " ")}</Badge>
              <Badge tone="accent">{lesson.status}</Badge>
            </div>
            <span className="font-hand absolute -right-2 top-3 rotate-6 text-6xl font-black text-primary/10">
              {String(lesson.difficulty).padStart(2, "0")}
            </span>
            <h2 className="max-w-[18ch] text-3xl font-semibold leading-none">{lesson.title}</h2>
            <p className="flex-1 text-sm text-foreground/70">{lesson.summary}</p>
            <Link
              href={`/lessons/${lesson.id}`}
              className="mt-3 inline-flex w-fit rounded-xl border-2 border-foreground bg-accent px-4 py-2 font-black text-foreground shadow-[2px_3px_0_var(--color-foreground)] transition-transform hover:-translate-y-0.5"
            >
              {dictionary.catalog.openLesson}
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  );
}
