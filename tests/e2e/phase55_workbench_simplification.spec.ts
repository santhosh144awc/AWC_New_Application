import { test, expect } from '@playwright/test';

test.describe('Phase 55: Clean Editorial Company Homepage, Workbench Simplification & Lead Sharing Verification', () => {
  test('1. Homepage acts as a clean, light editorial Company Website with 6-step family hero, founder profile, 3 service pillars, 8 client reviews, and 4 supporting starting-point tools', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Clean Light Hero & 4-Column Practice Credential Bar
    const hero = page.locator('section.hero-section');
    await expect(hero).toBeVisible();
    await expect(hero).toContainText('Make Better Money Decisions. Build a Better Future.');
    const trustBar = hero.locator('.trust-bar');
    await expect(trustBar).toBeVisible();
    await expect(trustBar.locator('.trust-col')).toHaveCount(4);
    await expect(trustBar).toContainText('C. Santhosh Sathriyan, B.E., QPFP');
    await expect(trustBar).toContainText('AMFI-Registered (ARN-266896)');
    await expect(trustBar).toContainText('LIC Life Cover & Star Health');

    // 2. Meet Santhosh (Clean Executive Profile / Visiting Card)
    const aboutSection = page.locator('#about');
    await expect(aboutSection).toBeVisible();
    await expect(aboutSection).toContainText('C. Santhosh Sathriyan, B.E.');
    await expect(aboutSection).toContainText('+91 80879 71566');
    await expect(aboutSection).toContainText('santhosh@antwealth.in');

    // 3. How We Help Your Family: 3 Clean Service Pillars
    const services = page.locator('#services');
    await expect(services).toBeVisible();
    await expect(services.locator('.service-card')).toHaveCount(3);
    await expect(services).toContainText('Life & Health Insurance');
    await expect(services).toContainText('Mutual Fund Distribution');
    await expect(services).toContainText('Personal Finance Planning');

    // 4. 8 verified client testimonials remain intact
    const testimonials = page.locator('#testimonials .testimonial-card');
    await expect(testimonials).toHaveCount(8);

    // 5. Supporting Tools section shows 4 clean starting-point cards + View All Tools link
    const workbench = page.locator('#interactive-tools-workbench');
    await expect(workbench).toBeVisible();
    await expect(workbench.locator('.tool-box')).toHaveCount(4);
    await expect(workbench.locator('a.section-link')).toHaveAttribute('href', '/tools/');

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

  test('4. Sitewide audit fixes: 1-click Clear buttons for pre-loaded top-ups, executive 7-Pillar Health Check SVG, LaTeX-free articles, and production disclaimers', async ({ page }) => {
    // 1. SIP Growth Simulator: 1-click Clear Top-Ups button
    await page.goto('/tools/sip-growth/');
    await page.waitForSelector('astro-island:not([ssr])');
    const advToggle = page.locator('#toggle-advanced-options-btn');
    await expect(advToggle).toContainText('1 active top-up');
    await advToggle.click();
    const clearTopUpsBtn = page.getByRole('button', { name: 'Clear Top-Ups' });
    await expect(clearTopUpsBtn).toBeVisible();
    await clearTopUpsBtn.click();
    await expect(page.locator('.lumpsum-row-card')).toHaveCount(0);

    // 2. Home Loan Prepayment vs SIP: 1-click Clear All button
    await page.goto('/tools/home-loan-foreclosure/');
    await page.waitForSelector('astro-island:not([ssr])');
    const clearAllBtn = page.getByRole('button', { name: 'Clear All' });
    await expect(clearAllBtn).toBeVisible();
    await clearAllBtn.click();
    await expect(page.locator('.one-time-row')).toHaveCount(0);

    // 3. Health Check: Executive 7-Pillar Diagnostic Framework SVG
    await page.goto('/health-check/');
    await page.waitForSelector('astro-island:not([ssr])');
    const introSvg = page.locator('.start-art-col svg');
    await expect(introSvg).toBeVisible();
    await expect(introSvg).toContainText('7-PILLAR DIAGNOSTIC FRAMEWORK');

    // 4. Articles: No raw LaTeX strings and confirmed ARN-266896 disclaimer
    await page.goto('/learn/what-is-sip-and-how-does-it-work/');
    const sipArticleText = await page.textContent('main');
    expect(sipArticleText).not.toContain('$i =');
    expect(sipArticleText).not.toContain('registration details pending confirmation');
    expect(sipArticleText).toContain('ARN-266896');

    // 5. Disclaimer page: No Development & Staging Notice
    await page.goto('/disclaimer/');
    const disclaimerText = await page.textContent('main');
    expect(disclaimerText).not.toContain('Development & Staging Notice');
  });
});
