import { test, expect } from '@playwright/test';

test.describe('Homepage Sequence Restoration Suite', () => {

  test('1. Homepage displays all sections in the complete original target sequence', async ({ page }) => {
    await page.goto('/');

    // 1. Hero
    const heroTitle = page.locator('#hero-title');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('Know where you stand');
    await expect(heroTitle).toContainText('Choose your next move');

    // 2. Starting points
    const startHeading = page.locator('#start-heading');
    await expect(startHeading).toBeVisible();
    await expect(startHeading).toContainText('One clear next step is enough');
    const startCards = page.locator('.start-card');
    await expect(startCards).toHaveCount(3);
    await expect(startCards.nth(0)).toHaveAttribute('href', '/health-check/');
    await expect(startCards.nth(1)).toHaveAttribute('href', '/plan/');
    await expect(startCards.nth(2)).toHaveAttribute('href', '/tools/');

    // 3. Move one stage at a time (Journey Strip)
    const journeyHeading = page.locator('#journey-heading');
    await expect(journeyHeading).toBeVisible();
    await expect(journeyHeading).toContainText('Move one stage at a time');
    const journeyStrip = page.locator('.journey-strip .journey-mini');
    await expect(journeyStrip).toHaveCount(6);

    // 4. Financial wellbeing has more than one number (7 Pillars)
    const pillarsHeading = page.locator('#pillars-heading');
    await expect(pillarsHeading).toBeVisible();
    await expect(pillarsHeading).toContainText('Financial wellbeing has more than one number');
    const pillars = page.locator('.pillars__grid .pillar');
    await expect(pillars).toHaveCount(7);

    // 5. Goals ("What are you planning for?")
    const goalsHeading = page.locator('#goals-heading');
    await expect(goalsHeading).toBeVisible();
    await expect(goalsHeading).toContainText('What are you planning for?');
    const goalTiles = page.locator('.goal-grid .goal-tile');
    await expect(goalTiles).toHaveCount(4);

    // 6. Educational articles ("Learn without the jargon")
    const learnHeading = page.locator('#learn-heading');
    await expect(learnHeading).toBeVisible();
    await expect(learnHeading).toContainText('Good money decisions start with understanding');
    const guideCards = page.locator('.guide-grid .guide-card');
    await expect(guideCards).toHaveCount(3);

    // 7. About section
    const aboutHeading = page.locator('#about-heading');
    await expect(aboutHeading).toBeVisible();
    await expect(aboutHeading).toContainText('Financial planning should help you feel clearer');

    // 8. Closing contact CTA
    const contactHeading = page.locator('#contact-heading');
    await expect(contactHeading).toBeVisible();
    await expect(contactHeading).toContainText('Start with a short, no-pressure conversation');

    // Verify exact sequential order in DOM
    const isSequential = await page.evaluate(() => {
      const hero = document.getElementById('hero-title');
      const start = document.getElementById('start-heading');
      const journey = document.getElementById('journey-heading');
      const pillars = document.getElementById('pillars-heading');
      const goals = document.getElementById('goals-heading');
      const learn = document.getElementById('learn-heading');
      const about = document.getElementById('about-heading');
      const contact = document.getElementById('contact-heading');

      if (!hero || !start || !journey || !pillars || !goals || !learn || !about || !contact) {
        return false;
      }

      return (
        Boolean(hero.compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(start.compareDocumentPosition(journey) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(journey.compareDocumentPosition(pillars) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(pillars.compareDocumentPosition(goals) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(goals.compareDocumentPosition(learn) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(learn.compareDocumentPosition(about) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(about.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING)
      );
    });

    expect(isSequential, 'Sections must follow the exact restored sequence').toBe(true);
  });

  test('2. Restored sections contain correct cards, text, icons, and destinations', async ({ page }) => {
    await page.goto('/');

    // Section A: Choose a starting point
    const startCards = page.locator('.start-card');
    await expect(startCards.nth(0).locator('h3')).toContainText('How healthy are our finances?');
    await expect(startCards.nth(1).locator('h3')).toContainText('We have a goal to plan for');
    await expect(startCards.nth(2).locator('h3')).toContainText('I have a money question');

    // Section B: Move one stage at a time
    const journeyLink = page.locator('a[href="/plan/"]:has-text("Explore the full journey")');
    await expect(journeyLink).toBeVisible();

    // Section C: Seven pillars
    const pillarCheckBtn = page.locator('a[href="/health-check/"]:has-text("Check the seven pillars")');
    await expect(pillarCheckBtn).toBeVisible();
  });

  test('3. Founder badge retains revised 3-line wording', async ({ page }) => {
    await page.goto('/');

    const badge = page.locator('.about__stamp');
    await expect(badge).toBeVisible();
    const badgeText = await badge.innerText();
    expect(badgeText.trim()).toBe('Family goals.\nPractical planning.\nInformed decisions.');

    // Founder photo and credentials
    const founderPhoto = page.locator('.about__photo img');
    await expect(founderPhoto).toBeVisible();
    await expect(founderPhoto).toHaveAttribute('alt', /Santhosh Sathriyan/);
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

      // Verify sections are visible
      await expect(page.locator('#start-heading')).toBeVisible();
      await expect(page.locator('#journey-heading')).toBeVisible();
      await expect(page.locator('#pillars-heading')).toBeVisible();
      await expect(page.locator('#goals-heading')).toBeVisible();
      await expect(page.locator('.about__stamp')).toBeVisible();
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
