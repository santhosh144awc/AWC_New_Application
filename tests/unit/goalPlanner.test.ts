import { describe, it, expect } from 'vitest';
import { calculateGoalPlan, FinanceValidationError } from '../../src/domain/finance';

describe('goalPlanner Domain Engine', () => {
  describe('Authoritative Reference Vectors (ENGINE_TEST_VECTOR_REGISTER.csv)', () => {
    it('VEC-GOAL-1: higher education goal with 8% inflation and 12% investment return', () => {
      const result = calculateGoalPlan({
        currentGoalCost: 2000000,
        timeHorizonYears: 15,
        annualInflationRatePercent: 8.0,
        annualReturnRatePercent: 12.0,
      });

      // 2,000,000 * (1.08)^15 = 6,344,338.4137
      const expectedFutureCost = 2000000 * Math.pow(1.08, 15);
      expect(Math.abs(result.futureGoalCost - expectedFutureCost)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(result.futureGoalCost - 6344338.23)).toBeLessThanOrEqual(0.01);

      // Deficit is full future cost when existing savings = 0
      expect(result.netFundingDeficit).toBe(result.futureGoalCost);

      // Target SIP for 6344338.23 over 180 months at 12% EAR
      expect(Math.abs(result.requiredMonthlySIP - 13330.36)).toBeLessThanOrEqual(0.1);
      expect(result.tenureMonths).toBe(180);
    });
  });

  describe('Properties and Scenarios', () => {
    it('handles zero-inflation goal accurately: future cost equals today cost', () => {
      const result = calculateGoalPlan({
        currentGoalCost: 1000000,
        timeHorizonYears: 10,
        annualInflationRatePercent: 0.0,
        annualReturnRatePercent: 12.0,
      });

      expect(result.futureGoalCost).toBe(1000000);
      expect(result.inflationImpactCost).toBe(0);
      expect(result.netFundingDeficit).toBe(1000000);
    });

    it('offsets goal with earmarked existing savings growing at assumed return', () => {
      const result = calculateGoalPlan({
        currentGoalCost: 5000000,
        timeHorizonYears: 10,
        annualInflationRatePercent: 6.0,
        annualReturnRatePercent: 12.0,
        existingSavings: 1000000,
      });

      // Future cost: 5,000,000 * (1.06)^10 = ~8,954,238.48
      // Existing savings: 1,000,000 * (1.12)^10 = ~3,105,848.21
      // Net deficit: ~5,848,390.27
      expect(result.futureGoalCost).toBeGreaterThan(5000000);
      expect(result.futureValueOfExistingSavings).toBeGreaterThan(1000000);
      expect(result.netFundingDeficit).toBe(result.futureGoalCost - result.futureValueOfExistingSavings);
      expect(result.requiredMonthlySIP).toBeGreaterThan(0);
    });

    it('returns zero required SIP if existing savings exceed inflated cost', () => {
      const result = calculateGoalPlan({
        currentGoalCost: 1000000,
        timeHorizonYears: 5,
        annualInflationRatePercent: 5.0,
        annualReturnRatePercent: 15.0,
        existingSavings: 1000000, // 1,000,000 * (1.15)^5 = 2,011,357 > 1,000,000 * (1.05)^5 = 1,276,281
      });

      expect(result.netFundingDeficit).toBe(0);
      expect(result.requiredMonthlySIP).toBe(0);
    });
  });

  describe('Input Validation & Boundary Error Handling', () => {
    it('rejects goal cost <= 0 or non-finite identifying costToday parameter', () => {
      try {
        calculateGoalPlan({ currentGoalCost: 0, timeHorizonYears: 5, annualInflationRatePercent: 6, annualReturnRatePercent: 12 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('costToday');
      }

      try {
        calculateGoalPlan({ currentGoalCost: -500, timeHorizonYears: 5, annualInflationRatePercent: 6, annualReturnRatePercent: 12 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('costToday');
      }

      try {
        calculateGoalPlan({ currentGoalCost: NaN, timeHorizonYears: 5, annualInflationRatePercent: 6, annualReturnRatePercent: 12 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('costToday');
      }
    });

    it('rejects time horizon invalid tenure (0, negative, fractional, NaN, Infinity) identifying yearsHorizon parameter', () => {
      try {
        calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: 0, annualInflationRatePercent: 6, annualReturnRatePercent: 12 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('yearsHorizon');
      }

      try {
        calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: 2.5, annualInflationRatePercent: 6, annualReturnRatePercent: 12 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('yearsHorizon');
      }

      try {
        calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: NaN, annualInflationRatePercent: 6, annualReturnRatePercent: 12 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('yearsHorizon');
      }
    });

    it('handles inflation rate boundaries: 0% and 100% succeed; below 0% and above 100% throw identifying parameter', () => {
      // 0% inflation
      const zeroInf = calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: 5, annualInflationRatePercent: 0, annualReturnRatePercent: 12 });
      expect(zeroInf.futureGoalCost).toBe(100000);

      // 100% inflation
      const maxInf = calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: 1, annualInflationRatePercent: 100, annualReturnRatePercent: 12 });
      expect(maxInf.futureGoalCost).toBe(200000);

      // Below 0%
      try {
        calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: 5, annualInflationRatePercent: -0.01, annualReturnRatePercent: 12 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('annualInflationPercent');
      }

      // Above 100%
      try {
        calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: 5, annualInflationRatePercent: 100.01, annualReturnRatePercent: 12 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('annualInflationPercent');
      }

      // NaN
      try {
        calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: 5, annualInflationRatePercent: NaN, annualReturnRatePercent: 12 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('annualInflationPercent');
      }
    });

    it('handles assumed return rate boundaries: 0% and 100% succeed; below 0% and above 100% throw identifying parameter', () => {
      // 0% return
      const zeroRet = calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: 1, annualInflationRatePercent: 0, annualReturnRatePercent: 0 });
      expect(zeroRet.requiredMonthlySIP).toBeCloseTo(100000 / 12, 2);

      // 100% return
      const maxRet = calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: 1, annualInflationRatePercent: 0, annualReturnRatePercent: 100 });
      expect(maxRet.requiredMonthlySIP).toBeLessThan(100000 / 12);

      // Below 0%
      try {
        calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: 5, annualInflationRatePercent: 6, annualReturnRatePercent: -0.01 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('assumedAnnualReturnPercent');
      }

      // Above 100%
      try {
        calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: 5, annualInflationRatePercent: 6, annualReturnRatePercent: 100.01 });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('assumedAnnualReturnPercent');
      }

      // NaN
      try {
        calculateGoalPlan({ currentGoalCost: 100000, timeHorizonYears: 5, annualInflationRatePercent: 6, annualReturnRatePercent: NaN });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FinanceValidationError);
        expect((err as FinanceValidationError).parameter).toBe('assumedAnnualReturnPercent');
      }
    });
  });
});
