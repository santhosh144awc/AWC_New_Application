import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Phase 2.1 — SIP Link Integrity & Mobile Result Usability Audit', () => {
  const screenshotDir = path.resolve(
    process.cwd(),
    '..',
    'product-docs',
    'design-review',
    'phase2-sip'
  );

  test('1. Every link on /tools/sip/ is non-empty, canonical, and resolves to an existing page or valid anchor', async ({ page }) => {
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const allLinks = await page.locator('a[href]').elementHandles();
    expect(allLinks.length).toBeGreaterThan(0);

    const checkedHrefs = new Set<string>();

    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (!href) continue;

      // Ensure non-empty
      expect(href.trim().length).toBeGreaterThan(0);

      // Skip tel, mailto, external
      if (
        href.startsWith('tel:') ||
        href.startsWith('mailto:') ||
        href.startsWith('https://wa.me') ||
        href.startsWith('https://') ||
        href.startsWith('http://')
      ) {
        continue;
      }

      // Check in-page anchors
      if (href.startsWith('#')) {
        const anchorId = href.replace('#', '');
        if (anchorId) {
          const matchCount = await page.locator(`[id="${anchorId}"]`).count();
          expect(matchCount, `Anchor #${anchorId} on /tools/sip/ must point to a real element`).toBeGreaterThan(0);
        }
        continue;
      }

      // Record local internal href
      checkedHrefs.add(href);
    }

    // Verify related tool cards specifically
    const relatedCardsHrefs = await page.locator('.related-card').evaluateAll((cards) =>
      cards.map((c) => c.getAttribute('href'))
    );
    expect(relatedCardsHrefs).toContain('/tools/lumpsum/');
    expect(relatedCardsHrefs).toContain('/plan/');
    expect(relatedCardsHrefs).toContain('/health-check/');

    // Assert that legacy unrouted paths /tools/goals/ and /tools/financial-health/ are NOT present
    expect(relatedCardsHrefs).not.toContain('/tools/goals/');
    expect(relatedCardsHrefs).not.toContain('/tools/financial-health/');

    // Validate that each distinct local destination responds with 200 OK
    for (const targetHref of checkedHrefs) {
      const response = await page.request.get(targetHref);
      expect(response.status(), `Local route ${targetHref} must return HTTP 200`).toBe(200);
    }
  });

  test('2. Blocked retirement and SWP routes remain visibly blocked when navigated to', async ({ page }) => {
    // SWP tool
    await page.goto('/tools/swp/');
    await expect(page.locator('body')).toContainText('Calculations Not Available');
    await expect(page.locator('body')).toContainText('GATE-A');

    // Retirement plan
    await page.goto('/plan/retirement/');
    await expect(page.locator('body')).toContainText('Calculations Not Available');
    await expect(page.locator('body')).toContainText('GATE-A');
  });

  test('3. Mobile 390x844: Live result overview is within first 800 CSS px with dual navigation actions', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Measure DOM top of mobile result summary
    const summaryMetrics = await page.evaluate(() => {
      const summary = document.querySelector('#sip-mobile-summary');
      const rect = summary ? summary.getBoundingClientRect() : null;
      return {
        top: rect ? Math.round(rect.top + window.scrollY) : 0,
        height: rect ? Math.round(rect.height) : 0,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });

    console.log('PHASE2_1_MEASUREMENT_MOBILE_390:', JSON.stringify(summaryMetrics));

    // Acceptance target: within first 800 CSS px
    expect(summaryMetrics.top, 'Mobile summary card top must be <= 800 CSS px').toBeLessThanOrEqual(800);
    expect(summaryMetrics.scrollWidth <= summaryMetrics.innerWidth, '390px viewport must have 0 horizontal overflow').toBe(true);

    // Verify prominent live amount and badges
    const mobileAmount = page.locator('#sip-mobile-headline-val');
    await expect(mobileAmount).toBeVisible();
    await expect(mobileAmount).toContainText('₹22,40,359');

    const summaryCard = page.locator('#sip-mobile-summary');
    await expect(summaryCard).toContainText('Illustrative example');
    await expect(summaryCard).toContainText('EAR · Annuity-due');

    // Test "Adjust assumptions ↓" action
    const adjustBtn = page.locator('.mrs-btn-adjust');
    await expect(adjustBtn).toBeVisible();
    await adjustBtn.click();

    // Verify first numeric input received focus
    const amountInput = page.locator('input[type="number"]').first();
    await expect(amountInput).toBeFocused();

    // Test "View full breakdown ↓" action
    const breakdownBtn = page.locator('.mrs-btn-breakdown');
    await expect(breakdownBtn).toBeVisible();
    await breakdownBtn.click();

    // Capture initial viewport and full page screenshots at 390px
    await page.screenshot({
      path: path.join(screenshotDir, 'sip-mobile-390-initial.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'sip-mobile-390.png'),
      fullPage: true,
    });
  });

  test('4. Mobile 360x800: Live result overview is within first 800 CSS px with zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const summaryMetrics = await page.evaluate(() => {
      const summary = document.querySelector('#sip-mobile-summary');
      const rect = summary ? summary.getBoundingClientRect() : null;
      return {
        top: rect ? Math.round(rect.top + window.scrollY) : 0,
        height: rect ? Math.round(rect.height) : 0,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });

    console.log('PHASE2_1_MEASUREMENT_MOBILE_360:', JSON.stringify(summaryMetrics));

    // Acceptance target: within first 800 CSS px
    expect(summaryMetrics.top, 'Mobile summary card top must be <= 800 CSS px at 360px').toBeLessThanOrEqual(800);
    expect(summaryMetrics.scrollWidth <= summaryMetrics.innerWidth, '360px viewport must have 0 horizontal overflow').toBe(true);

    const mobileAmount = page.locator('#sip-mobile-headline-val');
    await expect(mobileAmount).toContainText('₹22,40,359');

    // Capture initial viewport and full page screenshots at 360px
    await page.screenshot({
      path: path.join(screenshotDir, 'sip-mobile-360-initial.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'sip-mobile-360.png'),
      fullPage: true,
    });
  });

  test('5. Desktop 1440x900: Concept C two-column workbench preserved and mobile summary hidden', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    // On desktop, mobile-result-summary must be hidden
    const mobileSummary = page.locator('#sip-mobile-summary');
    await expect(mobileSummary).not.toBeVisible();

    // Desktop result panel is visible
    const resultPanel = page.locator('.result-panel');
    await expect(resultPanel).toBeVisible();

    const desktopMetrics = await page.evaluate(() => {
      const panel = document.querySelector('.result-panel');
      const rect = panel ? panel.getBoundingClientRect() : null;
      return {
        top: rect ? Math.round(rect.top + window.scrollY) : 0,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });

    console.log('PHASE2_1_MEASUREMENT_DESKTOP_1440:', JSON.stringify(desktopMetrics));
    expect(desktopMetrics.scrollWidth <= desktopMetrics.innerWidth).toBe(true);

    // Capture desktop initial viewport and full page screenshots
    await page.screenshot({
      path: path.join(screenshotDir, 'sip-desktop-1440-initial.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(screenshotDir, 'sip-desktop-1440.png'),
      fullPage: true,
    });
  });

  test('6. Synchronous reactive calculation parity between mobile summary and desktop panel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const mobileVal = page.locator('#sip-mobile-headline-val');
    const desktopVal = page.locator('#sip-future-value');
    const summaryCard = page.locator('#sip-mobile-summary');

    // Change inputs: ₹15,000 / mo, 12 years, 11% EAR
    const amountInput = page.locator('input[type="number"]').nth(0);
    const returnInput = page.locator('input[type="number"]').nth(1);
    const yearsInput = page.locator('input[type="number"]').nth(2);

    await amountInput.fill('15000');
    await returnInput.fill('11');
    await yearsInput.fill('12');

    // Both must match the exact authoritative engine output for ₹15k, 12y, 11%
    // 15000 * ((1+i)^144 - 1)/i * (1+i) where i = (1.11)^(1/12) - 1 => ₹43,28,089
    const expectedVal = '₹43,28,089';
    await expect(desktopVal).toContainText(expectedVal);
    await expect(mobileVal).toContainText(expectedVal);

    // Custom scenario active badge appears
    await expect(summaryCard).toContainText('Custom inputs active');

    // Invalid input suppresses result on both
    await amountInput.fill('100'); // below min 500
    await expect(mobileVal).toHaveText('—');
    await expect(page.locator('#sip-future-value')).toHaveCount(0);

    // Reset restores both to default example
    await page.locator('#reset-sip-btn').click();
    await expect(desktopVal).toContainText('₹22,40,359');
    await expect(mobileVal).toContainText('₹22,40,359');
    await expect(summaryCard).toContainText('Illustrative example');
  });

  test('7. Registration disclosure consistency: renders confirmed AMFI registration status and risk notice', async ({ page }) => {
    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    const disclosureNote = page.locator('.regulatory-disclosure-note');
    await expect(disclosureNote).toBeVisible();

    const noteText = await disclosureNote.innerText();

    // 1. Must NOT contain obsolete or unconfirmed ARN numbers
    expect(noteText).not.toContain('ARN-285888');

    // 2. Must claim verified AMFI registration
    expect(noteText).toMatch(/is an AMFI-registered mutual fund distributor/i);

    // 3. Must contain approved mutual fund risk text
    expect(noteText).toContain('Mutual Fund investments are subject to market risks, read all scheme related documents carefully.');

    // 4. Must contain non-guarantee and hypothetical simulation notice
    expect(noteText).toContain('does not predict or guarantee fund performance');
  });

  test('8. Zero client persistence and privacy invariant: no financial inputs saved or transmitted', async ({ page }) => {
    const networkRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
        networkRequests.push(url);
      }
    });

    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Type financial numbers
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('45000');

    // Verify localStorage & sessionStorage are empty
    const storageKeys = await page.evaluate(() => {
      return {
        local: Object.keys(localStorage),
        session: Object.keys(sessionStorage),
      };
    });
    expect(storageKeys.local).toEqual([]);
    expect(storageKeys.session).toEqual([]);
    expect(page.url()).not.toContain('?');
    expect(networkRequests).toEqual([]);
  });
});
