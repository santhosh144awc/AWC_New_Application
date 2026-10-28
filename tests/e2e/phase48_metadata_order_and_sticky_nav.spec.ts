import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Phase 48 — Personal Finance Statement: Metadata Order, Sticky Stage Navigation and Clean Workspace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health-check/real-statement/');
  });

  test('1. Layout & Ordering: Client Info -> Stepper Nav -> Financial Summary -> Active Stage Pane', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const clientMeta = page.locator('.pfs-meta-section');
    const stepperNav = page.locator('.pfs-nav-stepper');
    const summaryBar = page.locator('.pfs-live-bar');
    const stageCanvas = page.locator('.pfs-stage-canvas');

    await expect(clientMeta).toBeVisible();
    await expect(stepperNav).toBeVisible();
    await expect(summaryBar).toBeVisible();
    await expect(stageCanvas).toBeVisible();

    const metaBox = await clientMeta.boundingBox();
    const navBox = await stepperNav.boundingBox();
    const summaryBox = await summaryBar.boundingBox();
    const canvasBox = await stageCanvas.boundingBox();

    expect(metaBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(summaryBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();

    // Verify vertical order: meta < nav < summary < canvas
    expect(metaBox!.y).toBeLessThan(navBox!.y);
    expect(navBox!.y).toBeLessThan(summaryBox!.y);
    expect(summaryBox!.y).toBeLessThan(canvasBox!.y);
  });

  test('2. Clean Workspace: Load Sample Data button and Statement Date input are absent from production UI; Prepared By is non-editable info', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // Load Sample Data button must NOT exist
    const loadSampleBtn = page.locator('#btn-load-sample');
    await expect(loadSampleBtn).toHaveCount(0);

    // Statement Date datepicker input must NOT exist
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toHaveCount(0);

    // Prepared By must appear as non-editable text "Prepared by: C. Santhosh Sathriyan"
    const preparerInfo = page.locator('#pfs-preparer-info');
    await expect(preparerInfo).toBeVisible();
    await expect(preparerInfo).toContainText('Prepared by: C. Santhosh Sathriyan');

    // Confirm it is not an editable input
    const preparerInput = page.locator('input[name*="preparer"], input[id*="preparedBy"]');
    await expect(preparerInput).toHaveCount(0);
  });

  test('3. Reset Statement restores clean initial state, local date internally, and resets to Stage 1', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // Fill in client name
    const clientInput = page.locator('input[placeholder="e.g. Ramesh & Priya Sundaram"]');
    await clientInput.fill('Anand & Meera Sharma');
    await page.locator('input[placeholder="e.g. Priya"]').fill('Meera');
    await page.locator('input[placeholder="e.g. Ananya, Aarav"]').fill('Kavya');

    // Enter income in Stage 1
    const firstRow = page.locator('#table-income tbody tr').nth(0);
    await firstRow.locator('input[data-field="monthly-gross"]').fill('150000');
    await expect(page.locator('#metric-income .pfs-metric-value')).toContainText('₹18,00,000');

    // Navigate to Stage 2
    await page.click('#btn-nav-stage-2');
    await expect(page.locator('#pane-stage-2')).toBeVisible();

    // Trigger Reset
    await page.click('#btn-start-over');
    await expect(page.locator('#reset-modal-title')).toBeVisible();
    await page.click('#btn-confirm-reset');

    // Verify fields cleared
    await expect(clientInput).toHaveValue('');
    await expect(page.locator('input[placeholder="e.g. Priya"]')).toHaveValue('');
    await expect(page.locator('input[placeholder="e.g. Ananya, Aarav"]')).toHaveValue('');

    // Verify reset returned to Stage 1
    await expect(page.locator('#pane-stage-1')).toBeVisible();

    // Verify summary metrics reset to 0
    await expect(page.locator('#metric-income .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-expenses .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-savings .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-assets .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-liabilities .pfs-metric-value')).toContainText('₹0');
    await expect(page.locator('#metric-networth .pfs-metric-value')).toContainText('₹0');

    // Preparer remains fixed
    await expect(page.locator('#pfs-preparer-info')).toContainText('Prepared by: C. Santhosh Sathriyan');
  });

  test('4. Stepper Navigation: Operates in normal document flow (non-sticky), scrolls away with document, active indicator updates, stage titles remain visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const header = page.locator('.site-header');
    const stepperNav = page.locator('.pfs-nav-stepper');
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    const headerHeight = headerBox!.height;

    // Verify stepper position style is static (non-sticky)
    const positionStyle = await stepperNav.evaluate((el) => window.getComputedStyle(el).position);
    expect(positionStyle).toBe('static');

    const initialNavBox = await stepperNav.boundingBox();
    expect(initialNavBox).not.toBeNull();

    // Scroll down well past the stepper
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(150);

    const scrolledNavBox = await stepperNav.boundingBox();
    expect(scrolledNavBox).not.toBeNull();

    // Stepper must scroll away with the document and NOT stick to top/header
    expect(scrolledNavBox!.y).toBeLessThan(initialNavBox!.y);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);

    // Stage 1 active indicator
    const stage1Btn = page.locator('#btn-nav-stage-1');
    await expect(stage1Btn).toHaveClass(/active/);

    // Click Continue to Stage 2
    await page.click('#btn-stage-1-next');
    await expect(page.locator('#pane-stage-2')).toBeVisible();
    await page.waitForTimeout(200);

    // Active updated to Stage 2
    const stage2Btn = page.locator('#btn-nav-stage-2');
    await expect(stage2Btn).toHaveClass(/active/);
    await expect(stage1Btn).toHaveClass(/completed/);

    // Check Stage 2 pane title is visible and not obscured by site header
    const stage2Title = page.locator('#stage-2-heading');
    await expect(stage2Title).toBeVisible();
    const stage2TitleBox = await stage2Title.boundingBox();
    expect(stage2TitleBox!.y).toBeGreaterThanOrEqual(headerHeight);

    // Direct click to Stage 6
    await page.click('#btn-nav-stage-6');
    await expect(page.locator('#pane-stage-6')).toBeVisible();
    await page.waitForTimeout(200);

    const stage6Btn = page.locator('#btn-nav-stage-6');
    await expect(stage6Btn).toHaveClass(/active/);
    const stage6Title = page.locator('#stage-6-heading');
    await expect(stage6Title).toBeVisible();
    const stage6TitleBox = await stage6Title.boundingBox();
    expect(stage6TitleBox!.y).toBeGreaterThanOrEqual(headerHeight);
  });

  test('5. PDF Generation & Statement Preview: Correct Indian date, fixed preparer, and client-labelled filename', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const indianDateStr = `${d}-${m}-${y}`;

    // Fill Client Name
    await page.locator('input[placeholder="e.g. Ramesh & Priya Sundaram"]').fill('Vikram & Sneha Varma');

    // Go to Stage 6
    await page.click('#btn-nav-stage-6');
    await expect(page.locator('#pane-stage-6')).toBeVisible();

    // Open Statement Preview
    await page.click('#btn-preview-statement');
    const previewModal = page.locator('.pfs-preview-modal-box');
    await expect(previewModal).toBeVisible();

    // Verify Indian date format and preparer in preview modal
    const metaLine = page.locator('.pfs-preview-meta-line');
    await expect(metaLine).toContainText('Prepared by C. Santhosh Sathriyan');
    await expect(metaLine).toContainText(`Date: ${indianDateStr}`);

    // Verify PDF download
    const downloadPromise = page.waitForEvent('download');
    await page.click('#btn-preview-download-pdf');
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    expect(filename).toBe(`Personal-Finance-Statement-Vikram___Sneha_Varma-${indianDateStr}.pdf`);

    const tempDir = path.join(process.cwd(), 'test-results', 'temp-phase48');
    fs.mkdirSync(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, filename);
    await download.saveAs(tempPath);
    expect(fs.existsSync(tempPath)).toBe(true);
    expect(fs.statSync(tempPath).size).toBeGreaterThan(5000);
    fs.unlinkSync(tempPath);
  });

  test('6. Responsive containment and mobile view: No horizontal page overflow at 1440px, 1280px, and 390px', async ({ page }) => {
    for (const width of [1440, 1280, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(100);

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 2);

      // Verify all 6 stages present in stepper
      const stepButtons = page.locator('.pfs-step-btn');
      await expect(stepButtons).toHaveCount(6);
    }
  });
});
