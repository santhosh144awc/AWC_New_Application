import { test, expect } from '@playwright/test';

test.describe('Client Testimonials Single-Row Slider Suite', () => {
  test('1. Testimonials section renders as single-row slider with 8 cards, photos, and slider controls', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
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
    // On 1440px desktop, 6 reachable scroll stops exist
    await expect(counter).toHaveText('01 / 06');
    await expect(track).toBeVisible();

    // Both buttons are enabled and clickable for continuous wrap-around navigation
    await expect(prevBtn).toBeEnabled();
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

  test('2. Next and Previous buttons loop continuously and update active counter and dots', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const prevBtn = page.locator('#reviews-prev-btn');
    const nextBtn = page.locator('#reviews-next-btn');
    const counter = page.locator('#reviews-counter');

    // Initial counter: 01 / 06
    await expect(counter).toHaveText('01 / 06');

    // Click next
    await nextBtn.click();
    await page.waitForTimeout(500);
    await expect(counter).toHaveText('02 / 06');

    // Click the last dot to jump to slide 06 / 06
    const dots = page.locator('#reviews-dots .slider-dot');
    await expect(dots).toHaveCount(6);
    await dots.last().click();
    await page.waitForTimeout(600);
    await expect(counter).toHaveText('06 / 06');

    // At 06 / 06, next button is ENABLED and CLICKABLE! Clicking it loops to 01 / 06
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await page.waitForTimeout(600);
    await expect(counter).toHaveText('01 / 06');

    // At 01 / 06, clicking prev loops back to 06 / 06
    await expect(prevBtn).toBeEnabled();
    await prevBtn.click();
    await page.waitForTimeout(600);
    await expect(counter).toHaveText('06 / 06');
  });

  test('3. Responsive viewports have zero global document horizontal overflow and adjust slide count', async ({ page }) => {
    // Desktop: 6 slides
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('#reviews-counter')).toHaveText('01 / 06');

    // Mobile: 8 slides
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('#reviews-counter')).toHaveText('01 / 08');
    await expect(page.locator('#reviews-dots .slider-dot')).toHaveCount(8);

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

    // Desktop screenshot at end of slider (Slide 06 / 06)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const lastDot = page.locator('#reviews-dots .slider-dot').last();
    await lastDot.click();
    await page.waitForTimeout(500);
    const sectionEnd = page.locator('#testimonials');
    await sectionEnd.evaluate((el: HTMLElement) => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/testimonials_slider_desktop_end_slide6.png' });
  });
});
