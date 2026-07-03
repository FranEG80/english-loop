import {
  BarChart3,
  BookOpen,
  Dumbbell,
  Home,
  LayoutDashboard,
  RotateCcw,
  Settings,
} from "lucide-react";
import type { ComponentType } from "react";
import type { Dictionary } from "@/shared/i18n";

export type WorkspaceNavKey =
  | "home"
  | "lessons"
  | "activities"
  | "review"
  | "dashboard"
  | "progress"
  | "settings";

export interface WorkspaceNavItem {
  href: string;
  labelKey: WorkspaceNavKey;
  Icon: ComponentType<{ className?: string }>;
}

export const WORKSPACE_NAV_ITEMS: WorkspaceNavItem[] = [
  { href: "/", labelKey: "dashboard", Icon: LayoutDashboard },
  { href: "/lessons", labelKey: "lessons", Icon: BookOpen },
  { href: "/activities", labelKey: "activities", Icon: Dumbbell },
  { href: "/review", labelKey: "review", Icon: RotateCcw },
//   { href: "/dashboard", labelKey: "dashboard", Icon: LayoutDashboard },
  { href: "/progress", labelKey: "progress", Icon: BarChart3 },
  { href: "/settings", labelKey: "settings", Icon: Settings },
];

export function navLabel(dictionary: Dictionary, key: WorkspaceNavKey): string {
  return dictionary.nav[key];
}
