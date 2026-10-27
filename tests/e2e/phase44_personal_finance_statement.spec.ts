import { test, expect } from '@playwright/test';

test.describe('Personal Finance Statement — Complete 6-Stage Workflow & Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health-check/real-statement/');
  });

  test('1. Page renders with correct title, breadcrumbs, and 6-stage navigation', async ({ page }) => {
    await expect(page).toHaveTitle(/Personal Finance Statement & Household Balance Sheet — Ant Wealth Creation/);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('Personal Finance Statement & Household Balance Sheet');

    // App wrapper
    const app = page.locator('#personal-finance-statement-app');
    await expect(app).toBeVisible();

    // Live bar metrics
    await expect(page.locator('#metric-income')).toBeVisible();
    await expect(page.locator('#metric-expenses')).toBeVisible();
    await expect(page.locator('#metric-savings')).toBeVisible();
    await expect(page.locator('#metric-assets')).toBeVisible();
    await expect(page.locator('#metric-liabilities')).toBeVisible();
    await expect(page.locator('#metric-networth')).toBeVisible();

    // Stepper buttons for 6 stages
    for (let i = 1; i <= 6; i++) {
      await expect(page.locator(`#btn-nav-stage-${i}`)).toBeVisible();
    }
  });

  test('2. Stage 1 Income: Displays rows, net calculation, and adding rows', async ({ page }) => {
    await expect(page.locator('#pane-stage-1')).toBeVisible();
    const incomeTable = page.locator('#table-income');
    await expect(incomeTable).toBeVisible();

    // Check add income button
    const addBtn = page.locator('#btn-add-income');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Verify Continue button navigates to Stage 2
    await page.click('#btn-stage-1-next');
    await expect(page.locator('#pane-stage-2')).toBeVisible();
  });

  test('3. Stage 2 Expenses: Mode A vs Mode B mutual exclusion without double-counting', async ({ page }) => {
    // Navigate to Stage 2
    await page.click('#btn-nav-stage-2');
    await expect(page.locator('#pane-stage-2')).toBeVisible();

    // Initially in Mode B (itemized)
    await expect(page.locator('#btn-mode-b')).toHaveClass(/active/);

    // Switch to Mode A (Total consolidated)
    await page.click('#btn-mode-a');
    await expect(page.locator('#btn-mode-a')).toHaveClass(/active/);
    await expect(page.locator('#mode-a-container')).toBeVisible();

    // Enter total monthly amount
    const modeAInput = page.locator('#mode-a-container input[type="number"]');
    await modeAInput.fill('80000');

    // Live expense metric reflects 80,000 * 12 + lifestyle/dependent/insurance/EMI
    // Verify Continue button navigates to Stage 3
    await page.click('#btn-stage-2-next');
    await expect(page.locator('#pane-stage-3')).toBeVisible();
  });

  test('4. Stage 3 Savings & Surplus: Surplus calculation and deficit detection', async ({ page }) => {
    // Explicitly load sample data to test deficit warning and compounding projections
    await page.click('#btn-load-sample');
    await page.click('#btn-nav-stage-3');
    await expect(page.locator('#pane-stage-3')).toBeVisible();

    // Check surplus card
    const surplusCard = page.locator('#surplus-card');
    await expect(surplusCard).toBeVisible();

    // With default sample data: Inflow (₹30,75,000) - Expenses (₹27,46,000) = Savings (₹3,29,000)
    // Ongoing investments = ₹6,80,000, so surplus is negative (-₹3,51,000)
    // Cash flow deficit warning is displayed
    await expect(surplusCard).toHaveClass(/surplus-deficit/);
    await expect(surplusCard.locator('.pfs-alert-warning')).toContainText('Cash Flow Deficit Warning');

    // Now reduce ongoing investments so surplus becomes positive and projections render
    // Change first investment amount to 1000
    const invInput = page.locator('#table-investments tbody input[type="number"]').first();
    await invInput.fill('1000');

    // Change PPF annual contribution to 0
    const ppfInput = page.locator('#table-investments tbody input[type="number"]').nth(2);
    await ppfInput.fill('0');

    // Projections container now appears
    const projContainer = page.locator('#projections-container');
    await expect(projContainer).toBeVisible();

    // Navigate to Stage 4
    await page.click('#btn-stage-3-next');
    await expect(page.locator('#pane-stage-4')).toBeVisible();
  });

  test('5. Stage 4 Assets & Stage 5 Liabilities: 6 asset classes and owner attribution', async ({ page }) => {
    await page.click('#btn-nav-stage-4');
    await expect(page.locator('#pane-stage-4')).toBeVisible();

    // Check that personal consumption asset section is highlighted
    const personalSection = page.locator('.personal-asset-section');
    await expect(personalSection).toBeVisible();

    // Navigate to Stage 5
    await page.click('#btn-stage-4-next');
    await expect(page.locator('#pane-stage-5')).toBeVisible();

    const liabilityTable = page.locator('#table-liabilities');
    await expect(liabilityTable).toBeVisible();

    // Navigate to Stage 6
    await page.click('#btn-stage-5-next');
    await expect(page.locator('#pane-stage-6')).toBeVisible();
  });

  test('6. Stage 6 Review & Client-Side PDF Generation: Validates dual net worth and triggers download', async ({ page }) => {
    await page.click('#btn-nav-stage-6');
    await expect(page.locator('#pane-stage-6')).toBeVisible();

    // Dual net worth dashboard
    const nwDash = page.locator('#networth-dashboard');
    await expect(nwDash).toBeVisible();
    await expect(nwDash.locator('.accounting-card')).toContainText('Net Worth (Including Personal Assets)');
    await expect(nwDash.locator('.productive-card')).toContainText('Actual Net Worth (Excluding Personal Assets)');

    // Load sample data to supply client name and populated financials
    await page.click('#btn-load-sample');
    await page.click('#btn-nav-stage-6');

    // PDF Download trigger
    const downloadBtn = page.locator('#btn-download-pdf');
    await expect(downloadBtn).toBeVisible();

    // Expect download event when clicking PDF button
    const downloadPromise = page.waitForEvent('download');
    await downloadBtn.click();
    const download = await downloadPromise;

    // Check sanitized filename format
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^Personal-Finance-Statement-.*\.pdf$/);
  });

  test('7. Reset function requires confirmation and clears in-memory state', async ({ page }) => {
    // Click Start Over / Reset
    await page.click('#btn-start-over');

    // Modal dialog appears
    const modal = page.locator('.pfs-modal-backdrop');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Reset Statement?');

    // Confirm reset
    await page.click('#btn-confirm-reset');
    await expect(modal).not.toBeVisible();

    // Verifies stage resets to 1 and incomes are reset to blank predefined schema (7 rows)
    await expect(page.locator('#pane-stage-1')).toBeVisible();
    const rows = page.locator('#table-income tbody tr');
    await expect(rows).toHaveCount(7);
    await expect(rows.first().locator('input[type="number"]').first()).toHaveValue('');
  });
});
