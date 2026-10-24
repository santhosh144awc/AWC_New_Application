import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Phase 22.1 / Phase 3.1 — Lump-Sum Mobile Result Visibility & QA Accuracy Audit (/tools/lumpsum/)', () => {
  const screenshotDir = path.resolve(
    process.cwd(),
    '..',
    'product-docs',
    'design-review',
    'phase3-lumpsum'
  );

  test('1. Mobile 360x800: Future value text element bottom is <= 760 CSS px (fully visible without scroll)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const m360 = await page.evaluate(() => {
      const summary = document.querySelector('#lumpsum-mobile-summary');
      const headline = document.querySelector('#lumpsum-mobile-headline-val');
      const adjust = document.querySelector('.mrs-btn-adjust');
      const breakdown = document.querySelector('.mrs-btn-breakdown');
      const sRect = summary ? summary.getBoundingClientRect() : null;
      const hRect = headline ? headline.getBoundingClientRect() : null;
      const aRect = adjust ? adjust.getBoundingClientRect() : null;
      const bRect = breakdown ? breakdown.getBoundingClientRect() : null;
      return {
        summaryTop: sRect ? Math.round(sRect.top + window.scrollY) : 0,
        headlineTop: hRect ? Math.round(hRect.top + window.scrollY) : 0,
        headlineBottom: hRect ? Math.round(hRect.bottom + window.scrollY) : 0,
        adjustHeight: aRect ? Math.round(aRect.height) : 0,
        breakdownHeight: bRect ? Math.round(bRect.height) : 0,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });

    console.log('PHASE3_1_MEASUREMENT_360:', JSON.stringify(m360));

    // Hard requirement: Future value text bottom <= 760 CSS px on 360x800
    expect(m360.headlineBottom, 'Headline number bottom must be <= 760 CSS px on 360x800').toBeLessThanOrEqual(760);
    expect(m360.summaryTop, 'Summary top must be well within initial screen').toBeLessThanOrEqual(600);
    expect(m360.adjustHeight, 'Adjust assumptions button must be at least 44px high').toBeGreaterThanOrEqual(44);
    expect(m360.breakdownHeight, 'View breakdown button must be at least 44px high').toBeGreaterThanOrEqual(44);
    expect(m360.scrollWidth <= m360.innerWidth + 1, 'Zero horizontal overflow at 360px').toBe(true);

    // Capture screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'lumpsum-mobile-360-phase3-1-initial.png'),
      fullPage: false,
    });
  });

  test('2. Mobile 390x844: Future value text element bottom is <= 780 CSS px (fully visible without scroll)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const m390 = await page.evaluate(() => {
      const summary = document.querySelector('#lumpsum-mobile-summary');
      const headline = document.querySelector('#lumpsum-mobile-headline-val');
      const adjust = document.querySelector('.mrs-btn-adjust');
      const breakdown = document.querySelector('.mrs-btn-breakdown');
      const sRect = summary ? summary.getBoundingClientRect() : null;
      const hRect = headline ? headline.getBoundingClientRect() : null;
      const aRect = adjust ? adjust.getBoundingClientRect() : null;
      const bRect = breakdown ? breakdown.getBoundingClientRect() : null;
      return {
        summaryTop: sRect ? Math.round(sRect.top + window.scrollY) : 0,
        headlineTop: hRect ? Math.round(hRect.top + window.scrollY) : 0,
        headlineBottom: hRect ? Math.round(hRect.bottom + window.scrollY) : 0,
        adjustHeight: aRect ? Math.round(aRect.height) : 0,
        breakdownHeight: bRect ? Math.round(bRect.height) : 0,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });

    console.log('PHASE3_1_MEASUREMENT_390:', JSON.stringify(m390));

    // Hard requirement: Future value text bottom <= 780 CSS px on 390x844
    expect(m390.headlineBottom, 'Headline number bottom must be <= 780 CSS px on 390x844').toBeLessThanOrEqual(780);
    expect(m390.summaryTop, 'Summary top must be well within initial screen').toBeLessThanOrEqual(600);
    expect(m390.adjustHeight, 'Adjust assumptions button must be at least 44px high').toBeGreaterThanOrEqual(44);
    expect(m390.breakdownHeight, 'View breakdown button must be at least 44px high').toBeGreaterThanOrEqual(44);
    expect(m390.scrollWidth <= m390.innerWidth + 1, 'Zero horizontal overflow at 390px').toBe(true);

    // Capture screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'lumpsum-mobile-390-phase3-1-initial.png'),
      fullPage: false,
    });
  });

  test('3. Changing principal, return, or years updates mobile summary and desktop result to the identical authoritative domain result', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const mobileHeadline = page.locator('#lumpsum-mobile-headline-val');
    const desktopHeadline = page.locator('#lumpsum-future-value');

    // Default: ₹3,10,585
    await expect(mobileHeadline).toContainText('₹3,10,585');
    await expect(desktopHeadline).toContainText('₹3,10,585');

    // Change principal to ₹3,00,000 (300000 * 1.12^10 = 9,31,754.46 -> ₹9,31,754)
    await page.locator('input[type="number"]').first().fill('300000');
    await expect(mobileHeadline).toContainText('₹9,31,754');
    await expect(desktopHeadline).toContainText('₹9,31,754');

    // Change return to 8% (300000 * 1.08^10 = 6,47,677.44 -> ₹6,47,677)
    await page.locator('input[type="number"]').nth(1).fill('8');
    await expect(mobileHeadline).toContainText('₹6,47,677');
    await expect(desktopHeadline).toContainText('₹6,47,677');

    // Change duration to 15 years (300000 * 1.08^15 = 9,51,650.69 -> ₹9,51,651)
    await page.locator('input[type="number"]').nth(2).fill('15');
    await expect(mobileHeadline).toContainText('₹9,51,651');
    await expect(desktopHeadline).toContainText('₹9,51,651');
  });

  test('4. Invalid/empty intermediate input never displays stale amount as if current; shows safe unavailable state', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const mobileHeadline = page.locator('#lumpsum-mobile-headline-val');
    const principalInput = page.locator('input[type="number"]').first();

    // 1. Below min bound (₹2,000 < ₹5,000)
    await principalInput.fill('2000');
    await expect(mobileHeadline).toHaveText('—');
    await expect(page.locator('.invalid-state-box')).toBeVisible();
    await expect(page.locator('#lumpsum-future-value')).toHaveCount(0);

    // 2. Empty input
    await principalInput.fill('');
    await expect(mobileHeadline).toHaveText('—');
    await expect(page.locator('.invalid-state-box')).toBeVisible();
    await expect(page.locator('#lumpsum-future-value')).toHaveCount(0);
  });

  test('5. Summary actions navigate correctly: Adjust navigates/focuses principal input, Breakdown links to #workbench-results', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Check breakdown button href
    const breakdownBtn = page.locator('.mrs-btn-breakdown');
    await expect(breakdownBtn).toHaveAttribute('href', '#workbench-results');
    await expect(page.locator('#workbench-results')).toBeAttached();

    // Click adjust assumptions button and assert focus
    const adjustBtn = page.locator('.mrs-btn-adjust');
    await adjustBtn.click();
    const principalInput = page.locator('input[type="number"]').first();
    await expect(principalInput).toBeFocused();
  });

  test('6. Summary status tag and reset behavior remain correct', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const tag = page.locator('.mrs-tag');
    await expect(tag).toContainText('Illustrative example');
    await expect(tag).toHaveClass(/tag-example/);

    // Customize
    await page.locator('input[type="number"]').first().fill('400000');
    await expect(tag).toContainText('Custom inputs active');
    await expect(tag).toHaveClass(/tag-custom/);

    // Reset via banner button
    await page.locator('.banner-reset-action').click();
    await expect(tag).toContainText('Illustrative example');
    await expect(tag).toHaveClass(/tag-example/);
    await expect(page.locator('#lumpsum-mobile-headline-val')).toContainText('₹3,10,585');
  });

  test('7. Zero horizontal overflow at 360px and 390px; desktop 1440px retains 2-column layout and hides mobile summary', async ({ page }) => {
    // Desktop 1440
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    const desktopState = await page.evaluate(() => {
      const summary = document.querySelector('#lumpsum-mobile-summary');
      const panel = document.querySelector('.result-panel');
      const controls = document.querySelector('.controls-card');
      return {
        summaryDisplay: summary ? window.getComputedStyle(summary).display : null,
        panelVisible: !!panel && window.getComputedStyle(panel).display !== 'none',
        controlsVisible: !!controls && window.getComputedStyle(controls).display !== 'none',
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });

    expect(desktopState.summaryDisplay).toBe('none');
    expect(desktopState.panelVisible).toBe(true);
    expect(desktopState.controlsVisible).toBe(true);
    expect(desktopState.scrollWidth <= desktopState.innerWidth).toBe(true);

    await page.screenshot({
      path: path.join(screenshotDir, 'lumpsum-desktop-1440-phase3-1-initial.png'),
      fullPage: false,
    });
  });

  test('8. Zero persistence and network privacy invariant', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
        externalRequests.push(url);
      }
    });

    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    await page.locator('input[type="number"]').first().fill('650000');

    const storageKeys = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));
    expect(storageKeys.local).toEqual([]);
    expect(storageKeys.session).toEqual([]);
    expect(page.url()).not.toContain('?');
    expect(externalRequests).toEqual([]);
  });

  test('9. Existing 0% return, bounds, yearly schedule, and methodology disclosures work cleanly', async ({ page }) => {
    await page.goto('/tools/lumpsum/');
    await page.waitForSelector('astro-island:not([ssr])');

    // 0% return
    await page.locator('input[type="number"]').nth(1).fill('0');
    await expect(page.locator('#lumpsum-future-value')).toContainText('₹1,00,000');
    await expect(page.locator('#lumpsum-total-gain')).toContainText('₹0');
    await expect(page.locator('.rule72-context-card')).toContainText('Under an assumed 0% annual return, capital remains constant and does not double.');

    // Schedule toggle
    await page.locator('#toggle-lumpsum-schedule-btn').click();
    await expect(page.locator('#lumpsum-schedule-table')).toBeVisible();
    await expect(page.locator('#lumpsum-schedule-table tbody tr')).toHaveCount(10);
    await page.locator('#toggle-lumpsum-schedule-btn').click();
    await expect(page.locator('#lumpsum-schedule-table')).not.toBeVisible();

    // Methodology disclosure
    const details = page.locator('details.disclosure-item');
    await expect(details).toBeVisible();
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
  });
});
