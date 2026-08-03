import { z } from "zod";
import { ValidationException } from "@/core/shared/exceptions";
import {
  MAX_DAILY_GOAL_ACTIVITIES,
  MAX_DAILY_GOAL_LESSONS,
} from "@/core/account/domain/user-settings";
import { ALLOWED_SESSION_SIZES, type SessionSize } from "@/core/models/session-size";

const sessionSizeSchema = z.custom<SessionSize>(
  (value) => typeof value === "number" && ALLOWED_SESSION_SIZES.includes(value as SessionSize),
  "Session size must be one of the supported values",
);

export const activityResponseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("boolean"), value: z.boolean() }),
  z.object({ kind: z.literal("boolean_list"), value: z.array(z.boolean()) }),
  z.object({ kind: z.literal("single"), value: z.string() }),
  z.object({ kind: z.literal("multiple"), value: z.array(z.string()) }),
  z.object({ kind: z.literal("text"), value: z.string() }),
  z.object({ kind: z.literal("ordered_list"), value: z.array(z.string()) }),
  z.object({
    kind: z.literal("pairs"),
    value: z.array(z.object({ leftId: z.string(), rightId: z.string() })),
  }),
]);

export const attemptBodySchema = z.object({
  activityId: z.string().min(1),
  idempotencyKey: z.string().min(1).max(200),
  response: activityResponseSchema,
}).strict();

export const createPracticeRunBodySchema = z.object({
  taxonomyNodeId: z.string().min(1),
  level: z.enum(["B1", "B2", "both"]),
  sessionSize: sessionSizeSchema,
}).strict();

export const dailySessionBodySchema = z.object({
  timezone: z.string().min(1).optional(),
}).strict().default({});

export const settingsPatchSchema = z.object({
  locale: z.enum(["es", "en"]).optional(),
  activeLevels: z.array(z.enum(["B1", "B2"])).min(1).optional(),
  dailyGoalLessons: z.number().int().min(1).max(MAX_DAILY_GOAL_LESSONS).optional(),
  dailyGoalActivities: z.number().int().min(1).max(MAX_DAILY_GOAL_ACTIVITIES).optional(),
  timezone: z.string().min(1).optional(),
  reducedMotion: z.boolean().optional(),
}).strict();

export const idSchema = z.string().min(1).max(200);

export function parseRequest<T>(
  result:
    | { success: true; data: T }
    | { success: false; error: z.ZodError },
): T {
  if (result.success) return result.data;
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".") || "body";
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }
  throw new ValidationException("Invalid request payload", fieldErrors);
}
