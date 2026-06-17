import { test, expect } from '@playwright/test';

  await page.goto('/build-status');
test('Build Status Page', {
  tag: [
    '@[22]',
    '@e2e'],
  }, async ({ page }) => {

  await expect(
    page.getByRole('heading')
  ).toBeVisible();
});
