import { expect, test, type APIRequestContext } from "@playwright/test";

function cookieHeader(response: { headers(): Record<string, string> }): string {
  const setCookie = response.headers()["set-cookie"] ?? "";
  return setCookie
    .split(/,(?=[^;]+=)/)
    .map((cookie) => cookie.split(";", 1)[0])
    .filter(Boolean)
    .join("; ");
}

async function finishRun(
  request: APIRequestContext,
  cookie: string,
  runId: string,
) {
  let feedback: Record<string, unknown> | null = null;
  for (let attemptNumber = 0; attemptNumber < 20; attemptNumber += 1) {
    const runResponse = await request.get(`/api/v1/practice-runs/${runId}`, { headers: { cookie } });
    expect(runResponse.status()).toBe(200);
    const run = await runResponse.json();
    if (run.status === "completed") return feedback;

    const response = await request.post(`/api/v1/practice-runs/${runId}/attempts`, {
      headers: { cookie },
      data: {
        activityId: run.activityIds[run.currentIndex],
        idempotencyKey: `e2e-${runId}-${attemptNumber}`,
        response: { kind: "single", value: "__e2e_wrong_answer__" },
      },
    });
    expect(response.status()).toBe(200);
    feedback = await response.json();
  }
  throw new Error(`Practice run ${runId} did not complete within the bounded test loop`);
}

test("runs the authenticated daily and focused learning journeys", async ({ request }) => {
  const email = `daily-e2e-${Date.now()}@example.com`;
  const password = "E2e-password-123!";
  const signUp = await request.post("/api/auth/sign-up/email", {
    data: { name: "Daily E2E User", email, password },
  });
  expect([200, 201]).toContain(signUp.status());
  const cookie = cookieHeader(signUp);
  expect(cookie).not.toBe("");

  const settings = await request.patch("/api/v1/me/settings", {
    headers: { cookie },
    data: { dailyGoalLessons: 2, dailyGoalActivities: 5, activeLevels: ["B1"] },
  });
  expect(settings.status()).toBe(200);

  const taxonomy = await request.get("/api/v1/practice-taxonomy");
  expect(taxonomy.status()).toBe(200);
  const taxonomyNodes = await taxonomy.json();
  expect(taxonomyNodes.map((node: { id: string }) => node.id)).toEqual(
    expect.arrayContaining(["grammar", "vocabulary", "phrasal-verbs"]),
  );
  for (const nodeId of ["grammar", "verb-tenses", "vocabulary", "phrasal-verbs"]) {
    const availability = await request.get(`/api/v1/practice-taxonomy/${nodeId}/availability?level=B1`);
    expect(availability.status()).toBe(200);
  }

  const daily = await request.put("/api/v1/daily-sessions/current", {
    headers: { cookie },
    data: { timezone: "UTC" },
  });
  expect(daily.status()).toBe(200);
  let session = await daily.json();
  expect(session.id).toBeTruthy();
  expect(session.recommendedLessonId).toBeTruthy();

  const completedLesson = await request.post(
    `/api/v1/daily-sessions/${session.id}/lessons/${session.recommendedLessonId}/complete`,
    { headers: { cookie } },
  );
  expect(completedLesson.status()).toBe(200);

  const nextDaily = await request.get("/api/v1/daily-sessions/current", { headers: { cookie } });
  expect(nextDaily.status()).toBe(200);
  session = await nextDaily.json();
  expect(session.recommendedLessonId).toBeTruthy();
  const skippedLesson = await request.post(
    `/api/v1/daily-sessions/${session.id}/lessons/${session.recommendedLessonId}/skip`,
    { headers: { cookie } },
  );
  expect(skippedLesson.status()).toBe(200);

  const dailyPractice = await request.post(`/api/v1/daily-sessions/${session.id}/practice`, { headers: { cookie } });
  expect(dailyPractice.status()).toBe(200);
  const dailyPracticeBody = await dailyPractice.json();
  expect(dailyPracticeBody.activityIds).toHaveLength(5);

  const dailySessionAfterStartResponse = await request.get("/api/v1/daily-sessions/current", { headers: { cookie } });
  expect(dailySessionAfterStartResponse.status()).toBe(200);
  const dailySessionAfterStart = await dailySessionAfterStartResponse.json();
  expect(dailySessionAfterStart.practiceRunId).toBeTruthy();
  const dailyFeedback = await finishRun(request, cookie, dailySessionAfterStart.practiceRunId);
  expect(dailyFeedback).toMatchObject({ isCorrect: false, normalizedResponse: { kind: "single" } });
  expect(dailyFeedback?.nextReviewAt).toBeTruthy();

  const dailySummary = await request.get(`/api/v1/practice-runs/${dailySessionAfterStart.practiceRunId}/summary`, { headers: { cookie } });
  expect(dailySummary.status()).toBe(200);
  await expect(dailySummary.json()).resolves.toMatchObject({ runId: dailySessionAfterStart.practiceRunId, incorrectCount: expect.any(Number) });

  const reviewQueue = await request.get("/api/v1/review-queue", { headers: { cookie } });
  expect(reviewQueue.status()).toBe(200);
  await expect(reviewQueue.json()).resolves.toMatchObject({ dueItems: expect.any(Array) });

  const focused = await request.post("/api/v1/practice-runs", {
    headers: { cookie },
    data: { taxonomyNodeId: "grammar", level: "B1", sessionSize: 5 },
  });
  expect(focused.status()).toBe(201);
  const focusedRun = await focused.json();
  expect(focusedRun.scope.taxonomyNodeId).toBe("grammar");
  await finishRun(request, cookie, focusedRun.id);
  const focusedSummary = await request.get(`/api/v1/practice-runs/${focusedRun.id}/summary`, { headers: { cookie } });
  expect(focusedSummary.status()).toBe(200);
  await expect(focusedSummary.json()).resolves.toMatchObject({ runId: focusedRun.id, scope: { taxonomyNodeId: "grammar" } });
});
