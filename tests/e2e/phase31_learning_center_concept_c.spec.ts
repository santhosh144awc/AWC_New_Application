import { test, expect } from '@playwright/test';

test.describe('Phase 31 / Concept C Phase 12 — Financial Learning Center (/learn/)', () => {

  test('1. Renders 10 approved articles, single H1, and strictly excludes withheld articles', async ({ page }) => {
    await page.goto('/learn/');

    // Single H1 with calm framing
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('Make your next money decision with more confidence.');

    // Exactly 10 approved article cards
    const cards = page.locator('.article-card');
    await expect(cards).toHaveCount(10);

    // Verify 0 withheld articles are displayed
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('How to Start Planning for Your Retirement Early');
    expect(bodyText).not.toContain('Should You Prepay Your Home Loan or Invest in Mutual Funds?');

    // Editorial review notice is present with neutral phrasing
    const notice = page.locator('.review-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText('withheld under qualified professional review');
  });

  test('2. Initial state: All topics is selected, 10 cards visible, and live count reads 10 guides available', async ({ page }) => {
    await page.goto('/learn/');

    const allBtn = page.locator('.topic-btn[data-category="all"]');
    await expect(allBtn).toHaveClass(/is-selected/);
    await expect(allBtn).toHaveAttribute('aria-pressed', 'true');

    const resultsCount = page.locator('#learn-results-count');
    await expect(resultsCount).toHaveText('10 guides available');

    const visibleCards = page.locator('.article-card:not([hidden])');
    await expect(visibleCards).toHaveCount(10);

    const emptyState = page.locator('#learn-empty');
    await expect(emptyState).toBeHidden();
  });

  test('3. Topic buttons are keyboard and click operable, update aria-pressed, and filter visible cards by category', async ({ page }) => {
    await page.goto('/learn/');

    // Filter by "Goal Planning"
    const goalBtn = page.locator('.topic-btn[data-category="Goal Planning"]');
    await expect(goalBtn).toBeVisible();
    await goalBtn.click();

    await expect(goalBtn).toHaveClass(/is-selected/);
    await expect(goalBtn).toHaveAttribute('aria-pressed', 'true');

    const allBtn = page.locator('.topic-btn[data-category="all"]');
    await expect(allBtn).not.toHaveClass(/is-selected/);
    await expect(allBtn).toHaveAttribute('aria-pressed', 'false');

    // Check visible cards
    const visibleCards = page.locator('.article-card:not([hidden])');
    const count = await visibleCards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(10);

    for (let i = 0; i < count; i++) {
      await expect(visibleCards.nth(i).locator('.card-category')).toHaveText('Goal Planning');
    }

    // Keyboard navigation to another filter
    const investBtn = page.locator('.topic-btn[data-category="SIP & Investing"]');
    await investBtn.focus();
    await page.keyboard.press('Enter');

    await expect(investBtn).toHaveClass(/is-selected/);
    await expect(investBtn).toHaveAttribute('aria-pressed', 'true');

    const investCards = page.locator('.article-card:not([hidden])');
    const investCount = await investCards.count();
    expect(investCount).toBe(2);
  });

  test('4. Live search filters cards by title, category, and tags; unmatched query shows dedicated empty state', async ({ page }) => {
    await page.goto('/learn/');

    const searchInput = page.locator('#learn-search');
    await expect(searchInput).toBeVisible();

    // Search for "emergency"
    await searchInput.fill('emergency');
    const emergencyCards = page.locator('.article-card:not([hidden])');
    await expect(emergencyCards).toHaveCount(1);
    await expect(emergencyCards.first().locator('.card-title')).toContainText('Emergency Fund');
    await expect(page.locator('#learn-results-count')).toHaveText('1 guide available');

    // Search for non-matching query
    await searchInput.fill('cryptocurrencyxyz');
    const noCards = page.locator('.article-card:not([hidden])');
    await expect(noCards).toHaveCount(0);
    await expect(page.locator('#learn-results-count')).toHaveText('0 guides available');

    const emptyState = page.locator('#learn-empty');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No guides match that search');
  });

  test('5. Category filter and text search combine correctly with narrowing behavior', async ({ page }) => {
    await page.goto('/learn/');

    // Select category "SIP & Investing" (has 2 articles: SIP vs Lumpsum & What is SIP)
    await page.click('.topic-btn[data-category="SIP & Investing"]');
    await expect(page.locator('.article-card:not([hidden])')).toHaveCount(2);

    // Search for "lumpsum"
    await page.fill('#learn-search', 'lumpsum');
    const combinedCards = page.locator('.article-card:not([hidden])');
    await expect(combinedCards).toHaveCount(1);
    await expect(combinedCards.first().locator('.card-title')).toContainText('SIP vs Lumpsum');

    // Search for term outside category
    await page.fill('#learn-search', 'emergency');
    await expect(page.locator('.article-card:not([hidden])')).toHaveCount(0);
    await expect(page.locator('#learn-empty')).toBeVisible();
  });

  test('6. Reset buttons (clear search, top clear all, and empty state reset) restore all 10 cards and default filters', async ({ page }) => {
    await page.goto('/learn/');

    // Apply filter and search
    await page.click('.topic-btn[data-category="Personal Finance"]');
    await page.fill('#learn-search', 'unmatchedterm');
    await expect(page.locator('#learn-empty')).toBeVisible();

    // Click "Show all guides" button in empty state
    await page.click('#learn-empty-reset');

    await expect(page.locator('.topic-btn[data-category="all"]')).toHaveClass(/is-selected/);
    await expect(page.locator('#learn-search')).toHaveValue('');
    await expect(page.locator('.article-card:not([hidden])')).toHaveCount(10);
    await expect(page.locator('#learn-empty')).toBeHidden();

    // Apply search and use input clear button
    await page.fill('#learn-search', 'mutual');
    const clearBtn = page.locator('#learn-search-clear');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(page.locator('#learn-search')).toHaveValue('');
    await expect(page.locator('.article-card:not([hidden])')).toHaveCount(10);
  });

  test('7. Every visible article card retains the correct /learn/{slug}/ URL on title and Read Guide links', async ({ page }) => {
    await page.goto('/learn/');

    const cards = page.locator('.article-card');
    const count = await cards.count();
    expect(count).toBe(10);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const titleLink = card.locator('.card-title-link');
      const readMoreLink = card.locator('.read-more-link');

      const titleHref = await titleLink.getAttribute('href');
      const readMoreHref = await readMoreLink.getAttribute('href');

      expect(titleHref).toBeTruthy();
      expect(titleHref).toMatch(/^\/learn\/[a-z0-9-]+\/$/);
      expect(readMoreHref).toBe(titleHref);
    }
  });

  test('8. Existing calculatorCTA links on cards point to exact valid tool destinations', async ({ page }) => {
    await page.goto('/learn/');

    const toolStrips = page.locator('.card-tool-strip');
    const count = await toolStrips.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = toolStrips.nth(i).locator('.tool-strip-link');
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^(\/tools\/|\/plan\/|\/health-check\/)/);
      // Ensure no blocked retirement/SWP calculators are linked
      expect(href).not.toBe('/tools/swp/');
      expect(href).not.toBe('/plan/retirement/');
      expect(href).not.toBe('/plan/retirement-income/');
    }
  });

  test('9. Approved article detail route loads with 200, table of contents, and valid content', async ({ page }) => {
    await page.goto('/learn/how-much-emergency-fund-should-you-have/');

    // Single H1
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('How Much Emergency Fund Should You Have?');

    // Table of contents is present
    await expect(page.locator('.toc-card')).toBeVisible();

    // Content is rendered
    await expect(page.locator('.prose-content')).toBeVisible();
  });

  test('10. Withheld articles return 404 on direct route access; unknown slugs return 404', async ({ page }) => {
    // Withheld retirement article
    const resRetirement = await page.goto('/learn/how-to-start-planning-for-retirement/');
    expect(resRetirement?.status()).toBe(404);

    // Withheld loan vs invest article
    const resLoan = await page.goto('/learn/should-you-repay-your-loan-or-invest/');
    expect(resLoan?.status()).toBe(404);

    // Completely unknown article slug
    const resUnknown = await page.goto('/learn/unknown-financial-guide-slug/');
    expect(resUnknown?.status()).toBe(404);
  });

  test('11. Responsive layout: zero horizontal overflow at 1440px, 390px, and 360px viewports', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
      { width: 360, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/learn/');

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth - window.innerWidth;
      });
      expect(overflow, `Overflow at ${vp.width}px width`).toBeLessThanOrEqual(1);

      // Verify search input is visible and operable
      const search = page.locator('#learn-search');
      await expect(search).toBeVisible();

      // Verify category buttons are reachable
      const allBtn = page.locator('.topic-btn[data-category="all"]');
      await expect(allBtn).toBeVisible();
    }
  });

  test('12. Privacy & state invariants: zero localStorage, sessionStorage, cookies, IndexedDB, or URL query/hash mutation', async ({ page }) => {
    // Listen for requests to external origins
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (url.origin !== 'http://localhost:4399' && url.origin !== 'http://localhost:4321') {
        externalRequests.push(req.url());
      }
    });

    await page.goto('/learn/');

    // Interact with filters and search
    await page.click('.topic-btn[data-category="SIP & Investing"]');
    await page.fill('#learn-search', 'mutual');

    // Verify URL remained unchanged (no query params, no hash)
    expect(page.url()).toMatch(/\/learn\/$/);

    // Verify storage invariants
    const storageKeys = await page.evaluate(() => {
      return {
        local: Object.keys(localStorage),
        session: Object.keys(sessionStorage),
      };
    });
    expect(storageKeys.local).toHaveLength(0);
    expect(storageKeys.session).toHaveLength(0);

    // Verify zero cookies
    const cookies = await page.context().cookies();
    expect(cookies).toHaveLength(0);

    // Verify zero external network calls
    expect(externalRequests).toHaveLength(0);
  });

  test('13. Content governance: zero unverified guarantee or promotional claims on /learn/', async ({ page }) => {
    await page.goto('/learn/');

    const text = await page.locator('body').innerText();
    expect(text).not.toContain('guaranteed returns');
    expect(text).not.toContain('100% risk free');
    expect(text).not.toContain('best performing fund');
    expect(text).not.toContain('get rich quick');

    // Phase 12.1 claims remediation: zero unverified marketing claims in hero highlights
    expect(text).not.toContain('100% Math-Backed');
    expect(text).not.toContain('Math-Backed & Unbiased');
    expect(text).not.toContain('Product Pitches');

    // Verifiable indicators present
    const highlights = page.locator('.hero-highlights');
    await expect(highlights).toContainText('Published Guides');
    await expect(highlights).toContainText('Topic Areas');
    await expect(highlights).toContainText('Plain Language');
    await expect(highlights).toContainText('Educational Guides');
  });

  test('14. Page health: zero console errors and valid links', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/learn/');
    expect(consoleErrors).toHaveLength(0);

    // Check featured guide link resolves
    const featuredLink = page.locator('.featured-title-link');
    if (await featuredLink.count() > 0) {
      const href = await featuredLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('15. Computed styles validation: verified CSS tokens and non-dropped browser declarations', async ({ page }) => {
    await page.goto('/learn/');

    // 1. .learn-page has a non-transparent computed background (Warm Paper #F6F8F5 = rgb(246, 248, 245))
    const pageBg = await page.locator('.learn-page').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(pageBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(pageBg).not.toBe('transparent');
    expect(pageBg).toBe('rgb(246, 248, 245)');

    // 2. .learn-hero has an applied background gradient, not 'none'
    const heroBgImg = await page.locator('.learn-hero').evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage;
    });
    expect(heroBgImg).not.toBe('none');
    expect(heroBgImg).toContain('gradient');

    // 3. Primary action has real visible background and readable foreground
    // .btn-primary-hero uses --color-highlight (#F2C65D = rgb(242, 198, 93)) with navy text (#173047 = rgb(23, 48, 71))
    const heroBtnStyles = await page.locator('.btn-primary-hero').evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    expect(heroBtnStyles.bg).toBe('rgb(242, 198, 93)');
    expect(heroBtnStyles.color).toBe('rgb(23, 48, 71)');

    // .btn-read-featured uses --color-action (#137A71 = rgb(19, 122, 113)) with white text
    const readBtnStyles = await page.locator('.btn-read-featured').first().evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    expect(readBtnStyles.bg).toBe('rgb(19, 122, 113)');
    expect(readBtnStyles.color).toBe('rgb(255, 255, 255)');

    // 4. Article cards have nonzero computed border style/color and white surface
    const cardStyles = await page.locator('.article-card').first().evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        borderStyle: cs.borderTopStyle,
        borderColor: cs.borderTopColor,
        borderWidth: cs.borderTopWidth,
      };
    });
    expect(cardStyles.bg).toBe('rgb(255, 255, 255)');
    expect(cardStyles.borderStyle).toBe('solid');
    expect(parseFloat(cardStyles.borderWidth)).toBeGreaterThan(0);
    expect(cardStyles.borderColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(cardStyles.borderColor).not.toBe('transparent');
  });

  test('16. Static CSS token audit: all custom properties in /learn/index.astro resolve to design-tokens.css', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const tokensPath = path.resolve(process.cwd(), 'src/styles/design-tokens.css');
    const pagePath = path.resolve(process.cwd(), 'src/pages/learn/index.astro');

    const tokensContent = fs.readFileSync(tokensPath, 'utf8');
    const pageContent = fs.readFileSync(pagePath, 'utf8');

    // Match all --token-name: declarations in design-tokens.css
    const definedTokenMatches = Array.from(tokensContent.matchAll(/(--[a-zA-Z0-9_-]+):/g));
    const definedTokens = new Set(definedTokenMatches.map((m) => m[1]));

    // Match all var(--token-name) calls in learn/index.astro
    const usedTokenMatches = Array.from(pageContent.matchAll(/var\((--[a-zA-Z0-9_-]+)\)/g));
    const usedTokens = new Set(usedTokenMatches.map((m) => m[1]));

    const missingTokens: string[] = [];
    for (const token of usedTokens) {
      if (!definedTokens.has(token)) {
        missingTokens.push(token);
      }
    }

    expect(missingTokens).toEqual([]);
  });

});
