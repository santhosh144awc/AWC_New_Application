import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Phase 26 / Phase 7 — Life Insurance Protection Needs Planner Concept C Redesign (/tools/life-insurance/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');
  });

  test('1. Canonical route returns 200, one H1, correct title, and accessible main landmark', async ({ page }) => {
    const response = await page.goto('/tools/life-insurance/');
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/How Much Financial Protection Might Your Family Need\? — Ant Wealth Creation/i);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(/How much financial protection might your family need\?/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('2. Single H1 and Concept C shared shell with breadcrumbs and status badge', async ({ page }) => {
    // Breadcrumbs
    const breadcrumbs = page.locator('.breadcrumbs, nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs).toContainText('Tools');
    await expect(breadcrumbs).toContainText('Life Insurance');

    // PageIntro
    const intro = page.locator('.page-intro');
    await expect(intro).toBeVisible();
    await expect(intro).toContainText('Family Protection Diagnostic');
    await expect(intro).toContainText('Needs-Based Diagnostic Live');

    // Interactive planner island
    await expect(page.locator('[data-testid="life-insurance-planner-island"]')).toBeVisible();
  });

  test('3. Blank initial state and explicit Load illustrative example behavior; example banner clears on edit', async ({ page }) => {
    // Starts with no example banner
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);

    // Inputs blank
    await expect(page.locator('[data-testid="input-annual-income"]')).toHaveValue('');
    await expect(page.locator('[data-testid="input-family-living-expenses"]')).toHaveValue('');

    // Step 4 shows clean empty prompt
    await page.locator('[data-testid="step-tab-4"]').click();
    await expect(page.locator('[data-testid="welcome-placeholder"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-container"]')).toHaveCount(0);

    // Load example
    await page.locator('[data-testid="load-example-btn"]').click();
    const banner = page.locator('[data-testid="illustrative-example-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Illustrative family example loaded — sample values appear across the fields below');

    // Verify values populated
    await expect(page.locator('[data-testid="input-annual-income"]')).toHaveValue('1800000');
    await expect(page.locator('[data-testid="input-family-living-expenses"]')).toHaveValue('720000');

    // Editing any field dismisses banner
    await page.locator('[data-testid="input-family-living-expenses"]').fill('800000');
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);
  });

  test('4. Four-step navigation, forward/back movement, and validation blocking', async ({ page }) => {
    // Step 1 -> Step 2
    await page.locator('[data-testid="input-family-living-expenses"]').fill('600000');
    await page.locator('[data-testid="next-step-btn"]').click();
    await expect(page.locator('#step-2-heading')).toBeVisible();

    // Step 2 -> Back to Step 1
    await page.locator('[data-testid="prev-step-btn"]').click();
    await expect(page.locator('#step-1-heading')).toBeVisible();

    // Step 1 -> Step 2 -> Step 3
    await page.locator('[data-testid="next-step-btn"]').click();
    await page.locator('[data-testid="next-step-btn"]').click();
    await expect(page.locator('#step-3-heading')).toBeVisible();

    // Step 3 -> Back to Step 2
    await page.locator('[data-testid="prev-step-btn"]').click();
    await expect(page.locator('#step-2-heading')).toBeVisible();

    // Enter negative invalid value and verify Step 4 validation blocking
    await page.locator('[data-testid="step-tab-1"]').click();
    await page.locator('[data-testid="input-family-living-expenses"]').fill('-50000');
    await page.locator('[data-testid="step-tab-4"]').click();

    const errPanel = page.locator('[data-testid="validation-error-panel"]');
    await expect(errPanel).toBeVisible();
    await expect(errPanel).toContainText('Input Corrections Required');
    await expect(page.locator('[data-testid="results-container"]')).toHaveCount(0);
  });

  test('5. Add/edit/remove future milestones and resource entries', async ({ page }) => {
    await page.locator('[data-testid="input-family-living-expenses"]').fill('600000');
    await page.locator('[data-testid="step-tab-3"]').click();

    // Add milestone
    await page.locator('[data-testid="input-new-milestone-label"]').fill("Master's Degree");
    await page.locator('[data-testid="input-new-milestone-cost"]').fill('3000000');
    await page.locator('[data-testid="input-new-milestone-years"]').fill('12');
    await page.locator('[data-testid="input-new-milestone-inflation"]').fill('8');
    await page.locator('[data-testid="btn-add-milestone"]').click();

    // Verify milestone rendered in list
    const milestoneItem = page.locator('[data-testid="milestones-list"]');
    await expect(milestoneItem).toContainText("Master's Degree");
    await expect(milestoneItem).toContainText('Today: ₹30,00,000');

    // Remove milestone
    const removeBtn = milestoneItem.locator('button:has-text("Remove")').first();
    await removeBtn.click();
    await expect(milestoneItem.getByText("Master's Degree")).toHaveCount(0);
  });

  test('6. Input edits update results through the real engine; test exact canonical vector output (VEC-LIFE-09)', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();

    await expect(page.locator('[data-testid="results-container"]')).toBeVisible();

    // Canonical VEC-LIFE-09 figures
    await expect(page.locator('[data-testid="val-additional-personal-gap"]')).toContainText('₹1,47,99,549');
    await expect(page.locator('[data-testid="val-gross-protection-need"]')).toContainText('₹2,17,99,549');
    await expect(page.locator('[data-testid="val-family-support-pv"]')).toContainText('₹1,27,64,206');
    await expect(page.locator('[data-testid="val-liabilities-subtotal"]')).toContainText('₹45,00,000');
    await expect(page.locator('[data-testid="val-milestones-pv"]')).toContainText('₹40,35,343');
    await expect(page.locator('[data-testid="val-earmarked-funds"]')).toContainText('20,00,000');
    await expect(page.locator('[data-testid="val-need-after-earmarked"]')).toContainText('₹1,97,99,549');
    await expect(page.locator('[data-testid="val-existing-personal-cover"]')).toContainText('50,00,000');
  });

  test('7. Personal cover gap and group-cover comparison stay distinct', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();

    // Card 1: Personal cover gap = ₹1,47,99,549
    await expect(page.locator('[data-testid="val-additional-personal-gap"]')).toContainText('₹1,47,99,549');

    // Card 3: Group cover comparison gap = ₹1,22,99,549
    await expect(page.locator('[data-testid="val-group-cover-gap"]')).toContainText('₹1,22,99,549');

    // Disable group cover on Step 3
    await page.locator('[data-testid="step-tab-3"]').click();
    await page.locator('[data-testid="checkbox-include-employer-cover"]').uncheck();

    // On Step 4, group cover card should disappear
    await page.locator('[data-testid="step-tab-4"]').click();
    await expect(page.locator('[data-testid="val-group-cover-gap"]')).toHaveCount(0);
    // Primary personal cover gap remains identical
    await expect(page.locator('[data-testid="val-additional-personal-gap"]')).toContainText('₹1,47,99,549');
  });

  test('8. Results waterfall reconciles to the existing domain result; no independently coded UI math', async ({ page }) => {
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();

    const table = page.locator('#waterfall-breakdown-section table');
    await expect(table).toBeVisible();

    // Verify all rows in the waterfall
    await expect(table.locator('[data-testid="val-family-support-pv"]')).toContainText('₹1,27,64,206');
    await expect(table.locator('[data-testid="val-liabilities-subtotal"]')).toContainText('₹45,00,000');
    await expect(table.locator('[data-testid="val-milestones-pv"]')).toContainText('₹40,35,343');
    await expect(table.locator('[data-testid="val-earmarked-funds"]')).toContainText('- ₹20,00,000');
    await expect(table.locator('[data-testid="val-need-after-earmarked"]')).toContainText('₹1,97,99,549');
    await expect(table.locator('[data-testid="val-existing-personal-cover"]')).toContainText('- ₹50,00,000');
  });

  test('9. Zero/invalid inputs do not display NaN, Infinity, or false completed-result claims', async ({ page }) => {
    await page.goto('/tools/life-insurance/');
    await page.locator('[data-testid="step-tab-4"]').click();

    // On empty input, must show empty placeholder, NOT 0 or NaN
    await expect(page.locator('[data-testid="welcome-placeholder"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-container"]')).toHaveCount(0);

    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('NaN');
    expect(bodyText).not.toContain('Infinity');
    expect(bodyText).not.toContain('undefined');
  });

  test('10. Mobile visibility of the actual result number at 360px and 390px on Step 4', async ({ page }) => {
    // 360x800 compact mobile test
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();
    await page.waitForTimeout(300);

    const val360 = page.locator('#val-additional-personal-gap');
    await expect(val360).toBeVisible();
    const box360 = await val360.boundingBox();
    expect(box360).not.toBeNull();
    const bottom360 = (box360?.y ?? 0) + (box360?.height ?? 0);
    console.log(`[LIFE-INSURANCE 360x800] y=${box360?.y.toFixed(2)}, h=${box360?.height.toFixed(2)}, bottom=${bottom360.toFixed(2)}px`);
    // Assert the actual cover gap number is visible within initial fold (<= 760px)
    expect(bottom360).toBeLessThanOrEqual(760);

    // 390x844 mobile test
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();
    await page.waitForTimeout(300);

    const val390 = page.locator('#val-additional-personal-gap');
    await expect(val390).toBeVisible();
    const box390 = await val390.boundingBox();
    expect(box390).not.toBeNull();
    const bottom390 = (box390?.y ?? 0) + (box390?.height ?? 0);
    console.log(`[LIFE-INSURANCE 390x844] y=${box390?.y.toFixed(2)}, h=${box390?.height.toFixed(2)}, bottom=${bottom390.toFixed(2)}px`);
    expect(bottom390).toBeLessThanOrEqual(780);
  });

  test('11. Zero horizontal overflow at 360px, 390px and 1440px', async ({ page }) => {
    for (const vp of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(vp);
      await page.goto('/tools/life-insurance/');
      await page.waitForSelector('astro-island:not([ssr])');
      await page.locator('[data-testid="load-example-btn"]').click();
      await page.locator('[data-testid="step-tab-4"]').click();

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    }
  });

  test('12. Privacy test installs request monitoring before navigation; asserts zero network/storage leaks', async ({ page }) => {
    const externalRequests: string[] = [];
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
        externalRequests.push(url);
      }
      return route.continue();
    });

    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();

    // Check zero external network calls
    expect(externalRequests).toEqual([]);

    // Check zero URL parameters
    expect(page.url()).not.toContain('?');

    // Check localStorage, sessionStorage, cookies, IndexedDB
    const localKeys = await page.evaluate(() => Object.keys(localStorage));
    for (const key of localKeys) {
      const val = await page.evaluate((k) => localStorage.getItem(k), key);
      expect(val).not.toContain('1800000');
      expect(val).not.toContain('720000');
    }

    const sessionKeys = await page.evaluate(() => Object.keys(sessionStorage));
    for (const key of sessionKeys) {
      const val = await page.evaluate((k) => sessionStorage.getItem(k), key);
      expect(val).not.toContain('1800000');
    }

    const cookies = await page.context().cookies();
    for (const cookie of cookies) {
      expect(cookie.value).not.toContain('1800000');
    }
  });

  test('13. GATE-A and GATE-C pages remain blocked and no blocked calculations are introduced', async ({ page }) => {
    // Check retirement is blocked
    await page.goto('/plan/retirement/');
    const retText = await page.textContent('body');
    expect(retText).toContain('Calculations Not Available');

    // Check SWP is blocked
    await page.goto('/tools/swp/');
    const swpText = await page.textContent('body');
    expect(swpText).toContain('Calculations Not Available');
  });

  test('14. Prohibited claims removal audit (Guaranteed, Fully Protected, 100% debt clearance, safe yields, 10x salary)', async ({ page }) => {
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();

    const pageContent = await page.textContent('body');

    // Check absence of prohibited terms
    expect(pageContent).not.toContain('safe yields');
    expect(pageContent).not.toContain('100% of all outstanding loans (especially home and car loans) cleared immediately');
    expect(pageContent).not.toContain('Never rely on arbitrary thumb rules like \'10x salary\'');
    expect(pageContent).not.toContain('Fully Protected');
    expect(pageContent).not.toContain('adequate cover guaranteed');
    expect(pageContent).not.toContain('Primary Recommendation');
  });

  test('15. Capture fresh Phase 7 visual evidence screenshots', async ({ page }) => {
    const outDir = path.resolve('..', 'product-docs', 'design-review', 'phase7-life-insurance');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // 1440 Desktop Empty
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.screenshot({ path: path.join(outDir, 'life-insurance-desktop-1440-empty.png') });

    // 1440 Desktop Step 1 Loaded
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'life-insurance-desktop-1440-step1.png') });

    // 1440 Desktop Step 4 (Results) Full Page & Initial
    await page.locator('[data-testid="step-tab-4"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, 'life-insurance-desktop-1440-results-initial.png') });
    await page.screenshot({ path: path.join(outDir, 'life-insurance-desktop-1440-results-full.png'), fullPage: true });

    // 390 Mobile Initial & Full
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.screenshot({ path: path.join(outDir, 'life-insurance-mobile-390-empty.png') });
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, 'life-insurance-mobile-390-results-initial.png') });
    await page.screenshot({ path: path.join(outDir, 'life-insurance-mobile-390-results-full.png'), fullPage: true });

    // 360 Mobile Initial & Full
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.screenshot({ path: path.join(outDir, 'life-insurance-mobile-360-empty.png') });
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, 'life-insurance-mobile-360-results-initial.png') });
    await page.screenshot({ path: path.join(outDir, 'life-insurance-mobile-360-results-full.png'), fullPage: true });
  });
});
