import { test, expect } from '@playwright/test';

test.describe('Homepage Sequence Restoration Suite', () => {

  test('1. Homepage displays all sections in the complete original target sequence', async ({ page }) => {
    await page.goto('/');

    // 1. Hero
    const heroTitle = page.locator('#hero-heading');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('Make Better Money Decisions');

    // 2. Trust bar
    const trustBar = page.locator('.trust-bar');
    await expect(trustBar).toBeVisible();
    await expect(trustBar.locator('.trust-col')).toHaveCount(4);

    // 3. About Santhosh
    const aboutSection = page.locator('#about');
    await expect(aboutSection).toBeVisible();

    // 4. Services / Pillars
    const servicesSection = page.locator('#services');
    await expect(servicesSection).toBeVisible();
    await expect(servicesSection.locator('.service-card')).toHaveCount(3);

    // 5. Testimonials
    const testimonialsSection = page.locator('#testimonials');
    await expect(testimonialsSection).toBeVisible();

    // 6. Starting Tools Workbench
    const toolsSection = page.locator('#interactive-tools-workbench');
    await expect(toolsSection).toBeVisible();

    // 7. Learn Guides
    const learnSection = page.locator('#learn');
    await expect(learnSection).toBeVisible();

    // 8. Contact CTA
    const contactSection = page.locator('#contact');
    await expect(contactSection).toBeVisible();
  });

  test('2. Restored sections contain correct cards, text, icons, and destinations', async ({ page }) => {
    await page.goto('/');

    // Hero action buttons
    const pfsHeroBtn = page.locator('.hero-buttons a[href="/tools/personal-finance-statement/"]');
    await expect(pfsHeroBtn).toBeVisible();
    const healthHeroBtn = page.locator('.hero-buttons a[href="/health-check/"]');
    await expect(healthHeroBtn).toBeVisible();

    // Starting tools cards
    const toolBoxes = page.locator('#interactive-tools-workbench a.tool-box');
    await expect(toolBoxes).toHaveCount(4);
    await expect(toolBoxes.nth(0)).toHaveAttribute('href', '/tools/personal-finance-statement/');
    await expect(toolBoxes.nth(1)).toHaveAttribute('href', '/health-check/');
  });

  test('3. Founder badge retains revised 3-line wording', async ({ page }) => {
    await page.goto('/');

    const aboutSection = page.locator('#about');
    await expect(aboutSection).toBeVisible();
    await expect(aboutSection).toContainText('C. Santhosh Sathriyan, B.E.');
    await expect(aboutSection).toContainText('QPFP Certified');
    await expect(aboutSection).toContainText('ARN-266896');
  });

  test('4. Dedicated Journey & Goals (/plan/) and Financial Health (/health-check/) continue to work independently', async ({ page }) => {
    // Journey & Goals
    const planRes = await page.goto('/plan/');
    expect(planRes?.status()).toBe(200);
    const tabs = page.locator('[data-stage-tab]');
    await expect(tabs).toHaveCount(6);

    // Financial Health
    const healthRes = await page.goto('/health-check/');
    expect(healthRes?.status()).toBe(200);
    const startHealthBtn = page.locator('#start-health-check-btn');
    await expect(startHealthBtn).toBeVisible();
  });

  test('5. Responsive layout validation: desktop (1440px), tablet (768px), and mobile (390px) without overflow', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 390, height: 844, name: 'mobile' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasOverflow, `No horizontal overflow at ${vp.width}px`).toBe(false);

      // Verify key sections are visible
      await expect(page.locator('#hero-heading')).toBeVisible();
      await expect(page.locator('.trust-bar')).toBeVisible();
      await expect(page.locator('#services')).toBeVisible();
      await expect(page.locator('#about')).toBeVisible();
      await expect(page.locator('#interactive-tools-workbench')).toBeVisible();
    }
  });

  test('6. Capture full-page desktop and mobile screenshots', async ({ page }) => {
    // Desktop screenshot (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.screenshot({ path: 'tests/e2e/screenshots/homepage_restored_desktop_1440.png', fullPage: true });

    // Mobile screenshot (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.screenshot({ path: 'tests/e2e/screenshots/homepage_restored_mobile_390.png', fullPage: true });
  });

});
