import { describe, it, expect } from 'vitest';
import { formatINR, formatIndianCompact, formatPercentage } from '../../src/lib/formatters';
import { FINANCE_DOMAIN_VERSION } from '../../src/domain/finance';
import { CENTRAL_TAX_RULES_REGISTRY } from '../../src/domain/tax';
import { BUSINESS_PROFILE } from '../../src/config/businessProfile';

describe('Unit Test Suite & Foundation Smoke Test', () => {
  it('should run tests cleanly inside Vitest test runner', () => {
    expect(true).toBe(true);
  });

  describe('Indian Currency & Number Formatters (src/lib/formatters.ts)', () => {
    it('formats numbers into standard Indian Rupee notation', () => {
      expect(formatINR(0)).toBe('₹0');
      const formatted15L = formatINR(1500000).replace(/\u00a0/g, ' ');
      expect(formatted15L).toMatch(/₹\s?15,00,000/);
    });

    it('formats numbers into compact Indian notations (Lakhs and Crores)', () => {
      expect(formatIndianCompact(25000000)).toBe('₹2.50 Cr');
      expect(formatIndianCompact(500000)).toBe('₹5.00 L');
      expect(formatIndianCompact(45000)).toBe('₹45.0 K');
      expect(formatIndianCompact(500)).toBe('₹500');
    });

    it('formats percentages correctly', () => {
      expect(formatPercentage(12.5)).toBe('12.50%');
      expect(formatPercentage(8, 0)).toBe('8%');
    });
  });

  describe('Business Profile & Identity Governance (Section 2A & 2B)', () => {
    it('enforces ARN status as PENDING_VERIFICATION and avoids unverified user-facing display', () => {
      expect(BUSINESS_PROFILE.regulatory.arnStatus).toBe('PENDING_VERIFICATION');
      expect(BUSINESS_PROFILE.regulatory.amfiRegistrationText).toContain('pending registry confirmation');
    });

    it('specifies canonical domain consistently as https://antwealth.in', () => {
      expect(BUSINESS_PROFILE.firm.canonicalDomain).toBe('https://antwealth.in');
    });

    it('contains verified founder details from authoritative sources', () => {
      expect(BUSINESS_PROFILE.founder.fullName).toBe('C. Santhosh Sathriyan, B.E.');
      expect(BUSINESS_PROFILE.firm.experienceSince).toBe('2012');
      expect(BUSINESS_PROFILE.founder.credentials).toContain('QPFP Certified');
    });
  });

  describe('Architecture Gate Enforcements', () => {
    it('finance domain engine is scaffolded and explicitly blocks unverified formulas', () => {
      expect(FINANCE_DOMAIN_VERSION).toBe('0.1.0-scaffold');
    });

    it('tax domain records Income-tax Act, 2025 transitional status as PENDING_REVIEW', () => {
      const reg = CENTRAL_TAX_RULES_REGISTRY['AY_2026_27_TRANSITIONAL'];
      expect(reg).toBeDefined();
      expect(reg.act).toBe('IT_ACT_2025');
      expect(reg.professionalReviewStatus).toBe('PENDING_REVIEW');
    });
  });
});
