import { describe, it, expect } from 'vitest';
import { calculateSIP, FinanceValidationError } from '../../src/domain/finance';

describe('sip Domain Engine', () => {
  describe('Authoritative Reference Vectors (ENGINE_TEST_VECTOR_REGISTER.csv)', () => {
    it('VEC-SIP-1: fixed 10-year monthly SIP at 12% effective annual return', () => {
      const result = calculateSIP({
        monthlyInstallment: 5000,
        tenureMonths: 120,
        annualReturnRatePercent: 12.0,
      });

      const expectedFV = 1120179.4478;
      const expectedInvested = 600000;
      const expectedGain = 520179.4478;

      expect(result.totalInvested).toBe(expectedInvested);
      expect(Math.abs(result.futureValue - expectedFV)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(result.totalGain - expectedGain)).toBeLessThanOrEqual(0.01);
      expect(result.futureValue).toBe(result.totalInvested + result.totalGain);
    });

    it('VEC-SIP-2: zero growth rate boundary condition (0% return)', () => {
      const result = calculateSIP({
        monthlyInstallment: 5000,
        tenureMonths: 120,
        annualReturnRatePercent: 0.0,
      });

      expect(result.totalInvested).toBe(600000);
      expect(result.futureValue).toBe(600000);
      expect(result.totalGain).toBe(0);
    });

    it('VEC-SIP-3: 10% annual step-up SIP (Month 1-12 at base, Month 13-24 stepped up)', () => {
      const result = calculateSIP({
        monthlyInstallment: 10000,
        tenureMonths: 24,
        annualReturnRatePercent: 12.0,
        annualStepUpPercent: 10.0,
        generateSchedule: true,
      });

      // Verify that step-up applies at month 13, NOT month 1
      expect(result.monthlySchedule![0].monthlyInstallment).toBe(10000);
      expect(result.monthlySchedule![11].monthlyInstallment).toBe(10000);
      expect(result.monthlySchedule![12].monthlyInstallment).toBe(11000);
      expect(result.monthlySchedule![23].monthlyInstallment).toBe(11000);

      // Total invested = 12 * 10000 + 12 * 11000 = 252000
      expect(result.totalInvested).toBe(252000);

      // Future value cross-check against independent annuity-due cash flow accumulation
      const expectedFV = 283416.25;
      expect(Math.abs(result.futureValue - expectedFV)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(result.totalGain - (expectedFV - 252000))).toBeLessThanOrEqual(0.01);
      expect(result.futureValue).toBe(result.totalInvested + result.totalGain);
    });
  });

  describe('Boundary Conditions and Schedule Invariants', () => {
    it('calculates 1-month single contribution accurately: FV = P * (1 + i)', () => {
      const result = calculateSIP({
        monthlyInstallment: 10000,
        tenureMonths: 1,
        annualReturnRatePercent: 12.0,
      });

      const i = Math.pow(1.12, 1 / 12) - 1;
      const expectedFV = 10000 * (1 + i);
      expect(Math.abs(result.futureValue - expectedFV)).toBeLessThanOrEqual(1e-6);
      expect(result.totalInvested).toBe(10000);
    });

    it('multi-year step-up boundaries (month 12/13, 24/25, 36/37)', () => {
      const result = calculateSIP({
        monthlyInstallment: 10000,
        tenureMonths: 36,
        annualReturnRatePercent: 10.0,
        annualStepUpPercent: 10.0,
        generateSchedule: true,
      });

      const schedule = result.monthlySchedule!;
      expect(schedule).toHaveLength(36);

      // Year 1 (months 1-12): 10,000
      expect(schedule[0].monthlyInstallment).toBe(10000);
      expect(schedule[11].monthlyInstallment).toBe(10000);

      // Year 2 (months 13-24): 11,000 (10000 * 1.1)
      expect(schedule[12].monthlyInstallment).toBe(11000);
      expect(schedule[23].monthlyInstallment).toBe(11000);

      // Year 3 (months 25-36): 12,100 (11000 * 1.1)
      expect(Math.abs(schedule[24].monthlyInstallment - 12100)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(schedule[35].monthlyInstallment - 12100)).toBeLessThanOrEqual(1e-6);

      // Yearly schedule has 3 rows
      expect(result.yearlySchedule).toHaveLength(3);
      expect(result.yearlySchedule![0].year).toBe(1);
      expect(result.yearlySchedule![1].year).toBe(2);
      expect(result.yearlySchedule![2].year).toBe(3);
    });

    it('schedule invariant: sum of monthly contributions equals totalInvested', () => {
      const result = calculateSIP({
        monthlyInstallment: 7500,
        tenureMonths: 36,
        annualReturnRatePercent: 15.0,
        annualStepUpPercent: 5.0,
        generateSchedule: true,
      });

      const sumMonthly = result.monthlySchedule!.reduce((acc, m) => acc + m.monthlyInstallment, 0);
      expect(sumMonthly).toBe(result.totalInvested);
    });
  });

  describe('Input Validation & Error Handling', () => {
    it('rejects negative or non-finite installment amounts', () => {
      expect(() => calculateSIP({ monthlyInstallment: -100, tenureMonths: 60, annualReturnRatePercent: 12 }))
        .toThrow(FinanceValidationError);
      expect(() => calculateSIP({ monthlyInstallment: NaN, tenureMonths: 60, annualReturnRatePercent: 12 }))
        .toThrow(FinanceValidationError);
    });

    it('rejects non-positive or non-integer tenure', () => {
      expect(() => calculateSIP({ monthlyInstallment: 5000, tenureMonths: 0, annualReturnRatePercent: 12 }))
        .toThrow(FinanceValidationError);
      expect(() => calculateSIP({ monthlyInstallment: 5000, tenureMonths: 12.5, annualReturnRatePercent: 12 }))
        .toThrow(FinanceValidationError);
    });

    it('rejects step-up < 0 or > 100', () => {
      expect(() => calculateSIP({ monthlyInstallment: 5000, tenureMonths: 24, annualReturnRatePercent: 12, annualStepUpPercent: -5 }))
        .toThrow(FinanceValidationError);
      expect(() => calculateSIP({ monthlyInstallment: 5000, tenureMonths: 24, annualReturnRatePercent: 12, annualStepUpPercent: 105 }))
        .toThrow(FinanceValidationError);
    });

    it('handles return rate boundaries: 0% and 100% succeed; below 0% and above 100% throw identifying parameter', () => {
      // Exact minimum boundary: 0%
      const minRes = calculateSIP({ monthlyInstallment: 5000, tenureMonths: 12, annualReturnRatePercent: 0 });
      expect(minRes.futureValue).toBe(60000);
      expect(minRes.totalGain).toBe(0);

      // Exact maximum boundary: 100%
      const maxRes = calculateSIP({ monthlyInstallment: 5000, tenureMonths: 12, annualReturnRatePercent: 100 });
      expect(maxRes.futureValue).toBeGreaterThan(60000);

      // Just below minimum: -0.01%
      try {
        calculateSIP({ monthlyInstallment: 5000, tenureMonths: 12, annualReturnRatePercent: -0.01 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('annualReturnPercent');
      }

      // Just above maximum: 100.01%
      try {
        calculateSIP({ monthlyInstallment: 5000, tenureMonths: 12, annualReturnRatePercent: 100.01 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('annualReturnPercent');
      }

      // Non-finite return: NaN, Infinity
      try {
        calculateSIP({ monthlyInstallment: 5000, tenureMonths: 12, annualReturnRatePercent: NaN });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('annualReturnPercent');
      }

      try {
        calculateSIP({ monthlyInstallment: 5000, tenureMonths: 12, annualReturnRatePercent: Infinity });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('annualReturnPercent');
      }
    });
  });

  describe('UI Headline Number Traceability Regression (Phase 2 Concept C)', () => {
    it('confirms the default illustrative UI vector (₹10,000/mo, 10 yrs, 12% EAR, 0% step-up) matches authoritative engine output', () => {
      const result = calculateSIP({
        monthlyInvestment: 10000,
        tenureMonths: 120,
        annualReturnPercent: 12,
        annualStepUpPercent: 0,
      });

      // Total invested = ₹12,00,000
      expect(result.totalInvested).toBe(1200000);
      // FV = 22,40,358.89559... rounding to ₹22,40,359 in UI presentation
      expect(Math.round(result.futureValue)).toBe(2240359);
      // Total gain = 10,40,358.89559... rounding to ₹10,40,359 in UI presentation
      expect(Math.round(result.totalGain)).toBe(1040359);
      expect(result.futureValue).toBe(result.totalInvested + result.totalGain);
    });

    it('confirms step-up comparative outputs match authoritative engine for 10% step-up vector', () => {
      const stepUpResult = calculateSIP({
        monthlyInvestment: 10000,
        tenureMonths: 120,
        annualReturnPercent: 12,
        annualStepUpPercent: 10,
      });
      const fixedResult = calculateSIP({
        monthlyInvestment: 10000,
        tenureMonths: 120,
        annualReturnPercent: 12,
        annualStepUpPercent: 0,
      });

      // Step-up invested: 19,12,491
      expect(Math.round(stepUpResult.totalInvested)).toBe(1912491);
      // Step-up FV: 32,68,898.48... rounding to ₹32,68,898
      expect(Math.round(stepUpResult.futureValue)).toBe(3268898);
      // Fixed FV: 22,40,358.89... rounding to ₹22,40,359
      expect(Math.round(fixedResult.futureValue)).toBe(2240359);
      // Extra wealth generated: 10,28,539.58... rounding to ₹10,28,540
      expect(Math.round(stepUpResult.futureValue - fixedResult.futureValue)).toBe(1028540);
    });
  });
});
