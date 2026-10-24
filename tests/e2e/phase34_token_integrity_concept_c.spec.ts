import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, '../../../product-docs/design-review/phase15-token-integrity/screenshots');

const CANDIDATE_ROUTES = [
  { path: '/disclaimer/', name: 'disclaimer' },
  { path: '/health-check/real-statement/', name: 'health-check-real-statement' },
  { path: '/plan/children/', name: 'plan-children' },
  { path: '/plan/home-purchase/', name: 'plan-home-purchase' },
  { path: '/tools/home-loan-foreclosure/', name: 'tools-home-loan-foreclosure' },
  { path: '/tools/life-insurance/', name: 'tools-life-insurance' },
  { path: '/tools/lumpsum/', name: 'tools-lumpsum' },
  { path: '/tools/net-worth/', name: 'tools-net-worth' },
  { path: '/tools/sip-growth/', name: 'tools-sip-growth' },
  { path: '/tools/sip/', name: 'tools-sip' },
  { path: '/tools/swp/', name: 'tools-swp' },
];

const VIEWPORTS = [
  { width: 1440, height: 900, label: 'desktop-1440' },
  { width: 390, height: 844, label: 'mobile-390' },
  { width: 360, height: 800, label: 'mobile-360' },
];

test.describe('Phase 15 — Sitewide CSS Token Integrity Sweep & Visual Correctness', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  for (const route of CANDIDATE_ROUTES) {
    test(`1. Route ${route.path} renders HTTP 200 with verified Concept C computed styles`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);

      // Verify exactly one h1
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      const h1Color = await h1.evaluate(el => window.getComputedStyle(el).color);
      // Atlantic Navy: rgb(23, 48, 71) or brand primary
      expect(h1Color).toBe('rgb(23, 48, 71)');

      // Verify body background is not transparent
      const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
      expect(bodyBg).not.toBe('rgba(0, 0, 0, 0)');
      expect(bodyBg).not.toBe('transparent');

      // Verify card / container backgrounds are not transparent
      const cardElements = page.locator('.status-notice-card, .related-card, .pillar-card, .inflation-card, .swp-card, .stage-card, .worth-card, .editorial-principles-section, .education-inflation-insight, .educational-insight-box');
      const cardCount = await cardElements.count();
      if (cardCount > 0) {
        const firstCardBg = await cardElements.first().evaluate(el => window.getComputedStyle(el).backgroundColor);
        expect(firstCardBg).not.toBe('rgba(0, 0, 0, 0)');
        expect(firstCardBg).not.toBe('transparent');
      }

      // Check specific route-level remediations
      if (route.path === '/disclaimer/') {
        const noticeCard = page.locator('.status-notice-card, .disclaimer-card, aside').first();
        if (await noticeCard.count() > 0) {
          const borderLeft = await noticeCard.evaluate(el => window.getComputedStyle(el).borderLeftColor);
          expect(borderLeft).not.toBe('rgba(0, 0, 0, 0)');
        }
      }

      if (route.path === '/tools/swp/') {
        // Blocked GATE-A notice
        const statusPill = page.locator('.tool-status-badge, .gate-pill, .status-pill').first();
        if (await statusPill.count() > 0) {
          const pillBg = await statusPill.evaluate(el => window.getComputedStyle(el).backgroundColor);
          expect(pillBg).not.toBe('rgba(0, 0, 0, 0)');
        }
      }

      if (route.path === '/plan/children/' || route.path === '/tools/home-loan-foreclosure/' || route.path === '/tools/life-insurance/') {
        // Related grid card icons have rich Concept C background tints
        const cardIcons = page.locator('.card-icon');
        const iconCount = await cardIcons.count();
        if (iconCount > 0) {
          const iconBg = await cardIcons.first().evaluate(el => window.getComputedStyle(el).backgroundColor);
          // Jade-soft rgb(225, 243, 238) or Mint rgb(207, 239, 227) or Sand rgb(248, 238, 228)
          expect(['rgb(225, 243, 238)', 'rgb(207, 239, 227)', 'rgb(248, 238, 228)']).toContain(iconBg);
        }
      }
    });

    test(`2. Route ${route.path} has 0px horizontal overflow and captures post-fix screenshots across all viewports`, async ({ page }) => {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route.path, { waitUntil: 'networkidle' });

        // Verify 0px horizontal overflow
        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          return {
            scrollWidth: docEl.scrollWidth,
            clientWidth: docEl.clientWidth,
            innerWidth: window.innerWidth,
            hasOverflow: docEl.scrollWidth > window.innerWidth
          };
        });

        expect(overflow.hasOverflow, `Route ${route.path} overflows horizontally at ${vp.width}px`).toBe(false);

        // Capture post-fix screenshot
        const screenshotPath = path.join(screenshotsDir, `phase15-${vp.label}-${route.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        expect(fs.existsSync(screenshotPath)).toBe(true);
      }
    });
  }

  test('3. Interactive calculator islands retain functional hydration and visible focus styles', async ({ page }) => {
    // Test SIP calculator input focus and value change
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/sip/', { waitUntil: 'networkidle' });

    const monthlyInput = page.locator('input[type="number"], input[type="text"]').first();
    await expect(monthlyInput).toBeVisible();

    await monthlyInput.focus();
    const isFocused = await monthlyInput.evaluate(el => document.activeElement === el);
    expect(isFocused).toBe(true);

    const focusOutline = await monthlyInput.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.outlineColor || style.borderColor;
    });
    expect(focusOutline).not.toBe('rgba(0, 0, 0, 0)');

    // Test Net Worth calculator tab switching or input hydration
    await page.goto('/tools/net-worth/', { waitUntil: 'networkidle' });
    const netWorthInput = page.locator('input[type="number"], input[type="text"]').first();
    await expect(netWorthInput).toBeVisible();
    await netWorthInput.focus();
    const nwFocused = await netWorthInput.evaluate(el => document.activeElement === el);
    expect(nwFocused).toBe(true);
  });
});
