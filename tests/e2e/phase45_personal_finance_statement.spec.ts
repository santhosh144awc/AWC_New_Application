import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Phase 45 — Personal Finance Statement UX & Functional Defects Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health-check/real-statement/');
  });

  test('1. Initial state: Blank client names, zero fictional data, complete predefined rows in all stages', async ({ page }) => {
    // 1. Title & layout
    await expect(page).toHaveTitle(/Personal Finance Statement & Household Balance Sheet — Ant Wealth Creation/);
    const app = page.locator('#personal-finance-statement-app');
    await expect(app).toBeVisible();

    // 2. Metadata must start completely blank by default (NO automatic sample data)
    const clientInput = page.locator('input[placeholder="e.g. Ramesh & Priya Sundaram"]');
    await expect(clientInput).toHaveValue('');
    const spouseInput = page.locator('input[placeholder="e.g. Priya"]');
    await expect(spouseInput).toHaveValue('');
    const childrenInput = page.locator('input[placeholder="e.g. Ananya, Aarav"]');
    await expect(childrenInput).toHaveValue('');

    // 3. Stage 1 Income: 7 Predefined rows must appear automatically by default
    await expect(page.locator('#pane-stage-1')).toBeVisible();
    const incomeRows = page.locator('#table-income tbody tr');
    await expect(incomeRows).toHaveCount(7);

    // Verify first row particulars match audited workbook
    await expect(incomeRows.nth(0).locator('input[type="text"]')).toHaveValue('Salary income — Self');
    await expect(incomeRows.nth(1).locator('input[type="text"]')).toHaveValue('Salary income — Spouse');
    await expect(incomeRows.nth(2).locator('input[type="text"]')).toHaveValue('Annual Bonus — Self');
    await expect(incomeRows.nth(3).locator('input[type="text"]')).toHaveValue('Annual Bonus — Spouse');
    await expect(incomeRows.nth(4).locator('input[type="text"]')).toHaveValue('Business Income');
    await expect(incomeRows.nth(5).locator('input[type="text"]')).toHaveValue('Rental Income');
    await expect(incomeRows.nth(6).locator('input[type="text"]')).toHaveValue('Investment Income');

    // Live metrics must start at 0
    await expect(page.locator('#metric-income .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-expenses .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-assets .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-liabilities .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-networth .pfs-metric-value')).toContainText('₹0');

    // 4. Stage 2 Expenses: 29 Predefined rows must be present
    await page.click('#btn-nav-stage-2');
    await expect(page.locator('#pane-stage-2')).toBeVisible();
    const expenseRows = page.locator('#pane-stage-2 table tbody tr');
    await expect(expenseRows).toHaveCount(29);

    // 5. Stage 3 Savings & Investments: 3 Predefined rows present
    await page.click('#btn-nav-stage-3');
    await expect(page.locator('#pane-stage-3')).toBeVisible();
    const investmentRows = page.locator('#table-investments tbody tr');
    await expect(investmentRows).toHaveCount(3);

    // 6. Stage 4 Assets: 23 Predefined rows present across 6 classes
    await page.click('#btn-nav-stage-4');
    await expect(page.locator('#pane-stage-4')).toBeVisible();
    const assetRows = page.locator('#pane-stage-4 table tbody tr');
    await expect(assetRows).toHaveCount(23);

    // 7. Stage 5 Liabilities: 6 Predefined rows present
    await page.click('#btn-nav-stage-5');
    await expect(page.locator('#pane-stage-5')).toBeVisible();
    const liabilityRows = page.locator('#table-liabilities tbody tr');
    await expect(liabilityRows).toHaveCount(6);

    // 8. Stage 6 Net Worth & Review: Dual Net Worth displays ₹0
    await page.click('#btn-nav-stage-6');
    await expect(page.locator('#pane-stage-6')).toBeVisible();
    await expect(page.locator('.accounting-card .pfs-nw-result-val')).toContainText('₹0');
    await expect(page.locator('.productive-card .pfs-nw-result-val')).toContainText('₹0');
  });

  test('2. Manual input populates household data without duplicating rows', async ({ page }) => {
    // Fill client name
    const clientInput = page.locator('input[placeholder="e.g. Ramesh & Priya Sundaram"]');
    await clientInput.fill('Ramesh & Priya Sundaram');

    // Fill Stage 1 income
    const firstRow = page.locator('#table-income tbody tr').nth(0);
    await firstRow.locator('input[data-field="monthly-gross"]').fill('125000');

    // Verify metrics updated
    await expect(page.locator('#metric-income .pfs-metric-value')).not.toContainText('₹0');

    // Verify row count remained 7 (did not duplicate)
    const incomeRows = page.locator('#table-income tbody tr');
    await expect(incomeRows).toHaveCount(7);
  });

  test('3. Reset Statement: Confirmation dialog, cancellation retains data, confirmed reset returns to clean blank predefined schema', async ({ page }) => {
    // 1. First fill household info
    const clientInput = page.locator('input[placeholder="e.g. Ramesh & Priya Sundaram"]');
    await clientInput.click();
    await clientInput.fill('Ramesh & Priya Sundaram');
    await page.waitForTimeout(100);

    const firstRow = page.locator('#table-income tbody tr').nth(0);
    await firstRow.locator('input[data-field="monthly-gross"]').fill('125000');

    // Add a custom income row
    await page.click('#btn-add-income');
    await expect(page.locator('#table-income tbody tr')).toHaveCount(8);

    // 2. Click Reset Statement
    await page.click('#btn-start-over');
    const modal = page.locator('.pfs-modal-backdrop');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Reset Statement?');

    // 3. Test Cancel: modal closes and data is preserved unchanged
    await page.click('#btn-cancel-reset');
    await expect(modal).not.toBeVisible();
    await expect(clientInput).toHaveValue('Ramesh & Priya Sundaram');
    await expect(page.locator('#table-income tbody tr')).toHaveCount(8);

    // 4. Test Confirmed Reset
    await page.click('#btn-start-over');
    await expect(modal).toBeVisible();
    await page.click('#btn-confirm-reset');
    await expect(modal).not.toBeVisible();

    // Must return to Stage 1
    await expect(page.locator('#pane-stage-1')).toBeVisible();

    // Client names must be completely cleared
    await expect(clientInput).toHaveValue('');
    const spouseInput = page.locator('input[placeholder="e.g. Priya"]');
    await expect(spouseInput).toHaveValue('');
    const childrenInput = page.locator('input[placeholder="e.g. Ananya, Aarav"]');
    await expect(childrenInput).toHaveValue('');

    // Predefined rows must remain present (7 rows), custom 8th row removed
    const postResetIncomeRows = page.locator('#table-income tbody tr');
    await expect(postResetIncomeRows).toHaveCount(7);
    // Amounts must be 0
    await expect(postResetIncomeRows.nth(0).locator('input[type="number"]').first()).toHaveValue('');

    // Live metrics must be ₹0
    await expect(page.locator('#metric-income .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-expenses .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-assets .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-liabilities .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-networth .pfs-metric-value')).toContainText('₹0');
  });

  test('4. PDF Export and Statement Preview: Preview modal opens, and real PDF file is downloaded', async ({ page }) => {
    // 1. Populate client data
    const clientInput = page.locator('input[placeholder="e.g. Ramesh & Priya Sundaram"]');
    await clientInput.fill('Ramesh & Priya Sundaram');
    await clientInput.press('Tab');
    await page.waitForTimeout(200);

    // 2. Navigate to Stage 6
    await page.click('#btn-nav-stage-6');
    await expect(page.locator('#pane-stage-6')).toBeVisible();

    // 3. Check Preview Statement action
    const previewBtn = page.locator('#btn-preview-statement');
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();

    // Preview modal must appear
    const previewModal = page.locator('.pfs-preview-modal-box');
    await expect(previewModal).toBeVisible();
    await expect(previewModal).toContainText('Statement Summary Preview');
    await expect(previewModal).toContainText('Ramesh & Priya Sundaram');

    // Close preview
    await page.click('#btn-close-preview');
    await expect(previewModal).not.toBeVisible();

    // 4. Download Real PDF
    const downloadBtn = page.locator('#btn-download-pdf');
    await expect(downloadBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await downloadBtn.click();
    const download = await downloadPromise;

    // Verify downloaded filename format
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^Personal-Finance-Statement-.*\.pdf$/);
    expect(filename).toContain('Ramesh___Priya_Sundaram');

    // Save and verify file exists with non-zero size
    const tempPath = `tests/e2e/temp_test_statement.pdf`;
    await download.saveAs(tempPath);
    const stats = fs.statSync(tempPath);
    expect(stats.size).toBeGreaterThan(10000); // Complete 5-page PDF should be > 10KB
    fs.unlinkSync(tempPath);
  });

  test('5. Responsive layout: Validates desktop 1440px and mobile 390px without horizontal overflow', async ({ page }) => {
    // 1. Desktop 1440px
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('#personal-finance-statement-app')).toBeVisible();

    // 2. Mobile 390px (iPhone 12 / Modern mobile)
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#personal-finance-statement-app')).toBeVisible();

    // Verify no page-level horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 0 horizontal overflow allowed

    // Stepper navigation and actions remain accessible
    await expect(page.locator('#btn-nav-stage-1')).toBeVisible();
    await expect(page.locator('#btn-start-over')).toBeVisible();
    await expect(page.locator('#btn-start-over')).toBeVisible();
  });
});
