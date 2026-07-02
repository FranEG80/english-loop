import { redirect } from "next/navigation";
import {
  getDailySessionPort,
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import { getDictionary } from "@/shared/i18n";
import { requireSession } from "@/shared/lib/require-session";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { DailyLessonView } from "@/features/daily/DailyLessonView";
import { FlashcardReview } from "@/features/daily/FlashcardReview";
import { CanvasPreviewCard } from "@/features/daily/CanvasPreviewCard";

const TIMEZONE = "UTC";

export default async function DailyLessonPage() {
  const session = await requireSession();
  const locale = await getLocalePort().getLocale();
  const dictionary = getDictionary(locale);
  const dailySession = await getDailySessionPort().getTodaySession(TIMEZONE);
  const lesson = await getLearningContentPort().getLessonById(
    dailySession.recommendedLessonId,
  );

  if (!lesson) {
    redirect("/");
  }

  const [flashcardStack, canvasPreview] = await Promise.all([
    getLearningContentPort().getFlashcardStack(
      "flashcards-phrasal-verbs-daily-life",
    ),
    getLearningContentPort().getCanvasPreview(
      "canvas-preview-sentence-mapping",
    ),
  ]);

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <div className="flex flex-col gap-6">
        <DailyLessonView dictionary={dictionary} lesson={lesson} />
        {flashcardStack ? (
          <FlashcardReview stack={flashcardStack} dictionary={dictionary} />
        ) : null}
        {canvasPreview ? (
          <CanvasPreviewCard
            preview={canvasPreview}
            locale={locale}
            dictionary={dictionary}
          />
        ) : null}
      </div>
    </WorkspaceShell>
  );
}
