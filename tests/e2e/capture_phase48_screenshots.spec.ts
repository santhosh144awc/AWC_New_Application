import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const screenshotDir = path.resolve(process.cwd(), 'test-results/test-screenshots/phase48');

test.beforeAll(() => {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
});

test.describe('Phase 48 Screenshots Capture', () => {
  test('Capture 1440px desktop screenshots (Stage 1, Stage 3, Stage 6, and Scrolled Sticky Stepper)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/health-check/real-statement/');
    await page.waitForSelector('.pfs-meta-section');

    // 1. Initial view Stage 1
    await page.screenshot({
      path: path.join(screenshotDir, '1440px_stage1_overview.png'),
      fullPage: false,
    });

    // 2. Scroll down so sticky nav docks under site header
    const stepper = page.locator('.pfs-nav-stepper');
    const stepperBox = await stepper.boundingBox();
    if (stepperBox) {
      await page.evaluate((y) => window.scrollTo(0, y - 72 + 200), stepperBox.y);
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(screenshotDir, '1440px_stage1_scrolled_sticky_stepper.png'),
        fullPage: false,
      });
    }

    // 3. Move to Stage 3 (Savings & Surplus)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('#btn-nav-stage-3').click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(screenshotDir, '1440px_stage3_savings_surplus.png'),
      fullPage: false,
    });

    // 4. Move to Stage 6 (Net Worth & Review)
    await page.locator('#btn-nav-stage-6').click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(screenshotDir, '1440px_stage6_net_worth_review.png'),
      fullPage: false,
    });
  });

  test('Capture 1280px desktop screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/health-check/real-statement/');
    await page.waitForSelector('.pfs-meta-section');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(screenshotDir, '1280px_stage1_overview.png'),
      fullPage: false,
    });
  });

  test('Capture 390px mobile screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/health-check/real-statement/');
    await page.waitForSelector('.pfs-meta-section');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(screenshotDir, '390px_stage1_overview.png'),
      fullPage: false,
    });
  });
});
