import { test, expect } from '@playwright/test';

test.describe('Phase 16.3 — Runtime Privacy Evidence, Storage Hooks & Network Invariants', () => {

  /**
   * Helper to instrument storage APIs before page scripts execute.
   * Tracks installation status, surfacing any failures with diagnostic reasons,
   * and records all attempted writes to localStorage, sessionStorage, and document.cookie.
   */
  async function instrumentStorage(page: any) {
    await page.addInitScript(() => {
      (window as any).__storageAudit = {
        localStorageHookInstalled: false,
        sessionStorageHookInstalled: false,
        cookieHookInstalled: false,
        localStorageInstallError: null as string | null,
        sessionStorageInstallError: null as string | null,
        cookieInstallError: null as string | null,
        localStorageSetAttempts: [] as { key: string; val: string }[],
        sessionStorageSetAttempts: [] as { key: string; val: string }[],
        cookieSetAttempts: [] as string[],
      };

      try {
        const origLocal = window.localStorage.setItem.bind(window.localStorage);
        window.localStorage.setItem = function(k: string, v: string) {
          (window as any).__storageAudit.localStorageSetAttempts.push({ key: String(k), val: String(v) });
          return origLocal(k, v);
        };
        (window as any).__storageAudit.localStorageHookInstalled = true;
      } catch (err: any) {
        (window as any).__storageAudit.localStorageInstallError = String(err?.message || err);
      }

      try {
        const origSession = window.sessionStorage.setItem.bind(window.sessionStorage);
        window.sessionStorage.setItem = function(k: string, v: string) {
          (window as any).__storageAudit.sessionStorageSetAttempts.push({ key: String(k), val: String(v) });
          return origSession(k, v);
        };
        (window as any).__storageAudit.sessionStorageHookInstalled = true;
      } catch (err: any) {
        (window as any).__storageAudit.sessionStorageInstallError = String(err?.message || err);
      }

      try {
        const cookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                           Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
        if (cookieDesc && cookieDesc.set) {
          const origSet = cookieDesc.set.bind(document);
          Object.defineProperty(document, 'cookie', {
            set(val) {
              (window as any).__storageAudit.cookieSetAttempts.push(String(val));
              return origSet(val);
            },
            get() {
              return cookieDesc.get ? cookieDesc.get.call(document) : '';
            },
            configurable: true,
          });
          (window as any).__storageAudit.cookieHookInstalled = true;
        } else {
          (window as any).__storageAudit.cookieInstallError = 'document.cookie property descriptor or setter not found';
        }
      } catch (err: any) {
        (window as any).__storageAudit.cookieInstallError = String(err?.message || err);
      }
    });
  }

  /**
   * Helper to retrieve storage and database status after user interaction.
   * Explicitly distinguishes API availability from an empty database list.
   */
  async function evaluateStorageState(page: any) {
    return await page.evaluate(async () => {
      let idbStatus: { supported: boolean; databases: string[]; error?: string } = {
        supported: false,
        databases: [],
      };
      if (typeof window.indexedDB?.databases === 'function') {
        try {
          const dbs = await window.indexedDB.databases();
          idbStatus = {
            supported: true,
            databases: dbs.map((d) => d.name || '').filter(Boolean),
          };
        } catch (err: any) {
          idbStatus = {
            supported: false,
            databases: [],
            error: err ? String(err.message || err) : 'Error calling indexedDB.databases()',
          };
        }
      } else {
        idbStatus = {
          supported: false,
          databases: [],
          error: 'window.indexedDB.databases API is not available',
        };
      }

      const audit = (window as any).__storageAudit || {
        localStorageHookInstalled: false,
        sessionStorageHookInstalled: false,
        cookieHookInstalled: false,
        localStorageInstallError: 'audit object not initialized',
        sessionStorageInstallError: 'audit object not initialized',
        cookieInstallError: 'audit object not initialized',
        localStorageSetAttempts: [],
        sessionStorageSetAttempts: [],
        cookieSetAttempts: [],
      };

      return {
        cookie: document.cookie,
        localLen: window.localStorage.length,
        sessionLen: window.sessionStorage.length,
        search: window.location.search,
        hash: window.location.hash,
        idbStatus,
        audit,
      };
    });
  }

  test('1. SIP Wealth Calculator (/tools/sip/) processes synthetic inputs in-memory with zero network leakage and zero storage attempts', async ({ page }) => {
    await instrumentStorage(page);

    const observedRequests: {
      url: string;
      method: string;
      headers: Record<string, string>;
      postData: string | null;
    }[] = [];

    // Register observer BEFORE navigation to observe route load + interaction requests
    page.on('request', (req) => {
      observedRequests.push({
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
        postData: req.postData(),
      });
    });

    await page.goto('/tools/sip/');
    await page.waitForSelector('astro-island:not([ssr])');
    await expect(page.locator('#sip-calculator-app')).toBeVisible();

    const pageOrigin = new URL(page.url()).origin;
    const SYNTH_MONTHLY = '37500';

    // Enter synthetic values in monthly investment input
    const monthlyInput = page.locator('.controls-card input[type="number"]').first();
    await expect(monthlyInput).toBeVisible();
    await expect(monthlyInput).toBeEnabled();
    await monthlyInput.fill(SYNTH_MONTHLY);
    await expect(monthlyInput).toHaveValue(SYNTH_MONTHLY);

    // Wait for in-memory calculation output
    await expect(page.locator('.workbench-notice-banner')).toContainText('Custom scenario active');

    // Verify all observed requests strictly match the page's exact origin and leak no synthetic numbers
    for (const req of observedRequests) {
      expect(new URL(req.url).origin).toBe(pageOrigin);

      expect(req.url).not.toContain(SYNTH_MONTHLY);
      if (req.postData) {
        expect(req.postData).not.toContain(SYNTH_MONTHLY);
      }
      for (const [headerName, headerVal] of Object.entries(req.headers)) {
        expect(headerName).not.toContain(SYNTH_MONTHLY);
        expect(headerVal).not.toContain(SYNTH_MONTHLY);
      }
    }

    // Verify hook installation and zero storage attempt invariants
    const state = await evaluateStorageState(page);
    expect(state.audit.localStorageHookInstalled).toBe(true);
    expect(state.audit.localStorageInstallError).toBeNull();
    expect(state.audit.sessionStorageHookInstalled).toBe(true);
    expect(state.audit.sessionStorageInstallError).toBeNull();
    expect(state.audit.cookieHookInstalled).toBe(true);
    expect(state.audit.cookieInstallError).toBeNull();

    expect(state.audit.localStorageSetAttempts).toEqual([]);
    expect(state.audit.sessionStorageSetAttempts).toEqual([]);
    expect(state.audit.cookieSetAttempts).toEqual([]);
    expect(state.cookie).toBe('');
    expect(state.localLen).toBe(0);
    expect(state.sessionLen).toBe(0);
    expect(state.search).toBe('');
    expect(state.idbStatus.supported).toBe(true);
    expect(state.idbStatus.error).toBeUndefined();
    expect(state.idbStatus.databases).toEqual([]);
  });

  test('2. Home Loan Prepay vs Invest Simulator (/tools/home-loan-foreclosure/) preserves in-memory isolation with zero storage attempts', async ({ page }) => {
    await instrumentStorage(page);

    const observedRequests: {
      url: string;
      method: string;
      headers: Record<string, string>;
      postData: string | null;
    }[] = [];

    // Register observer BEFORE navigation
    page.on('request', (req) => {
      observedRequests.push({
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
        postData: req.postData(),
      });
    });

    await page.goto('/tools/home-loan-foreclosure/');
    await page.waitForSelector('astro-island:not([ssr])');
    await expect(page.locator('#home-loan-foreclosure-calculator')).toBeVisible();

    const pageOrigin = new URL(page.url()).origin;
    const SYNTH_PRINCIPAL = '4500000';

    const principalInput = page.locator('#home-loan-foreclosure-calculator input[type="number"]').nth(0);
    await expect(principalInput).toBeVisible();
    await expect(principalInput).toBeEnabled();
    await principalInput.fill(SYNTH_PRINCIPAL);
    await expect(principalInput).toHaveValue(SYNTH_PRINCIPAL);

    // Verify scenario notice banner updates
    await expect(page.locator('#loan-notice-banner')).toContainText('Custom scenario active');

    for (const req of observedRequests) {
      expect(new URL(req.url).origin).toBe(pageOrigin);

      expect(req.url).not.toContain(SYNTH_PRINCIPAL);
      if (req.postData) {
        expect(req.postData).not.toContain(SYNTH_PRINCIPAL);
      }
      for (const [headerName, headerVal] of Object.entries(req.headers)) {
        expect(headerName).not.toContain(SYNTH_PRINCIPAL);
        expect(headerVal).not.toContain(SYNTH_PRINCIPAL);
      }
    }

    const state = await evaluateStorageState(page);
    expect(state.audit.localStorageHookInstalled).toBe(true);
    expect(state.audit.localStorageInstallError).toBeNull();
    expect(state.audit.sessionStorageHookInstalled).toBe(true);
    expect(state.audit.sessionStorageInstallError).toBeNull();
    expect(state.audit.cookieHookInstalled).toBe(true);
    expect(state.audit.cookieInstallError).toBeNull();

    expect(state.audit.localStorageSetAttempts).toEqual([]);
    expect(state.audit.sessionStorageSetAttempts).toEqual([]);
    expect(state.audit.cookieSetAttempts).toEqual([]);
    expect(state.cookie).toBe('');
    expect(state.localLen).toBe(0);
    expect(state.sessionLen).toBe(0);
    expect(state.search).toBe('');
    expect(state.idbStatus.supported).toBe(true);
    expect(state.idbStatus.error).toBeUndefined();
    expect(state.idbStatus.databases).toEqual([]);
  });

  test('3. Children Future Planner (/plan/children/) computes in-memory with zero network or storage leakage', async ({ page }) => {
    await instrumentStorage(page);

    const observedRequests: {
      url: string;
      method: string;
      headers: Record<string, string>;
      postData: string | null;
    }[] = [];

    // Register observer BEFORE navigation
    page.on('request', (req) => {
      observedRequests.push({
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
        postData: req.postData(),
      });
    });

    await page.goto('/plan/children/');
    await page.waitForSelector('astro-island:not([ssr])');
    await expect(page.locator('#children-future-planner-app')).toBeVisible();

    const pageOrigin = new URL(page.url()).origin;
    const SYNTH_CHILD_COST = '4850000';

    // Click load illustrative example
    const loadExampleBtn = page.locator('[data-testid="btn-load-family-example"]');
    await expect(loadExampleBtn).toBeVisible();
    await expect(loadExampleBtn).toBeEnabled();
    await loadExampleBtn.click();

    // Verify illustrative banner appears
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).toBeVisible();

    // Required assertion: milestone cost input must be visible and enabled
    const costInput = page.locator('input[id^="ms-cost-"]').first();
    await expect(costInput).toBeVisible();
    await expect(costInput).toBeEnabled();
    await costInput.fill(SYNTH_CHILD_COST);
    await expect(costInput).toHaveValue(SYNTH_CHILD_COST);

    // Verify illustrative banner is dismissed when custom scenario input is modified
    await expect(page.locator('[data-testid="illustrative-example-banner"]')).not.toBeVisible();

    for (const req of observedRequests) {
      expect(new URL(req.url).origin).toBe(pageOrigin);

      expect(req.url).not.toContain(SYNTH_CHILD_COST);
      if (req.postData) {
        expect(req.postData).not.toContain(SYNTH_CHILD_COST);
      }
      for (const [headerName, headerVal] of Object.entries(req.headers)) {
        expect(headerName).not.toContain(SYNTH_CHILD_COST);
        expect(headerVal).not.toContain(SYNTH_CHILD_COST);
      }
    }

    const state = await evaluateStorageState(page);
    expect(state.audit.localStorageHookInstalled).toBe(true);
    expect(state.audit.localStorageInstallError).toBeNull();
    expect(state.audit.sessionStorageHookInstalled).toBe(true);
    expect(state.audit.sessionStorageInstallError).toBeNull();
    expect(state.audit.cookieHookInstalled).toBe(true);
    expect(state.audit.cookieInstallError).toBeNull();

    expect(state.audit.localStorageSetAttempts).toEqual([]);
    expect(state.audit.sessionStorageSetAttempts).toEqual([]);
    expect(state.audit.cookieSetAttempts).toEqual([]);
    expect(state.cookie).toBe('');
    expect(state.localLen).toBe(0);
    expect(state.sessionLen).toBe(0);
    expect(state.search).toBe('');
    expect(state.idbStatus.supported).toBe(true);
    expect(state.idbStatus.error).toBeUndefined();
    expect(state.idbStatus.databases).toEqual([]);
  });

  test('4. Quick Net Worth Snapshot (/tools/net-worth/) computes in-memory without persistent writes', async ({ page }) => {
    await instrumentStorage(page);

    const observedRequests: {
      url: string;
      method: string;
      headers: Record<string, string>;
      postData: string | null;
    }[] = [];

    // Register observer BEFORE navigation
    page.on('request', (req) => {
      observedRequests.push({
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
        postData: req.postData(),
      });
    });

    await page.goto('/tools/net-worth/');
    await page.waitForSelector('astro-island:not([ssr])');
    const app = page.locator('#net-worth-calculator-app');
    await expect(app).toBeVisible();

    const pageOrigin = new URL(page.url()).origin;
    const SYNTH_CASH = '420000';

    // Load illustrative example to establish a valid initial calculation baseline
    const exampleBtn = page.locator('#reset-net-worth-example-btn');
    await expect(exampleBtn).toBeVisible();
    await expect(exampleBtn).toBeEnabled();
    await exampleBtn.click();

    await expect(page.locator('#net-worth-summary-results')).toBeVisible();
    const headline = page.locator('[data-testid="net-worth-headline-val"]');
    await expect(headline).toBeVisible();
    const headlineBefore = await headline.textContent();
    expect(headlineBefore).toContain('60,00,000');

    // Fill synthetic value into liquid cash input
    const liquidInput = app.locator('input[type="text"]').nth(0);
    await expect(liquidInput).toBeVisible();
    await expect(liquidInput).toBeEnabled();
    await liquidInput.fill(SYNTH_CASH);
    await expect(liquidInput).toHaveValue(SYNTH_CASH);

    // Calculation-backed output changes:
    // Assets: 4,20,000 + 25,00,000 + 70,00,000 = 99,20,000. Liabilities: 40,00,000.
    // Net Worth = 59,20,000 (changed from baseline 60,00,000)
    await expect(headline).toContainText('59,20,000');
    const headlineAfter = await headline.textContent();
    expect(headlineAfter).not.toBe(headlineBefore);

    // Breakdown grid explicitly reflects the synthetic 4,20,000 liquid reserves amount
    const liquidBreakdown = page.locator('.breakdown-cell').first().locator('.cell-val');
    await expect(liquidBreakdown).toContainText('4,20,000');

    for (const req of observedRequests) {
      expect(new URL(req.url).origin).toBe(pageOrigin);

      expect(req.url).not.toContain(SYNTH_CASH);
      if (req.postData) {
        expect(req.postData).not.toContain(SYNTH_CASH);
      }
      for (const [headerName, headerVal] of Object.entries(req.headers)) {
        expect(headerName).not.toContain(SYNTH_CASH);
        expect(headerVal).not.toContain(SYNTH_CASH);
      }
    }

    const state = await evaluateStorageState(page);
    expect(state.audit.localStorageHookInstalled).toBe(true);
    expect(state.audit.localStorageInstallError).toBeNull();
    expect(state.audit.sessionStorageHookInstalled).toBe(true);
    expect(state.audit.sessionStorageInstallError).toBeNull();
    expect(state.audit.cookieHookInstalled).toBe(true);
    expect(state.audit.cookieInstallError).toBeNull();

    expect(state.audit.localStorageSetAttempts).toEqual([]);
    expect(state.audit.sessionStorageSetAttempts).toEqual([]);
    expect(state.audit.cookieSetAttempts).toEqual([]);
    expect(state.cookie).toBe('');
    expect(state.localLen).toBe(0);
    expect(state.sessionLen).toBe(0);
    expect(state.search).toBe('');
    expect(state.idbStatus.supported).toBe(true);
    expect(state.idbStatus.error).toBeUndefined();
    expect(state.idbStatus.databases).toEqual([]);
  });

  test('5. Real Financial Statement Wizard (/health-check/real-statement/) preserves multi-stage privacy without storage writes', async ({ page }) => {
    await instrumentStorage(page);

    const observedRequests: {
      url: string;
      method: string;
      headers: Record<string, string>;
      postData: string | null;
    }[] = [];

    // Register observer BEFORE navigation
    page.on('request', (req) => {
      observedRequests.push({
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
        postData: req.postData(),
      });
    });

    await page.goto('/health-check/real-statement/');
    await page.waitForSelector('astro-island:not([ssr])');
    const wizard = page.locator('#real-statement-app');
    await expect(wizard).toBeVisible();

    const pageOrigin = new URL(page.url()).origin;
    const SYNTH_INCOME = '195000';

    // Click load illustrative example
    const loadSampleBtn = page.locator('#load-sample-btn');
    await expect(loadSampleBtn).toBeVisible();
    await expect(loadSampleBtn).toBeEnabled();
    await loadSampleBtn.click();
    await expect(wizard.locator('.example-loaded-banner')).toBeVisible();

    // Required assertion: income input must be visible, enabled, filled, and confirmed
    const incomeInput = wizard.locator('input[id*="-inc-amt-"]').first();
    await expect(incomeInput).toBeVisible();
    await expect(incomeInput).toBeEnabled();
    await incomeInput.fill(SYNTH_INCOME);
    await expect(incomeInput).toHaveValue(SYNTH_INCOME);

    // Verify custom scenario banner activates
    await expect(wizard.locator('.custom-loaded-banner')).toBeVisible();
    await expect(wizard.locator('.custom-loaded-banner')).toContainText('Custom Scenario');

    for (const req of observedRequests) {
      expect(new URL(req.url).origin).toBe(pageOrigin);

      expect(req.url).not.toContain(SYNTH_INCOME);
      if (req.postData) {
        expect(req.postData).not.toContain(SYNTH_INCOME);
      }
      for (const [headerName, headerVal] of Object.entries(req.headers)) {
        expect(headerName).not.toContain(SYNTH_INCOME);
        expect(headerVal).not.toContain(SYNTH_INCOME);
      }
    }

    const state = await evaluateStorageState(page);
    expect(state.audit.localStorageHookInstalled).toBe(true);
    expect(state.audit.localStorageInstallError).toBeNull();
    expect(state.audit.sessionStorageHookInstalled).toBe(true);
    expect(state.audit.sessionStorageInstallError).toBeNull();
    expect(state.audit.cookieHookInstalled).toBe(true);
    expect(state.audit.cookieInstallError).toBeNull();

    expect(state.audit.localStorageSetAttempts).toEqual([]);
    expect(state.audit.sessionStorageSetAttempts).toEqual([]);
    expect(state.audit.cookieSetAttempts).toEqual([]);
    expect(state.cookie).toBe('');
    expect(state.localLen).toBe(0);
    expect(state.sessionLen).toBe(0);
    expect(state.search).toBe('');
    expect(state.idbStatus.supported).toBe(true);
    expect(state.idbStatus.error).toBeUndefined();
    expect(state.idbStatus.databases).toEqual([]);
  });

  test('6. HTML script tags across audited pages contain zero third-party tracking or analytics SDKs', async ({ page }) => {
    const sampleRoutes = ['/', '/tools/sip/', '/learn/', '/privacy/', '/contact/'];

    for (const route of sampleRoutes) {
      await page.goto(route);
      const pageOrigin = new URL(page.url()).origin;

      // Audit all script elements with a src attribute
      const scriptOrigins = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts.map((s) => {
          const rawSrc = s.getAttribute('src') || '';
          try {
            // Resolve against current page URL to correctly handle relative and protocol-relative URLs
            const resolved = new URL(rawSrc, window.location.href);
            return { rawSrc, resolvedOrigin: resolved.origin, fullUrl: resolved.href };
          } catch {
            return { rawSrc, resolvedOrigin: 'INVALID', fullUrl: rawSrc };
          }
        });
      });

      for (const script of scriptOrigins) {
        // Must strictly match the current page's exact origin
        expect(script.resolvedOrigin).toBe(pageOrigin);

        // Banned tracking domains and analytics SDK tokens
        expect(script.fullUrl).not.toContain('google-analytics');
        expect(script.fullUrl).not.toContain('googletagmanager');
        expect(script.fullUrl).not.toContain('clarity.ms');
        expect(script.fullUrl).not.toContain('facebook.net');
        expect(script.fullUrl).not.toContain('hotjar');
        expect(script.fullUrl).not.toContain('mixpanel');
        expect(script.fullUrl).not.toContain('segment.com');
      }
    }
  });

  test('7. Outbound external links navigate explicitly and specify external platform boundaries', async ({ page }) => {
    await page.goto('/contact/');

    // WhatsApp link
    const waLink = page.locator('.btn-whatsapp');
    await expect(waLink).toBeVisible();
    expect(await waLink.getAttribute('target')).toBe('_blank');
    expect(await waLink.getAttribute('rel')).toContain('noopener');
    expect(await waLink.getAttribute('rel')).toContain('noreferrer');

    // Portal link
    const portalLink = page.locator('.btn-portal');
    await expect(portalLink).toBeVisible();
    expect(await portalLink.getAttribute('target')).toBe('_blank');
    expect(await portalLink.getAttribute('rel')).toContain('noopener');
    expect(await portalLink.getAttribute('rel')).toContain('noreferrer');

    // Check privacy page outbound disclosure
    await page.goto('/privacy/');
    const privacyText = await page.innerText('body');
    expect(privacyText).toContain('Governed by third-party provider\'s privacy policy');
    expect(privacyText).toContain('Subject to external platform terms upon navigation');
  });

  test('8. POSITIVE CONTROL (Isolated Harness Validation): Harness reliably detects attempted writes to localStorage, sessionStorage, and document.cookie', async ({ page }) => {
    await instrumentStorage(page);
    await page.goto('/privacy/');
    await page.waitForLoadState('domcontentloaded');

    // Deliberately attempt probe writes to test the instrumentation harness
    await page.evaluate(() => {
      window.localStorage.setItem('__awc_probe_local', 'probe_val_1');
      window.sessionStorage.setItem('__awc_probe_session', 'probe_val_2');
      document.cookie = '__awc_probe_cookie=probe_val_3; path=/';
    });

    // Evaluate storage state and verify that ALL three attempted writes were captured by the harness
    const state = await evaluateStorageState(page);

    // Verify hooks were installed successfully
    expect(state.audit.localStorageHookInstalled).toBe(true);
    expect(state.audit.localStorageInstallError).toBeNull();
    expect(state.audit.sessionStorageHookInstalled).toBe(true);
    expect(state.audit.sessionStorageInstallError).toBeNull();
    expect(state.audit.cookieHookInstalled).toBe(true);
    expect(state.audit.cookieInstallError).toBeNull();

    // Verify that the harness caught each attempted write
    expect(state.audit.localStorageSetAttempts).toEqual([
      { key: '__awc_probe_local', val: 'probe_val_1' }
    ]);
    expect(state.audit.sessionStorageSetAttempts).toEqual([
      { key: '__awc_probe_session', val: 'probe_val_2' }
    ]);
    expect(state.audit.cookieSetAttempts).toContain('__awc_probe_cookie=probe_val_3; path=/');

    // Clean up probe writes immediately to ensure complete isolation
    await page.evaluate(() => {
      window.localStorage.removeItem('__awc_probe_local');
      window.sessionStorage.removeItem('__awc_probe_session');
      document.cookie = '__awc_probe_cookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });

    // Verify cleanup restored zero state
    const cleanState = await evaluateStorageState(page);
    expect(cleanState.localLen).toBe(0);
    expect(cleanState.sessionLen).toBe(0);
    expect(cleanState.cookie).toBe('');
  });

});
