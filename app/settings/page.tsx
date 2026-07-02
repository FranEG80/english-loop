import {
  Gauge,
  CheckCircle2,
  Languages,
  MonitorCog,
  RotateCcw,
  Save,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  getLocalePort,
  getSettingsPort,
} from "@/adapters/adapter-factory";
import {
  resetSettingsAction,
  updateSettingsAction,
} from "@/features/settings/actions";
import { getDictionary } from "@/shared/i18n";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { LogoutButton } from "@/shared/layout/LogoutButton";
import { requireSession } from "@/shared/lib/require-session";
import { DailyGoalStepper } from "@/features/settings/DailyGoalStepper";

export default async function SettingsPage() {
  const [session, locale, settings] = await Promise.all([
    requireSession(),
    getLocalePort().getLocale(),
    getSettingsPort().getSettings(),
  ]);
  const dictionary = getDictionary(locale);

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <div className="flex flex-col gap-8">
        <header>
          <p className="font-hand text-3xl font-bold text-coral">Make it yours</p>
          <h1 className="text-5xl font-medium tracking-tight">
            {dictionary.settings.title}
          </h1>
          <p className="mt-2 text-lg font-semibold text-foreground/65">
            {dictionary.settings.description}
          </p>
        </header>

        <section className="ink-card flex items-center justify-between gap-3 rounded-[1.5rem] bg-level-b1 p-3.5 sm:rounded-[2rem] sm:p-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-dark text-white sm:h-14 sm:w-14 sm:rounded-2xl">
              <UserRound className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black sm:text-xl">{session.name}</p>
              <p className="truncate text-xs font-semibold text-foreground/55 sm:text-sm">
                {session.email}
              </p>
            </div>
          </div>
          <LogoutButton label={dictionary.nav.logout} compact />
        </section>

        <form action={updateSettingsAction} className="grid gap-5 lg:grid-cols-2">
          <fieldset className="ink-card rounded-[2rem] bg-primary-dark p-6 text-white sm:p-8">
            <legend className="sr-only">{dictionary.settings.locale}</legend>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-foreground">
                <Languages className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="font-hand text-2xl font-bold text-accent">
                  Language
                </p>
                <h2 className="text-3xl font-semibold">
                  {dictionary.settings.locale}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "es", title: "Español", note: "Interfaz en español" },
                { value: "en", title: "English", note: "English interface" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="cursor-pointer rounded-2xl border-2 border-white/20 bg-white/8 p-4 transition-transform has-[:checked]:-translate-y-1 has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-foreground"
                >
                  <input
                    type="radio"
                    name="locale"
                    value={option.value}
                    defaultChecked={settings.locale === option.value}
                    className="sr-only"
                  />
                  <span className="block text-lg font-black">{option.title}</span>
                  <span className="mt-1 block text-xs font-semibold opacity-60">
                    {option.note}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="ink-card rounded-[2rem] bg-accent p-6 sm:p-8">
            <legend className="sr-only">{dictionary.settings.activeLevels}</legend>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface">
                <Sparkles className="h-6 w-6 text-coral" aria-hidden="true" />
              </span>
              <div>
                <p className="font-hand text-2xl font-bold text-coral">
                  Your challenge
                </p>
                <h2 className="text-3xl font-semibold">
                  {dictionary.settings.activeLevels}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["B1", "B2"] as const).map((level) => (
                <label
                  key={level}
                  className="relative cursor-pointer rounded-2xl border-2 border-foreground/30 bg-surface/45 p-3 text-center transition-[transform,background-color,color,box-shadow] has-[:checked]:-translate-y-1 has-[:checked]:!border-foreground has-[:checked]:!bg-primary-dark has-[:checked]:!text-white has-[:checked]:shadow-[4px_5px_0_var(--color-foreground)]"
                >
                  <input
                    type="checkbox"
                    name="activeLevels"
                    value={level}
                    defaultChecked={settings.activeLevels.includes(level)}
                    className="peer sr-only"
                  />
                  <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-accent text-foreground opacity-0 transition-opacity peer-checked:opacity-100">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="font-serif block text-3xl font-bold">{level}</span>
                  <span className="mt-1 block text-xs font-black uppercase tracking-wider opacity-55">
                    {level === "B1" ? "Intermediate" : "Upper intermediate"}
                  </span>
                  {/* <span className="mt-3 hidden text-xs font-black uppercase tracking-[.16em] text-accent peer-checked:block">
                    {locale === "es" ? "Activo" : "Active"}
                  </span> */}
                </label>
              ))}
            </div>
          </fieldset>

          <section className="editorial-card rounded-[2rem] bg-surface p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-level-b1">
                <Gauge className="h-6 w-6 text-primary" aria-hidden="true" />
              </span>
              <div>
                <p className="font-hand text-2xl font-bold text-primary">
                  Daily rhythm
                </p>
                <h2 className="text-3xl font-semibold">
                  {dictionary.settings.dailyGoal}
                </h2>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <DailyGoalStepper
                defaultValue={settings.dailyGoal}
                label={dictionary.settings.dailyGoal}
              />
              <span className="max-w-xs text-sm font-bold text-foreground/60">
                {locale === "es"
                  ? "Actividades que quieres completar cada día."
                  : "Activities you want to complete each day."}
              </span>
            </div>
          </section>

          <section className="editorial-card rounded-[2rem] bg-level-b2 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface">
                <MonitorCog className="h-6 w-6 text-level-b2-strong" aria-hidden="true" />
              </span>
              <div>
                <p className="font-hand text-2xl font-bold text-level-b2-strong">
                  Comfort
                </p>
                <h2 className="text-3xl font-semibold">
                  {dictionary.settings.reducedMotion}
                </h2>
              </div>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 border-foreground/20 bg-surface/55 p-4">
              <span className="text-sm font-bold text-foreground/65">
                {locale === "es"
                  ? "Reduce animaciones y transiciones decorativas."
                  : "Reduce decorative animations and transitions."}
              </span>
              <input
                type="checkbox"
                name="reducedMotion"
                defaultChecked={settings.reducedMotion}
                className="peer sr-only"
              />
              <span className="relative h-8 w-14 shrink-0 rounded-full border-2 border-foreground bg-surface transition-colors peer-checked:bg-primary-dark after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-coral after:transition-transform peer-checked:after:translate-x-6" />
            </label>
          </section>

          <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm font-semibold text-foreground/55">
              {dictionary.settings.mockNotice}
            </p>
            <button className="inline-flex h-14 items-center justify-center gap-2 rounded-control border-2 border-foreground bg-primary-dark px-7 font-black text-white shadow-[4px_5px_0_var(--color-foreground)] transition-transform hover:-translate-y-1">
              <Save className="h-5 w-5" aria-hidden="true" />
              {dictionary.common.save}
            </button>
          </div>
        </form>

        <section className="rounded-[2rem] border-2 border-danger bg-danger-surface p-6 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="font-hand text-2xl font-bold text-danger">Danger zone</p>
            <h2 className="text-2xl font-semibold">Reset mock data</h2>
          </div>
          <form action={resetSettingsAction} className="mt-4 sm:mt-0">
            <button className="inline-flex h-12 items-center gap-2 rounded-control border-2 border-danger px-5 font-black text-danger transition-colors hover:bg-danger hover:text-white">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset mock
            </button>
          </form>
        </section>
      </div>
    </WorkspaceShell>
  );
}
