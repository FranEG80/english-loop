import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/shared/lib/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  illustrationSrc?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  illustrationSrc,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 py-12 text-center",
        className,
      )}
    >
      {illustrationSrc ? (
        <Image
          src={illustrationSrc}
          alt=""
          width={160}
          height={160}
          className="h-40 w-40 object-contain"
        />
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm text-foreground/70">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
