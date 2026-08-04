import { defineConfig, devices } from "@playwright/test";

const browser = process.env.E2E_BROWSER ?? "chromium";
const port = process.env.E2E_PORT ?? "3000";
const baseURL = `http://localhost:${port}`;
const reuseExistingServer = process.env.E2E_REUSE_EXISTING_SERVER === undefined
  ? !process.env.CI
  : process.env.E2E_REUSE_EXISTING_SERVER === "true";
const browserProjects = {
  chromium: devices["Desktop Chrome"],
  firefox: devices["Desktop Firefox"],
  webkit: devices["Desktop Safari"],
} as const;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["dot"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: browser,
      use: browserProjects[browser as keyof typeof browserProjects] ?? devices["Desktop Chrome"],
    },
  ],
  webServer: {
    command: `pnpm build:test && pnpm start -H 127.0.0.1 -p ${port}`,
    url: `http://127.0.0.1:${port}/api/v1/health`,
    reuseExistingServer,
    timeout: 120_000,
  },
});
