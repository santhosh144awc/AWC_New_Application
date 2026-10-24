import { test, expect } from '@playwright/test';

test.describe('Phase 9 — Advanced SIP Growth Simulator (/tools/sip-growth/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/sip-growth/');
    await page.waitForSelector('astro-island:not([ssr])');
  });

  test('correct route and active simulator shell with no obsolete reverse solver copy', async ({ page }) => {
    await expect(page).toHaveTitle(/Advanced SIP Growth/);
    const h1 = page.locator('h1');
    await expect(h1).toHaveText(/Explore how your investments could grow over time|Advanced SIP Growth Simulator/);

    // Verify obsolete target-corpus solver copy is removed
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Reverse calculate the required monthly SIP');
    expect(bodyText).not.toContain('Target Corpus Reverse Calculation Engine');
    expect(bodyText).not.toContain('GATE-B (Rate Semantics & Annuity Formula Verification)');

    // Verify calculator island is mounted
    const app = page.locator('#sip-growth-calculator-app');
    await expect(app).toBeVisible();
    await expect(page.locator('#growth-final-corpus')).toBeVisible();
  });

  test('renders default calculation and displays primary metric hierarchy', async ({ page }) => {
    // Default: ₹10,000 monthly SIP, 10 years SIP, 10% step-up for 5 years, 12% return, 5 post-SIP years, 1 lump sum (₹1,00,000)
    const finalCorpus = page.locator('#growth-final-corpus');
    await expect(finalCorpus).toBeVisible();
    const corpusText = await finalCorpus.textContent();
    expect(corpusText).toMatch(/₹[0-9,]+/);

    // Contributed vs growth breakdown
    await expect(page.locator('#growth-total-invested')).toBeVisible();
    await expect(page.locator('#growth-total-gain')).toBeVisible();
    await expect(page.locator('#growth-multiplier')).toBeVisible();
    await expect(page.locator('.distribution-bar')).toBeVisible();
  });

  test('synchronized numeric and range inputs work reciprocally', async ({ page }) => {
    const sipInput = page.locator('#growth-monthly-num');
    const sipSlider = page.locator('#growth-monthly-slider');

    await expect(sipInput).toHaveValue('10000');
    await expect(sipSlider).toHaveValue('10000');

    // Change numeric input
    await sipInput.fill('25000');
    await expect(sipSlider).toHaveValue('25000');

    // Change slider
    await sipSlider.fill('15000');
    await expect(sipInput).toHaveValue('15000');
  });

  test('adds, edits, and removes one-time investment rows dynamically', async ({ page }) => {
    // Expand advanced options if collapsed
    const advToggle = page.locator('#toggle-advanced-options-btn');
    if (await advToggle.isVisible() && (await advToggle.getAttribute('aria-expanded')) === 'false') {
      await advToggle.click();
    }

    const addBtn = page.locator('#add-lumpsum-row-btn');
    await expect(addBtn).toBeVisible();

    // Default has 1 initial lump sum row
    await expect(page.locator('.lumpsum-row-card')).toHaveCount(1);

    // Remove the default row -> empty state is displayed
    await page.locator('.lumpsum-row-card .btn-remove-row').click();
    await expect(page.locator('.lumpsum-row-card')).toHaveCount(0);
    const emptyNotice = page.locator('.empty-lumpsums-box');
    await expect(emptyNotice).toBeVisible();
    await expect(emptyNotice).toContainText('No one-time capital additions scheduled');

    // Add first lump sum
    await addBtn.click();
    await expect(emptyNotice).not.toBeVisible();
    const row0 = page.locator('.lumpsum-row-card').nth(0);
    await expect(row0).toBeVisible();

    // Fill row 0: ₹1,00,000 in Year 3
    const amountInput0 = row0.locator('input[type="number"]');
    const yearSelect0 = row0.locator('select');
    await amountInput0.fill('100000');
    await yearSelect0.selectOption('3');

    // Check that total invested includes ₹1,00,000 lump sum
    await expect(page.locator('.metric-sub').first()).toContainText('₹1.00 L Lump Sum');

    // Add second lump sum
    await addBtn.click();
    const row1 = page.locator('.lumpsum-row-card').nth(1);
    await expect(row1).toBeVisible();
    const amountInput1 = row1.locator('input[type="number"]');
    const yearSelect1 = row1.locator('select');
    await amountInput1.fill('50000');
    await yearSelect1.selectOption('5');

    // Total lump sums should now reflect ₹1.50 L
    await expect(page.locator('.metric-sub').first()).toContainText('₹1.50 L Lump Sum');

    // Remove first row
    const deleteBtn0 = row0.locator('.btn-remove-row');
    await deleteBtn0.click();

    // Now only one row remains, total lump sum is ₹50,000 (₹50.0 K)
    await expect(page.locator('.lumpsum-row-card')).toHaveCount(1);
    await expect(page.locator('.metric-sub').first()).toContainText('₹50.0 K Lump Sum');

    // Remove remaining row -> empty state returns
    await page.locator('.lumpsum-row-card .btn-remove-row').click();
    await expect(emptyNotice).toBeVisible();
  });

  test('displays clear one-time investment timing explanation and post-SIP holding explanation', async ({ page }) => {
    // Expand advanced options if collapsed
    const advToggle = page.locator('#toggle-advanced-options-btn');
    if (await advToggle.isVisible() && (await advToggle.getAttribute('aria-expanded')) === 'false') {
      await advToggle.click();
    }

    // Timing notice in lump sums section
    const timingNotice = page.locator('.timing-notice');
    await expect(timingNotice).toBeVisible();
    await expect(timingNotice).toContainText('Each one-time investment is assumed to be added at the beginning of the selected projection year');
    await expect(timingNotice).toContainText('Lump sums scheduled in post-SIP holding years continue compounding');

    // Educational section
    const educationalHeading = page.locator('#insight-heading');
    await expect(educationalHeading).toBeVisible();
    await expect(educationalHeading).toContainText('Why Advanced Life-Stage Simulation Matters');

    // Check strategy cards
    const cards = page.locator('.feature-card');
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText('Capped Step-Up Horizons');
    await expect(cards.nth(1)).toContainText('Milestone Lump-Sum Infusions');
    await expect(cards.nth(2)).toContainText('Post-SIP Wealth Compounding');
  });

  test('zero-return scenario yields final corpus equal to total contributions exactly', async ({ page }) => {
    // Return input
    const returnInput = page.locator('#growth-return-num');
    await returnInput.fill('0');

    // Growth must be exactly ₹0
    await expect(page.locator('#growth-total-gain')).toContainText('₹0');

    // Total invested must equal final corpus
    const investedText = await page.locator('#growth-total-invested').textContent();
    const corpusText = await page.locator('#growth-final-corpus').textContent();
    expect(corpusText?.trim()).toBe(investedText?.trim());
  });

  test('supports post-SIP holding period and enables one-time investments during holding years', async ({ page }) => {
    // Expand advanced options
    const advToggle = page.locator('#toggle-advanced-options-btn');
    if (await advToggle.isVisible() && (await advToggle.getAttribute('aria-expanded')) === 'false') {
      await advToggle.click();
    }

    // Post-SIP input
    const postSipInput = page.locator('#growth-postsip-num');
    await postSipInput.fill('5'); // SIP 10y + 5y post-SIP = 15 years total

    // In the default lump-sum row (or after adding one), select Year 12
    const row = page.locator('.lumpsum-row-card').nth(0);
    const select = row.locator('select');

    // Verify option 12 exists with (Holding Period)
    await select.selectOption('12');
    await expect(select).toHaveValue('12');

    // Check horizon pill mentions 10y Active SIP + 5y Post-SIP Holding
    const horizonPill = page.locator('.horizon-pill');
    await expect(horizonPill).toContainText('10y Active SIP + 5y Post-SIP Holding');
  });

  test('step-up cap constrains increase years to no greater than SIP duration', async ({ page }) => {
    // Expand advanced options
    const advToggle = page.locator('#toggle-advanced-options-btn');
    if (await advToggle.isVisible() && (await advToggle.getAttribute('aria-expanded')) === 'false') {
      await advToggle.click();
    }

    const sipDurationInput = page.locator('#growth-sipyears-num');
    const capInput = page.locator('#growth-stepupdur-num');

    // Set SIP duration to 5 years
    await sipDurationInput.fill('5');

    // Try setting step-up cap to 8 years -> validation error
    await capInput.fill('8');
    const invalidNotice = page.locator('.unavailable-card, .inline-error, .invalid-state-box, .field-error');
    await expect(invalidNotice.first()).toBeVisible();

    // Fix cap to 5 years -> error clears
    await capInput.fill('5');
    await expect(page.locator('#growth-final-corpus')).toBeVisible();
  });

  test('collapsible yearly breakdown expands, collapses, and reconciles totals', async ({ page }) => {
    const toggleSchedule = page.locator('#toggle-sip-growth-schedule-btn');
    await expect(toggleSchedule).toBeVisible();
    await expect(toggleSchedule).toHaveAttribute('aria-expanded', 'false');

    // Table should not be visible initially
    await expect(page.locator('#growth-schedule-table')).not.toBeVisible();

    // Expand
    await toggleSchedule.click();
    await expect(toggleSchedule).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#growth-schedule-table')).toBeVisible();

    // Check table headers: Year, Opening, SIP, Lump Sum, Total, Growth, Closing, Cumulative Invested
    const ths = page.locator('#growth-schedule-table th');
    await expect(ths).toHaveCount(8);

    // Collapse
    await toggleSchedule.click();
    await expect(toggleSchedule).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#growth-schedule-table')).not.toBeVisible();
  });

  test('reset button restores all inputs and removes added lump-sum rows', async ({ page }) => {
    // Expand advanced options
    const advToggle = page.locator('#toggle-advanced-options-btn');
    if (await advToggle.isVisible() && (await advToggle.getAttribute('aria-expanded')) === 'false') {
      await advToggle.click();
    }

    // Change inputs and add row
    const sipInput = page.locator('#growth-monthly-num');
    await sipInput.fill('35000');
    await page.locator('#add-lumpsum-row-btn').click();

    await expect(page.locator('.lumpsum-row-card')).toHaveCount(2);

    // Click Reset
    await page.locator('#reset-sip-growth-btn').click();

    // Defaults restored
    await expect(sipInput).toHaveValue('10000');
    // After reset, advanced options are collapsed by default; when expanded again, 1 default row remains
    await advToggle.click();
    await expect(page.locator('.lumpsum-row-card')).toHaveCount(1);
  });

  test('no privacy leakage to storage or URL parameters', async ({ page }) => {
    // Expand advanced options
    const advToggle = page.locator('#toggle-advanced-options-btn');
    if (await advToggle.isVisible() && (await advToggle.getAttribute('aria-expanded')) === 'false') {
      await advToggle.click();
    }

    // Fill distinct amounts
    const sipInput = page.locator('#growth-monthly-num');
    await sipInput.fill('88888');

    const lumpInput = page.locator('.lumpsum-row-card input[type="number"]').first();
    await lumpInput.fill('77777');

    // 1. Verify URL has no query parameters
    const url = new URL(page.url());
    expect(url.search).toBe('');

    // 2. Verify localStorage has no financial keys or values
    const localStorageData = await page.evaluate(() => JSON.stringify(window.localStorage));
    expect(localStorageData).not.toContain('88888');
    expect(localStorageData).not.toContain('77777');

    // 3. Verify sessionStorage is empty
    const sessionStorageData = await page.evaluate(() => JSON.stringify(window.sessionStorage));
    expect(sessionStorageData).not.toContain('88888');
    expect(sessionStorageData).not.toContain('77777');
  });

  test('mobile responsive viewports (360px and 390px) have no horizontal overflow', async ({ page }) => {
    const viewports = [
      { width: 360, height: 740 },
      { width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/tools/sip-growth/');

      // Check document scroll width does not exceed client width
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalOverflow, `Viewport ${vp.width}x${vp.height} should not overflow horizontally`).toBe(false);

      // Verify calculator is visible and responsive
      await expect(page.locator('#sip-growth-calculator-app')).toBeVisible();
      await expect(page.locator('#sip-growth-mobile-headline-val, #growth-final-corpus').first()).toBeVisible();
    }
  });

  test('keyboard accessibility for add/delete buttons and form controls', async ({ page }) => {
    // Expand advanced options
    const advToggle = page.locator('#toggle-advanced-options-btn');
    if (await advToggle.isVisible() && (await advToggle.getAttribute('aria-expanded')) === 'false') {
      await advToggle.click();
    }

    const addBtn = page.locator('#add-lumpsum-row-btn');
    await addBtn.focus();
    await page.keyboard.press('Enter');

    // A second row should now exist (default 1 + 1 new = 2)
    await expect(page.locator('.lumpsum-row-card')).toHaveCount(2);

    const deleteBtn = page.locator('.lumpsum-row-card').nth(1).locator('.btn-remove-row');
    await deleteBtn.focus();
    await page.keyboard.press('Enter');

    // Row count returns to 1
    await expect(page.locator('.lumpsum-row-card')).toHaveCount(1);
  });
});
