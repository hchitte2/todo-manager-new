import path from "node:path";

import { defineConfig } from "@playwright/test";

const e2eDatabasePath = path.join(__dirname, ".playwright", "e2e.sqlite");

export default defineConfig({
  reporter: [["html", { outputFolder: "my-report" }]],
  testDir: path.join(__dirname, "e2e"),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: `SQLITE_DB_PATH="${e2eDatabasePath}" FRONTEND_ORIGIN="http://localhost:5173" npm run start`,
      url: "http://localhost:3002",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command:
        'VITE_API_BASE_URL="http://localhost:3002" npm run dev:frontend -- --host localhost --port 5173',
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        headless: true,
      },
    },
  ],
});
