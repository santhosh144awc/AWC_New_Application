import { describe, it, expect } from 'vitest';
import {
  calculateTotalCurrentAnnualExpenses,
  calculateYearsUntilRetirement,
  calculateFutureAnnualRetirementExpenses,
  calculateYearsPostRetirement,
  calculateTaxAdjustedReturn,
  calculateRealReturn,
  calculateRetirementCorpusRequired,
  calculateEmploymentBenefits,
  calculateOwnAssetsAtRetirement,
  calculateTotalRetirementAssets,
  calculateGoalProgress,
  calculateFundingDeficit,
  calculateRequiredLumpSum,
  calculateRequiredFixedSIP,
  calculateRequiredStepUpSIP,
  calculateRetirementAccumulationPlan,
  type RetirementPlannerInput
} from '../../src/domain/finance/retirementAccumulation';

describe('Retirement Accumulation Calculation Engine (Unit Tests)', () => {
  it('1. Correctly aggregates annual expenses and timeline', () => {
    const totalExp = calculateTotalCurrentAnnualExpenses(1200000, 300000, 0);
    expect(totalExp).toBe(1500000);

    const yrsToRetire = calculateYearsUntilRetirement(50, 60);
    expect(yrsToRetire).toBe(10);

    // 15L at 6% inflation for 10 years with 20% post-retirement reduction
    // 1500000 * (1.06)^10 * 0.8 = 1500000 * 1.7908477 * 0.8 = 2149017
    const futureExp = calculateFutureAnnualRetirementExpenses(totalExp, 6, 10, 20);
    expect(Math.round(futureExp)).toBe(2149017);

    const postYrs = calculateYearsPostRetirement(90, 60);
    expect(postYrs).toBe(30);
  });

  it('2. Computes tax-adjusted and Fisher real returns accurately', () => {
    // 10.5% return with 12.5% tax => 10.5 * (1 - 0.125) = 9.1875%
    const taxAdj = calculateTaxAdjustedReturn(10.5, 12.5);
    expect(taxAdj).toBeCloseTo(9.1875, 4);

    // Real return: (1 + 0.091875) / (1 + 0.06) - 1 = 1.091875 / 1.06 - 1 = 3.007075%
    const rReal = calculateRealReturn(taxAdj, 6);
    expect(rReal).toBeCloseTo(3.007075, 4);
  });

  it('3. Computes Annuity-Due retirement corpus required', () => {
    // 30 years post-retirement, 21,49,017 annual expense, ~3.007% real return
    const { livingCorpus, legacyCorpus, totalCorpus } = calculateRetirementCorpusRequired(
      2149017,
      30,
      3.007075,
      0
    );
    expect(livingCorpus).toBeGreaterThan(40_000_000);
    expect(livingCorpus).toBeLessThan(50_000_000);
    expect(legacyCorpus).toBe(0);
    expect(totalCorpus).toBe(livingCorpus);
  });

  it('4. Aggregates benefits and calculates deficit & goal progress', () => {
    const benefits = calculateEmploymentBenefits(7500000, 2500000, 0); // 1 Cr
    expect(benefits).toBe(10000000);

    const ownAssets = calculateOwnAssetsAtRetirement(3000000, 2500000, 4500000); // 1 Cr
    expect(ownAssets).toBe(10000000);

    const totalAssets = calculateTotalRetirementAssets(benefits, ownAssets); // 2 Cr
    expect(totalAssets).toBe(20000000);

    const reqCorpus = 44000000;
    const progress = calculateGoalProgress(totalAssets, reqCorpus);
    expect(progress).toBeCloseTo(45.45, 1);

    const deficit = calculateFundingDeficit(reqCorpus, totalAssets);
    expect(deficit).toBe(24000000);
  });

  it('5. Computes required lump sum, fixed SIP, and step-up SIP', () => {
    const deficit = 24000000;
    const horizon = 10;
    const returnRate = 12;

    const lump = calculateRequiredLumpSum(deficit, returnRate, horizon);
    expect(lump).toBeGreaterThan(7000000);
    expect(lump).toBeLessThan(8000000);

    const fixedSip = calculateRequiredFixedSIP(deficit, returnRate, horizon);
    expect(fixedSip).toBeGreaterThan(90000);
    expect(fixedSip).toBeLessThan(120000);

    const stepUpSip = calculateRequiredStepUpSIP(deficit, returnRate, horizon, 10);
    expect(stepUpSip).toBeLessThan(fixedSip); // Starting step-up SIP is always lower than fixed SIP
    expect(stepUpSip).toBeGreaterThan(50000);
  });

  it('6. Full orchestrator test with realistic inputs', () => {
    const input: RetirementPlannerInput = {
      expenses: {
        householdExpenses: 1200000,
        lifestyleExpenses: 0,
        otherExpenses: 0
      },
      timeline: {
        currentAge: 50,
        retirementAge: 60,
        inflationPreRetirement: 6,
        expenseReductionPercent: 20
      },
      corpus: {
        lifeExpectancyAge: 90,
        inflationPostRetirement: 6,
        taxRateOnCorpusReturn: 12.5,
        corpusReturnPreTax: 10.5,
        childrenOrCharityCorpus: 0
      },
      employmentBenefits: {
        epfNps: 7500000,
        gratuity: 2500000,
        superannuationOther: 0
      },
      retirementAssets: {
        fixedDeposits: 3000000,
        insuranceMaturity: 2500000,
        mutualFundsInvestments: 4500000
      },
      funding: {
        startInvestingDelay: 0,
        expectedNewInvestmentReturn: 12,
        annualStepUpRate: 10
      }
    };

    const res = calculateRetirementAccumulationPlan(input);

    expect(res.totalCurrentAnnualExpenses).toBe(1200000);
    expect(res.yearsUntilRetirement).toBe(10);
    expect(res.futureAnnualExpenses).toBeGreaterThan(1500000);
    expect(res.totalRetirementAssets).toBe(20000000);
    expect(res.totalRetirementCorpusRequired).toBeGreaterThan(30000000);
    expect(res.fundingDeficit).toBeGreaterThan(10000000);
    expect(res.isFullyFunded).toBe(false);
    expect(res.requiredFixedSIP).toBeGreaterThan(0);
    expect(res.requiredStepUpSIP).toBeGreaterThan(0);
    expect(res.keyInsight).toContain('Your existing retirement resources cover approximately');
  });
});
