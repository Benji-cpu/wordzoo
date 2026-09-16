import { defineConfig, devices } from '@playwright/test';

// Smoke of the two flows that matter: the public demo and the learn loop.
// Runs against a dev server you already started on :8000 (it never starts one,
// so it cannot collide with a running session). Uses the installed Google
// Chrome (channel 'chrome'); set PW_CHROME to another Chromium binary if needed.
export default defineConfig({
  testDir: './tests/e2e',
  // A dev-server scene render is 2–15s a hop; the scene test makes ~30 hops.
  timeout: 300_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.PW_BASE_URL ?? 'http://localhost:8000',
    // A Chromium phone profile — iPhone profiles default to WebKit, which is
    // not installed here and not what the headless shell is.
    ...devices['Pixel 5'],
    browserName: 'chromium',
    // No bundled browser download on this machine (blocked); use the installed
    // Google Chrome unless PW_CHROME points at another binary.
    ...(process.env.PW_CHROME ? { launchOptions: { executablePath: process.env.PW_CHROME } } : { channel: 'chrome' }),
  },
});
