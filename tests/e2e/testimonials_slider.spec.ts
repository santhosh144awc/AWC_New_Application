import { test, expect } from '@playwright/test';

test.describe('Client Testimonials Single-Row Slider Suite', () => {
  test('1. Testimonials section renders as single-row slider with 8 cards, photos, and slider controls', async ({ page }) => {
    await page.goto('/');

    const section = page.locator('#testimonials');
    await expect(section).toBeVisible();

    // Verify header and controls
    const prevBtn = page.locator('#reviews-prev-btn');
    const nextBtn = page.locator('#reviews-next-btn');
    const counter = page.locator('#reviews-counter');
    const track = page.locator('#reviews-track');

    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
    await expect(counter).toHaveText('01 / 08');
    await expect(track).toBeVisible();

    // Verify initial prev button is disabled at start before scrolling
    await expect(prevBtn).toBeDisabled();
    await expect(nextBtn).toBeEnabled();

    // Verify all 8 cards and photos are rendered and loaded
    const cards = track.locator('.testimonial-card');
    await expect(cards).toHaveCount(8);

    const photos = track.locator('.review-avatar-img');
    await expect(photos).toHaveCount(8);

    for (let i = 0; i < 8; i++) {
      const img = photos.nth(i);
      await img.scrollIntoViewIfNeeded();
      await expect(img).toBeVisible();
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('2. Next and Previous buttons slide the track and update the active counter and dots', async ({ page }) => {
    await page.goto('/');

    const prevBtn = page.locator('#reviews-prev-btn');
    const nextBtn = page.locator('#reviews-next-btn');
    const counter = page.locator('#reviews-counter');
    const track = page.locator('#reviews-track');

    // Click next
    await nextBtn.click();
    await page.waitForTimeout(500);

    // After scrolling, counter should advance
    const counterText = await counter.textContent();
    expect(counterText).not.toBe('01 / 08');
    await expect(prevBtn).toBeEnabled();

    // Clicking a dot scrolls to that card
    const lastDot = page.locator('#reviews-dots .slider-dot').last();
    await lastDot.click();
    await page.waitForTimeout(600);

    // Counter should now show 08 / 08 or end
    const lastCounterText = await counter.textContent();
    expect(lastCounterText).toContain('08');
    await expect(nextBtn).toBeDisabled();

    // Click prev
    await prevBtn.click();
    await page.waitForTimeout(500);
    await expect(nextBtn).toBeEnabled();
  });

  test('3. Responsive viewports have zero global document horizontal overflow', async ({ page }) => {
    for (const width of [1440, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      // Check document horizontal overflow
      const hasHorizontalScrollbar = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScrollbar).toBe(false);

      // Verify testimonials track is horizontally scrollable within itself
      const isTrackScrollable = await page.evaluate(() => {
        const track = document.getElementById('reviews-track');
        return track ? track.scrollWidth > track.clientWidth : false;
      });
      expect(isTrackScrollable).toBe(true);
    }
  });

  test('4. Capture visual screenshot of the client review slider on desktop and mobile', async ({ page }) => {
    // Desktop screenshot
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const section = page.locator('#testimonials');
    await section.evaluate((el: HTMLElement) => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/testimonials_slider_desktop_1440.png' });

    // Mobile screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const sectionMobile = page.locator('#testimonials');
    await sectionMobile.evaluate((el: HTMLElement) => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/testimonials_slider_mobile_390.png' });
  });
});
