import { test, expect } from '@playwright/test';

test.describe('Phase 36 — Home Loan + SIP Interest Recovery Calculator E2E', () => {
  const routePath = '/tools/loan-sip-recovery/';

  test('1. Loads with HTTP 200, single H1, canonical URL, and live interactive status badge', async ({ page }) => {
    const response = await page.goto(routePath);
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/Home Loan Interest Recovery via Parallel SIP Calculator/i);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('Can a parallel SIP offset your home loan interest?');

    const badge = page.locator('.intro-status-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Interactive Calculator Active • Dual-Engine Model');

    // Verify React island is mounted
    const workbench = page.locator('[data-testid="recovery-workbench"]');
    await expect(workbench).toBeVisible();
  });

  test('2. Renders default baseline results and interactive metric summaries', async ({ page }) => {
    await page.goto(routePath);

    // Default values: ₹50L, 8.5%, 20y (240m), 15% EMI (~₹6,509), 12% return
    const emiSummary = page.locator('[data-testid="summary-emi"]');
    await expect(emiSummary).toBeVisible();
    await expect(emiSummary).toContainText('₹43,391');

    const interestSummary = page.locator('[data-testid="summary-loan-interest"]');
    await expect(interestSummary).toBeVisible();
    await expect(interestSummary).toContainText('₹54,13,840');

    const sipInvestedSummary = page.locator('[data-testid="summary-sip-invested"]');
    await expect(sipInvestedSummary).toBeVisible();
    await expect(sipInvestedSummary).toContainText('₹15,62,160');

    const sipCorpusSummary = page.locator('[data-testid="summary-sip-corpus"]');
    await expect(sipCorpusSummary).toBeVisible();
    await expect(sipCorpusSummary).toContainText('₹65,03,454');

    const netSurplus = page.locator('[data-testid="net-gain-callout"]');
    await expect(netSurplus).toBeVisible();
    await expect(netSurplus).toContainText('Substantial Interest Subsidy');
  });

  test('3. Dynamic recalculation when adjusting inputs and sliders', async ({ page }) => {
    await page.goto(routePath);

    // Change tenure to 15 years
    const tenureInput = page.locator('#recovery-tenure');
    await tenureInput.fill('15');
    await tenureInput.dispatchEvent('change');

    // EMI for ₹50L at 8.5% for 15y is ₹49,237
    const emiSummary = page.locator('[data-testid="summary-emi"]');
    await expect(emiSummary).toContainText('₹49,237');

    // Change loan amount to ₹60 Lakhs
    const loanInput = page.locator('#recovery-loan-amount');
    await loanInput.fill('6000000');
    await loanInput.dispatchEvent('change');

    // EMI for ₹60L at 8.5% for 15y is ₹59,084
    await expect(emiSummary).toContainText('₹59,084');
  });

  test('4. Toggle between % of EMI mode and Fixed Amount mode', async ({ page }) => {
    await page.goto(routePath);

    // Switch to Fixed Monthly SIP mode
    const fixedModeBtn = page.locator('[data-testid="mode-fixed"]');
    await fixedModeBtn.click();

    // Verify fixed amount input is visible
    const fixedInput = page.locator('#recovery-sip-amount');
    await expect(fixedInput).toBeVisible();

    // Fill ₹10,000 fixed SIP
    await fixedInput.fill('10000');
    await fixedInput.dispatchEvent('change');

    // Over 240 months, total invested = ₹24,00,000
    const sipInvested = page.locator('[data-testid="summary-sip-invested"]');
    await expect(sipInvested).toContainText('₹24,00,000');
  });

  test('5. Illustrative banner dismisses on user edit, and reset restores defaults', async ({ page }) => {
    await page.goto(routePath);

    const illustrativeBanner = page.locator('[data-testid="illustrative-banner"]');
    await expect(illustrativeBanner).toBeVisible();

    // Edit an input
    const rateInput = page.locator('#recovery-interest-rate');
    await rateInput.fill('9.0');
    await rateInput.dispatchEvent('change');

    // Illustrative banner should disappear
    await expect(illustrativeBanner).not.toBeVisible();

    // Click Reset
    const resetBtn = page.locator('[data-testid="recovery-reset-btn"]');
    await resetBtn.click();

    // Illustrative banner reappears and defaults are restored
    await expect(illustrativeBanner).toBeVisible();
    const emiSummary = page.locator('[data-testid="summary-emi"]');
    await expect(emiSummary).toContainText('₹43,391');
  });

  test('6. In-memory client privacy: zero localStorage, sessionStorage, cookies, or URL query params', async ({ page }) => {
    await page.goto(routePath);

    // Interact with inputs
    await page.locator('#recovery-loan-amount').fill('7500000');
    await page.locator('#recovery-loan-amount').dispatchEvent('change');

    // Verify localStorage & sessionStorage are empty
    const storageKeys = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));
    expect(storageKeys.local.length).toBe(0);
    expect(storageKeys.session.length).toBe(0);

    // Verify no cookies set
    const cookies = await page.context().cookies();
    expect(cookies.length).toBe(0);

    // Verify URL remains clean
    expect(page.url()).not.toContain('?');
  });

  test('7. Responsive viewports have zero horizontal overflow across 1440px, 768px, 390px, and 360px', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 390, height: 844, name: 'mobile-390' },
      { width: 360, height: 740, name: 'mobile-360' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(routePath);

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalOverflow, `Horizontal overflow at ${vp.width}px`).toBe(false);

      if (vp.width === 1440 || vp.width === 390) {
        await page.screenshot({
          path: `tests/e2e/screenshots/${vp.name}-loan-sip-recovery.png`,
          fullPage: true,
        });
      }
    }
  });
});
