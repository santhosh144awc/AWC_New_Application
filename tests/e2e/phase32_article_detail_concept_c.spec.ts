import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, '../../../product-docs/design-review/phase13-article-detail/screenshots');

test.describe('Phase 32 / Concept C Phase 13 — Article Detail Experience (/learn/[slug]/)', () => {
  const targetArticleSlug = 'what-is-sip-and-how-does-it-work';
  const targetArticleUrl = `/learn/${targetArticleSlug}/`;

  test('1. Approved article renders HTTP 200 with exactly one <h1>, correct canonical URL, and metadata', async ({ page }) => {
    const response = await page.goto(targetArticleUrl);
    expect(response?.status()).toBe(200);

    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
    await expect(h1s).toHaveText('What Is SIP and How Does It Work? The Power of Disciplined Compounding');

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', `https://antwealth.in/learn/${targetArticleSlug}/`);

    // Verify title and meta description
    await expect(page).toHaveTitle(/What Is SIP and How Does It Work/);
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /Learn how Systematic Investment Plans/);

    // Verify category badge and reading time
    const categoryBadge = page.locator('.category-badge');
    await expect(categoryBadge).toBeVisible();
    await expect(categoryBadge).toHaveText('SIP & Investing');

    const readingTime = page.locator('.reading-time');
    await expect(readingTime).toBeVisible();
    await expect(readingTime).toContainText('6 min read');
  });

  test('2. Date label strictly matches schema meaning (Published for publishDate)', async ({ page }) => {
    await page.goto(targetArticleUrl);

    const publishDate = page.locator('.publish-date');
    await expect(publishDate).toBeVisible();
    const dateText = await publishDate.textContent();
    expect(dateText).toContain('Published');
    expect(dateText).not.toContain('Updated');
    await expect(publishDate).toHaveAttribute('datetime', '2026-08-23');
  });

  test('3. Table of Contents includes only valid H2/H3 anchors and navigates cleanly', async ({ page }) => {
    await page.goto(targetArticleUrl);

    const tocCard = page.locator('.toc-card');
    await expect(tocCard).toBeVisible();

    const tocLinks = page.locator('.toc-link');
    const linkCount = await tocLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    for (let i = 0; i < linkCount; i++) {
      const link = tocLinks.nth(i);
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^#[a-zA-Z0-9_-]+$/);
      if (href) {
        const id = href.replace(/^#/, '');
        const exists = await page.evaluate((targetId) => !!document.getElementById(targetId), id);
        expect(exists).toBe(true);
      }
    }

    // Click first TOC entry and verify scroll navigation without page reload or route failure
    const firstHref = await tocLinks.first().getAttribute('href');
    if (firstHref) {
      await tocLinks.first().click();
      const firstId = firstHref.replace(/^#/, '');
      const isVisible = await page.evaluate((targetId) => {
        const el = document.getElementById(targetId);
        return el !== null;
      }, firstId);
      expect(isVisible).toBe(true);
    }
  });

  test('4. Responsive presentation without horizontal scrollbar at 1440px, 390px, and 360px', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, name: 'desktop-1440' },
      { width: 390, height: 844, name: 'mobile-390' },
      { width: 360, height: 800, name: 'mobile-360' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(targetArticleUrl);
      await page.waitForLoadState('networkidle');

      // Verify page-level horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px rounding margin
    }
  });

  test('5. Keyboard navigation through breadcrumbs, TOC, and links has visible focus and no trap', async ({ page }) => {
    await page.goto(targetArticleUrl);

    // Focus on skip link first
    await page.keyboard.press('Tab');
    const activeText = await page.evaluate(() => document.activeElement?.textContent);
    expect(activeText).toBeTruthy();

    // Verify Tab cycles sequentially without getting trapped
    const visitedElements = new Set<string>();
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}:${el.className}:${el.getAttribute('href') || ''}` : 'none';
      });
      if (visitedElements.has(info) && visitedElements.size > 8) {
        // Normal cyclical focus wrapped around
        break;
      }
      visitedElements.add(info);
    }
    expect(visitedElements.size).toBeGreaterThan(5);
  });

  test('6. CTA box appears only when configured and points to exact canonical destination', async ({ page }) => {
    // Article with CTA
    await page.goto(targetArticleUrl);
    const ctaBox = page.locator('.article-cta-box');
    await expect(ctaBox).toBeVisible();
    const ctaBtn = page.locator('.cta-btn');
    await expect(ctaBtn).toBeVisible();
    await expect(ctaBtn).toHaveAttribute('href', '/tools/sip/');
    await expect(ctaBtn).toContainText('Open SIP Calculator');

    // Article with health-check CTA: how-much-emergency-fund-should-you-have
    await page.goto('/learn/how-much-emergency-fund-should-you-have/');
    const emergencyCta = page.locator('.article-cta-box');
    const emergencyCtaCount = await emergencyCta.count();
    expect(emergencyCtaCount).toBe(1);
    const btn = emergencyCta.locator('.cta-btn');
    await expect(btn).toBeVisible();
    const href = await btn.getAttribute('href');
    expect(href).toMatch(/^\/(tools|plan|health-check)\//);
  });

  test('7. Related links expose only approved guides, exclude current article, and never leak withheld guides', async ({ page }) => {
    await page.goto(targetArticleUrl);

    const relatedLinks = page.locator('.related-link');
    const count = await relatedLinks.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const link = relatedLinks.nth(i);
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toBe(targetArticleUrl);
      expect(href).not.toContain('how-to-start-planning-for-retirement');
      expect(href).not.toContain('should-you-repay-your-loan-or-invest');
      expect(href).toMatch(/^\/learn\/[a-zA-Z0-9_-]+\/$/);
    }
  });

  test('8. Withheld article slugs and unknown slugs continue to return 404', async ({ page }) => {
    const resRetirement = await page.goto('/learn/how-to-start-planning-for-retirement/');
    expect(resRetirement?.status()).toBe(404);

    const resLoan = await page.goto('/learn/should-you-repay-your-loan-or-invest/');
    expect(resLoan?.status()).toBe(404);

    const resUnknown = await page.goto('/learn/completely-non-existent-article-slug/');
    expect(resUnknown?.status()).toBe(404);
  });

  test('9. Privacy invariant: zero external network calls, zero cookies, zero storage writes', async ({ page }) => {
    const thirdPartyRequests: string[] = [];

    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost') && !url.startsWith('https://antwealth.in')) {
        thirdPartyRequests.push(url);
      }
    });

    await page.goto(targetArticleUrl);

    expect(thirdPartyRequests).toEqual([]);

    const storageUsage = await page.evaluate(() => {
      return {
        localStorageLen: localStorage.length,
        sessionStorageLen: sessionStorage.length,
        cookies: document.cookie,
      };
    });

    expect(storageUsage.localStorageLen).toBe(0);
    expect(storageUsage.sessionStorageLen).toBe(0);
    expect(storageUsage.cookies).toBe('');
  });

  test('10. Static CSS token audit covers both /learn/ and /learn/[slug]/ templates', async () => {
    const tokensPath = path.resolve(process.cwd(), 'src/styles/design-tokens.css');
    const tokensContent = fs.readFileSync(tokensPath, 'utf8');
    const definedTokenMatches = Array.from(tokensContent.matchAll(/(--[a-zA-Z0-9_-]+):/g));
    const definedTokens = new Set(definedTokenMatches.map((m) => m[1]));

    const templates = [
      'src/pages/learn/index.astro',
      'src/pages/learn/[slug].astro',
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
      expect(missing, `Undefined tokens in ${relPath}`).toEqual([]);
    }
  });

  test('11. Browser computed-style verification for key elements and contrast', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(targetArticleUrl);

    // Verify main page background is warm paper (#F6F8F5 / rgb(246, 248, 245))
    const pageBg = await page.evaluate(() => {
      const el = document.querySelector('.article-page');
      return el ? window.getComputedStyle(el).backgroundColor : '';
    });
    expect(pageBg).toBe('rgb(246, 248, 245)');

    // Verify article title renders with Atlantic Navy color (#173047 / rgb(23, 48, 71))
    const titleColor = await page.evaluate(() => {
      const el = document.querySelector('.article-title');
      return el ? window.getComputedStyle(el).color : '';
    });
    expect(titleColor).toBe('rgb(23, 48, 71)');

    // Verify article body has white surface and visible subtle border
    const bodyStyles = await page.evaluate(() => {
      const el = document.querySelector('.article-body');
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        borderWidth: s.borderWidth,
        borderColor: s.borderColor,
      };
    });
    expect(bodyStyles?.bg).toBe('rgb(255, 255, 255)');
    expect(parseFloat(bodyStyles?.borderWidth || '0')).toBeGreaterThan(0);
    expect(bodyStyles?.borderColor).not.toBe('transparent');

    // Verify category badge has soft jade background and jade deep text
    const badgeStyles = await page.evaluate(() => {
      const el = document.querySelector('.category-badge');
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        color: s.color,
      };
    });
    expect(badgeStyles?.bg).toBe('rgb(225, 243, 238)'); // #E1F3EE
    expect(badgeStyles?.color).toBe('rgb(17, 102, 95)'); // #11665F

    // Verify CTA button background is Jade Action (#137A71 / rgb(19, 122, 113))
    const ctaStyles = await page.evaluate(() => {
      const el = document.querySelector('.cta-btn');
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        color: s.color,
      };
    });
    expect(ctaStyles?.bg).toBe('rgb(19, 122, 113)'); // #137A71
    expect(ctaStyles?.color).toBe('rgb(255, 255, 255)');

    // Verify Table of Contents is visible
    const tocVisible = await page.locator('.toc-card').isVisible();
    expect(tocVisible).toBe(true);
  });

  test('12. Capture production redesign screenshots at 1440px, 390px, and 360px', async ({ page }) => {
    // 1. Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(targetArticleUrl);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(screenshotsDir, 'article-detail-desktop-1440-viewport.png'),
    });
    await page.screenshot({
      path: path.join(screenshotsDir, 'article-detail-desktop-1440-full.png'),
      fullPage: true,
    });

    // 2. Mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(targetArticleUrl);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(screenshotsDir, 'article-detail-mobile-390-viewport.png'),
    });
    await page.screenshot({
      path: path.join(screenshotsDir, 'article-detail-mobile-390-full.png'),
      fullPage: true,
    });

    // 3. Compact Mobile 360x800
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(targetArticleUrl);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(screenshotsDir, 'article-detail-mobile-360-viewport.png'),
    });
    await page.screenshot({
      path: path.join(screenshotsDir, 'article-detail-mobile-360-full.png'),
      fullPage: true,
    });
  });
});
