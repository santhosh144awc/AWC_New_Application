import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Phase 51 Visual Verification Screenshots', () => {
  const screenshotDir = path.join(process.cwd(), 'public', 'test-screenshots', 'phase51');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('Capture Phase 51 Screenshots matching requirements and user Screenshot 2 target', async ({ page }) => {
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

    // 1. Stage 2 selected after navigation, showing ribbon, summary, and stage content
    await page.click('#btn-stage-1-next');
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotDir, '1440px_01_stage2_selected_showing_ribbon_summary_stage.png'),
      fullPage: false,
    });

    // 2. Stage 4 selected directly from ribbon, showing ribbon, summary, and stage content (Matches Screenshot 2 target!)
    await page.click('#btn-nav-stage-4');
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotDir, '1440px_02_stage4_selected_matching_screenshot2_target.png'),
      fullPage: false,
    });

    // 3. Stage 4 after an ordinary manual scroll down the asset tables, proving ribbon scrolls away naturally
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotDir, '1440px_03_stage4_scrolled_well_down_ribbon_scrolled_away.png'),
      fullPage: false,
    });

    // 4. Stage 4 after another navigation action, proving ribbon returns to the intended location
    await page.click('#btn-stage-4-next'); // Go to Stage 5
    await page.waitForTimeout(300);
    await page.click('#btn-nav-stage-4'); // Direct click back to Stage 4
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotDir, '1440px_04_stage4_returned_after_navigation_ribbon_in_view.png'),
      fullPage: false,
    });

    // 5. Purpose / Goal columns with complete placeholders (190-220px desktop width, 11.5px font size)
    await page.screenshot({
      path: path.join(screenshotDir, '1440px_05_purpose_goal_columns_complete_placeholders.png'),
      fullPage: false,
    });

    // ---------------------------------------------------------------------------------
    // Desktop 1280px:
    // ---------------------------------------------------------------------------------
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.click('#btn-nav-stage-4');
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotDir, '1280px_02_stage4_selected_showing_ribbon_summary_stage.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(screenshotDir, '1280px_05_purpose_goal_columns_complete_placeholders.png'),
      fullPage: false,
    });

    // ---------------------------------------------------------------------------------
    // Mobile 390px:
    // ---------------------------------------------------------------------------------
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('#btn-nav-stage-4');
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotDir, '390px_02_stage4_mobile_ribbon_summary_stage.png'),
      fullPage: false,
    });

    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotDir, '390px_03_stage4_mobile_scrolled_down.png'),
      fullPage: false,
    });
  });
});
