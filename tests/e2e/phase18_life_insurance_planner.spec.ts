import { test, expect, type Request } from '@playwright/test';

test.describe('Phase 18.1 — Life Insurance Protection Needs Planner Accuracy, Test Vectors & Privacy (/tools/life-insurance/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');
  });

  test('1. Page Architecture, Title, Single H1, and Main Landmark', async ({ page }) => {
    await expect(page).toHaveTitle(/How Much (Life Insurance|Financial Protection).*Family Need\? — Ant Wealth Creation/i);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(/How Much (Life Insurance|Financial Protection).*Family Need\?/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('2. Working planner island is live; StatusNotice shell is completely removed', async ({ page }) => {
    await expect(page.locator('[data-testid="life-insurance-planner-island"]')).toBeVisible();
    await expect(page.locator('.status-notice')).toHaveCount(0);
    await expect(page.getByText('Tool Shell Active • Calculation Engine Pending')).toHaveCount(0);
  });

  test('3. Starts in clean neutral empty state with zero prefilled figures', async ({ page }) => {
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);

    // Step 1 inputs must be empty or default
    await expect(page.locator('[data-testid="input-annual-income"]')).toHaveValue('');
    await expect(page.locator('[data-testid="input-family-living-expenses"]')).toHaveValue('');
    await expect(page.locator('[data-testid="input-years-needed"]')).toHaveValue('20');

    // Switch to results tab to verify welcome placeholder prompt
    await page.locator('[data-testid="step-tab-4"]').click();
    await expect(page.locator('[data-testid="welcome-placeholder"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-container"]')).toHaveCount(0);
  });

  test('4. Load Illustrative Example displays truthful dynamic banner and canonical input values', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();

    // Banner must appear with dynamically derived canonical benchmark numbers
    const banner = page.locator('[data-testid="illustrative-example-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Illustrative family example loaded — sample values appear across the fields below');
    await expect(banner).toContainText('Benchmark scenario with ₹18L income, ₹7.2L family living expenses, ₹45L debt liabilities, and ₹40L milestone costs in today\'s rupees');

    // Assert visible inputs match ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE
    await expect(page.locator('[data-testid="input-annual-income"]')).toHaveValue('1800000');
    await expect(page.locator('[data-testid="input-family-living-expenses"]')).toHaveValue('720000');
    await expect(page.locator('[data-testid="input-years-needed"]')).toHaveValue('22');
    await expect(page.locator('[data-testid="input-support-growth"]')).toHaveValue('6');
    await expect(page.locator('[data-testid="input-corpus-return"]')).toHaveValue('7.5');

    // Step 2 inputs
    await page.locator('[data-testid="step-tab-2"]').click();
    await expect(page.locator('[data-testid="input-loan-home"]')).toHaveValue('4500000');
    await expect(page.locator('[data-testid="input-immediate-obligations"]')).toHaveValue('500000');

    // Step 3 inputs & milestones
    await page.locator('[data-testid="step-tab-3"]').click();
    await expect(page.locator('[data-testid="milestones-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="milestones-list"]').getByText("Children's Higher Education")).toBeVisible();
    await expect(page.locator('[data-testid="milestones-list"]').getByText('Dependent Support / Family Goal')).toBeVisible();
    await expect(page.locator('[data-testid="input-earmarked-funds"]')).toHaveValue('2000000');
    await expect(page.locator('[data-testid="input-personal-cover"]')).toHaveValue('5000000');
    await expect(page.locator('[data-testid="input-employer-cover"]')).toHaveValue('2500000');

    // Switch to results tab to verify calculations (VEC-LIFE-09)
    await page.locator('[data-testid="step-tab-4"]').click();
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible();

    await expect(page.locator('[data-testid="val-additional-personal-gap"]')).toContainText('₹1,47,99,549');
    await expect(page.locator('[data-testid="val-gross-protection-need"]')).toContainText('₹2,17,99,549');
    await expect(page.locator('[data-testid="val-family-support-pv"]')).toContainText('₹1,27,64,206');
    await expect(page.locator('[data-testid="val-liabilities-subtotal"]')).toContainText('₹45,00,000');
    await expect(page.locator('[data-testid="val-milestones-pv"]')).toContainText('₹40,35,343');
    await expect(page.locator('[data-testid="val-earmarked-funds"]')).toContainText('20,00,000');
    await expect(page.locator('[data-testid="val-need-after-earmarked"]')).toContainText('₹1,97,99,549');
    await expect(page.locator('[data-testid="val-existing-personal-cover"]')).toContainText('50,00,000');
    await expect(page.locator('[data-testid="val-group-cover-gap"]')).toContainText('₹1,22,99,549');
  });

  test('5. Modifying any input removes the illustrative banner', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toBeVisible();

    // Edit living expenses on Step 1
    const livingExp = page.locator('[data-testid="input-family-living-expenses"]');
    await livingExp.fill('1000000');

    // Banner must disappear
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);
  });

  test('6. VEC-LIFE-11: Living expenses exceed take-home income emits warning and calculates verified un-clamped result', async ({ page }) => {
    // Fill income: 6L, living expenses: 8L, horizon: 15, growth: 5%, return: 7%
    await page.locator('[data-testid="input-annual-income"]').fill('600000');
    await page.locator('[data-testid="input-family-living-expenses"]').fill('800000');
    await page.locator('[data-testid="input-years-needed"]').fill('15');
    await page.locator('[data-testid="input-support-growth"]').fill('5');
    await page.locator('[data-testid="input-corpus-return"]').fill('7');

    const warning = page.locator('[data-testid="income-warning-alert"]');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('Routine living expenses exceed take-home income');

    // Check calculated result in Step 4 matching verified VEC-LIFE-11 (₹98,60,030)
    await page.locator('[data-testid="step-tab-4"]').click();
    await expect(page.locator('[data-testid="val-additional-personal-gap"]')).toContainText('₹98,60,030');
    await expect(page.locator('[data-testid="val-gross-protection-need"]')).toContainText('₹98,60,030');
    await expect(page.locator('[data-testid="val-family-support-pv"]')).toContainText('₹98,60,030');
  });

  test('7. VEC-LIFE-05 & VEC-LIFE-06: Evaluates r=g and g > r cases with finite, non-negative results', async ({ page }) => {
    // VEC-LIFE-05: 6L, 20 yrs, g=6%, r=6%
    await page.locator('[data-testid="input-family-living-expenses"]').fill('600000');
    await page.locator('[data-testid="input-years-needed"]').fill('20');
    await page.locator('[data-testid="input-support-growth"]').fill('6');
    await page.locator('[data-testid="input-corpus-return"]').fill('6');

    await page.locator('[data-testid="step-tab-4"]').click();
    await expect(page.locator('[data-testid="val-gross-protection-need"]')).toContainText('₹1,13,20,755');

    // VEC-LIFE-06: 6L, 20 yrs, g=8%, r=6% (g > r)
    await page.locator('[data-testid="step-tab-1"]').click();
    await page.locator('[data-testid="input-support-growth"]').fill('8');
    await page.locator('[data-testid="input-corpus-return"]').fill('6');

    await page.locator('[data-testid="step-tab-4"]').click();
    await expect(page.locator('[data-testid="val-gross-protection-need"]')).toContainText('₹1,35,99,254');
  });

  test('8. VEC-LIFE-10: Earmarked surplus displays qualified surplus advisory', async ({ page }) => {
    // Fill Step 1: 3L living expenses, 5 years, 0% growth, 6% return
    await page.locator('[data-testid="input-annual-income"]').fill('800000');
    await page.locator('[data-testid="input-family-living-expenses"]').fill('300000');
    await page.locator('[data-testid="input-years-needed"]').fill('5');
    await page.locator('[data-testid="input-support-growth"]').fill('0');
    await page.locator('[data-testid="input-corpus-return"]').fill('6');

    // Step 2: 2L home loan, 1L buffer
    await page.locator('[data-testid="step-tab-2"]').click();
    await page.locator('[data-testid="input-loan-home"]').fill('200000');
    await page.locator('[data-testid="input-immediate-obligations"]').fill('100000');

    // Step 3: 30L earmarked funds
    await page.locator('[data-testid="step-tab-3"]').click();
    await page.locator('[data-testid="input-earmarked-funds"]').fill('3000000');

    // Step 4: Results
    await page.locator('[data-testid="step-tab-4"]').click();
    await expect(page.locator('[data-testid="val-additional-personal-gap"]')).toContainText('₹0');
    await expect(page.locator('.badge-covered')).toContainText('✓ Entered resources cover the modeled need under these assumptions');

    // Surplus notice box
    const surplusBox = page.locator('.surplus-notice-box');
    await expect(surplusBox).toBeVisible();
    await expect(surplusBox).toContainText('Asset Self-Funding Surplus');
    await expect(surplusBox).toContainText('₹14,36,291');
    await expect(surplusBox).toContainText('Please verify liquidity, access restrictions, competing goals, and asset ownership before relying on these reserves');
  });

  test('9. Invalid inputs show accessible field-level errors and suppress valid result cards', async ({ page }) => {
    // Enter invalid negative income and living expenses
    await page.locator('[data-testid="input-annual-income"]').fill('-100');
    await page.locator('[data-testid="input-family-living-expenses"]').fill('-500');

    // Field-level error alerts must appear
    const incomeErr = page.locator('#err-annual-income');
    await expect(incomeErr).toBeVisible();
    await expect(incomeErr).toHaveAttribute('role', 'alert');
    await expect(incomeErr).toContainText('Annual take-home income must be a non-negative number');

    const expensesErr = page.locator('#err-family-expenses');
    await expect(expensesErr).toBeVisible();
    await expect(expensesErr).toHaveAttribute('role', 'alert');
    await expect(expensesErr).toContainText('Annual family living expenses must be a non-negative number');

    // Inputs should have aria-invalid="true"
    await expect(page.locator('[data-testid="input-annual-income"]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('[data-testid="input-family-living-expenses"]')).toHaveAttribute('aria-invalid', 'true');

    // Switch to Step 4 (Results)
    await page.locator('[data-testid="step-tab-4"]').click();

    // Validation error panel must be shown
    const errorPanel = page.locator('[data-testid="validation-error-panel"]');
    await expect(errorPanel).toBeVisible();
    await expect(errorPanel).toHaveAttribute('role', 'alert');
    await expect(errorPanel).toContainText('Input Corrections Required');
    await expect(errorPanel).toContainText('Annual take-home income must be a non-negative number');

    // Results container and metric cards MUST NOT be rendered
    await expect(page.locator('[data-testid="results-container"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="val-additional-personal-gap"]')).toHaveCount(0);
  });

  test('10. Claim language hardening: verifies qualified text across planner and lower page', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();

    // Result card eyebrow must be "Estimated Cover Gap", NOT "Primary Recommendation"
    await expect(page.locator('.primary-card .metric-eyebrow')).toHaveText('Estimated Cover Gap');
    await expect(page.getByText('Primary Recommendation')).toHaveCount(0);

    // Explanation must state "Estimated additional personal cover gap under these assumptions...", NOT "Recommended additional pure personal term life insurance..."
    await expect(page.locator('.primary-card .metric-explanation')).toContainText(
      'Estimated additional personal cover gap under these assumptions to safeguard your family independently of corporate benefits'
    );
    await expect(page.getByText('Recommended additional pure personal term life insurance')).toHaveCount(0);

    // Lower-page educational insight: Pillar 3 must NOT claim "Guaranteed earmarks"
    await expect(page.locator('.insurance-pillars-grid')).toContainText('Future Family Milestones');
    await expect(page.locator('.insurance-pillars-grid')).toContainText('Planned allocations for children\'s higher education, marriage, or family goals that you want to safeguard');
    await expect(page.getByText('Guaranteed earmarks for children\'s higher education')).toHaveCount(0);
  });

  test('11. Zero persistence verification (localStorage, sessionStorage, cookies, IndexedDB, and URL)', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();

    // Check localStorage
    const localKeys = await page.evaluate(() => Object.keys(localStorage));
    for (const key of localKeys) {
      const val = await page.evaluate((k) => localStorage.getItem(k), key);
      expect(val).not.toContain('1800000');
      expect(val).not.toContain('720000');
      expect(val).not.toContain('4500000');
    }

    // Check sessionStorage
    const sessionKeys = await page.evaluate(() => Object.keys(sessionStorage));
    for (const key of sessionKeys) {
      const val = await page.evaluate((k) => sessionStorage.getItem(k), key);
      expect(val).not.toContain('1800000');
      expect(val).not.toContain('720000');
      expect(val).not.toContain('4500000');
    }

    // Check cookies
    const cookies = await page.context().cookies();
    for (const cookie of cookies) {
      expect(cookie.value).not.toContain('1800000');
      expect(cookie.value).not.toContain('720000');
    }

    // Check IndexedDB databases
    const idbDatabases = await page.evaluate(async () => {
      if (window.indexedDB && window.indexedDB.databases) {
        return (await window.indexedDB.databases()).map((db) => db.name);
      }
      return [];
    });
    expect(idbDatabases.length).toBe(0);

    // Check URL search and hash parameters
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('1800000');
    expect(currentUrl).not.toContain('720000');
    expect(currentUrl).not.toContain('4500000');
  });

  test('12. In-memory privacy: no household financial figures transmitted over network requests', async ({ page }) => {
    const outboundRequests: { url: string; method: string; postData: string | null }[] = [];

    page.on('request', (req: Request) => {
      const url = req.url();
      const method = req.method();
      const postData = req.postData();
      if (!url.endsWith('.js') && !url.endsWith('.css') && !url.endsWith('.woff2') && !url.endsWith('.png')) {
        outboundRequests.push({ url, method, postData });
      }
    });

    // Enter distinct sensitive test figures on Step 1
    await page.locator('[data-testid="input-annual-income"]').fill('3549200');
    await page.locator('[data-testid="input-family-living-expenses"]').fill('1438900');

    // No non-GET requests triggered
    const mutationRequests = outboundRequests.filter((r) => r.method !== 'GET');
    expect(mutationRequests).toHaveLength(0);

    // Verify financial figures not leaked in query, headers, or body
    for (const req of outboundRequests) {
      if (req.url.startsWith('http')) {
        const urlObj = new URL(req.url);
        expect(urlObj.search).not.toContain('3549200');
        expect(urlObj.search).not.toContain('1438900');
      }
      if (req.postData) {
        expect(req.postData).not.toContain('3549200');
        expect(req.postData).not.toContain('1438900');
      }
    }
  });

  test('13. Responsive viewports at 360px and 390px have zero horizontal overflow', async ({ page }) => {
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 850 });
      await page.locator('[data-testid="load-example-btn"]').click();
      await page.locator('[data-testid="step-tab-4"]').click();

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px rounding tolerance
    }
  });

  test('14. Visual inspection screenshots at desktop (1440px) and mobile (390px)', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();

    // Desktop Screenshot (1440px)
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.screenshot({
      path: 'tests/e2e/screenshots/desktop-tools-life-insurance.png',
      fullPage: true,
    });

    // Mobile Screenshot (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: 'tests/e2e/screenshots/mobile-tools-life-insurance.png',
      fullPage: true,
    });
  });

  test('15. Educational qualification: professional review checklist and caveats are prominent', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();

    // Professional checklist is visible
    const checklist = page.locator('[data-testid="professional-checklist"]');
    await expect(checklist).toBeVisible();
    await expect(checklist).toContainText('Household Topics to Review With a Licensed Professional');
    await expect(checklist).toContainText('Income Earner Stability & Dependants');
    await expect(checklist).toContainText('Group Cover Portability Risk');
    await expect(checklist).toContainText('Policy Exclusions & Claim Conditions');

    // No quote / sales pressure / pricing promises
    await expect(page.getByText('Get Instant Term Quote')).toHaveCount(0);
    await expect(page.getByText('Lowest Premium Guaranteed')).toHaveCount(0);
  });
});
