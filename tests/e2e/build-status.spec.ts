import { test, expect } from '@playwright/test';

test('Build Status Page @e2e @[18]', async ({ page }) => {
  await page.goto('/build-status');

  await expect(
    page.getByRole('heading')
  ).toBeVisible();
});
