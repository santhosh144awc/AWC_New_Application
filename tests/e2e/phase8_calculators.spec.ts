import { test, expect } from '@playwright/test';

test.describe('Phase 8 — Calculator Quality Gate, Lump Sum, and Single-Goal Planner', () => {
  test.describe('2.1 & 2.2 Reconciled SIP Calculator Controls & Step-Up Language', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tools/sip/');
      await page.waitForSelector('astro-island:not([ssr])');
    });

    test('paired controls stay synchronised at normal and upper bounds above old slider limit', async ({ page }) => {
      const amountNum = page.locator('input[type="number"]').nth(0);
      const amountSlider = page.locator('input[type="range"]').nth(0);

      // Verify default state
      await expect(amountNum).toHaveValue('10000');
      await expect(amountSlider).toHaveValue('10000');

      // Change number input above old slider limit (e.g. ₹5,00,000)
      await amountNum.fill('500000');
      await expect(amountSlider).toHaveValue('500000');

      // Change via slider
      await amountSlider.fill('250000');
      await expect(amountNum).toHaveValue('250000');

      // Test lower bound
      await amountNum.fill('500');
      await expect(amountSlider).toHaveValue('500');
    });

    test('supports 0% return without error or silent clamping', async ({ page }) => {
      const returnNum = page.locator('input[type="number"]').nth(1);
      const returnSlider = page.locator('input[type="range"]').nth(1);

      await returnNum.fill('0');
      await expect(returnSlider).toHaveValue('0');

      // With 10,000/mo for 10 yrs (120 months) at 0%, future value = total invested = ₹12,00,000, gain = ₹0
      const futureVal = page.locator('#sip-future-value');
      const investedVal = page.locator('#sip-total-invested');
      const gainVal = page.locator('#sip-total-gain');

      await expect(futureVal).toContainText('₹12,00,000');
      await expect(investedVal).toContainText('₹12,00,000');
      await expect(gainVal).toContainText('₹0');
    });

    test('handles empty numeric inputs gracefully without silent 0-reset', async ({ page }) => {
      const amountNum = page.locator('input[type="number"]').nth(0);
      await amountNum.fill('');

      // Field error is shown
      const errorMsg = page.locator('#sip-calculator-app .field-error');
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toContainText('Please enter an installment amount');

      // Invalid state notice appears
      await expect(page.locator('.invalid-state-box')).toBeVisible();

      // Typing new value works directly
      await amountNum.fill('15000');
      await expect(page.locator('#sip-future-value')).toBeVisible();
    });

    test('rejects fractional tenure years with whole-number message', async ({ page }) => {
      const yearsNum = page.locator('input[type="number"]').nth(2);
      await yearsNum.fill('12.5');

      const errorMsg = page.locator('#sip-calculator-app .field-error');
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toContainText('Duration must be a whole number of years');
    });

    test('step-up comparison clearly shows all 6 distinct metrics and plain-language explanation', async ({ page }) => {
      const stepUpNum = page.locator('input[type="number"]').nth(3);
      await stepUpNum.fill('10');

      const comparisonCard = page.locator('#sip-stepup-comparison');
      await expect(comparisonCard).toBeVisible();

      // Check all 6 distinct metrics
      await expect(page.locator('#adv-fixed-invested')).toBeVisible();
      await expect(page.locator('#adv-stepup-invested')).toBeVisible();
      await expect(page.locator('#adv-diff-invested')).toContainText('additional contributions invested');

      await expect(page.locator('#adv-fixed-corpus')).toBeVisible();
      await expect(page.locator('#adv-stepup-corpus')).toBeVisible();
      await expect(page.locator('#adv-diff-corpus')).toContainText('more wealth');

      await expect(page.locator('#adv-fixed-gain')).toBeVisible();
      await expect(page.locator('#adv-stepup-gain')).toBeVisible();
      await expect(page.locator('#adv-diff-gain')).toContainText('extra earnings');

      // Check plain-language disclaimer
      const disclaimer = page.locator('.advantage-disclaimer');
      await expect(disclaimer).toContainText('scenario comparison');
      await expect(disclaimer).toContainText('not proof of superior investment performance');
    });

    test('polite concise screen reader announcement updates on input', async ({ page }) => {
      const liveRegion = page.locator('#sip-live-announcement');
      await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      await expect(liveRegion).toContainText('SIP calculation updated');
    });
  });

  test.describe('2.4 Screen-Reader-Only Utility (.sr-only)', () => {
    test('external link helper text is visually hidden while present in accessible text', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');

      const srText = page.locator('header a.portfolio-link .sr-only');
      await expect(srText).toHaveCount(1);
      await expect(srText).toHaveText('(opens external investor portal in new window)');

      // Verify that the element has zero visible footprint (width/height <= 1px or clipped)
      const boundingBox = await srText.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(1);
      expect(boundingBox?.height).toBeLessThanOrEqual(1);
    });
  });

  test.describe('4. Lump Sum Calculator Island (/tools/lumpsum/)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/tools/lumpsum/');
    });

    test('stale GATE-B notice is removed and interactive calculator is live', async ({ page }) => {
      // Ensure no GATE-B text or banner
      const pageContent = await page.content();
      expect(pageContent).not.toContain('GATE-B');

      // Calculator app is mounted
      const app = page.locator('#lumpsum-calculator-app');
      await expect(app).toBeVisible();
    });

    test('calculates correct default outputs and updates when inputs change', async ({ page }) => {
      // Default: ₹1,00,000 for 10 years at 12%
      // FV = 100000 * (1.12)^10 = 310584.82 -> ₹3,10,585
      const futureVal = page.locator('#lumpsum-future-value');
      await expect(futureVal).toContainText('₹3,10,585');

      const investedVal = page.locator('#lumpsum-total-invested');
      await expect(investedVal).toContainText('₹1,00,000');

      const gainVal = page.locator('#lumpsum-total-gain');
      await expect(gainVal).toContainText('₹2,10,585');

      // Change principal to ₹2,00,000
      const principalInput = page.locator('input[type="number"]').first();
      await principalInput.fill('200000');
      // FV = 200000 * (1.12)^10 = 621169.64 -> ₹6,21,170
      await expect(futureVal).toContainText('₹6,21,170');
    });

    test('supports 0% return correctly', async ({ page }) => {
      const returnInput = page.locator('input[type="number"]').nth(1);
      await returnInput.fill('0');

      await expect(page.locator('#lumpsum-future-value')).toContainText('₹1,00,000');
      await expect(page.locator('#lumpsum-total-invested')).toContainText('₹1,00,000');
      await expect(page.locator('#lumpsum-total-gain')).toContainText('₹0');
    });

    test('expands and collapses year-by-year progression table', async ({ page }) => {
      const toggleBtn = page.locator('#toggle-lumpsum-schedule-btn');
      await expect(page.locator('#lumpsum-schedule-table')).not.toBeVisible();

      await toggleBtn.click();
      await expect(page.locator('#lumpsum-schedule-table')).toBeVisible();

      const rows = page.locator('#lumpsum-schedule-table tbody tr');
      await expect(rows).toHaveCount(10);

      await toggleBtn.click();
      await expect(page.locator('#lumpsum-schedule-table')).not.toBeVisible();
    });

    test('reset button restores documented defaults', async ({ page }) => {
      const principalInput = page.locator('input[type="number"]').first();
      await principalInput.fill('500000');

      const resetBtn = page.locator('#reset-lumpsum-btn');
      await resetBtn.click();

      await expect(principalInput).toHaveValue('100000');
      await expect(page.locator('#lumpsum-future-value')).toContainText('₹3,10,585');
    });
  });

  test.describe('5. Goal Planner Island (/plan/)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/plan/');
      await page.waitForSelector('astro-island:not([ssr])');
    });

    test('jump link navigates to #single-goal-planner section', async ({ page }) => {
      const jumpLink = page.locator('a[href="#single-goal-planner"]');
      await expect(jumpLink).toBeVisible();

      const plannerSection = page.locator('#single-goal-planner');
      await expect(plannerSection).toBeVisible();
    });

    test('initial load starts in neutral blank state without pre-computed results', async ({ page }) => {
      const costInput = page.locator('input[type="number"]').first();
      await expect(costInput).toHaveValue('');

      const emptyState = page.locator('#goal-empty-state');
      await expect(emptyState).toBeVisible();

      const futureCost = page.locator('#goal-future-cost');
      await expect(futureCost).toHaveCount(0);
    });

    test('calculates single-goal funding deficit and required monthly SIP when example is loaded', async ({ page }) => {
      // Click Load illustrative example
      const loadExampleBtn = page.locator('#load-goal-example-btn');
      await loadExampleBtn.click();

      // Verify banner
      const banner = page.locator('#goal-example-banner');
      await expect(banner).toBeVisible();
      await expect(banner).toContainText('Illustrative example loaded — these are not your figures.');

      // Defaults: Goal cost 25L, 10y, 8% inflation, 12% return, 2L existing savings
      // Future goal cost = 25L * (1.08)^10 = 53,97,312
      // Savings FV = 2L * (1.12)^10 = 6,21,170
      // Net deficit = 53,97,312 - 6,21,170 = 47,76,142
      // Required SIP is approx ₹21,317/mo
      const futureCost = page.locator('#goal-future-cost');
      await expect(futureCost).toContainText('₹53,97,312');

      const savingsFV = page.locator('#goal-savings-fv');
      await expect(savingsFV).toContainText('₹6,21,170');

      const deficit = page.locator('#goal-net-deficit');
      await expect(deficit).toContainText('₹47,76,143');

      const requiredSIP = page.locator('#goal-required-sip');
      await expect(requiredSIP).toContainText('₹21,319');
    });

    test('editing a field dismisses the illustrative example banner', async ({ page }) => {
      const loadExampleBtn = page.locator('#load-goal-example-btn');
      await loadExampleBtn.click();

      const banner = page.locator('#goal-example-banner');
      await expect(banner).toBeVisible();

      const costInput = page.locator('input[type="number"]').first();
      await costInput.fill('3000000');

      await expect(banner).toHaveCount(0);
    });

    test('handles fully funded goal when existing savings cover future cost', async ({ page }) => {
      const loadExampleBtn = page.locator('#load-goal-example-btn');
      await loadExampleBtn.click();

      // Set existing savings to ₹30,00,000 (which will grow to ~₹93L, exceeding ₹54L goal)
      const savingsInput = page.locator('input[id*="savings-num"]');
      await savingsInput.fill('3000000');

      const requiredSIP = page.locator('#goal-required-sip');
      await expect(requiredSIP).toContainText('Fully Funded');

      const deficit = page.locator('#goal-net-deficit');
      await expect(deficit).toContainText('₹0');
    });

    test('clear all button restores neutral blank state and removes calculated results', async ({ page }) => {
      const loadExampleBtn = page.locator('#load-goal-example-btn');
      await loadExampleBtn.click();

      const costInput = page.locator('input[type="number"]').first();
      await expect(costInput).toHaveValue('2500000');

      const resetBtn = page.locator('#reset-goal-btn');
      await resetBtn.click();

      await expect(costInput).toHaveValue('');
      await expect(page.locator('#goal-empty-state')).toBeVisible();
      await expect(page.locator('#goal-future-cost')).toHaveCount(0);
    });
  });

  test.describe('Zero Persistence Invariants', () => {
    test('no calculation inputs leak into localStorage, sessionStorage, cookies, or URL search params', async ({ page }) => {
      await page.goto('/tools/sip/');

      // Modify values
      const amountNum = page.locator('input[type="number"]').first();
      await amountNum.fill('75000');

      // Verify URL has no search params
      expect(page.url()).not.toContain('75000');
      expect(page.url()).not.toContain('?');

      // Verify localStorage is empty of inputs
      const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
      expect(localStorageKeys.length).toBe(0);

      // Verify sessionStorage is empty
      const sessionStorageKeys = await page.evaluate(() => Object.keys(sessionStorage));
      expect(sessionStorageKeys.length).toBe(0);

      // Verify cookies
      const cookies = await page.context().cookies();
      expect(cookies.length).toBe(0);
    });
  });
});
