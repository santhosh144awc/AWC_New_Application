import { test, expect } from '@playwright/test';

test.describe('Phase 49 — Personal Finance Statement: Stage Navigation, Unified Expense Entry Modes and Asset Purpose Guidance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health-check/real-statement/');
    await page.waitForSelector('.pfs-meta-section');
  });

  test('1. Stage-Transition Navigation: Smooth coordinated scroll to destination stage heading beneath sticky navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const header = page.locator('.site-header');
    const stepperNav = page.locator('.pfs-nav-stepper');
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    const headerHeight = headerBox!.height;

    // Scroll past client metadata so stepper enters sticky state
    const absoluteStepperTop = await page.evaluate(() => {
      const el = document.querySelector('.pfs-nav-stepper');
      return el ? el.getBoundingClientRect().top + window.pageYOffset : 680;
    });
    await page.evaluate((targetY) => window.scrollTo(0, targetY), absoluteStepperTop - headerHeight + 250);
    await page.waitForTimeout(150);

    const scrolledNavBox = await stepperNav.boundingBox();
    expect(scrolledNavBox).not.toBeNull();
    // Stepper is sticky below header
    expect(Math.abs(scrolledNavBox!.y - headerHeight)).toBeLessThanOrEqual(5);

    // Stage 1 -> Stage 2 via Continue button
    await page.click('#btn-stage-1-next');
    await expect(page.locator('#pane-stage-2')).toBeVisible();
    await page.waitForTimeout(300);

    // Verify stage 2 is highlighted in sticky stepper
    await expect(page.locator('#btn-nav-stage-2')).toHaveClass(/active/);
    await expect(page.locator('#btn-nav-stage-1')).toHaveClass(/completed/);

    // Verify Stage 2 heading is visible and positioned cleanly below sticky stepper
    const stage2Heading = page.locator('#stage-2-heading');
    await expect(stage2Heading).toBeVisible();
    const stage2HeadingBox = await stage2Heading.boundingBox();
    const currentNavBox = await stepperNav.boundingBox();
    expect(stage2HeadingBox!.y).toBeGreaterThan(currentNavBox!.y + currentNavBox!.height);

    // Stage 2 -> Stage 3 via Continue button
    await page.click('#btn-stage-2-next');
    await expect(page.locator('#pane-stage-3')).toBeVisible();
    await page.waitForTimeout(400);

    await expect(page.locator('#btn-nav-stage-3')).toHaveClass(/active/);
    const stage3Heading = page.locator('#stage-3-heading');
    await expect(stage3Heading).toBeVisible();
    const stage3HeadingBox = await stage3Heading.boundingBox();
    const updatedNavBox3 = await stepperNav.boundingBox();
    expect(stage3HeadingBox!.y).toBeGreaterThan(updatedNavBox3!.y + updatedNavBox3!.height);

    // Stage 3 -> Back to Stage 2 via Back button
    const backToS2Btn = page.locator('#pane-stage-3 .pfs-stage-footer-actions button').first();
    await backToS2Btn.click();
    await expect(page.locator('#pane-stage-2')).toBeVisible();
    await page.waitForTimeout(400);

    await expect(page.locator('#btn-nav-stage-2')).toHaveClass(/active/);
    const stage2HeadingAgain = page.locator('#stage-2-heading');
    await expect(stage2HeadingAgain).toBeVisible();
    const stage2HeadingAgainBox = await stage2HeadingAgain.boundingBox();
    const updatedNavBox2 = await stepperNav.boundingBox();
    expect(stage2HeadingAgainBox!.y).toBeGreaterThan(updatedNavBox2!.y + updatedNavBox2!.height);

    // Direct stepper selection to Stage 4 (Assets)
    await page.click('#btn-nav-stage-4');
    await expect(page.locator('#pane-stage-4')).toBeVisible();
    await page.waitForTimeout(400);

    await expect(page.locator('#btn-nav-stage-4')).toHaveClass(/active/);
    const stage4Heading = page.locator('#stage-4-heading');
    await expect(stage4Heading).toBeVisible();
    const stage4HeadingBox = await stage4Heading.boundingBox();
    const updatedNavBox4 = await stepperNav.boundingBox();
    expect(stage4HeadingBox!.y).toBeGreaterThan(updatedNavBox4!.y + updatedNavBox4!.height);

    // Direct stepper selection to Stage 5 (Liabilities)
    await page.click('#btn-nav-stage-5');
    await expect(page.locator('#pane-stage-5')).toBeVisible();
    await page.waitForTimeout(400);

    await expect(page.locator('#btn-nav-stage-5')).toHaveClass(/active/);
    const stage5Heading = page.locator('#stage-5-heading');
    await expect(stage5Heading).toBeVisible();
    const stage5HeadingBox = await stage5Heading.boundingBox();
    const updatedNavBox5 = await stepperNav.boundingBox();
    expect(stage5HeadingBox!.y).toBeGreaterThan(updatedNavBox5!.y + updatedNavBox5!.height);

    // Direct stepper selection to Stage 6 (Net Worth & Review)
    await page.click('#btn-nav-stage-6');
    await expect(page.locator('#pane-stage-6')).toBeVisible();
    await page.waitForTimeout(400);

    await expect(page.locator('#btn-nav-stage-6')).toHaveClass(/active/);
    const stage6Heading = page.locator('#stage-6-heading');
    await expect(stage6Heading).toBeVisible();
    const stage6HeadingBox = await stage6Heading.boundingBox();
    const updatedNavBox6 = await stepperNav.boundingBox();
    expect(stage6HeadingBox!.y).toBeGreaterThan(updatedNavBox6!.y + updatedNavBox6!.height);
  });

  test('2. Unified Expense Entry Choice: Labels, Mode A/B absence, and Option 1 (Consolidated Total) calculations', async ({ page }) => {
    await page.click('#btn-nav-stage-2');
    await expect(page.locator('#pane-stage-2')).toBeVisible();

    // Verify Mode A / Mode B labels are completely absent from user-facing controls
    const paneText = await page.locator('#pane-stage-2').innerText();
    expect(paneText).not.toContain('Mode A');
    expect(paneText).not.toContain('Mode B');

    // Verify the two choice buttons and their exact human-readable labels & descriptions
    const consolidatedChoiceBtn = page.locator('#btn-consolidated-expenses');
    const categoryChoiceBtn = page.locator('#btn-category-expenses');
    await expect(consolidatedChoiceBtn).toBeVisible();
    await expect(categoryChoiceBtn).toBeVisible();

    await expect(consolidatedChoiceBtn).toContainText('Enter total monthly expenses');
    await expect(consolidatedChoiceBtn).toContainText('Enter one combined monthly amount for all family expenses.');
    await expect(categoryChoiceBtn).toContainText('Break down expenses by category');
    await expect(categoryChoiceBtn).toContainText('Enter individual expenses to see how spending is distributed.');

    // Default mode is Category Breakdown: all 5 sections visible
    await expect(categoryChoiceBtn).toHaveClass(/active/);
    await expect(page.locator('#cat-section-household')).toBeVisible();
    await expect(page.locator('#cat-section-lifestyle')).toBeVisible();
    await expect(page.locator('#cat-section-dependent')).toBeVisible();
    await expect(page.locator('#cat-section-insurance')).toBeVisible();
    await expect(page.locator('#cat-section-loan_emi')).toBeVisible();

    // Switch to Option 1: Enter total monthly expenses
    await consolidatedChoiceBtn.click();
    await expect(consolidatedChoiceBtn).toHaveClass(/active/);
    await expect(categoryChoiceBtn).not.toHaveClass(/active/);

    // Consolidated container is visible, and all 5 detailed categories are completely HIDDEN
    await expect(page.locator('#consolidated-expenses-container')).toBeVisible();
    await expect(page.locator('#cat-section-household')).toHaveCount(0);
    await expect(page.locator('#cat-section-lifestyle')).toHaveCount(0);
    await expect(page.locator('#cat-section-dependent')).toHaveCount(0);
    await expect(page.locator('#cat-section-insurance')).toHaveCount(0);
    await expect(page.locator('#cat-section-loan_emi')).toHaveCount(0);

    // Enter ₹60,000 monthly
    const consolidatedInput = page.locator('#pane-stage-2 input[type="number"]');
    await consolidatedInput.fill('60000');

    // Verify annual calculation: 60,000 * 12 = 7,20,000
    const liveExpenseMetric = page.locator('#metric-expenses');
    await expect(liveExpenseMetric).toContainText('₹7,20,000');
    await expect(liveExpenseMetric).toContainText('Monthly: ₹60,000');

    const totalExpenseCard = page.locator('.pfs-total-summary-card');
    await expect(totalExpenseCard).toContainText('₹7,20,000');
    await expect(totalExpenseCard).toContainText('₹60,000 / month');
  });

  test('3. Option 2 (Category Breakdown): Preserves line items, frequencies, and prevents double counting when switching', async ({ page }) => {
    await page.click('#btn-nav-stage-2');
    await expect(page.locator('#pane-stage-2')).toBeVisible();

    // In Category mode, enter items into Household (₹30,000/mo) and Lifestyle (₹10,000/mo)
    const hhInput = page.locator('#cat-section-household tbody input[type="number"]').first();
    await hhInput.fill('30000'); // 360,000/yr

    const lifeInput = page.locator('#cat-section-lifestyle tbody input[type="number"]').first();
    await lifeInput.fill('10000'); // 120,000/yr

    // Category subtotal & total: 360,000 + 120,000 = 480,000
    const liveExpenseMetric = page.locator('#metric-expenses');
    await expect(liveExpenseMetric).toContainText('₹4,80,000');
    await expect(liveExpenseMetric).toContainText('Monthly: ₹40,000');

    // Switch to Consolidated Total
    await page.click('#btn-consolidated-expenses');
    const consolidatedInput = page.locator('#pane-stage-2 input[type="number"]');
    await consolidatedInput.fill('60000'); // 720,000/yr

    // In consolidated mode, total should be EXACTLY 7,20,000 (NOT 720k + 480k)
    await expect(liveExpenseMetric).toContainText('₹7,20,000');

    // Switch back to Category Breakdown: previously entered values in memory are restored and consolidated total is excluded
    await page.click('#btn-category-expenses');
    await expect(page.locator('#cat-section-household')).toBeVisible();
    await expect(liveExpenseMetric).toContainText('₹4,80,000');

    const restoredHhVal = await page.locator('#cat-section-household tbody input[type="number"]').first().inputValue();
    expect(restoredHhVal).toBe('30000');
  });

  test('4. Asset Purpose / Goal Field Guidance: Blank initial values, helpful placeholders, and guidance note', async ({ page }) => {
    await page.click('#btn-nav-stage-4');
    await expect(page.locator('#pane-stage-4')).toBeVisible();

    // Guidance banner is present
    const guidanceBanner = page.locator('#asset-purpose-guidance-banner');
    await expect(guidanceBanner).toBeVisible();
    await expect(guidanceBanner).toContainText('Optional: note the intended purpose of this holding');

    // Check placeholders across asset classes
    // Liquid Assets table
    const liquidFirstRowGoal = page.locator('.pfs-category-section').nth(0).locator('tbody tr').first().locator('input[type="text"]').nth(1);
    expect(await liquidFirstRowGoal.inputValue()).toBe('');
    expect(await liquidFirstRowGoal.getAttribute('placeholder')).toBe('e.g., Emergency fund');

    // Debt Assets table
    const debtFirstRowGoal = page.locator('.pfs-category-section').nth(1).locator('tbody tr').first().locator('input[type="text"]').nth(1);
    expect(await debtFirstRowGoal.inputValue()).toBe('');
    expect(await debtFirstRowGoal.getAttribute('placeholder')).toBe("e.g., Child's education");

    // Equity Assets table
    const equityFirstRowGoal = page.locator('.pfs-category-section').nth(2).locator('tbody tr').first().locator('input[type="text"]').nth(1);
    expect(await equityFirstRowGoal.inputValue()).toBe('');
    expect(await equityFirstRowGoal.getAttribute('placeholder')).toBe('e.g., Retirement');

    // Gold Assets table
    const goldFirstRowGoal = page.locator('.pfs-category-section').nth(3).locator('tbody tr').first().locator('input[type="text"]').nth(1);
    expect(await goldFirstRowGoal.inputValue()).toBe('');
    expect(await goldFirstRowGoal.getAttribute('placeholder')).toBe('e.g., Long-term goal');

    // Real Estate Assets table
    const realEstateFirstRowGoal = page.locator('.pfs-category-section').nth(4).locator('tbody tr').first().locator('input[type="text"]').nth(1);
    expect(await realEstateFirstRowGoal.inputValue()).toBe('');
    expect(await realEstateFirstRowGoal.getAttribute('placeholder')).toBe('e.g., Home purchase or rental income');

    // Personal Assets table
    const personalFirstRowGoal = page.locator('.pfs-category-section').nth(5).locator('tbody tr').first().locator('input[type="text"]').nth(1);
    expect(await personalFirstRowGoal.inputValue()).toBe('');
    expect(await personalFirstRowGoal.getAttribute('placeholder')).toBe('e.g., Family use');

    // Enter custom purpose into equity row and verify value updates without overwriting placeholder
    await equityFirstRowGoal.fill('Higher Studies 2032');
    expect(await equityFirstRowGoal.inputValue()).toBe('Higher Studies 2032');
  });

  test('5. PDF Generation and Statement Preview reconciles with active expense entry mode', async ({ page }) => {
    // Fill client name
    await page.locator('input[placeholder="e.g. Ramesh & Priya Sundaram"]').fill('Kavitha & Suresh Narayanan');

    // Set consolidated expenses
    await page.click('#btn-nav-stage-2');
    await page.click('#btn-consolidated-expenses');
    await page.locator('#pane-stage-2 input[type="number"]').fill('75000'); // 900,000/yr

    // Go to Stage 6
    await page.click('#btn-nav-stage-6');
    await expect(page.locator('#pane-stage-6')).toBeVisible();

    // Open Statement Preview modal
    await page.click('#btn-preview-statement');
    const previewModal = page.locator('.pfs-preview-modal-box');
    await expect(previewModal).toBeVisible();

    // Verify Expense row in preview reflects Consolidated Total
    await expect(previewModal).toContainText('Consolidated Total');
    await expect(previewModal).toContainText('₹9,00,000');
    await expect(previewModal).toContainText('₹75,000');

    // Close preview
    await page.click('.pfs-btn-close-modal');

    // Download PDF and verify download event
    const downloadPromise = page.waitForEvent('download');
    await page.click('#btn-download-pdf');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^Personal-Finance-Statement-.*-\d{2}-\d{2}-\d{4}\.pdf$/);
    expect(download.suggestedFilename()).toContain('Kavitha');
    expect(download.suggestedFilename()).toContain('Suresh');
  });

  test('6. Responsive containment and mobile navigation at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(392);

    // Verify stage 2 options at 390px
    await page.click('#btn-nav-stage-2');
    await expect(page.locator('#pane-stage-2')).toBeVisible();

    await expect(page.locator('#btn-consolidated-expenses')).toBeVisible();
    await expect(page.locator('#btn-category-expenses')).toBeVisible();

    const mobileScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(mobileScrollWidth).toBeLessThanOrEqual(392);
  });
});
