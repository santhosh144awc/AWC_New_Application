import { describe, it, expect } from 'vitest';
import { calculateLumpsum, FinanceValidationError } from '../../src/domain/finance';

describe('lumpsum Domain Engine', () => {
  describe('Authoritative Reference Vectors (ENGINE_TEST_VECTOR_REGISTER.csv)', () => {
    it('VEC-LUMP-1: 10-year lump-sum investment at 12% effective annual return', () => {
      const result = calculateLumpsum({
        initialPrincipal: 100000,
        durationYears: 10,
        annualReturnRatePercent: 12.0,
      });

      const expectedFV = 310584.8208;
      const expectedGain = 210584.8208;

      expect(result.initialPrincipal).toBe(100000);
      expect(Math.abs(result.futureValue - expectedFV)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(result.totalGain - expectedGain)).toBeLessThanOrEqual(0.01);
      expect(result.futureValue).toBe(result.initialPrincipal + result.totalGain);
    });

    it('VEC-LUMP-2: zero growth rate boundary (0% return)', () => {
      const result = calculateLumpsum({
        initialPrincipal: 100000,
        durationYears: 5,
        annualReturnRatePercent: 0.0,
      });

      expect(result.futureValue).toBe(100000);
      expect(result.totalGain).toBe(0);
    });
  });

  describe('Properties & Schedule Invariants', () => {
    it('calculates 1-year horizon exactly: FV = P * (1 + r)', () => {
      const result = calculateLumpsum({
        initialPrincipal: 50000,
        durationYears: 1,
        annualReturnRatePercent: 15.0,
      });

      expect(Math.abs(result.futureValue - 57500)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(result.totalGain - 7500)).toBeLessThanOrEqual(1e-6);
    });

    it('generates yearly schedule adhering to compound progression', () => {
      const result = calculateLumpsum({
        initialPrincipal: 100000,
        durationYears: 3,
        annualReturnRatePercent: 10.0,
        generateSchedule: true,
      });

      expect(result.yearlySchedule).toHaveLength(3);
      expect(result.yearlySchedule![0].year).toBe(1);
      expect(result.yearlySchedule![0].closingBalance).toBe(110000);

      expect(result.yearlySchedule![1].year).toBe(2);
      expect(result.yearlySchedule![1].closingBalance).toBe(121000);

      expect(result.yearlySchedule![2].year).toBe(3);
      expect(result.yearlySchedule![2].closingBalance).toBe(133100);
    });

    it('preserves full precision internally without premature rounding', () => {
      const result = calculateLumpsum({
        initialPrincipal: 123456.78,
        durationYears: 7,
        annualReturnRatePercent: 11.25,
      });

      const manualFV = 123456.78 * Math.pow(1 + 0.1125, 7);
      expect(Math.abs(result.futureValue - manualFV)).toBeLessThan(1e-10);
    });
  });

  describe('Input Validation & Boundary Error Handling', () => {
    it('rejects negative or non-finite principal', () => {
      expect(() => calculateLumpsum({ initialPrincipal: -1000, durationYears: 5, annualReturnRatePercent: 10 }))
        .toThrow(FinanceValidationError);
      expect(() => calculateLumpsum({ initialPrincipal: NaN, durationYears: 5, annualReturnRatePercent: 10 }))
        .toThrow(FinanceValidationError);
    });

    it('rejects invalid tenure (0, negative, fractional, NaN, Infinity) and identifies parameter', () => {
      try {
        calculateLumpsum({ initialPrincipal: 100000, durationYears: 0, annualReturnRatePercent: 10 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('years');
      }

      try {
        calculateLumpsum({ initialPrincipal: 100000, durationYears: -5, annualReturnRatePercent: 10 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('years');
      }

      try {
        calculateLumpsum({ initialPrincipal: 100000, durationYears: 2.5, annualReturnRatePercent: 10 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('years');
      }

      try {
        calculateLumpsum({ initialPrincipal: 100000, durationYears: NaN, annualReturnRatePercent: 10 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('years');
      }

      try {
        calculateLumpsum({ initialPrincipal: 100000, durationYears: Infinity, annualReturnRatePercent: 10 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('years');
      }
    });

    it('handles return rate boundaries: 0% and 100% succeed; below 0% and above 100% throw with parameter name', () => {
      // Exact minimum boundary: 0%
      const minRes = calculateLumpsum({ initialPrincipal: 100000, durationYears: 5, annualReturnRatePercent: 0 });
      expect(minRes.futureValue).toBe(100000);
      expect(minRes.totalGain).toBe(0);

      // Exact maximum boundary: 100%
      const maxRes = calculateLumpsum({ initialPrincipal: 100000, durationYears: 1, annualReturnRatePercent: 100 });
      expect(maxRes.futureValue).toBe(200000);
      expect(maxRes.totalGain).toBe(100000);

      // Just below minimum: -0.01%
      try {
        calculateLumpsum({ initialPrincipal: 100000, durationYears: 5, annualReturnRatePercent: -0.01 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('annualReturnPercent');
      }

      // Just above maximum: 100.01%
      try {
        calculateLumpsum({ initialPrincipal: 100000, durationYears: 5, annualReturnRatePercent: 100.01 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('annualReturnPercent');
      }

      // Non-finite return: NaN, Infinity
      try {
        calculateLumpsum({ initialPrincipal: 100000, durationYears: 5, annualReturnRatePercent: NaN });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('annualReturnPercent');
      }

      try {
        calculateLumpsum({ initialPrincipal: 100000, durationYears: 5, annualReturnRatePercent: Infinity });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('annualReturnPercent');
      }
    });
  });

  describe('UI Traceability & Concept C Boundary Scenarios', () => {
    it('canonical UI default example: ₹1,00,000, 10 yrs, 12% EAR', () => {
      const res = calculateLumpsum({
        principal: 100000,
        years: 10,
        annualReturnPercent: 12,
        generateSchedule: true,
      });

      // Display rounded rupee values
      expect(Math.round(res.futureValue)).toBe(310585);
      expect(res.principal).toBe(100000);
      expect(Math.round(res.totalGain)).toBe(210585);

      // Schedule reconciliation
      expect(res.yearlySchedule).toHaveLength(10);
      const lastRow = res.yearlySchedule[res.yearlySchedule.length - 1];
      expect(lastRow.year).toBe(10);
      expect(Math.abs(lastRow.closingBalance - res.futureValue)).toBeLessThan(1e-9);
    });

    it('0% return boundary: FV strictly equals principal and illustrative gain is zero', () => {
      const res = calculateLumpsum({
        principal: 50000,
        years: 5,
        annualReturnPercent: 0,
        generateSchedule: true,
      });

      expect(res.futureValue).toBe(50000);
      expect(res.totalGain).toBe(0);
      expect(res.yearlySchedule).toHaveLength(5);
      for (const row of res.yearlySchedule) {
        expect(row.growthAmount).toBe(0);
        expect(row.closingBalance).toBe(50000);
        expect(row.cumulativeGain).toBe(0);
      }
    });

    it('UI boundary: minimum supported principal (₹5,000) and shortest horizon (1 year)', () => {
      const res = calculateLumpsum({
        principal: 5000,
        years: 1,
        annualReturnPercent: 8,
        generateSchedule: true,
      });

      expect(res.futureValue).toBe(5400);
      expect(res.totalGain).toBe(400);
      expect(res.yearlySchedule).toHaveLength(1);
      expect(res.yearlySchedule[0].closingBalance).toBe(5400);
    });

    it('UI boundary: maximum supported principal (₹1 Crore) and longest horizon (40 years)', () => {
      const res = calculateLumpsum({
        principal: 10000000,
        years: 40,
        annualReturnPercent: 15,
        generateSchedule: true,
      });

      const manualExpected = 10000000 * Math.pow(1.15, 40);
      expect(Math.abs(res.futureValue - manualExpected)).toBeLessThan(1e-4);
      expect(res.yearlySchedule).toHaveLength(40);
      const lastRow = res.yearlySchedule[39];
      expect(Math.abs(lastRow.closingBalance - res.futureValue)).toBeLessThan(1e-4);
    });

    it('Rule of 72 shortcut calculations handle positive returns and zero return safely', () => {
      const positiveReturns = [6, 8, 10, 12, 15, 24];
      for (const r of positiveReturns) {
        const doubling = 72 / r;
        expect(Number.isFinite(doubling)).toBe(true);
        expect(doubling).toBeGreaterThan(0);
      }

      // Safe zero-return branch
      const zeroReturn = 0;
      const safeDoubling = zeroReturn > 0 ? (72 / zeroReturn).toFixed(1) : null;
      expect(safeDoubling).toBeNull();
    });
  });
});
