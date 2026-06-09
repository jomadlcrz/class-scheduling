import { defineConfig, devices } from "@playwright/test";

/**
 * Runs the performance suite against the PRODUCTION build (minified + gzipped via
 * react-router-serve) so the numbers reflect what users actually download.
 * Build first with `npm run build`, then `npm run test:perf`.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
