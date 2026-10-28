import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Capture Phase 46 visual screenshots', async ({ page }) => {
  const screenshotsDir = path.resolve('test-results/test-screenshots/phase46');

  // 1. Stage 1 on desktop at 1440px
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/health-check/real-statement/');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, '01_stage1_desktop_1440px.png'), fullPage: false });

  // 2. Stage 1 on desktop at 1280px (focus on stepper single-line and metadata)
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, '02_stage1_desktop_1280px.png'), fullPage: false });

  // 3. Stage 1 on mobile at 390px
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, '03_stage1_mobile_390px.png'), fullPage: false });

  // Reset to desktop for navigation tests
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/health-check/real-statement/');
  await page.waitForTimeout(300);

  // 4. Stage 2 after clicking Continue
  await page.click('#btn-stage-1-next');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(screenshotsDir, '04_stage2_after_continue.png'), fullPage: false });

  // 5. Stage 1 after clicking Back from Stage 2
  const backBtn = page.locator('#pane-stage-2 .pfs-stage-footer-actions button').first();
  await backBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(screenshotsDir, '05_stage1_after_back.png'), fullPage: false });

  // 6. Stage 6 on desktop to verify complete stepper & actions
  await page.click('#btn-nav-stage-6');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(screenshotsDir, '06_stage6_stepper_and_review.png'), fullPage: false });

  // 7. Statement Preview modal
  await page.click('#btn-preview-statement');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(screenshotsDir, '07_statement_preview_modal.png'), fullPage: false });
});
