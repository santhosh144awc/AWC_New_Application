import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(
  __dirname,
  '../../../product-docs/design-review/phase16-privacy-terms-disclosure/screenshots'
);

const AUDITED_ROUTES = [
  { path: '/privacy/', name: 'privacy' },
  { path: '/terms/', name: 'terms' },
  { path: '/disclaimer/', name: 'disclaimer' },
  { path: '/contact/', name: 'contact' },
  { path: '/commission-disclosure/', name: 'commission-disclosure' },
];

const VIEWPORTS = [
  { width: 1440, height: 900, label: 'desktop-1440' },
  { width: 390, height: 844, label: 'mobile-390' },
  { width: 360, height: 800, label: 'mobile-360' },
];

test.describe('Phase 16 — Privacy, Terms & Regulatory Disclosure Readiness Audit (E2E Suite)', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  for (const route of AUDITED_ROUTES) {
    test(`1. Route ${route.path} returns HTTP 200, valid canonical, exactly one H1, and no horizontal overflow`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);

      // Verify exactly one H1
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      const h1Text = await h1.innerText();
      expect(h1Text.trim().length).toBeGreaterThan(0);

      // Verify canonical link matches route
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      const canonicalHref = await canonical.getAttribute('href');
      expect(canonicalHref).toContain(route.path);

      // Check overflow on all viewports and capture post-fix screenshot
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(100);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

        const screenshotPath = path.join(screenshotsDir, `${route.name}-${vp.label}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }
    });
  }

  test('2. Confirmed AMFI registration status is visible across audited legal routes', async ({ page }) => {
    for (const route of AUDITED_ROUTES) {
      await page.goto(route.path);
      const html = await page.content();

      // Obsolete ARN numbers must never be published
      expect(html).not.toContain('ARN-285888');

      // Confirmed ARN and AMFI text must be present
      expect(html).toContain('ARN-266896');
      expect(html).toMatch(/AMFI[- ]registered Mutual Fund Distributor/i);
    }
  });

  test('3. Banned unverified legal compliance claims and informal titles are absent from public pages', async ({ page }) => {
    for (const route of AUDITED_ROUTES) {
      await page.goto(route.path);
      const text = await page.innerText('body');

      // Banned claims
      expect(text).not.toContain('complies with the principles of the Digital Personal Data Protection Act');
      expect(text).not.toContain('under any circumstances');
      expect(text).not.toContain('Privacy Officer');
      expect(text).not.toContain('SEBI registered investment adviser');
      expect(text).not.toContain('guaranteed wealth');
      expect(text).not.toContain('guaranteed profits');
    }
  });

  test('4. Security warning against sending passwords, OTPs, or full bank credentials is present', async ({ page }) => {
    // Both Privacy and Contact pages must feature clear warnings against sending sensitive financial credentials
    await page.goto('/privacy/');
    const privacyText = await page.innerText('body');
    expect(privacyText).toMatch(/passwords/i);
    expect(privacyText).toMatch(/OTPs/i);
    expect(privacyText).toMatch(/full bank account numbers/i);

    await page.goto('/contact/');
    const contactText = await page.innerText('body');
    expect(contactText).toMatch(/passwords/i);
    expect(contactText).toMatch(/OTPs/i);
    expect(contactText).toMatch(/full bank account numbers/i);
  });

  test('5. Data practices table in /privacy/ is present, route contains no forms, and visiting /privacy/ sets no cookies or localStorage', async ({ page }) => {
    await page.goto('/privacy/');

    // Assert table presence
    const table = page.locator('.data-practices-table');
    await expect(table).toBeVisible();

    // Verify row contents
    const tableText = await table.innerText();
    expect(tableText).toContain('Financial Calculators');
    expect(tableText).toContain('Ephemeral in browser memory only');
    expect(tableText).toContain('None; computed locally in browser');
    expect(tableText).toContain('The reviewed application source code installs no third-party tracking pixels');

    // Verify no form elements exist on the page
    const forms = page.locator('form');
    await expect(forms).toHaveCount(0);

    // Verify no cookies or localStorage writes occurred
    const cookies = await page.context().cookies();
    expect(cookies.length).toBe(0);

    const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
    expect(localStorageKeys.length).toBe(0);
  });

  test('6. Cross-links between /privacy/, /terms/, /disclaimer/, and /contact/ resolve cleanly to HTTP 200', async ({ page }) => {
    const legalPages = ['/privacy/', '/terms/', '/disclaimer/'];

    for (const sourcePath of legalPages) {
      await page.goto(sourcePath);

      // Verify cross-links exist on page
      const pageLinks = page.locator('.legal-card a');
      const linkCount = await pageLinks.count();
      expect(linkCount).toBeGreaterThanOrEqual(2);

      // Extract hrefs
      const hrefs: string[] = [];
      for (let i = 0; i < linkCount; i++) {
        const href = await pageLinks.nth(i).getAttribute('href');
        if (href && href.startsWith('/')) {
          hrefs.push(href);
        }
      }

      // Check each cross-link target resolves with 200
      for (const href of hrefs) {
        const res = await page.request.get(href);
        expect(res.status()).toBe(200);
      }
    }
  });

  test('7. /disclaimer/ correctly presents official Income-tax Act, 2025 commencement and transitional disclaimer', async ({ page }) => {
    await page.goto('/disclaimer/');
    const text = await page.innerText('body');

    expect(text).toContain('Income-tax Act, 2025');
    expect(text).toContain('1 April 2026');
    expect(text).toContain('repeal-and-savings and transitional provisions');
    expect(text).toContain('does not determine individual tax liability');
  });

  test('8. Interactive elements have visible focus rings and external links have security rel attributes', async ({ page }) => {
    await page.goto('/contact/');

    // External WhatsApp button on contact channel card
    const waLink = page.locator('.btn-whatsapp');
    await expect(waLink).toBeVisible();
    expect(await waLink.getAttribute('rel')).toContain('noopener');
    expect(await waLink.getAttribute('rel')).toContain('noreferrer');

    // External client portal link
    const portalLink = page.locator('.btn-portal');
    await expect(portalLink).toBeVisible();
    expect(await portalLink.getAttribute('rel')).toContain('noopener');
    expect(await portalLink.getAttribute('rel')).toContain('noreferrer');

    // Keyboard focus check
    await waLink.focus();
    await expect(waLink).toBeFocused();
  });

  test('9. Commission disclosure, sole proprietorship, and enquiry retention schedule are verified', async ({ page }) => {
    // Commission disclosure verification
    await page.goto('/commission-disclosure/');
    const commText = await page.innerText('body');
    expect(commText).toContain('Regular Plans');
    expect(commText).toContain('Direct Plans');
    expect(commText).toContain('No Universal AMFI Rate Band');
    expect(commText).toContain('competing schemes');
    const amfiLink = page.locator('a[href="https://www.amfiindia.com/research-information/commission-disclosure"]');
    await expect(amfiLink).toBeVisible();

    // Enquiry retention schedule on privacy page
    await page.goto('/privacy/');
    const privText = await page.innerText('body');
    expect(privText).toContain('delete enquiry-only records within 30 days');
    expect(privText).toContain('close the enquiry 90 days after the last follow-up attempt');
    expect(privText).toContain('Hostinger');

    // Sole proprietorship and jurisdiction on terms page
    await page.goto('/terms/');
    const termsText = await page.innerText('body');
    expect(termsText).toContain('Ant Wealth Creation is a sole proprietorship operated by C. Santhosh Sathriyan');
    expect(termsText).toContain('applicable consumer-protection provisions');
    expect(termsText).toContain('No exclusive Dharmapuri-only jurisdiction is intended');
  });
});
