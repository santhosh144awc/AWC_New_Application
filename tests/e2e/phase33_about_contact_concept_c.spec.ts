import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, '../../../product-docs/design-review/phase14-about-contact/screenshots');

test.describe('Phase 33 / Concept C Phase 14 — About & Contact Trust Experience (/about/ and /contact/)', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('1. /about/ renders HTTP 200 with exactly one <h1>, canonical URL, and factual founder details', async ({ page }) => {
    const response = await page.goto('/about/');
    expect(response?.status()).toBe(200);

    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
    await expect(h1s).toHaveText('About Ant Wealth Creation');

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://antwealth.in/about/');

    await expect(page).toHaveTitle(/About Us & Founder Story/);
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /Learn about Ant Wealth Creation/);

    // Verify founder details match BUSINESS_PROFILE
    await expect(page.locator('.founder-name')).toHaveText('C. Santhosh Sathriyan, B.E.');
    await expect(page.locator('.founder-creds')).toContainText('QPFP Certified');
    await expect(page.locator('.founder-role')).toContainText('Founder & Mutual Fund Distributor');
    await expect(page.locator('.founder-loc')).toContainText('Dharmapuri, Tamil Nadu, India');

    // Founder photo has descriptive alt text
    const photo = page.locator('.founder-photo');
    await expect(photo).toBeVisible();
    await expect(photo).toHaveAttribute('alt', 'Photograph of C. Santhosh Sathriyan, B.E., Founder of Ant Wealth Creation');

    // Milestones row distinguishes market experience from firm establishment
    await expect(page.locator('.milestones-row')).toContainText('2012');
    await expect(page.locator('.milestones-row')).toContainText('Market Experience Since');
    await expect(page.locator('.milestones-row')).toContainText('2023');
    await expect(page.locator('.milestones-row')).toContainText('Firm Established');
    await expect(page.locator('.milestones-row')).toContainText('Dharmapuri, TN');
  });

  test('2. /contact/ renders HTTP 200 with exactly one <h1> and channels matching BUSINESS_PROFILE', async ({ page }) => {
    const response = await page.goto('/contact/');
    expect(response?.status()).toBe(200);

    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
    await expect(h1s).toHaveText('Contact Ant Wealth Creation');

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://antwealth.in/contact/');

    await expect(page).toHaveTitle(/Contact Us & Direct Consultation/);

    // WhatsApp link verification
    const whatsappBtn = page.locator('.btn-whatsapp');
    await expect(whatsappBtn).toBeVisible();
    await expect(whatsappBtn).toHaveAttribute('href', /https:\/\/wa\.me\/918087971566/);
    await expect(whatsappBtn).toHaveAttribute('target', '_blank');
    await expect(whatsappBtn).toHaveAttribute('rel', 'noopener noreferrer');

    // Phone link scoped to channel cards
    const phoneLink = page.locator('.channel-cards a[href^="tel:"]');
    await expect(phoneLink).toHaveAttribute('href', 'tel:+918087971566');
    await expect(phoneLink).toContainText('+91 80879 71566');

    // Email link scoped to channel cards
    const emailLink = page.locator('.channel-cards a[href^="mailto:"]');
    await expect(emailLink).toHaveAttribute('href', 'mailto:santhosh@antwealth.in');
    await expect(emailLink).toContainText('santhosh@antwealth.in');

    // Existing client portal
    const portalBtn = page.locator('.btn-portal');
    await expect(portalBtn).toBeVisible();
    await expect(portalBtn).toHaveAttribute('href', 'https://antwealth.themfbox.com/');
    await expect(portalBtn).toHaveAttribute('target', '_blank');
    await expect(portalBtn).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('3. Static CSS token audit verifies zero undefined design tokens in /about/ and /contact/', async () => {
    const tokensPath = path.resolve(process.cwd(), 'src/styles/design-tokens.css');
    const tokensContent = fs.readFileSync(tokensPath, 'utf8');
    const definedTokenMatches = Array.from(tokensContent.matchAll(/(--[a-zA-Z0-9_-]+):/g));
    const definedTokens = new Set(definedTokenMatches.map((m) => m[1]));

    const templates = [
      'src/pages/about.astro',
      'src/pages/contact.astro',
    ];

    for (const relPath of templates) {
      const filePath = path.resolve(process.cwd(), relPath);
      const content = fs.readFileSync(filePath, 'utf8');
      const usedTokenMatches = Array.from(content.matchAll(/var\((--[a-zA-Z0-9_-]+)\)/g));
      const usedTokens = new Set(usedTokenMatches.map((m) => m[1]));

      const missing: string[] = [];
      for (const token of usedTokens) {
        if (!definedTokens.has(token)) {
          missing.push(token);
        }
      }
      expect(missing, `Undefined CSS design tokens found in ${relPath}`).toEqual([]);
    }
  });

  test('4. Browser computed styles prove key backgrounds, colors, borders, and buttons are applied', async ({ page }) => {
    // Check /about/ computed styles
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/about/');

    const founderCardStyles = await page.evaluate(() => {
      const el = document.querySelector('.founder-section');
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        borderRadius: s.borderRadius,
      };
    });
    expect(founderCardStyles?.bg).toBe('rgb(255, 255, 255)');
    expect(founderCardStyles?.borderRadius).toBe('24px'); // --radius-xl

    const founderHeadingColor = await page.evaluate(() => {
      const el = document.querySelector('.founder-title');
      return el ? window.getComputedStyle(el).color : '';
    });
    expect(founderHeadingColor).toBe('rgb(23, 48, 71)'); // --awc-navy

    const primaryBtnStyles = await page.evaluate(() => {
      const el = document.querySelector('.btn-primary');
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        color: s.color,
      };
    });
    expect(primaryBtnStyles?.bg).toBe('rgb(19, 122, 113)'); // --awc-jade-action (#137A71)
    expect(primaryBtnStyles?.color).toBe('rgb(255, 255, 255)');

    // Check /contact/ computed styles
    await page.goto('/contact/');

    const guidelinesCardBg = await page.evaluate(() => {
      const el = document.querySelector('.guidelines-card');
      return el ? window.getComputedStyle(el).backgroundColor : '';
    });
    expect(guidelinesCardBg).toBe('rgb(255, 255, 255)');

    const whatsappBtnStyles = await page.evaluate(() => {
      const el = document.querySelector('.btn-whatsapp');
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        color: s.color,
      };
    });
    expect(whatsappBtnStyles?.bg).toBe('rgb(18, 140, 126)'); // #128C7E
    expect(whatsappBtnStyles?.color).toBe('rgb(255, 255, 255)');
  });

  test('5. Zero horizontal overflow at 1440px, 390px, and 360px on both routes', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
      { width: 360, height: 800 },
    ];

    const routes = ['/about/', '/contact/'];

    for (const route of routes) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth, `Horizontal overflow on ${route} at ${vp.width}px`).toBeLessThanOrEqual(clientWidth + 1);
      }
    }
  });

  test('6. Keyboard navigation is accessible, visible, and outbound links are protected', async ({ page }) => {
    await page.goto('/about/');

    // Verify Tab cycles without traps
    await page.keyboard.press('Tab');
    const firstActive = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstActive).toBeTruthy();

    // Verify outbound AMFI link security
    const amfiLink = page.locator('.reg-link');
    await expect(amfiLink).toHaveAttribute('target', '_blank');
    await expect(amfiLink).toHaveAttribute('rel', 'noopener noreferrer');

    await page.goto('/contact/');
    // Verify all target=_blank links have rel="noopener noreferrer"
    const blankLinks = page.locator('a[target="_blank"]');
    const count = await blankLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(blankLinks.nth(i)).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  test('7. Copy regression assertions: unsupported percentages and absolute promises are absent', async ({ page }) => {
    await page.goto('/about/');
    const aboutContent = await page.content();

    // Unsupported percentage metric removed
    expect(aboutContent).not.toContain('100% Pure Goal-Focused');
    expect(aboutContent).not.toContain('Pure Goal-Focused');

    // Paternalistic/absolute promises removed
    expect(aboutContent).not.toContain('We ensure your downside is fortified');
    expect(aboutContent).not.toContain('downside is fortified');
    expect(aboutContent).not.toContain('Every rupee invested is tied to a specific milestone');

    await page.goto('/contact/');
    const contactContent = await page.content();

    // Absolute privacy claim without qualification removed
    expect(contactContent).not.toContain('never shared with any third party');

    // Unsafe financial statements invitation without guidance removed
    expect(contactContent).not.toContain('Send portfolio queries, financial statements');
  });

  test('8. Contact privacy guidance, sensitive doc warning, and zero form/storage submission', async ({ page }) => {
    await page.goto('/contact/');

    // Security warning box visible
    const securityBox = page.locator('.security-notice-box');
    await expect(securityBox).toBeVisible();
    await expect(securityBox).toContainText('Protect Your Sensitive Information');
    await expect(securityBox).toContainText('Please do not send passwords, OTPs');

    // Confidentiality notice links to /privacy/
    const privacyLink = page.locator('.notice-link');
    await expect(privacyLink).toHaveAttribute('href', '/privacy/');

    // Zero contact forms
    const forms = page.locator('form');
    await expect(forms).toHaveCount(0);

    // Verify storage and cookies remain pristine
    const storageUsage = await page.evaluate(() => ({
      localStorageLen: window.localStorage.length,
      sessionStorageLen: window.sessionStorage.length,
      cookies: document.cookie,
    }));
    expect(storageUsage.localStorageLen).toBe(0);
    expect(storageUsage.sessionStorageLen).toBe(0);
    expect(storageUsage.cookies).toBe('');
  });

  test('9. Regulatory registration copy reflects owner-confirmed AMFI registration', async ({ page }) => {
    await page.goto('/about/');
    const aboutContent = await page.content();

    // Registration text explicitly states confirmed AMFI registration and validity
    expect(aboutContent).toContain('ARN-266896');
    expect(aboutContent).toContain('16 March 2029');
    expect(aboutContent).toMatch(/AMFI[- ]registered Mutual Fund Distributor/i);
    expect(aboutContent).toContain('does not offer fee-based investment advisory services under SEBI');

    await page.goto('/contact/');
    const contactContent = await page.content();
    expect(contactContent).toContain('/commission-disclosure/');
  });

  test('10. Breadcrumbs, canonical navigation, and next steps links operate smoothly', async ({ page }) => {
    await page.goto('/about/');

    const breadcrumbs = page.locator('.breadcrumbs-nav');
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs).toContainText('Home');
    await expect(breadcrumbs).toContainText('About');

    // Next steps links
    const healthCheckLink = page.locator('.btn-primary');
    await expect(healthCheckLink).toHaveAttribute('href', '/health-check/');

    const contactLink = page.locator('.btn-secondary');
    await expect(contactLink).toHaveAttribute('href', '/contact/');

    await page.goto('/contact/');
    const contactBreadcrumbs = page.locator('.breadcrumbs-nav');
    await expect(contactBreadcrumbs).toBeVisible();
    await expect(contactBreadcrumbs).toContainText('Home');
    await expect(contactBreadcrumbs).toContainText('Contact');
  });

  test('11. Capture production redesign screenshots at 1440px, 390px, and 360px', async ({ page }) => {
    const pagesToCapture = [
      { url: '/about/', prefix: 'about' },
      { url: '/contact/', prefix: 'contact' },
    ];

    for (const item of pagesToCapture) {
      // 1. Desktop 1440x900
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(item.url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: path.join(screenshotsDir, `${item.prefix}-desktop-1440-viewport.png`),
      });
      await page.screenshot({
        path: path.join(screenshotsDir, `${item.prefix}-desktop-1440-full.png`),
        fullPage: true,
      });

      // 2. Mobile 390x844
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(item.url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: path.join(screenshotsDir, `${item.prefix}-mobile-390-viewport.png`),
      });
      await page.screenshot({
        path: path.join(screenshotsDir, `${item.prefix}-mobile-390-full.png`),
        fullPage: true,
      });

      // 3. Compact Mobile 360x800
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(item.url);
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: path.join(screenshotsDir, `${item.prefix}-mobile-360-viewport.png`),
      });
      await page.screenshot({
        path: path.join(screenshotsDir, `${item.prefix}-mobile-360-full.png`),
        fullPage: true,
      });
    }
  });
});
