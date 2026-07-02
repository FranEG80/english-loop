import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lightbulb, MessageCircle, TriangleAlert } from "lucide-react";
import type { LessonDetailDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Badge } from "@/shared/ui";
import { Mascot } from "@/shared/layout/Mascot";

export function DailyLessonView({
  dictionary,
  lesson,
}: {
  dictionary: Dictionary;
  lesson: LessonDetailDto;
}) {
  return (
    <article className="flex flex-col gap-6">
      <header className="ink-card relative grid min-h-[21rem] overflow-hidden rounded-[2.5rem] bg-level-b1 p-7 sm:p-10 lg:grid-cols-[1fr_18rem]">
        <div className="relative z-10 flex flex-col items-start justify-center">
          <div className="flex flex-wrap gap-2">
            <Badge tone={lesson.level === "B1" ? "b1" : "b2"}>{lesson.level}</Badge>
            <Badge tone="neutral">{lesson.category.replaceAll("_", " ")}</Badge>
          </div>
          <p className="font-hand mt-5 text-3xl font-bold text-coral">
            {dictionary.daily.lessonBadge}
          </p>
          <h1 className="mt-2 max-w-3xl text-5xl font-medium leading-[.95] tracking-tight sm:text-6xl">
            {lesson.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-semibold leading-relaxed text-foreground/65">
            {lesson.summary}
          </p>
        </div>
        <div className="relative hidden lg:block">
          <div className="absolute -bottom-12 right-0">
            <Mascot
              pose="reading"
              size={260}
              priority
              className="!rounded-none !bg-transparent"
            />
          </div>
          <Image
            src="/illustrations/grammar-practice.webp"
            alt=""
            width={140}
            height={140}
            loading="eager"
            className="absolute right-1 top-0 w-28 rotate-6 rounded-2xl border-2 border-foreground object-cover shadow-[3px_4px_0_var(--color-foreground)]"
          />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="editorial-card rounded-[2rem] bg-surface p-7 lg:col-span-7 lg:p-9">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.17em] text-primary">
            <Lightbulb className="h-5 w-5" aria-hidden="true" />
            {dictionary.daily.explanationTitle}
          </p>
          <p className="mt-5 font-serif text-2xl font-medium leading-relaxed sm:text-3xl">
            {lesson.explanation}
          </p>
        </section>

        <section className="ink-card rounded-[2rem] bg-accent p-7 lg:col-span-5">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.17em]">
            <TriangleAlert className="h-5 w-5" aria-hidden="true" />
            {dictionary.daily.commonMistakesTitle}
          </p>
          <ul className="mt-5 space-y-4">
            {lesson.commonMistakes.map((mistake, index) => (
              <li key={mistake} className="flex gap-3 font-bold leading-relaxed">
                <span className="font-hand text-2xl font-black text-coral">
                  0{index + 1}
                </span>
                {mistake}
              </li>
            ))}
          </ul>
        </section>

        <section className="ink-card rounded-[2rem] bg-primary-dark p-7 text-white lg:col-span-12">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.17em] text-accent">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            {dictionary.daily.examplesTitle}
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {lesson.examples.map((example, index) => (
              <li
                key={example.english}
                className={`rounded-2xl border border-white/20 p-5 ${
                  index === 1 ? "bg-accent text-foreground md:-translate-y-2" : "bg-white/8"
                }`}
              >
                <p className="font-serif text-xl font-semibold">{example.english}</p>
                <p className={`mt-2 text-sm font-semibold ${index === 1 ? "text-foreground/65" : "text-white/60"}`}>
                  {example.translationEs}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Link
        href="/daily/practice"
        className="inline-flex h-14 w-fit items-center gap-3 self-end rounded-control border-2 border-foreground bg-coral px-7 text-lg font-black text-white shadow-[4px_5px_0_var(--color-foreground)] transition-transform hover:-translate-y-1"
      >
        {dictionary.daily.practiceCta}
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </Link>
    </article>
  );
}
