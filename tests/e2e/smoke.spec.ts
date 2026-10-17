import { test, expect } from '@playwright/test';

test.describe('Application Shell Smoke Tests', () => {
  test('homepage shell loads with correct title and no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto('/');

    // Verify title
    await expect(page).toHaveTitle(/Ant Wealth Creation/);

    // Verify main landmark
    const mainLandmark = page.locator('#main-content');
    await expect(mainLandmark).toBeVisible();

    // Verify foundation badge
    const badge = page.locator('.badge-foundation');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Phase 3: Clean Foundation Running Shell');

    // Verify statutory disclaimer notice in footer
    const statutoryNotice = page.locator('footer');
    await expect(statutoryNotice).toContainText('AMFI-Registered Mutual Fund Distributor');
    await expect(statutoryNotice).toContainText('ARN: 266896');

    // Confirm no uncaught browser runtime errors
    expect(consoleErrors).toEqual([]);
  });

  test('404 route renders brand-styled not found page', async ({ page }) => {
    await page.goto('/non-existent-page-test');
    await expect(page).toHaveTitle(/Page Not Found/);
    const returnLink = page.getByRole('link', { name: /Return to Homepage/i });
    await expect(returnLink).toBeVisible();
  });
});
