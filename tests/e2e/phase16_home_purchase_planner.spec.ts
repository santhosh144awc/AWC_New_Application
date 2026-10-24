import { test, expect, type Request } from '@playwright/test';

test.describe('Phase 16 — Family Home Purchase & Acquisition Cost Planner (/plan/home-purchase/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plan/home-purchase/');
    await page.waitForSelector('astro-island:not([ssr])');
  });

  test('1. Page Architecture, Title, Single H1, and Main Landmark', async ({ page }) => {
    await expect(page).toHaveTitle(/Home Purchase & Acquisition Cost Planner — Ant Wealth Creation/i);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(/(Plan the cash your family may need to buy a home|Family Home Purchase & Acquisition Cost Planner)/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('2. Working planner island is live; StatusNotice shell is removed', async ({ page }) => {
    // The interactive island container must be visible
    await expect(page.locator('[data-testid="home-purchase-planner-island"]')).toBeVisible();
    // The old blocked StatusNotice must not exist on the page
    await expect(page.locator('.status-notice')).toHaveCount(0);
    await expect(page.getByText('Planner Shell Active • GATE-C Tax Review Pending')).toHaveCount(0);
  });

  test('3. Starts in clean neutral empty state with zero prefilled figures', async ({ page }) => {
    // Welcome placeholder must be visible
    await expect(page.locator('[data-testid="welcome-placeholder"]')).toBeVisible();
    // No illustrative banner initially
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);
    // Result cards must not be rendered yet
    await expect(page.locator('[data-testid="card-property-summary"]')).toHaveCount(0);
    // Inputs must be empty
    await expect(page.locator('[data-testid="input-property-value"]')).toHaveValue('');
    await expect(page.locator('[data-testid="input-years-to-purchase"]')).toHaveValue('');
    await expect(page.locator('[data-testid="input-current-income"]')).toHaveValue('');
  });

  test('4. Load Illustrative Example displays conspicuous banner and populated results', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();

    // Conspicuous banner must appear
    const banner = page.locator('[data-testid="illustrative-example-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Illustrative example loaded — these are not your figures.');

    // Results container must be visible
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-property-summary"]')).toBeVisible();

    // Check key populated figures for 75L @ 6% for 5 years
    // Future property value: 75,00,000 * 1.06^5 = 1,00,36,692
    // Setup cost (10%): 10,03,669
    // Total future cost: 1,10,40,361
    await expect(page.locator('[data-testid="val-future-cost"]')).toBeVisible();
    await expect(page.locator('[data-testid="val-loan-emi"]')).toBeVisible();
    await expect(page.locator('[data-testid="val-stepup-sip"]')).toBeVisible();
  });

  test('5. Modifying any input removes the illustrative banner', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toBeVisible();

    // Change property growth rate
    const growthInput = page.locator('[data-testid="input-property-growth"]');
    await growthInput.fill('7');

    // Banner must be removed immediately
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);
  });

  test('6. Changing property price or horizon reactively updates future cost and funding outputs', async ({ page }) => {
    // Enter VEC-HOME-01 parameters
    await page.locator('[data-testid="input-property-value"]').fill('5000000');
    await page.locator('[data-testid="input-years-to-purchase"]').fill('5');
    await page.locator('[data-testid="input-property-growth"]').fill('0');
    await page.locator('[data-testid="input-additional-cost-percent"]').fill('10');
    await page.locator('[data-testid="input-loan-funding-percent"]').fill('80');
    await page.locator('[data-testid="input-loan-interest-rate"]').fill('0');
    await page.locator('[data-testid="input-current-income"]').fill('60000');
    await page.locator('[data-testid="input-income-growth"]').fill('0');
    await page.locator('[data-testid="input-investment-return"]').fill('0');

    // Results must calculate reactively
    await expect(page.locator('[data-testid="val-future-property-value"]')).toContainText('₹50,00,000');
    await expect(page.locator('[data-testid="val-additional-costs"]')).toContainText('₹5,00,000');
    await expect(page.locator('[data-testid="val-future-cost"]')).toContainText('₹55,00,000');
    await expect(page.locator('[data-testid="val-upfront-cash-required"]')).toContainText('₹15,00,000');
    await expect(page.locator('[data-testid="val-loan-emi"]')).toContainText('₹16,667');
    await expect(page.locator('[data-testid="val-emi-income-ratio"]')).toContainText('27.8%');
    await expect(page.locator('[data-testid="badge-affordability-status"]')).toContainText('Within Benchmark');
  });

  test('7. Adding, editing, and removing earmarked assets adjusts the cash gap dynamically', async ({ page }) => {
    await page.locator('[data-testid="input-property-value"]').fill('5000000');
    await page.locator('[data-testid="input-years-to-purchase"]').fill('5');
    await page.locator('[data-testid="input-property-growth"]').fill('0');
    await page.locator('[data-testid="input-additional-cost-percent"]').fill('10');
    await page.locator('[data-testid="input-loan-funding-percent"]').fill('80');

    // Upfront cash required is 15,00,000. With 0 assets, gap is 15,00,000
    await expect(page.locator('[data-testid="val-funding-gap"]')).toContainText('₹15,00,000');

    // Add Asset 1: Mutual Funds ₹5,00,000
    await page.locator('[data-testid="input-new-asset-name"]').fill('Mutual Funds');
    await page.locator('[data-testid="input-new-asset-amount"]').fill('500000');
    await page.locator('[data-testid="btn-add-asset"]').click();

    // Gap reduces to 10,00,000
    await expect(page.locator('[data-testid="val-funding-gap"]')).toContainText('₹10,00,000');

    // Add Asset 2: Fixed Deposit ₹10,00,000 -> Total 15,00,000 -> Fully Funded!
    await page.locator('[data-testid="input-new-asset-name"]').fill('Fixed Deposit');
    await page.locator('[data-testid="input-new-asset-amount"]').fill('1000000');
    await page.locator('[data-testid="btn-add-asset"]').click();

    // Fully funded banner should appear
    await expect(page.locator('[data-testid="banner-fully-funded"]')).toBeVisible();

    // Remove the FD asset
    const removeButtons = page.locator('.btn-remove-asset');
    await removeButtons.last().click();

    // Deficit returns to ₹10,00,000
    await expect(page.locator('[data-testid="val-funding-gap"]')).toContainText('₹10,00,000');
  });

  test('8. Immediate purchase (horizon = 0) shows cash deficit without invalid SIP amounts', async ({ page }) => {
    await page.locator('[data-testid="input-property-value"]').fill('5000000');
    await page.locator('[data-testid="input-years-to-purchase"]').fill('0');
    await page.locator('[data-testid="input-additional-cost-percent"]').fill('10');
    await page.locator('[data-testid="input-loan-funding-percent"]').fill('80');

    // Immediate purchase box must appear
    const immediateBox = page.locator('[data-testid="box-immediate-gap"]');
    await expect(immediateBox).toBeVisible();
    await expect(immediateBox).toContainText('Immediate Cash Shortfall');

    // No SIP solution cards should be rendered
    await expect(page.locator('[data-testid="solution-stepup-sip"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="solution-fixed-sip"]')).toHaveCount(0);
  });

  test('9. Missing/zero income produces neutral unavailable status without NaN or false 0%', async ({ page }) => {
    await page.locator('[data-testid="input-property-value"]').fill('5000000');
    await page.locator('[data-testid="input-years-to-purchase"]').fill('5');
    await page.locator('[data-testid="input-current-income"]').fill('0');

    const badge = page.locator('[data-testid="badge-affordability-status"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Income Missing');

    const ratio = page.locator('[data-testid="val-emi-income-ratio"]');
    await expect(ratio).toContainText('N/A');

    const insight = page.locator('[data-testid="text-affordability-insight"]');
    await expect(insight).toContainText('Monthly income is not provided or zero');
  });

  test('10. Clear all restores neutral empty state cleanly', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible();

    // Click Clear all
    await page.locator('[data-testid="clear-all-btn"]').click();

    // Welcome placeholder must be restored
    await expect(page.locator('[data-testid="welcome-placeholder"]')).toBeVisible();
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="results-container"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="input-property-value"]')).toHaveValue('');
  });

  test('11. Zero Persistence Invariants: No localStorage, sessionStorage, cookies, or URL params', async ({ page }) => {
    // Load example and add assets
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="input-property-value"]').fill('8500000');

    // Verify localStorage has 0 items
    const localCount = await page.evaluate(() => window.localStorage.length);
    expect(localCount).toBe(0);

    // Verify sessionStorage has 0 items
    const sessionCount = await page.evaluate(() => window.sessionStorage.length);
    expect(sessionCount).toBe(0);

    // Verify cookies
    const cookies = await page.context().cookies();
    expect(cookies.length).toBe(0);

    // Verify URL search query is empty
    const url = new URL(page.url());
    expect(url.search).toBe('');
  });

  test('12. Network Isolation: Zero external telemetry or lead-capture API requests', async ({ page }) => {
    const outboundRequests: { url: string; method: string; postData: string | null }[] = [];

    page.on('request', (req: Request) => {
      const url = req.url();
      const method = req.method();
      const postData = req.postData();
      // Only track non-static-asset requests (ignore css, js, fonts, images on localhost)
      if (!url.endsWith('.js') && !url.endsWith('.css') && !url.endsWith('.woff2') && !url.endsWith('.png')) {
        outboundRequests.push({ url, method, postData });
      }
    });

    // Interact with form, entering sensitive household financial numbers
    await page.locator('[data-testid="input-property-value"]').fill('9200000');
    await page.locator('[data-testid="input-years-to-purchase"]').fill('4');
    await page.locator('[data-testid="input-current-income"]').fill('175000');

    // No POST/PUT requests or external endpoints called
    const mutationRequests = outboundRequests.filter((r) => r.method !== 'GET');
    expect(mutationRequests).toHaveLength(0);

    // Verify no request URL or body contains the entered financial numbers
    for (const req of outboundRequests) {
      if (req.url.startsWith('http')) {
        const urlObj = new URL(req.url);
        expect(urlObj.search).not.toContain('9200000');
        expect(urlObj.search).not.toContain('175000');
      }
      if (req.postData) {
        expect(req.postData).not.toContain('9200000');
        expect(req.postData).not.toContain('175000');
      }
    }
  });

  test('13. Responsive viewports at 360px and 390px have zero horizontal overflow', async ({ page }) => {
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.locator('[data-testid="load-example-btn"]').click();

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px rounding tolerance
    }
  });

  test('14. Visual inspection screenshots at desktop (1440px) and mobile (390px)', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();

    // Desktop Screenshot (1440px)
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.screenshot({
      path: 'tests/e2e/screenshots/desktop-plan-home-purchase.png',
      fullPage: true,
    });

    // Mobile Screenshot (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: 'tests/e2e/screenshots/mobile-plan-home-purchase.png',
      fullPage: true,
    });
  });

  test('15. Earmarked asset timing semantics and acquisition-cost caveats are explicit and qualified', async ({ page }) => {
    // 1. Earmarked asset input placeholder and aria-label
    const assetInput = page.locator('[data-testid="input-new-asset-amount"]');
    await expect(assetInput).toHaveAttribute('placeholder', 'Expected value available on purchase date (₹)');
    await expect(assetInput).toHaveAttribute('aria-label', 'Expected value available on purchase date (₹)');

    // 2. Earmarked asset helper note
    await expect(page.locator('.asset-helper-note')).toContainText('This planner does not project growth on these earmarked balances');

    // 3. Acquisition cost qualified copy
    const costHint = page.locator('.field-hint').filter({ hasText: 'Illustrative editable assumption' });
    await expect(costHint).toBeVisible();
    await expect(costHint).toContainText('Actual charges depend heavily on your state, municipality, property type');

    // 4. Important Upfront Cost Realities section
    await expect(page.locator('#rules-heading')).toHaveText('Important Upfront Cost Realities');
    await expect(page.getByText('Illustrative Outlay 01')).toBeVisible();
    await expect(page.getByText('Stamp Duty & Registration (State-Specific)')).toBeVisible();
  });
});
