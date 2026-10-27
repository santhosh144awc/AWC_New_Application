import { test, expect } from '@playwright/test';

test.describe('Homepage UX Refinement Suite', () => {

  test('1. Homepage displays sections in exact target sequence without redundant starting points, journey strip, or duplicate pillars', async ({ page }) => {
    await page.goto('/');

    // Check main section headings in order
    // Expected order:
    // 1. Hero (#hero-title)
    // 2. Goals (#goals-heading)
    // 3. Learn (#learn-heading)
    // 4. About (#about-heading)
    // 5. Contact (#contact-heading)

    const heroTitle = page.locator('#hero-title');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('Know where you stand');
    await expect(heroTitle).toContainText('Choose your next move');

    // Hero action buttons
    const healthCheckHeroBtn = page.locator('.hero__actions a[href="/health-check/"]');
    await expect(healthCheckHeroBtn).toBeVisible();
    await expect(healthCheckHeroBtn).toContainText('Start your health check');

    const toolsHeroBtn = page.locator('.hero__actions a[href="/tools/"]');
    await expect(toolsHeroBtn).toBeVisible();
    await expect(toolsHeroBtn).toContainText('View all tools');

    // Section 2: Goals immediately follows Hero
    const goalsHeading = page.locator('#goals-heading');
    await expect(goalsHeading).toBeVisible();
    await expect(goalsHeading).toContainText('What are you planning for?');

    // Section 3: Learn
    const learnHeading = page.locator('#learn-heading');
    await expect(learnHeading).toBeVisible();
    await expect(learnHeading).toContainText('Good money decisions start with understanding');

    // Section 4: About
    const aboutHeading = page.locator('#about-heading');
    await expect(aboutHeading).toBeVisible();
    await expect(aboutHeading).toHaveText('Financial planning for the decisions that matter to your family.');

    // Section 5: Contact
    const contactHeading = page.locator('#contact-heading');
    await expect(contactHeading).toBeVisible();
    await expect(contactHeading).toContainText('Start with a short, no-pressure conversation');

    // Verify removed sections are NOT on homepage
    await expect(page.locator('#start-heading')).toHaveCount(0);
    await expect(page.locator('#journey-heading')).toHaveCount(0);
    await expect(page.locator('#pillars-heading')).toHaveCount(0);
    await expect(page.locator('.start-grid')).toHaveCount(0);
    await expect(page.locator('.journey-strip')).toHaveCount(0);
    await expect(page.locator('.pillars')).toHaveCount(0);

    // Verify ordering via document positions
    const orderCheck = await page.evaluate(() => {
      const hero = document.getElementById('hero-title');
      const goals = document.getElementById('goals-heading');
      const learn = document.getElementById('learn-heading');
      const about = document.getElementById('about-heading');
      const contact = document.getElementById('contact-heading');

      if (!hero || !goals || !learn || !about || !contact) return false;

      const posHero = hero.compareDocumentPosition(goals);
      const posGoals = goals.compareDocumentPosition(learn);
      const posLearn = learn.compareDocumentPosition(about);
      const posAbout = about.compareDocumentPosition(contact);

      // Node.DOCUMENT_POSITION_FOLLOWING is 4
      return (
        Boolean(posHero & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(posGoals & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(posLearn & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(posAbout & Node.DOCUMENT_POSITION_FOLLOWING)
      );
    });

    expect(orderCheck, 'Sections must appear in strictly sequential order').toBe(true);
  });

  test('2. Goal-planning cards preserve all 4 cards, symbols, and destinations', async ({ page }) => {
    await page.goto('/');

    const goalCards = page.locator('.goal-grid .goal-tile');
    await expect(goalCards).toHaveCount(4);

    const expectedGoals = [
      { title: 'Children’s future', href: '/plan/children/' },
      { title: 'Buy a home', href: '/plan/home-purchase/' },
      { title: 'Grow investments', href: '/tools/sip/' },
      { title: 'Retirement', href: '/plan/retirement/' },
    ];

    for (let i = 0; i < expectedGoals.length; i++) {
      const card = goalCards.nth(i);
      await expect(card.locator('h3')).toContainText(expectedGoals[i].title);
      await expect(card).toHaveAttribute('href', expectedGoals[i].href);
    }
  });

  test('3. Educational articles section retains 3 featured guides and Browse All Guides destination', async ({ page }) => {
    await page.goto('/');

    const guideCards = page.locator('.guide-grid .guide-card');
    await expect(guideCards).toHaveCount(3);

    const browseBtn = page.locator('a[href="/learn/"]:has-text("Browse all guides")');
    await expect(browseBtn).toBeVisible();
  });

  test('4. Founder/About section displays updated heading and exact 3-line badge wording without obscuring photo', async ({ page }) => {
    await page.goto('/');

    // Heading verification
    const aboutHeading = page.locator('#about-heading');
    await expect(aboutHeading).toHaveText('Financial planning for the decisions that matter to your family.');

    // Founder badge wording: "Family goals.\nPractical planning.\nInformed decisions."
    const badge = page.locator('.about__stamp');
    await expect(badge).toBeVisible();
    const badgeText = await badge.innerText();
    expect(badgeText.trim()).toBe('Family goals.\nPractical planning.\nInformed decisions.');

    // Founder credentials and details intact
    const founderPhoto = page.locator('.about__photo img');
    await expect(founderPhoto).toBeVisible();
    await expect(founderPhoto).toHaveAttribute('alt', /Santhosh Sathriyan/);

    const founderFacts = page.locator('.about__facts li');
    await expect(founderFacts).toHaveCount(3);
  });

  test('5. Dedicated Journey & Goals (/plan/) and Financial Health (/health-check/) remain complete and accessible', async ({ page }) => {
    // Journey & Goals page
    const planRes = await page.goto('/plan/');
    expect(planRes?.status()).toBe(200);
    const journeyHeading = page.locator('#journey-heading');
    await expect(journeyHeading).toBeAttached();
    const journeyTabs = page.locator('[data-stage-tab]');
    await expect(journeyTabs).toHaveCount(6);

    // Financial Health page
    const healthRes = await page.goto('/health-check/');
    expect(healthRes?.status()).toBe(200);
    const healthTitle = page.locator('h1');
    await expect(healthTitle).toContainText("Understand your family's financial health");
    const startHealthBtn = page.locator('#start-health-check-btn');
    await expect(startHealthBtn).toBeVisible();
  });

  test('6. Responsive validation across desktop (1440px), tablet (768px), and mobile (390px)', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 390, height: 844, name: 'mobile' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Check no horizontal scrollbar / overflow
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalOverflow, `Page should not have horizontal overflow at ${vp.width}px`).toBe(false);

      // Verify founder badge visibility
      const badge = page.locator('.about__stamp');
      await expect(badge).toBeVisible();

      // Ensure goal cards are visible
      const goalTiles = page.locator('.goal-tile');
      await expect(goalTiles.first()).toBeVisible();

      // Ensure CTA buttons are visible
      await expect(page.locator('.hero__actions a').first()).toBeVisible();
    }
  });

  test('7. Capture screenshots for desktop (1440px) and mobile (390px) evidence', async ({ page }) => {
    // Desktop screenshot
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.screenshot({ path: 'tests/e2e/screenshots/homepage_refined_desktop_1440.png', fullPage: true });

    // Mobile screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.screenshot({ path: 'tests/e2e/screenshots/homepage_refined_mobile_390.png', fullPage: true });
  });

});
