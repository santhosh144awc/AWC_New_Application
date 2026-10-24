import { test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baselineDir = path.resolve(__dirname, '../../../product-docs/design-review/phase10-single-goal/baseline');

test.describe('Phase 10 Baseline Visual Captures (/plan/)', () => {

  test('Capture baseline screenshots at 1440px, 390px, and 360px', async ({ page }) => {
    // 1. Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plan/');
    await page.screenshot({
      path: path.join(baselineDir, 'plan-hub-desktop-1440-full.png'),
      fullPage: true,
    });

    const estimatorDesktop = page.locator('#single-goal-planner');
    await estimatorDesktop.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(baselineDir, 'goal-estimator-desktop-1440-empty.png'),
    });

    // Load example on desktop
    await page.click('#load-goal-example-btn');
    await page.screenshot({
      path: path.join(baselineDir, 'goal-estimator-desktop-1440-loaded.png'),
    });

    // 2. Mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/plan/');
    await page.screenshot({
      path: path.join(baselineDir, 'plan-hub-mobile-390-full.png'),
      fullPage: true,
    });

    const estimator390 = page.locator('#single-goal-planner');
    await estimator390.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(baselineDir, 'goal-estimator-mobile-390-empty.png'),
    });

    await page.click('#load-goal-example-btn');
    await page.screenshot({
      path: path.join(baselineDir, 'goal-estimator-mobile-390-loaded.png'),
    });

    // 3. Mobile 360x800
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/plan/');
    await page.screenshot({
      path: path.join(baselineDir, 'plan-hub-mobile-360-full.png'),
      fullPage: true,
    });

    const estimator360 = page.locator('#single-goal-planner');
    await estimator360.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(baselineDir, 'goal-estimator-mobile-360-empty.png'),
    });

    await page.click('#load-goal-example-btn');
    await page.screenshot({
      path: path.join(baselineDir, 'goal-estimator-mobile-360-loaded.png'),
    });
  });
});
