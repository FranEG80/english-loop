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

  const updatedProfile = await request.post("/api/auth/update-user", {
    headers: { cookie, origin: "http://localhost:3000" },
    data: { name: "Updated E2E User" },
  });
  expect(updatedProfile.status()).toBe(200);
  await expect(updatedProfile.json()).resolves.toMatchObject({ status: true });
  await expect(
    request.get("/api/auth/get-session", { headers: { cookie } }).then((response) => response.json()),
  ).resolves.toMatchObject({ user: { name: "Updated E2E User", email } });

  const newPassword = "New-e2e-password-123!";
  const changedPassword = await request.post("/api/auth/change-password", {
    headers: { cookie, origin: "http://localhost:3000" },
    data: { currentPassword: password, newPassword, revokeOtherSessions: true },
  });
  expect(changedPassword.status()).toBe(200);
  cookie = cookieHeader(changedPassword) || cookie;

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

  const oldPasswordSignIn = await request.post("/api/auth/sign-in/email", {
    data: { email, password },
  });
  expect(oldPasswordSignIn.status()).not.toBe(200);

  const signIn = await request.post("/api/auth/sign-in/email", {
    data: { email, password: newPassword },
  });
  expect(signIn.status()).toBe(200);
  await expect(signIn.json()).resolves.toMatchObject({ user: { email } });
  cookie = cookieHeader(signIn);
  expect(cookie).not.toBe("");
  expect((await request.get("/api/v1/progress/overview", { headers: { cookie } })).status()).toBe(200);
});

test("registers from the UI and renders the persisted user instead of the demo", async ({ page }) => {
  const email = `ui-e2e-${Date.now()}@example.com`;
  const name = "UI E2E User";

  await page.goto("/register");
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill("Ui-e2e-password-123!");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(`¡Hola, ${name}!`)).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText("Alex", { exact: true })).toHaveCount(0);

  const session = await page.evaluate(async () => {
    const response = await fetch("/api/auth/get-session");
    return response.json();
  });
  expect(session).toMatchObject({ user: { name, email } });
});
