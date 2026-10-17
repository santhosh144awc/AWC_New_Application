import { describe, it, expect } from 'vitest';
import { calculateTargetCorpus, calculateSIP, FinanceValidationError } from '../../src/domain/finance';

describe('targetCorpus Domain Engine', () => {
  describe('Authoritative Reference Vectors (ENGINE_TEST_VECTOR_REGISTER.csv)', () => {
    it('VEC-TARGET-1: required monthly SIP for 10 Lakh target over 10 years at 12% EAR', () => {
      const result = calculateTargetCorpus({
        targetCorpus: 1000000,
        tenureMonths: 120,
        annualReturnRatePercent: 12.0,
      });

      const expectedSIP = 4463.5706;
      expect(Math.abs(result.requiredMonthlySIP - expectedSIP)).toBeLessThanOrEqual(0.01);
      expect(result.netTargetDeficit).toBe(1000000);
      expect(result.futureValueOfExistingSavings).toBe(0);
    });

    it('VEC-TARGET-2: zero rate growth boundary (0% return)', () => {
      const result = calculateTargetCorpus({
        targetCorpus: 1200000,
        tenureMonths: 120,
        annualReturnRatePercent: 0.0,
      });

      expect(result.requiredMonthlySIP).toBe(10000);
      expect(result.totalInvestedViaSIP).toBe(1200000);
    });

    it('VEC-TARGET-3: target corpus with existing invested capital offset', () => {
      const result = calculateTargetCorpus({
        targetCorpus: 1000000,
        tenureMonths: 60,
        annualReturnRatePercent: 12.0,
        existingSavings: 200000,
      });

      // 200,000 compounded for 5 years at 12%: 200,000 * 1.12^5 = 352,468.34
      // Remaining deficit: 1,000,000 - 352,468.34 = 647,531.66
      // Required SIP to accumulate deficit in 60 months at 12%:
      const expectedSIP = 7984.0052;
      expect(Math.abs(result.requiredMonthlySIP - expectedSIP)).toBeLessThanOrEqual(0.01);
      expect(result.futureValueOfExistingSavings).toBeGreaterThan(200000);
      expect(result.netTargetDeficit).toBe(result.targetCorpus - result.futureValueOfExistingSavings);
    });
  });

  describe('Mathematical Duality with SIP Accumulation Engine', () => {
    it('achieves exact target corpus when required SIP is accumulated in calculateSIP', () => {
      const target = 2500000;
      const months = 180;
      const rate = 13.5;

      const solved = calculateTargetCorpus({
        targetCorpus: target,
        tenureMonths: months,
        annualReturnRatePercent: rate,
      });

      const forwardSIP = calculateSIP({
        monthlyInstallment: solved.requiredMonthlySIP,
        tenureMonths: months,
        annualReturnRatePercent: rate,
      });

      // Target corpus achieved within 1e-3 currency unit tolerance
      expect(Math.abs(forwardSIP.futureValue - target)).toBeLessThanOrEqual(1e-3);
    });

    it('returns zero required SIP if existing savings already grow to meet target', () => {
      const result = calculateTargetCorpus({
        targetCorpus: 500000,
        tenureMonths: 120,
        annualReturnRatePercent: 12.0,
        existingSavings: 300000, // 300000 * (1.12)^10 = ~931,754 > 500,000
      });

      expect(result.netTargetDeficit).toBe(0);
      expect(result.requiredMonthlySIP).toBe(0);
      expect(result.totalInvestedViaSIP).toBe(0);
    });
  });

  describe('Input Validation & Error Handling', () => {
    it('rejects target corpus <= 0 or non-finite', () => {
      expect(() => calculateTargetCorpus({ targetCorpus: 0, tenureMonths: 60, annualReturnRatePercent: 12 }))
        .toThrow(FinanceValidationError);
      expect(() => calculateTargetCorpus({ targetCorpus: -500, tenureMonths: 60, annualReturnRatePercent: 12 }))
        .toThrow(FinanceValidationError);
      expect(() => calculateTargetCorpus({ targetCorpus: NaN, tenureMonths: 60, annualReturnRatePercent: 12 }))
        .toThrow(FinanceValidationError);
    });

    it('rejects negative existing savings', () => {
      expect(() => calculateTargetCorpus({ targetCorpus: 100000, tenureMonths: 60, annualReturnRatePercent: 12, existingSavings: -100 }))
        .toThrow(FinanceValidationError);
    });
  });
});
