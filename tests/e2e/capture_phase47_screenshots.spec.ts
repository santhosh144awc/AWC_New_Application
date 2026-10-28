import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test('Capture Phase 47 visual screenshots', async ({ page }) => {
  const screenshotsDir = path.resolve('public/test-screenshots/phase47');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Stage 1 at desktop width 1440px
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/health-check/real-statement/');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, '01_stage1_desktop_1440px.png'), fullPage: false });

  // 2. Stage 1 at desktop width 1280px
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, '02_stage1_desktop_1280px.png'), fullPage: false });

  // 3. Stage 1 at mobile width 390px
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, '03_stage1_mobile_390px.png'), fullPage: false });

  // Back to desktop for interactive edits
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/health-check/real-statement/');
  await page.waitForTimeout(300);

  const firstRow = page.locator('#table-income tbody tr').nth(0);
  const monthlyInput = firstRow.locator('input[data-field="monthly-gross"]');
  const annualInput = firstRow.locator('input[data-field="annual-gross"]');

  // 4. A populated income row after editing Monthly Gross (₹50,000 -> Annual ₹6,00,000)
  await monthlyInput.fill('50000');
  await page.waitForTimeout(200);
  await firstRow.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(screenshotsDir, '04_income_row_after_monthly_edit.png'), fullPage: false });

  // 5. The same row after editing Annual Gross (₹12,00,000 -> Monthly ₹1,00,000)
  await annualInput.fill('1200000');
  await page.waitForTimeout(200);
  await firstRow.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(screenshotsDir, '05_income_row_after_annual_edit.png'), fullPage: false });

  // 6. Statement Preview with fixed preparer and DD-MM-YYYY date
  await page.click('#btn-load-sample');
  await page.waitForTimeout(200);
  await page.click('#btn-nav-stage-6');
  await page.waitForTimeout(300);
  await page.click('#btn-preview-statement');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(screenshotsDir, '06_statement_preview_dd_mm_yyyy.png'), fullPage: false });

  // 7. Download generated PDF and verify
  const downloadPromise = page.waitForEvent('download');
  await page.click('#btn-preview-download-pdf');
  const download = await downloadPromise;
  const pdfPath = path.join(screenshotsDir, '07_generated_statement.pdf');
  await download.saveAs(pdfPath);
  expect(fs.existsSync(pdfPath)).toBe(true);
});
