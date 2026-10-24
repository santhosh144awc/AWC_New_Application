import { test, expect, type Request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Phase 19 — 7-Pillar Family Financial Health Check (/health-check/) & Goal Planner Neutral State', () => {
  // Ensure screenshot output dir exists
  test.beforeAll(() => {
    const screenshotDir = path.resolve('tests/e2e/screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test.describe('1. Health Check Interactive Assessment Flow (/health-check/)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/health-check/');
      await page.waitForSelector('astro-island:not([ssr])');
    });

    test('1.1 Single H1, proper title, and interactive questionnaire mounting (shell eliminated)', async ({ page }) => {
      await expect(page).toHaveTitle(/Financial Health/i);
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText("Understand your family's financial health");

      // Questionnaire app is mounted
      await expect(page.locator('#health-questionnaire-app')).toBeVisible();
      // StatusNotice shell must be absent
      await expect(page.locator('.status-notice')).toHaveCount(0);
      await expect(page.getByText('Tool Shell Active • Calculation Engine Pending')).toHaveCount(0);
    });

    test('1.2 Start state has no preselected answer and no calculated score', async ({ page }) => {
      // Start card is visible
      await expect(page.locator('#health-start-card')).toBeVisible();
      await expect(page.locator('#start-health-check-btn')).toBeVisible();

      // No questionnaire card or results dashboard yet
      await expect(page.locator('#health-questionnaire-card')).toHaveCount(0);
      await expect(page.locator('#health-results-dashboard')).toHaveCount(0);
      await expect(page.locator('#health-overall-score')).toHaveCount(0);
    });

    test('1.3 Step-by-step 1/7 to 7/7 navigation, disabled Next when unanswered, and answer selection', async ({ page }) => {
      // Click start
      await page.locator('#start-health-check-btn').click();
      await expect(page.locator('#health-questionnaire-card')).toBeVisible();

      // Step 1: Cash flow
      await expect(page.locator('#health-step-indicator')).toHaveText('Question 1 of 7');
      const nextBtn = page.locator('#next-step-btn');
      await expect(nextBtn).toBeDisabled();

      // Select an option for Step 1
      const step1Opt = page.locator('#opt-card-cf_4');
      await step1Opt.click();
      await expect(step1Opt.locator('input[type="radio"]')).toBeChecked();
      await expect(nextBtn).toBeEnabled();

      // Advance to Step 2
      await nextBtn.click();
      await expect(page.locator('#health-step-indicator')).toHaveText('Question 2 of 7');
      await expect(nextBtn).toBeDisabled();
    });

    test('1.4 Back navigation preserves previously selected answers', async ({ page }) => {
      await page.locator('#start-health-check-btn').click();

      // Step 1: Select cf_3
      await page.locator('#opt-card-cf_3').click();
      await page.locator('#next-step-btn').click();

      // Step 2: Select ef_3
      await expect(page.locator('#health-step-indicator')).toHaveText('Question 2 of 7');
      await page.locator('#opt-card-ef_3').click();

      // Navigate back to Step 1
      await page.locator('#back-step-btn').click();
      await expect(page.locator('#health-step-indicator')).toHaveText('Question 1 of 7');
      await expect(page.locator('#opt-card-cf_3 input[type="radio"]')).toBeChecked();

      // Navigate forward to Step 2
      await page.locator('#next-step-btn').click();
      await expect(page.locator('#health-step-indicator')).toHaveText('Question 2 of 7');
      await expect(page.locator('#opt-card-ef_3 input[type="radio"]')).toBeChecked();
    });

    test('1.5 Clear all / Restart returns to blank state', async ({ page }) => {
      await page.locator('#start-health-check-btn').click();
      await page.locator('#opt-card-cf_4').click();

      // Click Clear all
      await page.locator('#restart-health-btn').click();
      await expect(page.locator('#health-start-card')).toBeVisible();
      await expect(page.locator('#health-questionnaire-card')).toHaveCount(0);
      await expect(page.locator('#health-results-dashboard')).toHaveCount(0);
    });

    test('1.6 Full assessment completion reconciles with canonical test vector (Realistic Household VEC-HEALTH-04)', async ({ page }) => {
      await page.locator('#start-health-check-btn').click();

      // Select 7 answers corresponding to Test Vector VEC-HEALTH-04 (Realistic Household):
      // 1. cashFlow: cf_3 (80)
      await page.locator('#opt-card-cf_3').click();
      await page.locator('#next-step-btn').click();

      // 2. emergencyFund: ef_2 (50)
      await page.locator('#opt-card-ef_2').click();
      await page.locator('#next-step-btn').click();

      // 3. debt: db_3 (85)
      await page.locator('#opt-card-db_3').click();
      await page.locator('#next-step-btn').click();

      // 4. protection: pr_2 (50)
      await page.locator('#opt-card-pr_2').click();
      await page.locator('#next-step-btn').click();

      // 5. investments: inv_3 (85)
      await page.locator('#opt-card-inv_3').click();
      await page.locator('#next-step-btn').click();

      // 6. goals: gl_2 (55)
      await page.locator('#opt-card-gl_2').click();
      await page.locator('#next-step-btn').click();

      // 7. retirement: rt_2 (50)
      await page.locator('#opt-card-rt_2').click();

      // Submit
      const submitBtn = page.locator('#next-step-btn');
      await expect(submitBtn).toHaveText('View my results →');
      await submitBtn.click();

      // Results Dashboard appears
      const dashboard = page.locator('#health-results-dashboard');
      await expect(dashboard).toBeVisible();

      // Weighted calculation:
      // cf(80*0.15=12) + ef(50*0.15=7.5) + db(85*0.15=12.75) + pr(50*0.15=7.5) + inv(85*0.15=12.75) + gl(55*0.10=5.5) + rt(50*0.15=7.5) = 65.5 -> 66
      // Band: 65-79 is "Generally Healthy"
      await expect(page.locator('#health-overall-score')).toHaveText('66');
      await expect(page.locator('#health-band-badge')).toContainText('Generally Healthy');

      // 7 pillar breakdown rows exist
      await expect(page.locator('.pillar-score-row')).toHaveCount(7);

      // Recommendations cap <= 3
      const recCards = page.locator('.rec-card');
      const recCount = await recCards.count();
      expect(recCount).toBeGreaterThanOrEqual(1);
      expect(recCount).toBeLessThanOrEqual(3);

      // Deep dive link targets /health-check/real-statement/
      const deepDiveLink = page.locator('#link-real-statement');
      await expect(deepDiveLink).toHaveAttribute('href', '/health-check/real-statement/');

      // Review / Edit answers allows navigating back
      await page.locator('#edit-answers-btn').click();
      await expect(page.locator('#health-questionnaire-card')).toBeVisible();
      await expect(page.locator('#health-results-dashboard')).toHaveCount(0);
    });

    test('1.7 All-minimum score vector yields 22, Priority Areas Identified, and max 3 prioritized foundational recommendations', async ({ page }) => {
      await page.locator('#start-health-check-btn').click();

      // All lowest score options
      const lowestOptions = [
        '#opt-card-cf_1',
        '#opt-card-ef_1',
        '#opt-card-db_1',
        '#opt-card-pr_1',
        '#opt-card-inv_1',
        '#opt-card-gl_1',
        '#opt-card-rt_1',
      ];

      for (let i = 0; i < lowestOptions.length; i++) {
        await page.locator(lowestOptions[i]).click();
        await page.locator('#next-step-btn').click();
      }

      await expect(page.locator('#health-results-dashboard')).toBeVisible();
      await expect(page.locator('#health-overall-score')).toHaveText('22');
      await expect(page.locator('#health-band-badge')).toContainText('Priority Areas Identified');

      // Top 3 foundational recommendations: Debt/Emergency -> Protection -> Cash Flow
      const recCards = page.locator('.rec-card');
      await expect(recCards).toHaveCount(3);
    });

    test('1.8 Keyboard navigation (Space/Enter) functions on option cards', async ({ page }) => {
      await page.locator('#start-health-check-btn').click();

      // Focus first option radio and press Space
      const optRadio = page.locator('#opt-card-cf_4 input[type="radio"]');
      await optRadio.focus();
      await page.keyboard.press('Space');
      await expect(optRadio).toBeChecked();
      await expect(page.locator('#next-step-btn')).toBeEnabled();

      // Select another radio with Enter
      const secondRadio = page.locator('#opt-card-cf_3 input[type="radio"]');
      await secondRadio.focus();
      await page.keyboard.press('Enter');
      await expect(secondRadio).toBeChecked();
      await expect(optRadio).not.toBeChecked();
    });

    test('1.9 Zero network leakage: answers are never transmitted via network requests or URLs', async ({ page }) => {
      const requests: Request[] = [];
      page.on('request', (req) => requests.push(req));

      await page.locator('#start-health-check-btn').click();
      await page.locator('#opt-card-cf_4').click();
      await page.locator('#next-step-btn').click();
      await page.locator('#opt-card-ef_3').click();

      // Check current URL has no answer parameters
      expect(page.url()).not.toContain('cf_4');
      expect(page.url()).not.toContain('ef_3');
      expect(page.url()).not.toContain('score');

      // Check localStorage and sessionStorage are empty of health data
      const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
      const sessionStorageKeys = await page.evaluate(() => Object.keys(sessionStorage));
      expect(localStorageKeys.filter((k) => k.toLowerCase().includes('health'))).toHaveLength(0);
      expect(sessionStorageKeys.filter((k) => k.toLowerCase().includes('health'))).toHaveLength(0);

      // Verify no outgoing request contains selected answers
      for (const req of requests) {
        const url = req.url().toLowerCase();
        expect(url).not.toContain('cf_4');
        expect(url).not.toContain('ef_3');
        const postData = req.postData()?.toLowerCase() ?? '';
        expect(postData).not.toContain('cf_4');
        expect(postData).not.toContain('ef_3');
      }
    });

    test('1.10 Responsive viewports (1440px, 768px, 390px, 360px) have zero horizontal overflow', async ({ page }) => {
      const viewports = [
        { width: 1440, height: 900, name: 'desktop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 390, height: 844, name: 'mobile-390' },
        { width: 360, height: 740, name: 'mobile-360' },
      ];

      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.reload();
        await page.waitForSelector('astro-island:not([ssr])');

        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll, `Horizontal overflow detected at ${vp.width}px`).toBe(false);
      }
    });

    test('1.11 Capture required visual screenshots for health check', async ({ page }) => {
      // 1. Desktop 1440px
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.reload();
      await page.waitForSelector('astro-island:not([ssr])');
      await page.screenshot({
        path: 'tests/e2e/screenshots/desktop-health-check-phase19.png',
        fullPage: true,
      });

      // 2. Mobile 390px
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: 'tests/e2e/screenshots/mobile-health-check-phase19.png',
        fullPage: true,
      });

      // 3. Mobile 360px
      await page.setViewportSize({ width: 360, height: 740 });
      await page.screenshot({
        path: 'tests/e2e/screenshots/mobile-360-health-check-phase19.png',
        fullPage: true,
      });
    });
  });

  test.describe('2. Goal Planner Neutral Initial State (/plan/)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/plan/');
      await page.waitForSelector('astro-island:not([ssr])');
    });

    test('2.1 Initial estimator fields are blank, results are not precomputed, and empty state is displayed', async ({ page }) => {
      const numberInputs = page.locator('#single-goal-planner input[type="number"]');
      await expect(numberInputs).toHaveCount(5);

      // Verify all 5 input fields are blank
      await expect(numberInputs.nth(0)).toHaveValue('');
      await expect(numberInputs.nth(1)).toHaveValue('');
      await expect(numberInputs.nth(2)).toHaveValue('');
      await expect(numberInputs.nth(3)).toHaveValue('');
      await expect(numberInputs.nth(4)).toHaveValue('');

      // Results must not be computed
      await expect(page.locator('#goal-future-cost')).toHaveCount(0);
      await expect(page.locator('#goal-example-banner')).toHaveCount(0);

      // Balanced empty state prompt is visible
      await expect(page.locator('#goal-empty-state')).toBeVisible();
      await expect(page.locator('#goal-empty-state')).toContainText('Enter your target milestone cost');
    });

    test('2.2 Load illustrative example displays banner and calculated results', async ({ page }) => {
      await page.locator('#load-goal-example-btn').click();

      // Banner is visible
      const banner = page.locator('#goal-example-banner');
      await expect(banner).toBeVisible();
      await expect(banner).toContainText('Illustrative example loaded — these are not your figures.');

      const numberInputs = page.locator('#single-goal-planner input[type="number"]');

      // Fields are populated with benchmark values (Group 1: Cost, Years, Savings; Group 2: Inflation, Return)
      await expect(numberInputs.nth(0)).toHaveValue('2500000');
      await expect(numberInputs.nth(1)).toHaveValue('10');
      await expect(numberInputs.nth(2)).toHaveValue('200000');
      await expect(numberInputs.nth(3)).toHaveValue('8');
      await expect(numberInputs.nth(4)).toHaveValue('12');

      // Results are computed and visible
      await expect(page.locator('#goal-future-cost')).toContainText('₹53,97,312');
      await expect(page.locator('#goal-savings-fv')).toContainText('₹6,21,170');
      await expect(page.locator('#goal-net-deficit')).toContainText('₹47,76,143');
    });

    test('2.3 Editing any field dismisses the illustrative banner', async ({ page }) => {
      await page.locator('#load-goal-example-btn').click();
      await expect(page.locator('#goal-example-banner')).toBeVisible();

      // Modify cost today
      const costInput = page.locator('#single-goal-planner input[type="number"]').first();
      await costInput.fill('3000000');
      await expect(page.locator('#goal-example-banner')).toHaveCount(0);
    });

    test('2.4 Clear all restores blank inputs and hides results', async ({ page }) => {
      await page.locator('#load-goal-example-btn').click();
      await expect(page.locator('#goal-future-cost')).toBeVisible();

      // Reset
      await page.locator('#reset-goal-btn').click();
      const costInput = page.locator('#single-goal-planner input[type="number"]').first();
      await expect(costInput).toHaveValue('');
      await expect(page.locator('#goal-future-cost')).toHaveCount(0);
      await expect(page.locator('#goal-example-banner')).toHaveCount(0);
      await expect(page.locator('#goal-empty-state')).toBeVisible();
    });

    test('2.5 Capture required visual screenshots for plan hub neutral state', async ({ page }) => {
      // 1. Desktop 1440px
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.reload();
      await page.waitForSelector('astro-island:not([ssr])');
      await page.screenshot({
        path: 'tests/e2e/screenshots/desktop-plan-hub-neutral-goal-phase19.png',
        fullPage: true,
      });

      // 2. Mobile 390px
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: 'tests/e2e/screenshots/mobile-plan-hub-neutral-goal-phase19.png',
        fullPage: true,
      });
    });
  });

  test.describe('3. Governance & Scope Invariants', () => {
    test('3.1 GATE-A and GATE-C routes remain blocked', async ({ page }) => {
      // Verify blocked route returns 200 with status notice or 404
      const res = await page.goto('/tools/swp/');
      expect([200, 404]).toContain(res?.status());
      const content = await page.content();
      expect(content).not.toContain('Retirement Distribution Active');
    });
  });
});
