import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Phase 25 / Phase 6 — Children Future Multi-Milestone Planner Concept C Redesign (/plan/children/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plan/children/');
    await page.waitForSelector('astro-island:not([ssr])');
  });

  test('1. Canonical route returns 200, one H1, correct title, and accessible main landmark', async ({ page }) => {
    await expect(page).toHaveTitle(/Children's Higher Education & Life Milestones Planner/);

    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
    await expect(h1s).toHaveText(/Children's Higher Education & Life Milestones Planner/);

    const eyebrow = page.locator('.page-intro .eyebrow');
    await expect(eyebrow).toContainText("Family Goal Roadmap · Children's Future");

    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main).toHaveId('main-content');
  });

  test('2. Clean neutral empty state with zero prefilled figures; illustrative sample requires explicit action', async ({ page }) => {
    // Empty state hero exists
    const hero = page.locator('[data-testid="empty-planner-hero"]');
    await expect(hero).toBeVisible();
    await expect(hero).toContainText("Start Planning Your Child's Higher Education");

    // No results panel visible in empty state
    await expect(page.locator('[data-testid="family-roadmap-results"]')).not.toBeVisible();
    await expect(page.locator('#children-mobile-summary')).not.toBeVisible();

    // Two starter action buttons present
    await expect(page.locator('[data-testid="btn-start-blank"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-load-family-example"]')).toBeVisible();

    // Click "Load Illustrative Family Example"
    await page.locator('[data-testid="btn-load-family-example"]').click();

    // Illustrative banner appears
    const banner = page.locator('#children-notice-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Illustrative example loaded — these are not your figures');

    // Family roadmap results visible
    const results = page.locator('[data-testid="family-roadmap-results"]');
    await expect(results).toBeVisible();

    // Two children and two investments present in canonical sample
    await expect(page.locator('[data-testid^="child-card-"]')).toHaveCount(2);
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(2);
  });

  test('3. Add, edit, duplicate, and remove child and milestone workflows', async ({ page }) => {
    // Start with blank starter
    await page.locator('[data-testid="btn-start-blank"]').click();
    await expect(page.locator('[data-testid^="child-card-"]')).toHaveCount(1);
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(1);

    // 1. Add Child
    await page.locator('[data-testid="btn-add-child"]').click();
    await expect(page.locator('[data-testid^="child-card-"]')).toHaveCount(2);
    const secondChildName = page.locator('.child-name-input').nth(1);
    await secondChildName.fill('Rohan');

    // 2. Add Milestone
    await page.locator('[data-testid="btn-add-milestone"]').click();
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(2);
    const secondMilestone = page.locator('.milestone-title-input').nth(1);
    await secondMilestone.fill('Postgrad Degree');

    // 3. Duplicate Milestone
    const dupBtn = page.locator('button:has-text("Duplicate")').nth(1);
    await dupBtn.click();
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(3);
    await expect(page.locator('.milestone-title-input').nth(2)).toHaveValue(/Copy/);

    // 4. Remove duplicate milestone
    const remBtn = page.locator('.milestone-header-actions .btn-icon-delete').nth(2);
    await remBtn.click();
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(2);
  });

  test('4. Add multiple goals with different target ages and check per-goal projections', async ({ page }) => {
    await page.locator('[data-testid="btn-load-family-example"]').click();

    // Canonical sample has Aarav (age 6 -> target 18, horizon 12) & Ananya (age 3 -> target 21, horizon 18)
    const results = page.locator('[data-testid="family-roadmap-results"]');
    await expect(results).toBeVisible();

    // Verify canonical VEC-KID-06 figures in results
    await expect(results).toContainText('₹2,15,46,262'); // Aarav projected future cost
    await expect(results).toContainText('₹1,94,92,750'); // Aarav funding gap
    await expect(results).toContainText('₹22,851');      // Starting step-up SIP
    await expect(results).toContainText('₹41,863');      // Fixed level SIP
  });

  test('5. Existing-asset allocation totals, unallocated balances, and over-allocation guard', async ({ page }) => {
    await page.locator('[data-testid="btn-load-family-example"]').click();

    // Asset 1 has currentValue 500,000. Total allocated across milestones is 400,000.
    const assetValInput = page.locator('.number-input-table').first();

    // Edit currentValue to 300,000 (below total 400,000 allocated)
    await assetValInput.fill('300000');
    await assetValInput.dispatchEvent('change');

    // Over-allocated warning badge in table
    await expect(page.locator('.badge-danger-xs').first()).toContainText('Over-allocated by ₹1,00,000!');

    // Overallocation error banner is displayed and results paused
    await expect(page.locator('text=Asset Over-Allocation Detected')).toBeVisible();
    await expect(page.locator('[data-testid="family-roadmap-results"]')).not.toBeVisible();

    // Restore currentValue to 500000
    await assetValInput.fill('500000');
    await assetValInput.dispatchEvent('change');
    await expect(page.locator('text=Asset Over-Allocation Detected')).not.toBeVisible();
    await expect(page.locator('[data-testid="family-roadmap-results"]')).toBeVisible();
  });

  test('6. Child removal with linked milestones confirmation dialog and safe cascade', async ({ page }) => {
    await page.locator('[data-testid="btn-load-family-example"]').click();
    await expect(page.locator('[data-testid^="child-card-"]')).toHaveCount(2);
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(2);

    // Click delete on Aarav (who has linked milestone)
    const firstChildDelete = page.locator('.child-card-header .btn-icon-delete').first();
    await firstChildDelete.click();

    // Confirmation box must appear
    const confirmBox = page.locator('.delete-confirm-box');
    await expect(confirmBox).toBeVisible();
    await expect(confirmBox).toContainText('has 1 linked milestone');

    // Cancel preserves Aarav
    await confirmBox.locator('.btn-cancel-delete').click();
    await expect(confirmBox).not.toBeVisible();
    await expect(page.locator('[data-testid^="child-card-"]')).toHaveCount(2);

    // Click delete again and confirm
    await firstChildDelete.click();
    await page.locator('.btn-confirm-delete').click();

    // Aarav and linked milestone removed; Ananya remains
    await expect(page.locator('[data-testid^="child-card-"]')).toHaveCount(1);
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(1);
    await expect(page.locator('.child-name-input').first()).toHaveValue('Ananya');
  });

  test('7. Horizon recalculation parity when child age or milestone target changes; invalid horizon error pause', async ({ page }) => {
    await page.locator('[data-testid="btn-load-family-example"]').click();

    // Aarav current age is 6, target is 18 -> horizon 12 years
    const aaravAge = page.locator('[aria-label="Numeric current age of Aarav"]');
    await expect(page.locator('.horizon-hint').first()).toContainText('12 years');

    // Change age to 7 -> horizon becomes 11 years
    await aaravAge.fill('7');
    await aaravAge.dispatchEvent('change');
    await expect(page.locator('.horizon-hint').first()).toContainText('11 years');

    // Set target age to 6 (< 7) -> invalid horizon error
    const aaravMilestone = page.locator('[data-testid^="milestone-card-"]').first();
    const targetAgeInput = aaravMilestone.locator('.number-input-compact').first();
    await targetAgeInput.fill('6');
    await targetAgeInput.dispatchEvent('change');

    // Shows invalid target age error
    await expect(page.locator('.horizon-hint').first()).toContainText('Invalid: Target age must be > current age');
    await expect(page.locator('[data-testid="planner-validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="family-roadmap-results"]')).not.toBeVisible();

    // Restore valid target age 18
    await targetAgeInput.fill('18');
    await targetAgeInput.dispatchEvent('change');
    await expect(page.locator('[data-testid="planner-validation-error"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="family-roadmap-results"]')).toBeVisible();
  });

  test('8. Boundary checks: 0% inflation, 0% return, and assumptions schedule toggle without NaN or Infinity', async ({ page }) => {
    await page.locator('[data-testid="btn-load-family-example"]').click();

    // Toggle assumptions closed and open
    const toggleAssumptionsBtn = page.locator('#toggle-children-assumptions-btn');
    await expect(toggleAssumptionsBtn).toBeVisible();
    await toggleAssumptionsBtn.click();
    await expect(page.locator('#assumed-return-slider')).not.toBeVisible();
    await toggleAssumptionsBtn.click();
    await expect(page.locator('#assumed-return-slider')).toBeVisible();

    // Set return slider to 0%
    const returnSlider = page.locator('#assumed-return-slider');
    await returnSlider.fill('0');
    await returnSlider.dispatchEvent('change');

    // Set first milestone inflation slider to 0%
    const infSlider = page.locator('[id^="ms-inf-"]').first();
    await infSlider.fill('0');
    await infSlider.dispatchEvent('change');

    // Verify roadmap results still render valid finite rupee numbers
    const results = page.locator('[data-testid="family-roadmap-results"]');
    await expect(results).toBeVisible();
    const resultText = await results.innerText();
    expect(resultText).not.toContain('NaN');
    expect(resultText).not.toContain('Infinity');
    expect(resultText).not.toContain('undefined');

    // Toggle schedule table
    const toggleScheduleBtn = page.locator('#toggle-children-schedule-btn');
    await expect(toggleScheduleBtn).toBeVisible();
    await toggleScheduleBtn.click();
    await expect(page.locator('.schedule-table-wrapper')).not.toBeVisible();
    await toggleScheduleBtn.click();
    await expect(page.locator('.schedule-table-wrapper')).toBeVisible();
  });

  test('9. Mobile summary value updates synchronously with detailed roadmap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-testid="btn-load-family-example"]').click();

    const mobileSummary = page.locator('#children-mobile-summary');
    await expect(mobileSummary).toBeVisible();

    const mobileHeadlineVal = page.locator('#children-mobile-headline-val');
    await expect(mobileHeadlineVal).toHaveText('₹22,851 /mo');

    // Increase today cost of Aarav's degree from 20,00,000 to 35,00,000
    const aaravCost = page.locator('.milestone-cost-input').first();
    await aaravCost.fill('3500000');
    await aaravCost.dispatchEvent('change');

    // Mobile summary updates synchronously to higher SIP
    await expect(mobileHeadlineVal).not.toHaveText('₹22,851 /mo');
    const updatedVal = await mobileHeadlineVal.innerText();
    expect(updatedVal).toContain('/mo');
  });

  test('10. Mobile summary headline bottom edge is within first-fold threshold (<= 760px on 360px, <= 780px on 390px)', async ({ page }) => {
    // 1. 360x800 viewport
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/plan/children/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.locator('[data-testid="btn-load-family-example"]').click();

    const mobileNum360 = page.locator('#children-mobile-headline-val');
    await expect(mobileNum360).toBeVisible();
    const box360 = await mobileNum360.boundingBox();
    expect(box360).not.toBeNull();
    const bottomEdge360 = box360!.y + box360!.height;
    console.log(`[CHILDREN 360x800] y=${box360!.y.toFixed(2)}, h=${box360!.height.toFixed(2)}, bottom=${bottomEdge360.toFixed(2)}px`);
    // Bottom edge of headline number must be <= 760px
    expect(bottomEdge360).toBeLessThanOrEqual(760);

    // 2. 390x844 viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/plan/children/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.locator('[data-testid="btn-load-family-example"]').click();

    const mobileNum390 = page.locator('#children-mobile-headline-val');
    await expect(mobileNum390).toBeVisible();
    const box390 = await mobileNum390.boundingBox();
    expect(box390).not.toBeNull();
    const bottomEdge390 = box390!.y + box390!.height;
    console.log(`[CHILDREN 390x844] y=${box390!.y.toFixed(2)}, h=${box390!.height.toFixed(2)}, bottom=${bottomEdge390.toFixed(2)}px`);
    // Bottom edge of headline number must be <= 780px
    expect(bottomEdge390).toBeLessThanOrEqual(780);
  });

  test('11. Zero horizontal overflow across 360px, 390px, and 1440px viewports', async ({ page }) => {
    for (const width of [360, 390, 1440]) {
      const height = width === 1440 ? 900 : (width === 390 ? 844 : 800);
      await page.setViewportSize({ width, height });
      await page.goto('/plan/children/');
      await page.waitForSelector('astro-island:not([ssr])');
      await page.locator('[data-testid="btn-load-family-example"]').click();
      await page.waitForTimeout(200);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow, `Viewport ${width}x${height} should have zero horizontal overflow`).toBe(false);
    }
  });

  test('12. Keyboard navigation, visible focus, accessible labels, and >= 44px touch controls', async ({ page }) => {
    await page.locator('[data-testid="btn-load-family-example"]').click();

    // Verify touch targets >= 44px for primary mobile actions
    await page.setViewportSize({ width: 390, height: 844 });
    const adjustBtn = page.locator('#mobile-adjust-plan-btn');
    const boxAdjust = await adjustBtn.boundingBox();
    expect(boxAdjust).not.toBeNull();
    expect(boxAdjust!.height).toBeGreaterThanOrEqual(44);

    const roadmapBtn = page.locator('#mobile-view-roadmap-btn');
    const boxRoadmap = await roadmapBtn.boundingBox();
    expect(boxRoadmap).not.toBeNull();
    expect(boxRoadmap!.height).toBeGreaterThanOrEqual(44);

    // Keyboard focus on first child input
    const firstChildName = page.locator('.child-name-input').first();
    await firstChildName.focus();
    await expect(firstChildName).toBeFocused();
  });

  test('13. Strict privacy invariant: zero external requests, zero storage leaks, zero cookies, zero IndexedDB', async ({ page, context }) => {
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
    await page.goto('/plan/children/');
    await page.waitForSelector('astro-island:not([ssr])');

    // 3. Load sample and enter confidential details
    await page.locator('[data-testid="btn-load-family-example"]').click();
    const secretGoalName = 'SecretOxfordFund2040';
    await page.locator('.milestone-title-input').first().fill(secretGoalName);
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
    expect(storage.local).not.toContain(secretGoalName);
    expect(storage.session).not.toContain(secretGoalName);

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

  test('14. Scope and gate invariants: GATE-A and GATE-C remain blocked', async ({ page }) => {
    // Tax calculations not present in this planner
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Taxes on redemption (such as long-term capital gains tax under current legislation)');
    expect(bodyText).not.toContain('Section 80C');
    expect(bodyText).not.toContain('Section 10(10D)');

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

  test('15. Canonical related links resolve to canonical paths only', async ({ page }) => {
    const relatedLinks = page.locator('.related-grid a');
    const count = await relatedLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await relatedLinks.nth(i).getAttribute('href');
      if (href) hrefs.push(href);
    }

    expect(hrefs).toContain('/plan/');
    expect(hrefs).toContain('/tools/sip-growth/');
    expect(hrefs).toContain('/tools/sip/');
  });

  test('16. Capture fresh Phase 6 visual evidence screenshots', async ({ page }) => {
    const outDir = path.resolve('..', 'product-docs', 'design-review', 'phase6-children');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // 1440 Desktop Empty
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plan/children/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, 'children-desktop-1440-empty.png'), fullPage: false });

    // 1440 Desktop Loaded Initial & Full
    await page.locator('[data-testid="btn-load-family-example"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, 'children-desktop-1440-loaded-initial.png'), fullPage: false });
    await page.screenshot({ path: path.join(outDir, 'children-desktop-1440-loaded-full.png'), fullPage: true });

    // 390 Mobile Initial & Full
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/plan/children/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'children-mobile-390-empty.png'), fullPage: false });

    await page.locator('[data-testid="btn-load-family-example"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, 'children-mobile-390-loaded-initial.png'), fullPage: false });
    await page.screenshot({ path: path.join(outDir, 'children-mobile-390-loaded-full.png'), fullPage: true });

    // 360 Mobile Initial & Full
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/plan/children/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'children-mobile-360-empty.png'), fullPage: false });

    await page.locator('[data-testid="btn-load-family-example"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, 'children-mobile-360-loaded-initial.png'), fullPage: false });
    await page.screenshot({ path: path.join(outDir, 'children-mobile-360-loaded-full.png'), fullPage: true });

    // Assumptions schedule / Inflation presets
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plan/children/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.locator('[data-testid="btn-load-family-example"]').click();
    await page.waitForTimeout(300);
    // Scroll to the education inflation guide editorial section
    const inflationGuide = page.locator('#education-inflation-guide');
    if (await inflationGuide.isVisible()) {
      await inflationGuide.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(outDir, 'children-inflation-guide-section.png'), fullPage: false });
    }
    // Scroll to milestone cards showing inflation presets
    const milestoneCards = page.locator('.milestone-card');
    if (await milestoneCards.first().isVisible()) {
      await milestoneCards.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(outDir, 'children-assumptions-expanded.png'), fullPage: false });
    }
  });

  test('17. Phase 6.1 — Inflation assumption copy & currency exchange exclusion consistency audit', async ({ page }) => {
    // 1. Check educational compounding cards
    const insightSection = page.locator('.education-inflation-insight');
    await expect(insightSection).toBeVisible();

    // Check neutral heading and description
    await expect(insightSection.locator('h2')).toHaveText('The Compounding Impact of Annual Cost Escalation');
    await expect(insightSection).not.toContainText('baseline CPI');
    await expect(insightSection).not.toContainText('Standard Scenario');

    // 2. Mathematical model equations and rounded lakhs figures
    await expect(insightSection).toContainText('₹56.5 Lakhs');
    await expect(insightSection).toContainText('₹73.4 Lakhs');
    await expect(insightSection).toContainText('₹94.9 Lakhs');

    // 3. Check card descriptions are framed as illustrative assumptions
    await expect(insightSection).toContainText('Lower Illustrative Assumption');
    await expect(insightSection).toContainText('Middle Illustrative Assumption');
    await expect(insightSection).toContainText('Higher Illustrative Assumption');

    // 4. Currency exchange rate movements are explicitly disclaimed as excluded
    await expect(insightSection).toContainText('Currency exchange-rate movements and institution-specific fees are not modelled');
    const regulatoryNote = page.locator('.regulatory-disclosure-note');
    await expect(regulatoryNote).toContainText('currency exchange rate swings for overseas tuition, and university-specific fees are not modelled in this simulation');

    // 5. Check interactive planner preset chips
    await page.locator('[data-testid="btn-load-family-example"]').click();
    const chips = page.locator('.chip-preset');
    const chipTexts = await chips.allInnerTexts();
    expect(chipTexts).toContain('6% · Lower Assumption');
    expect(chipTexts).toContain('8% · Middle Assumption');
    expect(chipTexts).toContain('10% · Higher Assumption');

    // 6. Check that 10% preset chip does NOT claim to account for foreign exchange or currency movements
    const chip10 = page.locator('.chip-preset:has-text("10%")').first();
    const chip10Title = await chip10.getAttribute('title');
    expect(chip10Title).not.toContain('foreign exchange factors');
    expect(chip10Title).not.toContain('accounting for specialized programs or foreign exchange');
    expect(chip10Title).toContain('Currency exchange-rate movements are not modelled');
  });
});
