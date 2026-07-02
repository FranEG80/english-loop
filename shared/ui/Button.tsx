import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "border-2 border-foreground bg-primary-dark text-white shadow-[3px_4px_0_var(--color-foreground)] hover:bg-primary hover:-translate-y-0.5",
  secondary:
    "border-2 border-foreground bg-surface text-primary-dark shadow-[3px_4px_0_var(--color-foreground)] hover:bg-white hover:-translate-y-0.5",
  ghost:
    "bg-transparent text-primary-dark hover:bg-surface focus-visible:outline-primary-dark",
  danger:
    "bg-danger text-white hover:brightness-110 focus-visible:outline-danger",
};

// Todas las alturas cumplen el tap target mínimo de 48px salvo "sm",
// reservado a contextos compactos (p. ej. controles secundarios en tarjetas).
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-10 px-3 text-sm",
  md: "h-12 px-5 text-base",
  lg: "h-14 px-6 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control font-bold transition-[transform,background-color,box-shadow]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
