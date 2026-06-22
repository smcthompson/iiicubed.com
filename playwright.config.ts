import { defineConfig } from '@playwright/test';
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
  ],

  use: {
    baseURL: `http://localhost:${port}`,
  },
});
