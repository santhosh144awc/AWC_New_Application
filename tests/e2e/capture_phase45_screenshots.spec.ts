import { test } from '@playwright/test';

test.describe('Phase 45 Visual Screenshot Capture', () => {
  test('capture desktop and mobile screenshots', async ({ page }) => {
    // 1. Initial State Desktop (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/health-check/real-statement/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/phase45_desktop_initial_stage1.png', fullPage: true });

    // 2. Load Sample Data & Capture Stage 1
    await page.click('#btn-load-sample');
    await page.screenshot({ path: 'tests/screenshots/phase45_desktop_sample_stage1.png', fullPage: true });

    // 3. Stage 2 Expenses
    await page.click('#btn-nav-stage-2');
    await page.screenshot({ path: 'tests/screenshots/phase45_desktop_stage2_expenses.png', fullPage: true });

    // 4. Stage 4 Assets
    await page.click('#btn-nav-stage-4');
    await page.screenshot({ path: 'tests/screenshots/phase45_desktop_stage4_assets.png', fullPage: true });

    // 5. Stage 6 Review & Net Worth
    await page.click('#btn-nav-stage-6');
    await page.screenshot({ path: 'tests/screenshots/phase45_desktop_stage6_review.png', fullPage: true });

    // 6. Statement Preview Modal
    await page.click('#btn-preview-statement');
    await page.waitForSelector('.pfs-preview-modal-box');
    await page.screenshot({ path: 'tests/screenshots/phase45_desktop_stage6_preview_modal.png' });
    await page.click('#btn-close-preview');

    // 7. Reset Confirmation Modal
    await page.click('#btn-start-over');
    await page.waitForSelector('.pfs-modal-box');
    await page.screenshot({ path: 'tests/screenshots/phase45_desktop_reset_modal.png' });
    await page.click('#btn-cancel-reset');

    // 8. Mobile 390px Viewport (Initial & Stages)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/health-check/real-statement/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/phase45_mobile_initial_stage1.png', fullPage: true });

    await page.click('#btn-load-sample');
    await page.click('#btn-nav-stage-6');
    await page.screenshot({ path: 'tests/screenshots/phase45_mobile_stage6_review.png', fullPage: true });
  });
});
