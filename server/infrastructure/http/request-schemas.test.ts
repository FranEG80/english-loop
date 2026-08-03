// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ValidationException } from "@/core/shared/exceptions";
import { attemptBodySchema, createPracticeRunBodySchema, dailySessionBodySchema, parseRequest, settingsPatchSchema } from "./request-schemas";

describe("HTTP request schemas", () => {
  it("accepts all supported attempt response discriminants", () => {
    const responses = [{ kind: "boolean", value: true }, { kind: "boolean_list", value: [true, false] }, { kind: "single", value: "a" }, { kind: "multiple", value: ["a"] }, { kind: "text", value: "answer" }, { kind: "ordered_list", value: ["a"] }, { kind: "pairs", value: [{ leftId: "l", rightId: "r" }] }] as const;
    for (const response of responses) expect(parseRequest(attemptBodySchema.safeParse({ activityId: "a", idempotencyKey: "key", response })).response.kind).toBe(response.kind);
  });

  it("validates run, settings and default daily payloads", () => {
    expect(parseRequest(createPracticeRunBodySchema.safeParse({ taxonomyNodeId: "topic", level: "B1", sessionSize: 5 }))).toEqual({ taxonomyNodeId: "topic", level: "B1", sessionSize: 5 });
    expect(parseRequest(dailySessionBodySchema.safeParse(undefined))).toEqual({});
    expect(parseRequest(settingsPatchSchema.safeParse({ locale: "en", activeLevels: ["B2"], dailyGoalActivities: 20 }))).toMatchObject({ locale: "en" });
  });

  it("returns field errors and rejects extra/invalid fields", () => {
    expect(() => parseRequest(attemptBodySchema.safeParse({}))).toThrow(ValidationException);
    expect(() => parseRequest(settingsPatchSchema.safeParse({ unknown: true }))).toThrow(ValidationException);
    expect(() => parseRequest(createPracticeRunBodySchema.safeParse({ taxonomyNodeId: "", level: "C1", sessionSize: 3 }))).toThrow(ValidationException);
  });
});
