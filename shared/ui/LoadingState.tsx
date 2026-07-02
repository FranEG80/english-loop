import { cn } from "@/shared/lib/cn";

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = "Cargando…",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-foreground/70",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary-dark motion-reduce:animate-none"
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}
