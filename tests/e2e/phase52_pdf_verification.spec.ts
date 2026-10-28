import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Phase 52: PDF Verification with Fictional Data', () => {
  test('Verify PDF generation, document metadata, client name, fixed preparer and financial schedules', async ({ page }) => {
    await page.goto('/tools/personal-finance-statement/');
    await page.waitForLoadState('networkidle');

    // Populate Client Info using reliable placeholder selectors
    await page.locator('input[placeholder="e.g. Ramesh & Priya Sundaram"]').fill('Rajesh Kumar');
    await page.locator('input[placeholder="e.g. Priya"]').fill('Priya Kumar');
    await page.locator('input[placeholder="e.g. Ananya, Aarav"]').fill('Aarav');

    // Populate Stage 1: Income
    const firstMonthlyGross = page.locator('input[data-field="monthly-gross"]').first();
    await firstMonthlyGross.fill('150000');
    // Ensure sync to annual
    const firstAnnualGross = page.locator('input[data-field="annual-gross"]').first();
    await expect(firstAnnualGross).toHaveValue('1800000');

    // Navigate to Stage 6 (Net Worth & Review)
    // Click on Stage 6 tab in stepper
    const stage6Tab = page.locator('#btn-nav-stage-6');
    await stage6Tab.click();
    await page.waitForTimeout(300);

    // Open Statement Preview Modal
    const previewBtn = page.locator('#btn-preview-statement');
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();

    // Verify Preview Modal Content
    const previewModal = page.locator('.pfs-preview-modal-box');
    await expect(previewModal).toBeVisible();

    // Verify Title, Client Name, Fixed Preparer in Preview
    await expect(previewModal).toContainText('Statement Summary Preview');
    await expect(previewModal).toContainText('Rajesh Kumar');
    await expect(previewModal).toContainText('Prepared by C. Santhosh Sathriyan');
    await expect(previewModal).toContainText('Download PDF Statement');

    // Verify Financial Schedules rendered in Preview
    await expect(previewModal).toContainText('1. Net Annual Inflows');
    await expect(previewModal).toContainText('2. Annual Living Costs');
    await expect(previewModal).toContainText('3. Annual Household Savings');
    await expect(previewModal).toContainText('Actual Net Worth (Excl. Personal)');
    await expect(previewModal).toContainText('Notional Net Worth (Incl. Personal)');

    // Test real PDF download trigger
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btn-preview-download-pdf').click();
    const download = await downloadPromise;

    // Check filename
    const filename = download.suggestedFilename();
    expect(filename).toContain('Personal-Finance-Statement');
    expect(filename).toContain('Rajesh_Kumar');
    expect(filename).toMatch(/\.pdf$/);

    // Save downloaded file for evidence
    const downloadPath = path.resolve('test-results/test-screenshots/phase52', filename);
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBe(true);
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(1000); // Confirms non-empty PDF binary
  });
});
