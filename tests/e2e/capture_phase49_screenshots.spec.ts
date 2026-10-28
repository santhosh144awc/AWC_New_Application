import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Phase 49 Visual Verification Screenshots', () => {
  const screenshotDir = path.join(process.cwd(), 'test-results', 'test-screenshots', 'phase49');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('Capture Phase 49 Screenshots at 1440px, 1280px, and 390px', async ({ page }) => {
    // -------------------------------------------------------------
    // 1. Desktop 1440px: Stage 2 Option 1 (Consolidated Total)
    // -------------------------------------------------------------
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/health-check/real-statement/');
    await page.waitForSelector('.pfs-meta-section');

    // Fill Client Name
    await page.locator('input[placeholder="e.g. Ramesh & Priya Sundaram"]').fill('Ramesh & Priya Sundaram');
    await page.locator('input[placeholder="e.g. Priya"]').fill('Priya');
    await page.locator('input[placeholder="e.g. Ananya, Aarav"]').fill('Ananya, Aarav');

    // Navigate to Stage 2
    await page.click('#btn-stage-1-next');
    await page.waitForTimeout(300);

    // Select Option 1 Consolidated Mode
    await page.click('#btn-consolidated-expenses');
    await page.locator('#input-consolidated-monthly-expense').fill('95000');
    await page.waitForTimeout(200);

    await page.screenshot({
      path: path.join(screenshotDir, 'desktop-1440px-stage2-option1-consolidated.png'),
      fullPage: false,
    });

    // -------------------------------------------------------------
    // 2. Desktop 1440px: Stage 2 Option 2 (Category Breakdown)
    // -------------------------------------------------------------
    await page.click('#btn-category-expenses');
    await page.waitForTimeout(200);

    await page.screenshot({
      path: path.join(screenshotDir, 'desktop-1440px-stage2-option2-breakdown.png'),
      fullPage: false,
    });

    // -------------------------------------------------------------
    // 3. Desktop 1440px: Stage 3 (Savings & Surplus after Transition)
    // -------------------------------------------------------------
    await page.click('#btn-stage-2-next');
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(screenshotDir, 'desktop-1440px-stage3-savings-surplus.png'),
      fullPage: false,
    });

    // -------------------------------------------------------------
    // 4. Desktop 1440px: Stage 4 (Assets with Purpose/Goal Guidance)
    // -------------------------------------------------------------
    await page.click('#btn-stage-3-next');
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(screenshotDir, 'desktop-1440px-stage4-asset-purpose-guidance.png'),
      fullPage: false,
    });

    // -------------------------------------------------------------
    // 5. Desktop 1440px: Stage 5 (Liabilities)
    // -------------------------------------------------------------
    await page.click('#btn-stage-4-next');
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(screenshotDir, 'desktop-1440px-stage5-liabilities.png'),
      fullPage: false,
    });

    // -------------------------------------------------------------
    // 6. Desktop 1440px: Stage 6 (Net Worth & Review)
    // -------------------------------------------------------------
    await page.click('#btn-stage-5-next');
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(screenshotDir, 'desktop-1440px-stage6-net-worth-review.png'),
      fullPage: false,
    });

    // -------------------------------------------------------------
    // 7. Desktop 1280px: Stage 2 Option 1 & Option 2
    // -------------------------------------------------------------
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.click('#btn-nav-stage-2');
    await page.waitForTimeout(400);

    await page.click('#btn-consolidated-expenses');
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotDir, 'desktop-1280px-stage2-option1-consolidated.png'),
      fullPage: false,
    });

    await page.click('#btn-category-expenses');
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotDir, 'desktop-1280px-stage2-option2-breakdown.png'),
      fullPage: false,
    });

    // -------------------------------------------------------------
    // 8. Mobile 390px: Stage 2 Option 1 & Option 2
    // -------------------------------------------------------------
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('#btn-consolidated-expenses');
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-390px-stage2-option1-consolidated.png'),
      fullPage: false,
    });

    await page.click('#btn-category-expenses');
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-390px-stage2-option2-breakdown.png'),
      fullPage: false,
    });
  });
});
