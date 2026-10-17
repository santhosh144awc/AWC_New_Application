import { describe, it, expect } from 'vitest';
import {
  effectiveAnnualToMonthlyRate,
  getInvestmentRateDetails,
  FinanceValidationError,
} from '../../src/domain/finance';

describe('investmentRates Domain Engine', () => {
  describe('Authoritative Reference Vectors (ENGINE_TEST_VECTOR_REGISTER.csv)', () => {
    it('VEC-RATE-1: converts 12% effective annual return to monthly equivalent rate', () => {
      const monthlyRate = effectiveAnnualToMonthlyRate(12.0);
      const expected = 0.009488792934583046;
      expect(Math.abs(monthlyRate - expected)).toBeLessThanOrEqual(1e-10);
    });

    it('VEC-RATE-2: handles 0% annual growth boundary with exact zero return', () => {
      const monthlyRate = effectiveAnnualToMonthlyRate(0.0);
      expect(monthlyRate).toBe(0.0);
    });

    it('VEC-RATE-3: converts 8% effective annual return accurately', () => {
      const monthlyRate = effectiveAnnualToMonthlyRate(8.0);
      const expected = 0.00643403011000343;
      expect(Math.abs(monthlyRate - expected)).toBeLessThanOrEqual(1e-10);
    });
  });

  describe('Mathematical Properties & Invariants', () => {
    it('compounds monthly rate for 12 periods back to exact annual effective decimal', () => {
      const testRates = [1, 5, 8, 12, 15, 20, 50, 100];
      for (const r of testRates) {
        const i = effectiveAnnualToMonthlyRate(r);
        const compounded = Math.pow(1 + i, 12) - 1;
        const expectedDecimal = r / 100;
        expect(Math.abs(compounded - expectedDecimal)).toBeLessThan(1e-12);
      }
    });

    it('highlights geometric compounding vs nominal annual division', () => {
      const details = getInvestmentRateDetails(12.0);
      expect(details.annualRatePercent).toBe(12.0);
      expect(details.annualEffectiveDecimal).toBe(0.12);
      // Effective monthly is strictly less than nominal (0.01 vs ~0.009488)
      expect(details.effectiveMonthlyRate).toBeLessThan(details.nominalMonthlyRate);
      expect(details.nominalMonthlyRate).toBe(0.01);
    });

    it('handles negative annual returns down to -99%', () => {
      const monthlyRate = effectiveAnnualToMonthlyRate(-20.0);
      // (1 - 0.20)^(1/12) - 1 is negative
      expect(monthlyRate).toBeLessThan(0);
      const compounded = Math.pow(1 + monthlyRate, 12) - 1;
      expect(Math.abs(compounded - (-0.20))).toBeLessThan(1e-12);
    });
  });

  describe('Input Validation & Error Handling', () => {
    it('rejects non-finite inputs (NaN, Infinity, -Infinity)', () => {
      expect(() => effectiveAnnualToMonthlyRate(NaN)).toThrow(FinanceValidationError);
      expect(() => effectiveAnnualToMonthlyRate(Infinity)).toThrow(FinanceValidationError);
      expect(() => effectiveAnnualToMonthlyRate(-Infinity)).toThrow(FinanceValidationError);
    });

    it('rejects rate <= -100%', () => {
      expect(() => effectiveAnnualToMonthlyRate(-100)).toThrow(FinanceValidationError);
      expect(() => effectiveAnnualToMonthlyRate(-120)).toThrow(FinanceValidationError);
    });

    it('rejects extreme rates > 1000%', () => {
      expect(() => effectiveAnnualToMonthlyRate(1001)).toThrow(FinanceValidationError);
    });
  });
});
