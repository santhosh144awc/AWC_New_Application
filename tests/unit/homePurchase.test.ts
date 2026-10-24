/**
 * Ant Wealth Creation — Family Home Purchase Planner Unit Tests
 * 
 * Asserts:
 * 1. Test vectors VEC-HOME-01 through VEC-HOME-10.
 * 2. Pure domain validation invariants: negative values, NaN/Infinity, out-of-bound percentages, non-integer years.
 * 3. Immediate purchase (horizon = 0): no invalid SIP answers or division by zero.
 * 4. Step-Up SIP: starting monthly SIP scales linearly and starts increase at month 13.
 * 5. Affordability benchmark: user-configurable benchmark (default 35%) with neutral 40% comparison.
 * 6. Earmarked assets timing convention: nominal funds available at purchase horizon.
 * 7. Zero-loan and zero-income edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateHomePurchasePlan,
  solveRequiredStepUpSIP,
  validateHomePurchaseInput,
  ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE,
  type HomePurchaseInput,
} from '../../src/domain/finance/homePurchase';
import { FinanceValidationError } from '../../src/domain/finance/errors';

describe('Family Home Purchase Planner Domain Engine', () => {
  describe('Mathematical Test Vectors', () => {
    it('VEC-HOME-01: Baseline zero growth & zero loan interest', () => {
      const input: HomePurchaseInput = {
        currentPropertyValue: 5000000,
        yearsToPurchase: 5,
        annualPropertyGrowthPercent: 0,
        additionalCostPercent: 10,
        homeLoanFundingPercent: 80,
        homeLoanInterestRatePercent: 0,
        loanTenureYears: 20,
        currentMonthlyIncome: 60000,
        annualIncomeGrowthPercent: 0,
        affordabilityThresholdPercent: 35,
        earmarkedAssets: [{ id: 'a1', name: 'Savings', amount: 500000 }],
        expectedInvestmentReturnPercent: 0,
        startInvestingDelayYears: 0,
        annualStepUpPercent: 10,
      };

      const res = calculateHomePurchasePlan(input);

      expect(res.futurePropertyValue).toBe(5000000);
      expect(res.additionalPurchaseCosts).toBe(500000);
      expect(res.totalFutureCost).toBe(5500000);
      expect(res.loanPrincipal).toBe(4000000);
      expect(res.downPayment).toBe(1000000);
      expect(res.totalUpfrontCashRequired).toBe(1500000);
      expect(res.totalEarmarkedAssets).toBe(500000);
      expect(res.fundingGap).toBe(1000000);
      expect(res.fundingProgressPercent).toBe(33.3);
      expect(res.isFullyFunded).toBe(false);

      // Loan EMI at 0% interest for 240 months: 40,00,000 / 240 = 16,666.666...
      expect(res.loanEMI).toBeCloseTo(16666.67, 1);
      expect(res.projectedMonthlyIncome).toBe(60000);
      // EMI ratio: 16666.67 / 60000 = 27.78%
      expect(res.emiToIncomeRatioPercent).toBeCloseTo(27.78, 1);
      expect(res.affordabilityStatus).toBe('WITHIN_BENCHMARK');

      // Fixed SIP at 0% return over 60 months: 10,00,000 / 60 = 16,666.67
      expect(res.requiredFixedMonthlySIP).toBeCloseTo(16666.67, 1);
      // Required lump sum today at 0% return: 10,00,000
      expect(res.requiredLumpSumToday).toBe(1000000);
      // Step-up SIP starting amount
      expect(res.requiredStartingStepUpSIP).toBeCloseTo(13649.79, 1);
    });

    it('VEC-HOME-02: Fully funded upfront cash', () => {
      const input: HomePurchaseInput = {
        currentPropertyValue: 6000000,
        yearsToPurchase: 5,
        annualPropertyGrowthPercent: 6,
        additionalCostPercent: 10,
        homeLoanFundingPercent: 80,
        homeLoanInterestRatePercent: 8.5,
        loanTenureYears: 20,
        currentMonthlyIncome: 120000,
        annualIncomeGrowthPercent: 8,
        affordabilityThresholdPercent: 35,
        earmarkedAssets: [{ id: 'a1', name: 'Mutual Funds', amount: 2500000 }],
        expectedInvestmentReturnPercent: 12,
        startInvestingDelayYears: 0,
        annualStepUpPercent: 10,
      };

      const res = calculateHomePurchasePlan(input);

      expect(res.futurePropertyValue).toBe(8029353);
      expect(res.additionalPurchaseCosts).toBe(802935);
      expect(res.totalUpfrontCashRequired).toBe(2408806);
      expect(res.totalEarmarkedAssets).toBe(2500000);
      expect(res.fundingGap).toBe(0);
      expect(res.isFullyFunded).toBe(true);
      expect(res.fundingProgressPercent).toBe(100);
      expect(res.requiredLumpSumToday).toBe(0);
      expect(res.requiredFixedMonthlySIP).toBe(0);
      expect(res.requiredStartingStepUpSIP).toBe(0);
    });

    it('VEC-HOME-03: Immediate purchase (yearsToPurchase = 0) with cash gap', () => {
      const input: HomePurchaseInput = {
        currentPropertyValue: 5000000,
        yearsToPurchase: 0,
        annualPropertyGrowthPercent: 0,
        additionalCostPercent: 10,
        homeLoanFundingPercent: 80,
        homeLoanInterestRatePercent: 8.5,
        loanTenureYears: 20,
        currentMonthlyIncome: 100000,
        annualIncomeGrowthPercent: 8,
        affordabilityThresholdPercent: 35,
        earmarkedAssets: [{ id: 'a1', name: 'Savings', amount: 500000 }],
        expectedInvestmentReturnPercent: 12,
        startInvestingDelayYears: 0,
        annualStepUpPercent: 10,
      };

      const res = calculateHomePurchasePlan(input);

      expect(res.isImmediatePurchase).toBe(true);
      expect(res.hasAccumulationHorizon).toBe(false);
      expect(res.futurePropertyValue).toBe(5000000);
      expect(res.totalUpfrontCashRequired).toBe(1500000);
      expect(res.fundingGap).toBe(1000000);
      // No SIP calculations for immediate purchase
      expect(res.requiredFixedMonthlySIP).toBe(0);
      expect(res.requiredStartingStepUpSIP).toBe(0);
      expect(res.requiredLumpSumToday).toBe(1000000);
      expect(res.yearlyFundingSchedule).toHaveLength(0);
    });

    it('VEC-HOME-04: Projected income affordability with different horizons and incomes', () => {
      // 4A: Higher burden
      const input4A: HomePurchaseInput = {
        currentPropertyValue: 10000000,
        yearsToPurchase: 6,
        annualPropertyGrowthPercent: 6,
        additionalCostPercent: 10,
        homeLoanFundingPercent: 80,
        homeLoanInterestRatePercent: 8.5,
        loanTenureYears: 20,
        currentMonthlyIncome: 100000,
        annualIncomeGrowthPercent: 8,
        affordabilityThresholdPercent: 35,
        earmarkedAssets: [{ id: 'a1', name: 'Assets', amount: 1500000 }],
        expectedInvestmentReturnPercent: 12,
        startInvestingDelayYears: 0,
        annualStepUpPercent: 10,
      };
      const res4A = calculateHomePurchasePlan(input4A);
      expect(res4A.projectedMonthlyIncome).toBe(158687);
      expect(res4A.loanEMI).toBeCloseTo(98481.87, 1);
      expect(res4A.emiToIncomeRatioPercent).toBeCloseTo(62.06, 1);
      expect(res4A.affordabilityStatus).toBe('HIGHER_BURDEN');
      expect(res4A.fundingGap).toBe(2755557);
      expect(res4A.requiredLumpSumToday).toBeCloseTo(1396050.93, 1);
      expect(res4A.requiredFixedMonthlySIP).toBeCloseTo(26597.39, 1);
      expect(res4A.requiredStartingStepUpSIP).toBeCloseTo(21342.93, 1);

      // 4B: Higher income within benchmark
      const input4B: HomePurchaseInput = {
        currentPropertyValue: 10000000,
        yearsToPurchase: 0,
        annualPropertyGrowthPercent: 0,
        additionalCostPercent: 10,
        homeLoanFundingPercent: 80,
        homeLoanInterestRatePercent: 8.5,
        loanTenureYears: 20,
        currentMonthlyIncome: 250000,
        annualIncomeGrowthPercent: 8,
        affordabilityThresholdPercent: 35,
        earmarkedAssets: [{ id: 'a1', name: 'Assets', amount: 1500000 }],
        expectedInvestmentReturnPercent: 12,
        startInvestingDelayYears: 0,
        annualStepUpPercent: 10,
      };
      const res4B = calculateHomePurchasePlan(input4B);
      expect(res4B.projectedMonthlyIncome).toBe(250000);
      expect(res4B.loanEMI).toBeCloseTo(69425.89, 1);
      expect(res4B.emiToIncomeRatioPercent).toBeCloseTo(27.77, 1);
      expect(res4B.affordabilityStatus).toBe('WITHIN_BENCHMARK');
    });

    it('VEC-HOME-05: Earmarked funds timing convention (nominal funds available at purchase)', () => {
      const input: HomePurchaseInput = {
        currentPropertyValue: 10000000,
        yearsToPurchase: 6,
        annualPropertyGrowthPercent: 6,
        additionalCostPercent: 10,
        homeLoanFundingPercent: 80,
        homeLoanInterestRatePercent: 8.5,
        loanTenureYears: 20,
        currentMonthlyIncome: 150000,
        annualIncomeGrowthPercent: 8,
        affordabilityThresholdPercent: 35,
        earmarkedAssets: [{ id: 'a1', name: 'Portfolio', amount: 1500000 }],
        expectedInvestmentReturnPercent: 12,
        startInvestingDelayYears: 0,
        annualStepUpPercent: 10,
      };

      const res = calculateHomePurchasePlan(input);

      // Total upfront cash: 42,55,557
      expect(res.totalUpfrontCashRequired).toBe(4255557);
      // Earmarked assets deducted directly: 42,55,557 - 15,00,000 = 27,55,557
      expect(res.totalEarmarkedAssets).toBe(1500000);
      expect(res.fundingGap).toBe(2755557);
      // Confirms assets are NOT compounded by 12% into the future
      expect(res.fundingGap).not.toBe(Math.max(0, 4255557 - Math.round(1500000 * Math.pow(1.12, 6))));
    });

    it('VEC-HOME-06: Step-up SIP convention (gap / (12 + 12 * 1.10) for 24 months @ 0% return)', () => {
      const gap = 452000;
      const stepUpInitial = solveRequiredStepUpSIP(gap, 24, 0, 10);
      const expected = gap / (12 + 12 * 1.10); // 452000 / 25.2 = 17936.5079...

      expect(stepUpInitial).toBeCloseTo(expected, 2);
      expect(stepUpInitial).toBeCloseTo(17936.51, 1);
    });

    it('VEC-HOME-07: Indore 3 BHK Canonical Legacy Scenario', () => {
      const input: HomePurchaseInput = {
        currentPropertyValue: 10000000,
        yearsToPurchase: 6,
        annualPropertyGrowthPercent: 6,
        additionalCostPercent: 10,
        homeLoanFundingPercent: 80,
        homeLoanInterestRatePercent: 8.5,
        loanTenureYears: 20,
        currentMonthlyIncome: 150000,
        annualIncomeGrowthPercent: 8,
        affordabilityThresholdPercent: 40,
        earmarkedAssets: [
          { id: '1', name: 'Mutual Funds', amount: 1000000 },
          { id: '2', name: 'Fixed Deposits', amount: 500000 },
        ],
        expectedInvestmentReturnPercent: 12,
        startInvestingDelayYears: 0,
        annualStepUpPercent: 10,
      };

      const res = calculateHomePurchasePlan(input);

      expect(res.futurePropertyValue).toBe(14185191);
      expect(res.additionalPurchaseCosts).toBe(1418519);
      expect(res.totalFutureCost).toBe(15603710);
      expect(res.loanPrincipal).toBe(11348153);
      expect(res.downPayment).toBe(2837038);
      expect(res.totalUpfrontCashRequired).toBe(4255557);
      expect(res.totalEarmarkedAssets).toBe(1500000);
      expect(res.fundingProgressPercent).toBeCloseTo(35.2, 1);
      expect(res.fundingGap).toBe(2755557);
      expect(res.projectedMonthlyIncome).toBe(238031);
      expect(res.loanEMI).toBeCloseTo(98481.87, 1);
      expect(res.emiToIncomeRatioPercent).toBeCloseTo(41.37, 1);
      expect(res.affordabilityStatus).toBe('HIGHER_BURDEN'); // 41.37% > 40%
      expect(res.requiredLumpSumToday).toBeCloseTo(1396050.93, 1);
      expect(res.requiredFixedMonthlySIP).toBeCloseTo(26597.39, 1);
      expect(res.requiredStartingStepUpSIP).toBeCloseTo(21342.93, 1);
      expect(res.yearlyFundingSchedule).toHaveLength(6);
    });

    it('VEC-HOME-08: No-loan scenario (0% loan funding)', () => {
      const input: HomePurchaseInput = {
        currentPropertyValue: 5000000,
        yearsToPurchase: 5,
        annualPropertyGrowthPercent: 6,
        additionalCostPercent: 10,
        homeLoanFundingPercent: 0,
        homeLoanInterestRatePercent: 8.5,
        loanTenureYears: 20,
        currentMonthlyIncome: 100000,
        annualIncomeGrowthPercent: 8,
        affordabilityThresholdPercent: 35,
        earmarkedAssets: [{ id: 'a1', name: 'Savings', amount: 1000000 }],
        expectedInvestmentReturnPercent: 12,
        startInvestingDelayYears: 0,
        annualStepUpPercent: 10,
      };

      const res = calculateHomePurchasePlan(input);

      expect(res.loanPrincipal).toBe(0);
      expect(res.loanEMI).toBe(0);
      expect(res.totalScheduledLoanInterest).toBe(0);
      expect(res.downPayment).toBe(res.futurePropertyValue);
      expect(res.totalUpfrontCashRequired).toBe(res.totalFutureCost);
      expect(res.emiToIncomeRatioPercent).toBe(0);
      expect(res.affordabilityStatus).toBe('WITHIN_BENCHMARK');
      expect(res.requiredLumpSumToday).toBeCloseTo(3608971.60, 1);
    });

    it('VEC-HOME-09: Investment start delay of 2 years on a 6-year horizon', () => {
      const baseInput: HomePurchaseInput = {
        currentPropertyValue: 10000000,
        yearsToPurchase: 6,
        annualPropertyGrowthPercent: 6,
        additionalCostPercent: 10,
        homeLoanFundingPercent: 80,
        homeLoanInterestRatePercent: 8.5,
        loanTenureYears: 20,
        currentMonthlyIncome: 150000,
        annualIncomeGrowthPercent: 8,
        affordabilityThresholdPercent: 35,
        earmarkedAssets: [{ id: 'a1', name: 'Assets', amount: 1500000 }],
        expectedInvestmentReturnPercent: 12,
        startInvestingDelayYears: 0,
        annualStepUpPercent: 10,
      };

      const delayedInput: HomePurchaseInput = {
        ...baseInput,
        startInvestingDelayYears: 2,
      };

      const baseRes = calculateHomePurchasePlan(baseInput);
      const delayedRes = calculateHomePurchasePlan(delayedInput);

      expect(delayedRes.remainingAccumulationYears).toBe(4);
      expect(delayedRes.remainingAccumulationMonths).toBe(48);
      // Shorter horizon requires higher monthly contribution
      expect(delayedRes.requiredFixedMonthlySIP).toBeGreaterThan(baseRes.requiredFixedMonthlySIP);
      expect(delayedRes.requiredFixedMonthlySIP).toBeCloseTo(45161.75, 1);
      expect(delayedRes.requiredStartingStepUpSIP).toBeGreaterThan(baseRes.requiredStartingStepUpSIP);
      expect(delayedRes.requiredStartingStepUpSIP).toBeCloseTo(39452.40, 1);
      expect(delayedRes.requiredLumpSumToday).toBeCloseTo(1751206.29, 1);

      // In schedule, years 1 and 2 are delayed
      expect(delayedRes.yearlyFundingSchedule[0].isDelayed).toBe(true);
      expect(delayedRes.yearlyFundingSchedule[0].fixedMonthlySIP).toBe(0);
      expect(delayedRes.yearlyFundingSchedule[1].isDelayed).toBe(true);
      expect(delayedRes.yearlyFundingSchedule[1].fixedMonthlySIP).toBe(0);
      expect(delayedRes.yearlyFundingSchedule[2].isDelayed).toBe(false);
      expect(delayedRes.yearlyFundingSchedule[2].fixedMonthlySIP).toBe(delayedRes.requiredFixedMonthlySIP);
    });

    it('VEC-HOME-10: Zero household income boundary', () => {
      const input: HomePurchaseInput = {
        currentPropertyValue: 5000000,
        yearsToPurchase: 5,
        annualPropertyGrowthPercent: 0,
        additionalCostPercent: 10,
        homeLoanFundingPercent: 80,
        homeLoanInterestRatePercent: 8.5,
        loanTenureYears: 20,
        currentMonthlyIncome: 0,
        annualIncomeGrowthPercent: 0,
        affordabilityThresholdPercent: 35,
        earmarkedAssets: [{ id: 'a1', name: 'Savings', amount: 500000 }],
        expectedInvestmentReturnPercent: 12,
        startInvestingDelayYears: 0,
        annualStepUpPercent: 10,
      };

      const res = calculateHomePurchasePlan(input);

      expect(res.projectedMonthlyIncome).toBe(0);
      expect(res.emiToIncomeRatioPercent).toBeNull();
      expect(res.affordabilityStatus).toBe('INCOME_UNAVAILABLE');
      expect(res.affordabilityInsight).toContain('income is not provided or zero');
    });
  });

  describe('Input Validation & Boundary Invariants', () => {
    const validBase: HomePurchaseInput = {
      currentPropertyValue: 5000000,
      yearsToPurchase: 5,
      currentMonthlyIncome: 100000,
    };

    it('rejects negative property value', () => {
      expect(() => calculateHomePurchasePlan({ ...validBase, currentPropertyValue: -100 })).toThrow(
        FinanceValidationError
      );
    });

    it('rejects NaN / Infinity property value', () => {
      expect(() => calculateHomePurchasePlan({ ...validBase, currentPropertyValue: NaN })).toThrow(
        FinanceValidationError
      );
      expect(() => calculateHomePurchasePlan({ ...validBase, currentPropertyValue: Infinity })).toThrow(
        FinanceValidationError
      );
    });

    it('rejects non-integer years to purchase', () => {
      expect(() => calculateHomePurchasePlan({ ...validBase, yearsToPurchase: 2.5 })).toThrow(
        FinanceValidationError
      );
    });

    it('rejects years to purchase > 35', () => {
      expect(() => calculateHomePurchasePlan({ ...validBase, yearsToPurchase: 36 })).toThrow(
        FinanceValidationError
      );
    });

    it('rejects negative income', () => {
      expect(() => calculateHomePurchasePlan({ ...validBase, currentMonthlyIncome: -5000 })).toThrow(
        FinanceValidationError
      );
    });

    it('rejects property growth > 25%', () => {
      expect(() => calculateHomePurchasePlan({ ...validBase, annualPropertyGrowthPercent: 30 })).toThrow(
        FinanceValidationError
      );
    });

    it('rejects additional costs > 50%', () => {
      expect(() => calculateHomePurchasePlan({ ...validBase, additionalCostPercent: 55 })).toThrow(
        FinanceValidationError
      );
    });

    it('rejects loan funding > 95%', () => {
      expect(() => calculateHomePurchasePlan({ ...validBase, homeLoanFundingPercent: 96 })).toThrow(
        FinanceValidationError
      );
    });

    it('rejects negative asset amount', () => {
      expect(() =>
        calculateHomePurchasePlan({
          ...validBase,
          earmarkedAssets: [{ id: '1', name: 'Negative', amount: -5000 }],
        })
      ).toThrow(FinanceValidationError);
    });

    it('rejects investment delay >= yearsToPurchase when horizon > 0', () => {
      expect(() =>
        calculateHomePurchasePlan({
          ...validBase,
          yearsToPurchase: 5,
          startInvestingDelayYears: 5,
        })
      ).toThrow(FinanceValidationError);

      expect(() =>
        calculateHomePurchasePlan({
          ...validBase,
          yearsToPurchase: 5,
          startInvestingDelayYears: 6,
        })
      ).toThrow(FinanceValidationError);
    });

    it('rejects investment delay > 0 for immediate purchase (yearsToPurchase = 0)', () => {
      expect(() =>
        calculateHomePurchasePlan({
          ...validBase,
          yearsToPurchase: 0,
          startInvestingDelayYears: 1,
        })
      ).toThrow(FinanceValidationError);
    });

    it('accepts valid illustrative fixture without errors', () => {
      expect(() => validateHomePurchaseInput(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE)).not.toThrow();
      expect(() => calculateHomePurchasePlan(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE)).not.toThrow();
      const res = calculateHomePurchasePlan(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE);
      expect(res.futurePropertyValue).toBeGreaterThan(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.currentPropertyValue);
      expect(res.fundingGap).toBeGreaterThan(0);
      expect(res.requiredFixedMonthlySIP).toBeGreaterThan(0);
      expect(res.requiredStartingStepUpSIP).toBeGreaterThan(0);
    });
  });

  describe('Cross-input Invariance & Dynamic Narrative (Phase 17 Remediation)', () => {
    it('asserts that changing only affordability benchmark or monthly income does NOT alter the funding gap or SIP results', () => {
      const baseInput: HomePurchaseInput = {
        currentPropertyValue: 10000000,
        yearsToPurchase: 6,
        annualPropertyGrowthPercent: 6,
        additionalCostPercent: 10,
        homeLoanFundingPercent: 80,
        homeLoanInterestRatePercent: 8.5,
        loanTenureYears: 20,
        currentMonthlyIncome: 100000,
        annualIncomeGrowthPercent: 8,
        affordabilityThresholdPercent: 35,
        earmarkedAssets: [{ id: 'a1', name: 'Assets', amount: 1500000 }],
        expectedInvestmentReturnPercent: 12,
        startInvestingDelayYears: 0,
        annualStepUpPercent: 10,
      };

      const resBase = calculateHomePurchasePlan(baseInput);

      // Vary income: 50,000, 1,50,000, 3,00,000
      const resIncome50k = calculateHomePurchasePlan({ ...baseInput, currentMonthlyIncome: 50000 });
      const resIncome150k = calculateHomePurchasePlan({ ...baseInput, currentMonthlyIncome: 150000 });
      const resIncome300k = calculateHomePurchasePlan({ ...baseInput, currentMonthlyIncome: 300000 });

      // Vary benchmark: 25%, 35%, 40%, 50%
      const resBench25 = calculateHomePurchasePlan({ ...baseInput, affordabilityThresholdPercent: 25 });
      const resBench40 = calculateHomePurchasePlan({ ...baseInput, affordabilityThresholdPercent: 40 });
      const resBench50 = calculateHomePurchasePlan({ ...baseInput, affordabilityThresholdPercent: 50 });

      // Both varied simultaneously
      const resBoth = calculateHomePurchasePlan({
        ...baseInput,
        currentMonthlyIncome: 250000,
        affordabilityThresholdPercent: 45,
      });

      const allVariants = [resIncome50k, resIncome150k, resIncome300k, resBench25, resBench40, resBench50, resBoth];

      for (const variant of allVariants) {
        expect(variant.fundingGap).toBe(resBase.fundingGap);
        expect(variant.totalUpfrontCashRequired).toBe(resBase.totalUpfrontCashRequired);
        expect(variant.downPayment).toBe(resBase.downPayment);
        expect(variant.loanPrincipal).toBe(resBase.loanPrincipal);
        expect(variant.loanEMI).toBe(resBase.loanEMI);
        expect(variant.requiredLumpSumToday).toBe(resBase.requiredLumpSumToday);
        expect(variant.requiredFixedMonthlySIP).toBe(resBase.requiredFixedMonthlySIP);
        expect(variant.requiredStartingStepUpSIP).toBe(resBase.requiredStartingStepUpSIP);
      }

      // But affordability metrics differ
      expect(resIncome50k.emiToIncomeRatioPercent).not.toBe(resBase.emiToIncomeRatioPercent);
      expect(resBench25.affordabilityThresholdPercent).toBe(25);
      expect(resBench40.affordabilityThresholdPercent).toBe(40);
    });

    it('generates accurate, non-hardcoded summaryNarrative across various loan funding percentages', () => {
      // 1. 0% Loan (100% self-funding)
      const res0 = calculateHomePurchasePlan({
        ...ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE,
        homeLoanFundingPercent: 0,
      });
      expect(res0.summaryNarrative).toContain('100% upfront self-funding (no loan)');
      expect(res0.summaryNarrative).not.toContain('80% loan');
      expect(res0.summaryNarrative).not.toContain('eligible');

      // 2. 50% Loan
      const res50 = calculateHomePurchasePlan({
        ...ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE,
        homeLoanFundingPercent: 50,
      });
      expect(res50.summaryNarrative).toContain('illustrative 50% loan of ₹');
      expect(res50.summaryNarrative).toContain('subject to lender eligibility');
      expect(res50.summaryNarrative).not.toContain('80% loan');

      // 3. 95% Loan
      const res95 = calculateHomePurchasePlan({
        ...ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE,
        homeLoanFundingPercent: 95,
      });
      expect(res95.summaryNarrative).toContain('illustrative 95% loan of ₹');
      expect(res95.summaryNarrative).toContain('subject to lender eligibility');
      expect(res95.summaryNarrative).not.toContain('80% loan');

      // 4. Fully funded
      const resFullyFunded = calculateHomePurchasePlan({
        ...ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE,
        earmarkedAssets: [{ id: '1', name: 'Savings', amount: 50000000 }],
      });
      expect(resFullyFunded.summaryNarrative).toContain('cover 100% of the estimated total upfront cash requirement');
      expect(resFullyFunded.summaryNarrative).toContain('No additional monthly SIP accumulation is needed');

      // 5. Immediate purchase with 0% loan
      const resImmediateNoLoan = calculateHomePurchasePlan({
        ...ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE,
        yearsToPurchase: 0,
        homeLoanFundingPercent: 0,
      });
      expect(resImmediateNoLoan.summaryNarrative).toContain('immediate home purchase with 100% upfront self-funding (no loan)');

      // 6. Immediate purchase with 80% loan
      const resImmediateLoan = calculateHomePurchasePlan({
        ...ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE,
        yearsToPurchase: 0,
        homeLoanFundingPercent: 80,
      });
      expect(resImmediateLoan.summaryNarrative).toContain('immediate home purchase with an illustrative 80% loan of ₹');
    });
  });
});
