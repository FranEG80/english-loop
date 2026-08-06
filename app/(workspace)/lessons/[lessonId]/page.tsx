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
      <Link
        href="/lessons"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary-dark transition-colors hover:text-coral"
      >
        <span aria-hidden="true">←</span>
        {dictionary.nav.lessons}
      </Link>
      <DailyLessonView
        dictionary={dictionary}
        lesson={lesson}
        practiceHref={`/review/focus?taxonomyNodeId=${encodeURIComponent(lesson.taxonomyNodeId)}`}
        practiceLabel={dictionary.catalog.practiceTopic}
      />
    </div>
  );
}
