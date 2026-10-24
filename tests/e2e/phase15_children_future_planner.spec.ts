import { test, expect } from '@playwright/test';

test.describe('Phase 15 — Children Future Multi-Milestone Planner (/plan/children/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plan/children/');
    await page.waitForSelector('astro-island:not([ssr])');
  });

  test('1. Page Architecture, Title, Single H1, and Main Landmark', async ({ page }) => {
    await expect(page).toHaveTitle(/Children's Higher Education & Life Milestones Planner/i);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(/Children's Higher Education & Life Milestones Planner/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('2. Starts in clean neutral empty state with zero prefilled figures', async ({ page }) => {
    // Empty hero must be present on fresh page load
    const emptyHero = page.locator('[data-testid="empty-planner-hero"]');
    await expect(emptyHero).toBeVisible();
    await expect(emptyHero).toContainText("Start Planning Your Child's Higher Education");

    // No illustrative banner on initial visit
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);

    // No calculation results displayed initially
    await expect(page.locator('[data-testid="family-roadmap-results"]')).toHaveCount(0);

    // Two primary starter actions must be visible
    await expect(page.locator('[data-testid="btn-start-blank"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-load-family-example"]')).toBeVisible();
  });

  test('3. Load Illustrative Family Example displays conspicuous banner and canonical metrics', async ({ page }) => {
    // Click Load Illustrative Family Example
    await page.locator('[data-testid="btn-load-family-example"]').click();

    // Conspicuous banner must appear
    const banner = page.locator('[data-testid="illustrative-example-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Illustrative example loaded — these are not your figures.');

    // Results container must be rendered
    const results = page.locator('[data-testid="family-roadmap-results"]');
    await expect(results).toBeVisible();

    // Verify key canonical metrics (Aarav + Ananya from VEC-KID-06)
    // Total Today: ₹55,00,000
    await expect(results).toContainText('₹55,00,000');
    // Future Sum: ₹2,15,46,262 (~2.15 Cr)
    await expect(results).toContainText('₹2,15,46,262');
    // Net shortfall: ₹1,94,92,750 (~1.95 Cr)
    await expect(results).toContainText('₹1,94,92,750');
    // Starting Step-Up SIP: ₹22,851/month
    await expect(results).toContainText('₹22,851');
    // Starting Fixed SIP: ₹41,863/month
    await expect(results).toContainText('₹41,863');

    // Milestones and children must be loaded
    await expect(page.locator('[data-testid^="child-card-"]')).toHaveCount(2);
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(2);
  });

  test('4. Editing fields clears the illustrative banner while preserving calculation reactivity', async ({ page }) => {
    await page.locator('[data-testid="btn-load-family-example"]').click();
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toBeVisible();

    // Modify Aarav's age from 6 to 7
    const childAgeInput = page.locator('[aria-label="Numeric current age of Aarav"]');
    await childAgeInput.fill('7');
    await childAgeInput.dispatchEvent('change');

    // Banner must disappear upon user edit
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);

    // Results must update reactively (horizon for M1 reduced from 12y to 11y)
    const results = page.locator('[data-testid="family-roadmap-results"]');
    await expect(results).toBeVisible();
    // Milestone 1 horizon hint should reflect 11 years
    await expect(page.locator('.horizon-hint').first()).toContainText('11 years');
  });

  test('5. Add, duplicate, and remove milestone interactions work smoothly', async ({ page }) => {
    // Start with blank starter
    await page.locator('[data-testid="btn-start-blank"]').click();
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(1);

    // Add another milestone
    await page.locator('[data-testid="btn-add-milestone"]').click();
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(2);

    // Duplicate the second milestone
    const duplicateBtns = page.locator('button:has-text("Duplicate")');
    await duplicateBtns.nth(1).click();
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(3);
    await expect(page.locator('.milestone-title-input').nth(2)).toHaveValue(/Copy/);

    // Delete the duplicated milestone
    const deleteBtns = page.locator('.milestone-header-actions .btn-icon-delete');
    await deleteBtns.nth(2).click();
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(2);
  });

  test('6. Removing child with linked milestones requires confirmation', async ({ page }) => {
    await page.locator('[data-testid="btn-load-family-example"]').click();
    await expect(page.locator('[data-testid^="child-card-"]')).toHaveCount(2);
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(2);

    // Click delete on Aarav (who has linked milestone)
    const firstChildDelete = page.locator('.child-card-header .btn-icon-delete').first();
    await firstChildDelete.click();

    // Confirmation box must appear
    const confirmBox = page.locator('.delete-confirm-box');
    await expect(confirmBox).toBeVisible();
    await expect(confirmBox).toContainText('has 1 linked milestone');

    // Confirm deletion
    await page.locator('.btn-confirm-delete').click();

    // Aarav and linked M1 are removed
    await expect(page.locator('[data-testid^="child-card-"]')).toHaveCount(1);
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(1);
  });

  test('7. Target age less than or equal to current age pauses results and shows inline error', async ({ page }) => {
    await page.locator('[data-testid="btn-start-blank"]').click();

    // Set child age to 15
    const childAge = page.locator('.child-card .number-input-compact');
    await childAge.fill('15');
    await childAge.dispatchEvent('change');

    // Set milestone target age to 14 (< 15)
    const targetAge = page.locator('.milestone-card .number-input-compact');
    await targetAge.fill('14');
    await targetAge.dispatchEvent('change');

    // Inline error badge on card
    await expect(page.locator('.horizon-hint')).toContainText('Invalid: Target age must be > current age');

    // Calculation error alert shown and results suppressed
    await expect(page.locator('[data-testid="planner-validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="family-roadmap-results"]')).toHaveCount(0);
  });

  test('8. Over-allocated asset shows warning notice and pauses calculation results', async ({ page }) => {
    await page.locator('[data-testid="btn-load-family-example"]').click();

    // Asset 1 has currentValue 500,000. Edit currentValue to 300,000 (below total 400,000 allocated)
    const assetValInput = page.locator('.number-input-table').first();
    await assetValInput.fill('300000');
    await assetValInput.dispatchEvent('change');

    // Over-allocated warning badge in table
    await expect(page.locator('.badge-danger-xs').first()).toContainText('Over-allocated by ₹1,00,000!');

    // Overallocation error banner is displayed
    await expect(page.locator('text=Asset Over-Allocation Detected')).toBeVisible();
    await expect(page.locator('[data-testid="family-roadmap-results"]')).toHaveCount(0);
  });

  test('9. Clear All Entries completely resets the planner state', async ({ page }) => {
    await page.locator('[data-testid="btn-load-family-example"]').click();
    await expect(page.locator('[data-testid="family-roadmap-results"]')).toBeVisible();

    // Click Clear All Entries
    await page.locator('[data-testid="btn-clear-planner"]').click();

    // Should return to empty hero with no children, milestones, or results
    await expect(page.locator('[data-testid="empty-planner-hero"]')).toBeVisible();
    await expect(page.locator('[data-testid^="child-card-"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="milestone-card-"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="family-roadmap-results"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toHaveCount(0);
  });

  test('10. Zero Persistence Invariants: No leakage to storage, cookies, or URL search params', async ({ page }) => {
    await page.locator('[data-testid="btn-load-family-example"]').click();

    // Check localStorage
    const localData = await page.evaluate(() => window.localStorage.length);
    expect(localData).toBe(0);

    // Check sessionStorage
    const sessionData = await page.evaluate(() => window.sessionStorage.length);
    expect(sessionData).toBe(0);

    // Check cookies
    const cookies = await page.context().cookies();
    expect(cookies.length).toBe(0);

    // Check URL has no query params
    const url = new URL(page.url());
    expect(url.search).toBe('');
  });

  test('11. Responsive viewports at 360px and 390px have zero horizontal overflow', async ({ page }) => {
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.locator('[data-testid="btn-load-family-example"]').click();

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px rounding tolerance
    }
  });

  test('12. Visual inspection screenshots at desktop (1440px) and mobile (390px)', async ({ page }) => {
    await page.locator('[data-testid="btn-load-family-example"]').click();

    // Desktop Screenshot (1440px)
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.screenshot({
      path: 'tests/e2e/screenshots/desktop-plan-children.png',
      fullPage: true,
    });

    // Mobile Screenshot (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: 'tests/e2e/screenshots/mobile-plan-children.png',
      fullPage: true,
    });
  });
});
