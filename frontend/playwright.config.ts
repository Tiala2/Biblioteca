import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.FRONT_BASE_URL ?? "http://localhost:5173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
});
