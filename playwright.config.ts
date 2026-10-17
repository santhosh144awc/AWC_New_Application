import { defineConfig, devices } from '@playwright/test';

// Cross-platform preview command: uses npm.cmd on Windows, npm on Unix
const previewCommand = process.platform === 'win32'
  ? 'npm.cmd run preview -- --port 4399'
  : 'npm run preview -- --port 4399';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4399',
    trace: 'on-first-retry',
  },
  webServer: {
    command: previewCommand,
    url: 'http://localhost:4399',
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
