import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Phase 21 / Phase 2 — SIP Calculator Concept C Redesign (/tools/sip/)', () => {
  test('1. Canonical route loads with exactly one H1 and zero console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Assert canonical route
    expect(page.url()).toContain('/tools/sip/');

    // Assert single H1 with Concept C headline
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
    await expect(h1s).toHaveText('See what regular investing could build.');

    // Assert zero console errors
    expect(consoleErrors).toEqual([]);
  });

  test('2. Workbench structure is visually evident without legacy redundant shells', async ({ page }) => {
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Workbench app wrapper
    const workbench = page.locator('#sip-calculator-app');
    await expect(workbench).toBeVisible();

    // Controls surface and Results panel are present
    await expect(page.locator('.controls-card')).toBeVisible();
    await expect(page.locator('.result-panel')).toBeVisible();

    // Verify old legacy static cards are NOT rendered
    await expect(page.locator('.educational-insight-box')).toHaveCount(0);
    await expect(page.locator('.strategy-section')).toHaveCount(0);
  });

  test('3. Neutral illustrative example state is explicitly labelled and customizable', async ({ page }) => {
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const noticeBanner = page.locator('.workbench-notice-banner');
    await expect(noticeBanner).toBeVisible();
    await expect(noticeBanner).toContainText('Illustrative example — not your figures');

    // Customize an input
    const monthlyInput = page.locator('input[type="number"]').first();
    await monthlyInput.fill('15000');

    // Banner indicates custom scenario active
    await expect(noticeBanner).toHaveClass(/is-customized/);
    await expect(noticeBanner).toContainText('Custom scenario active');

    // Reset restores illustrative notice
    const resetBtn = page.locator('#reset-sip-btn');
    await resetBtn.click();
    await expect(noticeBanner).not.toHaveClass(/is-customized/);
    await expect(noticeBanner).toContainText('Illustrative example — not your figures');
  });

  test('4. Authoritative domain calculation vector verification (VEC-SIP-1 and default)', async ({ page }) => {
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const futureVal = page.locator('#sip-future-value');
    const mobileVal = page.locator('#sip-mobile-headline-val');
    const investedVal = page.locator('#sip-total-invested');
    const gainVal = page.locator('#sip-total-gain');

    // Default vector: ₹10,000/mo, 10 yrs, 12% EAR, 0% step-up
    // Future Value = ₹22,40,359, Invested = ₹12,00,000, Gain = ₹10,40,359
    await expect(futureVal).toContainText('₹22,40,359');
    await expect(mobileVal).toContainText('₹22,40,359');
    await expect(investedVal).toContainText('₹12,00,000');
    await expect(gainVal).toContainText('₹10,40,359');

    // Test VEC-SIP-1: ₹5,000/mo, 10 yrs, 12% EAR, 0% step-up
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('5000');

    // FV = ₹11,20,179, Invested = ₹6,00,000, Gain = ₹5,20,179
    await expect(futureVal).toContainText('₹11,20,179');
    await expect(mobileVal).toContainText('₹11,20,179');
    await expect(investedVal).toContainText('₹6,00,000');
    await expect(gainVal).toContainText('₹5,20,179');
  });

  test('5. Dynamic reactive recalculation upon changing inputs and sliders', async ({ page }) => {
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const durationInput = page.locator('input[type="number"]').nth(2);
    const returnInput = page.locator('input[type="number"]').nth(1);
    const futureVal = page.locator('#sip-future-value');

    // Change duration to 15 years (12% EAR annuity-due)
    await durationInput.fill('15');
    await expect(futureVal).toContainText('₹47,59,314');

    // Change return to 10% (10% EAR annuity-due)
    await returnInput.fill('10');
    await expect(futureVal).toContainText('₹40,16,212');
  });

  test('6. Step-up changes update output and zero step-up behaves cleanly', async ({ page }) => {
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const stepUpInput = page.locator('input[type="number"]').nth(3);

    // Initial step-up = 0%: comparison card hidden
    await expect(page.locator('#sip-stepup-comparison')).not.toBeVisible();

    // Step-up = 10%: comparison card appears with real metrics
    await stepUpInput.fill('10');
    const compCard = page.locator('#sip-stepup-comparison');
    await expect(compCard).toBeVisible();
    await expect(compCard).toContainText('Scenario Comparison');
    await expect(page.locator('#adv-fixed-corpus')).toContainText('Fixed: ₹22,40,359');
    await expect(page.locator('#adv-stepup-corpus')).toContainText('Step-Up: ₹32,68,898');
    await expect(page.locator('#adv-diff-corpus')).toContainText('+₹10,28,540 more wealth');

    // Step-up back to 0%: comparison hides cleanly
    await stepUpInput.fill('0');
    await expect(compCard).not.toBeVisible();
  });

  test('7. Reset/clear actions restore exact documented defaults', async ({ page }) => {
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const amountInput = page.locator('input[type="number"]').nth(0);
    const returnInput = page.locator('input[type="number"]').nth(1);
    const yearsInput = page.locator('input[type="number"]').nth(2);
    const stepUpInput = page.locator('input[type="number"]').nth(3);

    // Modify all inputs
    await amountInput.fill('25000');
    await returnInput.fill('15');
    await yearsInput.fill('20');
    await stepUpInput.fill('5');

    // Click Reset
    await page.locator('#reset-sip-btn').click();

    await expect(amountInput).toHaveValue('10000');
    await expect(returnInput).toHaveValue('12');
    await expect(yearsInput).toHaveValue('10');
    await expect(stepUpInput).toHaveValue('0');
    await expect(page.locator('#sip-future-value')).toContainText('₹22,40,359');
  });

  test('8. Out-of-bounds inputs display inline errors and suppress stale outputs', async ({ page }) => {
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('200'); // below 500 minimum

    const errorMsg = page.locator('#sip-calculator-app .field-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('between ₹500 and ₹10,00,000');

    // Invalid state box suppresses stale result
    await expect(page.locator('.invalid-state-box')).toBeVisible();
    await expect(page.locator('#sip-future-value')).toHaveCount(0);
  });

  test('9. Keyboard accessibility and polite screen-reader announcements', async ({ page }) => {
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const liveAnnouncement = page.locator('#sip-live-announcement');
    await expect(liveAnnouncement).toHaveAttribute('aria-live', 'polite');
    await expect(liveAnnouncement).toContainText('SIP calculation updated');

    // Tab through inputs
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.focus();
    await expect(amountInput).toBeFocused();
  });

  test('10. Zero horizontal overflow & visual screenshot capture at 1440px, 390px, 360px', async ({ page }) => {
    const screenshotDir = path.resolve(
      process.cwd(),
      '..',
      'product-docs',
      'design-review',
      'phase2-sip'
    );

    // 1. Desktop 1440px
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const desktopMetrics = await page.evaluate(() => {
      const panel = document.querySelector('.result-panel');
      const rect = panel ? panel.getBoundingClientRect() : null;
      return {
        panelTop: rect ? Math.round(rect.top + window.scrollY) : 0,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    console.log('MEASUREMENT_DESKTOP_1440:', JSON.stringify(desktopMetrics));
    expect(desktopMetrics.scrollWidth <= desktopMetrics.innerWidth, 'Desktop (1440px) must have zero horizontal overflow').toBe(true);

    await page.screenshot({
      path: path.join(screenshotDir, 'sip-desktop-1440.png'),
      fullPage: true,
    });

    // 2. Mobile 390px (iPhone 12/13/14 standard)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const mobile390Metrics = await page.evaluate(() => {
      const panel = document.querySelector('.result-panel');
      const rect = panel ? panel.getBoundingClientRect() : null;
      return {
        panelTop: rect ? Math.round(rect.top + window.scrollY) : 0,
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    console.log('MEASUREMENT_MOBILE_390:', JSON.stringify(mobile390Metrics));
    expect(mobile390Metrics.scrollWidth <= mobile390Metrics.innerWidth, 'Mobile (390px) must have zero horizontal overflow').toBe(true);

    await page.screenshot({
      path: path.join(screenshotDir, 'sip-mobile-390.png'),
      fullPage: true,
    });

    // 3. Mobile 360px (compact Android standard)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const mobile360Metrics = await page.evaluate(() => {
      const panel = document.querySelector('.result-panel');
      const rect = panel ? panel.getBoundingClientRect() : null;
      return {
        panelTop: rect ? Math.round(rect.top + window.scrollY) : 0,
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    console.log('MEASUREMENT_MOBILE_360:', JSON.stringify(mobile360Metrics));
    expect(mobile360Metrics.scrollWidth <= mobile360Metrics.innerWidth, 'Mobile (360px) must have zero horizontal overflow').toBe(true);

    await page.screenshot({
      path: path.join(screenshotDir, 'sip-mobile-360.png'),
      fullPage: true,
    });
  });

  test('11. Zero persistence and network privacy invariant', async ({ page }) => {
    const networkRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
        networkRequests.push(url);
      }
    });

    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Type private financial numbers
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('75000');

    // Verify localStorage & sessionStorage are empty
    const storageKeys = await page.evaluate(() => {
      return {
        local: Object.keys(localStorage),
        session: Object.keys(sessionStorage),
      };
    });
    expect(storageKeys.local).toEqual([]);
    expect(storageKeys.session).toEqual([]);

    // Verify URL search params remain empty
    expect(page.url()).not.toContain('?');

    // Verify no external requests fired
    expect(networkRequests).toEqual([]);
  });

  test('12. No external fonts or third-party asset calls introduced', async ({ page }) => {
    const thirdPartyCalls: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('google') || url.includes('typekit') || url.includes('cdn')) {
        thirdPartyCalls.push(url);
      }
    });

    await page.goto('/tools/sip/');
    await page.waitForLoadState('networkidle');

    expect(thirdPartyCalls).toEqual([]);
  });
});
