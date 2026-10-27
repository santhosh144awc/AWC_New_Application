import { test } from '@playwright/test';

test.describe('Capture Visual Screenshots for Personal Finance Statement', () => {
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    test(`Capture all stages on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/health-check/real-statement/');

      // Stage 1: Income
      await page.screenshot({
        path: `tests/e2e/screenshots/pfs_stage1_income_${vp.name}.png`,
        fullPage: false,
      });

      // Stage 2: Expenses (Mode B Itemized)
      await page.click('#btn-nav-stage-2');
      await page.screenshot({
        path: `tests/e2e/screenshots/pfs_stage2_expenses_mode_b_${vp.name}.png`,
        fullPage: false,
      });

      // Stage 2: Expenses (Mode A Total)
      await page.click('#btn-mode-a');
      await page.screenshot({
        path: `tests/e2e/screenshots/pfs_stage2_expenses_mode_a_${vp.name}.png`,
        fullPage: false,
      });

      // Stage 3: Savings & Surplus
      await page.click('#btn-nav-stage-3');
      await page.screenshot({
        path: `tests/e2e/screenshots/pfs_stage3_savings_${vp.name}.png`,
        fullPage: false,
      });

      // Stage 4: Assets
      await page.click('#btn-nav-stage-4');
      await page.screenshot({
        path: `tests/e2e/screenshots/pfs_stage4_assets_${vp.name}.png`,
        fullPage: false,
      });

      // Stage 5: Liabilities
      await page.click('#btn-nav-stage-5');
      await page.screenshot({
        path: `tests/e2e/screenshots/pfs_stage5_liabilities_${vp.name}.png`,
        fullPage: false,
      });

      // Stage 6: Net Worth & Final Review
      await page.click('#btn-nav-stage-6');
      await page.screenshot({
        path: `tests/e2e/screenshots/pfs_stage6_networth_review_${vp.name}.png`,
        fullPage: false,
      });
    });
  }
});
