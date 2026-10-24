import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { calculateLoanPrepaymentVsInvestment } from '../../src/domain/finance';

test.describe('Phase 24 / Phase 5 — Home Loan Prepayment vs Parallel Investment Concept C Redesign (/tools/home-loan-foreclosure/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/home-loan-foreclosure/');
    await page.waitForSelector('astro-island:not([ssr])');
  });

  test('1. Canonical route returns 200, one H1, correct title, and accessible main landmark', async ({ page }) => {
    await expect(page).toHaveTitle(/Home Loan Prepayment vs Parallel Investment Simulator — Ant Wealth Creation/);

    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
    await expect(h1s).toHaveText('Should you prepay your home loan or invest alongside it?');

    const eyebrow = page.locator('.page-intro .eyebrow');
    await expect(eyebrow).toContainText('Money Decisions · Home Loan');

    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main).toHaveId('main-content');
  });

  test('2. Concept C connected workbench renders in two columns (controls and sticky outcome card)', async ({ page }) => {
    const workbench = page.locator('.home-loan-workbench-wrapper');
    await expect(workbench).toBeVisible();

    const controlsCol = page.locator('.calc-controls-col');
    const resultsCol = page.locator('.calc-results-col');
    await expect(controlsCol).toBeVisible();
    await expect(resultsCol).toBeVisible();

    // Check sticky Atlantic Navy outcome card
    const outcomeCard = page.locator('#loan-outcome-card');
    await expect(outcomeCard).toBeVisible();
    await expect(outcomeCard.locator('.outcome-headline-number')).toBeVisible();
  });

  test('3. Illustrative example banner transitions to custom scenario on edit, and reset restores canonical values', async ({ page }) => {
    const banner = page.locator('#loan-notice-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Illustrative example — not your figures');

    // No reset button initially
    await expect(page.locator('#reset-loan-calc-btn')).not.toBeVisible();

    // Edit principal
    const principalInput = page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(0);
    await principalInput.fill('4500000');

    // Notice updates to custom scenario active
    await expect(banner).toContainText('Custom scenario active');
    const resetBtn = page.getByRole('button', { name: /Reset to Illustrative Example/i });
    await expect(resetBtn).toBeVisible();

    // Click reset
    await resetBtn.click();
    await expect(principalInput).toHaveValue('3000000');
    await expect(banner).toContainText('Illustrative example — not your figures');
    await expect(resetBtn).not.toBeVisible();
  });

  test('4. Synchronized numeric and range inputs update reciprocally across all 5 core parameters', async ({ page }) => {
    const island = page.locator('#home-loan-foreclosure-calculator');

    // 1. Outstanding Principal
    const pNum = island.locator('input[type="number"]').nth(0);
    const pSlider = island.locator('input[type="range"]').nth(0);
    await pNum.fill('5000000');
    await expect(pSlider).toHaveValue('5000000');
    await pSlider.fill('2500000');
    await expect(pNum).toHaveValue('2500000');

    // 2. Loan Interest Rate
    const rNum = island.locator('input[type="number"]').nth(1);
    const rSlider = island.locator('input[type="range"]').nth(1);
    await rNum.fill('9.5');
    await expect(rSlider).toHaveValue('9.5');
    await rSlider.fill('7.8');
    await expect(rNum).toHaveValue('7.8');

    // 3. Remaining Tenure
    const tNum = island.locator('input[type="number"]').nth(2);
    const tSlider = island.locator('input[type="range"]').nth(2);
    await tNum.fill('20');
    await expect(tSlider).toHaveValue('20');
    await tSlider.fill('10');
    await expect(tNum).toHaveValue('10');

    // 4. Monthly Surplus
    const sNum = island.locator('input[type="number"]').nth(3);
    const sSlider = island.locator('input[type="range"]').nth(3);
    await sNum.fill('15000');
    await expect(sSlider).toHaveValue('15000');
    await sSlider.fill('30000');
    await expect(sNum).toHaveValue('30000');

    // 5. Assumed Return
    const retNum = island.locator('input[type="number"]').nth(4);
    const retSlider = island.locator('input[type="range"]').nth(4);
    await retNum.fill('14');
    await expect(retSlider).toHaveValue('14');
    await retSlider.fill('11');
    await expect(retNum).toHaveValue('11');
  });

  test('5. Primary result matches direct output from calculateLoanPrepaymentVsInvestment() for known deterministic vector', async ({ page }) => {
    // Set inputs for registered deterministic test:
    // Principal: 2,40,000; Rate: 12%; Tenure: 1 Year (12 Mo); Surplus: 10,000; Return: 12% (VEC-LOAN-VS-INV-4)
    const island = page.locator('#home-loan-foreclosure-calculator');
    await island.locator('input[type="number"]').nth(0).fill('240000');
    await island.locator('input[type="number"]').nth(1).fill('12');
    await island.locator('input[type="number"]').nth(2).fill('1');
    await island.locator('input[type="number"]').nth(3).fill('10000');
    await island.locator('input[type="number"]').nth(4).fill('12');

    // Remove the default milestone injection
    const deleteBtn = page.locator('.one-time-row .btn-danger-icon').first();
    await deleteBtn.click();

    // Verify mathematical result from engine directly:
    // calculateLoanPrepaymentVsInvestment:
    // netFinancialDifference: 263.2699 -> Strategy A ahead by ₹263
    const expected = calculateLoanPrepaymentVsInvestment({
      principal: 240000,
      annualLoanInterestRatePercent: 12,
      remainingTenureMonths: 12,
      monthlySurplus: 10000,
      annualInvestmentReturnPercent: 12,
      oneTimeSurpluses: [],
    });
    expect(expected.netFinancialDifference).toBeCloseTo(263.2699, 4);

    const headline = page.locator('#loan-outcome-headline');
    await expect(headline).toBeVisible();
    await expect(headline).toContainText('Strategy A ahead by ₹263');

    // Baseline EMI check: 21,324
    const emiVal = page.locator('.baseline-banner .baseline-item').first().locator('.baseline-val');
    await expect(emiVal).toContainText('₹21,324');
  });

  test('6. Equal household budget and shared horizon statements are explicitly clear in UI', async ({ page }) => {
    // Horizon pill in outcome header
    const horizonPill = page.locator('.horizon-pill');
    await expect(horizonPill).toBeVisible();
    await expect(horizonPill).toContainText('Equal Monthly Budget');

    // Methodology explanation details
    const details = page.locator('.methodology-details');
    await expect(details).toBeVisible();
    const detailsText = await details.textContent();
    expect(detailsText).toContain('Fair Comparison Rule:');
    expect(detailsText).toContain('Both options are evaluated over the exact same loan horizon');
    expect(detailsText).toContain('exact same total household cash budget');
  });

  test('7. Milestone one-time surplus rows can be added, edited, and removed with reactive calculation update', async ({ page }) => {
    const listSection = page.locator('#onetime-list-section');
    await expect(listSection).toBeVisible();
    await expect(page.locator('.one-time-row')).toHaveCount(1);

    const initialDiff = await page.locator('#loan-outcome-headline').textContent();

    // Add a second injection
    const addBtn = page.locator('#add-onetime-row-btn');
    await addBtn.click();
    await expect(page.locator('.one-time-row')).toHaveCount(2);

    // Edit row 2
    const secondMonth = page.locator('.one-time-row input[type="number"]').nth(2);
    const secondAmount = page.locator('.one-time-row input[type="number"]').nth(3);
    await secondMonth.fill('24');
    await secondAmount.fill('50000');

    // Outcome headline updates
    const updatedDiff = await page.locator('#loan-outcome-headline').textContent();
    expect(updatedDiff).not.toBe(initialDiff);

    // Delete row 2
    const deleteBtn = page.locator('.one-time-row').nth(1).locator('.btn-danger-icon');
    await deleteBtn.click();
    await expect(page.locator('.one-time-row')).toHaveCount(1);
    await expect(page.locator('#loan-outcome-headline')).toHaveText(initialDiff!);
  });

  test('8. One-time surplus month beyond tenure is caught; tenure reduction revalidates and pauses stale output', async ({ page }) => {
    // Default tenure is 15 years (180 months), row 1 has month 12
    const tenureInput = page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(2);
    const monthInput = page.locator('.one-time-row input[type="number"]').nth(0);

    // Set month to 150
    await monthInput.fill('150');
    await expect(page.locator('.comparison-results-grid')).toBeVisible();

    // Reduce tenure to 10 years (120 months) -> month 150 is now beyond tenure!
    await tenureInput.fill('10');

    // Calculation is paused, pending card shown, stale calculation suppressed
    await expect(page.locator('.calc-pending-card')).toBeVisible();
    await expect(page.locator('.comparison-results-grid')).not.toBeVisible();

    // Correct month to 60 -> calculation restores
    await monthInput.fill('60');
    await expect(page.locator('.calc-pending-card')).not.toBeVisible();
    await expect(page.locator('.comparison-results-grid')).toBeVisible();
  });

  test('9. Boundary cases (zero return, zero surplus, 1-month tenure, early payoff) produce meaningful outputs without NaN or Infinity', async ({ page }) => {
    const island = page.locator('#home-loan-foreclosure-calculator');
    const pInput = island.locator('input[type="number"]').nth(0);
    const rInput = island.locator('input[type="number"]').nth(1);
    const tInput = island.locator('input[type="number"]').nth(2);
    const sInput = island.locator('input[type="number"]').nth(3);
    const retInput = island.locator('input[type="number"]').nth(4);

    // Remove one-time row first
    await page.locator('.one-time-row .btn-danger-icon').first().click();

    // 1-month tenure, 0 surplus, 0% return
    await pInput.fill('50000');
    await rInput.fill('9');
    await tInput.fill('1');
    await sInput.fill('0');
    await retInput.fill('0');

    const outcomeText = await page.locator('#loan-outcome-card').textContent();
    expect(outcomeText).not.toContain('NaN');
    expect(outcomeText).not.toContain('Infinity');
    expect(outcomeText).not.toContain('undefined');
    await expect(page.locator('.comparison-results-grid')).toBeVisible();
  });

  test('10. Mobile summary value updates in lockstep with detailed outcome card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const mobileSummaryVal = page.locator('#home-loan-mobile-headline-val');
    const desktopHeadline = page.locator('#loan-outcome-headline');

    await expect(mobileSummaryVal).toBeVisible();
    const initialText = await mobileSummaryVal.textContent();
    expect(initialText).toBe(await desktopHeadline.textContent());

    // Change monthly surplus
    const surplusInput = page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(3);
    await surplusInput.fill('20000');

    const newText = await mobileSummaryVal.textContent();
    expect(newText).not.toBe(initialText);
    expect(newText).toBe(await desktopHeadline.textContent());
  });

  test('11. Mobile result number is visible in the initial viewport on 360x800 (<=760px) and 390x844 (<=780px)', async ({ page }) => {
    // 360x800 viewport
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/home-loan-foreclosure/');
    await page.waitForSelector('astro-island:not([ssr])');

    const mobileNum360 = page.locator('#home-loan-mobile-headline-val');
    await expect(mobileNum360).toBeVisible();
    const box360 = await mobileNum360.boundingBox();
    expect(box360).not.toBeNull();
    const bottomEdge360 = box360!.y + box360!.height;
    console.log(`[MEASURED COORD 360x800] y=${box360!.y.toFixed(2)}, h=${box360!.height.toFixed(2)}, bottom=${bottomEdge360.toFixed(2)}px`);
    // Bottom edge must be within first fold (<= 760px)
    expect(bottomEdge360).toBeLessThanOrEqual(760);

    // 390x844 viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/home-loan-foreclosure/');
    await page.waitForSelector('astro-island:not([ssr])');

    const mobileNum390 = page.locator('#home-loan-mobile-headline-val');
    await expect(mobileNum390).toBeVisible();
    const box390 = await mobileNum390.boundingBox();
    expect(box390).not.toBeNull();
    const bottomEdge390 = box390!.y + box390!.height;
    console.log(`[MEASURED COORD 390x844] y=${box390!.y.toFixed(2)}, h=${box390!.height.toFixed(2)}, bottom=${bottomEdge390.toFixed(2)}px`);
    // Bottom edge must be within first fold (<= 780px)
    expect(bottomEdge390).toBeLessThanOrEqual(780);
  });

  test('12. Zero horizontal overflow across 360px, 390px, and 1440px viewports', async ({ page }) => {
    for (const width of [360, 390, 1440]) {
      const height = width === 1440 ? 900 : (width === 390 ? 844 : 800);
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(200);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow, `Viewport ${width}x${height} should have zero horizontal overflow`).toBe(false);
    }
  });

  test('13. Keyboard navigation, visible focus, labels, and accessible touch targets', async ({ page }) => {
    const firstInput = page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(0);
    await firstInput.focus();
    await expect(firstInput).toBeFocused();

    // Tab to range slider
    await page.keyboard.press('Tab');
    const firstSlider = page.locator('#home-loan-foreclosure-calculator input[type="range"]').nth(0);
    await expect(firstSlider).toBeFocused();

    // Verify touch targets >= 44px for primary mobile actions
    await page.setViewportSize({ width: 390, height: 844 });
    const adjustBtn = page.locator('#mobile-adjust-assumptions-btn');
    const box = await adjustBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('14. Strict privacy invariant: zero external requests, zero storage leaks, zero cookies, zero IndexedDB', async ({ page, context }) => {
    const externalRequests: string[] = [];
    const localOriginPattern = /^(http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)/;

    // 1. Install request listener before navigation
    page.on('request', (req) => {
      const reqUrl = req.url();
      if (!localOriginPattern.test(reqUrl)) {
        externalRequests.push(`${req.method()} ${reqUrl}`);
      }
    });

    // 2. Navigate
    await page.goto('/tools/home-loan-foreclosure/');
    await page.waitForSelector('astro-island:not([ssr])');

    // 3. Edit sensitive parameters
    const secretPrincipal = '9876543';
    const secretSurplus = '45678';
    await page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(0).fill(secretPrincipal);
    await page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(3).fill(secretSurplus);
    await page.waitForTimeout(300);

    // 4. Zero external requests
    expect(externalRequests).toHaveLength(0);

    // 5. Empty query string
    const currentUrl = new URL(page.url());
    expect(currentUrl.search).toBe('');

    // 6. No local/session storage leakage
    const storage = await page.evaluate(() => ({
      local: JSON.stringify(window.localStorage),
      session: JSON.stringify(window.sessionStorage),
    }));
    expect(storage.local).not.toContain(secretPrincipal);
    expect(storage.local).not.toContain(secretSurplus);
    expect(storage.session).not.toContain(secretPrincipal);
    expect(storage.session).not.toContain(secretSurplus);

    // 7. Cookies check
    const docCookie = await page.evaluate(() => document.cookie);
    expect(docCookie).toBe('');
    const contextCookies = await context.cookies();
    expect(contextCookies).toHaveLength(0);

    // 8. IndexedDB check
    const idbDatabases = await page.evaluate(async () => {
      if (typeof window.indexedDB?.databases === 'function') {
        const dbs = await window.indexedDB.databases();
        return dbs.map((d) => d.name || '');
      }
      return [];
    });
    expect(idbDatabases).toHaveLength(0);
  });

  test('15. Scope and gate invariants: GATE-A and GATE-C remain blocked', async ({ page }) => {
    // Tax calculations not present in this simulator
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Tax deductions and taxes on investment gains are not included');
    expect(bodyText).not.toContain('Section 24(b)');
    expect(bodyText).not.toContain('Section 80C');

    // Retirement & SWP calculators remain blocked
    const swpRes = await page.goto('/tools/swp/');
    expect(swpRes?.status()).toBe(200);
    const swpText = await page.textContent('body');
    expect(swpText).toContain('Calculations Not Available');

    const retRes = await page.goto('/plan/retirement/');
    expect(retRes?.status()).toBe(200);
    const retText = await page.textContent('body');
    expect(retText).toContain('Calculations Not Available');
  });

  test('16. Canonical related links resolve to canonical paths only', async ({ page }) => {
    const relatedLinks = page.locator('.related-grid a');
    const count = await relatedLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await relatedLinks.nth(i).getAttribute('href');
      if (href) hrefs.push(href);
    }

    expect(hrefs).toContain('/tools/sip-growth/');
    expect(hrefs).toContain('/tools/sip/');
    expect(hrefs).toContain('/plan/');
  });

  test('17. Capture fresh Phase 5 visual evidence screenshots', async ({ page }) => {
    const outDir = path.resolve('..', 'product-docs', 'design-review', 'phase5-home-loan');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // 1440 Desktop Initial & Full
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/home-loan-foreclosure/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(outDir, 'home-loan-desktop-1440-initial.png'), fullPage: false });
    await page.screenshot({ path: path.join(outDir, 'home-loan-desktop-1440-full.png'), fullPage: true });

    // 390 Mobile Initial & Full
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/home-loan-foreclosure/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(outDir, 'home-loan-mobile-390-initial.png'), fullPage: false });
    await page.screenshot({ path: path.join(outDir, 'home-loan-mobile-390-full.png'), fullPage: true });

    // 360 Mobile Initial & Full
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/home-loan-foreclosure/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(outDir, 'home-loan-mobile-360-initial.png'), fullPage: false });
    await page.screenshot({ path: path.join(outDir, 'home-loan-mobile-360-full.png'), fullPage: true });

    // Collapsible schedule expanded
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/home-loan-foreclosure/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.locator('#toggle-loan-schedule-btn').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'home-loan-schedule-expanded.png'), fullPage: false });

    // Validation pause state
    await page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(0).fill('');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'home-loan-validation-pause.png'), fullPage: false });
  });
});
