import { test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const evidenceDir = path.resolve(__dirname, '../../../product-docs/design-review/phase9-financial-statement/phase9-1-screenshots');
const standardScreenshotsDir = path.resolve(__dirname, 'screenshots');

test.describe('Phase 9.1 Visual Evidence & Screenshot Capture', () => {

  test('Capture Quick Net Worth screenshots (Desktop 1440px, Mobile 390px, Mobile 360px)', async ({ page }) => {
    // 1. Desktop 1440px Loaded
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/net-worth/');
    await page.click('#reset-net-worth-example-btn');
    await page.screenshot({
      path: path.join(evidenceDir, 'net-worth-desktop-1440-loaded.png'),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(standardScreenshotsDir, 'desktop-net-worth.png'),
    });

    // 2. Desktop 1440px with Educational Details Expanded
    await page.click('.worth-details-summary');
    await page.screenshot({
      path: path.join(evidenceDir, 'net-worth-desktop-1440-details-expanded.png'),
      fullPage: true,
    });

    // 3. Mobile 390px Loaded
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/net-worth/');
    await page.click('#reset-net-worth-example-btn');
    await page.screenshot({
      path: path.join(evidenceDir, 'net-worth-mobile-390-loaded.png'),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(standardScreenshotsDir, 'mobile-net-worth.png'),
    });

    // 4. Mobile 360px Loaded
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/net-worth/');
    await page.click('#reset-net-worth-example-btn');
    await page.screenshot({
      path: path.join(evidenceDir, 'net-worth-mobile-360-loaded.png'),
      fullPage: true,
    });
  });

  test('Capture REAL Financial Statement screenshots (Desktop 1440px, Mobile 390px, Mobile 360px)', async ({ page }) => {
    // 1. Desktop 1440px Stage 1
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/health-check/real-statement/');
    await page.click('#load-sample-btn');
    await page.screenshot({
      path: path.join(evidenceDir, 'real-statement-desktop-1440-stage1.png'),
      fullPage: true,
    });

    // 2. Desktop 1440px Stage 4
    await page.click('#stage-nav-btn-4');
    await page.screenshot({
      path: path.join(evidenceDir, 'real-statement-desktop-1440-stage4.png'),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(standardScreenshotsDir, 'desktop-real-statement.png'),
    });

    // 3. Mobile 390px Stage 4
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/health-check/real-statement/');
    await page.click('#load-sample-btn');
    await page.click('#stage-nav-btn-4');
    await page.screenshot({
      path: path.join(evidenceDir, 'real-statement-mobile-390-stage4.png'),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(standardScreenshotsDir, 'mobile-real-statement.png'),
    });

    // 4. Mobile 360px Stage 4
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/health-check/real-statement/');
    await page.click('#load-sample-btn');
    await page.click('#stage-nav-btn-4');
    await page.screenshot({
      path: path.join(evidenceDir, 'real-statement-mobile-360-stage4.png'),
      fullPage: true,
    });
  });
});
