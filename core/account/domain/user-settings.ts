import type { Locale } from "@/core/models/locale";
import type { CefrLevel } from "@/core/models/level";
import { InvariantViolationException } from "@/core/shared/exceptions";

/** Zonas horarias IANA soportadas (subconjunto inicial). */
export const SUPPORTED_TIMEZONES = [
  "UTC",
  "Europe/Madrid",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Buenos_Aires",
] as const;

export type SupportedTimezone = (typeof SUPPORTED_TIMEZONES)[number];

export interface UserSettingsProps {
  userId: string;
  locale: Locale;
  activeLevels: CefrLevel[];
  dailyGoalLessons: number;
  dailyGoalActivities: number;
  timezone: string;
  reducedMotion: boolean;
}

export const DEFAULT_DAILY_GOAL_LESSONS = 1;
export const DEFAULT_DAILY_GOAL_ACTIVITIES = 10;

export function isSupportedTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

/** Settings de usuario con validación de invariantes. */
export class UserSettings {
  private constructor(private readonly props: UserSettingsProps) {}

  static create(props: UserSettingsProps): UserSettings {
    if (props.activeLevels.length === 0) {
      throw new InvariantViolationException(
        "At least one active level is required",
        "You need at least one active level.",
      );
    }
    if (props.activeLevels.some((level) => level !== "B1" && level !== "B2")) {
      throw new InvariantViolationException(
        "Active levels are invalid",
        "Choose B1, B2 or both levels.",
      );
    }
    if (!Number.isInteger(props.dailyGoalLessons) || !Number.isInteger(props.dailyGoalActivities)) {
      throw new InvariantViolationException(
        "Daily goals must be integers",
        "Daily goals must be whole numbers.",
      );
    }
    if (props.dailyGoalLessons < 0 || props.dailyGoalActivities < 0) {
      throw new InvariantViolationException(
        "Daily goals cannot be negative",
        "Daily goals cannot be negative.",
      );
    }
    if (!isSupportedTimezone(props.timezone)) {
      throw new InvariantViolationException(
        `Unsupported timezone: ${props.timezone}`,
        "The selected timezone is not supported.",
      );
    }
    return new UserSettings({ ...props });
  }

  static defaults(userId: string): UserSettings {
    return new UserSettings({
      userId,
      locale: "es",
      activeLevels: ["B1"],
      dailyGoalLessons: DEFAULT_DAILY_GOAL_LESSONS,
      dailyGoalActivities: DEFAULT_DAILY_GOAL_ACTIVITIES,
      timezone: "UTC",
      reducedMotion: false,
    });
  }

  get userId(): string {
    return this.props.userId;
  }

  get locale(): Locale {
    return this.props.locale;
  }

  get activeLevels(): CefrLevel[] {
    return [...this.props.activeLevels];
  }

  get dailyGoalLessons(): number {
    return this.props.dailyGoalLessons;
  }

  get dailyGoalActivities(): number {
    return this.props.dailyGoalActivities;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  get reducedMotion(): boolean {
    return this.props.reducedMotion;
  }

  update(patch: Partial<Omit<UserSettingsProps, "userId">>): UserSettings {
    return UserSettings.create({ ...this.props, ...patch });
  }

  toDto(): UserSettingsProps {
    return { ...this.props, activeLevels: [...this.props.activeLevels] };
  }
}
