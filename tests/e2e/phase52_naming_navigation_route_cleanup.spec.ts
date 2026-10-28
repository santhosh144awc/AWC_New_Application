import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Phase 52: Personal Finance Statement Naming, Navigation, Route and Metadata Cleanup', () => {
  const screenshotsDir = path.resolve('test-results/test-screenshots/phase52');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('1. Canonical route /tools/personal-finance-statement/ loads properly and has clean metadata', async ({ page }) => {
    await page.goto('/tools/personal-finance-statement/');
    await page.waitForLoadState('networkidle');

    // Check title and H1
    await expect(page).toHaveTitle(/Personal Finance Statement — Ant Wealth Creation/);
    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Personal Finance Statement');

    // Breadcrumbs check
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toContainText('Home');
    await expect(breadcrumb).toContainText('Tools');
    await expect(breadcrumb).toContainText('Personal Finance Statement');

    // Client & Statement Information section: no visible preparer field or badge
    const clientSection = page.locator('.pfs-meta-grid');
    await expect(clientSection).toBeVisible();
    await expect(clientSection).not.toContainText('Preparer');
    await expect(clientSection).not.toContainText('C. Santhosh Sathriyan');

    // Verify non-sticky navigation ribbon
    const stepper = page.locator('.pfs-nav-stepper');
    await expect(stepper).toBeVisible();
    const position = await stepper.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).not.toBe('sticky');
    expect(position).not.toBe('fixed');

    // Capture screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '01_canonical_pfs_page.png'), fullPage: false });
  });

  test('2. Legacy route /health-check/real-statement/ redirects to /tools/personal-finance-statement/', async ({ page }) => {
    await page.goto('/health-check/real-statement/');
    await page.waitForURL('**/tools/personal-finance-statement/');
    expect(page.url()).toContain('/tools/personal-finance-statement/');
  });

  test('3. Situation-based Tools Directory lists tool under standard name and links to /tools/personal-finance-statement/', async ({ page }) => {
    await page.goto('/tools/');
    await page.waitForLoadState('networkidle');

    // Check directory card
    const toolLink = page.locator('a[href="/tools/personal-finance-statement/"]');
    await expect(toolLink.first()).toBeVisible();
    await expect(toolLink.first()).toContainText('Personal Finance Statement');

    await page.screenshot({ path: path.join(screenshotsDir, '02_tools_directory_pfs_card.png'), fullPage: false });
  });

  test('4. Journey & Goals Stage 1 has single Personal Finance Statement link', async ({ page }) => {
    await page.goto('/plan/');
    await page.waitForLoadState('networkidle');

    // Stage 1 clear picture has data-stage-id="clear-picture"
    const stage1 = page.locator('section[data-stage-id="clear-picture"]');
    await expect(stage1).toBeVisible();
    await expect(stage1).not.toContainText('Family balance sheet');
    const pfsLink = stage1.locator('a[href="/tools/personal-finance-statement/"]');
    await expect(pfsLink).toBeVisible();
    await expect(pfsLink).toContainText('Personal Finance Statement');

    await page.screenshot({ path: path.join(screenshotsDir, '03_journey_stage1_clean.png'), fullPage: false });
  });

  test('5. Net worth calculator and Health check link cleanly to /tools/personal-finance-statement/ with standard naming', async ({ page }) => {
    await page.goto('/tools/net-worth/');
    await page.waitForLoadState('networkidle');

    // Check eyebrow no longer says "Concept C · Solvency Workbench"
    const eyebrow = page.locator('.results-eyebrow');
    await expect(eyebrow).not.toContainText('Concept C');

    // Deep dive card links to PFS
    const deepDiveLink = page.locator('.btn-deep-dive');
    await expect(deepDiveLink).toBeVisible();
    await expect(deepDiveLink).toContainText('Personal Finance Statement');
    await expect(deepDiveLink).toHaveAttribute('href', '/tools/personal-finance-statement/');

    await page.screenshot({ path: path.join(screenshotsDir, '04_net_worth_crosslink.png'), fullPage: false });
  });
});
