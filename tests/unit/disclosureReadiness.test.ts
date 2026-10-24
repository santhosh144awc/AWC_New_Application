import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BUSINESS_PROFILE } from '../../src/config/businessProfile';

describe('Phase 16 — Privacy, Terms & Regulatory Disclosure Readiness Audit (Unit Tests)', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const reviewRegisterPath = path.join(
    rootDir,
    'product-docs/design-review/phase16-privacy-terms-disclosure/PHASE16_LEGAL_REVIEW_REGISTER.md'
  );
  const sourceRegisterPath = path.join(
    rootDir,
    'product-docs/design-review/phase16-privacy-terms-disclosure/PHASE16_LEGAL_SOURCE_REGISTER.md'
  );

  it('1. Authoritative business profile preserves CONFIRMED ARN state based on AMFI evidence', () => {
    expect(BUSINESS_PROFILE.regulatory.arnStatus).toBe('CONFIRMED');
    expect(BUSINESS_PROFILE.regulatory.arn).toBe('ARN-266896');
    expect(BUSINESS_PROFILE.regulatory.arnValidity).toBe('16 March 2029');
    expect(BUSINESS_PROFILE.regulatory.complianceReviewStatus).toBe('PENDING_LEGAL_REVIEW');
    expect(BUSINESS_PROFILE.regulatory.category).toBe('MUTUAL_FUND_DISTRIBUTION');
  });

  it('2. Authoritative business profile does not claim SEBI RIA registration or guaranteed returns', () => {
    expect(BUSINESS_PROFILE.regulatory.sebiRIAStatusNotice).toContain('does not offer fee-based investment advisory services');
    expect(BUSINESS_PROFILE.disclosures.intermediaryStatement).toContain('ARN-266896');
    expect(BUSINESS_PROFILE.disclosures.simulationDisclaimer).toContain('Projected values are not guaranteed');
  });

  it('3. PHASE16_LEGAL_SOURCE_REGISTER.md exists and contains primary Indian official sources with access dates', () => {
    expect(fs.existsSync(sourceRegisterPath)).toBe(true);
    const content = fs.readFileSync(sourceRegisterPath, 'utf8');

    expect(content).toContain('SRC-DPDP-GAZETTE-2025');
    expect(content).toContain('SRC-DPDP-RULES-2025');
    expect(content).toContain('SRC-ITACT-2025-FAQ');
    expect(content).toContain('SRC-AMFI-LOOKUP');
    expect(content).toContain('SRC-SEBI-RIA-REG');
    expect(content).toContain('22 October 2026');
  });

  it('4. PHASE16_LEGAL_REVIEW_REGISTER.md tracks privacy, terms, disclaimer, and intermediary claims', () => {
    expect(fs.existsSync(reviewRegisterPath)).toBe(true);
    const content = fs.readFileSync(reviewRegisterPath, 'utf8');

    // Status classifications
    expect(content).toContain('VERIFIED FACT');
    expect(content).toContain('SAFE NEUTRAL COPY');
    expect(content).toContain('COUNSEL REVIEW REQUIRED');
    expect(content).toContain('UNVERIFIED — DO NOT CLAIM');
    expect(content).toContain('Release Blocker');

    // Four distinct evidence classification labels
    expect(content).toContain('SOURCE SCAN VERIFIED');
    expect(content).toContain('RUNTIME VERIFIED FOR NAMED ROUTES / SCENARIOS');
    expect(content).toContain('OWNER / HOSTING CONFIRMATION NEEDED');
    expect(content).toContain('QUALIFIED COUNSEL REVIEW REQUIRED');

    expect(content).toContain('src/pages/privacy.astro');
    expect(content).toContain('src/pages/terms.astro');
    expect(content).toContain('src/pages/disclaimer.astro');
  });

  it('5. Source pages exist and reflect accurate owner-confirmed identity, retention, and commission transparency', () => {
    const privacyPath = path.join(rootDir, 'new-app/src/pages/privacy.astro');
    const termsPath = path.join(rootDir, 'new-app/src/pages/terms.astro');
    const disclaimerPath = path.join(rootDir, 'new-app/src/pages/disclaimer.astro');
    const commissionPath = path.join(rootDir, 'new-app/src/pages/commission-disclosure.astro');

    expect(fs.existsSync(commissionPath)).toBe(true);

    const privacyContent = fs.readFileSync(privacyPath, 'utf8');
    const termsContent = fs.readFileSync(termsPath, 'utf8');
    const disclaimerContent = fs.readFileSync(disclaimerPath, 'utf8');
    const commissionContent = fs.readFileSync(commissionPath, 'utf8');

    // Privacy assertions
    expect(privacyContent).not.toContain('complies with the principles of the Digital Personal Data Protection Act');
    expect(privacyContent).not.toContain('under any circumstances');
    expect(privacyContent).not.toContain('Privacy Officer');
    expect(privacyContent).toContain('Verified Website Data Practices');
    expect(privacyContent).toContain('Protect Your Sensitive Financial Credentials');
    expect(privacyContent).toContain('intended enquiry-retention schedule');
    expect(privacyContent).toContain('delete enquiry-only records within 30 days');
    expect(privacyContent).toContain('close the enquiry 90 days after the last follow-up attempt');
    expect(privacyContent).toContain('Hostinger');
    expect(privacyContent).toContain('/commission-disclosure/');

    // Terms assertions
    expect(termsContent).not.toContain('under any circumstances');
    expect(termsContent).toContain('applicable consumer-protection provisions');
    expect(termsContent).toContain('No exclusive Dharmapuri-only jurisdiction is intended');
    expect(termsContent).toContain('governed by the laws of India');
    expect(termsContent).toContain('/privacy/');
    expect(termsContent).toContain('/commission-disclosure/');
    expect(termsContent).toContain('/disclaimer/');
    expect(termsContent).not.toContain('competent courts in Dharmapuri, Tamil Nadu, India');

    // Disclaimer assertions
    expect(disclaimerContent).toContain('Mutual Fund Distribution and Commission Disclosure');
    expect(disclaimerContent).toContain('The Income-tax Act, 2025 came into force on 1 April 2026');
    expect(disclaimerContent).toContain('repeal-and-savings and transitional provisions');
    expect(disclaimerContent).toContain('https://www.amfiindia.com/research-information/commission-disclosure');
    expect(disclaimerContent).toContain('/commission-disclosure/');

    // Commission Disclosure assertions
    expect(commissionContent).toContain('Regular Plans');
    expect(commissionContent).toContain('Direct Plans');
    expect(commissionContent).toContain('trail commission');
    expect(commissionContent).toContain('No Universal AMFI Rate Band');
    expect(commissionContent).toContain('competing schemes');
    expect(commissionContent).toContain('https://www.amfiindia.com/research-information/commission-disclosure');

    // Sole Proprietor Statement across all legal pages and business profile
    const solePropMsg = 'Ant Wealth Creation is a sole proprietorship operated by C. Santhosh Sathriyan';
    expect(BUSINESS_PROFILE.regulatory.soleProprietorStatement).toContain(solePropMsg);
    expect(BUSINESS_PROFILE.regulatory.soleProprietorStatement).toContain('not a separately incorporated company or LLP');
    expect(privacyContent).toContain('regulatory.soleProprietorStatement');
    expect(termsContent).toContain('regulatory.soleProprietorStatement');
    expect(disclaimerContent).toContain('regulatory.soleProprietorStatement');
    expect(commissionContent).toContain('regulatory.soleProprietorStatement');
  });

  /**
   * Test 6: Static source code audit across all application source files.
   *
   * SCOPE & LIMITS:
   * This deterministic static check verifies the absence of direct executable source invocations
   * of storage and networking APIs across all .astro, .ts, .tsx, .js, and .mjs files under src/
   * using a static regex/pattern scan.
   * Note that static regex/pattern scans cannot theoretically prove the absence of arbitrary dynamic
   * or obfuscated runtime calls; therefore, this test is complemented by the dynamic Playwright
   * runtime test suite (phase35_1_runtime_privacy_evidence.spec.ts) which instruments and observes
   * actual browser execution across calculator user interactions.
   */
  it('6. Client source code audit proves zero executable calls to fetch, XMLHttpRequest, sendBeacon, localStorage, sessionStorage, indexedDB, or document.cookie via static regex/pattern scan', () => {
    const srcDir = path.join(rootDir, 'new-app/src');

    function walk(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results = results.concat(walk(full));
        } else if (/\.(astro|ts|tsx|js|mjs)$/.test(file)) {
          results.push(full);
        }
      }
      return results;
    }

    const files = walk(srcDir);
    expect(files.length).toBeGreaterThan(20);

    const forbiddenExecutablePatterns = [
      { name: 'localStorage invocation', regex: /\blocalStorage\s*\.\s*(setItem|getItem|removeItem|clear|key)\b/ },
      { name: 'window.localStorage reference', regex: /\bwindow\s*\.\s*localStorage\b/ },
      { name: 'sessionStorage invocation', regex: /\bsessionStorage\s*\.\s*(setItem|getItem|removeItem|clear|key)\b/ },
      { name: 'window.sessionStorage reference', regex: /\bwindow\s*\.\s*sessionStorage\b/ },
      { name: 'document.cookie assignment', regex: /\bdocument\s*\.\s*cookie\s*=/ },
      { name: 'indexedDB.open call', regex: /\b(window\s*\.\s*)?indexedDB\s*\.\s*open\b/ },
      { name: 'fetch() call', regex: /\bfetch\s*\(/ },
      { name: 'XMLHttpRequest instantiation', regex: /\bnew\s+XMLHttpRequest\b/ },
      { name: 'sendBeacon invocation', regex: /\b(navigator\s*\.\s*)?sendBeacon\s*\(/ },
    ];

    const violations: { file: string; pattern: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const { name, regex } of forbiddenExecutablePatterns) {
        if (regex.test(content)) {
          violations.push({ file: path.relative(srcDir, file), pattern: name });
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
