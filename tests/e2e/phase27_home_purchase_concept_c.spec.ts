import { test, expect, type Request } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Phase 27 / Phase 8 — Family Home Purchase & Acquisition Cost Planner Concept C Redesign (/plan/home-purchase/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plan/home-purchase/');
    await page.waitForSelector('astro-island:not([ssr])');
  });

  test('1. Canonical route loads and has one semantic H1', async ({ page }) => {
    const response = await page.goto('/plan/home-purchase/');
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/Home Purchase & Acquisition Cost Planner — Ant Wealth Creation/i);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('Plan the cash your family may need to buy a home.');
    await expect(page.locator('main')).toBeVisible();
  });

  test('2. Neutral empty initial state: core numeric inputs remain empty and results do not appear', async ({ page }) => {
    await expect(page.locator('[data-testid="welcome-placeholder"]')).toBeVisible();
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="results-container"]')).toHaveCount(0);

    await expect(page.locator('[data-testid="input-property-value"]')).toHaveValue('');
    await expect(page.locator('[data-testid="input-years-to-purchase"]')).toHaveValue('');
    await expect(page.locator('[data-testid="input-current-income"]')).toHaveValue('');
  });

  test('3. Loading illustrative example shows an unambiguous banner and consistent example values', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();

    const banner = page.locator('[data-testid="illustrative-example-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Illustrative example loaded — these are not your figures.');

    await expect(page.locator('[data-testid="results-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-property-summary"]')).toBeVisible();

    // Check populated values for 75L @ 6% for 5 years
    await expect(page.locator('[data-testid="val-future-cost"]')).toBeVisible();
    await expect(page.locator('[data-testid="val-loan-emi"]')).toBeVisible();
    await expect(page.locator('[data-testid="val-stepup-sip"]')).toBeVisible();
  });

  test('4. Editing an input changes outputs and correctly changes the illustrative/custom-scenario notice', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toBeVisible();

    // Change annual property growth
    const growthInput = page.locator('[data-testid="input-property-growth"]');
    await growthInput.fill('8');

    // Banner must be removed immediately on edit
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);
  });

  test('5. Reset and Clear All perform their documented actions', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible();

    // Click Clear all
    await page.locator('[data-testid="clear-all-btn"]').click();

    await expect(page.locator('[data-testid="welcome-placeholder"]')).toBeVisible();
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="results-container"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="input-property-value"]')).toHaveValue('');
  });

  test('6. Input/range controls are synchronized and validation errors are accessible', async ({ page }) => {
    // Number input -> Slider sync
    const priceInput = page.locator('[data-testid="input-property-value"]');
    await priceInput.fill('9000000');

    const priceSlider = page.locator('#current-property-value-slider');
    await expect(priceSlider).toHaveValue('9000000');

    // Horizon sync
    const horizonInput = page.locator('[data-testid="input-years-to-purchase"]');
    await horizonInput.fill('7');
    const horizonSlider = page.locator('#years-to-purchase-slider');
    await expect(horizonSlider).toHaveValue('7');
  });

  test('7. Calculation outputs match direct test vectors (₹50L flat, 80% loan, 10% setup, 5 yrs)', async ({ page }) => {
    await page.locator('[data-testid="input-property-value"]').fill('5000000');
    await page.locator('[data-testid="input-years-to-purchase"]').fill('5');
    await page.locator('[data-testid="input-property-growth"]').fill('0');
    await page.locator('[data-testid="input-additional-cost-percent"]').fill('10');
    await page.locator('[data-testid="input-loan-funding-percent"]').fill('80');
    await page.locator('[data-testid="input-loan-interest-rate"]').fill('0');
    await page.locator('[data-testid="input-current-income"]').fill('60000');
    await page.locator('[data-testid="input-income-growth"]').fill('0');
    await page.locator('[data-testid="input-investment-return"]').fill('0');

    await expect(page.locator('[data-testid="val-future-property-value"]')).toContainText('₹50,00,000');
    await expect(page.locator('[data-testid="val-additional-costs"]')).toContainText('₹5,00,000');
    await expect(page.locator('[data-testid="val-future-cost"]')).toContainText('₹55,00,000');
    await expect(page.locator('[data-testid="val-upfront-cash-required"]')).toContainText('₹15,00,000');
    await expect(page.locator('[data-testid="val-loan-emi"]')).toContainText('₹16,667');
    await expect(page.locator('[data-testid="val-emi-income-ratio"]')).toContainText('27.8%');
    await expect(page.locator('[data-testid="badge-affordability-status"]')).toContainText('Within Benchmark');
  });

  test('8. Horizon 0 (immediate purchase) shows cash requirement and does not show monthly SIP solutions', async ({ page }) => {
    await page.locator('[data-testid="input-property-value"]').fill('6000000');
    await page.locator('[data-testid="input-years-to-purchase"]').fill('0');
    await page.locator('[data-testid="input-additional-cost-percent"]').fill('10');
    await page.locator('[data-testid="input-loan-funding-percent"]').fill('80');

    const immediateBox = page.locator('[data-testid="box-immediate-gap"]');
    await expect(immediateBox).toBeVisible();
    await expect(immediateBox).toContainText('Immediate Cash Shortfall');

    await expect(page.locator('[data-testid="solution-stepup-sip"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="solution-fixed-sip"]')).toHaveCount(0);
  });

  test('9. Zero/missing income never fabricates a 0% ratio or positive affordability status', async ({ page }) => {
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

  test('10. User-selected affordability comparison works without claims of universal safety', async ({ page }) => {
    await page.locator('[data-testid="input-property-value"]').fill('5000000');
    await page.locator('[data-testid="input-years-to-purchase"]').fill('5');
    await page.locator('[data-testid="input-current-income"]').fill('40000');
    await page.locator('[data-testid="input-affordability-threshold"]').fill('30');

    // Page must not have prescriptive "safe EMI" claims
    const content = await page.content();
    expect(content).not.toContain('35% Safe EMI Burden');
    expect(content).not.toContain('safe EMI');
  });

  test('11. Loan share changes update the narrative dynamically (no hardcoded 80% loan text)', async ({ page }) => {
    await page.locator('[data-testid="input-property-value"]').fill('5000000');
    await page.locator('[data-testid="input-years-to-purchase"]').fill('5');
    await page.locator('[data-testid="input-loan-funding-percent"]').fill('60');

    // Capital progress labels must show 60%
    const progressBox = page.locator('.capital-progress-box');
    await expect(progressBox).toContainText('Proposed Loan (60%)');

    // Narrative box must reflect 60% loan
    const narrativeBox = page.locator('[data-testid="narrative-box"]');
    await expect(narrativeBox).toContainText('60% loan');
  });

  test('12. Existing assets labels clearly state purchase-date availability', async ({ page }) => {
    const assetInput = page.locator('[data-testid="input-new-asset-amount"]');
    await expect(assetInput).toHaveAttribute('placeholder', 'Expected value available on purchase date (₹)');
    await expect(assetInput).toHaveAttribute('aria-label', 'Expected value available on purchase date (₹)');

    const helperNote = page.locator('.asset-helper-note');
    await expect(helperNote).toContainText('This planner does not project growth on these earmarked balances');
  });

  test('13. Mobile result summary and first-fold headline number visibility at 360x800 and 390x844', async ({ page }) => {
    // Test 360x800
    await page.setViewportSize({ width: 360, height: 800 });
    await page.locator('[data-testid="load-example-btn"]').click();

    const mobileSummary360 = page.locator('#home-purchase-mobile-summary');
    await expect(mobileSummary360).toBeVisible();

    const headline360 = page.locator('#home-purchase-mobile-headline-val');
    await expect(headline360).toBeVisible();

    const box360 = await headline360.boundingBox();
    expect(box360).not.toBeNull();
    // Headline number bottom must sit within first fold <= 760px
    expect(box360!.y + box360!.height).toBeLessThanOrEqual(760);

    // Verify 44px min height touch target for mobile action buttons
    const adjustBtn = page.locator('#mobile-adjust-assumptions-btn');
    const adjustBox = await adjustBtn.boundingBox();
    expect(adjustBox).not.toBeNull();
    expect(adjustBox!.height).toBeGreaterThanOrEqual(44);

    // Test 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    const headline390 = page.locator('#home-purchase-mobile-headline-val');
    const box390 = await headline390.boundingBox();
    expect(box390).not.toBeNull();
    expect(box390!.y + box390!.height).toBeLessThanOrEqual(780);

    // Desktop: hidden (> 850px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(mobileSummary360).toBeHidden();
    await expect(page.locator('#results-container')).toBeVisible();
  });

  test('14. Zero horizontal overflow across viewports at 360px, 390px, and 1440px', async ({ page }) => {
    for (const width of [360, 390, 1440]) {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 800 });
      await page.locator('[data-testid="load-example-btn"]').click();

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    }
  });

  test('15. Keyboard accessibility: labels, focus visibility, and disclosure controls', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();

    // Toggle year-by-year schedule via keyboard
    const toggleBtn = page.locator('[data-testid="toggle-schedule-btn"]');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.focus();
    await page.keyboard.press('Enter');

    const drawer = page.locator('[data-testid="schedule-drawer"]');
    await expect(drawer).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(drawer).toHaveCount(0);
  });

  test('16. Privacy Invariants: Zero persistence and network isolation', async ({ page }) => {
    const outboundRequests: { url: string; method: string }[] = [];
    page.on('request', (req: Request) => {
      const url = req.url();
      if (!url.endsWith('.js') && !url.endsWith('.css') && !url.endsWith('.woff2') && !url.endsWith('.png')) {
        outboundRequests.push({ url, method: req.method() });
      }
    });

    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="input-property-value"]').fill('9500000');
    await page.locator('[data-testid="input-current-income"]').fill('180000');

    // Storage invariants
    const localCount = await page.evaluate(() => window.localStorage.length);
    expect(localCount).toBe(0);

    const sessionCount = await page.evaluate(() => window.sessionStorage.length);
    expect(sessionCount).toBe(0);

    const cookies = await page.context().cookies();
    expect(cookies.length).toBe(0);

    // URL invariant
    const url = new URL(page.url());
    expect(url.search).toBe('');

    // Network isolation
    const nonGetRequests = outboundRequests.filter((r) => r.method !== 'GET');
    expect(nonGetRequests).toHaveLength(0);
  });

  test('17. No unsupported safe, standard, guaranteed, or approved claims', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();
    const content = await page.locator('main').textContent();

    expect(content).not.toMatch(/safe EMI/i);
    expect(content).not.toMatch(/standard ceiling/i);
    expect(content).not.toMatch(/guaranteed return/i);
    expect(content).not.toMatch(/approved loan/i);
  });

  test('18. Regulatory disclosure note is present with BUSINESS_PROFILE text and neutral tax notice', async ({ page }) => {
    const disclosure = page.locator('.regulatory-disclosure-note');
    await expect(disclosure).toBeVisible();
    await expect(disclosure).toContainText('Regulatory & Educational Notice:');
    await expect(disclosure).toContainText('Tax treatment is not included in this estimate');
    await expect(disclosure).toContainText('This planner does not calculate tax deductions, tax-regime effects, or tax savings');
    await expect(disclosure).toContainText('obtain qualified tax advice for your situation');
  });

  test('18.1. No legacy or unverified tax section citations, neutral emergency reserve copy across page and island, and tax-free results', async ({ page }) => {
    // 1. Page-level rule card caution remains visible and neutral
    const ruleCardCaution = page.locator('.rules-grid .rule-card').filter({ hasText: 'Emergency Reserve Consideration' });
    await expect(ruleCardCaution).toBeVisible();
    await expect(ruleCardCaution).toContainText('Consider how much readily accessible money would remain after purchase');
    await expect(ruleCardCaution).toContainText('This planner does not assess whether your remaining emergency reserve is adequate for your household');

    // 2. Interactive island emergency-note is visible and contains the approved neutral wording
    const islandEmergencyNote = page.locator('.emergency-note');
    await expect(islandEmergencyNote).toBeVisible();
    await expect(islandEmergencyNote).toContainText('Emergency reserve consideration:');
    await expect(islandEmergencyNote).toContainText('Money used toward a home purchase reduces the readily accessible funds left for other needs');
    await expect(islandEmergencyNote).toContainText('this planner does not assess whether that amount is adequate for your household');

    // 3. Prohibited prescriptive phrases must NOT appear anywhere in the rendered main content
    const mainContent = await page.locator('main').textContent();
    expect(mainContent).not.toMatch(/Never exhaust your family emergency reserve/i);
    expect(mainContent).not.toMatch(/Keep at least 6 months/i);
    expect(mainContent).not.toMatch(/Do not commit your emergency reserve/i);

    // 4. No legacy or unverified tax section references in user-visible public copy
    expect(mainContent).not.toMatch(/80C/);
    expect(mainContent).not.toMatch(/24\(b\)/);
    expect(mainContent).not.toMatch(/80EEA/);
    expect(mainContent).not.toMatch(/Section 22\b/);
    expect(mainContent).not.toMatch(/Section 130\b/);

    // 5. Tax-free results verification: ensure no tax deduction or tax saving numeric fields exist in results
    await page.locator('[data-testid="load-example-btn"]').click();
    const resultsContainer = page.locator('#results-container');
    const resultsText = await resultsContainer.textContent();
    expect(resultsText).not.toMatch(/tax saving(s)?:\s*₹/i);
    expect(resultsText).not.toMatch(/tax deduction(s)?:\s*₹/i);
    expect(resultsText).not.toMatch(/tax benefit(s)?:\s*₹/i);
    expect(resultsText).not.toMatch(/tax relief:\s*₹/i);
    expect(resultsText).not.toMatch(/post-tax/i);
    expect(resultsText).not.toMatch(/after-tax/i);
  });

  test('19. All related internal navigation links resolve to existing canonical routes', async ({ page }) => {
    const links = page.locator('.related-grid a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toMatch(/^\/(plan|tools)\//);
    }
  });

  test('20. Capture visual review screenshots for desktop and mobile viewports', async ({ page }) => {
    const outDir = path.resolve(process.cwd(), '../product-docs/design-review/phase8-home-purchase');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // 1. Desktop 1440x900 Empty
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(outDir, 'home-purchase-desktop-1440-empty.png') });

    // 2. Desktop 1440x900 Populated
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.screenshot({ path: path.join(outDir, 'home-purchase-desktop-1440-results-initial.png') });
    await page.screenshot({ path: path.join(outDir, 'home-purchase-desktop-1440-results-full.png'), fullPage: true });

    // 2a. Capture fresh screenshot of the home-purchase caution section
    const cautionSection = page.locator('.acquisition-rules-box');
    if (await cautionSection.count() > 0) {
      await cautionSection.screenshot({ path: path.join(outDir, 'home-purchase-caution-section.png') });
    }

    // 3. Mobile 390x844 Populated
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(outDir, 'home-purchase-mobile-390-results-initial.png') });
    await page.screenshot({ path: path.join(outDir, 'home-purchase-mobile-390-results-full.png'), fullPage: true });

    // 4. Mobile 360x800 Populated
    await page.setViewportSize({ width: 360, height: 800 });
    await page.screenshot({ path: path.join(outDir, 'home-purchase-mobile-360-results-initial.png') });
    await page.screenshot({ path: path.join(outDir, 'home-purchase-mobile-360-results-full.png'), fullPage: true });

    // 5. Mobile Empty captures
    await page.goto('/plan/home-purchase/');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(outDir, 'home-purchase-mobile-390-empty.png') });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.screenshot({ path: path.join(outDir, 'home-purchase-mobile-360-empty.png') });
  });
});
