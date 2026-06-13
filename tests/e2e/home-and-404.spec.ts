import { test, expect } from '@playwright/test';

test('Home Page @e2e @[19]', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /qa dashboard/i })
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: 'Load Build Status' })
  ).toBeVisible();
});

test('Unknown Route Returns 404 @e2e @[20]', async ({ page }) => {
  const missingRoute = '/does-not-exist';
  const response = await page.goto(missingRoute);

  expect(response).not.toBeNull();
  expect(response?.status()).toBe(404);

  await expect(page.locator('body')).toContainText(`Cannot GET ${missingRoute}`);
});
