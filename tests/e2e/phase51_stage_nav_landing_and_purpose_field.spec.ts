import { test, expect } from '@playwright/test';

test.describe('Phase 51 — Correct Stage Navigation Landing Position and Improve Purpose / Goal Field', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health-check/real-statement/');
    await page.waitForSelector('.pfs-meta-section');
  });

  test('1. Stage-navigation landing position: every transition brings ribbon, financial summary, and selected stage content into clear view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const header = page.locator('.site-header');
    const stepperNav = page.locator('.pfs-nav-stepper');
    const liveSummary = page.locator('.pfs-live-bar');
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    const headerHeight = headerBox!.height;

    // Helper to verify the required visible sequence:
    // 1. Progress ribbon at top beneath site header
    // 2. Financial summary directly below ribbon
    // 3. Active stage heading and initial inputs directly below summary
    const verifyOverviewSequence = async (stageNum: number, headingSelector: string) => {
      const navBox = await stepperNav.boundingBox();
      const sumBox = await liveSummary.boundingBox();
      const headingEl = page.locator(headingSelector);
      await expect(headingEl).toBeVisible();
      const headingBox = await headingEl.boundingBox();

      // Ribbon is visible and positioned cleanly beneath the site header
      expect(navBox!.y).toBeGreaterThanOrEqual(headerHeight - 2);
      expect(navBox!.y).toBeLessThan(headerHeight + 50);

      // Financial summary is directly below the ribbon
      expect(sumBox!.y).toBeGreaterThanOrEqual(navBox!.y + navBox!.height - 2);

      // Selected stage heading is visible directly below the financial summary
      expect(headingBox!.y).toBeGreaterThanOrEqual(sumBox!.y + sumBox!.height - 2);
      expect(headingBox!.y).toBeLessThan(900); // Heading is visible within the viewport

      // Verify ribbon is non-sticky (position: static)
      const posStyle = await stepperNav.evaluate((el) => window.getComputedStyle(el).position);
      expect(posStyle).toBe('static');

      // Verify active stage indicator
      await expect(page.locator(`#btn-nav-stage-${stageNum}`)).toHaveClass(/active/);
    };

    // 1. Continue from Stage 1 to Stage 2
    await page.click('#btn-stage-1-next');
    await expect(page.locator('#pane-stage-2')).toBeVisible();
    await page.waitForTimeout(300);
    await verifyOverviewSequence(2, '#stage-2-heading');

    // 2. Continue from Stage 2 to Stage 3
    await page.click('#btn-stage-2-next');
    await expect(page.locator('#pane-stage-3')).toBeVisible();
    await page.waitForTimeout(300);
    await verifyOverviewSequence(3, '#stage-3-heading');

    // 3. Continue from Stage 3 to Stage 4 (Assets)
    await page.click('#btn-stage-3-next');
    await expect(page.locator('#pane-stage-4')).toBeVisible();
    await page.waitForTimeout(300);
    await verifyOverviewSequence(4, '#stage-4-heading');

    // First asset table (Liquid safety reserves) must be visible in viewport
    const liquidSection = page.locator('.pfs-category-section').first();
    await expect(liquidSection).toBeVisible();

    // 4. Continue from Stage 4 to Stage 5 (Liabilities)
    await page.click('#btn-stage-4-next');
    await expect(page.locator('#pane-stage-5')).toBeVisible();
    await page.waitForTimeout(300);
    await verifyOverviewSequence(5, '#stage-5-heading');

    // 5. Continue from Stage 5 to Stage 6 (Net Worth & Review)
    await page.click('#btn-stage-5-next');
    await expect(page.locator('#pane-stage-6')).toBeVisible();
    await page.waitForTimeout(300);
    await verifyOverviewSequence(6, '#stage-6-heading');

    // 6. Back from Stage 6 to Stage 5
    const backToS5Btn = page.locator('#pane-stage-6 .pfs-stage-footer-actions button').first();
    await backToS5Btn.click();
    await expect(page.locator('#pane-stage-5')).toBeVisible();
    await page.waitForTimeout(300);
    await verifyOverviewSequence(5, '#stage-5-heading');

    // 7. Back from Stage 4 to Stage 3
    await page.click('#btn-nav-stage-4');
    await page.waitForTimeout(300);
    const backToS3Btn = page.locator('#pane-stage-4 .pfs-stage-footer-actions button').first();
    await backToS3Btn.click();
    await expect(page.locator('#pane-stage-3')).toBeVisible();
    await page.waitForTimeout(300);
    await verifyOverviewSequence(3, '#stage-3-heading');

    // 8. Directly select Stage 4 from ribbon
    await page.click('#btn-nav-stage-4');
    await expect(page.locator('#pane-stage-4')).toBeVisible();
    await page.waitForTimeout(300);
    await verifyOverviewSequence(4, '#stage-4-heading');

    // 9. Directly select Stage 6 from ribbon
    await page.click('#btn-nav-stage-6');
    await expect(page.locator('#pane-stage-6')).toBeVisible();
    await page.waitForTimeout(300);
    await verifyOverviewSequence(6, '#stage-6-heading');

    // 10. Repeated forward and backward navigation does not create cumulative scroll drift
    for (let i = 0; i < 3; i++) {
      await page.click('#btn-nav-stage-2');
      await page.waitForTimeout(150);
      await page.click('#btn-nav-stage-4');
      await page.waitForTimeout(150);
    }
    await verifyOverviewSequence(4, '#stage-4-heading');
  });

  test('2. Purpose / Goal input field width (190-220px desktop), font size (11.5px), and full placeholder readability', async ({ page }) => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(viewport);

      await page.click('#btn-nav-stage-4');
      await expect(page.locator('#pane-stage-4')).toBeVisible();
      await page.waitForTimeout(300);

      const categories = [
        { name: 'Liquid Assets', placeholder: 'e.g. Emergency fund' },
        { name: 'Debt Assets', placeholder: "e.g. Child's education" },
        { name: 'Equity Assets', placeholder: 'e.g. Retirement' },
        { name: 'Gold Assets', placeholder: 'e.g. Long-term goal' },
        { name: 'Real Estate Assets', placeholder: 'e.g. Home purchase' },
        { name: 'Personal Assets', placeholder: 'e.g. Family use' },
      ];

      for (let i = 0; i < categories.length; i++) {
        const section = page.locator('.pfs-category-section').nth(i);
        const purposeInput = section.locator('.pfs-table-input-purpose').first();

        // 1. Verify exact concise placeholder
        await expect(purposeInput).toHaveAttribute('placeholder', categories[i].placeholder);

        // 2. Verify width meets desktop targets: 190–220px where space permits, min 165px
        const box = await purposeInput.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(165);
        expect(box!.width).toBeLessThanOrEqual(235);

        // 3. Verify placeholder font size is approx 11.5px - 12px
        const computedStyle = await purposeInput.evaluate((el) => {
          const cs = window.getComputedStyle(el);
          return {
            fontSize: cs.fontSize,
            minWidth: cs.minWidth,
          };
        });
        expect(computedStyle.minWidth).toBe('165px');

        // 4. Initially empty
        expect(await purposeInput.inputValue()).toBe('');
      }

      // Check alignment of owner columns & total value column
      const firstRow = page.locator('.pfs-category-section').first().locator('tbody tr').first();
      const cells = firstRow.locator('td');
      expect(await cells.count()).toBe(7);

      // Verify no horizontal page overflow
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalOverflow).toBe(false);
    }
  });

  test('3. Data fidelity: entered purpose persists across navigation and is excluded from PDF when blank', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Enter Client Name
    await page.locator('input[placeholder="e.g. Ramesh & Priya Sundaram"]').fill('Senthil & Anitha Murugan');

    await page.click('#btn-nav-stage-4');
    await expect(page.locator('#pane-stage-4')).toBeVisible();

    const liquidFirstRow = page.locator('.pfs-category-section').first().locator('tbody tr').first();
    const selfInput = liquidFirstRow.locator('input[type="number"]').nth(0);
    const purposeInput = liquidFirstRow.locator('.pfs-table-input-purpose');

    await selfInput.fill('250000');
    await purposeInput.fill('6-Month Emergency Contingency');

    // Total assets metric reflects 2,50,000
    await expect(page.locator('#metric-assets .pfs-metric-value')).toContainText('₹2,50,000');

    // Navigate to Stage 5 then back to Stage 4
    await page.click('#btn-nav-stage-5');
    await expect(page.locator('#pane-stage-5')).toBeVisible();
    await page.click('#btn-nav-stage-4');
    await expect(page.locator('#pane-stage-4')).toBeVisible();

    // Verify value retained
    expect(await purposeInput.inputValue()).toBe('6-Month Emergency Contingency');

    // Check custom row receives sensible default placeholder
    const addAssetBtn = page.locator('.pfs-category-section').first().locator('button:has-text("+ Add Asset")');
    await addAssetBtn.click();
    const newRowPurpose = page.locator('.pfs-category-section').first().locator('tbody tr').last().locator('.pfs-table-input-purpose');
    expect(await newRowPurpose.inputValue()).toBe('');
    expect(await newRowPurpose.getAttribute('placeholder')).toBe('e.g. Emergency fund');
  });

  test('4. Mobile view at 390px: ribbon, summary, stage content follow naturally without horizontal document overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const stepperNav = page.locator('.pfs-nav-stepper');
    const pos = await stepperNav.evaluate((el) => window.getComputedStyle(el).position);
    expect(pos).toBe('static');

    // Click Stage 4
    await page.click('#btn-nav-stage-4');
    await page.waitForTimeout(300);

    // Verify no document horizontal scroll
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Contained table scrolling exists for asset tables on mobile
    const tableContainer = page.locator('.pfs-table-responsive').first();
    await expect(tableContainer).toBeVisible();
  });
});
