import { expect, test } from "@playwright/test";

const publicReads = [
  ["/api/v1/health", [200]],
  ["/api/v1/ready", [200, 503]],
  ["/api/v1/lessons", [200]],
  ["/api/v1/lessons/lesson-1", [200, 404]],
  ["/api/v1/activities", [200]],
  ["/api/v1/activities/activity-1", [200, 404]],
  ["/api/v1/practice-taxonomy", [200]],
  ["/api/v1/practice-taxonomy/grammar/availability", [200, 404]],
] as const;

const protectedReads = [
  "/api/v1/progress/overview",
  "/api/v1/review-queue",
  "/api/v1/progress/taxonomy/grammar",
  "/api/v1/progress/activities/activity-1/history",
  "/api/v1/dashboard",
  "/api/v1/me/settings",
  "/api/v1/me/saved-lessons",
  "/api/v1/daily-sessions/current",
  "/api/v1/practice-runs/run-1",
  "/api/v1/practice-runs/run-1/summary",
] as const;

for (const [path, statuses] of publicReads) {
  test(`public route is reachable: GET ${path}`, async ({ request }) => {
    const response = await request.get(path);
    expect(statuses).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });
}

for (const path of protectedReads) {
  test(`protected route enforces authentication: GET ${path}`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(401);
  });
}

const protectedCommands = [
  ["POST", "/api/v1/practice-runs"],
  ["POST", "/api/v1/daily-sessions/session-1/practice"],
  ["POST", "/api/v1/daily-sessions/session-1/attempts"],
  ["POST", "/api/v1/daily-sessions/session-1/complete"],
  ["POST", "/api/v1/daily-sessions/session-1/lessons/lesson-1/complete"],
  ["POST", "/api/v1/daily-sessions/session-1/lessons/lesson-1/skip"],
  ["POST", "/api/v1/practice-runs/run-1/attempts"],
  ["POST", "/api/v1/practice-runs/run-1/complete"],
  ["POST", "/api/v1/me/saved-lessons/lesson-1"],
  ["DELETE", "/api/v1/me/saved-lessons/lesson-1"],
  ["PATCH", "/api/v1/me/settings"],
  ["PUT", "/api/v1/daily-sessions/current"],
] as const;

for (const [method, path] of protectedCommands) {
  test(`protected route enforces authentication: ${method} ${path}`, async ({ request }) => {
    const response = await request.fetch(path, {
      method,
      data: method === "DELETE" ? undefined : {},
    });
    expect(response.status()).toBe(401);
  });
}
