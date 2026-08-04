import { expect, test } from "@playwright/test";

function cookieHeader(response: { headers(): Record<string, string> }): string {
  const setCookie = response.headers()["set-cookie"] ?? "";
  return setCookie
    .split(/,(?=[^;]+=)/)
    .map((cookie) => cookie.split(";", 1)[0])
    .filter(Boolean)
    .join("; ");
}

test("registers, keeps an authenticated session, logs out and logs in again", async ({ request }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = "E2e-password-123!";

  const signUp = await request.post("/api/auth/sign-up/email", {
    data: { name: "E2E User", email, password },
  });
  expect([200, 201]).toContain(signUp.status());
  await expect(signUp.json()).resolves.toMatchObject({
    user: { email, name: "E2E User" },
  });
  let cookie = cookieHeader(signUp);
  expect(cookie).not.toBe("");

  expect((await request.get("/api/v1/progress/overview", { headers: { cookie } })).status()).toBe(200);
  expect((await request.get("/api/v1/me/settings", { headers: { cookie } })).status()).toBe(200);

  const signOut = await request.post("/api/auth/sign-out", {
    headers: {
      cookie,
      "content-type": "application/json",
      origin: "http://localhost:3000",
    },
    data: {},
  });
  expect([200, 204]).toContain(signOut.status());
  expect((await request.get("/api/v1/progress/overview", { headers: { cookie } })).status()).toBe(401);

  const signIn = await request.post("/api/auth/sign-in/email", {
    data: { email, password },
  });
  expect(signIn.status()).toBe(200);
  await expect(signIn.json()).resolves.toMatchObject({ user: { email } });
  cookie = cookieHeader(signIn);
  expect(cookie).not.toBe("");
  expect((await request.get("/api/v1/progress/overview", { headers: { cookie } })).status()).toBe(200);
});
