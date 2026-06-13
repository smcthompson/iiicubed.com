import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  reporter: [
    ['line'],
    ['junit', {
      outputFile: 'test-results/playwright-junit.xml'
    }],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never'
    }]
  ],

  use: {
    baseURL: 'http://localhost:3000'
  }
});
