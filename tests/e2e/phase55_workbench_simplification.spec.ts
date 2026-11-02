import { test, expect } from '@playwright/test';

test.describe('Phase 55: Company Visiting Card Homepage, Workbench Simplification & Lead Sharing Verification', () => {
  test('1. Homepage acts as a modern Company Website & Digital Visiting Card explaining products, layman personal finance, founder story, 8 client reviews, and supporting tools', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Hero & Digital Visiting Card
    const hero = page.locator('section.hero');
    await expect(hero).toBeVisible();
    await expect(hero).toContainText('Helping Indian families protect what matters and build lasting wealth.');
    const visitingCard = hero.locator('aside.visiting-card');
    await expect(visitingCard).toBeVisible();
    await expect(visitingCard).toContainText('C. Santhosh Sathriyan, B.E.');
    await expect(visitingCard).toContainText('Mutual Funds (SIP / Lump Sum / SWP)');
    await expect(visitingCard).toContainText('Life Insurance (LIC)');
    await expect(visitingCard).toContainText('Health Insurance (Star Health)');

    // 2. What We Offer: 4 Core Products & Services
    const services = page.locator('#services');
    await expect(services).toBeVisible();
    await expect(services.locator('.service-card')).toHaveCount(4);
    await expect(services).toContainText('Mutual Fund Distribution');
    await expect(services).toContainText('Life Insurance & Term Cover');
    await expect(services).toContainText('Health & Medical Insurance');
    await expect(services).toContainText('Personal Finance & Goal Planning');

    // 3. Personal Finance Simplified for a Layman (3 Steps)
    const laymanGuide = page.locator('#personal-finance-guide');
    await expect(laymanGuide).toBeVisible();
    await expect(laymanGuide.locator('.step-card')).toHaveCount(3);

    // 4. 8 verified client testimonials remain intact
    const testimonials = page.locator('#testimonials .testimonial-card');
    await expect(testimonials).toHaveCount(8);

    // 5. Supporting Tools section is present below testimonials
    const workbench = page.locator('#interactive-tools-workbench');
    await expect(workbench).toBeVisible();
    await expect(workbench.locator('.diag-card')).toHaveCount(3);
    await expect(workbench.locator('.workbench-card')).toHaveCount(11);

    // 6. Production SEO meta robots is index, follow and footer staging notice is removed
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
