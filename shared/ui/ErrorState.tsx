import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface ErrorStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title,
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-danger-surface bg-danger-surface/40 px-6 py-10 text-center",
        className,
      )}
    >
      <p className="text-lg font-semibold text-danger">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-foreground/70">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
