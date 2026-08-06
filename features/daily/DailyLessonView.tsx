import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lightbulb, MessageCircle, TriangleAlert } from "lucide-react";
import type { LessonDetailDto } from "@/core/models";
import { parseLessonMarkdown } from "@/core/content/domain/lesson-markdown";
import type { Dictionary } from "@/shared/i18n";
import { Badge } from "@/shared/ui";
import { Mascot } from "@/shared/layout/Mascot";
import { LessonInlineText, LessonRichText } from "@/features/lessons/LessonRichText";
import { LessonSectionMasonry } from "./LessonSectionMasonry";
import { getLessonSectionPlacements } from "./lesson-section-layout";

const sectionWidthClass = {
  full: "lg:col-start-1 lg:col-span-12",
  left: "lg:col-start-1 lg:col-span-5",
  right: "lg:col-start-6 lg:col-span-7",
} as const;

export function DailyLessonView({
  dictionary,
  eyebrow,
  lesson,
  practiceHref = "/daily/practice",
  practiceLabel,
}: {
  dictionary: Dictionary;
  eyebrow?: string;
  lesson: LessonDetailDto;
  practiceHref?: string;
  practiceLabel?: string;
}) {
  const content = parseLessonMarkdown(lesson.explanation);
  const examples = lesson.examples.length > 0
    ? lesson.examples
    : content.examples;
  const commonMistakes = lesson.commonMistakes.length > 0
    ? lesson.commonMistakes
    : content.commonMistakes;
  const sectionPlacements = getLessonSectionPlacements(content.sections);

  return (
    <article className="flex flex-col gap-6">
      <header className={`ink-card relative grid min-h-[18rem] overflow-hidden rounded-[2.5rem] p-7 sm:p-9 lg:grid-cols-[minmax(0,1fr)_16rem] ${lesson.level === "B1" ? "bg-level-b1" : "bg-level-b2"}`}>
        <div className="relative z-10 flex flex-col items-start justify-center">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-hand text-2xl font-bold leading-none text-coral sm:text-3xl">
              {eyebrow ?? dictionary.daily.lessonBadge}
            </p>
            <span className="hidden h-6 w-px bg-coral/30 sm:block" aria-hidden="true" />
            <Badge tone={lesson.level === "B1" ? "b1" : "b2"}>{lesson.level}</Badge>
            <Badge tone="neutral">{lesson.category.replaceAll("_", " ")}</Badge>
          </div>
          <h1 className="mt-3 max-w-4xl text-4xl font-medium leading-[1.02] tracking-tight sm:text-5xl">
            {lesson.title}
          </h1>
          {lesson.summary ? (
            <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-foreground/65 sm:text-lg">
              {lesson.summary}
            </p>
          ) : null}
        </div>
        <div className="relative hidden lg:block">
          <div className="absolute -bottom-10 right-0">
            <Mascot
              pose="reading"
              size={240}
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
            className="absolute right-1 top-0 w-24 rotate-6 rounded-2xl border-2 border-foreground object-cover shadow-[3px_4px_0_var(--color-foreground)]"
          />
        </div>
      </header>

      {content.sections.length > 0 ? (
        <LessonSectionMasonry>
          {content.sections.map((section, index) => (
            <section
              key={`${section.title}-${index}`}
              data-lesson-section-card
              data-lesson-section-placement={sectionPlacements[index] ?? "full"}
              className={`editorial-card overflow-hidden rounded-[2rem] ${index % 3 === 1 ? "bg-accent/35" : ""} ${sectionWidthClass[sectionPlacements[index] ?? "full"]}`}
            >
              <div data-lesson-section-content className="flow-root p-7 lg:p-9">
                <h2 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[.17em] text-primary">
                  <Lightbulb className="size-5" aria-hidden="true" />
                  {section.title || dictionary.daily.explanationTitle}
                </h2>
                <LessonRichText blocks={section.blocks} />
              </div>
            </section>
          ))}
        </LessonSectionMasonry>
      ) : null}

      {examples.length > 0 ? (
        <section className="ink-card rounded-[2rem] bg-primary-dark p-7 text-white lg:p-9">
          <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[.17em] text-accent">
            <MessageCircle className="size-5" aria-hidden="true" />
            {dictionary.daily.examplesTitle}
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {examples.map((example, index) => (
              <li
                key={`${example.english}-${index}`}
                className={`rounded-2xl border border-white/20 p-5 ${index % 4 === 1 ? "bg-accent text-foreground md:-translate-y-1" : "bg-white/8"}`}
              >
                <span className={`font-hand text-sm font-black ${index % 4 === 1 ? "text-coral" : "text-accent"}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 font-serif text-xl font-semibold">{example.english}</p>
                {example.translationEs ? (
                  <p className={`mt-2 text-sm font-semibold ${index % 4 === 1 ? "text-foreground/65" : "text-white/60"}`}>
                    {example.translationEs}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {commonMistakes.length > 0 ? (
        <section className="ink-card rounded-[2rem] bg-accent p-7 lg:p-9">
          <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[.17em]">
            <TriangleAlert className="size-5" aria-hidden="true" />
            {dictionary.daily.commonMistakesTitle}
          </h2>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {commonMistakes.map((mistake, index) => (
              <li key={`${mistake}-${index}`} className="flex gap-3 rounded-2xl bg-surface/65 p-4 font-bold leading-relaxed">
                <span className="font-hand text-2xl font-black text-coral">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span><LessonInlineText value={mistake} /></span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link
        href={practiceHref}
        className="inline-flex min-h-14 w-fit items-center gap-3 self-end rounded-control border-2 border-foreground bg-coral px-7 py-3 text-lg font-black text-white shadow-[4px_5px_0_var(--color-foreground)] transition-transform hover:-translate-y-1"
      >
        {practiceLabel ?? dictionary.daily.practiceCta}
        <ArrowRight className="size-5" aria-hidden="true" />
      </Link>
    </article>
  );
}
