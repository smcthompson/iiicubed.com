import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: './tests',

  workers: 1,
  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['line'],
    ['junit', {
      outputFile: 'test-results/playwright-junit.xml',
    }],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never',
    }],
    ['artifacts', [
      {
        name: 'screenshot',
        type: 'image/png',
      }, {
        name: 'video',
        type: 'video/webm',
      },
    ]],
  ],
  use: {
    baseURL: `http://localhost:${port}`,
    screenshot: 'on',
    trace: 'on-first-retry',
    video: 'on',
  },
  webServer: {
    command: 'npm run start:ci',
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      NODE_ENV: 'production',
      PORT: port.toString(),
    },
  },
});
