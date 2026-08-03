import { defineConfig, devices } from "@playwright/test";

const browser = process.env.E2E_BROWSER ?? "chromium";
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
    baseURL: "http://127.0.0.1:3000",
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
    command: "pnpm build:test && pnpm start",
    url: "http://127.0.0.1:3000/api/v1/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
