import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Flame, Sparkles } from "lucide-react";
import type { Dictionary } from "@/shared/i18n";
import { Mascot } from "@/shared/layout/Mascot";

const PRACTICE_AREAS = [
  ["Gramática", "Grammar"],
  ["Vocabulario", "Vocabulary"],
  ["Use of English", "Use of English"],
  ["Phrasal verbs", "Phrasal verbs"],
  ["Collocations", "Collocations"],
  ["Preposiciones", "Prepositions"],
  ["Word formation", "Word formation"],
  ["Writing", "Writing"],
  ["Reading", "Reading"],
] as const;

const ACTIVITIES = [
  {
    src: "/illustrations/activities/true-false.webp",
    es: "Verdadero o falso",
    en: "True or false",
    className: "rotate-[-1.5deg]",
  },
  {
    src: "/illustrations/activities/word-order.webp",
    es: "Ordena palabras",
    en: "Order words",
    className: "sm:translate-y-7 rotate-[1deg]",
  },
  {
    src: "/illustrations/activities/matching.webp",
    es: "Conecta ideas",
    en: "Match ideas",
    className: "rotate-[1.5deg]",
  },
  {
    src: "/illustrations/activities/sentence-transformation.webp",
    es: "Transforma frases",
    en: "Transform sentences",
    className: "sm:translate-y-7 rotate-[-1deg]",
  },
] as const;

