import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import { getLessonDetail } from "@/core/use-cases";
import { DailyLessonView } from "@/features/daily/DailyLessonView";
import { getDictionary } from "@/shared/i18n";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const [locale, lesson] = await Promise.all([
    getLocalePort().getLocale(),
    getLessonDetail(getLearningContentPort(), lessonId),
  ]);
  if (!lesson) notFound();
  const dictionary = getDictionary(locale);

  return (
      <div className="flex flex-col gap-6">
        <Link href="/lessons" className="font-medium text-primary-dark">
          ← {dictionary.nav.lessons}
        </Link>
        <DailyLessonView dictionary={dictionary} lesson={lesson} />
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            {dictionary.catalog.relatedActivities}
          </h2>
          {lesson.relatedActivityIds.map((activityId) => (
            <Link
              key={activityId}
              href={`/activities/${activityId}`}
              className="rounded-control border border-border bg-white p-3 font-medium text-primary-dark"
            >
              {activityId.replaceAll("-", " ")}
            </Link>
          ))}
        </section>
      </div>
  );
}
