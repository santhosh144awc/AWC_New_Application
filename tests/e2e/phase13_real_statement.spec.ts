import { test, expect } from '@playwright/test';

test.describe('Phase 14 Remediation — REAL Financial Statement & Family Net Worth', () => {

  test.describe('A. Full Guided REAL Financial Statement (/tools/personal-finance-statement/)', () => {
    test('renders with useful unique title, exactly one H1, and mounts active statement app', async ({ page }) => {
      await page.goto('/tools/personal-finance-statement/');
      await expect(page).toHaveTitle(/Personal Finance Statement/);
      const h1s = page.locator('h1');
      await expect(h1s).toHaveCount(1);
      await expect(h1s).toHaveText('Personal Finance Statement');

      // Verify app island is mounted and active
      const app = page.locator('#personal-finance-statement-app');
      await expect(app).toBeVisible();

      // Fresh tool starts in empty state
      await expect(page.locator('#metric-income .pfs-metric-value')).toContainText('₹0');
      await expect(page.locator('#metric-networth .pfs-metric-value')).toContainText('₹0');

      // Stepper buttons for 6 stages
      for (let i = 1; i <= 6; i++) {
        await expect(page.locator(`#btn-nav-stage-${i}`)).toBeVisible();
      }

      // Legacy route redirects correctly to canonical URL
      await page.goto('/health-check/real-statement/');
      await page.waitForURL('**/tools/personal-finance-statement/');
      await expect(page.locator('#personal-finance-statement-app')).toBeVisible();
    });

    test('calculates net worth and metrics across statement stages', async ({ page }) => {
      await page.goto('/tools/personal-finance-statement/');
      const app = page.locator('#personal-finance-statement-app');
      await expect(app).toBeVisible();

      // Ensure React has hydrated the table rows
      const incomeRows = app.locator('#table-income tbody tr');
      await expect(incomeRows).toHaveCount(7);

      // Stage 1: Enter income
      const firstMonthlyInput = incomeRows.first().locator('input[data-field="monthly-gross"]');
      await firstMonthlyInput.fill('150000');
      await expect(page.locator('#metric-income .pfs-metric-value')).toContainText('₹18,00,000');

      // Navigate to Stage 2: Expenses
      await page.click('#btn-nav-stage-2');
      await expect(page.locator('#pane-stage-2')).toBeVisible();

      // Navigate to Stage 4: Assets
      await page.click('#btn-nav-stage-4');
      await expect(page.locator('#pane-stage-4')).toBeVisible();

      // Navigate to Stage 6: Review
      await page.click('#btn-nav-stage-6');
      await expect(page.locator('#pane-stage-6')).toBeVisible();
      await expect(page.locator('#networth-dashboard')).toBeVisible();
    });

    test('supports add, edit, and remove rows dynamically', async ({ page }) => {
      await page.goto('/tools/personal-finance-statement/');
      const incomeRows = page.locator('#table-income tbody tr');
      const initialCount = await incomeRows.count();

      // Add income row
      await page.click('#btn-add-income');
      await expect(page.locator('#table-income tbody tr')).toHaveCount(initialCount + 1);

      // Edit newly added row
      const lastRow = page.locator('#table-income tbody tr').last();
      await lastRow.locator('input[type="text"]').first().fill('Consulting Fee');
      await lastRow.locator('input[data-field="monthly-gross"]').fill('25000');
      await expect(page.locator('#metric-income .pfs-metric-value')).toContainText('₹3,00,000');

      // Delete the newly added row
      await lastRow.locator('.pfs-btn-row-del').click();
      await expect(page.locator('#table-income tbody tr')).toHaveCount(initialCount);
    });

    test('reset button opens modal and clears entries back to neutral empty state', async ({ page }) => {
      await page.goto('/tools/personal-finance-statement/');
      await expect(page.locator('#table-income tbody tr')).toHaveCount(7);
      const firstMonthlyInput = page.locator('#table-income tbody tr input[data-field="monthly-gross"]').first();
      await firstMonthlyInput.fill('200000');
      await expect(page.locator('#metric-income .pfs-metric-value')).toContainText('₹24,00,000');

      // Click reset button
      await page.click('#btn-start-over');
      const modal = page.locator('#pfs-reset-modal, .pfs-modal-backdrop');
      await expect(modal).toBeVisible();

      // Confirm reset
      await page.click('#btn-confirm-reset');
      await expect(modal).not.toBeVisible();
      await expect(page.locator('#metric-income .pfs-metric-value')).toContainText('₹0');
    });

    test('maintains strict in-memory privacy with zero persistence or storage leakage', async ({ page }) => {
      await page.goto('/tools/personal-finance-statement/');
      const firstMonthlyInput = page.locator('#table-income tbody tr input[data-field="monthly-gross"]').first();
      await firstMonthlyInput.fill('150000');

      // Check localStorage, sessionStorage, cookies
      const localStorageKeys = await page.evaluate(() => Object.keys(window.localStorage));
      const financialKeywords = ['worth', 'income', 'outflow', 'asset', 'liability', 'real_statement', 'balance'];
      const hasLeakedLocal = localStorageKeys.some((k) =>
        financialKeywords.some((w) => k.toLowerCase().includes(w))
      );
      expect(hasLeakedLocal).toBe(false);

      const sessionStorageKeys = await page.evaluate(() => Object.keys(window.sessionStorage));
      const hasLeakedSession = sessionStorageKeys.some((k) =>
        financialKeywords.some((w) => k.toLowerCase().includes(w))
      );
      expect(hasLeakedSession).toBe(false);

      const cookies = await page.evaluate(() => document.cookie);
      expect(cookies).not.toContain('statement');

      // Check URL query parameters
      const url = new URL(page.url());
      expect(url.search).toBe('');
    });

    test('has zero horizontal overflow on mobile 360px and 390px viewports', async ({ page }) => {
      for (const width of [360, 390]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto('/tools/personal-finance-statement/');
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
      }
    });

    test('captures desktop (1440px) and mobile (390px) screenshots for REAL statement', async ({ page }) => {
      await page.goto('/tools/personal-finance-statement/');
      await page.click('#btn-nav-stage-6');
      await expect(page.locator('#pane-stage-6')).toBeVisible();

      // Desktop 1440px
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.screenshot({
        path: 'tests/e2e/screenshots/desktop-real-statement.png',
        fullPage: true,
      });

      // Mobile 390px
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: 'tests/e2e/screenshots/mobile-real-statement.png',
        fullPage: true,
      });
    });
  });

  test.describe('B. Quick Household Net Worth Calculator (/tools/net-worth/)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tools/net-worth/');
    });

    test('renders in fresh empty state without displaying sample figures as user finances', async ({ page }) => {
      await expect(page).toHaveTitle(/Family Net Worth & Balance Sheet Calculator — Ant Wealth Creation/);
      const h1s = page.locator('h1');
      await expect(h1s).toHaveCount(1);
      await expect(h1s).toHaveText('Family Net Worth & Balance Sheet Calculator');

      const island = page.locator('#net-worth-calculator-app');
      await expect(island).toBeVisible();

      // Verify inputs start blank
      const liquidInput = island.locator('input[type="text"]').nth(0);
      await expect(liquidInput).toHaveValue('');

      // Results must display pending empty prompt rather than prefilled sample calculation
      const resultsCol = page.locator('#net-worth-summary-results');
      await expect(resultsCol.locator('.results-pending')).toContainText('Enter your figures or click Load Example to see results');
      await expect(island.locator('.example-notice-banner')).toHaveCount(0);
    });

    test('loads illustrative example with conspicuous notice and calculates correct balance sheet', async ({ page }) => {
      const island = page.locator('#net-worth-calculator-app');
      const resultsCol = page.locator('#net-worth-summary-results');

      // Click Load Example
      await page.click('#reset-net-worth-example-btn');

      // Notice must be displayed
      const notice = island.locator('.example-notice-banner');
      await expect(notice).toBeVisible();
      await expect(notice).toContainText('Illustrative example loaded — these are not your figures.');

      // Check outputs: 5L liquid, 25L financial, 70L physical = 100L Total Assets
      // 40L secured, 0 unsecured = 40L Total Liabilities
      // Accounting Net Worth = 60L
      await expect(resultsCol.locator('.eq-item').nth(0)).toContainText('₹1,00,00,000');
      await expect(resultsCol.locator('.eq-item').nth(1)).toContainText('₹40,00,000');
      await expect(resultsCol.locator('.eq-item.highlight')).toContainText('₹60,00,000');

      // Debt to Asset ratio: 40L / 100L = 40.0%
      await expect(resultsCol).toContainText('40.0%');
    });

    test('displays Debt-to-Asset ratio as "Not available" when Total Assets is zero (Fix A)', async ({ page }) => {
      const island = page.locator('#net-worth-calculator-app');
      const resultsCol = page.locator('#net-worth-summary-results');

      // Explicitly enter ₹0 for all assets and ₹1,00,000 for unsecured debt
      await island.locator('input[type="text"]').nth(0).fill('0'); // liquid
      await island.locator('input[type="text"]').nth(1).fill('0'); // financial
      await island.locator('input[type="text"]').nth(2).fill('0'); // physical
      await island.locator('input[type="text"]').nth(3).fill('0'); // secured
      await island.locator('input[type="text"]').nth(4).fill('100000'); // unsecured

      // Total Assets = ₹0, Total Liabilities = ₹1,00,000, Net Worth = -₹1,00,000
      await expect(resultsCol.locator('.eq-item').nth(0)).toContainText('₹0');
      await expect(resultsCol.locator('.eq-item').nth(1)).toContainText('₹1,00,000');
      await expect(resultsCol.locator('.eq-item.highlight')).toContainText('-₹1,00,000');

      // Debt-to-Asset ratio MUST display "Not available" (never 0.0% or NaN)
      await expect(resultsCol).toContainText('Not available');
    });

    test('provides functional Clear All returning to neutral empty state', async ({ page }) => {
      const resultsCol = page.locator('#net-worth-summary-results');

      // Load example first
      await page.click('#reset-net-worth-example-btn');
      await expect(resultsCol.locator('.eq-item.highlight')).toContainText('₹60,00,000');

      // Clear all entries
      await page.click('#clear-net-worth-btn');

      // Returns to neutral empty prompt without showing financial calculation
      await expect(resultsCol.locator('.results-pending')).toContainText('Enter your figures or click Load Example to see results');
    });

    test('includes accessible link to full REAL Financial Statement', async ({ page }) => {
      const deepDiveLink = page.locator('.btn-deep-dive');
      await expect(deepDiveLink).toBeVisible();
      await expect(deepDiveLink).toHaveAttribute('href', '/tools/personal-finance-statement/');
    });

    test('has zero horizontal overflow on mobile viewports', async ({ page }) => {
      for (const width of [360, 390]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto('/tools/net-worth/');
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
      }
    });

    test('captures desktop (1440px) and mobile (390px) screenshots for Net Worth tool', async ({ page }) => {
      await page.goto('/tools/net-worth/');
      await page.click('#reset-net-worth-example-btn');

      // Desktop 1440px
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.screenshot({
        path: 'tests/e2e/screenshots/desktop-net-worth.png',
        fullPage: true,
      });

      // Mobile 390px
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: 'tests/e2e/screenshots/mobile-net-worth.png',
        fullPage: true,
      });
    });
  });
});