export function Landing({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: "es" | "en";
}) {
  return (
    <div className="overflow-hidden">
      <section className="relative mx-auto grid min-h-[calc(100dvh-5rem)] w-full max-w-[1240px] items-center gap-10 px-5 py-14 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-20">
        <div className="stagger-in relative z-10 flex flex-col items-start">
          <p className="mb-5 inline-flex -rotate-1 items-center gap-2 rounded-full border-2 border-foreground bg-accent px-4 py-2 text-sm font-black shadow-[2px_3px_0_var(--color-foreground)]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {dictionary.landing.heroEyebrow}
          </p>
          <h1 className="max-w-[13ch] text-[clamp(3.2rem,8vw,6.8rem)] font-medium leading-[0.86] tracking-[-0.055em]">
            {locale === "es" ? (
              <>
                Tu inglés,{" "}
                <span className="scribble-underline italic text-primary">
                  siempre vivo.
                </span>
              </>
            ) : (
              <>
                Keep your English{" "}
                <span className="scribble-underline italic text-primary">
                  alive.
                </span>
              </>
            )}
          </h1>
          <p className="font-hand mt-4 -rotate-2 text-3xl font-bold text-coral sm:text-4xl">
            {locale === "es" ? "Un poco cada día, de verdad." : "A little every day, for real."}
          </p>
          <p className="mt-7 max-w-xl text-lg font-semibold leading-relaxed text-foreground/70 sm:text-xl">
            {dictionary.landing.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="inline-flex h-14 items-center gap-2 rounded-control border-2 border-foreground bg-primary-dark px-6 text-base font-black text-white shadow-[4px_5px_0_var(--color-foreground)] transition-transform hover:-translate-y-1"
            >
              {dictionary.landing.heroCtaPrimary}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-14 items-center rounded-control border-2 border-foreground bg-surface px-6 text-base font-black text-primary-dark transition-transform hover:-rotate-1"
            >
              {dictionary.landing.heroCtaSecondary}
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-foreground/65">
            {["B1 + B2", "14 activity types", "5–10 min/day"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto min-h-[30rem] w-full max-w-[34rem]">
          <div className="absolute inset-x-8 top-10 aspect-square rotate-3 rounded-[4rem_8rem_5rem_9rem] border-2 border-foreground bg-primary shadow-[8px_10px_0_var(--color-foreground)]" />
          <div className="absolute inset-x-0 top-0 flex justify-center">
            <div className="loopy-float">
              <Mascot
                pose="wave"
                size={260}
                priority
                className="!overflow-visible !rounded-none !bg-transparent"
              />
            </div>
          </div>
          <div className="editorial-card absolute bottom-4 left-0 w-[70%] -rotate-3 rounded-3xl p-4">
            <p className="text-xs font-black uppercase tracking-[.18em] text-primary">
              Today’s loop
            </p>
            <p className="mt-1 text-lg font-black">Future forms · B1</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full w-2/3 rounded-full bg-coral" />
            </div>
          </div>
          <div className="ink-card absolute right-0 top-[55%] rotate-3 rounded-2xl bg-accent px-4 py-3">
            <Flame className="mb-1 h-6 w-6 text-coral" aria-hidden="true" />
            <p className="text-2xl font-black">4 days</p>
            <p className="text-xs font-bold uppercase tracking-wider">streak</p>
          </div>
          <p className="font-hand absolute right-4 top-8 rotate-6 text-3xl font-bold text-white">
            Let’s loop!
          </p>
        </div>
      </section>

      <section className="border-y-2 border-foreground bg-primary-dark py-5 text-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-center gap-x-10 gap-y-3 px-5 items-baseline">
          {PRACTICE_AREAS.map(([es, en], index) => (
            <span
              key={es}
              className={index % 3 === 1 ? "font-hand text-2xl text-accent" : "text-sm font-black uppercase tracking-[.14em]"}
            >
              {locale === "es" ? es : en}
            </span>
          ))}
        </div>
      </section>

      <section className="defer-section mx-auto w-full max-w-[1240px] px-5 py-24 lg:px-8">
        <div className="mb-12 grid gap-6 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
          <p className="font-hand text-4xl font-bold text-coral">
            {locale === "es" ? "Sin decidir qué estudiar." : "No deciding what to study."}
          </p>
          <h2 className="text-5xl font-medium leading-[.95] tracking-tight sm:text-6xl">
            {dictionary.landing.howItWorksTitle},{" "}
            <span className="italic text-primary">
              {locale === "es" ? "sin complicaciones." : "without the fuss."}
            </span>
          </h2>
        </div>
        <ol className="stagger-in grid gap-5 md:grid-cols-3">
          {dictionary.landing.howItWorksSteps.map((step, index) => (
            <li
              key={step.title}
              className={`ink-card lift-on-hover rounded-card p-6 ${
                index === 1 ? "bg-accent md:translate-y-8" : index === 2 ? "bg-level-b1" : "bg-surface"
              }`}
            >
              <span className="font-hand text-5xl font-bold text-primary">
                0{index + 1}
              </span>
              <h3 className="mt-5 text-2xl font-bold">{step.title}</h3>
              <p className="mt-3 font-semibold leading-relaxed text-foreground/70">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="defer-section bg-primary-dark py-24 text-white">
        <div className="mx-auto w-full max-w-[1240px] px-5 lg:px-8">
          <div className="max-w-3xl">
            <p className="font-hand text-3xl font-bold text-accent">
              {locale === "es" ? "Toca, ordena, conecta, escribe." : "Tap, order, match, write."}
            </p>
            <h2 className="mt-3 text-5xl font-medium leading-none sm:text-6xl">
              {dictionary.landing.interactiveTitle}
            </h2>
            <p className="mt-5 max-w-2xl text-lg font-semibold text-white/65">
              {dictionary.landing.interactiveSubtitle}
            </p>
          </div>
          <div className="stagger-in mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ACTIVITIES.map((item) => (
              <article
                key={item.src}
                className={`lift-on-hover rounded-[2rem] border-2 border-white/70 bg-surface p-4 text-foreground shadow-[5px_6px_0_var(--color-accent)] ${item.className}`}
              >
                <Image
                  src={item.src}
                  alt=""
                  width={240}
                  height={210}
                  sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 90vw"
                  className="h-48 w-full rounded-2xl object-contain"
                />
                <h3 className="mt-3 text-xl font-bold">
                  {locale === "es" ? item.es : item.en}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="defer-section mx-auto grid w-full max-w-[1240px] gap-8 px-5 py-24 lg:grid-cols-12 lg:px-8">
        <div className="ink-card relative overflow-hidden rounded-[2.5rem] bg-level-b1 p-8 lg:col-span-7 lg:p-12">
          <p className="font-hand text-3xl font-bold text-coral">Daily Loop</p>
          <h2 className="mt-3 max-w-lg text-5xl font-medium leading-none">
            {dictionary.landing.dailyLoopTitle}
          </h2>
          <p className="mt-5 max-w-lg text-lg font-semibold text-foreground/70">
            {dictionary.landing.dailyLoopSubtitle}
          </p>
          <ol className="mt-8 space-y-3">
            {dictionary.landing.dailyLoopSteps.map((step, index) => (
              <li key={step} className="flex items-center gap-4 font-black">
                <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-foreground bg-surface">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <Image
            src="/illustrations/landing-daily-loop.webp"
            alt=""
            width={280}
            height={280}
            className="absolute -bottom-12 -right-8 hidden h-64 w-64 rotate-6 object-contain sm:block"
          />
        </div>
        <div className="ink-card relative min-h-[31rem] overflow-hidden rounded-[2.5rem] bg-coral lg:col-span-5">
          <Image
            src="/photos/landing/study-at-home.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="object-cover mix-blend-multiply"
          />
          <div className="absolute inset-x-5 bottom-5 rounded-2xl border-2 border-foreground bg-surface p-5">
            <p className="text-sm font-black uppercase tracking-widest text-primary">
              {dictionary.landing.progressTitle}
            </p>
            <p className="mt-2 font-bold">{dictionary.landing.progressSubtitle}</p>
          </div>
        </div>
      </section>

      <section className="defer-section mx-auto w-full max-w-[1240px] px-5 pb-20 lg:px-8">
        <div className="ink-card relative overflow-hidden rounded-[3rem] bg-accent px-6 py-14 text-center sm:px-12">
          <div className="absolute -left-6 -top-10 -rotate-12 opacity-90">
            <Mascot
              pose="celebrate"
              size={180}
              className="!rounded-none !bg-transparent"
            />
          </div>
          <p className="font-hand text-3xl font-bold text-primary-dark">
            {locale === "es" ? "Tu próxima racha empieza aquí" : "Your next streak starts here"}
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-5xl font-medium leading-none">
            {dictionary.landing.finalCtaTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-bold text-foreground/70">
            {dictionary.landing.finalCtaSubtitle}
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex h-14 items-center gap-2 rounded-control border-2 border-foreground bg-primary-dark px-7 font-black text-white shadow-[4px_5px_0_var(--color-foreground)] transition-transform hover:-translate-y-1"
          >
            {dictionary.landing.finalCtaButton}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
