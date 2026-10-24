import { test, expect } from '@playwright/test';

test.describe('Health Check Redesign Viewport & Visual Check', () => {
  const viewports = [
    { width: 1440, height: 900, name: '1440_desktop' },
    { width: 1024, height: 768, name: '1024_tablet_landscape' },
    { width: 768, height: 1024, name: '768_tablet_portrait' },
    { width: 390, height: 844, name: '390_mobile' },
    { width: 360, height: 780, name: '360_mobile' },
  ];

  for (const vp of viewports) {
    test(`Verify ${vp.name} (${vp.width}x${vp.height}): Opening, Questionnaire, and Results have zero overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/health-check/');

      // Check header CTA absence on /health-check/
      await expect(page.locator('.btn-primary-header')).toHaveCount(0);

      // Verify obsolete landing metadata is absent
      await expect(page.locator('text=7 questions')).toHaveCount(0);
      await expect(page.locator('text=About 2 minutes')).toHaveCount(0);
      await expect(page.locator('text=Private in your browser')).toHaveCount(0);

      // Check zero horizontal overflow on opening view
      const overflowStart = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });
      expect(overflowStart).toBe(true);

      // Verify opening card content and illustration
      await expect(page.locator('.eyebrow-chip')).toHaveText('FINANCIAL HEALTH CHECK');
      await expect(page.locator('.start-main-title')).toHaveText("Understand your family's financial health");
      await expect(page.locator('.start-art-col svg')).toBeVisible();

      const startBtn = page.locator('#start-health-check-btn');
      await expect(startBtn).toBeVisible();

      // Take landing screenshot
      await page.screenshot({ path: `tests/e2e/screenshots/health_redesign_${vp.name}_landing.png`, fullPage: false });

      // Start questionnaire
      await startBtn.click();
      await expect(page.locator('#health-questionnaire-card')).toBeVisible();

      // Check question illustration is visible
      await expect(page.locator('.question-illustration-box svg')).toBeVisible();

      // Take question screenshot
      await page.screenshot({ path: `tests/e2e/screenshots/health_redesign_${vp.name}_question.png`, fullPage: false });

      // Check zero horizontal overflow during questionnaire
      const overflowQuestionnaire = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });
      expect(overflowQuestionnaire).toBe(true);

      // Select an answer and continue through all 7 questions
      for (let step = 0; step < 7; step++) {
        // Confirm illustration is present on each question
        await expect(page.locator('.question-illustration-box svg')).toBeVisible();
        await page.locator('.option-card').first().click();
        await page.locator('#next-step-btn').click();
      }

      // Verify results dashboard visible
      await expect(page.locator('#health-results-dashboard')).toBeVisible();

      // Verify all 7 area summaries are visible by default (NO global toggle button)
      await expect(page.locator('#toggle-7-areas-btn')).toHaveCount(0);
      const rows = page.locator('.pillar-score-row');
      await expect(rows).toHaveCount(7);
      await expect(rows.first()).toBeVisible();

      // Verify individual detail accordion works
      const firstAccordion = rows.first().locator('.pillar-detail-accordion');
      await expect(firstAccordion).toBeVisible();
      await expect(firstAccordion).not.toHaveAttribute('open', '');
      await rows.first().locator('.pillar-detail-summary').click();
      await expect(firstAccordion).toHaveAttribute('open', '');
      await expect(firstAccordion.locator('.pillar-answer-summary')).toBeVisible();

      // Check zero horizontal overflow on results
      const overflowResults = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });
      expect(overflowResults).toBe(true);

      // Take screenshots for evidence
      await page.screenshot({ path: `tests/e2e/screenshots/health_redesign_${vp.name}_results.png`, fullPage: false });
    });
  }

  test('Homepage CTA labels match specified requirements and global header has standardized navigation without separate CTA', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Check homepage hero CTA buttons
    const startHealthBtn = page.getByRole('link', { name: 'Start your health check →' });
    await expect(startHealthBtn).toBeVisible();
    await expect(startHealthBtn).toHaveAttribute('href', '/health-check/');

    const viewToolsBtn = page.getByRole('link', { name: 'View all tools →' });
    await expect(viewToolsBtn).toBeVisible();
    await expect(viewToolsBtn).toHaveAttribute('href', '/tools/');

    // Ensure old labels do not appear anywhere on homepage
    await expect(page.locator('text=Start the seven-pillar health check')).toHaveCount(0);
    await expect(page.locator('text=Explore planning tools')).toHaveCount(0);

    // Verify separate header CTA button is absent across the header
    await expect(page.locator('.btn-primary-header')).toHaveCount(0);

    // Verify Portfolio Login is present as the 7th item at the far right of the nav
    const navItems = page.locator('.desktop-nav .nav-item');
    await expect(navItems).toHaveCount(7);
    const lastNavItem = navItems.last();
    await expect(lastNavItem.locator('.portfolio-link')).toBeVisible();
    await expect(lastNavItem.locator('.portfolio-link')).toContainText('Portfolio Login');
  });
});
