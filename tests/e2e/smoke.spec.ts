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
      const normalized = href.endsWith('/') ? href : `${href}/`;
      const isKnown = validPaths.has(normalized) || validPaths.has(href);
      expect(isKnown, `Internal link target "${href}" must be a registered route`).toBe(true);
    }
  });

  test('generate required screenshots at desktop (1440px) and mobile (390px) for visual inspection', async ({ page }) => {
    const targets = [
      { name: 'home', path: '/' },
      { name: 'health-check', path: '/health-check/' },
      { name: 'plan', path: '/plan/' },
      { name: 'tools', path: '/tools/' },
      { name: 'tool-sip', path: '/tools/sip/' },
      { name: 'learn', path: '/learn/' },
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
