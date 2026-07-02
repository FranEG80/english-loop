"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "./actions";

export function LogoutButton({
  label,
  theme = "light",
  compact = false,
}: {
  label: string;
  theme?: "light" | "dark";
  compact?: boolean;
}) {
  return (
    <form
      action={logoutAction}
      className={compact ? "grid h-11 w-11 shrink-0 place-items-center" : undefined}
    >
      <button
        type="submit"
        aria-label={label}
        title={label}
        className={`rounded-control text-sm font-bold transition-colors ${
          compact ? "grid h-11 w-11 shrink-0 place-items-center p-0" : "px-3 py-2"
        } ${
          theme === "dark"
            ? "text-white/65 hover:bg-white/10 hover:text-white"
            : "text-foreground/70 hover:bg-surface hover:text-foreground"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {compact ? null : label}
        </span>
      </button>
    </form>
  );
}
