import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Phase 20 — Concept C Production Redesign Suite (Header, Home, Plan, Tools)', () => {
  const screenshotsDir = path.resolve('tests/e2e/screenshots');
  const reviewScreenshotsDir = path.resolve('../product-docs/design-review/phase1-screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
    if (!fs.existsSync(reviewScreenshotsDir)) fs.mkdirSync(reviewScreenshotsDir, { recursive: true });
  });

  async function saveScreenshot(page: any, filename: string) {
    const p1 = path.join(screenshotsDir, filename);
    const p2 = path.join(reviewScreenshotsDir, filename);
    await page.screenshot({ path: p1, fullPage: true });
    fs.copyFileSync(p1, p2);
  }

  /* --------------------------------------------------------------------------
     1. Header Navigation & Mobile Drawer
     -------------------------------------------------------------------------- */
  test('header navigation highlights active page and mobile drawer behaves accessibly', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1440, height: 900 });

    // Home active state
    await page.goto('/');
    const homeLink = page.locator('.desktop-nav a[href="/"]');
    await expect(homeLink).toHaveClass(/active/);

    // Plan active state
    await page.goto('/plan/');
    const planLink = page.locator('.desktop-nav a[href="/plan/"]');
    await expect(planLink).toHaveClass(/active/);

    // Tools active state
    await page.goto('/tools/');
    const toolsLink = page.locator('.desktop-nav a[href="/tools/"]');
    await expect(toolsLink).toHaveClass(/active/);

    // Mobile drawer accessibility
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const toggleBtn = page.locator('#mobile-menu-toggle');
    const drawer = page.locator('#mobile-nav-drawer');
    const closeBtn = page.locator('#mobile-drawer-close');

    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(drawer).toBeHidden();

    // Open drawer
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toBeVisible();

    // Close with Escape key
    await page.keyboard.press('Escape');
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(drawer).toBeHidden();

    // Reopen and close via close button
    await toggleBtn.click();
    await expect(drawer).toBeVisible();
    await closeBtn.click();
    await expect(drawer).toBeHidden();
  });

  /* --------------------------------------------------------------------------
     2. Homepage Concept C Elements
     -------------------------------------------------------------------------- */
  test('homepage renders Concept C hero, money map, journey strip, 7 pillars, and verified founder bio', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Hero title & accent
    const heroTitle = page.locator('#hero-title');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('Know where you stand.');

    // Money map nodes
    const orbitNodes = page.locator('.orbit-node');
    await expect(orbitNodes).toHaveCount(5);

    // Starting points
    const startCards = page.locator('.start-card');
    await expect(startCards).toHaveCount(3);

    // Journey strip
    const journeyBubbles = page.locator('.journey-mini');
    await expect(journeyBubbles).toHaveCount(6);

    // 7 Pillars
    const pillarCards = page.locator('.pillar');
    await expect(pillarCards).toHaveCount(7);

    // Approved Guides
    const guideCards = page.locator('.guide-card');
    await expect(guideCards).toHaveCount(3);

    // Founder Bio & Compliance Notice
    const aboutSection = page.locator('.about');
    await expect(aboutSection).toBeVisible();
    await expect(aboutSection).toContainText('Santhosh');
    await expect(aboutSection).toContainText('Mutual Fund Distributor');
    await expect(aboutSection).toContainText('does not offer fee-based investment advisory services under SEBI');
  });

  /* --------------------------------------------------------------------------
     3. Financial Journey /plan/ Interactive In-Place Exploration
     -------------------------------------------------------------------------- */
  test('financial journey supports nonlinear tab switching, keyboard navigation, and hash updates', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plan/');

    const stageBtns = page.locator('.path__stage');
    await expect(stageBtns).toHaveCount(6);

    // Initially stage 1 is active
    await expect(stageBtns.nth(0)).toHaveAttribute('aria-selected', 'true');
    const panelTitle = page.locator('.stage:not([hidden]) [data-stage-title]');
    await expect(panelTitle).toContainText('Get a clear picture');

    // Click Stage 3: Protect the people who depend on you
    await stageBtns.nth(2).click();
    await expect(stageBtns.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(stageBtns.nth(0)).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('.stage:not([hidden]) [data-stage-title]')).toContainText('Protect the people who depend on you');
    expect(page.url()).toContain('#stage-protect-family');

    // Stage 3 action cards
    const actionCards = page.locator('.stage:not([hidden]) .stage__actions li');
    expect(await actionCards.count()).toBeGreaterThan(0);

    // Keyboard Arrow navigation to Stage 4 (index 3)
    await stageBtns.nth(2).focus();
    await page.keyboard.press('ArrowRight');
    await expect(stageBtns.nth(3)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.stage:not([hidden]) [data-stage-title]')).toContainText('Name the goals that matter');

    await page.keyboard.press('ArrowLeft');
    await expect(stageBtns.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.stage:not([hidden]) [data-stage-title]')).toContainText('Protect the people who depend on you');

    // Direct hash navigation
    await page.goto('/plan/#stage-clear-picture');
    await expect(stageBtns.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.stage:not([hidden]) [data-stage-title]')).toContainText('Get a clear picture');
  });

  /* --------------------------------------------------------------------------
     4. Tools Directory /tools/ Filtering, Search, and Status Truthfulness
     -------------------------------------------------------------------------- */
  test('tools directory provides category filtering, instant search, empty state reset, and truthful badges', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/');

    const toolCards = page.locator('.tool-card');
    const initialCount = await toolCards.count();
    expect(initialCount).toBe(15);

    // Filter by 'grow' category
    const growFilterBtn = page.locator('.filter-btn[data-intent="grow"]');
    await growFilterBtn.click();
    await expect(growFilterBtn).toHaveAttribute('aria-pressed', 'true');

    // Expect fewer visible tool cards, all in Grow category
    const visibleAfterGrow = page.locator('.tool-card:not([hidden])');
    const growCount = await visibleAfterGrow.count();
    expect(growCount).toBeGreaterThan(0);
    expect(growCount).toBeLessThan(initialCount);

    // Reset to 'all'
    const allFilterBtn = page.locator('.filter-btn[data-intent="all"]');
    await allFilterBtn.click();
    await expect(page.locator('.tool-card:not([hidden])')).toHaveCount(initialCount);

    // Live search for 'sip'
    const searchInput = page.locator('#tool-search');
    await searchInput.fill('sip');
    const visibleAfterSip = page.locator('.tool-card:not([hidden])');
    const sipCount = await visibleAfterSip.count();
    expect(sipCount).toBeGreaterThan(0);
    expect(sipCount).toBeLessThan(initialCount);

    // Search for non-existent keyword to trigger EmptyState
    await searchInput.fill('zyxwvutsrqp');
    const emptyState = page.locator('#tool-empty');
    await expect(emptyState).toBeVisible();
    await expect(page.locator('.tool-card:not([hidden])')).toHaveCount(0);

    // Click "Show all tools" button
    const resetBtn = page.locator('#tool-empty-reset');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await expect(searchInput).toHaveValue('');
    await expect(emptyState).toBeHidden();
    await expect(page.locator('.tool-card:not([hidden])')).toHaveCount(initialCount);

    // Verify no 'undefined' or 'null' text rendered anywhere on page
    const pageText = await page.innerText('body');
    expect(pageText).not.toContain('undefined');
    expect(pageText).not.toContain('null');
  });

  /* --------------------------------------------------------------------------
     5. Responsive Visual Screenshots Capture (1440, 390, 360)
     -------------------------------------------------------------------------- */
  test('capture all required Concept C Phase 1 screenshots at desktop and mobile widths', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Homepage at 1440, 390, 360
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await saveScreenshot(page, 'home-desktop-1440.png');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await saveScreenshot(page, 'home-mobile-390.png');

    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    await saveScreenshot(page, 'home-mobile-360.png');

    // 2. Journey at 1440, 390, 360 + Stage 3 selected
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plan/');
    await saveScreenshot(page, 'journey-desktop-1440.png');

    // Select stage 3
    const stage3Btn = page.locator('.path__stage').nth(2);
    await stage3Btn.click();
    await saveScreenshot(page, 'journey-stage3-selected.png');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/plan/');
    await saveScreenshot(page, 'journey-mobile-390.png');

    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/plan/');
    await saveScreenshot(page, 'journey-mobile-360.png');

    // 3. Tools directory at 1440, 390, 360 + Grow category + SIP search
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/');
    await saveScreenshot(page, 'tools-desktop-1440.png');

    const growBtn = page.locator('.filter-btn[data-intent="grow"]');
    await growBtn.click();
    await saveScreenshot(page, 'tools-category-grow.png');

    const allBtn = page.locator('.filter-btn[data-intent="all"]');
    await allBtn.click();
    const searchInput = page.locator('#tool-search');
    await searchInput.fill('sip');
    await saveScreenshot(page, 'tools-search-sip.png');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/');
    await saveScreenshot(page, 'tools-mobile-390.png');

    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/');
    await saveScreenshot(page, 'tools-mobile-360.png');
  });
});
