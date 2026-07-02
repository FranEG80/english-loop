import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type BadgeTone = "neutral" | "b1" | "b2" | "success" | "danger" | "accent";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Icono decorativo opcional: el tono nunca es el único indicador de estado. */
  icon?: ReactNode;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-foreground",
  b1: "bg-level-b1 text-level-b1-strong",
  b2: "bg-level-b2 text-level-b2-strong",
  success: "bg-success-surface text-success",
  danger: "bg-danger-surface text-danger",
  accent: "bg-accent/10 text-primary-dark",
};

export function Badge({
  tone = "neutral",
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
