import { test, expect } from '@playwright/test';

test.describe('Global Header Consistency Across All Routes', () => {
  const routesToTest = [
    { name: 'Home', path: '/', expectedActiveText: 'Home' },
    { name: 'Financial Health', path: '/health-check/', expectedActiveText: 'Financial Health' },
    { name: 'Journey & Goals', path: '/plan/', expectedActiveText: 'Journey & Goals' },
    { name: 'Tools', path: '/tools/', expectedActiveText: 'Tools' },
    { name: 'Learn', path: '/learn/', expectedActiveText: 'Learn' },
    { name: 'About', path: '/about/', expectedActiveText: 'About' },
  ];

  const viewports = [
    { name: 'Desktop 1440', width: 1440, height: 900, isMobile: false },
    { name: 'Tablet 1024', width: 1024, height: 768, isMobile: false },
    { name: 'Mobile 390', width: 390, height: 844, isMobile: true },
    { name: 'Mobile 360', width: 360, height: 780, isMobile: true },
  ];

  for (const vp of viewports) {
    test.describe(`Viewport: ${vp.name}`, () => {
      for (const route of routesToTest) {
        test(`Route ${route.name} (${route.path}) header matches spec`, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.goto(route.path);

          // 1. Header exists and has consistent height (approx 72px)
          const header = page.locator('header.site-header');
          await expect(header).toBeVisible();
          const box = await header.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.height).toBeGreaterThanOrEqual(68);
          expect(box!.height).toBeLessThanOrEqual(76);

          // 2. Redundant separate CTA must NOT exist anywhere in header
          const separateCta = page.locator('.btn-primary-header, .btn-mobile-primary');
          await expect(separateCta).toHaveCount(0);

          // 3. Desktop navigation assertions
          if (!vp.isMobile) {
            const navList = page.locator('.desktop-nav .nav-list');
            await expect(navList).toBeVisible();

            const navItems = page.locator('.desktop-nav .nav-item');
            await expect(navItems).toHaveCount(7);

            const expectedLabels = [
              'Home',
              'Financial Health',
              'Journey & Goals',
              'Tools',
              'Learn',
              'About',
              'Portfolio Login',
            ];

            for (let i = 0; i < 7; i++) {
              const item = navItems.nth(i);
              await expect(item).toContainText(expectedLabels[i]);
            }

            // Portfolio Login is the 7th item and at the far right
            const portfolioItem = navItems.nth(6);
            const portfolioLink = portfolioItem.locator('a.portfolio-link');
            await expect(portfolioLink).toBeVisible();
            await expect(portfolioLink).toHaveAttribute('target', '_blank');
            await expect(portfolioLink).toHaveAttribute('href', 'https://antwealth.themfbox.com/');

            // Active item check
            const activeLink = page.locator('.desktop-nav .nav-link.active');
            await expect(activeLink).toHaveCount(1);
            await expect(activeLink).toHaveText(route.expectedActiveText);
          } else {
            // Mobile navigation assertions
            const toggle = page.locator('#mobile-menu-toggle');
            await expect(toggle).toBeVisible();

            // Open mobile drawer
            await toggle.click();
            const drawer = page.locator('#mobile-nav-drawer');
            await expect(drawer).toBeVisible();

            const mobileItems = page.locator('.mobile-nav-list li');
            await expect(mobileItems).toHaveCount(7);

            const expectedMobileLabels = [
              'Home',
              'Financial Health',
              'Journey & Goals',
              'Tools',
              'Learn',
              'About',
              'Portfolio Login',
            ];

            for (let i = 0; i < 7; i++) {
              const item = mobileItems.nth(i);
              await expect(item).toContainText(expectedMobileLabels[i]);
            }

            // Check active item in mobile drawer
            const activeMobileLink = page.locator('.mobile-nav-link.active');
            await expect(activeMobileLink).toHaveCount(1);
            await expect(activeMobileLink).toHaveText(route.expectedActiveText);

            // Close drawer
            await page.locator('#mobile-drawer-close').click();
            await expect(drawer).toHaveAttribute('hidden', '');
          }

          // Zero horizontal overflow
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
          expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
        });
      }
    });
  }
});
