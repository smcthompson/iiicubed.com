import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: './tests',

  workers: 1,
  retries: process.env.CI ? 2 : 0,

  reporter: [
    [
      './tests/reporters/ado-verification-reporter.ts',
      {
        enabled: process.env.ADO_VERIFICATION_REPORTER_ENABLED !== 'false',
        organizationUrl: process.env.ADO_ORG_URL,
        project: process.env.ADO_PROJECT,
        pat: process.env.ADO_PAT,
        accessToken: process.env.ADO_ACCESS_TOKEN,
        verificationWorkItemType: process.env.ADO_VERIFICATION_WIT ?? 'Verification',
        outcomeField: process.env.ADO_VERIFICATION_OUTCOME_FIELD,
        evidenceField: process.env.ADO_VERIFICATION_EVIDENCE_FIELD,
        evidencePath: process.env.ADO_VERIFICATION_EVIDENCE_PATH ?? 'playwright-report/index.html',
        parentRollupField: process.env.ADO_PARENT_ROLLUP_FIELD,
        updateState: process.env.ADO_VERIFICATION_UPDATE_STATE !== 'false',
        passState: process.env.ADO_VERIFICATION_PASS_STATE ?? 'Pass',
        failState: process.env.ADO_VERIFICATION_FAIL_STATE ?? 'Fail',
        pendingState: process.env.ADO_VERIFICATION_PENDING_STATE ?? 'Pending',
        apiVersion: process.env.ADO_API_VERSION ?? '7.1',
      },
    ],
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
