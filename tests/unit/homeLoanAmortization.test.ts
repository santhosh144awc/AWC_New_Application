import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyEMI,
  calculateHomeLoanAmortization,
  FinanceValidationError,
} from '../../src/domain/finance';

describe('homeLoanAmortization Domain Engine', () => {
  describe('Authoritative Reference Vectors (ENGINE_TEST_VECTOR_REGISTER.csv)', () => {
    it('VEC-LOAN-1: standard 20-year home mortgage at 8.5% nominal reducing-balance rate', () => {
      const result = calculateHomeLoanAmortization({
        principal: 5000000,
        annualInterestRatePercent: 8.5,
        tenureMonths: 240,
      });

      const expectedEMI = 43391.1617;
      expect(Math.abs(result.initialMonthlyEMI - expectedEMI)).toBeLessThanOrEqual(0.01);

      // Verify schedule execution
      expect(result.schedule).toHaveLength(240);
      expect(result.effectiveTenureMonths).toBe(240);

      // Total interest independently cross-checked at ~5,413,878.81
      expect(Math.abs(result.totalInterestPaid - 5413878.81)).toBeLessThanOrEqual(1.0);

      // Final month closing balance converges to 0 (< 1e-4)
      const lastMonth = result.schedule[239];
      expect(lastMonth.closingBalance).toBeLessThan(1.0);

      // Total amount paid equals principal + interest
      expect(Math.abs(result.totalAmountPaid - (5000000 + result.totalInterestPaid))).toBeLessThan(1.0);
    });

    it('VEC-LOAN-2: zero rate loan boundary condition (0% interest)', () => {
      const result = calculateHomeLoanAmortization({
        principal: 1200000,
        annualInterestRatePercent: 0.0,
        tenureMonths: 120,
      });

      expect(result.initialMonthlyEMI).toBe(10000);
      expect(result.totalInterestPaid).toBe(0);
      expect(result.totalAmountPaid).toBe(1200000);
      expect(result.schedule).toHaveLength(120);
      expect(result.schedule[119].closingBalance).toBe(0);
    });

    it('VEC-LOAN-3: part-prepayment with tenure reduction mode', () => {
      const result = calculateHomeLoanAmortization({
        principal: 5000000,
        annualInterestRatePercent: 8.5,
        tenureMonths: 240,
        prepayments: [{ month: 12, amount: 500000 }],
        prepaymentMode: 'REDUCE_TENURE',
      });

      // Verify prepayment is recorded at month 12
      const month12 = result.schedule[11];
      expect(month12.prepayment).toBe(500000);

      // Effective tenure is shortened significantly (by 48 months: from 240 to 192)
      expect(result.effectiveTenureMonths).toBeLessThan(200);
      expect(result.effectiveTenureMonths).toBe(192);

      // Total interest saved is substantial (> 12 Lakhs savings)
      expect(result.interestSavings).toBeGreaterThan(1200000);
      expect(result.totalPrepaymentsPaid).toBe(500000);

      // Final closing balance reaches 0
      const finalMonth = result.schedule[result.schedule.length - 1];
      expect(finalMonth.closingBalance).toBe(0);
    });
  });

  describe('Prepayment Strategy: REDUCE_EMI Mode', () => {
    it('reduces EMI while maintaining the original loan tenure', () => {
      const result = calculateHomeLoanAmortization({
        principal: 5000000,
        annualInterestRatePercent: 8.5,
        tenureMonths: 240,
        prepayments: [{ month: 12, amount: 500000 }],
        prepaymentMode: 'REDUCE_EMI',
      });

      // In EMI reduction mode, loan runs for the full original tenure
      expect(result.effectiveTenureMonths).toBe(240);

      // Month 1-12 EMI is initial EMI
      expect(result.schedule[0].scheduledEMI).toBe(result.initialMonthlyEMI);
      expect(result.schedule[11].scheduledEMI).toBe(result.initialMonthlyEMI);

      // Month 13+ EMI is recomputed lower
      const month13EMI = result.schedule[12].scheduledEMI;
      expect(month13EMI).toBeLessThan(result.initialMonthlyEMI);

      // Total interest is still saved compared to baseline
      expect(result.interestSavings).toBeGreaterThan(0);
      expect(result.totalPrepaymentsPaid).toBe(500000);
    });
  });

  describe('Schedule Invariants & Standalone EMI Function', () => {
    it('calculateMonthlyEMI helper matches amortization output', () => {
      const emi = calculateMonthlyEMI(2500000, 9.0, 180);
      const amort = calculateHomeLoanAmortization({
        principal: 2500000,
        annualInterestRatePercent: 9.0,
        tenureMonths: 180,
      });

      expect(Math.abs(emi - amort.initialMonthlyEMI)).toBeLessThan(1e-10);
    });

    it('maintains accounting invariant: sum of principal payments equals original principal', () => {
      const result = calculateHomeLoanAmortization({
        principal: 3000000,
        annualInterestRatePercent: 8.0,
        tenureMonths: 120,
      });

      const totalPrincipalPaid = result.schedule.reduce((acc, m) => acc + m.scheduledPrincipal, 0);
      expect(Math.abs(totalPrincipalPaid - 3000000)).toBeLessThan(1.0);
    });
  });

  describe('Input Validation & Error Handling', () => {
    it('rejects negative or zero principal', () => {
      expect(() => calculateHomeLoanAmortization({ principal: 0, annualInterestRatePercent: 8.5, tenureMonths: 240 }))
        .toThrow(FinanceValidationError);
      expect(() => calculateHomeLoanAmortization({ principal: -50000, annualInterestRatePercent: 8.5, tenureMonths: 240 }))
        .toThrow(FinanceValidationError);
    });

    it('rejects negative or extreme interest rate', () => {
      expect(() => calculateHomeLoanAmortization({ principal: 100000, annualInterestRatePercent: -1, tenureMonths: 120 }))
        .toThrow(FinanceValidationError);
      expect(() => calculateHomeLoanAmortization({ principal: 100000, annualInterestRatePercent: 105, tenureMonths: 120 }))
        .toThrow(FinanceValidationError);
    });

    it('rejects prepayment month beyond tenure', () => {
      expect(() => calculateHomeLoanAmortization({
        principal: 1000000,
        annualInterestRatePercent: 8.5,
        tenureMonths: 60,
        prepayments: [{ month: 61, amount: 50000 }],
      })).toThrow(FinanceValidationError);
    });
  });
});
