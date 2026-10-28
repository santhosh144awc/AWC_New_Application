import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Phase 50 Visual Verification Screenshots', () => {
  const screenshotDir = path.join(process.cwd(), 'public', 'test-screenshots', 'phase50');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('Capture Phase 50 Screenshots at 1440px, 1280px, and 390px', async ({ page }) => {
    // ---------------------------------------------------------------------------------
    // Desktop 1440px:
    // ---------------------------------------------------------------------------------
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/health-check/real-statement/');
    await page.waitForSelector('.pfs-meta-section');

    // Populate Client info
    await page.locator('input[placeholder="e.g. Ramesh & Priya Sundaram"]').fill('Ramesh & Priya Sundaram');
    await page.locator('input[placeholder="e.g. Priya"]').fill('Priya');
    await page.locator('input[placeholder="e.g. Ananya, Aarav"]').fill('Ananya, Aarav');

    // 1. Assets stage at the top of its input section
    await page.click('#btn-nav-stage-4');
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(screenshotDir, '1440px_01_assets_stage_top_input_section.png'),
      fullPage: false,
    });

    // 2. Assets stage after scrolling well down the page (shows ribbon scrolled out of view)
    await page.evaluate(() => window.scrollBy(0, 650));
    await page.waitForTimeout(200);

    await page.screenshot({
      path: path.join(screenshotDir, '1440px_02_assets_stage_scrolled_well_down.png'),
      fullPage: false,
    });

    // 3. Assets stage after scrolling back up (shows ribbon returned naturally)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    await page.screenshot({
      path: path.join(screenshotDir, '1440px_03_assets_stage_scrolled_back_up.png'),
      fullPage: false,
    });

    // 4. Expenses-to-Savings stage transition (lands cleanly at Stage 3 heading)
    await page.click('#btn-nav-stage-2');
    await page.waitForTimeout(300);
    await page.click('#btn-stage-2-next');
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(screenshotDir, '1440px_04_expenses_to_savings_transition.png'),
      fullPage: false,
    });

    // 5. Savings-to-Assets stage transition (lands cleanly at Stage 4 heading & first input table)
    await page.click('#btn-stage-3-next');
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(screenshotDir, '1440px_05_savings_to_assets_transition.png'),
      fullPage: false,
    });

    // 6. Asset-purpose columns showing complete placeholder examples (150-180px width)
    await page.screenshot({
      path: path.join(screenshotDir, '1440px_06_asset_purpose_columns_complete_placeholders.png'),
      fullPage: false,
    });

    // ---------------------------------------------------------------------------------
    // Desktop 1280px:
    // ---------------------------------------------------------------------------------
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.click('#btn-nav-stage-4');
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(screenshotDir, '1280px_06_asset_purpose_columns_complete_placeholders.png'),
      fullPage: false,
    });

    // ---------------------------------------------------------------------------------
    // Mobile 390px:
    // ---------------------------------------------------------------------------------
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('#btn-nav-stage-4');
    await page.waitForTimeout(400);

    // 7. Mobile asset rows
    await page.screenshot({
      path: path.join(screenshotDir, '390px_07_mobile_asset_rows.png'),
      fullPage: false,
    });

    // Mobile scrolled down
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(200);

    await page.screenshot({
      path: path.join(screenshotDir, '390px_02_mobile_assets_scrolled.png'),
      fullPage: false,
    });
  });
});
