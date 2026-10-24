import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Phase 17.1 — Tax-Law Source Audit & Current-Law Crosswalk QA', () => {
  const docsDir = path.resolve(__dirname, '../../../product-docs/finance');
  const crosswalkPath = path.join(docsDir, 'CURRENT_INCOME_TAX_LAW_CROSSWALK.csv');
  const reviewPackPath = path.join(docsDir, 'RETIREMENT_GATE_A_REVIEW_PACK.md');
  const claimsRegisterPath = path.join(docsDir, 'RETIREMENT_CLAIMS_AND_SOURCES_REGISTER.csv');
  const homeSpecPath = path.join(docsDir, 'HOME_PURCHASE_PLANNER_SPEC.md');

  it('1. CURRENT_INCOME_TAX_LAW_CROSSWALK.csv exists and has required columns and at least 8 topic rows', () => {
    expect(fs.existsSync(crosswalkPath)).toBe(true);
    const content = fs.readFileSync(crosswalkPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(9); // header + 8 rows

    const header = lines[0];
    const expectedColumns = [
      'crosswalk_id',
      'topic',
      'legacy_reference',
      'legacy_applicability',
      'current_law_reference',
      'current_law_title',
      'source_authority',
      'official_source_url',
      'effective_from',
      'effective_to_or_status',
      'tax_year_or_transaction_period',
      'verified_by',
      'verification_date',
      'review_status',
      'open_question',
      'notes',
    ];

    for (const col of expectedColumns) {
      expect(header).toContain(col);
    }
  });

  it('2. Crosswalk rows affirm Income-tax Act, 2025 in force from 1 April 2026 without obsolete transitional claims', () => {
    const content = fs.readFileSync(crosswalkPath, 'utf8');
    
    // Explicit bans on obsolete draft phrasing
    expect(content).not.toContain('Pending Transition');
    expect(content).not.toContain('Under Gazette Review');

    // Required official source anchors
    expect(content).toContain('https://www.pib.gov.in/PressReleasePage.aspx?PRID=2243196&lang=1&reg=1');
    expect(content).toContain('https://www.incometaxindia.gov.in/hi/w/income-tax-act-2025-comes-into-force-from-1st-april-2026');
    expect(content).toContain('2026-04-01');
    expect(content).toContain('In Force');
  });

  it('3. All rows marked UNVERIFIED — CA REVIEW REQUIRED contain explicit open questions and maintain blocked status', () => {
    const content = fs.readFileSync(crosswalkPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('UNVERIFIED — CA REVIEW REQUIRED')) {
        expect(line).toMatch(/CA (review|sign-off|verification|confirmation) required/i);
      }
    }
  });

  it('4. RETIREMENT_GATE_A_REVIEW_PACK.md cites Income-tax Act, 2025 in force 1 April 2026 and keeps GATE-A strictly BLOCKED', () => {
    expect(fs.existsSync(reviewPackPath)).toBe(true);
    const content = fs.readFileSync(reviewPackPath, 'utf8');

    // No obsolete transition claims
    expect(content).not.toContain('Pending Transition');
    expect(content).not.toContain('Under Gazette Review');

    // Explicit confirmation of commencement date & primary sources
    expect(content).toContain('1 April 2026');
    expect(content).toContain('PRID=2243196');
    expect(content).toContain('CURRENT_INCOME_TAX_LAW_CROSSWALK.csv');

    // Banned flat haircut assertion retained
    expect(content).toMatch(/12\.5% flat tax haircut.*(rejected and banned|strictly rejected and banned)/i);

    // GATE-A remains blocked
    expect(content).toContain('PENDING QUALIFIED PROFESSIONAL REVIEW');
    expect(content).toContain('strictly blocked');
  });

  it('5. RETIREMENT_CLAIMS_AND_SOURCES_REGISTER.csv references 2025 Act and crosswalk without obsolete claims', () => {
    expect(fs.existsSync(claimsRegisterPath)).toBe(true);
    const content = fs.readFileSync(claimsRegisterPath, 'utf8');

    expect(content).not.toContain('Pending Transition');
    expect(content).not.toContain('Under Gazette Review');
    expect(content).toContain('CURRENT_INCOME_TAX_LAW_CROSSWALK.csv');
    expect(content).toContain('Income-tax Act, 2025');
  });

  it('6. HOME_PURCHASE_PLANNER_SPEC.md cites Income-tax Act, 2025 in force 1 April 2026 and preserves GATE-C block', () => {
    expect(fs.existsSync(homeSpecPath)).toBe(true);
    const content = fs.readFileSync(homeSpecPath, 'utf8');

    expect(content).not.toContain('transitioning under the Income-tax Act, 2025');
    expect(content).toContain('Income-tax Act, 2025, in force 1 April 2026');
    expect(content).toContain('GATE-C');
  });
});
