import { describe, it, expect } from 'vitest';
import {
  calculateFamilySupportPV,
  calculateMilestonePV,
  validateLifeInsuranceInput,
  calculateLifeInsurancePlan,
  ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE,
  type LifeInsuranceInput,
} from '../../src/domain/finance/lifeInsurance';

describe('Phase 18.1 — Life Insurance Protection Needs Domain Engine & Test Vectors', () => {
  describe('Canonical Test Vectors VEC-LIFE-01 through VEC-LIFE-11', () => {
    it('VEC-LIFE-01: Zero support and zero obligations', () => {
      const input: LifeInsuranceInput = {
        annualTakeHomeIncome: 0,
        annualFamilyLivingExpenses: 0,
        supportDurationYears: 1,
        supportExpenseGrowthPct: 0.0,
        investmentReturnPct: 0.0,
        homeLoanOutstanding: 0,
        otherLoansOutstanding: 0,
        otherLiabilities: 0,
        immediateTransitionBuffer: 0,
        futureMilestones: [],
        eligibleEarmarkedFunds: 0,
        existingPersonalLifeCover: 0,
        employerGroupLifeCover: 0,
      };

      const res = calculateLifeInsurancePlan(input);
      expect(res.familySupportPV).toBe(0.0);
      expect(res.milestonesTotalPV).toBe(0.0);
      expect(res.grossProtectionNeed).toBe(0.0);
      expect(res.netProtectionNeedAfterEarmarked).toBe(0.0);
      expect(res.additionalPersonalCoverGap).toBe(0.0);
      expect(res.gapIncludingGroupCover).toBe(0.0);
      expect(res.isFullyCoveredPersonally).toBe(true);
      expect(res.hasEarmarkedSurplus).toBe(false);
    });

    it('VEC-LIFE-02: Flat family support zero growth zero return (PV = C1 * n)', () => {
      const input: LifeInsuranceInput = {
        annualTakeHomeIncome: 1200000,
        annualFamilyLivingExpenses: 600000,
        supportDurationYears: 20,
        supportExpenseGrowthPct: 0.0,
        investmentReturnPct: 0.0,
        homeLoanOutstanding: 0,
        otherLoansOutstanding: 0,
        otherLiabilities: 0,
        immediateTransitionBuffer: 0,
        futureMilestones: [],
        eligibleEarmarkedFunds: 0,
        existingPersonalLifeCover: 0,
        employerGroupLifeCover: 0,
      };

      const res = calculateLifeInsurancePlan(input);
      expect(res.familySupportPV).toBe(12000000.0);
      expect(res.grossProtectionNeed).toBe(12000000.0);
      expect(res.netProtectionNeedAfterEarmarked).toBe(12000000.0);
      expect(res.additionalPersonalCoverGap).toBe(12000000.0);
      expect(res.gapIncludingGroupCover).toBe(12000000.0);
    });

    it('VEC-LIFE-03: Positive return zero growth (r=8%, g=0%)', () => {
      const input: LifeInsuranceInput = {
        annualTakeHomeIncome: 1200000,
        annualFamilyLivingExpenses: 600000,
        supportDurationYears: 20,
        supportExpenseGrowthPct: 0.0,
        investmentReturnPct: 8.0,
        homeLoanOutstanding: 0,
        otherLoansOutstanding: 0,
        otherLiabilities: 0,
        immediateTransitionBuffer: 0,
        futureMilestones: [],
        eligibleEarmarkedFunds: 0,
        existingPersonalLifeCover: 0,
        employerGroupLifeCover: 0,
      };

      const res = calculateLifeInsurancePlan(input);
      expect(res.familySupportPV).toBeCloseTo(5890888.44, 2);
      expect(res.grossProtectionNeed).toBeCloseTo(5890888.44, 2);
      expect(res.additionalPersonalCoverGap).toBeCloseTo(5890888.44, 2);
    });

    it('VEC-LIFE-04: Positive growth and return r > g (r=8%, g=6%)', () => {
      const input: LifeInsuranceInput = {
        annualTakeHomeIncome: 1500000,
        annualFamilyLivingExpenses: 600000,
        supportDurationYears: 20,
        supportExpenseGrowthPct: 6.0,
        investmentReturnPct: 8.0,
        homeLoanOutstanding: 0,
        otherLoansOutstanding: 0,
        otherLiabilities: 0,
        immediateTransitionBuffer: 0,
        futureMilestones: [],
        eligibleEarmarkedFunds: 0,
        existingPersonalLifeCover: 0,
        employerGroupLifeCover: 0,
      };

      const res = calculateLifeInsurancePlan(input);
      expect(res.familySupportPV).toBeCloseTo(9357445.01, 2);
      expect(res.grossProtectionNeed).toBeCloseTo(9357445.01, 2);
      expect(res.additionalPersonalCoverGap).toBeCloseTo(9357445.01, 2);
    });

    it('VEC-LIFE-05: Equal growth and return (r=g=6%) L\'Hopital limit case', () => {
      const input: LifeInsuranceInput = {
        annualTakeHomeIncome: 1500000,
        annualFamilyLivingExpenses: 600000,
        supportDurationYears: 20,
        supportExpenseGrowthPct: 6.0,
        investmentReturnPct: 6.0,
        homeLoanOutstanding: 0,
        otherLoansOutstanding: 0,
        otherLiabilities: 0,
        immediateTransitionBuffer: 0,
        futureMilestones: [],
        eligibleEarmarkedFunds: 0,
        existingPersonalLifeCover: 0,
        employerGroupLifeCover: 0,
      };

      const res = calculateLifeInsurancePlan(input);
      expect(res.familySupportPV).toBeCloseTo(11320754.72, 2);
      expect(res.grossProtectionNeed).toBeCloseTo(11320754.72, 2);
      expect(res.additionalPersonalCoverGap).toBeCloseTo(11320754.72, 2);
    });

    it('VEC-LIFE-06: Growth exceeds return g > r (g=8%, r=6%)', () => {
      const input: LifeInsuranceInput = {
        annualTakeHomeIncome: 1500000,
        annualFamilyLivingExpenses: 600000,
        supportDurationYears: 20,
        supportExpenseGrowthPct: 8.0,
        investmentReturnPct: 6.0,
        homeLoanOutstanding: 0,
        otherLoansOutstanding: 0,
        otherLiabilities: 0,
        immediateTransitionBuffer: 0,
        futureMilestones: [],
        eligibleEarmarkedFunds: 0,
        existingPersonalLifeCover: 0,
        employerGroupLifeCover: 0,
      };

      const res = calculateLifeInsurancePlan(input);
      expect(res.familySupportPV).toBeCloseTo(13599254.08, 2);
      expect(res.grossProtectionNeed).toBeCloseTo(13599254.08, 2);
      expect(res.additionalPersonalCoverGap).toBeCloseTo(13599254.08, 2);
    });

    it('VEC-LIFE-07: Zero return with future milestone (r=0%, g=6%, t=10)', () => {
      const input: LifeInsuranceInput = {
        annualTakeHomeIncome: 1000000,
        annualFamilyLivingExpenses: 0,
        supportDurationYears: 1,
        supportExpenseGrowthPct: 0.0,
        investmentReturnPct: 0.0,
        homeLoanOutstanding: 0,
        otherLoansOutstanding: 0,
        otherLiabilities: 0,
        immediateTransitionBuffer: 0,
        futureMilestones: [
          {
            id: 'm1',
            name: 'Education',
            costToday: 2000000,
            yearsUntilGoal: 10,
            inflationRatePct: 6.0,
          },
        ],
        eligibleEarmarkedFunds: 0,
        existingPersonalLifeCover: 0,
        employerGroupLifeCover: 0,
      };

      const res = calculateLifeInsurancePlan(input);
      expect(res.familySupportPV).toBe(0.0);
      expect(res.milestonesTotalPV).toBeCloseTo(3581695.39, 2);
      expect(res.grossProtectionNeed).toBeCloseTo(3581695.39, 2);
      expect(res.additionalPersonalCoverGap).toBeCloseTo(3581695.39, 2);
    });

    it('VEC-LIFE-08: Immediate milestone at t=0', () => {
      const input: LifeInsuranceInput = {
        annualTakeHomeIncome: 1000000,
        annualFamilyLivingExpenses: 0,
        supportDurationYears: 1,
        supportExpenseGrowthPct: 0.0,
        investmentReturnPct: 8.0,
        homeLoanOutstanding: 0,
        otherLoansOutstanding: 0,
        otherLiabilities: 0,
        immediateTransitionBuffer: 0,
        futureMilestones: [
          {
            id: 'm1',
            name: 'Immediate Need',
            costToday: 500000,
            yearsUntilGoal: 0,
            inflationRatePct: 6.0,
          },
        ],
        eligibleEarmarkedFunds: 0,
        existingPersonalLifeCover: 0,
        employerGroupLifeCover: 0,
      };

      const res = calculateLifeInsurancePlan(input);
      expect(res.familySupportPV).toBe(0.0);
      expect(res.milestonesTotalPV).toBe(500000.0);
      expect(res.grossProtectionNeed).toBe(500000.0);
      expect(res.additionalPersonalCoverGap).toBe(500000.0);
    });

    it('VEC-LIFE-09: Comprehensive canonical illustrative Indian family scenario', () => {
      const res = calculateLifeInsurancePlan(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE);

      expect(res.familySupportPV).toBeCloseTo(12764206.21, 2);
      expect(res.totalOutstandingLiabilities).toBe(4500000.0);
      expect(res.immediateObligations).toBe(500000.0);
      expect(res.milestonesTotalPV).toBeCloseTo(4035343.14, 2);
      expect(res.grossProtectionNeed).toBeCloseTo(21799549.35, 2);
      expect(res.netProtectionNeedAfterEarmarked).toBeCloseTo(19799549.35, 2);
      expect(res.additionalPersonalCoverGap).toBeCloseTo(14799549.35, 2);
      expect(res.gapIncludingGroupCover).toBeCloseTo(12299549.35, 2);
      expect(res.isFullyCoveredPersonally).toBe(false);
      expect(res.isFullyCoveredWithGroup).toBe(false);
      expect(res.hasEarmarkedSurplus).toBe(false);
    });

    it('VEC-LIFE-10: Earmarked assets exceed gross protection need (surplus state)', () => {
      const surplusInput: LifeInsuranceInput = {
        annualTakeHomeIncome: 800000,
        annualFamilyLivingExpenses: 300000,
        supportDurationYears: 5,
        supportExpenseGrowthPct: 0.0,
        investmentReturnPct: 6.0,
        homeLoanOutstanding: 200000,
        otherLoansOutstanding: 0,
        otherLiabilities: 0,
        immediateTransitionBuffer: 100000,
        futureMilestones: [],
        eligibleEarmarkedFunds: 3000000,
        existingPersonalLifeCover: 1000000,
        employerGroupLifeCover: 500000,
      };

      const res = calculateLifeInsurancePlan(surplusInput);
      expect(res.familySupportPV).toBeCloseTo(1263709.14, 2);
      expect(res.totalOutstandingLiabilities).toBe(200000.0);
      expect(res.immediateObligations).toBe(100000.0);
      expect(res.grossProtectionNeed).toBeCloseTo(1563709.14, 2);
      expect(res.netProtectionNeedAfterEarmarked).toBe(0.0);
      expect(res.additionalPersonalCoverGap).toBe(0.0);
      expect(res.gapIncludingGroupCover).toBe(0.0);
      expect(res.isFullyCoveredPersonally).toBe(true);
      expect(res.isFullyCoveredWithGroup).toBe(true);
      expect(res.hasEarmarkedSurplus).toBe(true);
      expect(res.earmarkedSurplusAmount).toBeCloseTo(1436290.86, 2);
    });

    it('VEC-LIFE-11: Living expenses exceed income warning scenario (pure un-clamped math)', () => {
      const input: LifeInsuranceInput = {
        annualTakeHomeIncome: 600000,
        annualFamilyLivingExpenses: 800000,
        supportDurationYears: 15,
        supportExpenseGrowthPct: 5.0,
        investmentReturnPct: 7.0,
        homeLoanOutstanding: 0,
        otherLoansOutstanding: 0,
        otherLiabilities: 0,
        immediateTransitionBuffer: 0,
        futureMilestones: [],
        eligibleEarmarkedFunds: 0,
        existingPersonalLifeCover: 0,
        employerGroupLifeCover: 0,
      };

      // Validation emits warning but is mathematically valid
      const validation = validateLifeInsuranceInput(input);
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.annualFamilyLivingExpenses).toBeDefined();
      expect(validation.warnings.annualFamilyLivingExpenses).toContain('exceeds your annual take-home income');

      // Calculation computes full un-clamped growing annuity
      const res = calculateLifeInsurancePlan(input);
      expect(res.familySupportPV).toBeCloseTo(9860030.25, 2);
      expect(res.grossProtectionNeed).toBeCloseTo(9860030.25, 2);
      expect(res.netProtectionNeedAfterEarmarked).toBeCloseTo(9860030.25, 2);
      expect(res.additionalPersonalCoverGap).toBeCloseTo(9860030.25, 2);
      expect(res.gapIncludingGroupCover).toBeCloseTo(9860030.25, 2);
    });
  });

  describe('Engine Invariants, Stability & Bounds', () => {
    it('Smooth evaluation across r ≈ g boundary tolerance', () => {
      const pvClose = calculateFamilySupportPV(600000, 6.00000001, 6.0, 20);
      const pvExact = calculateFamilySupportPV(600000, 6.0, 6.0, 20);
      expect(Math.abs(pvClose - pvExact)).toBeLessThan(1);
    });

    it('Milestone with positive return and inflation discounting', () => {
      const res = calculateMilestonePV(1000000, 8, 8, 5);
      // When g = r, PV = G0 * ((1+g)/(1+r))^t = 1000000 * 1^5 = 1000000
      expect(res.presentValue).toBeCloseTo(1000000, 2);
    });

    it('Guarantees finite outputs and rejects non-finite inputs to calculation helper', () => {
      expect(calculateFamilySupportPV(NaN, 6, 7, 20)).toBe(0);
      expect(calculateFamilySupportPV(600000, NaN, 7, 20)).toBe(0);
      expect(calculateFamilySupportPV(600000, 6, NaN, 20)).toBe(0);
      expect(calculateFamilySupportPV(600000, 6, 7, NaN)).toBe(0);
      expect(calculateFamilySupportPV(Infinity, 6, 7, 20)).toBe(0);

      expect(calculateMilestonePV(NaN, 6, 7, 10).presentValue).toBe(0);
      expect(calculateMilestonePV(100000, NaN, 7, 10).presentValue).toBe(0);
      expect(calculateMilestonePV(100000, 6, NaN, 10).presentValue).toBe(0);
      expect(calculateMilestonePV(100000, 6, 7, NaN).presentValue).toBe(0);
    });

    it('calculateLifeInsurancePlan throws an Error on invalid inputs (contract enforcement)', () => {
      const invalidInput: LifeInsuranceInput = {
        ...ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE,
        annualFamilyLivingExpenses: -50000,
      };

      expect(() => calculateLifeInsurancePlan(invalidInput)).toThrow(
        /Cannot calculate life insurance plan with invalid input/
      );
    });

    it('Rejects negative values and out-of-range boundaries in validateLifeInsuranceInput', () => {
      const invalid: LifeInsuranceInput = {
        ...ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE,
        annualTakeHomeIncome: -100,
        supportDurationYears: 50, // max is 45
        supportExpenseGrowthPct: 15, // max is 12
        investmentReturnPct: 20, // max is 15
        homeLoanOutstanding: -1000,
      };

      const val = validateLifeInsuranceInput(invalid);
      expect(val.isValid).toBe(false);
      expect(val.errors.annualTakeHomeIncome).toBeDefined();
      expect(val.errors.supportDurationYears).toBeDefined();
      expect(val.errors.supportExpenseGrowthPct).toBeDefined();
      expect(val.errors.investmentReturnPct).toBeDefined();
      expect(val.errors.homeLoanOutstanding).toBeDefined();
    });

    it('Permits legitimate zero values across liabilities, buffer, cover and assets', () => {
      const zeroInput: LifeInsuranceInput = {
        annualTakeHomeIncome: 0,
        annualFamilyLivingExpenses: 0,
        supportDurationYears: 1,
        supportExpenseGrowthPct: 0,
        investmentReturnPct: 0,
        homeLoanOutstanding: 0,
        otherLoansOutstanding: 0,
        otherLiabilities: 0,
        immediateTransitionBuffer: 0,
        futureMilestones: [],
        eligibleEarmarkedFunds: 0,
        existingPersonalLifeCover: 0,
        employerGroupLifeCover: 0,
      };

      const val = validateLifeInsuranceInput(zeroInput);
      expect(val.isValid).toBe(true);
      expect(Object.keys(val.errors).length).toBe(0);
    });
  });
});
