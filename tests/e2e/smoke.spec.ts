import { test, expect } from '@playwright/test';
import { getAllRegisteredRoutes, TOP_NAV_ROUTES } from '../../src/config/routes';

test.describe('Ant Wealth Creation — Route Architecture & Navigation Suite', () => {
  const routesToTest = getAllRegisteredRoutes();

  test('every registered internal route resolves to a real page with unique title, single h1, main landmark, and no console errors', async ({ page }) => {
    const titlesSeen = new Set<string>();

    for (const route of routesToTest) {
      const consoleErrors: string[] = [];
      const errorHandler = (msg: any) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      };
      const pageErrorHandler = (err: any) => {
        consoleErrors.push(err.message);
      };

      page.on('console', errorHandler);
      page.on('pageerror', pageErrorHandler);

      const response = await page.goto(route.path);
      expect(response?.status(), `Route ${route.path} should return HTTP 200`).toBe(200);

      // Verify unique, descriptive title
      const pageTitle = await page.title();
      expect(pageTitle.length, `Route ${route.path} title should be descriptive`).toBeGreaterThan(15);
      expect(titlesSeen.has(pageTitle), `Page title "${pageTitle}" on ${route.path} should be unique`).toBe(false);
      titlesSeen.add(pageTitle);

      // Verify single primary h1
      const h1Elements = page.locator('h1');
      await expect(h1Elements, `Route ${route.path} must have exactly one h1`).toHaveCount(1);
      const h1Text = await h1Elements.first().textContent();
      expect(h1Text?.trim().length).toBeGreaterThan(0);

      // Verify main landmark
      const mainLandmark = page.locator('#main-content, main');
      expect(await mainLandmark.count(), `Route ${route.path} must have a main landmark`).toBeGreaterThan(0);

      // Verify no uncaught browser runtime errors
      expect(consoleErrors, `Route ${route.path} produced console errors`).toEqual([]);

      page.off('console', errorHandler);
      page.off('pageerror', pageErrorHandler);
    }
  });

  test('all top-level navigation destinations are reachable on desktop and mobile', async ({ page }) => {
    // Desktop Viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    for (const topRoute of TOP_NAV_ROUTES) {
      const navLink = page.locator(`.desktop-nav a[href="${topRoute.path}"]`);
      await expect(navLink, `Top nav desktop link for ${topRoute.path} should exist`).toBeVisible();
    }

    // Mobile Viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const toggleBtn = page.locator('#mobile-menu-toggle');
    await toggleBtn.click();
    await page.waitForTimeout(200);

    for (const topRoute of TOP_NAV_ROUTES) {
      const drawerLink = page.locator(`#mobile-nav-drawer .mobile-nav-link[href="${topRoute.path}"]`);
      await expect(drawerLink, `Mobile drawer link for ${topRoute.path} should exist`).toBeVisible();
    }
  });

  test('mobile navigation drawer supports keyboard use, Escape to close, and accessible state attributes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const toggleBtn = page.locator('#mobile-menu-toggle');
    const drawer = page.locator('#mobile-nav-drawer');
    const closeBtn = page.locator('#mobile-drawer-close');

    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Open Drawer via Click
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toBeVisible();

    // Close Drawer via Close Button
    await closeBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Reopen and test Escape key to close
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });

  test('no horizontal overflow at 360px and 390px widths on representative pages', async ({ page }) => {
    const representativePaths = [
      '/',
      '/health-check/',
      '/plan/',
      '/tools/',
      '/tools/sip/',
      '/learn/',
      '/about/',
      '/contact/',
      '/disclaimer/',
    ];

    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 });

      for (const path of representativePaths) {
        await page.goto(path);
        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        expect(hasHorizontalOverflow, `Horizontal overflow detected on ${path} at ${width}px`).toBe(false);
      }
    }
  });

  test('every internal navigation, footer, and related link targets an existing route or valid section anchor', async ({ page }) => {
    await page.goto('/');

    const allLinks = await page.locator('header a, footer a, main a').elementHandles();
    const validPaths = new Set(routesToTest.map(r => r.path));
    validPaths.add('/');

    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (!href) continue;

      // Skip external links, tel, mailto, whatsapp
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('tel:') ||
        href.startsWith('mailto:')
      ) {
        continue;
      }

      // Check section anchors
      if (href.startsWith('#')) {
        const targetId = href.replace('#', '');
        if (targetId) {
          const matchCount = await page.locator(`[id="${targetId}"]`).count();
          expect(matchCount, `Anchor #${targetId} on homepage must point to an existing ID`).toBeGreaterThan(0);
        }
        continue;
      }

      // Check internal path
      const pathOnly = href.split('#')[0];
      const normalized = pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`;
      const isKnown =
        validPaths.has(normalized) ||
        validPaths.has(pathOnly) ||
        pathOnly.startsWith('/learn/');
      expect(isKnown, `Internal link target "${href}" must be a registered route`).toBe(true);
    }
  });

  test('interactive SIP calculator updates reactively on input changes, supports step-up comparison, resets cleanly, and rejects invalid inputs', async ({ page }) => {
    await page.goto('/tools/sip/');

    // 1. Initial State Check (Default: 10,000 / mo, 10 yrs, 12% return)
    const futureValEl = page.locator('#sip-future-value');
    await expect(futureValEl).toBeVisible();
    const initialText = await futureValEl.textContent();
    expect(initialText).toContain('₹');

    // 2. Modify Investment Amount Input
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('20000');
    // Verify value updated and is higher
    const updatedText = await futureValEl.textContent();
    expect(updatedText).not.toBe(initialText);

    // 3. Enable Step-Up and Verify Comparison Card
    const stepUpInput = page.locator('input[type="number"]').nth(3);
    await stepUpInput.fill('10');
    const stepUpCard = page.locator('.stepup-advantage-card');
    await expect(stepUpCard).toBeVisible();
    await expect(stepUpCard).toContainText('Scenario Comparison');
    await expect(stepUpCard).toContainText('Step-Up SIP vs Fixed Monthly SIP');

    // 4. Toggle Schedule Table
    const toggleScheduleBtn = page.locator('.btn-toggle-schedule');
    await toggleScheduleBtn.click();
    const scheduleTable = page.locator('.schedule-table');
    await expect(scheduleTable).toBeVisible();
    const rows = page.locator('.schedule-table tbody tr');
    await expect(rows).toHaveCount(10);

    // 5. Reset Action
    const resetBtn = page.locator('#reset-sip-btn');
    await resetBtn.click();
    await expect(amountInput).toHaveValue('10000');
    await expect(stepUpInput).toHaveValue('0');
    await expect(stepUpCard).not.toBeVisible();

    // 6. Invalid Input Boundary: Rate > 50% displays validation error
    const returnInput = page.locator('input[type="number"]').nth(1);
    await returnInput.fill('60');
    const errorMsg = page.locator('.field-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('between 0% and 50%');
    await expect(page.locator('.invalid-state-box')).toBeVisible();
  });

  test('learning hub renders collection-driven approved articles, article detail page loads with TOC, and withheld/unknown articles return 404', async ({ page }) => {
    // 1. Learning Hub
    await page.goto('/learn/');
    const articleCards = page.locator('.article-card');
    await expect(articleCards).toHaveCount(10);

    // Verify review transparency notice is present
    const reviewNotice = page.locator('.review-notice');
    await expect(reviewNotice).toBeVisible();
    await expect(reviewNotice).toContainText('Editorial Standards & Ongoing Review');

    // 2. Navigate to an Approved Article Detail Page
    const firstArticleLink = page.locator('.article-card .card-title-link').first();
    const articleHref = await firstArticleLink.getAttribute('href');
    expect(articleHref).toBeTruthy();

    const response = await page.goto(articleHref!);
    expect(response?.status()).toBe(200);

    // Verify Table of Contents is present
    const toc = page.locator('.toc-card');
    await expect(toc).toBeVisible();

    // Verify single H1
    await expect(page.locator('h1')).toHaveCount(1);

    // Verify author card has no unverified ARN
    const authorCard = page.locator('.author-card');
    await expect(authorCard).toBeVisible();
    await expect(authorCard).not.toContainText('266896');

    // 3. Withheld Article Returns 404 (Not Generated)
    const withheldResponse = await page.goto('/learn/how-to-start-planning-for-retirement/');
    expect(withheldResponse?.status()).toBe(404);

    // 4. Non-existent Slug Returns 404
    const unknownResponse = await page.goto('/learn/completely-non-existent-guide/');
    expect(unknownResponse?.status()).toBe(404);
  });

  test('generate required screenshots at desktop (1440px) and mobile (390px) for visual inspection', async ({ page }) => {
    const targets = [
      { name: 'home', path: '/' },
      { name: 'health-check', path: '/health-check/' },
      { name: 'plan', path: '/plan/' },
      { name: 'tools', path: '/tools/' },
      { name: 'tool-sip', path: '/tools/sip/' },
      { name: 'tool-lumpsum', path: '/tools/lumpsum/' },
      { name: 'tool-sip-growth', path: '/tools/sip-growth/' },
      { name: 'learn', path: '/learn/' },
      { name: 'learn-article', path: '/learn/what-is-sip-and-how-does-it-work/' },
      { name: 'about', path: '/about/' },
      { name: 'contact', path: '/contact/' },
    ];

    // 1. Desktop Screenshots (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const t of targets) {
      await page.goto(t.path);
      await page.screenshot({
        path: `tests/e2e/screenshots/desktop-${t.name}.png`,
        fullPage: true,
      });
    }

    // 2. Mobile Screenshots (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    for (const t of targets) {
      await page.goto(t.path);
      await page.screenshot({
        path: `tests/e2e/screenshots/mobile-${t.name}.png`,
        fullPage: true,
      });
    }

    // Mobile Drawer Open
    await page.goto('/');
    const toggleBtn = page.locator('#mobile-menu-toggle');
    await toggleBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: 'tests/e2e/screenshots/mobile-drawer-open.png',
    });
  });
});
