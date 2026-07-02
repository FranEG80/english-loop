"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";

export type MascotPose =
  | "wave"
  | "reading"
  | "thinking"
  | "celebrate"
  | "review"
  | "rest";

const POSE_SRC: Record<MascotPose, string> = {
  wave: "/mascot/loopy-wave.webp",
  reading: "/mascot/loopy-reading.webp",
  thinking: "/mascot/loopy-thinking.webp",
  celebrate: "/mascot/loopy-celebrate.webp",
  review: "/mascot/loopy-review.webp",
  rest: "/mascot/loopy-rest.webp",
};

export interface MascotProps {
  pose: MascotPose;
  size?: number;
  priority?: boolean;
  className?: string;
}

/**
 * Loopy, la mascota de EnglishLoop. Es decorativa (aria-hidden). Si el
 * asset falla al cargar, se mantiene un fallback puramente CSS (el círculo
 * degradado de fondo) en vez de un icono roto.
 */
export function Mascot({ pose, size = 120, priority, className }: MascotProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "from-level-b1 to-accent/20",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {!failed ? (
        <Image
          src={POSE_SRC[pose]}
          alt=""
          fill
          sizes={`${size}px`}
          priority={priority}
          className="object-contain motion-safe:transition-transform motion-safe:duration-300"
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}
