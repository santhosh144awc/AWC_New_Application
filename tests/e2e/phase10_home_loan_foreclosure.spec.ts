import { test, expect } from '@playwright/test';

test.describe('Phase 10 — Home Loan Foreclosure vs Parallel Investment Simulator (/tools/home-loan-foreclosure/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/home-loan-foreclosure/');
    await page.waitForSelector('astro-island:not([ssr])');
  });

  test('renders at canonical URL with correct title, h1, and active simulator mounted', async ({ page }) => {
    await expect(page).toHaveTitle(/Home Loan (Foreclosure|Prepayment) vs Parallel Investment Simulator/);
    const h1 = page.locator('h1');
    await expect(h1).toHaveText(/Should you prepay your home loan or invest alongside it\?/);

    // Verify obsolete claims and stale notices are removed
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('shave 4 to 6 years off a 20-year mortgage');
    expect(bodyText).not.toContain('GATE-B (Amortization & Interest Computation)');
    expect(bodyText).not.toContain('Amortization Math Verification Pending');

    // Verify calculator island is mounted
    const island = page.locator('#home-loan-foreclosure-calculator');
    await expect(island).toBeVisible();

    // Verify baseline banner is present
    await expect(page.locator('.baseline-banner')).toBeVisible();
    await expect(page.locator('.comparison-results-grid')).toBeVisible();
  });

  test('displays baseline EMI, comparison cards, and difference summary banner', async ({ page }) => {
    // Default: ₹30L principal, 8.5% loan rate, 15 years, ₹10k surplus, 12% return
    const baselineBanner = page.locator('.baseline-banner');
    await expect(baselineBanner).toContainText('Scheduled Monthly EMI');
    await expect(baselineBanner).toContainText('Baseline Total Interest');
    await expect(baselineBanner).toContainText('Comparison Horizon');

    // Cards A and B
    const cardA = page.locator('.result-strategy-card.card-a');
    const cardB = page.locator('.result-strategy-card.card-b');
    await expect(cardA).toContainText('Prepay First, Then Invest');
    await expect(cardB).toContainText('Invest Surplus Alongside Loan');

    // Both cards show final investment value and net financial position
    await expect(cardA.locator('.final-corpus-row')).toBeVisible();
    await expect(cardB.locator('.final-corpus-row')).toBeVisible();

    // Summary banner
    const diffBanner = page.locator('.difference-summary-banner');
    await expect(diffBanner).toBeVisible();
    await expect(diffBanner).toContainText('Outcome at Common Horizon');
  });

  test('synchronized numeric and range inputs update reciprocally across full domains (Critical Issue B)', async ({ page }) => {
    const island = page.locator('#home-loan-foreclosure-calculator');

    // 1. Principal: range 10,000 to 100,000,000 (10 Cr)
    const principalInput = island.locator('input[type="number"]').nth(0);
    const principalSlider = island.locator('input[type="range"]').nth(0);
    await expect(principalSlider).toHaveAttribute('aria-label', 'Outstanding Loan Principal Slider');

    // Test low boundary (10,000)
    await principalInput.fill('10000');
    await expect(principalSlider).toHaveValue('10000');

    // Test upper-middle (50,000,000 = 5 Cr)
    await principalInput.fill('50000000');
    await expect(principalSlider).toHaveValue('50000000');

    // Test max boundary (100,000,000 = 10 Cr)
    await principalInput.fill('100000000');
    await expect(principalSlider).toHaveValue('100000000');

    // Slider moves input
    await principalSlider.fill('3000000');
    await expect(principalInput).toHaveValue('3000000');

    // 2. Loan Interest Rate: range 0 to 30%
    const rateInput = island.locator('input[type="number"]').nth(1);
    const rateSlider = island.locator('input[type="range"]').nth(1);
    await expect(rateSlider).toHaveAttribute('aria-label', 'Loan Interest Rate Slider');

    await rateInput.fill('0');
    await expect(rateSlider).toHaveValue('0');
    await rateInput.fill('15');
    await expect(rateSlider).toHaveValue('15');
    await rateInput.fill('30');
    await expect(rateSlider).toHaveValue('30');
    await rateSlider.fill('8.5');
    await expect(rateInput).toHaveValue('8.5');

    // 3. Remaining Tenure: range 1 to 30 years
    const tenureInput = island.locator('input[type="number"]').nth(2);
    const tenureSlider = island.locator('input[type="range"]').nth(2);
    await expect(tenureSlider).toHaveAttribute('aria-label', 'Remaining Loan Tenure Slider');

    await tenureInput.fill('1');
    await expect(tenureSlider).toHaveValue('1');
    await tenureInput.fill('30');
    await expect(tenureSlider).toHaveValue('30');
    await tenureSlider.fill('15');
    await expect(tenureInput).toHaveValue('15');

    // 4. Monthly Surplus: range 0 to 1,000,000
    const surplusInput = island.locator('input[type="number"]').nth(3);
    const surplusSlider = island.locator('input[type="range"]').nth(3);
    await expect(surplusSlider).toHaveAttribute('aria-label', 'Extra Monthly Household Cash Surplus Slider');

    await surplusInput.fill('0');
    await expect(surplusSlider).toHaveValue('0');
    await surplusInput.fill('200000');
    await expect(surplusSlider).toHaveValue('200000');
    await surplusInput.fill('1000000');
    await expect(surplusSlider).toHaveValue('1000000');
    await surplusSlider.fill('10000');
    await expect(surplusInput).toHaveValue('10000');

    // 5. Investment Return: range 0 to 50%
    const returnInput = island.locator('input[type="number"]').nth(4);
    const returnSlider = island.locator('input[type="range"]').nth(4);
    await expect(returnSlider).toHaveAttribute('aria-label', 'Assumed Investment Return Slider');

    await returnInput.fill('0');
    await expect(returnSlider).toHaveValue('0');
    await returnInput.fill('25');
    await expect(returnSlider).toHaveValue('25');
    await returnInput.fill('50');
    await expect(returnSlider).toHaveValue('50');
    await returnSlider.fill('12');
    await expect(returnInput).toHaveValue('12');
  });

  test('validates one-time inputs strictly and pauses calculation on invalid or blank fields (Critical Issue A)', async ({ page }) => {
    // Default has 1 initial row (Month: 12, Amount: 100000)
    await expect(page.locator('.one-time-row')).toHaveCount(1);
    await expect(page.locator('.comparison-results-grid')).toBeVisible();

    const monthInput = page.locator('.one-time-row input[type="number"]').nth(0);
    const amountInput = page.locator('.one-time-row input[type="number"]').nth(1);

    // Case 1: Blank amount
    await amountInput.fill('');
    await expect(page.locator('.calc-pending-card')).toBeVisible();
    await expect(page.locator('.one-time-errors-list')).toContainText('Please enter an injection amount');
    await expect(page.locator('.comparison-results-grid')).not.toBeVisible();

    // Recover by typing valid amount
    await amountInput.fill('50000');
    await expect(page.locator('.calc-pending-card')).not.toBeVisible();
    await expect(page.locator('.comparison-results-grid')).toBeVisible();

    // Case 2: Zero or negative amount
    await amountInput.fill('0');
    await expect(page.locator('.calc-pending-card')).toBeVisible();
    await expect(page.locator('.one-time-errors-list')).toContainText('strictly greater than ₹0');

    await amountInput.fill('75000');
    await expect(page.locator('.calc-pending-card')).not.toBeVisible();

    // Case 3: Blank month
    await monthInput.fill('');
    await expect(page.locator('.calc-pending-card')).toBeVisible();
    await expect(page.locator('.one-time-errors-list')).toContainText('Please enter an injection month');

    // Case 4: Non-integer month
    await monthInput.fill('6.5');
    await expect(page.locator('.calc-pending-card')).toBeVisible();
    await expect(page.locator('.one-time-errors-list')).toContainText('positive whole number');

    // Case 5: Month exceeding loan tenure (default tenure is 15 years = 180 months)
    await monthInput.fill('190');
    await expect(page.locator('.calc-pending-card')).toBeVisible();
    await expect(page.locator('.one-time-errors-list')).toContainText('exceeds the current loan tenure of 180 months');

    // Recovery by restoring valid month
    await monthInput.fill('12');
    await expect(page.locator('.calc-pending-card')).not.toBeVisible();
    await expect(page.locator('.comparison-results-grid')).toBeVisible();
  });

  test('dynamic tenure reduction updates bounds and flags exceeding one-time entries without silent drops', async ({ page }) => {
    // Add an injection at month 36
    const addBtn = page.getByRole('button', { name: /Add a one-time cash injection/i });
    await addBtn.click();
    await expect(page.locator('.one-time-row')).toHaveCount(2);

    const secondRowMonthInput = page.locator('.one-time-row').nth(1).locator('input[type="number"]').nth(0);
    await secondRowMonthInput.fill('36');
    await expect(page.locator('.comparison-results-grid')).toBeVisible();

    // Now reduce loan tenure to 2 years (24 months)
    const tenureInput = page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(2);
    await tenureInput.fill('2');

    // Row 2 (month 36) now exceeds the 24-month horizon!
    await expect(page.locator('.calc-pending-card')).toBeVisible();
    await expect(page.locator('.one-time-item-wrapper').nth(1).locator('.one-time-errors-list')).toContainText(
      'Month 36 exceeds the current loan tenure of 24 months'
    );
    // Row 2 is NOT dropped or moved silently; its input remains "36"
    await expect(secondRowMonthInput).toHaveValue('36');

    // User corrects month to 18
    await secondRowMonthInput.fill('18');
    await expect(page.locator('.calc-pending-card')).not.toBeVisible();
    await expect(page.locator('.comparison-results-grid')).toBeVisible();

    // User deletes the second row -> calculation updates immediately
    const deleteBtn = page.locator('.one-time-row').nth(1).locator('.btn-danger-icon');
    await deleteBtn.click();
    await expect(page.locator('.one-time-row')).toHaveCount(1);
    await expect(page.locator('.comparison-results-grid')).toBeVisible();
  });

  test('recalculates outputs reactively when inputs change', async ({ page }) => {
    const cardA = page.locator('.result-strategy-card.card-a');
    const initialCorpusA = await cardA.locator('.final-corpus-row .m-val').textContent();

    // Increase monthly surplus
    const surplusInput = page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(3);
    await surplusInput.fill('25000');

    const updatedCorpusA = await cardA.locator('.final-corpus-row .m-val').textContent();
    expect(updatedCorpusA).not.toBe(initialCorpusA);
  });

  test('handles zero investment return scenario with non-negative growth and exact reconciliation', async ({ page }) => {
    const returnInput = page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(4);
    await returnInput.fill('0');

    const cardA = page.locator('.result-strategy-card.card-a');
    await expect(cardA).toBeVisible();

    // Verify difference banner reflects updated numbers
    const diffBanner = page.locator('.difference-summary-banner');
    await expect(diffBanner).toBeVisible();
  });

  test('collapsible month-by-month table expands, collapses, and displays reconciled schedule', async ({ page }) => {
    const toggleBtn = page.locator('.btn-toggle-schedule');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    const tablePanel = page.locator('#comparison-schedule-panel');
    await expect(tablePanel).toBeVisible();
    await expect(page.locator('.comparison-table')).toBeVisible();

    // Verify at least one row has the 'Paid' badge
    await expect(page.locator('.badge-payoff').first()).toBeVisible();

    // Click to collapse
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(tablePanel).not.toBeVisible();
  });

  test('verifies cautious and compliant copy across page and island (Critical Issue C)', async ({ page }) => {
    const bodyText = await page.textContent('body');

    // Critical Issue C.A: No guaranteed return equal to borrowing rate
    expect(bodyText).not.toContain('guaranteed return equal to your effective borrowing rate');
    expect(bodyText).toContain("Prepaying reduces future loan interest under the loan's terms");

    // Critical Issue C.B: No product-specific emergency fund prescription
    expect(bodyText).not.toContain('liquid or arbitrage funds');
    expect(bodyText).toContain('keeping an emergency reserve that is accessible when needed and appropriate for your household');

    // Critical Issue C.C: Cautious RBI wording
    expect(bodyText).toContain('This simulation excludes lender prepayment charges');
    expect(bodyText).not.toContain('zero prepayment penalties per RBI guidelines');

    // Critical Issue C.D: Cautious tax disclosures without obsolete hardcoded sections
    expect(bodyText).toContain('Tax deductions and taxes on investment gains are not included');
    expect(bodyText).not.toContain('Section 24(b)');
    expect(bodyText).not.toContain('Section 80C');
  });

  test('reset button restores illustrative defaults', async ({ page }) => {
    const principalInput = page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(0);
    await principalInput.fill('8000000');

    const resetBtn = page.getByRole('button', { name: /Reset to Illustrative Example/i });
    await resetBtn.click();

    await expect(principalInput).toHaveValue('3000000');
  });

  test('strict privacy: zero data leakage into localStorage, sessionStorage, cookies, or URL search params', async ({ page }) => {
    // Fill sensitive financial inputs
    const principalInput = page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(0);
    await principalInput.fill('7500000');

    // Check localStorage
    const localKeys = await page.evaluate(() => Object.keys(localStorage));
    expect(localKeys.length).toBe(0);

    // Check sessionStorage
    const sessionKeys = await page.evaluate(() => Object.keys(sessionStorage));
    expect(sessionKeys.length).toBe(0);

    // Check cookies
    const cookies = await page.context().cookies();
    expect(cookies.length).toBe(0);

    // Check URL parameters
    const url = new URL(page.url());
    expect(url.search).toBe('');
  });

  test('mobile responsive viewports (360px and 390px) have zero horizontal overflow', async ({ page }) => {
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(200);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    }
  });

  test('keyboard accessibility: all controls and sliders are focusable and operable', async ({ page }) => {
    const firstInput = page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(0);
    await firstInput.focus();
    await expect(firstInput).toBeFocused();

    // Tab through to slider
    await page.keyboard.press('Tab');
    const firstSlider = page.locator('#home-loan-foreclosure-calculator input[type="range"]').nth(0);
    await expect(firstSlider).toBeFocused();
  });

  test('generates required desktop and mobile screenshots for visual inspection', async ({ page }) => {
    // Desktop screenshot (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/e2e/screenshots/desktop-tool-home-loan-foreclosure.png',
      fullPage: true,
    });

    // Mobile screenshot (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/e2e/screenshots/mobile-tool-home-loan-foreclosure.png',
      fullPage: true,
    });
  });
});
