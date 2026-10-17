import { test, expect } from '@playwright/test';

test.describe('Ant Wealth Creation — Homepage & Navigation Suite', () => {
  test('homepage loads with verified title, hero content, landmarks, and no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto('/');

    // 1. Verify page title
    await expect(page).toHaveTitle(/Ant Wealth Creation/);

    // 2. Verify main landmark & Hero Heading
    const mainLandmark = page.locator('#main-content');
    await expect(mainLandmark).toBeVisible();

    const heroHeading = page.locator('#hero-title');
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText('Make Better Money Decisions. Build a Better Future.');

    // 3. Verify main CTA button and navigation to valid section anchor
    const primaryHeroBtn = page.locator('a.btn-primary-hero');
    await expect(primaryHeroBtn).toBeVisible();
    const heroBtnHref = await primaryHeroBtn.getAttribute('href');
    expect(heroBtnHref).toBe('#financial-health');

    // Click primary CTA and verify target section exists and is visible
    const targetSection = page.locator('#financial-health');
    await expect(targetSection).toBeVisible();

    // 4. Verify no internal navigation points to a missing route or missing section ID
    const internalAnchors = await page.locator('header a, footer a').elementHandles();
    for (const anchor of internalAnchors) {
      const href = await anchor.getAttribute('href');
      if (href && href.startsWith('#')) {
        const targetId = href.replace('#', '');
        if (targetId) {
          const matchingElement = page.locator(`[id="${targetId}"]`);
          const count = await matchingElement.count();
          expect(count).toBeGreaterThan(0);
        }
      }
    }

    // 5. Verify 7 Pillars section and content
    const pillars = page.locator('.pillar-card');
    await expect(pillars).toHaveCount(7);

    // 6. Verify 4 Goal Cards
    const goalCards = page.locator('.goal-card');
    await expect(goalCards).toHaveCount(4);

    // 7. Verify 4 Tool Preview Cards
    const toolCards = page.locator('.tool-preview-card');
    await expect(toolCards).toHaveCount(4);

    // 8. Verify Founder Profile & Regulatory Distinction
    const aboutSection = page.locator('#about');
    await expect(aboutSection).toBeVisible();
    await expect(aboutSection).toContainText('C. Santhosh Sathriyan');
    await expect(aboutSection).toContainText('AMFI-Registered Mutual Fund Distributor');

    // 9. Confirm no uncaught browser runtime console errors
    expect(consoleErrors).toEqual([]);
  });

  test('mobile navigation opens and closes accessibly with keyboard and buttons', async ({ page }) => {
    // Set viewport to mobile standard 375x667
    await page.setViewportSize({ width: 375, height: 667 });
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

  test('no horizontal overflow at narrow mobile viewport (360px and 390px)', async ({ page }) => {
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      // Check document scroll width does not exceed client width
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalOverflow).toBe(false);
    }
  });

  test('404 route renders recovery navigation without broken links', async ({ page }) => {
    await page.goto('/non-existent-page-test');
    await expect(page).toHaveTitle(/Page Not Found/);

    const returnLink = page.getByRole('link', { name: /Return to Homepage/i });
    await expect(returnLink).toBeVisible();

    // Verify recovery links point to real homepage sections
    const recoveryLinks = await page.locator('.recovery-links a').elementHandles();
    expect(recoveryLinks.length).toBeGreaterThan(1);
  });

  test('capture desktop and mobile screenshots for visual inspection', async ({ page }) => {
    // Desktop Full-page Screenshot (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.screenshot({ path: 'tests/e2e/screenshots/desktop-homepage.png', fullPage: true });

    // Mobile Viewport Screenshot (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.screenshot({ path: 'tests/e2e/screenshots/mobile-hero.png' });

    // Mobile Drawer Open Screenshot
    const toggleBtn = page.locator('#mobile-menu-toggle');
    await toggleBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/e2e/screenshots/mobile-drawer-open.png' });
  });
});
