import { test, expect } from '@playwright/test';

test.describe('Phase 18.2 — Route Registry, Status Badge & Directory Consistency E2E', () => {

  test('tools directory (/tools/) truthfully distinguishes interactive tools from blocked preview shells', async ({ page }) => {
    await page.goto('/tools/');

    // Page Intro status
    await expect(page.locator('.intro-status-badge')).toContainText('Interactive Simulators & Planning Directory');

    // 1. Life insurance planner is 4-step and interactive
    const lifeCard = page.locator('.tool-card').filter({ hasText: 'Life Insurance Needs Audit' });
    await expect(lifeCard).toBeVisible();
    await expect(lifeCard).toContainText('4-step');
    await expect(lifeCard).not.toContainText('5-step');
    await expect(lifeCard.locator('.tool-badge')).toHaveText(/Interactive Planner Active|Live planner/i);
    await expect(lifeCard.locator('.btn-tool')).toHaveText(/Launch Planner|Estimate needs/i);

    // 2. Net worth is interactive
    const netWorthCard = page.locator('.tool-card').filter({ hasText: 'Productive Net Worth Balance Sheet' });
    await expect(netWorthCard).toBeVisible();
    await expect(netWorthCard.locator('.tool-badge')).toHaveText(/Interactive Diagnostic Active|Live diagnostic/i);
    await expect(netWorthCard.locator('.btn-tool')).toHaveText(/Launch Balance Sheet|Open balance sheet/i);

    // 3. SIP, Lump Sum, SIP Growth, and Foreclosure are interactive
    const sipCard = page.locator('.tool-card').filter({ hasText: 'SIP Wealth Simulator' });
    await expect(sipCard.locator('.tool-badge')).toHaveText(/Interactive Calculator Active|Live calculator/i);
    await expect(sipCard.locator('.btn-tool')).toHaveText(/Launch Calculator|Try a scenario/i);

    const lumpsumCard = page.locator('.tool-card').filter({ hasText: 'Lump Sum Investment Growth' });
    await expect(lumpsumCard.locator('.tool-badge')).toHaveText(/Interactive Calculator Active|Live calculator/i);

    const sipGrowthCard = page.locator('.tool-card').filter({ hasText: 'Advanced SIP Growth' });
    await expect(sipGrowthCard.locator('.tool-badge')).toHaveText(/Interactive Calculator Active|Live calculator/i);

    const foreclosureCard = page.locator('.tool-card').filter({ hasText: 'Home Loan Foreclosure vs SIP' });
    await expect(foreclosureCard.locator('.tool-badge')).toHaveText(/Interactive Calculator Active|Live calculator/i);

    // 4. SWP is an active interactive calculator
    const swpCard = page.locator('.tool-card').filter({ hasText: 'SWP Longevity Simulator' });
    await expect(swpCard.locator('.tool-badge')).toHaveText(/Interactive Calculator Active|Live calculator/i);
    await expect(swpCard.locator('.btn-tool')).toHaveText(/Simulate SWP|Launch Calculator/i);

    // 5. Loan Recovery has scenario wording, no 100% guarantee, and live calculator badge
    const loanRecoveryCard = page.locator('.tool-card').filter({ hasText: 'Loan Interest Recovery SIP' });
    await expect(loanRecoveryCard).not.toContainText('recover 100%');
    await expect(loanRecoveryCard.locator('.tool-badge')).toHaveText(/Interactive Calculator Active|Live calculator/i);
    await expect(loanRecoveryCard.locator('.btn-tool')).toHaveText(/Calculate recovery|Launch Calculator/i);

    // 6. Loan vs Invest is an active interactive calculator
    const loanVsInvestCard = page.locator('.tool-card').filter({ hasText: 'Loan vs Investment Trade-off' });
    await expect(loanVsInvestCard.locator('.tool-badge')).toHaveText(/Interactive Calculator Active|Live calculator/i);
    await expect(loanVsInvestCard.locator('.btn-tool')).toHaveText(/Compare options|Launch Calculator/i);
  });

  test('milestone goal planning hub (/plan/) shows interactive milestone planners', async ({ page }) => {
    await page.goto('/plan/');

    // Page Intro status
    await expect(page.locator('.intro-status-badge')).toContainText('Milestone Planning Hub • Interactive Planners Active');

    // 1. Children's Future is active
    const childrenCard = page.locator('.roadmap-card').filter({ hasText: "Children's Future" });
    await expect(childrenCard.locator('.status-text')).toContainText('Interactive Planner Active');
    await expect(childrenCard.locator('.btn-card')).toContainText('Launch Milestone Planner →');

    // 2. Home Purchase is active with tax relief excluded
    const homeCard = page.locator('.roadmap-card').filter({ hasText: 'Home Purchase' });
    await expect(homeCard.locator('.status-text')).toContainText('Interactive Planner Active');
    await expect(homeCard.locator('.status-text')).toContainText('Tax Relief Excluded');
    await expect(homeCard.locator('.btn-card')).toContainText('Launch Milestone Planner →');

    // 3. Retirement Accumulation & Regular Income are active interactive planners
    const retireCard = page.locator('.roadmap-card').filter({ hasText: 'Retirement Accumulation' });
    await expect(retireCard.locator('.status-text')).toContainText('Interactive Planner Active');
    await expect(retireCard.locator('.btn-card')).toContainText('Launch Milestone Planner →');

    const retireIncomeCard = page.locator('.roadmap-card').filter({ hasText: 'Retirement Regular Income' });
    await expect(retireIncomeCard.locator('.status-text')).toContainText('Interactive Planner Active');
    await expect(retireIncomeCard.locator('.btn-card')).toContainText('Launch Milestone Planner →');
  });

  test('retirement, retirement-income, and SWP destination routes render interactive calculators', async ({ page }) => {
    // /plan/retirement/
    await page.goto('/plan/retirement/');
    await expect(page.locator('.intro-status-badge')).toContainText('Interactive Planner Active');
    await expect(page.locator('#retirement-accumulation-calculator')).toBeVisible();
    await expect(page.locator('input[type="range"], input[type="number"]').first()).toBeVisible();

    // /plan/retirement-income/
    await page.goto('/plan/retirement-income/');
    await expect(page.locator('.intro-status-badge')).toContainText('Interactive Planner Active');
    await expect(page.locator('#retirement-distribution-calculator')).toBeVisible();
    await expect(page.locator('input[type="range"], input[type="number"]').first()).toBeVisible();

    // /tools/swp/
    await page.goto('/tools/swp/');
    await expect(page.locator('.intro-status-badge')).toContainText('Interactive Calculator Active');
    await expect(page.locator('#swp-longevity-simulator')).toBeVisible();
    await expect(page.locator('input[type="range"], input[type="number"]').first()).toBeVisible();
  });

  test('responsive layout at 1440px, 390px, and 360px has zero horizontal overflow', async ({ page }) => {
    const testRoutes = ['/tools/', '/plan/'];

    for (const width of [1440, 390, 360]) {
      await page.setViewportSize({ width, height: 900 });

      for (const routePath of testRoutes) {
        await page.goto(routePath);
        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalOverflow, `Horizontal overflow on ${routePath} at ${width}px`).toBe(false);
      }
    }
  });

  test('capture desktop and mobile screenshots for visual QA evidence', async ({ page }) => {
    // Desktop Viewport (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/');
    await page.screenshot({ path: 'tests/e2e/screenshots/desktop-tools-directory-phase18-2.png', fullPage: true });

    await page.goto('/plan/');
    await page.screenshot({ path: 'tests/e2e/screenshots/desktop-plan-hub-phase18-2.png', fullPage: true });

    // Mobile Viewport (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/');
    await page.screenshot({ path: 'tests/e2e/screenshots/mobile-tools-directory-phase18-2.png', fullPage: true });

    await page.goto('/plan/');
    await page.screenshot({ path: 'tests/e2e/screenshots/mobile-plan-hub-phase18-2.png', fullPage: true });

    // Small Mobile Viewport (360px)
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/tools/');
    await page.screenshot({ path: 'tests/e2e/screenshots/mobile-360-tools-directory-phase18-2.png', fullPage: true });
  });
});
