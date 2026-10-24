import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Phase 26.1 / Phase 7.1 — Life Insurance Results Header Mobile Collision Fix & Visual QA
 *
 * Route: /tools/life-insurance/
 * Verifies that on compact mobile screens (360x800 and 390x844):
 * 1. .metric-eyebrow ("Estimated Cover Gap") and .metric-tag ("Needs-Based Model")
 *    in .primary-card-top have separate visual space, are stacked vertically, do not
 *    intersect or collide, and remain completely visible inside the card.
 * 2. The primary calculated cover gap figure (#val-additional-personal-gap) remains
 *    visible in the initial mobile viewport (<= 760px on 360x800, <= 780px on 390x844).
 * 3. Zero horizontal page overflow at 360px, 390px, and 1440px.
 * 4. Desktop 1440x900 result header remains aesthetic and unregressed.
 * 5. Refreshed initial viewport screenshots are archived in phase7-1/.
 */

test.describe('Phase 7.1 — Life Insurance Results Header Mobile Collision Fix (/tools/life-insurance/)', () => {
  const screenshotsDir = path.resolve(
    process.cwd(),
    '../product-docs/design-review/phase7-life-insurance/phase7-1'
  );

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('1. 360x800: Eyebrow and Tag do not collide, are stacked with readable gap, and result number is <= 760px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Load illustrative family example
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();
    await page.waitForTimeout(300);

    const card = page.locator('#primary-result-card');
    await expect(card).toBeVisible();
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();

    const eyebrow = page.locator('#primary-result-card .primary-card-top .metric-eyebrow');
    const tag = page.locator('#primary-result-card .primary-card-top .metric-tag');

    await expect(eyebrow).toBeVisible();
    await expect(tag).toBeVisible();

    const eyebrowBox = await eyebrow.boundingBox();
    const tagBox = await tag.boundingBox();

    expect(eyebrowBox).not.toBeNull();
    expect(tagBox).not.toBeNull();

    console.log(`[PHASE 7.1 360x800] Eyebrow: y=${eyebrowBox!.y.toFixed(2)}, h=${eyebrowBox!.height.toFixed(2)}, bottom=${(eyebrowBox!.y + eyebrowBox!.height).toFixed(2)}px`);
    console.log(`[PHASE 7.1 360x800] Tag:     y=${tagBox!.y.toFixed(2)}, h=${tagBox!.height.toFixed(2)}, top=${tagBox!.y.toFixed(2)}px`);

    // Verify vertical stacking: tag must begin after eyebrow bottom with at least a 2px readable gap
    const eyebrowBottom = eyebrowBox!.y + eyebrowBox!.height;
    expect(tagBox!.y).toBeGreaterThanOrEqual(eyebrowBottom + 2);

    // Verify both elements stay within card bounds (no clipping or horizontal overflow)
    expect(eyebrowBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(eyebrowBox!.x + eyebrowBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 1);

    expect(tagBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(tagBox!.x + tagBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 1);

    // Verify primary cover gap figure remains visible in first mobile viewport (<= 760px)
    const val360 = page.locator('#val-additional-personal-gap');
    await expect(val360).toBeVisible();
    const valBox = await val360.boundingBox();
    expect(valBox).not.toBeNull();
    const valBottom = valBox!.y + valBox!.height;
    console.log(`[PHASE 7.1 360x800] Result Number Bottom: ${valBottom.toFixed(2)}px (must be <= 760px)`);
    expect(valBottom).toBeLessThanOrEqual(760);

    // Verify zero horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(360);
  });

  test('2. 390x844: Eyebrow and Tag do not collide, are stacked with readable gap, and result number is <= 780px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Load illustrative family example
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();
    await page.waitForTimeout(300);

    const card = page.locator('#primary-result-card');
    await expect(card).toBeVisible();
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();

    const eyebrow = page.locator('#primary-result-card .primary-card-top .metric-eyebrow');
    const tag = page.locator('#primary-result-card .primary-card-top .metric-tag');

    await expect(eyebrow).toBeVisible();
    await expect(tag).toBeVisible();

    const eyebrowBox = await eyebrow.boundingBox();
    const tagBox = await tag.boundingBox();

    expect(eyebrowBox).not.toBeNull();
    expect(tagBox).not.toBeNull();

    console.log(`[PHASE 7.1 390x844] Eyebrow: y=${eyebrowBox!.y.toFixed(2)}, h=${eyebrowBox!.height.toFixed(2)}, bottom=${(eyebrowBox!.y + eyebrowBox!.height).toFixed(2)}px`);
    console.log(`[PHASE 7.1 390x844] Tag:     y=${tagBox!.y.toFixed(2)}, h=${tagBox!.height.toFixed(2)}, top=${tagBox!.y.toFixed(2)}px`);

    // Verify vertical stacking: tag must begin after eyebrow bottom with at least a 2px readable gap
    const eyebrowBottom = eyebrowBox!.y + eyebrowBox!.height;
    expect(tagBox!.y).toBeGreaterThanOrEqual(eyebrowBottom + 2);

    // Verify both elements stay within card bounds
    expect(eyebrowBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(eyebrowBox!.x + eyebrowBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 1);

    expect(tagBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(tagBox!.x + tagBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 1);

    // Verify primary cover gap figure remains visible in first mobile viewport (<= 780px)
    const val390 = page.locator('#val-additional-personal-gap');
    await expect(val390).toBeVisible();
    const valBox = await val390.boundingBox();
    expect(valBox).not.toBeNull();
    const valBottom = valBox!.y + valBox!.height;
    console.log(`[PHASE 7.1 390x844] Result Number Bottom: ${valBottom.toFixed(2)}px (must be <= 780px)`);
    expect(valBottom).toBeLessThanOrEqual(780);

    // Verify zero horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  });

  test('3. 1440x900: Desktop result card header is clean, labels do not collide, zero overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');

    // Load illustrative family example
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();
    await page.waitForTimeout(300);

    const card = page.locator('#primary-result-card');
    await expect(card).toBeVisible();
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();

    const eyebrow = page.locator('#primary-result-card .primary-card-top .metric-eyebrow');
    const tag = page.locator('#primary-result-card .primary-card-top .metric-tag');

    await expect(eyebrow).toBeVisible();
    await expect(tag).toBeVisible();

    const eyebrowBox = await eyebrow.boundingBox();
    const tagBox = await tag.boundingBox();

    expect(eyebrowBox).not.toBeNull();
    expect(tagBox).not.toBeNull();

    // Verify neither element intersects horizontally or vertically
    const horizontalOverlap = !(
      eyebrowBox!.x + eyebrowBox!.width <= tagBox!.x ||
      tagBox!.x + tagBox!.width <= eyebrowBox!.x
    );
    const verticalOverlap = !(
      eyebrowBox!.y + eyebrowBox!.height <= tagBox!.y ||
      tagBox!.y + tagBox!.height <= eyebrowBox!.y
    );
    expect(horizontalOverlap && verticalOverlap).toBe(false);

    // Zero horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(1440);
  });

  test('4. Capture refreshed initial-viewport screenshots in phase7-1/', async ({ page }) => {
    // 360x800
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotsDir, 'life-insurance-mobile-360-results-initial.png'),
    });

    // 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotsDir, 'life-insurance-mobile-390-results-initial.png'),
    });

    // 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools/life-insurance/');
    await page.waitForSelector('astro-island:not([ssr])');
    await page.locator('[data-testid="load-example-btn"]').click();
    await page.locator('[data-testid="step-tab-4"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotsDir, 'life-insurance-desktop-1440-results-initial.png'),
    });
  });
});
