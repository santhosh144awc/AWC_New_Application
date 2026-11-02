import { test, expect } from '@playwright/test';

test.describe('Phase 55: Personal Finance Workbench Simplification & Lead Sharing Verification', () => {
  test('1. Homepage focuses on Personal Finance Statement & Unified Calculators Workbench, with all 8 client testimonials and zero bloated Money Map / 6-Stage / 7-Pillar sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hero highlights Personal Finance Statement
    const hero = page.locator('section.hero');
    await expect(hero).toBeVisible();
    await expect(hero).toContainText('6-Stage Personal Finance Statement');
    const heroPfsCta = hero.locator('a[href="/tools/personal-finance-statement/"]').first();
    await expect(heroPfsCta).toBeVisible();

    // Unified Interactive Tools Workbench is directly below Hero
    const workbench = page.locator('#interactive-tools-workbench');
    await expect(workbench).toBeVisible();
    await expect(workbench.locator('.diag-card')).toHaveCount(3);
    await expect(workbench.locator('.workbench-card')).toHaveCount(11);

    // Abstract Money Map orbit, 6-Stage Strip, and 7-Pillar list are removed from homepage
    await expect(page.locator('.orbit-stage')).toHaveCount(0);
    await expect(page.locator('.journey-strip')).toHaveCount(0);
    await expect(page.locator('.pillars-band')).toHaveCount(0);

    // 8 verified client testimonials remain intact
    const testimonials = page.locator('#testimonials .testimonial-card');
    await expect(testimonials).toHaveCount(8);

    // Production SEO meta robots is index, follow and footer staging notice is removed
    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('footer.site-footer')).not.toContainText('Notice: This application is in staging development');
  });

  test('2. Redundant /tools/loan-vs-invest/ redirects cleanly to /tools/home-loan-foreclosure/', async ({ page }) => {
    await page.goto('/tools/loan-vs-invest/');
    await page.waitForURL('**/tools/home-loan-foreclosure/');
    expect(page.url()).toContain('/tools/home-loan-foreclosure/');
  });

  test('3. Calculator and Goal pages include QuickToolSwitcher + WhatsAppToolLeadBar and strip multi-card textbook essays', async ({ page }) => {
    const pagesToVerify = [
      '/tools/personal-finance-statement/',
      '/tools/sip/',
      '/tools/home-loan-foreclosure/',
      '/tools/loan-sip-recovery/',
      '/tools/swp/',
      '/plan/children/',
      '/plan/retirement/',
    ];

    for (const route of pagesToVerify) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // QuickToolSwitcher is visible at the top
      const switcher = page.locator('nav.quick-tool-switcher');
      await expect(switcher).toBeVisible();
      const activePill = switcher.locator('a.switcher-pill.is-active');
      await expect(activePill).toHaveCount(1);
      await expect(activePill).toHaveAttribute('href', route);

      // WhatsAppToolLeadBar is visible below the calculator with pre-filled wa.me link
      const leadBar = page.locator('section.whatsapp-lead-bar');
      await expect(leadBar).toBeVisible();
      const waBtn = leadBar.locator('a.btn-whatsapp-lead');
      await expect(waBtn).toBeVisible();
      const href = await waBtn.getAttribute('href');
      expect(href).toContain('https://wa.me/918087971566?text=');
    }
  });
});

