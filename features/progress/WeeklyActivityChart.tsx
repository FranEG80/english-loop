import type { ProgressOverviewDto } from "@/core/models";

export function WeeklyActivityChart({
  data,
  locale,
}: {
  data: ProgressOverviewDto["weeklyActivity"];
  locale: "es" | "en";
}) {
  const max = Math.max(...data.map((item) => item.completedActivities), 1);
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const total = data.reduce((sum, item) => sum + item.completedActivities, 0);

  return (
    <figure
      className="ink-card rounded-[2rem] bg-primary-dark p-6 text-white sm:p-8"
      aria-labelledby="weekly-activity-title"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-hand text-3xl font-bold text-accent">
            {locale === "es" ? "Tu ritmo esta semana" : "Your rhythm this week"}
          </p>
          <h2 id="weekly-activity-title" className="text-3xl font-semibold">
            {locale === "es" ? "Actividades completadas" : "Completed activities"}
          </h2>
        </div>
        <p className="text-sm font-black uppercase tracking-[.14em] text-white/55">
          {total} {locale === "es" ? "en total" : "in total"}
        </p>
      </div>

      <div
        className="mt-8 grid h-64 grid-cols-7 items-end gap-2 sm:gap-4"
        role="img"
        aria-label={data
          .map((item) => `${item.date}: ${item.completedActivities}`)
          .join(", ")}
      >
        {data.map((item, index) => {
          const height = Math.max(12, (item.completedActivities / max) * 100);
          const date = new Date(`${item.date}T12:00:00`);
          return (
            <div key={item.date} className="flex h-full flex-col justify-end gap-2">
              <div className="flex min-h-0 flex-1 items-end">
                <div
                  className={`group relative w-full rounded-t-2xl border-2 border-white/35 transition-[height,transform] hover:-translate-y-1 ${
                    index === data.length - 1 ? "bg-accent" : "bg-level-b1"
                  }`}
                  style={{ height: `${height}%` }}
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-sm font-black text-white">
                    {item.completedActivities}
                  </span>
                  <span className="sr-only">
                    {Math.round(item.accuracyRate * 100)}% accuracy
                  </span>
                </div>
              </div>
              <span className="text-center text-xs font-black uppercase text-white/55">
                {formatter.format(date).replace(".", "")}
              </span>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-5 text-sm font-semibold text-white/55">
        {locale === "es"
          ? "La altura representa las actividades terminadas cada día."
          : "Bar height represents activities completed each day."}
      </figcaption>
    </figure>
  );
}
