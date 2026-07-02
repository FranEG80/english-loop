import { cn } from "@/shared/lib/cn";

export interface ProgressProps {
  /** Valor entre 0 y 100. */
  value: number;
  label: string;
  className?: string;
}

export function Progress({ value, label, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "h-3 w-full overflow-hidden rounded-full border border-foreground/20 bg-surface-muted",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-accent))] transition-[width] motion-reduce:transition-none"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
