import { redirect } from "next/navigation";
import { getAuthPort, getLocalePort } from "@/adapters/adapter-factory";
import { loginDemoAction } from "@/features/auth/actions";
import { getDictionary } from "@/shared/i18n/get-dictionary";
import { PublicShell } from "@/shared/layout/PublicShell";

/** Entrada directa alternativa al botón de demo de la landing. */
export default async function DemoPage() {
  const [session, locale] = await Promise.all([
    getAuthPort().getSession(),
    getLocalePort().getLocale(),
  ]);
  if (session?.isDemo) redirect("/");
  const dictionary = getDictionary(locale);

  return (
    <PublicShell dictionary={dictionary} locale={locale}>
      <div className="mx-auto flex min-h-[65dvh] max-w-xl items-center px-5 py-16">
        <div className="ink-card w-full rounded-[2rem] bg-surface p-8 text-center">
          <h1 className="text-4xl font-medium">{dictionary.landing.demoCta}</h1>
          <p className="mt-3 font-semibold text-foreground/65">
            {locale === "es"
              ? "6 lecciones y 12 actividades con una cuenta demo real."
              : "6 lessons and 12 activities with a real demo account."}
          </p>
          <form action={loginDemoAction} className="mt-7">
            <button
              type="submit"
              className="inline-flex h-14 items-center rounded-control border-2 border-foreground bg-accent px-6 text-base font-black text-foreground shadow-[4px_5px_0_var(--color-foreground)] transition-transform hover:-translate-y-1"
            >
              {dictionary.landing.demoCta}
            </button>
          </form>
        </div>
      </div>
    </PublicShell>
  );
}
