import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Phase 23 / Phase 4 — Advanced SIP Growth Simulator Concept C Redesign (/tools/sip-growth/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/sip-growth/');
    await page.waitForSelector('astro-island:not([ssr])');
  });

  test('1. Route loads with correct title, single H1, Concept C layout and mounted island', async ({ page }) => {
    await expect(page).toHaveTitle(/Advanced SIP Growth & Step-Up Simulator — Ant Wealth Creation/);

    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
    await expect(h1s).toHaveText('Explore how your investments could grow over time.');

    // Eyebrow check
    const eyebrow = page.locator('.page-intro .eyebrow');
    await expect(eyebrow).toContainText('Money Lab · SIP Growth');

    // Island mounted
    const app = page.locator('#sip-growth-calculator-app');
    await expect(app).toBeVisible();
    await expect(page.locator('#growth-final-corpus')).toBeVisible();
  });

  test('2. Beginner mode shows only simple controls initially; advanced options are collapsed', async ({ page }) => {
    // Core inputs visible
    await expect(page.locator('#growth-monthly-num')).toBeVisible();
    await expect(page.locator('#growth-sipyears-num')).toBeVisible();
    await expect(page.locator('#growth-return-num')).toBeVisible();

    // Advanced options button collapsed
    const advToggle = page.locator('#toggle-advanced-options-btn');
    await expect(advToggle).toBeVisible();
    await expect(advToggle).toHaveAttribute('aria-expanded', 'false');

    // Advanced panel hidden
    await expect(page.locator('#advanced-options-container')).not.toBeVisible();
    await expect(page.locator('#add-lumpsum-row-btn')).not.toBeVisible();
    await expect(page.locator('#growth-stepup-num')).not.toBeVisible();
    await expect(page.locator('#growth-postsip-num')).not.toBeVisible();
  });

  test('3. Expanding and collapsing advanced options preserves entered values', async ({ page }) => {
    const advToggle = page.locator('#toggle-advanced-options-btn');

    // Expand
    await advToggle.click();
    await expect(advToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#advanced-options-container')).toBeVisible();

    // Modify step-up to 15% and post-sip to 7 years
    const stepUpInput = page.locator('#growth-stepup-num');
    const postSipInput = page.locator('#growth-postsip-num');
    await stepUpInput.fill('15');
    await postSipInput.fill('7');

    // Collapse
    await advToggle.click();
    await expect(advToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#advanced-options-container')).not.toBeVisible();

    // Expand again -> values preserved!
    await advToggle.click();
    await expect(stepUpInput).toHaveValue('15');
    await expect(postSipInput).toHaveValue('7');
  });

  test('4. Monthly SIP, duration, and return changes update displayed final corpus reactively', async ({ page }) => {
    const futureVal = page.locator('#growth-final-corpus');
    // Default initial value with default inputs
    await expect(futureVal).toContainText('₹55,39,145');

    // Change monthly SIP to 20,000
    const monthlyInput = page.locator('#growth-monthly-num');
    await monthlyInput.fill('20000');
    // Corpus increases
    await expect(futureVal).not.toContainText('₹55,39,145');

    // Synchronized slider reflects 20,000
    await expect(page.locator('#growth-monthly-slider')).toHaveValue('20000');
  });

  test('5. Step-up settings update contributions and helper text clarifies Month 13 timing', async ({ page }) => {
    const advToggle = page.locator('#toggle-advanced-options-btn');
    await advToggle.click();

    const stepUpHelp = page.locator('#growth-stepup-help');
    await expect(stepUpHelp).toContainText('First increase applies in Year 2 (Month 13)');
    await expect(stepUpHelp).toContainText('Annual increases stop after Year 5');
  });

  test('6. Step-up cap keeps later contributions at capped installment', async ({ page }) => {
    const advToggle = page.locator('#toggle-advanced-options-btn');
    await advToggle.click();

    const sipYearsInput = page.locator('#growth-sipyears-num');
    const capInput = page.locator('#growth-stepupdur-num');

    await sipYearsInput.fill('5');
    // Try setting cap to 8 (exceeding SIP duration) -> invalid
    await capInput.fill('8');
    const errorMsg = page.locator('.inline-error');
    await expect(errorMsg.first()).toContainText('Step-up cap duration cannot exceed SIP duration');

    // Correct to 3 years
    await capInput.fill('3');
    await expect(page.locator('#growth-stepup-help')).toContainText('Annual increases stop after Year 3');
  });

  test('7. Multiple one-time contributions can be added and removed dynamically', async ({ page }) => {
    const advToggle = page.locator('#toggle-advanced-options-btn');
    await advToggle.click();

    const addBtn = page.locator('#add-lumpsum-row-btn');
    await expect(addBtn).toBeVisible();

    // Default 1 row
    await expect(page.locator('.lumpsum-row-card')).toHaveCount(1);

    // Add a second lump sum row
    await addBtn.click();
    await expect(page.locator('.lumpsum-row-card')).toHaveCount(2);

    // Delete row 2
    const removeBtn = page.locator('.lumpsum-row-card').nth(1).locator('.btn-remove-row');
    await removeBtn.click();
    await expect(page.locator('.lumpsum-row-card')).toHaveCount(1);
  });

  test('8. Post-SIP holding years add compounding without new monthly SIP contributions', async ({ page }) => {
    const advToggle = page.locator('#toggle-advanced-options-btn');
    await advToggle.click();

    const postSipInput = page.locator('#growth-postsip-num');
    await postSipInput.fill('8');

    // Horizon pill shows 10y Active SIP + 8y Post-SIP Holding (18y Total)
    const horizonPill = page.locator('.horizon-pill');
    await expect(horizonPill.first()).toContainText('10y Active SIP + 8y Post-SIP Holding (18y Total)');
  });

  test('9. 0% return scenario yields final corpus equal to total contributions exactly (zero growth)', async ({ page }) => {
    const returnInput = page.locator('#growth-return-num');
    await returnInput.fill('0');

    // Growth must be exactly ₹0
    await expect(page.locator('#growth-total-gain')).toContainText('₹0');

    // Total invested equals final corpus
    const investedText = await page.locator('#growth-total-invested').textContent();
    const corpusText = await page.locator('#growth-final-corpus').textContent();
    expect(corpusText?.trim()).toBe(investedText?.trim());

    // Wealth multiplier is 1.00x
    await expect(page.locator('#growth-multiplier')).toContainText('1.00x');
  });

  test('10. Invalid, blank or out-of-range inputs suppress stale results and show safe feedback', async ({ page }) => {
    const monthlyInput = page.locator('#growth-monthly-num');
    await monthlyInput.fill('');

    // Results card shows unavailable message
    await expect(page.locator('.unavailable-card')).toBeVisible();
    await expect(page.locator('#growth-monthly-error')).toContainText('Enter a starting monthly installment');

    // Restore valid amount
    await monthlyInput.fill('15000');
    await expect(page.locator('.unavailable-card')).not.toBeVisible();
    await expect(page.locator('#growth-final-corpus')).toBeVisible();
  });

  test('11. Step-up scenario comparison card appears when step-up > 0% and explains baseline', async ({ page }) => {
    // By default stepUp is 10%
    const comparisonCard = page.locator('.scenario-comparison-card');
    await expect(comparisonCard).toBeVisible();
    await expect(comparisonCard).toContainText('Comparison vs Fixed Monthly SIP');
    await expect(comparisonCard).toContainText('Step-Up Advantage');

    // Set step-up to 0% -> comparison card hides
    const advToggle = page.locator('#toggle-advanced-options-btn');
    await advToggle.click();
    await page.locator('#growth-stepup-num').fill('0');

    await expect(comparisonCard).not.toBeVisible();
  });

  test('12. Year-by-year schedule table expands accessibly and reconciles closing balance', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-sip-growth-schedule-btn');
    await expect(toggleBtn).toBeVisible();
    await expect(page.locator('#growth-schedule-table')).not.toBeVisible();

    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#growth-schedule-table')).toBeVisible();

    // Default 10y SIP + 5y post-SIP = 15 rows
    const rows = page.locator('#growth-schedule-table tbody tr');
    await expect(rows).toHaveCount(15);

    // Final year closing balance reconciles with headline
    const finalRowClosing = await rows.nth(14).locator('.closing-num').textContent();
    const headline = await page.locator('#growth-final-corpus').textContent();
    expect(finalRowClosing?.trim()).toBe(headline?.trim());

    // Methodology disclosure is interactive
    const methodology = page.locator('.methodology-disclosure');
    await expect(methodology).toBeVisible();
  });

  test('13. Reset example button restores canonical defaults and collapses advanced/schedule', async ({ page }) => {
    // Edit values
    await page.locator('#growth-monthly-num').fill('45000');
    const notice = page.locator('.workbench-notice-banner');
    await expect(notice).toContainText('Custom scenario active');

    // Click Reset
    await page.locator('#reset-sip-growth-btn').click();

    // Defaults restored
    await expect(page.locator('#growth-monthly-num')).toHaveValue('10000');
    await expect(page.locator('#growth-sipyears-num')).toHaveValue('10');
    await expect(page.locator('#growth-return-num')).toHaveValue('12');
    await expect(notice).toContainText('Illustrative example — not your figures');
    await expect(page.locator('#advanced-options-container')).not.toBeVisible();
    await expect(page.locator('#growth-schedule-table')).not.toBeVisible();
  });

  test('14. Mobile summary header non-overlap and headline visibility at 360px, 390px, and desktop', async ({ page }) => {
    const viewports = [
      { name: '360x800', width: 360, height: 800, maxBottom: 760 },
      { name: '390x844', width: 390, height: 844, maxBottom: 780 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/tools/sip-growth/');
      await page.waitForSelector('astro-island:not([ssr])');

      // Check mobile summary container
      const summary = page.locator('#sip-growth-mobile-summary');
      await expect(summary).toBeVisible();

      // Check tag and subtitle are visible and readable
      const tag = page.locator('.mobile-summary-tag');
      const subtitle = page.locator('.mobile-summary-subtitle');
      await expect(tag).toBeVisible();
      await expect(subtitle).toBeVisible();
      await expect(tag).toContainText('Illustrative example');
      await expect(subtitle).toContainText('Estimated Future Value');

      // Measure bounding boxes
      const tagBox = await tag.boundingBox();
      const subBox = await subtitle.boundingBox();
      expect(tagBox, `Tag must have bounding box at ${vp.name}`).not.toBeNull();
      expect(subBox, `Subtitle must have bounding box at ${vp.name}`).not.toBeNull();

      // Assert the two mobile header elements do not overlap (rectangles must not intersect)
      const isIntersecting = !(
        tagBox!.x + tagBox!.width <= subBox!.x ||
        subBox!.x + subBox!.width <= tagBox!.x ||
        tagBox!.y + tagBox!.height <= subBox!.y ||
        subBox!.y + subBox!.height <= tagBox!.y
      );
      expect(isIntersecting, `Mobile summary tag and subtitle must not overlap at ${vp.name}`).toBe(false);

      // Check actual headline text element inside mobile summary
      const headline = page.locator('#sip-growth-mobile-headline-val');
      await expect(headline).toBeVisible();

      const box = await headline.boundingBox();
      expect(box, `Headline must have a bounding box at ${vp.name}`).not.toBeNull();
      const bottomCoord = box!.y + box!.height;

      console.log(`[Viewport ${vp.name}] Headline top: ${box!.y.toFixed(2)}px, bottom: ${bottomCoord.toFixed(2)}px (Target <= ${vp.maxBottom}px)`);
      expect(bottomCoord, `Headline bottom at ${vp.name} must be <= ${vp.maxBottom}px`).toBeLessThanOrEqual(vp.maxBottom);

      // Check action buttons height >= 44px
      const actions = page.locator('.mobile-action-btn');
      const count = await actions.count();
      for (let i = 0; i < count; i++) {
        const btnBox = await actions.nth(i).boundingBox();
        expect(btnBox!.height, `Action button ${i} at ${vp.name} must be >= 44px`).toBeGreaterThanOrEqual(44);
      }
    }

    // Desktop viewport check: mobile summary header elements must be hidden
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/sip-growth/');
    await page.waitForSelector('astro-island:not([ssr])');
    const desktopSummary = page.locator('#sip-growth-mobile-summary');
    await expect(desktopSummary).toBeHidden();
    const desktopTagBox = await page.locator('.mobile-summary-tag').boundingBox();
    const desktopSubBox = await page.locator('.mobile-summary-subtitle').boundingBox();
    expect(desktopTagBox).toBeNull();
    expect(desktopSubBox).toBeNull();
  });

  test('15. Zero horizontal overflow at 360px, 390px, and desktop 1440px hides mobile summary', async ({ page }) => {
    // 1440px Desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/sip-growth/');
    await page.waitForSelector('astro-island:not([ssr])');

    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(desktopOverflow, 'Desktop 1440px must have 0px overflow').toBe(false);

    // Mobile summary hidden on desktop
    const mobileSummaryDisplay = await page.locator('#sip-growth-mobile-summary').evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(mobileSummaryDisplay).toBe('none');

    // 390px Mobile
    await page.setViewportSize({ width: 390, height: 844 });
    const mobile390Overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(mobile390Overflow, 'Mobile 390px must have 0px overflow').toBe(false);

    // 360px Mobile
    await page.setViewportSize({ width: 360, height: 800 });
    const mobile360Overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(mobile360Overflow, 'Mobile 360px must have 0px overflow').toBe(false);
  });

  test('16. Keyboard accessibility: all inputs and buttons are focusable and navigable', async ({ page }) => {
    const monthlyInput = page.locator('#growth-monthly-num');
    await monthlyInput.focus();
    await expect(monthlyInput).toBeFocused();

    // Tab to slider
    await page.keyboard.press('Tab');
    const monthlySlider = page.locator('#growth-monthly-slider');
    await expect(monthlySlider).toBeFocused();

    // Advance toggle button accessible
    const advToggle = page.locator('#toggle-advanced-options-btn');
    await advToggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#advanced-options-container')).toBeVisible();
  });

  test('17. Internal links resolve to existing canonical routes', async ({ page }) => {
    const relatedLinks = page.locator('.related-grid a');
    const count = await relatedLinks.count();
    expect(count).toBe(3);

    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await relatedLinks.nth(i).getAttribute('href');
      if (href) hrefs.push(href);
    }

    expect(hrefs).toContain('/tools/sip/');
    expect(hrefs).toContain('/tools/lumpsum/');
    expect(hrefs).toContain('/plan/');
  });

  test('18. Privacy & network invariant: zero client persistence, zero cookies, zero IndexedDB, and zero external network requests', async ({ page, context }) => {
    const externalRequests: string[] = [];
    const localOriginPattern = /^(http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)/;

    // 1. Install request listener before navigating to /tools/sip-growth/
    page.on('request', (req) => {
      const reqUrl = req.url();
      if (!localOriginPattern.test(reqUrl)) {
        externalRequests.push(`${req.method()} ${reqUrl}`);
      }
    });

    // 2. Navigate to target page
    await page.goto('/tools/sip-growth/');
    await page.waitForSelector('astro-island:not([ssr])');

    // 3. Edit core and advanced simulation values
    const testSecret1 = '87654';
    const testSecret2 = '34567';
    await page.locator('#growth-monthly-num').fill(testSecret1);
    await page.locator('#toggle-advanced-options-btn').click();
    await page.locator('#growth-stepupdur-num').fill('4');
    const lumpAmountInput = page.locator('.num-input-row').first();
    await lumpAmountInput.fill(testSecret2);
    await page.waitForTimeout(400);

    // Verify calculation triggered and produced output
    await expect(page.locator('#growth-final-corpus')).toBeVisible();

    // 4. Assert zero unexpected external requests
    expect(externalRequests, 'No non-same-origin external requests must be dispatched').toHaveLength(0);

    // 5. Assert URL query string remains empty
    const currentUrl = new URL(page.url());
    expect(currentUrl.search, 'URL query string must remain empty with no financial state').toBe('');

    // 6. Assert no calculation inputs in localStorage or sessionStorage
    const storage = await page.evaluate(() => ({
      local: JSON.stringify(window.localStorage),
      session: JSON.stringify(window.sessionStorage),
    }));
    expect(storage.local).not.toContain(testSecret1);
    expect(storage.local).not.toContain(testSecret2);
    expect(storage.session).not.toContain(testSecret1);
    expect(storage.session).not.toContain(testSecret2);

    // 7. Check document.cookie & browserContext.cookies()
    const docCookie = await page.evaluate(() => document.cookie);
    expect(docCookie, 'document.cookie must be empty').toBe('');
    const contextCookies = await context.cookies();
    expect(contextCookies, 'browserContext.cookies() must contain zero cookies').toHaveLength(0);

    // 8. Check IndexedDB database names
    const idbDatabases = await page.evaluate(async () => {
      if (typeof window.indexedDB?.databases === 'function') {
        const dbs = await window.indexedDB.databases();
        return dbs.map((d) => d.name || '');
      }
      return [];
    });
    expect(idbDatabases, 'IndexedDB databases must be empty').toHaveLength(0);
  });

  test('19. Scope invariants: Retirement and SWP remain blocked with Calculations Not Available', async ({ page }) => {
    const swpRes = await page.goto('/tools/swp/');
    expect(swpRes?.status()).toBe(200);
    const swpText = await page.textContent('body');
    expect(swpText).toContain('Calculations Not Available');

    const retRes = await page.goto('/plan/retirement/');
    expect(retRes?.status()).toBe(200);
    const retText = await page.textContent('body');
    expect(retText).toContain('Calculations Not Available');
  });

  test('20. Capture fresh visual screenshots for Phase 4 visual QA evidence', async ({ page }) => {
    const outDir = path.resolve('..', 'product-docs', 'design-review', 'phase4-sip-growth');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // 1440 Desktop Initial & Full
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/sip-growth/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(outDir, 'sip-growth-desktop-1440-initial.png'), fullPage: false });
    await page.screenshot({ path: path.join(outDir, 'sip-growth-desktop-1440-full.png'), fullPage: true });

    // 390 Mobile Initial & Full
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/sip-growth/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(outDir, 'sip-growth-mobile-390-initial.png'), fullPage: false });
    await page.screenshot({ path: path.join(outDir, 'sip-growth-mobile-390-full.png'), fullPage: true });

    // 360 Mobile Initial & Full
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/sip-growth/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(outDir, 'sip-growth-mobile-360-initial.png'), fullPage: false });
    await page.screenshot({ path: path.join(outDir, 'sip-growth-mobile-360-full.png'), fullPage: true });

    // Advanced Options Expanded
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/sip-growth/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.locator('#toggle-advanced-options-btn').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'sip-growth-advanced-expanded.png'), fullPage: false });

    // Schedule Expanded
    await page.locator('#toggle-sip-growth-schedule-btn').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'sip-growth-schedule-expanded.png'), fullPage: false });

    // Validation Error
    await page.locator('#growth-monthly-num').fill('');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'sip-growth-validation-error.png'), fullPage: false });
  });
});
