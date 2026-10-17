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

  describe('Input Validation & Error Handling', () => {
    it('rejects negative or non-finite principal', () => {
      expect(() => calculateLumpsum({ initialPrincipal: -1000, durationYears: 5, annualReturnRatePercent: 10 }))
        .toThrow(FinanceValidationError);
      expect(() => calculateLumpsum({ initialPrincipal: NaN, durationYears: 5, annualReturnRatePercent: 10 }))
        .toThrow(FinanceValidationError);
    });

    it('rejects non-positive duration or non-finite duration', () => {
      expect(() => calculateLumpsum({ initialPrincipal: 100000, durationYears: 0, annualReturnRatePercent: 10 }))
        .toThrow(FinanceValidationError);
      expect(() => calculateLumpsum({ initialPrincipal: 100000, durationYears: Infinity, annualReturnRatePercent: 10 }))
        .toThrow(FinanceValidationError);
    });

    it('rejects rate <= -100%', () => {
      expect(() => calculateLumpsum({ initialPrincipal: 100000, durationYears: 5, annualReturnRatePercent: -100 }))
        .toThrow(FinanceValidationError);
    });
  });
});
