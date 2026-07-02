import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "editorial-card rounded-card p-6",
        className,
      )}
      {...props}
    />
  );
}
