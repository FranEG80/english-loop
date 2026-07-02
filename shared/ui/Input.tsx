import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export function Input({
  id,
  label,
  hint,
  error,
  className,
  ...props
}: InputProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = cn(hintId, errorId) || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "h-12 rounded-control border-2 border-foreground/70 bg-surface px-4 text-base text-foreground shadow-[inset_0_2px_0_rgba(18,42,47,.05)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark",
          error && "border-danger",
          className,
        )}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {hint && !error ? (
        <p id={hintId} className="text-sm text-foreground/70">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
