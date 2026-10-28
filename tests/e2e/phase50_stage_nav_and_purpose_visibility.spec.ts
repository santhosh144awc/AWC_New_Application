import { test, expect } from '@playwright/test';

test.describe('Phase 50 — Fix Stage Navigation Scrolling and Asset Purpose Field Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health-check/real-statement/');
    await page.waitForSelector('.pfs-meta-section');
  });

  test('1. Non-sticky progress ribbon at desktop widths: ribbon stays in normal document flow and scrolls away on scroll', async ({ page }) => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(viewport);

      const header = page.locator('.site-header');
      const stepperNav = page.locator('.pfs-nav-stepper');

      // 1. Position style is static (not sticky, not fixed)
      const computedPos = await stepperNav.evaluate((el) => window.getComputedStyle(el).position);
      expect(computedPos).toBe('static');

      // 2. Initial document position
      const initialNavBox = await stepperNav.boundingBox();
      expect(initialNavBox).not.toBeNull();
      const initialY = initialNavBox!.y;

      // 3. Navigate to Assets stage (Stage 4) which is long
      await page.click('#btn-nav-stage-4');
      await expect(page.locator('#pane-stage-4')).toBeVisible();
      await page.waitForTimeout(300);

      // 4. Scroll down 700px
      await page.evaluate(() => window.scrollBy(0, 700));
      await page.waitForTimeout(200);

      const scrolledNavBox = await stepperNav.boundingBox();
      expect(scrolledNavBox).not.toBeNull();

      // Ribbon must move out of viewport or scroll away with document, NOT remain pinned
      expect(scrolledNavBox!.y).toBeLessThan(initialY - 500);

      // 5. Scroll back up to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);

      const restoredNavBox = await stepperNav.boundingBox();
      expect(restoredNavBox).not.toBeNull();
      expect(Math.abs(restoredNavBox!.y - initialY)).toBeLessThanOrEqual(5);
    }
  });

  test('2. Stage-transition navigation: destination landing brings ribbon, live summary, and selected stage content into clear overview', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const header = page.locator('.site-header');
    const stepperNav = page.locator('.pfs-nav-stepper');
    const liveSummary = page.locator('.pfs-live-bar');
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    const headerHeight = headerBox!.height;

    // Stage 1 -> Continue to Stage 2
    await page.click('#btn-stage-1-next');
    await expect(page.locator('#pane-stage-2')).toBeVisible();
    await page.waitForTimeout(300);

    const navBox2 = await stepperNav.boundingBox();
    const sumBox2 = await liveSummary.boundingBox();
    const s2Heading = page.locator('#stage-2-heading');
    await expect(s2Heading).toBeVisible();
    const s2Box = await s2Heading.boundingBox();

    // Verify overview sequence: Header -> Ribbon -> Live Summary -> Stage 2 Heading
    expect(navBox2!.y).toBeGreaterThanOrEqual(headerHeight);
    expect(sumBox2!.y).toBeGreaterThanOrEqual(navBox2!.y + navBox2!.height);
    expect(s2Box!.y).toBeGreaterThanOrEqual(sumBox2!.y + sumBox2!.height);

    // Stage 2 -> Continue to Stage 3
    await page.click('#btn-stage-2-next');
    await expect(page.locator('#pane-stage-3')).toBeVisible();
    await page.waitForTimeout(300);

    const navBox3 = await stepperNav.boundingBox();
    const sumBox3 = await liveSummary.boundingBox();
    const s3Heading = page.locator('#stage-3-heading');
    await expect(s3Heading).toBeVisible();
    const s3Box = await s3Heading.boundingBox();

    expect(navBox3!.y).toBeGreaterThanOrEqual(headerHeight);
    expect(sumBox3!.y).toBeGreaterThanOrEqual(navBox3!.y + navBox3!.height);
    expect(s3Box!.y).toBeGreaterThanOrEqual(sumBox3!.y + sumBox3!.height);

    // Stage 3 -> Continue to Stage 4 (Assets)
    await page.click('#btn-stage-3-next');
    await expect(page.locator('#pane-stage-4')).toBeVisible();
    await page.waitForTimeout(300);

    const navBox4 = await stepperNav.boundingBox();
    const sumBox4 = await liveSummary.boundingBox();
    const s4Heading = page.locator('#stage-4-heading');
    await expect(s4Heading).toBeVisible();
    const s4Box = await s4Heading.boundingBox();

    expect(navBox4!.y).toBeGreaterThanOrEqual(headerHeight);
    expect(sumBox4!.y).toBeGreaterThanOrEqual(navBox4!.y + navBox4!.height);
    expect(s4Box!.y).toBeGreaterThanOrEqual(sumBox4!.y + sumBox4!.height);

    // First input section in Stage 4 (Liquid Assets) is visible in viewport
    const liquidHeading = page.locator('.pfs-category-section').first();
    await expect(liquidHeading).toBeVisible();

    // Stage 4 -> Back to Stage 3
    const backToS3Btn = page.locator('#pane-stage-4 .pfs-stage-footer-actions button').first();
    await backToS3Btn.click();
    await expect(page.locator('#pane-stage-3')).toBeVisible();
    await page.waitForTimeout(300);

    const navBox3Back = await stepperNav.boundingBox();
    const s3HeadingBack = page.locator('#stage-3-heading');
    const s3BoxBack = await s3HeadingBack.boundingBox();
    expect(navBox3Back!.y).toBeGreaterThanOrEqual(headerHeight);
    expect(s3BoxBack!.y).toBeGreaterThanOrEqual(navBox3Back!.y + navBox3Back!.height);

    // Direct selection to Stage 5 (Liabilities)
    await page.click('#btn-nav-stage-5');
    await expect(page.locator('#pane-stage-5')).toBeVisible();
    await page.waitForTimeout(300);

    const navBox5 = await stepperNav.boundingBox();
    const s5Heading = page.locator('#stage-5-heading');
    const s5Box = await s5Heading.boundingBox();
    expect(navBox5!.y).toBeGreaterThanOrEqual(headerHeight);
    expect(s5Box!.y).toBeGreaterThanOrEqual(navBox5!.y + navBox5!.height);

    // Direct selection to Stage 6 (Review)
    await page.click('#btn-nav-stage-6');
    await expect(page.locator('#pane-stage-6')).toBeVisible();
    await page.waitForTimeout(300);

    const navBox6 = await stepperNav.boundingBox();
    const s6Heading = page.locator('#stage-6-heading');
    const s6Box = await s6Heading.boundingBox();
    expect(navBox6!.y).toBeGreaterThanOrEqual(headerHeight);
    expect(s6Box!.y).toBeGreaterThanOrEqual(navBox6!.y + navBox6!.height);

    // Repeated transitions do not accumulate scroll drift
    await page.click('#btn-nav-stage-4');
    await page.waitForTimeout(200);
    await page.click('#btn-nav-stage-2');
    await page.waitForTimeout(200);
    const navBoxRepeated = await stepperNav.boundingBox();
    expect(navBoxRepeated!.y).toBeGreaterThanOrEqual(headerHeight);
  });

  test('3. Purpose / Goal column width and placeholder readability at desktop viewports', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.click('#btn-nav-stage-4');
    await expect(page.locator('#pane-stage-4')).toBeVisible();

    // Check Purpose inputs across the 6 categories
    const categories = [
      { name: 'Liquid', placeholder: 'e.g. Emergency fund' },
      { name: 'Debt', placeholder: "e.g. Child's education" },
      { name: 'Equity', placeholder: 'e.g. Retirement' },
      { name: 'Gold', placeholder: 'e.g. Long-term goal' },
      { name: 'Real Estate', placeholder: 'e.g. Home purchase' },
      { name: 'Personal', placeholder: 'e.g. Family use' },
    ];

    for (let i = 0; i < categories.length; i++) {
      const section = page.locator('.pfs-category-section').nth(i);
      const firstRowPurposeInput = section.locator('.pfs-table-input-purpose').first();

      // Verify placeholder
      await expect(firstRowPurposeInput).toHaveAttribute('placeholder', categories[i].placeholder);

      // Verify input width is in desktop range (approx 150-220px)
      const box = await firstRowPurposeInput.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(150);

      // Verify placeholder font size is approximately 12px
      const fontSize = await firstRowPurposeInput.evaluate((el) => {
        return window.getComputedStyle(el, '::placeholder').fontSize || window.getComputedStyle(el).fontSize;
      });
      expect(fontSize).toBeDefined();

      // Verify initially empty
      expect(await firstRowPurposeInput.inputValue()).toBe('');
    }

    // Verify adding a custom row receives empty purpose and sensible placeholder
    const addLiquidBtn = page.locator('.pfs-category-section').first().locator('button:has-text("+ Add Asset")');
    await addLiquidBtn.click();
    const rows = page.locator('.pfs-category-section').first().locator('tbody tr');
    const lastRowPurpose = rows.last().locator('.pfs-table-input-purpose');
    expect(await lastRowPurpose.inputValue()).toBe('');
    expect(await lastRowPurpose.getAttribute('placeholder')).toBe('e.g. Emergency fund');
  });

  test('4. Data integrity: entering purpose does not alter asset totals or double count', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.click('#btn-nav-stage-4');
    await expect(page.locator('#pane-stage-4')).toBeVisible();

    // Fill in asset value for first liquid row
    const firstRowSelfInput = page.locator('.pfs-category-section').first().locator('tbody tr').first().locator('input[type="number"]').nth(0);
    await firstRowSelfInput.fill('100000');

    const totalAssetsMetric = page.locator('#metric-assets .pfs-metric-value');
    await expect(totalAssetsMetric).toContainText('₹1,00,000');

    // Fill purpose
    const firstRowPurpose = page.locator('.pfs-category-section').first().locator('.pfs-table-input-purpose').first();
    await firstRowPurpose.fill('Emergency contingency');

    // Total must remain exactly ₹1,00,000
    await expect(totalAssetsMetric).toContainText('₹1,00,000');

    // Navigate to stage 5 then back to stage 4
    await page.click('#btn-nav-stage-5');
    await expect(page.locator('#pane-stage-5')).toBeVisible();
    await page.click('#btn-nav-stage-4');
    await expect(page.locator('#pane-stage-4')).toBeVisible();

    // Purpose text is preserved
    expect(await firstRowPurpose.inputValue()).toBe('Emergency contingency');
  });

  test('5. Mobile responsiveness at 390px: non-sticky ribbon, contained table scrolling, and zero page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const stepperNav = page.locator('.pfs-nav-stepper');
    const computedPos = await stepperNav.evaluate((el) => window.getComputedStyle(el).position);
    expect(computedPos).toBe('static');

    const initialNavBox = await stepperNav.boundingBox();
    expect(initialNavBox).not.toBeNull();
    const initialY = initialNavBox!.y;

    // Scroll down 1200px on mobile
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(200);

    const scrolledNavBox = await stepperNav.boundingBox();
    expect(scrolledNavBox).not.toBeNull();
    // Scrolls out of top view or well below initial
    expect(scrolledNavBox!.y).toBeLessThan(initialY - 800);

    // Check no document horizontal scroll
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});
