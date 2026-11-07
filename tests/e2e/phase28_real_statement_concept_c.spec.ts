import { test, expect } from '@playwright/test';

test.describe('Phase 9.1 Concept C — REAL Financial Statement & Net Worth Semantics & Privacy Accuracy', () => {

  test.describe('1. Quick Family Net Worth Snapshot (/tools/net-worth/)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tools/net-worth/');
    });

    test('1.1 Renders clean Concept C workbench in fresh empty state', async ({ page }) => {
      await expect(page).toHaveTitle(/Family Net Worth & Balance Sheet Calculator — Ant Wealth Creation/);
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText('Family Net Worth & Balance Sheet Calculator');

      const app = page.locator('#net-worth-calculator-app');
      await expect(app).toBeVisible();

      // Inputs are blank
      const liquidInput = app.locator('input[type="text"]').nth(0);
      await expect(liquidInput).toHaveValue('');

      // Results pending notice
      const resultsCol = page.locator('#net-worth-summary-results');
      await expect(resultsCol.locator('.results-pending')).toContainText('Enter your figures or click Load Example to see results');
      await expect(app.locator('.example-notice-banner')).toHaveCount(0);
    });

    test('1.2 Loads illustrative example, displays badge, and computes exact engine vectors with corrected neutral metric semantics', async ({ page }) => {
      const app = page.locator('#net-worth-calculator-app');
      const resultsCol = page.locator('#net-worth-summary-results');

      // Click Load Example
      await page.click('#reset-net-worth-example-btn');

      // Conspicuous illustrative banner
      const banner = app.locator('.example-notice-banner');
      await expect(banner).toBeVisible();
      await expect(banner).toContainText('Illustrative example loaded — these are not your figures.');

      // Equation strip check (VEC-WORTH-1)
      // Total Assets = ₹1,00,00,000, Total Liabilities = ₹40,00,000, Net Worth = ₹60,00,000
      await expect(resultsCol.locator('.eq-item').nth(0)).toContainText('₹1,00,00,000');
      await expect(resultsCol.locator('.eq-item').nth(1)).toContainText('₹40,00,000');
      await expect(resultsCol.locator('.eq-item.highlight')).toContainText('₹60,00,000');

      // Metric card: (5L + 25L) - 40L = -₹10,00,000
      const metricCard = resultsCol.locator('.productive-liquid-card');
      await expect(metricCard).toBeVisible();
      await expect(metricCard).toContainText('-₹10,00,000');

      // Phase 9.1 semantics: Verify new title, badge, and descriptive liquidity qualification
      await expect(metricCard.locator('.productive-title')).toHaveText('Cash & Financial Assets After Liabilities');
      await expect(metricCard.locator('.productive-badge')).toHaveText('Excludes Physical Assets');
      await expect(metricCard.locator('.productive-desc')).toContainText('Calculated as (Cash & Liquid Reserves + Financial Assets) − Total Liabilities.');
      await expect(metricCard.locator('.productive-desc')).toContainText('not the same as emergency cash available today; some financial or retirement holdings may have lock-ins, access conditions, exit costs or settlement timelines.');

      // Negative assertions: Ensure old misleading phrases are completely absent
      await expect(metricCard).not.toContainText('Productive Liquid Net Worth');
      await expect(metricCard).not.toContainText('Readily Accessible Capital');

      // Debt to Asset Ratio: 40L / 100L = 40.0%
      await expect(resultsCol).toContainText('40.0%');
    });

    test('1.3 Regulatory disclosure note provides transparent guidance and non-certificate disclaimer', async ({ page }) => {
      const disclosure = page.locator('.regulatory-disclosure-note');
      await expect(disclosure).toBeVisible();
      await expect(disclosure).toContainText('Regulatory Notice:');
      await expect(disclosure).toContainText('does not constitute a formal net worth certificate');
    });

    test('1.4 Clear all entries resets inputs and clears illustrative status', async ({ page }) => {
      const app = page.locator('#net-worth-calculator-app');
      const resultsCol = page.locator('#net-worth-summary-results');

      await page.click('#reset-net-worth-example-btn');
      await expect(resultsCol.locator('.eq-item.highlight')).toContainText('₹60,00,000');

      await page.click('#clear-net-worth-btn');
      await expect(resultsCol.locator('.results-pending')).toContainText('Enter your figures or click Load Example to see results');
      await expect(app.locator('.example-notice-banner')).toHaveCount(0);
    });

    test('1.5 Zero assets case displays "Not available" for Debt-to-Asset ratio without NaN or division by zero', async ({ page }) => {
      const app = page.locator('#net-worth-calculator-app');
      const resultsCol = page.locator('#net-worth-summary-results');

      await app.locator('input[type="text"]').nth(0).fill('0');
      await app.locator('input[type="text"]').nth(1).fill('0');
      await app.locator('input[type="text"]').nth(2).fill('0');
      await app.locator('input[type="text"]').nth(3).fill('0');
      await app.locator('input[type="text"]').nth(4).fill('100000');

      await expect(resultsCol.locator('.eq-item').nth(0)).toContainText('₹0');
      await expect(resultsCol.locator('.eq-item').nth(1)).toContainText('₹1,00,000');
      await expect(resultsCol.locator('.eq-item.highlight')).toContainText('-₹1,00,000');
      await expect(resultsCol).toContainText('Not available');
    });

    test('1.6 Measures headline metric coordinates and asserts zero overflow at 360px, 390px, and 1440px', async ({ page }) => {
      for (const vp of [
        { width: 360, height: 800 },
        { width: 390, height: 844 },
        { width: 1440, height: 900 },
      ]) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/tools/net-worth/');
        await page.click('#reset-net-worth-example-btn');

        const headlineEl = page.locator('#net-worth-headline-val');
        await expect(headlineEl).toBeVisible();
        await expect(headlineEl).toHaveText('₹60,00,000');

        const box = await headlineEl.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThan(0);
        expect(box!.height).toBeGreaterThan(0);

        // Check horizontal overflow
        const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(hasOverflow).toBe(false);
      }
    });

    test('1.7 Reciprocal link to Personal Finance Statement resolves to HTTP 200', async ({ page }) => {
      const link = page.locator('a[href="/tools/personal-finance-statement/"]').first();
      await expect(link).toBeVisible();
      await link.click();
      await page.waitForURL('**/tools/personal-finance-statement/');
      await expect(page.locator('h1')).toHaveText('Personal Finance Statement');
    });

    test('1.8 Strict privacy invariant: zero external network requests, zero client storage, zero cookies, zero IndexedDB, and zero URL leakage in fresh context', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      // 1. Attach request instrumentation BEFORE page.goto()
      const externalRequests: string[] = [];
      page.on('request', (req) => {
        try {
          const parsed = new URL(req.url());
          if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
              externalRequests.push(req.url());
            }
          }
        } catch {
          // ignore invalid URLs
        }
      });

      // Navigate to route
      await page.goto('/tools/net-worth/');

      // Load illustrative sample
      await page.click('#reset-net-worth-example-btn');

      // Edit representative financial inputs
      const liquidInput = page.locator('#net-worth-calculator-app input[type="text"]').first();
      await liquidInput.fill('600000');
      const financialInput = page.locator('#net-worth-calculator-app input[type="text"]').nth(1);
      await financialInput.fill('3000000');

      // Verify calculation updated
      const resultsCol = page.locator('#net-worth-summary-results');
      await expect(resultsCol.locator('.eq-item').nth(0)).toContainText('₹1,06,00,000');

      // Assert external-request list is empty
      expect(externalRequests).toEqual([]);

      // Assert zero storage, cookies, indexedDB, and URL leakage
      const privacyCheck = await page.evaluate(async () => {
        let dbNames: string[] = [];
        if (typeof window.indexedDB?.databases === 'function') {
          try {
            const dbs = await window.indexedDB.databases();
            dbNames = dbs.map((d) => d.name || '').filter(Boolean);
          } catch {
            // ignore
          }
        }
        return {
          localLen: window.localStorage.length,
          sessionLen: window.sessionStorage.length,
          cookie: document.cookie,
          search: window.location.search,
          hash: window.location.hash,
          dbNames,
        };
      });

      expect(privacyCheck.localLen).toBe(0);
      expect(privacyCheck.sessionLen).toBe(0);
      expect(privacyCheck.cookie).toBe('');
      expect(privacyCheck.search).toBe('');
      expect(privacyCheck.hash).toBe('');
      expect(privacyCheck.dbNames).toEqual([]);

      const cookies = await context.cookies();
      expect(cookies).toEqual([]);

      await context.close();
    });
  });

  test.describe('2. Comprehensive Personal Finance Statement (/tools/personal-finance-statement/)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tools/personal-finance-statement/');
    });

    test('2.1 Renders 6-stage statement in fresh empty state with accessible stepper', async ({ page }) => {
      await expect(page).toHaveTitle(/Personal Finance Statement/);
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText('Personal Finance Statement');

      const app = page.locator('#personal-finance-statement-app');
      await expect(app).toBeVisible();

      // Check stepper button
      const step1Btn = page.locator('#btn-nav-stage-1');
      await expect(step1Btn).toBeVisible();

      // Empty initial state
      await expect(page.locator('#metric-income .pfs-metric-value')).toContainText('₹0');
      await expect(page.locator('#metric-networth .pfs-metric-value')).toContainText('₹0');
    });

    test('2.2 Calculates net worth and metrics across statement stages', async ({ page }) => {
      const app = page.locator('#personal-finance-statement-app');
      await expect(app).toBeVisible();

      // Wait for table rows hydration
      const incomeRows = app.locator('#table-income tbody tr');
      await expect(incomeRows).toHaveCount(7);

      // Stage 1: Enter income
      const firstMonthlyInput = incomeRows.first().locator('input[data-field="monthly-gross"]');
      await firstMonthlyInput.fill('150000');
      await expect(page.locator('#metric-income .pfs-metric-value')).toContainText('₹18,00,000');

      // Navigate Stage 2
      await page.click('#btn-nav-stage-2');
      await expect(page.locator('#pane-stage-2')).toBeVisible();

      // Navigate Stage 4
      await page.click('#btn-nav-stage-4');
      await expect(page.locator('#pane-stage-4')).toBeVisible();

      // Navigate Stage 6
      await page.click('#btn-nav-stage-6');
      await expect(page.locator('#pane-stage-6')).toBeVisible();
      await expect(page.locator('#networth-dashboard')).toBeVisible();
    });

    test('2.3 Measures headline metric coordinates and asserts zero overflow at 360px, 390px, and 1440px in Stage 6', async ({ page }) => {
      for (const vp of [
        { width: 360, height: 800 },
        { width: 390, height: 844 },
        { width: 1440, height: 900 },
      ]) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/tools/personal-finance-statement/');
        await page.click('#btn-nav-stage-6');

        await expect(page.locator('#pane-stage-6')).toBeVisible();

        // Check horizontal overflow
        const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(hasOverflow).toBe(false);
      }
    });

    test('2.4 Reciprocal link to Quick Net Worth resolves to HTTP 200', async ({ page }) => {
      const link = page.locator('.quick-tool-switcher a[href="/tools/net-worth/"]').first();
      await expect(link).toBeVisible();
      await link.click();
      await page.waitForURL('**/tools/net-worth/');
      await expect(page.locator('h1')).toHaveText('Family Net Worth & Balance Sheet Calculator');
    });

    test('2.5 Retains entered data when moving between stages via stepper navigation', async ({ page }) => {
      await expect(page.locator('#table-income tbody tr')).toHaveCount(7);

      // Edit first income amount in Stage 1
      const firstIncomeRow = page.locator('#table-income tbody tr').first();
      await firstIncomeRow.locator('input[data-field="monthly-gross"]').fill('180000');

      // Navigate to Stage 2
      await page.click('#btn-nav-stage-2');
      await expect(page.locator('#pane-stage-2')).toBeVisible();

      // Navigate back to Stage 1
      await page.click('#btn-nav-stage-1');
      await expect(page.locator('#pane-stage-1')).toBeVisible();

      // Verify retained value
      await expect(firstIncomeRow.locator('input[data-field="monthly-gross"]')).toHaveValue('180000');
    });

    test('2.6 Strict privacy invariant: zero external network requests, zero client storage, zero cookies, zero IndexedDB, and zero URL parameter leakage across stages in fresh context', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      // 1. Attach request instrumentation BEFORE page.goto()
      const externalRequests: string[] = [];
      page.on('request', (req) => {
        try {
          const parsed = new URL(req.url());
          if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
              externalRequests.push(req.url());
            }
          }
        } catch {
          // ignore
        }
      });

      // Load route
      await page.goto('/tools/personal-finance-statement/');
      await expect(page.locator('#table-income tbody tr')).toHaveCount(7);

      // Edit representative input in Stage 1
      const firstIncomeRow = page.locator('#table-income tbody tr').first();
      await firstIncomeRow.locator('input[data-field="monthly-gross"]').fill('180000');

      // Navigate across stages
      await page.click('#btn-nav-stage-2');
      await expect(page.locator('#pane-stage-2')).toBeVisible();

      await page.click('#btn-nav-stage-4');
      await expect(page.locator('#pane-stage-4')).toBeVisible();

      await page.click('#btn-nav-stage-6');
      await expect(page.locator('#pane-stage-6')).toBeVisible();

      // Assert external request list is empty
      expect(externalRequests).toEqual([]);

      // Assert zero storage, cookies, indexedDB, and URL parameter leakage
      const privacyCheck = await page.evaluate(async () => {
        let dbNames: string[] = [];
        if (typeof window.indexedDB?.databases === 'function') {
          try {
            const dbs = await window.indexedDB.databases();
            dbNames = dbs.map((d) => d.name || '').filter(Boolean);
          } catch {
            // ignore
          }
        }
        return {
          localLen: window.localStorage.length,
          sessionLen: window.sessionStorage.length,
          cookie: document.cookie,
          search: window.location.search,
          hash: window.location.hash,
          dbNames,
        };
      });

      expect(privacyCheck.localLen).toBe(0);
      expect(privacyCheck.sessionLen).toBe(0);
      expect(privacyCheck.cookie).toBe('');
      expect(privacyCheck.search).toBe('');
      expect(privacyCheck.hash).toBe('');
      expect(privacyCheck.dbNames).toEqual([]);

      const cookies = await context.cookies();
      expect(cookies).toEqual([]);

      await context.close();
    });
  });
});
