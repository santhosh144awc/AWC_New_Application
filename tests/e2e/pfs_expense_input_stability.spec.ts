import { test, expect } from '@playwright/test';

test.describe('Personal Finance Statement Expense Input Stability', () => {
  test('typing negative sign, intermediate keystrokes, and values into expenses never unmounts the form', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => {
      console.log('SPEC CAUGHT ERROR:', err.message, err.stack);
      pageErrors.push(err.message);
    });

    await page.goto('/tools/personal-finance-statement/');
    await expect(page.locator('#personal-finance-statement-app')).toBeVisible();

    // Navigate to Expenses stage (Stage 2)
    const expenseNav = page.locator('button:has-text("Expenses")').first();
    await expenseNav.click();

    // Switch to Consolidated Monthly Expense mode
    const singleRadio = page.locator('input[type="radio"][value="SINGLE_CONSOLIDATED"], button:has-text("Consolidated"), label:has-text("Consolidated")').first();
    if (await singleRadio.count() > 0) {
      await singleRadio.click();
    }

    const numInputs = page.locator('input[type="number"]');
    const inputCount = await numInputs.count();
    expect(inputCount).toBeGreaterThan(0);

    const firstInput = numInputs.first();
    await firstInput.fill('');
    await firstInput.pressSequentially('-');
    await page.waitForTimeout(100);
    console.log('Errors after typing -:', pageErrors);
    expect(pageErrors.length).toBe(0);
    await expect(page.locator('#personal-finance-statement-app')).toBeVisible();

    await firstInput.pressSequentially('50000');
    await page.waitForTimeout(100);
    console.log('Errors after typing 50000:', pageErrors);
    expect(pageErrors.length).toBe(0);
    await expect(page.locator('#personal-finance-statement-app')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
