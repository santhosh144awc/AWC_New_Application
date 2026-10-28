import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Phase 47 — Personal Finance Statement: Linked Monthly/Annual Income Fields and Indian Date Format', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health-check/real-statement/');
  });

  test('1. Income stage: Entry Period dropdown is removed, and table header renders new 5-column structure', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const headers = page.locator('#table-income thead th');
    await expect(headers).toHaveCount(6); // 5 data columns + 1 action column

    await expect(headers.nth(0)).toContainText('Source Particulars');
    await expect(headers.nth(1)).toContainText('Monthly Gross (₹)');
    await expect(headers.nth(2)).toContainText('Annual Gross (₹)');
    await expect(headers.nth(3)).toContainText('Annual Deductions (₹)');
    await expect(headers.nth(4)).toContainText('Net Annual (₹)');

    // Verify no select dropdowns or Entry Period segmented buttons exist in the income table
    const dropdowns = page.locator('#table-income select');
    await expect(dropdowns).toHaveCount(0);
  });

  test('2. Income synchronization: Entering 50000 in Monthly Gross updates Annual Gross to 600000', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const firstRow = page.locator('#table-income tbody tr').nth(0);
    const monthlyInput = firstRow.locator('input[data-field="monthly-gross"]');
    const annualInput = firstRow.locator('input[data-field="annual-gross"]');
    const deductionsInput = firstRow.locator('input[data-field="deductions-amount"]');
    const netAnnualCell = firstRow.locator('td').nth(4);

    await monthlyInput.fill('50000');
    await expect(annualInput).toHaveValue('600000');
    await expect(netAnnualCell).toContainText('6,00,000');

    // Total household income summary reflects 600000 gross annual
    const totalGrossAnnualCell = page.locator('#table-income tfoot td').nth(2);
    await expect(totalGrossAnnualCell).toContainText('6,00,000');
  });

  test('3. Income synchronization: Entering 600000 in Annual Gross updates Monthly Gross to 50000', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const firstRow = page.locator('#table-income tbody tr').nth(0);
    const monthlyInput = firstRow.locator('input[data-field="monthly-gross"]');
    const annualInput = firstRow.locator('input[data-field="annual-gross"]');

    await annualInput.fill('600000');
    await expect(monthlyInput).toHaveValue('50000');
  });

  test('4. Income synchronization: Zero updates both fields; Editing Monthly then Annual then Monthly maintains stability', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const firstRow = page.locator('#table-income tbody tr').nth(0);
    const monthlyInput = firstRow.locator('input[data-field="monthly-gross"]');
    const annualInput = firstRow.locator('input[data-field="annual-gross"]');

    // Entering 0
    await monthlyInput.fill('0');
    await expect(annualInput).toHaveValue('');

    // Editing monthly -> annual
    await monthlyInput.fill('40000');
    await expect(annualInput).toHaveValue('480000');

    // Editing annual -> monthly
    await annualInput.fill('720000');
    await expect(monthlyInput).toHaveValue('60000');

    // Editing monthly again -> annual
    await monthlyInput.fill('75000');
    await expect(annualInput).toHaveValue('900000');
  });

  test('5. Annual deductions: Net Annual = Annual Gross - Annual Deductions, deductions retain annual unit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const firstRow = page.locator('#table-income tbody tr').nth(0);
    const monthlyInput = firstRow.locator('input[data-field="monthly-gross"]');
    const annualInput = firstRow.locator('input[data-field="annual-gross"]');
    const deductionsInput = firstRow.locator('input[data-field="deductions-amount"]');
    const netAnnualCell = firstRow.locator('td').nth(4);

    await monthlyInput.fill('100000');
    await expect(annualInput).toHaveValue('1200000');

    // Deductions: 1,50,000 / year
    await deductionsInput.fill('150000');
    // Net annual = 12,00,000 - 1,50,000 = 10,50,000
    await expect(netAnnualCell).toContainText('10,50,000');

    // Editing monthly gross does NOT multiply/divide deductions
    await monthlyInput.fill('120000');
    await expect(annualInput).toHaveValue('1440000');
    await expect(deductionsInput).toHaveValue('150000');
    // Net annual = 14,40,000 - 1,50,000 = 12,90,000
    await expect(netAnnualCell).toContainText('12,90,000');
  });

  test('6. User-added income rows synchronize identically without feedback loop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.click('#btn-add-income');
    const rows = page.locator('#table-income tbody tr');
    const customRow = rows.last();

    const labelInput = customRow.locator('input[type="text"]');
    const monthlyInput = customRow.locator('input[data-field="monthly-gross"]');
    const annualInput = customRow.locator('input[data-field="annual-gross"]');
    const deductionsInput = customRow.locator('input[data-field="deductions-amount"]');
    const netCell = customRow.locator('td').nth(4);

    await labelInput.fill('Dividend Portfolio');
    await monthlyInput.fill('20000');
    await expect(annualInput).toHaveValue('240000');
    await deductionsInput.fill('10000');
    await expect(netCell).toContainText('2,30,000');
  });

  test('7. Statement Date: Determined automatically from local calendar date, input is absent, and resets properly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // Date picker input must not exist in production UI
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toHaveCount(0);

    // Preparer info badge displays fixed preparer
    const preparerBadge = page.locator('#pfs-preparer-info');
    await expect(preparerBadge).toContainText('Prepared by: C. Santhosh Sathriyan');

    // Reset statement maintains fixed preparer
    await page.click('#btn-start-over');
    await page.click('#btn-confirm-reset');
    await expect(preparerBadge).toContainText('Prepared by: C. Santhosh Sathriyan');
  });

  test('8. Statement Preview & PDF Download: Display DD-MM-YYYY format and fixed preparer', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // Fill client name
    const clientInput = page.locator('input[placeholder="e.g. Ramesh & Priya Sundaram"]');
    await clientInput.fill('Ramesh & Priya Sundaram');

    // Verify statement date in preview modal
    await page.click('#btn-nav-stage-6');
    await expect(page.locator('#pane-stage-6')).toBeVisible();

    await page.click('#btn-preview-statement');
    const previewModal = page.locator('.pfs-preview-modal-box');
    await expect(previewModal).toBeVisible();

    const metaLine = page.locator('.pfs-preview-meta-line');
    await expect(metaLine).toContainText('Prepared by C. Santhosh Sathriyan');
    // Verify date is in DD-MM-YYYY order (e.g., regex \d{2}-\d{2}-\d{4})
    const metaText = await metaLine.innerText();
    expect(metaText).toMatch(/Date:\s*\d{2}-\d{2}-\d{4}/);

    // Download PDF and inspect filename date
    const downloadPromise = page.waitForEvent('download');
    await page.click('#btn-preview-download-pdf');
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^Personal-Finance-Statement-.*-\d{2}-\d{2}-\d{4}\.pdf$/);

    const tempPath = `tests/e2e/temp_phase47_statement.pdf`;
    await download.saveAs(tempPath);
    const stats = fs.statSync(tempPath);
    expect(stats.size).toBeGreaterThan(10000);
    fs.unlinkSync(tempPath);
  });

  test('9. Visual alignment across 1440px, 1280px and responsive containment at 390px', async ({ page }) => {
    for (const width of [1440, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const firstRow = page.locator('#table-income tbody tr').nth(0);
      const monthlyInput = firstRow.locator('input[data-field="monthly-gross"]');
      const annualInput = firstRow.locator('input[data-field="annual-gross"]');
      const deductionsInput = firstRow.locator('input[data-field="deductions-amount"]');

      await firstRow.scrollIntoViewIfNeeded();
      const mBox = await monthlyInput.boundingBox();
      const aBox = await annualInput.boundingBox();
      const dBox = await deductionsInput.boundingBox();

      expect(mBox).not.toBeNull();
      expect(aBox).not.toBeNull();
      expect(dBox).not.toBeNull();

      expect(Math.abs(mBox!.y - aBox!.y)).toBeLessThanOrEqual(2);
      expect(Math.abs(mBox!.y - dBox!.y)).toBeLessThanOrEqual(2);
      expect(Math.abs(mBox!.height - aBox!.height)).toBeLessThanOrEqual(2);
      expect(Math.abs(mBox!.height - dBox!.height)).toBeLessThanOrEqual(2);
    }

    // Mobile width 390px: no page-level horizontal overflow
    await page.setViewportSize({ width: 390, height: 844 });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 2);
  });
});
