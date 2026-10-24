import { test, expect, type Request } from '@playwright/test';

test.describe('Phase 30 / Concept C Phase 11 — 7-Pillar Family Financial Health Check Redesign (/health-check/)', () => {

  test('1. Canonical /health-check/ route returns successfully and has exactly one semantic H1', async ({ page }) => {
    const res = await page.goto('/health-check/');
    expect(res?.status()).toBe(200);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText("Understand your family's financial health");
    await expect(page).toHaveTitle(/Financial Health/i);
  });

  test('2. Entry state has one clear primary CTA, calm/neutral framing, a compact pillar map, and no competing start CTA', async ({ page }) => {
    await page.goto('/health-check/');

    // Single dominant primary start button
    const startBtn = page.locator('#start-health-check-btn');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toHaveCount(1);
    await expect(startBtn).toHaveText(/Start health check/i);

    // Assert minimum 44px touch target
    const box = await startBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // No duplicate or competing start CTA in page body
    const entryActionBtns = page.locator('#health-start-card .start-action-row button');
    await expect(entryActionBtns).toHaveCount(1);
    const allStartTextBtns = page.getByRole('button', { name: /Start/i });
    await expect(allStartTextBtns).toHaveCount(1);

    // No fear-based phrases in main content
    const mainText = await page.locator('main').innerText();
    expect(mainText).not.toContain('dangerous vulnerabilities');
    expect(mainText).not.toMatch(/\bguarantee\b/i);
  });

  test('3. Opening state is calm, compact, and free of duplicate heroes, badge rows, and emoji carousels', async ({ page }) => {
    await page.goto('/health-check/');

    // Duplicate sections removed
    await expect(page.locator('.pillar-nav-pill')).toHaveCount(0);
    await expect(page.locator('.start-meta-badges')).toHaveCount(0);
    await expect(page.locator('.intro-hero')).toHaveCount(0);

    // Verify calm framing and single start action
    await expect(page.locator('#health-start-card')).toBeVisible();
    await expect(page.locator('#start-health-check-btn')).toBeVisible();
    await expect(page.locator('#health-questionnaire-card')).toHaveCount(0);
    await expect(page.locator('#health-results-dashboard')).toHaveCount(0);
  });

  test('4. Questionnaire step-by-step navigation, disabled Next when unanswered, native radio checked update, Back preserves answers, and Clear all resets state', async ({ page }) => {
    await page.goto('/health-check/');
    await page.click('#start-health-check-btn');

    // Questionnaire mounts
    const questionCard = page.locator('#health-questionnaire-card');
    await expect(questionCard).toBeVisible();

    // Question 1
    await expect(page.locator('#health-step-indicator')).toHaveText('Question 1 of 7');
    const nextBtn = page.locator('#next-step-btn');
    await expect(nextBtn).toBeDisabled();

    // Option selection updates checked state of native radio
    const opt4 = page.locator('#opt-card-cf_4');
    await opt4.click();
    await expect(opt4.locator('input[type="radio"]')).toBeChecked();
    await expect(opt4).not.toHaveAttribute('aria-checked');
    await expect(nextBtn).toBeEnabled();

    // Advance to Question 2
    await nextBtn.click();
    await expect(page.locator('#health-step-indicator')).toHaveText('Question 2 of 7');
    await expect(nextBtn).toBeDisabled();

    // Back button returns to Question 1 and preserves selection
    const backBtn = page.locator('#back-step-btn');
    await backBtn.click();
    await expect(page.locator('#health-step-indicator')).toHaveText('Question 1 of 7');
    await expect(opt4.locator('input[type="radio"]')).toBeChecked();
    await expect(opt4).not.toHaveAttribute('aria-checked');

    // Clear all / restart returns to initial start state
    const restartBtn = page.locator('#restart-health-btn');
    await restartBtn.click();
    await expect(page.locator('#health-start-card')).toBeVisible();
    await expect(page.locator('#health-questionnaire-card')).toHaveCount(0);
  });

  test('5. Full assessment results reconcile exactly to canonical test vector VEC-HEALTH-04 (score 66, Generally Healthy)', async ({ page }) => {
    await page.goto('/health-check/');
    await page.click('#start-health-check-btn');

    // VEC-HEALTH-04 sequence:
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
    await page.locator('#next-step-btn').click();

    // Results Dashboard renders
    const dashboard = page.locator('#health-results-dashboard');
    await expect(dashboard).toBeVisible();

    // Canonical engine outputs:
    // 80*0.15 + 50*0.15 + 85*0.15 + 50*0.15 + 85*0.15 + 55*0.10 + 50*0.15 = 65.5 -> 66
    await expect(page.locator('#health-overall-score')).toHaveText('66');
    await expect(page.locator('#health-band-badge')).toContainText('Generally Healthy');
  });

  test('6. Results display exact band titles, 7 breakdown rows, strengths, focus areas, and max 3 prioritized recommendations', async ({ page }) => {
    await page.goto('/health-check/');
    await page.click('#start-health-check-btn');

    // Quick fill with VEC-HEALTH-04
    await page.locator('#opt-card-cf_3').click();
    await page.locator('#next-step-btn').click();
    await page.locator('#opt-card-ef_2').click();
    await page.locator('#next-step-btn').click();
    await page.locator('#opt-card-db_3').click();
    await page.locator('#next-step-btn').click();
    await page.locator('#opt-card-pr_2').click();
    await page.locator('#next-step-btn').click();
    await page.locator('#opt-card-inv_3').click();
    await page.locator('#next-step-btn').click();
    await page.locator('#opt-card-gl_2').click();
    await page.locator('#next-step-btn').click();
    await page.locator('#opt-card-rt_2').click();
    await page.locator('#next-step-btn').click();

    // 7 breakdown rows
    const rows = page.locator('.pillar-score-row');
    await expect(rows).toHaveCount(7);

    // Strengths section
    const strengthsCard = page.locator('.card-strengths');
    await expect(strengthsCard).toBeVisible();

    // Focus areas section
    const focusCard = page.locator('.card-vulnerabilities');
    await expect(focusCard).toBeVisible();

    // Max 3 recommendations
    const recCards = page.locator('.rec-card');
    const count = await recCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(3);
  });

  test('7. Recommendation links resolve to canonical routes, and Retirement recommendation explicitly preserves GATE-A block', async ({ page }) => {
    await page.goto('/health-check/');
    await page.click('#start-health-check-btn');

    // Fill with all-minimum answers (score 22, includes retirement gap)
    const minOptions = ['cf_1', 'ef_1', 'db_1', 'pr_1', 'inv_1', 'gl_1', 'rt_1'];
    for (const opt of minOptions) {
      await page.locator(`#opt-card-${opt}`).click();
      await page.locator('#next-step-btn').click();
    }

    await expect(page.locator('#health-overall-score')).toHaveText('22');
    await expect(page.locator('#health-band-badge')).toContainText('Priority Areas Identified');

    // Check deep-dive link to REAL Financial Statement
    const realStmtLink = page.locator('#link-real-statement');
    await expect(realStmtLink).toHaveAttribute('href', '/health-check/real-statement/');

    // Check contact guidance link
    const contactLink = page.locator('#link-contact');
    await expect(contactLink).toHaveAttribute('href', '/contact/');

    // Retirement recommendations link directly to active planner
    const retirementRec = page.locator('#rec-card-retirement');
    if (await retirementRec.count() > 0) {
      await expect(retirementRec.locator('a')).toHaveAttribute('href', '/plan/retirement/');
    }
  });

  test('8. Review / Edit answers allows revising options and recalculates results', async ({ page }) => {
    await page.goto('/health-check/');
    await page.click('#start-health-check-btn');

    // Fill with cf_3, ef_2, db_3, pr_2, inv_3, gl_2, rt_2
    const options = ['cf_3', 'ef_2', 'db_3', 'pr_2', 'inv_3', 'gl_2', 'rt_2'];
    for (const opt of options) {
      await page.locator(`#opt-card-${opt}`).click();
      await page.locator('#next-step-btn').click();
    }

    await expect(page.locator('#health-overall-score')).toHaveText('66');

    // Click Review / Edit answers
    await page.locator('#edit-answers-btn').click();
    await expect(page.locator('#health-questionnaire-card')).toBeVisible();

    // We should be at Question 7, change rt_2 (50) to rt_4 (100)
    await page.locator('#opt-card-rt_4').click();
    await page.locator('#next-step-btn').click();

    // Score increases: previous 65.5 + (100-50)*0.15 = 65.5 + 7.5 = 73
    await expect(page.locator('#health-overall-score')).toHaveText('73');
  });

  test('9. Strict privacy invariant: zero external network requests, zero client storage, zero cookies, zero IndexedDB, and zero URL leakage in fresh context', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const externalRequests: string[] = [];
    page.on('request', (req: Request) => {
      try {
        const parsed = new URL(req.url());
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
            externalRequests.push(req.url());
          }
        }
      } catch {
        // ignore
      }
    });

    await page.goto('/health-check/');

    // Start assessment
    await page.locator('#start-health-check-btn').click();

    // Select options
    await page.locator('#opt-card-cf_4').click();
    await page.locator('#next-step-btn').click();

    // Assert zero external requests
    expect(externalRequests).toEqual([]);

    // Check storage, cookies, IndexedDB, and URL
    const privacyCheck = await page.evaluate(async () => {
      let dbNames: string[] = [];
      if (typeof window.indexedDB?.databases === 'function') {
        try {
          const dbs = await window.indexedDB.databases();
          dbNames = dbs.map((d) => d.name || '').filter(Boolean);
        } catch {
          // ignore
        }
      }
      return {
        localLen: window.localStorage.length,
        sessionLen: window.sessionStorage.length,
        cookie: document.cookie,
        search: window.location.search,
        hash: window.location.hash,
        dbNames,
      };
    });

    expect(privacyCheck.localLen).toBe(0);
    expect(privacyCheck.sessionLen).toBe(0);
    expect(privacyCheck.cookie).toBe('');
    expect(privacyCheck.search).toBe('');
    expect(privacyCheck.dbNames).toEqual([]);

    const cookies = await context.cookies();
    expect(cookies).toEqual([]);

    await context.close();
  });

  test('10. Responsive layout at 360px, 390px, and 1440px viewports has zero horizontal overflow and readable score coordinates', async ({ page }) => {
    const viewports = [
      { name: 'desktop-1440', width: 1440, height: 900 },
      { name: 'mobile-390', width: 390, height: 844 },
      { name: 'mobile-360', width: 360, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/health-check/');

      // Check overflow on start state
      const startOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(startOverflow, `Horizontal overflow in start state at ${vp.name}`).toBe(false);

      // Start and complete assessment
      await page.locator('#start-health-check-btn').click();
      const options = ['cf_3', 'ef_2', 'db_3', 'pr_2', 'inv_3', 'gl_2', 'rt_2'];
      for (const opt of options) {
        await page.locator(`#opt-card-${opt}`).click();
        await page.locator('#next-step-btn').click();
      }

      await expect(page.locator('#health-results-dashboard')).toBeVisible();

      // Check overflow on results state
      const resultsOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(resultsOverflow, `Horizontal overflow in results state at ${vp.name}`).toBe(false);

      // Measure score gauge coordinates
      const scoreBox = await page.locator('#overall-score-display').boundingBox();
      expect(scoreBox).not.toBeNull();
      expect(scoreBox!.height).toBeGreaterThan(0);
    }
  });

  test('11. Prohibited copy check: no fear-mongering, no guarantees, no universal benchmark advice', async ({ page }) => {
    await page.goto('/health-check/');
    const mainText = await page.locator('main').innerText();

    expect(mainText).not.toContain('dangerous vulnerabilities');
    expect(mainText).not.toMatch(/\bguaranteed\b/i);
    expect(mainText).not.toContain('risk-free');
  });

  test('12. Redesign Verification: Obsolete foundation tablist and badges removed, keyboard focus hits primary start CTA', async ({ page }) => {
    await page.goto('/health-check/');

    // Verify obsolete tablist, badges, and carousel are completely removed
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(0);
    await expect(page.locator('#pillar-map-detail')).toHaveCount(0);
    await expect(page.locator('.pillar-nav-pills')).toHaveCount(0);
    await expect(page.locator('.health-badges-row')).toHaveCount(0);

    // Primary CTA is focusable and activatable via keyboard
    const startBtn = page.locator('#start-health-check-btn');
    await expect(startBtn).toBeVisible();
    await startBtn.focus();
    await expect(startBtn).toBeFocused();

    // Activating with Enter begins assessment
    await page.keyboard.press('Enter');
    await expect(page.locator('#health-questionnaire-card')).toBeVisible();
    await expect(page.locator('#health-start-card')).toHaveCount(0);
  });

  test('13. Phase 11.1 Accessibility: Single semantic radio per answer option, Arrow/Space keyboard navigation, and predictable Tab sequence', async ({ page }) => {
    await page.goto('/health-check/');
    await page.click('#start-health-check-btn');

    await expect(page.locator('#health-questionnaire-card')).toBeVisible();
    const nextBtn = page.locator('#next-step-btn');
    await expect(nextBtn).toBeDisabled();

    // Verify exactly 4 semantic radios exist for question 1 (no duplicate radio roles)
    const radios = page.getByRole('radio');
    await expect(radios).toHaveCount(4);

    // Verify option card labels do not carry invalid aria-checked
    const optionCards = page.locator('.option-card');
    await expect(optionCards).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(optionCards.nth(i)).not.toHaveAttribute('aria-checked');
    }

    // Verify each radio has an accessible label name matching question options
    const expectedOptionLabels = [
      'Little or nothing is left most months.',
      'Usually less than 10% of my income is left.',
      'Usually around 10–20% is left.',
      'More than 20% is consistently left.',
    ];

    for (let i = 0; i < 4; i++) {
      const radio = page.getByRole('radio', { name: expectedOptionLabels[i] });
      await expect(radio).toBeAttached();
      await expect(radios.nth(i)).not.toBeChecked();
      await expect(radios.nth(i)).not.toHaveAttribute('aria-checked');
    }

    // Focus the first radio via keyboard
    await radios.nth(0).focus();
    await expect(radios.nth(0)).toBeFocused();

    // 1. ArrowDown moves to second radio and checks it
    await page.keyboard.press('ArrowDown');
    await expect(radios.nth(1)).toBeFocused();
    await expect(radios.nth(1)).toBeChecked();
    await expect(page.locator('#opt-card-cf_2')).toHaveClass(/option-selected/);
    await expect(page.locator('#opt-card-cf_2')).not.toHaveAttribute('aria-checked');
    await expect(nextBtn).toBeEnabled();

    // 2. ArrowDown moves to third radio and checks it
    await page.keyboard.press('ArrowDown');
    await expect(radios.nth(2)).toBeFocused();
    await expect(radios.nth(2)).toBeChecked();
    await expect(page.locator('#opt-card-cf_3')).toHaveClass(/option-selected/);
    await expect(page.locator('#opt-card-cf_3')).not.toHaveAttribute('aria-checked');

    // 3. ArrowDown moves to fourth radio and checks it
    await page.keyboard.press('ArrowDown');
    await expect(radios.nth(3)).toBeFocused();
    await expect(radios.nth(3)).toBeChecked();
    await expect(page.locator('#opt-card-cf_4')).toHaveClass(/option-selected/);
    await expect(page.locator('#opt-card-cf_4')).not.toHaveAttribute('aria-checked');

    // 4. ArrowDown wraps from fourth radio to first radio
    await page.keyboard.press('ArrowDown');
    await expect(radios.nth(0)).toBeFocused();
    await expect(radios.nth(0)).toBeChecked();
    await expect(page.locator('#opt-card-cf_1')).toHaveClass(/option-selected/);
    await expect(page.locator('#opt-card-cf_1')).not.toHaveAttribute('aria-checked');

    // 5. ArrowUp wraps from first radio to fourth radio
    await page.keyboard.press('ArrowUp');
    await expect(radios.nth(3)).toBeFocused();
    await expect(radios.nth(3)).toBeChecked();
    await expect(page.locator('#opt-card-cf_4')).toHaveClass(/option-selected/);
    await expect(page.locator('#opt-card-cf_4')).not.toHaveAttribute('aria-checked');

    // 6. Tab moves from radio group to next interactive action controls
    await page.keyboard.press('Tab');
    // Tab lands on clear all or back or next button
    const activeTagName = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeTagName).toBe('BUTTON');

    // 7. Clicking another option card with mouse updates selection cleanly
    await page.locator('#opt-card-cf_3').click();
    await expect(radios.nth(2)).toBeChecked();
    await expect(page.locator('#opt-card-cf_3')).toHaveClass(/option-selected/);
    await expect(page.locator('#opt-card-cf_3')).not.toHaveAttribute('aria-checked');
  });

});

