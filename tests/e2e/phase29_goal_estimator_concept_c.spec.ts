import { test, expect } from '@playwright/test';

test.describe('Phase 10 Concept C — Single-Goal Estimator UX Redesign (/plan/)', () => {

  test('1. Canonical route /plan/ returns successfully and has a single semantic H1', async ({ page }) => {
    await page.goto('/plan/');
    await expect(page).toHaveTitle(/Your Financial Journey & Goal Planners — Ant Wealth Creation/);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('Your financial journey moves at your pace');

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('2. Single-goal estimator is reachable from the jump link', async ({ page }) => {
    await page.goto('/plan/');
    const jumpLink = page.locator('a[href="#single-goal-planner"]');
    await expect(jumpLink).toBeVisible();
    await expect(jumpLink).toContainText('Jump to the single-goal estimator');

    const plannerSection = page.locator('#single-goal-planner');
    await expect(plannerSection).toBeVisible();

    const heading = plannerSection.locator('#goal-planner-heading');
    await expect(heading).toHaveText('Single-Goal Milestone Estimator');
  });

  test('3. Fresh load starts empty and contains no pre-computed output or sample banner', async ({ page }) => {
    await page.goto('/plan/');

    const app = page.locator('#goal-planner-app');
    await expect(app).toBeVisible();

    // Verify all 5 number inputs start blank
    const numberInputs = app.locator('input[type="number"]');
    await expect(numberInputs).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(numberInputs.nth(i)).toHaveValue('');
    }

    // Verify empty state is rendered
    const emptyState = app.locator('#goal-empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Ready to Estimate Your Goal');

    // Verify banner and results are not present
    await expect(app.locator('#goal-example-banner')).toHaveCount(0);
    await expect(app.locator('#goal-future-cost')).toHaveCount(0);
    await expect(app.locator('#goal-required-sip')).toHaveCount(0);
  });

  test('4. Explicit illustrative-example action loads canonical example and displays conspicuous banner', async ({ page }) => {
    await page.goto('/plan/');

    // Click Load illustrative example
    await page.click('#load-goal-example-btn');

    // Conspicuous illustrative banner
    const banner = page.locator('#goal-example-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Illustrative example loaded — these are not your figures.');

    // Inputs populated with canonical values
    const numberInputs = page.locator('#goal-planner-app input[type="number"]');
    await expect(numberInputs.nth(0)).toHaveValue('2500000'); // Cost today
    await expect(numberInputs.nth(1)).toHaveValue('10');      // Years
    await expect(numberInputs.nth(2)).toHaveValue('200000');  // Existing savings
    await expect(numberInputs.nth(3)).toHaveValue('8');       // Inflation
    await expect(numberInputs.nth(4)).toHaveValue('12');      // Return
  });

  test('5. Clear all removes illustrative example state and restores neutral empty workbench', async ({ page }) => {
    await page.goto('/plan/');
    await page.click('#load-goal-example-btn');
    await expect(page.locator('#goal-required-sip')).toBeVisible();

    // Click Clear all
    const clearBtn = page.locator('#reset-goal-btn');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Inputs reset to empty
    const numberInputs = page.locator('#goal-planner-app input[type="number"]');
    await expect(numberInputs.nth(0)).toHaveValue('');
    await expect(numberInputs.nth(4)).toHaveValue('');

    // Banner dismissed, empty state restored, results cleared
    await expect(page.locator('#goal-example-banner')).toHaveCount(0);
    await expect(page.locator('#goal-empty-state')).toBeVisible();
    await expect(page.locator('#goal-required-sip')).toHaveCount(0);
  });

  test('6. Canonical example computes exact engine results across all metrics', async ({ page }) => {
    await page.goto('/plan/');
    await page.click('#load-goal-example-btn');

    const app = page.locator('#goal-planner-app');

    // Canonical calculations:
    // Future goal cost = 25,00,000 * (1.08)^10 = ₹53,97,312
    const futureCostEl = app.locator('#goal-future-cost');
    await expect(futureCostEl).toBeVisible();
    await expect(futureCostEl).toHaveText('₹53,97,312');

    // Savings future value = 2,00,000 * (1.12)^10 = ₹6,21,170
    const savingsFvEl = app.locator('#goal-savings-fv');
    await expect(savingsFvEl).toBeVisible();
    await expect(savingsFvEl).toHaveText('₹6,21,170');

    // Net funding deficit = 53,97,312 - 6,21,170 = ₹47,76,143
    const deficitEl = app.locator('#goal-net-deficit');
    await expect(deficitEl).toBeVisible();
    await expect(deficitEl).toHaveText('₹47,76,143');

    // Required monthly SIP = ₹21,319
    const requiredSipEl = app.locator('#goal-required-sip');
    await expect(requiredSipEl).toBeVisible();
    await expect(requiredSipEl).toHaveText('₹21,319');

    // Out-of-pocket fresh SIP contributions = ₹25,58,238
    const contributionsEl = app.locator('#goal-sip-contributions');
    await expect(contributionsEl).toBeVisible();
    await expect(contributionsEl).toHaveText('₹25,58,238');
  });

  test('7. Editing inputs updates calculation and invalid input invalidates output visibly', async ({ page }) => {
    await page.goto('/plan/');
    await page.click('#load-goal-example-btn');
    await expect(page.locator('#goal-example-banner')).toBeVisible();

    const costInput = page.locator('#goal-planner-app input[type="number"]').nth(0);

    // Editing cost dismisses banner and updates output
    await costInput.fill('3000000');
    await expect(page.locator('#goal-example-banner')).toHaveCount(0);
    // Future cost for 30L at 8% over 10y = ₹64,76,775
    await expect(page.locator('#goal-future-cost')).toHaveText('₹64,76,775');

    // Invalid input (cost below min bounds ₹50,000)
    await costInput.fill('1000');
    await expect(page.locator('.field-error-msg')).toBeVisible();
    await expect(page.locator('#goal-future-cost')).toHaveCount(0);
    await expect(page.locator('#goal-required-sip')).toHaveCount(0);
    await expect(page.locator('.goal-invalid-workbench')).toBeVisible();
  });

  test('8. Fully funded case states zero further SIP needed under assumptions without guarantee claims', async ({ page }) => {
    await page.goto('/plan/');
    await page.click('#load-goal-example-btn');

    // Increase existing savings to ₹30,00,000 (which grows to ~₹93L, exceeding ₹54L goal)
    const savingsInput = page.locator('#goal-planner-app input[id*="savings-num"]');
    await savingsInput.fill('3000000');

    // Verify hero status displays "Fully Funded" and deficit is ₹0
    await expect(page.locator('#goal-required-sip')).toHaveText('Fully Funded');
    await expect(page.locator('#goal-net-deficit')).toHaveText('₹0');

    // Verify neutral non-guarantee explanation
    const heroCaption = page.locator('.hero-caption');
    await expect(heroCaption).toContainText('Existing earmarked savings are sufficient to cover the estimated');
    await expect(heroCaption).toContainText('under these assumptions');
    await expect(heroCaption).not.toContainText('guaranteed');
  });

  test('9. Slider and numeric inputs remain synchronized with accessible bounds', async ({ page }) => {
    await page.goto('/plan/');
    const app = page.locator('#goal-planner-app');

    const yearsNum = app.locator('input[type="number"]').nth(1);
    const yearsSlider = app.locator('input[type="range"]').nth(1);

    // Type 15 into number input
    await yearsNum.fill('15');
    await expect(yearsSlider).toHaveValue('15');

    // Change slider to 20
    await yearsSlider.fill('20');
    await expect(yearsNum).toHaveValue('20');
  });

  test('10. Assumptions section distinguishes inflation from investment return and avoids advised claims', async ({ page }) => {
    await page.goto('/plan/');
    const app = page.locator('#goal-planner-app');

    const assumptionsFieldset = app.locator('.assumptions-card');
    await expect(assumptionsFieldset).toBeVisible();

    const groupSubtext = assumptionsFieldset.locator('.group-subtext');
    await expect(groupSubtext).toContainText('Cost inflation and investment return are independent user assumptions, not forecasts, promises, or recommendations.');

    // Disclosures check
    await page.click('#load-goal-example-btn');
    const disclosures = app.locator('.planner-disclosure');
    await expect(disclosures).toHaveCount(2);

    await expect(disclosures.nth(0)).toContainText('How this estimate works');
    await expect(disclosures.nth(1)).toContainText('What this estimate does not include');
  });

  test('11. Measures headline metric coordinates and asserts zero overflow at 360px, 390px, and 1440px', async ({ page }) => {
    for (const vp of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/plan/');
      await page.click('#load-goal-example-btn');

      // On mobile (<900px), mobile headline value is rendered
      if (vp.width < 900) {
        const mobileHeadline = page.locator('#goal-mobile-headline-val');
        await expect(mobileHeadline).toBeVisible();
        await expect(mobileHeadline).toHaveText('₹21,319');

        const box = await mobileHeadline.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThan(0);
        expect(box!.height).toBeGreaterThan(0);

        // Verify touch targets on quick actions
        const adjustBtn = page.locator('.mrs-btn-adjust');
        const adjustBox = await adjustBtn.boundingBox();
        expect(adjustBox!.height).toBeGreaterThanOrEqual(44);
      } else {
        // Desktop workbench headline
        const desktopHeadline = page.locator('#goal-required-sip');
        await expect(desktopHeadline).toBeVisible();
        await expect(desktopHeadline).toHaveText('₹21,319');
      }

      // Check zero horizontal overflow across full page
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(hasOverflow).toBe(false);
    }
  });

  test('12. Strict privacy invariant: zero external network requests, zero client storage, zero cookies, zero IndexedDB, and zero URL leakage in fresh context', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Attach request listener BEFORE page.goto()
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

    await page.goto('/plan/');

    // Load example
    await page.click('#load-goal-example-btn');

    // Edit representative inputs
    const costInput = page.locator('#goal-planner-app input[type="number"]').nth(0);
    await costInput.fill('3500000');

    const yearsInput = page.locator('#goal-planner-app input[type="number"]').nth(1);
    await yearsInput.fill('12');

    // Assert external request list is strictly empty
    expect(externalRequests).toEqual([]);

    // Check storage, cookies, IndexedDB, and URL
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
    expect(privacyCheck.dbNames).toEqual([]);

    const cookies = await context.cookies();
    expect(cookies).toEqual([]);

    await context.close();
  });

  test('13. Retirement/SWP previews remain "Calculations Not Available" under GATE-A', async ({ page }) => {
    await page.goto('/plan/');

    // Verify retirement card indicates preview status
    const retirementCard = page.locator('.roadmap-card[data-status="blocked"]').first();
    await expect(retirementCard).toBeVisible();
    await expect(retirementCard).toContainText('Calculations Not Available');
  });

  test('14. Milestone cards and internal links target canonical registered routes', async ({ page }) => {
    await page.goto('/plan/');

    // Check Children planner link in visible milestone grid
    const childrenLink = page.locator('.roadmaps-grid a[href="/plan/children/"]').first();
    await expect(childrenLink).toBeVisible();

    // Check Home purchase link in visible milestone grid
    const homeLink = page.locator('.roadmaps-grid a[href="/plan/home-purchase/"]').first();
    await expect(homeLink).toBeVisible();
  });
});
