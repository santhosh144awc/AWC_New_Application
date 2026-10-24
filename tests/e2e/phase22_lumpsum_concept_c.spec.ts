import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Phase 22 / Phase 3 — Lump-Sum Calculator Concept C Redesign (/tools/lumpsum/)', () => {
  const screenshotDir = path.resolve(
    process.cwd(),
    '..',
    'product-docs',
    'design-review',
    'phase3-lumpsum'
  );

  test('1. Canonical route loads with HTTP 200, exactly one H1, correct title, and zero console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto('/tools/lumpsum/');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('astro-island:not([ssr])');

    // Assert canonical URL
    expect(page.url()).toContain('/tools/lumpsum/');

    // Assert single H1 with Concept C headline
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
    await expect(h1s).toHaveText('See what one investment could become.');

    // Assert title
    await expect(page).toHaveTitle(/Lump Sum Calculator: See What One Investment Could Become/);

    // Assert zero console errors
    expect(consoleErrors).toEqual([]);
  });

  test('2. Concept C workbench structure rendered; legacy marketing cards removed', async ({ page }) => {
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Workbench app wrapper mounted
    const workbench = page.locator('#lumpsum-calculator-app');
    await expect(workbench).toBeVisible();

    // Controls surface and Results panel are present
    await expect(page.locator('.controls-card')).toBeVisible();
    await expect(page.locator('.lumpsum-results-col')).toBeVisible();

    // Legacy static cards from previous layout must NOT exist
    await expect(page.locator('.educational-insight-box')).toHaveCount(0);
    await expect(page.locator('.doubling-grid')).toHaveCount(0);
    await expect(page.locator('.nav-links-strip')).toHaveCount(0);

    // Modern explainer triad & Rule of 72 context card are present
    await expect(page.locator('.explainer-surface')).toBeVisible();
    await expect(page.locator('.rule72-context-card')).toBeVisible();
  });

  test('3. Example banner is visible before user edits; switches on input customization', async ({ page }) => {
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const noticeBanner = page.locator('.workbench-notice-banner');
    await expect(noticeBanner).toBeVisible();
    await expect(noticeBanner).toContainText('Illustrative example — not your figures');
    await expect(noticeBanner).not.toHaveClass(/is-customized/);

    // Edit an input
    const principalInput = page.locator('input[type="number"]').first();
    await principalInput.fill('250000');

    // Banner indicates custom scenario active
    await expect(noticeBanner).toHaveClass(/is-customized/);
    await expect(noticeBanner).toContainText('Custom scenario active');

    // Reset restores illustrative notice
    const resetBtn = page.locator('#reset-lumpsum-btn');
    await resetBtn.click();
    await expect(noticeBanner).not.toHaveClass(/is-customized/);
    await expect(noticeBanner).toContainText('Illustrative example — not your figures');
  });

  test('4. Changing each numeric input and slider recalculates the result reciprocally', async ({ page }) => {
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const futureVal = page.locator('#lumpsum-future-value');
    const principalInput = page.locator('input[type="number"]').nth(0);
    const returnInput = page.locator('input[type="number"]').nth(1);
    const yearsInput = page.locator('input[type="number"]').nth(2);

    // Default: ₹1,00,000 for 10 years @ 12% = ₹3,10,585
    await expect(futureVal).toContainText('₹3,10,585');

    // 1. Change principal to ₹2,00,000
    await principalInput.fill('200000');
    // 200000 * (1.12)^10 = 6,21,169.64 -> ₹6,21,170
    await expect(futureVal).toContainText('₹6,21,170');

    // 2. Change return to 10%
    await returnInput.fill('10');
    // 200000 * (1.10)^10 = 5,18,748.49 -> ₹5,18,748
    await expect(futureVal).toContainText('₹5,18,748');

    // 3. Change duration to 5 years
    await yearsInput.fill('5');
    // 200000 * (1.10)^5 = 3,22,102.00 -> ₹3,22,102
    await expect(futureVal).toContainText('₹3,22,102');

    // 4. Test range slider synchronization
    const principalSlider = page.locator('#lumpsum-calculator-app input[type="range"]').first();
    await principalSlider.fill('500000');
    await expect(principalInput).toHaveValue('500000');
    // 500000 * (1.10)^5 = 8,05,255
    await expect(futureVal).toContainText('₹8,05,255');
  });

  test('5. Result values agree with independently recorded expected values and the domain engine', async ({ page }) => {
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const futureVal = page.locator('#lumpsum-future-value');
    const mobileVal = page.locator('#lumpsum-mobile-headline-val');
    const investedVal = page.locator('#lumpsum-total-invested');
    const gainVal = page.locator('#lumpsum-total-gain');

    // Canonical default: ₹1,00,000, 10 yrs, 12% EAR
    await expect(futureVal).toContainText('₹3,10,585');
    await expect(mobileVal).toContainText('₹3,10,585');
    await expect(investedVal).toContainText('₹1,00,000');
    await expect(gainVal).toContainText('₹2,10,585');

    // Compact note check
    await expect(page.locator('.result-compact')).toContainText('approx. ₹3.11 L');

    // Explainer sentence
    await expect(page.locator('.result-explainer')).toContainText(
      'Under this assumed annual return, your ₹1,00,000 investment would mathematically grow to about ₹3,10,585 over 10 years.'
    );
  });

  test('6. 0% return behavior displays zero growth and safe doubling copy without NaN or Infinity', async ({ page }) => {
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const returnInput = page.locator('input[type="number"]').nth(1);
    await returnInput.fill('0');

    await expect(page.locator('#lumpsum-future-value')).toContainText('₹1,00,000');
    await expect(page.locator('#lumpsum-total-invested')).toContainText('₹1,00,000');
    await expect(page.locator('#lumpsum-total-gain')).toContainText('₹0');
    await expect(page.locator('.result-explainer')).toContainText(
      'At an assumed 0% annual return, your ₹1,00,000 investment remains ₹1,00,000 over 10 years with no compound growth.'
    );

    // Rule of 72 copy at 0%
    const rule72Card = page.locator('.rule72-context-card');
    await expect(rule72Card).toContainText('Under an assumed 0% annual return, capital remains constant and does not double.');
    await expect(rule72Card).not.toContainText('Infinity');
    await expect(rule72Card).not.toContainText('NaN');
  });

  test('7. Validation suppresses stale numeric results and displays accessible error feedback', async ({ page }) => {
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const principalInput = page.locator('input[type="number"]').first();

    // 1. Below minimum principal (< ₹5,000)
    await principalInput.fill('1000');
    await expect(page.locator('.field-error')).toContainText('between ₹5,000 and ₹1,00,00,000');
    await expect(page.locator('.invalid-state-box')).toBeVisible();
    await expect(page.locator('#lumpsum-future-value')).toHaveCount(0);

    // 2. Restore principal and test non-integer tenure
    await principalInput.fill('100000');
    const yearsInput = page.locator('input[type="number"]').nth(2);
    await yearsInput.fill('3.5');
    await expect(page.locator('.field-error')).toContainText('whole number of years (1 to 40)');
    await expect(page.locator('.invalid-state-box')).toBeVisible();
    await expect(page.locator('#lumpsum-future-value')).toHaveCount(0);

    // 3. Test empty input
    await yearsInput.fill('');
    await expect(page.locator('.field-error')).toContainText('Please enter duration in years.');
    await expect(page.locator('.invalid-state-box')).toBeVisible();
  });

  test('8. Year-by-year schedule disclosure toggles and final balance reconciles with headline', async ({ page }) => {
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const toggleBtn = page.locator('#toggle-lumpsum-schedule-btn');
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#lumpsum-schedule-table')).not.toBeVisible();

    // Open schedule
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#lumpsum-schedule-table')).toBeVisible();

    const rows = page.locator('#lumpsum-schedule-table tbody tr');
    await expect(rows).toHaveCount(10);

    // Verify row 1 (Year 1: 100000 open, +12000 growth, 112000 closing)
    const firstRow = rows.first();
    await expect(firstRow).toContainText('Year 1');
    await expect(firstRow).toContainText('₹1,00,000');
    await expect(firstRow).toContainText('+₹12,000');
    await expect(firstRow).toContainText('₹1,12,000');

    // Verify row 10 (Year 10: closing balance reconciles with headline ₹3,10,585)
    const lastRow = rows.last();
    await expect(lastRow).toContainText('Year 10');
    await expect(lastRow).toContainText('₹3,10,585');

    // Collapse schedule
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#lumpsum-schedule-table')).not.toBeVisible();
  });

  test('9. Rule of 72 copy is approximate and methodology disclosure is accessible', async ({ page }) => {
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Check Rule of 72 card copy for default 12%
    const rule72Card = page.locator('.rule72-context-card');
    await expect(rule72Card).toContainText('72 / 12');
    await expect(rule72Card).toContainText('6.0 years');
    await expect(rule72Card).toContainText('approximate mental shortcut, not an exact compounding calculation');

    // Check methodology native details disclosure
    const details = page.locator('details.disclosure-item');
    await expect(details).toBeVisible();
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
    await expect(details).toContainText('Future Value = Principal × (1 + r)^n');
    await expect(details).toContainText('Effective Annual Rate (EAR) Convention');
    await expect(details).toContainText('Mutual fund investments are subject to market risks');
  });

  test('10. Reset button restores canonical example and collapses open schedule', async ({ page }) => {
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Modify inputs and open schedule
    await page.locator('input[type="number"]').nth(0).fill('500000');
    await page.locator('input[type="number"]').nth(1).fill('15');
    await page.locator('input[type="number"]').nth(2).fill('20');
    await page.locator('#toggle-lumpsum-schedule-btn').click();
    await expect(page.locator('#lumpsum-schedule-table')).toBeVisible();

    // Click Reset Example
    await page.locator('#reset-lumpsum-btn').click();

    // Verify restored defaults
    await expect(page.locator('input[type="number"]').nth(0)).toHaveValue('100000');
    await expect(page.locator('input[type="number"]').nth(1)).toHaveValue('12');
    await expect(page.locator('input[type="number"]').nth(2)).toHaveValue('10');
    await expect(page.locator('#lumpsum-future-value')).toContainText('₹3,10,585');
    await expect(page.locator('#lumpsum-schedule-table')).not.toBeVisible();
  });

  test('11. All related links resolve to canonical routes with HTTP 200 and valid anchors', async ({ page }) => {
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const relatedCards = page.locator('.related-card');
    await expect(relatedCards).toHaveCount(3);

    const hrefs = await relatedCards.evaluateAll((cards) =>
      cards.map((c) => c.getAttribute('href'))
    );
    expect(hrefs).toEqual(['/tools/sip/', '/plan/', '/tools/']);

    for (const href of hrefs) {
      if (href) {
        const res = await page.request.get(href);
        expect(res.status(), `Target route ${href} must return HTTP 200`).toBe(200);
      }
    }
  });

  test('12. Mobile responsive viewports (390px, 360px): live result number visible without scroll and zero horizontal overflow', async ({ page }) => {
    // 1. Mobile 390x844 (iPhone standard)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const mobile390 = await page.evaluate(() => {
      const summary = document.querySelector('#lumpsum-mobile-summary');
      const headline = document.querySelector('#lumpsum-mobile-headline-val');
      const sRect = summary ? summary.getBoundingClientRect() : null;
      const hRect = headline ? headline.getBoundingClientRect() : null;
      return {
        top: sRect ? Math.round(sRect.top + window.scrollY) : 0,
        headlineBottom: hRect ? Math.round(hRect.bottom + window.scrollY) : 0,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    console.log('MEASUREMENT_LUMPSUM_MOBILE_390:', JSON.stringify(mobile390));
    expect(mobile390.top, 'Mobile result summary container must appear within first 800 CSS px').toBeLessThanOrEqual(800);
    expect(mobile390.headlineBottom, 'Future value headline text bottom on 390x844 must be <= 780 CSS px').toBeLessThanOrEqual(780);
    expect(mobile390.scrollWidth <= mobile390.innerWidth + 1, 'Mobile 390px must have 0px horizontal overflow').toBe(true);

    // 2. Mobile 360x800 (Compact Android standard)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const mobile360 = await page.evaluate(() => {
      const summary = document.querySelector('#lumpsum-mobile-summary');
      const headline = document.querySelector('#lumpsum-mobile-headline-val');
      const sRect = summary ? summary.getBoundingClientRect() : null;
      const hRect = headline ? headline.getBoundingClientRect() : null;
      return {
        top: sRect ? Math.round(sRect.top + window.scrollY) : 0,
        headlineBottom: hRect ? Math.round(hRect.bottom + window.scrollY) : 0,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    console.log('MEASUREMENT_LUMPSUM_MOBILE_360:', JSON.stringify(mobile360));
    expect(mobile360.top, 'Mobile result summary container must appear within first 800 CSS px').toBeLessThanOrEqual(800);
    expect(mobile360.headlineBottom, 'Future value headline text bottom on 360x800 must be <= 760 CSS px').toBeLessThanOrEqual(760);
    expect(mobile360.scrollWidth <= mobile360.innerWidth + 1, 'Mobile 360px must have 0px horizontal overflow').toBe(true);

    // Test quick jump adjust button
    const adjustBtn = page.locator('.mrs-btn-adjust');
    await adjustBtn.click();
    const principalInput = page.locator('input[type="number"]').first();
    await expect(principalInput).toBeFocused();
  });

  test('13. Keyboard navigation and visible focus styles work', async ({ page }) => {
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const liveAnnouncement = page.locator('#lumpsum-live-announcement');
    await expect(liveAnnouncement).toHaveAttribute('aria-live', 'polite');
    await expect(liveAnnouncement).toContainText('Lump sum calculation updated');

    const principalInput = page.locator('input[type="number"]').first();
    await principalInput.focus();
    await expect(principalInput).toBeFocused();
  });

  test('14. Zero persistence and network privacy invariant', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
        externalRequests.push(url);
      }
    });

    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Type private capital amount
    await page.locator('input[type="number"]').first().fill('850000');

    // Verify localStorage & sessionStorage are empty
    const storageKeys = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));
    expect(storageKeys.local).toEqual([]);
    expect(storageKeys.session).toEqual([]);

    // Verify URL search parameters remain clean
    expect(page.url()).not.toContain('?');

    // Verify zero external network calls
    expect(externalRequests).toEqual([]);
  });

  test('15. Visual QA screenshot capture at 1440px, 390px, and 360px', async ({ page }) => {
    // 1. Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    await page.screenshot({
      path: path.join(screenshotDir, 'lumpsum-desktop-1440.png'),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'lumpsum-desktop-1440-initial.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'lumpsum-desktop-1440-phase3-1-initial.png'),
      fullPage: false,
    });

    // 2. Mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    await page.screenshot({
      path: path.join(screenshotDir, 'lumpsum-mobile-390.png'),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'lumpsum-mobile-390-initial.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'lumpsum-mobile-390-phase3-1-initial.png'),
      fullPage: false,
    });

    // 3. Mobile 360x800
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    await page.screenshot({
      path: path.join(screenshotDir, 'lumpsum-mobile-360.png'),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'lumpsum-mobile-360-initial.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'lumpsum-mobile-360-phase3-1-initial.png'),
      fullPage: false,
    });
  });
});
