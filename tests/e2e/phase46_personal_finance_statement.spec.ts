import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Phase 46 — Personal Finance Statement Alignment, Stage Navigation & Form UX Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health-check/real-statement/');
  });

  test('1. Stepper navigation: All six stages render on a single horizontal line at 1200px and 1440px desktop', async ({ page }) => {
    for (const width of [1200, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(100);
      
      const stepButtons = page.locator('.pfs-step-btn');
      await expect(stepButtons).toHaveCount(6);

      const allBoxes = await Promise.all([0, 1, 2, 3, 4, 5].map(i => stepButtons.nth(i).boundingBox()));
      console.log(`ALL 6 BUTTON BOXES AT ${width}:`, allBoxes);
      const currentFirstY = allBoxes[0]!.y;

      for (let i = 1; i < 6; i++) {
        const box = allBoxes[i];
        expect(box).not.toBeNull();
        expect(Math.abs(box!.y - currentFirstY)).toBeLessThanOrEqual(5);
      }

      // Verify Stage 6 label is fully visible and not truncated or wrapped abnormally
      const stage6Btn = page.locator('#btn-nav-stage-6');
      await expect(stage6Btn).toBeVisible();
      await expect(stage6Btn).toContainText('Net Worth & Review');
    }
  });

  test('2. Statement metadata: Date defaults to today and is editable; Prepared By is fixed and not an editable input field', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // 1. Prepared By input field must NOT exist
    const preparedByInput = page.locator('input[id*="preparedBy"]');
    await expect(preparedByInput).toHaveCount(0);

    // 2. Statement date must default to current local date (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
    await expect(dateInput).toHaveValue(todayStr);

    // 3. Date can be edited
    await dateInput.fill('2026-12-31');
    await expect(dateInput).toHaveValue('2026-12-31');

    // 4. Reset restores today date and keeps preparer fixed
    await page.click('#btn-start-over');
    await page.click('#btn-confirm-reset');
    await expect(dateInput).toHaveValue(todayStr);
  });

  test('3. Income table: Entry Period is a compact select dropdown; Gross, Deductions, and Net Annual are vertically aligned', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // Verify Entry Period uses select dropdown
    const firstRow = page.locator('#table-income tbody tr').nth(0);
    const firstRowSelect = firstRow.locator('.pfs-table-select');
    await expect(firstRowSelect).toBeVisible();
    await expect(firstRowSelect).toHaveValue('MONTHLY');

    // Test monthly vs annual conversion
    const grossInput = firstRow.locator('input[data-field="gross-amount"]');
    const deductionsInput = firstRow.locator('input[data-field="deductions-amount"]');
    const netAnnualCell = firstRow.locator('td').nth(4);

    await grossInput.fill('100000'); // ₹1,00,000 / mo = ₹12,00,000 / yr
    await deductionsInput.fill('100000'); // ₹1,00,000 / yr deductions
    // Net annual = 12,00,000 - 1,00,000 = 11,00,000
    await expect(netAnnualCell).toContainText('11,00,000');

    // Switch to Annual via dropdown
    await firstRowSelect.selectOption('ANNUAL');
    // Entered gross amount converted to 12,00,000
    await expect(grossInput).toHaveValue('1200000');
    // Net annual remains 11,00,000
    await expect(netAnnualCell).toContainText('11,00,000');

    // Check vertical alignment: Gross and Deductions inputs have matching height and top offset
    const grossBox = await grossInput.boundingBox();
    const deductionsBox = await deductionsInput.boundingBox();
    const grossCellBox = await firstRow.locator('td').nth(2).boundingBox();
    const deductionsCellBox = await firstRow.locator('td').nth(3).boundingBox();
    console.log('CELL AND INPUT BOXES:', { grossBox, deductionsBox, grossCellBox, deductionsCellBox });
    expect(grossBox).not.toBeNull();
    expect(deductionsBox).not.toBeNull();
    expect(Math.abs(grossBox!.y - deductionsBox!.y)).toBeLessThanOrEqual(10);
    expect(Math.abs(grossBox!.height - deductionsBox!.height)).toBeLessThanOrEqual(2);
  });

  test('4. Stage navigation and scroll positioning: Stage transition scrolls canvas into view beneath header', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // Scroll down the page first to test scroll positioning
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(50);

    // Click Continue from Stage 1 -> moves to Stage 2
    await page.click('#btn-stage-1-next');
    await expect(page.locator('#pane-stage-2')).toBeVisible();
    await page.waitForTimeout(150);

    // Verify stage 2 is visible within viewport
    const stage2Pane = page.locator('#pane-stage-2');
    await expect(stage2Pane).toBeInViewport();

    // Click Back from Stage 2 -> returns to Stage 1
    const backBtn = page.locator('#pane-stage-2 .pfs-stage-footer-actions button').first();
    await backBtn.click();
    await expect(page.locator('#pane-stage-1')).toBeVisible();
    await page.waitForTimeout(150);

    const stage1Pane = page.locator('#pane-stage-1');
    await expect(stage1Pane).toBeInViewport();

    // Direct stepper tab selection
    await page.click('#btn-nav-stage-6');
    await expect(page.locator('#pane-stage-6')).toBeVisible();
    await page.waitForTimeout(150);
    const stage6Pane = page.locator('#pane-stage-6');
    await expect(stage6Pane).toBeInViewport();
  });

  test('5. Action button alignment: Stage 1 Continue is right-aligned; Stages 2-6 have Back on left, Continue on right', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // Stage 1
    const stage1Next = page.locator('#btn-stage-1-next');
    const stage1NextBox = await stage1Next.boundingBox();
    const canvasBox = await page.locator('.pfs-stage-canvas').boundingBox();
    expect(stage1NextBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();
    // Continue button right edge should be near canvas right edge
    const rightMargin = (canvasBox!.x + canvasBox!.width) - (stage1NextBox!.x + stage1NextBox!.width);
    expect(rightMargin).toBeLessThan(40);

    // Stage 2
    await page.click('#btn-stage-1-next');
    const stage2Back = page.locator('#pane-stage-2 .pfs-stage-footer-actions button').first();
    const stage2Next = page.locator('#btn-stage-2-next');
    const stage2BackBox = await stage2Back.boundingBox();
    const stage2NextBox = await stage2Next.boundingBox();
    expect(stage2BackBox!.x).toBeLessThan(stage2NextBox!.x);
  });

  test('6. PDF generation preserves fixed preparer "C. Santhosh Sathriyan" and dynamic date in statement preview', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // Load sample data
    await page.click('#btn-load-sample');

    // Go to Stage 6
    await page.click('#btn-nav-stage-6');
    await expect(page.locator('#pane-stage-6')).toBeVisible();

    // Open Preview Statement
    await page.click('#btn-preview-statement');
    await expect(page.locator('.pfs-preview-modal-box')).toBeVisible();

    // Verify fixed preparer name is present in preview
    const metaLine = page.locator('.pfs-preview-meta-line');
    await expect(metaLine).toContainText('C. Santhosh Sathriyan');

    // Test actual PDF download
    const downloadPromise = page.waitForEvent('download');
    await page.click('#btn-preview-download-pdf');
    const download = await downloadPromise;
    const downloadedPath = await download.path();
    expect(downloadedPath).toBeTruthy();
    if (downloadedPath) {
      const stats = fs.statSync(downloadedPath);
      expect(stats.size).toBeGreaterThan(1000);
    }
  });

  test('7. Responsive viewports: No horizontal page overflow at 1440px, 1280px, 1024px, and 390px', async ({ page }) => {
    for (const width of [1440, 1280, 1024, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 2); // 2px margin of safety
    }
  });
});
