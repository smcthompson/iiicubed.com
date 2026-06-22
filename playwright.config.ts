import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: './tests',

  reporter: [
    ['line'],
    [
      'junit',
      {
        outputFile: 'test-results/playwright-junit.xml',
      },
    ],
    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: 'never',
      },
    ],
    [
      'artifacts',
      [
        {
          name: 'screenshot',
          type: 'image/png',
        },
        {
          name: 'video',
          type: 'video/webm',
        },
      ],
    ],
  ],

  use: {
    baseURL: `http://localhost:${port}`,
    screenshot: 'on',
    video: 'on',
  },
});
