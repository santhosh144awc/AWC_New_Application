import { test, expect } from '@playwright/test';

test.describe('Phase 14 Remediation — REAL Financial Statement & Family Net Worth', () => {

  test.describe('A. Full Guided REAL Financial Statement (/health-check/real-statement/)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/health-check/real-statement/');
    });

    test('renders with useful unique title, exactly one H1, and mounts active wizard in fresh empty state', async ({ page }) => {
      await expect(page).toHaveTitle(/REAL Financial Statement & Balance Sheet — Ant Wealth Creation/);
      const h1s = page.locator('h1');
      await expect(h1s).toHaveCount(1);
      await expect(h1s).toHaveText('REAL Financial Statement & Household Balance Sheet');

      // Verify wizard island is mounted and active
      const wizard = page.locator('#real-statement-app');
      await expect(wizard).toBeVisible();

      // Fresh tool must NOT display sample figures as if they were the visitor's own
      await expect(wizard.locator('.empty-state').first()).toBeVisible();
      await expect(wizard.locator('.stage-live-summary')).toContainText('Enter your monthly figures or click Load Urban Family Example');
      await expect(wizard.locator('.example-loaded-banner')).toHaveCount(0);
    });

    test('loads canonical Urban Family Example (VEC-REAL-01) with conspicuous notice and correct metrics across all 4 stages', async ({ page }) => {
      const wizard = page.locator('#real-statement-app');

      // Click Load Urban Family Example
      await page.click('#load-sample-btn');

      // Conspicuous notice must be visible
      const exampleNotice = wizard.locator('.example-loaded-banner');
      await expect(exampleNotice).toBeVisible();
      await expect(exampleNotice).toContainText('Illustrative example loaded — these are not your figures.');

      // Stage 1: Cash Flow (Reconciled with VEC-REAL-01)
      await expect(wizard.locator('.stage-live-summary')).toContainText('₹2,25,000'); // Monthly Take-Home Income
      await expect(wizard.locator('.stage-live-summary')).toContainText('₹1,60,000'); // Total Outflows
      await expect(wizard.locator('.stage-live-summary')).toContainText('₹65,000'); // Monthly Surplus
      await expect(wizard.locator('.stage-live-summary')).toContainText('28.9%'); // Savings Rate (~28.89%)

      // Navigate to Stage 2: Liquid & Safety Assets
      await page.click('#continue-to-stage-2-btn');
      await expect(wizard.locator('#stage-2-title')).toHaveText('Liquid & Safety Assets');
      await expect(wizard.locator('.stage-live-summary')).toContainText('₹7,50,000'); // Accessible Safety Reserves
      await expect(wizard.locator('.stage-live-summary')).toContainText('6.0 Months'); // Emergency Runway (750k / 125k)

      // Navigate to Stage 3: Growth Capital & Property
      await page.click('#continue-to-stage-3-btn');
      await expect(wizard.locator('#stage-3-title')).toHaveText('Growth Capital & Property');
      // Reconciled Total Assets: ₹1,29,50,000 (No ₹3L FD; Jewellery separated from SGB)
      await expect(wizard.locator('.stage-live-summary')).toContainText('₹1,29,50,000');
      await expect(wizard.locator('.stage-live-summary')).toContainText('₹34,50,000'); // Productive Wealth
      await expect(wizard.locator('.stage-live-summary')).toContainText('₹95,00,000'); // Personal Consumption Assets

      // Navigate to Stage 4: Liabilities & Net Worth Review
      await page.click('#continue-to-stage-4-btn');
      await expect(wizard.locator('#stage-4-title')).toHaveText('Liabilities & Net Worth Review');

      // Verify Final Balance Sheet Equation Card
      const equationCard = wizard.locator('.balance-sheet-equation-card');
      await expect(equationCard).toBeVisible();
      await expect(equationCard).toContainText('₹1,29,50,000'); // Total Assets
      await expect(equationCard).toContainText('₹45,00,000'); // Total Liabilities
      await expect(equationCard).toContainText('₹84,50,000'); // Accounting Net Worth

      // Verify Productive Net Worth Card
      const productiveCard = wizard.locator('.productive-nw-card');
      await expect(productiveCard).toBeVisible();
      await expect(productiveCard).toContainText('-₹10,50,000'); // Productive-Asset-Adjusted Net Worth (Negative!)

      // Verify Debt-to-Asset Ratio
      await expect(wizard.locator('#final-statement-results')).toContainText('34.7%'); // 45L / 129.5L

      // Verify Stage 4 conspicuous illustrative callout banner
      const stage4Callout = wizard.locator('.example-callout-banner');
      await expect(stage4Callout).toBeVisible();
      await expect(stage4Callout).toContainText('Illustrative example loaded — these are not your figures.');
    });

    test('supports add, edit, and remove rows dynamically, clearing example-loaded status', async ({ page }) => {
      const wizard = page.locator('#real-statement-app');

      // Load example first
      await page.click('#load-sample-btn');
      await expect(wizard.locator('.example-loaded-banner')).toBeVisible();

      // Edit first income row from 150000 to 200000
      const firstIncomeRow = wizard.locator('.table-block').first().locator('.item-row').first();
      const amountInput = firstIncomeRow.locator('input[type="text"]').last();
      await amountInput.fill('200000');

      // Live summary should now reflect 200000 + 75000 = 275000
      await expect(wizard.locator('.stage-live-summary')).toContainText('₹2,75,000');

      // Example loaded banner should now be cleared since user edited figures
      await expect(wizard.locator('.example-loaded-banner')).toHaveCount(0);

      // Add new income row
      await page.click('#add-income-btn');
      const lastIncomeRow = wizard.locator('.table-block').first().locator('.item-row').last();
      const newAmountInput = lastIncomeRow.locator('input[type="text"]').last();
      await newAmountInput.fill('25000');
      await expect(wizard.locator('.stage-live-summary')).toContainText('₹3,00,000');

      // Remove the newly added row
      await lastIncomeRow.locator('.btn-remove').click();
      await expect(wizard.locator('.stage-live-summary')).toContainText('₹2,75,000');
    });

    test('validates inputs inline and suppresses calculation on invalid amounts without treating blank as zero', async ({ page }) => {
      const wizard = page.locator('#real-statement-app');

      // Load example then invalidate an amount
      await page.click('#load-sample-btn');
      const firstIncomeRow = wizard.locator('.table-block').first().locator('.item-row').first();
      const amountInput = firstIncomeRow.locator('input[type="text"]').last();
      await amountInput.fill('invalid-amount');

      // Inline error message should be displayed and calculation suppressed
      await expect(firstIncomeRow.locator('.row-error')).toBeVisible();
      await expect(wizard.locator('.summary-pending')).toContainText('Please correct invalid input amounts');

      // Correct the value back to 150000
      await amountInput.fill('150000');
      await expect(firstIncomeRow.locator('.row-error')).toHaveCount(0);
      await expect(wizard.locator('.stage-live-summary')).toContainText('₹2,25,000');
    });

    test('clear all entries returns wizard to empty initial state and removes example results', async ({ page }) => {
      const wizard = page.locator('#real-statement-app');

      // Load sample first
      await page.click('#load-sample-btn');
      await expect(wizard.locator('.stage-live-summary')).toContainText('₹2,25,000');

      // Clear all entries / Start over
      await page.click('#clear-all-btn');

      // Verify empty states in Stage 1 and pending summary notice
      await expect(wizard.locator('.empty-state').first()).toBeVisible();
      await expect(wizard.locator('.summary-pending')).toContainText('Enter your monthly figures or click Load Urban Family Example');
      await expect(wizard.locator('.example-loaded-banner')).toHaveCount(0);
    });

    test('maintains strict in-memory privacy with zero persistence or storage leakage', async ({ page }) => {
      // Load example and navigate to stage 4
      await page.click('#load-sample-btn');
      await page.click('#stage-nav-btn-4');
      await expect(page.locator('#final-statement-results')).toBeVisible();

      // Check localStorage has no financial keys or data
      const localStorageKeys = await page.evaluate(() => Object.keys(window.localStorage));
      const financialKeywords = ['worth', 'income', 'outflow', 'asset', 'liability', 'real_statement', 'balance'];
      const hasLeakedLocal = localStorageKeys.some((k) =>
        financialKeywords.some((w) => k.toLowerCase().includes(w))
      );
      expect(hasLeakedLocal).toBe(false);

      // Check sessionStorage has no financial keys
      const sessionStorageKeys = await page.evaluate(() => Object.keys(window.sessionStorage));
      const hasLeakedSession = sessionStorageKeys.some((k) =>
        financialKeywords.some((w) => k.toLowerCase().includes(w))
      );
      expect(hasLeakedSession).toBe(false);

      // Check cookies
      const cookies = await page.evaluate(() => document.cookie);
      expect(cookies).not.toContain('real_statement');

      // Check URL query parameters
      const url = new URL(page.url());
      expect(url.search).toBe('');
    });

    test('has zero horizontal overflow on mobile 360px and 390px viewports', async ({ page }) => {
      for (const width of [360, 390]) {
        await page.setViewportSize({ width, height: 800 });
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
      }
    });

    test('captures desktop (1440px) and mobile (390px) screenshots for REAL statement', async ({ page }) => {
      await page.click('#load-sample-btn');
      await page.click('#stage-nav-btn-4');
      await expect(page.locator('#final-statement-results')).toBeVisible();

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
      await expect(deepDiveLink).toHaveAttribute('href', '/health-check/real-statement/');
    });

    test('has zero horizontal overflow on mobile viewports', async ({ page }) => {
      for (const width of [360, 390]) {
        await page.setViewportSize({ width, height: 800 });
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
      }
    });

    test('captures desktop (1440px) and mobile (390px) screenshots for Net Worth tool', async ({ page }) => {
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
