import { test, expect } from '@playwright/test';

test(
  'Build Status Page',
  {
    tag: ['@[22]', '@e2e'],
  },
  async ({ page }) => {
    await test.step('Given the build status page route is available', async () => {
      await page.goto('/build-status');
    });

    await test.step('When the page finishes loading', async () => {
      await expect(page).toHaveURL(/\/build-status$/);
    });

    await test.step('Then a heading is visible on the page', async () => {
      await expect(page.getByRole('heading')).toBeVisible();
    });
  },
);
