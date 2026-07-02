import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  Dumbbell,
  Flame,
  RotateCcw,
} from "lucide-react";
import {
  getDailySessionPort,
  getLearningContentPort,
  getLocalePort,
  getProgressPort,
} from "@/adapters/adapter-factory";
import {
  getDailyLoop,
  getProgressSnapshot,
  listActivityCatalog,
  listLessonCatalog,
} from "@/core/use-cases";
import { getDictionary } from "@/shared/i18n";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { requireSession } from "@/shared/lib/require-session";
import { Badge } from "@/shared/ui/Badge";
import { Progress } from "@/shared/ui/Progress";

const TIMEZONE = "UTC";

export default async function DashboardPage() {
  const session = await requireSession();
  const locale = await getLocalePort().getLocale();
  const dictionary = getDictionary(locale);
  const content = getLearningContentPort();
  const [daily, progress, lessons, activities] = await Promise.all([
    getDailyLoop(getDailySessionPort(), content, TIMEZONE),
    getProgressSnapshot(getProgressPort(), content),
    listLessonCatalog(content, {}),
    listActivityCatalog(content, {}),
  ]);

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="font-hand text-3xl font-bold text-coral">
            {locale === "es" ? `¡Hola, ${session.name}!` : `Hey, ${session.name}!`}
          </p>
          <h1 className="text-5xl font-medium tracking-tight">{dictionary.dashboard.title}</h1>
          <p className="text-lg font-semibold text-foreground/65">
            {dictionary.dashboard.description}
          </p>
        </header>

        <div className="grid auto-rows-[minmax(9rem,auto)] gap-4 md:grid-cols-6">
          <Link
            href="/"
            className="ink-card group relative overflow-hidden rounded-[2rem] bg-primary-dark p-7 text-white md:col-span-4 md:row-span-2"
          >
            <p className="text-xs font-black uppercase tracking-[.18em] text-accent">
              Today’s Daily Loop
            </p>
            <h2 className="mt-3 max-w-lg text-4xl font-medium leading-none">
              {daily.lesson?.title ?? dictionary.home.recommendedLesson}
            </h2>
            <p className="mt-4 max-w-md font-semibold text-white/65">
              {daily.lesson?.summary}
            </p>
            <div className="mt-8 max-w-sm">
              <Progress
                value={(daily.dailySession.goal.completedActivities / daily.dailySession.goal.targetActivities) * 100}
                label={dictionary.home.dailyGoal}
              />
            </div>
            <span className="mt-5 inline-flex items-center gap-2 font-black text-accent">
              {dictionary.home.goToDaily} <ArrowRight className="h-5 w-5" />
            </span>
            <Image
              src="/mascot/loopy-reading.webp"
              alt=""
              width={230}
              height={230}
              className="absolute -bottom-10 -right-8 hidden w-52 rotate-3 transition-transform group-hover:-rotate-2 md:block"
            />
          </Link>

          <Link
            href="/progress"
            className="ink-card lift-on-hover rounded-[2rem] bg-accent p-6 md:col-span-2"
          >
            <ChartNoAxesCombined className="h-7 w-7" aria-hidden="true" />
            <p className="mt-4 text-sm font-black uppercase tracking-wider opacity-60">
              {dictionary.nav.progress}
            </p>
            <p className="mt-1 text-4xl font-black">{Math.round(progress.overview.accuracyRate * 100)}%</p>
          </Link>

          <div className="ink-card rounded-[2rem] bg-coral p-6 text-white md:col-span-2">
            <Flame className="h-7 w-7" aria-hidden="true" />
            <p className="mt-4 text-sm font-black uppercase tracking-wider text-white/65">
              {dictionary.home.streak}
            </p>
            <p className="mt-1 text-4xl font-black">{progress.overview.streakDays} days</p>
          </div>

          <Link
            href="/lessons"
            className="ink-card lift-on-hover rounded-[2rem] bg-level-b1 p-6 md:col-span-2"
          >
            <BookOpen className="h-7 w-7 text-primary" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-semibold">{dictionary.nav.lessons}</h2>
            <p className="mt-1 font-bold text-foreground/60">{lessons.length} available</p>
          </Link>

          <Link
            href="/activities"
            className="ink-card lift-on-hover rounded-[2rem] bg-surface p-6 md:col-span-2"
          >
            <Dumbbell className="h-7 w-7 text-coral" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-semibold">{dictionary.nav.activities}</h2>
            <p className="mt-1 font-bold text-foreground/60">{activities.length} formats</p>
          </Link>

          <Link
            href="/review"
            className="ink-card lift-on-hover relative overflow-hidden rounded-[2rem] bg-level-b2 p-6 md:col-span-2"
          >
            <RotateCcw className="h-7 w-7 text-level-b2-strong" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-semibold">{dictionary.nav.review}</h2>
            <Badge tone="danger" className="mt-2">
              {progress.reviewQueue.dueItems.length} {dictionary.home.pendingReviews.toLowerCase()}
            </Badge>
          </Link>
        </div>
      </div>
    </WorkspaceShell>
  );
}
