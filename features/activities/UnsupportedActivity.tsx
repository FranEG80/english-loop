import type { Dictionary } from "@/shared/i18n";

export function UnsupportedActivity({ dictionary }: { dictionary: Dictionary }) {
  return (
    <div
      role="alert"
      className="rounded-card border border-danger-surface bg-danger-surface/40 p-6 text-center"
    >
      <p className="font-semibold text-danger">{dictionary.states.errorTitle}</p>
    </div>
  );
}
