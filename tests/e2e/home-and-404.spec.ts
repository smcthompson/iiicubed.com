import { test, expect, Response } from '@playwright/test';

test(
  'Home Page',
  {
    tag: ['@[23]', '@e2e'],
  },
  async ({ page }) => {
    await test.step('Given the home page route is available', async () => {
      await page.goto('/');
    });

    await test.step('When the page content is rendered', async () => {
      await expect(page).toHaveURL(/\/$/);
    });

    await test.step('Then the QA dashboard heading is visible', async () => {
      await expect(
        page.getByRole('heading', { name: /qa dashboard/i }),
      ).toBeVisible();
    });

    await test.step('And the Load Build Status button is visible', async () => {
      await expect(
        page.getByRole('button', { name: 'Load Build Status' }),
      ).toBeVisible();
    });
  },
);

test(
  'Unknown Route Returns 404',
  {
    tag: ['@[24]', '@e2e'],
  },
  async ({ page }) => {
    const missingRoute = '/does-not-exist';
    let response: Response | null = null;

    await test.step('Given an unknown route path', async () => {
      expect(missingRoute).toBe('/does-not-exist');
    });

    await test.step('When the unknown route is requested', async () => {
      response = await page.goto(missingRoute);
    });

    await test.step('Then the server responds with HTTP 404', async () => {
      expect(response).not.toBeNull();
      expect(response?.status()).toBe(404);
    });

    await test.step('And the response body includes the missing route message', async () => {
      await expect(page.locator('body')).toContainText(
        `Cannot GET ${missingRoute}`,
      );
    });
  },
);
