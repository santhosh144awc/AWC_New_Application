import { test, expect } from '@playwright/test';

test.describe('Phase 17 — Retirement Planning GATE-A Preview & Claim Audit', () => {
  const retirementRoutes = [
    {
      path: '/plan/retirement/',
      titleRegex: /Retirement Wealth Accumulation Roadmap/i,
      expectedH1: 'Retirement Wealth Accumulation Roadmap',
      screenshotName: 'plan-retirement',
    },
    {
      path: '/plan/retirement-income/',
      titleRegex: /Retirement Distribution & Three-Bucket Cash Flow/i,
      expectedH1: 'Retirement Distribution & Three-Bucket Cash Flow',
      screenshotName: 'plan-retirement-income',
    },
    {
      path: '/tools/swp/',
      titleRegex: /Systematic Withdrawal Plan/i,
      expectedH1: 'Systematic Withdrawal Plan (SWP) Simulator',
      screenshotName: 'tools-swp',
    },
  ];

  for (const route of retirementRoutes) {
    test(`1. Route ${route.path} loads with single H1, valid title, and active interactive calculator`, async ({ page }) => {
      await page.goto(route.path);

      // Verify title & H1
      await expect(page).toHaveTitle(route.titleRegex);
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText(route.expectedH1);

      // Verify status badge confirms active state
      const badge = page.locator('.intro-status-badge');
      await expect(badge).toBeVisible();
      await expect(badge).toHaveText(/Interactive Planner Active|Interactive Calculator Active/);

      // Verify interactive calculator island is mounted and rendered
      await expect(page.locator('astro-island')).toHaveCount(1);
      await expect(page.locator('input[type="range"], input[type="number"]').first()).toBeVisible();
    });

    test(`2. Route ${route.path} contains zero unverified guarantee-like claims or outcome promises`, async ({ page }) => {
      await page.goto(route.path);
      const bodyText = await page.locator('body').innerText();

      // Explicit forbidden phrases
      expect(bodyText).not.toContain('100% Market-Crash Immunity');
      expect(bodyText).not.toContain('will likely live to age 85 or 90');
      expect(bodyText).not.toContain('10%–14% annually');
      expect(bodyText).not.toContain('without triggering heavy capital losses');
      expect(bodyText).not.toContain('ensuring your purchasing power does not degrade');
      expect(bodyText).not.toContain('cash flow for life');
      expect(bodyText).not.toContain('allows the portfolio to sustain inflation and last 25 to 30+ years');
    });
  }

  test('3. Responsive viewports and visual inspection screenshots for retirement preview pages', async ({ page }) => {
    for (const route of retirementRoutes) {
      await page.goto(route.path);

      // Desktop Screenshot (1440px)
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({
        path: `tests/e2e/screenshots/desktop-${route.screenshotName}.png`,
        fullPage: true,
      });

      // Mobile Viewport (390px) & Check Overflow
      await page.setViewportSize({ width: 390, height: 844 });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      await page.screenshot({
        path: `tests/e2e/screenshots/mobile-${route.screenshotName}.png`,
        fullPage: true,
      });
    }
  });
});
