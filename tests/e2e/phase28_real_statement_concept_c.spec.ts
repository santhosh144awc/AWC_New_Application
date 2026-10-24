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

    test('1.3 Educational details section distinguishes physical vs financial assets without claiming provident funds fund emergencies', async ({ page }) => {
      const details = page.locator('.worth-details');
      await expect(details).toBeVisible();

      // Ensure summary title reflects refined distinction
      const summaryText = details.locator('.summary-text');
      await expect(summaryText).toHaveText('How Net Worth is Evaluated: Accounting vs Financial Assets');

      // Open details
      await summaryText.click();

      // Check card badge and title
      const financialCard = details.locator('.worth-card').first();
      await expect(financialCard.locator('.worth-badge')).toHaveText('Excludes Physical Assets');
      await expect(financialCard.locator('.worth-title')).toHaveText('Cash & Financial Assets After Liabilities');

      // Check description copy: Explains distinct access and warns EPF/PPF/NPS must not be assumed emergency cash
      const descText = await financialCard.locator('.worth-desc').textContent();
      expect(descText).toContain('instruments such as EPF, PPF, and NPS involve mandatory lock-ins, withdrawal conditions, or settlement timelines and must not be assumed to be immediately available emergency cash.');

      // Negative assertions
      expect(descText).not.toContain('fund upcoming family milestones or living emergencies');
      await expect(details).not.toContainText('Productive Liquid Net Worth');
      await expect(details).not.toContainText('Readily Accessible Capital');
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

    test('1.7 Reciprocal link to REAL Financial Statement resolves to HTTP 200', async ({ page }) => {
      const link = page.locator('a[href="/health-check/real-statement/"]').first();
      await expect(link).toBeVisible();
      await link.click();
      await page.waitForURL('**/health-check/real-statement/');
      await expect(page.locator('h1')).toHaveText('REAL Financial Statement & Household Balance Sheet');
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

  test.describe('2. Comprehensive REAL Financial Statement (/health-check/real-statement/)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/health-check/real-statement/');
    });

    test('2.1 Renders 4-stage wizard in fresh empty state with accessible stepper', async ({ page }) => {
      await expect(page).toHaveTitle(/REAL Financial Statement & Balance Sheet — Ant Wealth Creation/);
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText('REAL Financial Statement & Household Balance Sheet');

      const app = page.locator('#real-statement-app');
      await expect(app).toBeVisible();

      // Check stepper button has aria-current="step"
      const step1Btn = page.locator('#stage-nav-btn-1');
      await expect(step1Btn).toHaveAttribute('aria-current', 'step');

      // Empty initial state
      await expect(app.locator('.empty-state').first()).toBeVisible();
      await expect(app.locator('.example-loaded-banner')).toHaveCount(0);
    });

    test('2.2 Loads canonical Urban Family Example (VEC-REAL-01) across all 4 stages', async ({ page }) => {
      const app = page.locator('#real-statement-app');

      // Click Load Urban Family Example
      await page.click('#load-sample-btn');

      // Conspicuous notice visible
      const notice = app.locator('.example-loaded-banner');
      await expect(notice).toBeVisible();
      await expect(notice).toContainText('Illustrative example loaded — these are not your figures.');

      // Stage 1 Live Feedback: ₹2,25,000 income, ₹1,60,000 outflows, ₹65,000 surplus, 28.9% savings rate
      await expect(app.locator('.stage-live-summary')).toContainText('₹2,25,000');
      await expect(app.locator('.stage-live-summary')).toContainText('₹1,60,000');
      await expect(app.locator('.stage-live-summary')).toContainText('₹65,000');
      await expect(app.locator('.stage-live-summary')).toContainText('28.9%');

      // Navigate Stage 2
      await page.click('#continue-to-stage-2-btn');
      await expect(page.locator('#stage-2-title')).toHaveText('Liquid & Safety Assets');
      await expect(app.locator('.stage-live-summary')).toContainText('₹7,50,000');
      await expect(app.locator('.stage-live-summary')).toContainText('6.0 Months');

      // Navigate Stage 3
      await page.click('#continue-to-stage-3-btn');
      await expect(page.locator('#stage-3-title')).toHaveText('Growth Capital & Property');
      await expect(app.locator('.stage-live-summary')).toContainText('₹1,29,50,000'); // Total Assets
      await expect(app.locator('.stage-live-summary')).toContainText('₹34,50,000'); // Productive Wealth
      await expect(app.locator('.stage-live-summary')).toContainText('₹95,00,000'); // Personal Consumption Assets

      // Navigate Stage 4
      await page.click('#continue-to-stage-4-btn');
      await expect(page.locator('#stage-4-title')).toHaveText('Liabilities & Net Worth Review');

      // Review Dashboard calculations
      const eqCard = app.locator('.balance-sheet-equation-card');
      await expect(eqCard).toContainText('₹1,29,50,000'); // Total Assets
      await expect(eqCard).toContainText('₹45,00,000'); // Total Liabilities
      await expect(eqCard).toContainText('₹84,50,000'); // Accounting Net Worth

      const productiveCard = app.locator('.productive-nw-card');
      await expect(productiveCard).toContainText('-₹10,50,000'); // Productive Net Worth

      // Debt-to-Asset ratio: 34.7%
      await expect(page.locator('#final-statement-results')).toContainText('34.7%');
    });

    test('2.3 Measures headline metric coordinates and asserts zero overflow at 360px, 390px, and 1440px in Stage 4', async ({ page }) => {
      for (const vp of [
        { width: 360, height: 800 },
        { width: 390, height: 844 },
        { width: 1440, height: 900 },
      ]) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/health-check/real-statement/');
        await page.click('#load-sample-btn');
        await page.click('#stage-nav-btn-4');

        const headlineEl = page.locator('#real-statement-headline-val');
        await expect(headlineEl).toBeVisible();
        await expect(headlineEl).toHaveText('₹84,50,000');

        const box = await headlineEl.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThan(0);
        expect(box!.height).toBeGreaterThan(0);

        // Check horizontal overflow
        const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(hasOverflow).toBe(false);
      }
    });

    test('2.4 Reciprocal link to Quick Net Worth resolves to HTTP 200', async ({ page }) => {
      const link = page.locator('a[href="/tools/net-worth/"]').first();
      await expect(link).toBeVisible();
      await link.click();
      await page.waitForURL('**/tools/net-worth/');
      await expect(page.locator('h1')).toHaveText('Family Net Worth & Balance Sheet Calculator');
    });

    test('2.5 Retains entered data when moving between stages via stepper navigation', async ({ page }) => {
      await page.click('#load-sample-btn');

      // Edit first income amount in Stage 1
      const firstIncomeRow = page.locator('.table-block').first().locator('.item-row').first();
      await firstIncomeRow.locator('input[type="text"]').last().fill('180000');

      // Navigate to Stage 3
      await page.click('#stage-nav-btn-3');
      await expect(page.locator('#stage-3-title')).toHaveText('Growth Capital & Property');

      // Navigate back to Stage 1
      await page.click('#stage-nav-btn-1');
      await expect(page.locator('#stage-1-title')).toHaveText('Monthly Household Cash Flow');

      // Verify retained value
      await expect(firstIncomeRow.locator('input[type="text"]').last()).toHaveValue('180000');
    });

    test('2.6 Strict privacy invariant: zero external network requests, zero client storage, zero cookies, zero IndexedDB, and zero URL parameter leakage across 4 stages in fresh context', async ({ browser }) => {
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
      await page.goto('/health-check/real-statement/');

      // Load sample
      await page.click('#load-sample-btn');

      // Edit representative input in Stage 1
      const firstIncomeRow = page.locator('.table-block').first().locator('.item-row').first();
      await firstIncomeRow.locator('input[type="text"]').last().fill('180000');

      // Navigate across stages
      await page.click('#stage-nav-btn-2');
      await expect(page.locator('#stage-2-title')).toHaveText('Liquid & Safety Assets');

      await page.click('#stage-nav-btn-3');
      await expect(page.locator('#stage-3-title')).toHaveText('Growth Capital & Property');

      // Edit representative input in Stage 3
      const firstGrowthRow = page.locator('.table-block').first().locator('.item-row').first();
      await firstGrowthRow.locator('input[type="text"]').last().fill('1600000');

      await page.click('#stage-nav-btn-4');
      await expect(page.locator('#stage-4-title')).toHaveText('Liabilities & Net Worth Review');

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
