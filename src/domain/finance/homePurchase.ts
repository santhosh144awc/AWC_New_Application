/**
 * Ant Wealth Creation — Family Home Purchase & Acquisition Cost Planning Engine
 * 
 * Formalizes:
 * 1. Future property valuation with configurable annual appreciation.
 * 2. Transparent acquisition/setup cost calculation (stamp duty, registration, interiors).
 * 3. Separation of loan principal (capped by LTV on base price) and required upfront cash.
 * 4. Loan EMI sizing and monthly household take-home affordability against a configurable benchmark (default 35%).
 * 5. Earmarked funds deficit modeling (assets expected to be available at purchase horizon).
 * 6. Dual accumulation solutions: Fixed Monthly SIP vs Annual Step-Up SIP (via calculateTargetCorpus & calculateSIP).
 * 7. Present value single lump-sum equivalent.
 * 8. Optional investment delay modeling and year-by-year funding schedule.
 * 
 * Strictly deterministic, pure TypeScript domain module. No React, Astro, DOM, browser,
 * network, storage, analytics, or UI dependencies.
 */

import {
  assertFiniteNonNegative,
  FinanceValidationError,
} from './errors';
import { calculateMonthlyEMI, calculateHomeLoanAmortization } from './homeLoanAmortization';
import { calculateTargetCorpus } from './targetCorpus';
export { solveRequiredStepUpSIP } from './childrenFuturePlanner';
import { solveRequiredStepUpSIP } from './childrenFuturePlanner';

export interface EarmarkedAsset {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
}

export type AffordabilityStatus =
  | 'INCOME_UNAVAILABLE'
  | 'WITHIN_BENCHMARK'
  | 'ABOVE_BENCHMARK_BELOW_40'
  | 'HIGHER_BURDEN';

export interface HomePurchaseInput {
  /** Today's estimated property value in INR (>= 0) */
  readonly currentPropertyValue: number;
  /** Planned purchase horizon in years (0 to 35, 0 = immediate) */
  readonly yearsToPurchase: number;
  /** Expected annual property price growth percentage (0 to 25%, default: 6) */
  readonly annualPropertyGrowthPercent?: number;
  /** Additional acquisition/setup costs as % of future property value (0 to 50%, default: 10) */
  readonly additionalCostPercent?: number;
  /** Share of future property value financed via loan (0 to 95%, default: 80) */
  readonly homeLoanFundingPercent?: number;
  /** Quoted nominal annual loan interest rate % (0 to 25%, default: 8.5) */
  readonly homeLoanInterestRatePercent?: number;
  /** Loan tenure in years (1 to 35, default: 20) */
  readonly loanTenureYears?: number;
  /** Current monthly household take-home income in INR (>= 0) */
  readonly currentMonthlyIncome: number;
  /** Expected annual income growth rate % (0 to 25%, default: 8) */
  readonly annualIncomeGrowthPercent?: number;
  /** Configurable household affordability benchmark % (10 to 60%, default: 35) */
  readonly affordabilityThresholdPercent?: number;
  /** Existing assets earmarked to be available at the purchase horizon */
  readonly earmarkedAssets?: readonly EarmarkedAsset[];
  /** Expected annual return on investments % (0 to 30%, default: 12) */
  readonly expectedInvestmentReturnPercent?: number;
  /** Investment start delay in years (0 <= delay < yearsToPurchase, default: 0) */
  readonly startInvestingDelayYears?: number;
  /** Annual SIP step-up percentage (0 to 30%, default: 10) */
  readonly annualStepUpPercent?: number;
}

export interface YearlyFundingContribution {
  readonly year: number;
  readonly isDelayed: boolean;
  readonly fixedMonthlySIP: number;
  readonly fixedAnnualContribution: number;
  readonly stepUpMonthlySIP: number;
  readonly stepUpAnnualContribution: number;
  readonly fixedAccumulatedCorpus: number;
  readonly stepUpAccumulatedCorpus: number;
}

export interface HomePurchaseResult {
  // Goal & Property
  readonly currentPropertyValue: number;
  readonly yearsToPurchase: number;
  readonly annualPropertyGrowthPercent: number;
  readonly futurePropertyValue: number;
  readonly additionalCostPercent: number;
  readonly additionalPurchaseCosts: number;
  readonly totalFutureCost: number;

  // Loan & Upfront Capital
  readonly homeLoanFundingPercent: number;
  readonly loanPrincipal: number;
  readonly downPayment: number;
  readonly totalUpfrontCashRequired: number;

  // Existing Assets & Gap
  readonly totalEarmarkedAssets: number;
  readonly fundingGap: number;
  readonly isFullyFunded: boolean;
  readonly fundingProgressPercent: number;

  // Loan & Income Affordability
  readonly homeLoanInterestRatePercent: number;
  readonly loanTenureYears: number;
  readonly loanEMI: number;
  readonly totalScheduledLoanInterest: number;
  readonly currentMonthlyIncome: number;
  readonly annualIncomeGrowthPercent: number;
  readonly projectedMonthlyIncome: number;
  readonly emiToIncomeRatioPercent: number | null;
  readonly affordabilityThresholdPercent: number;
  readonly affordabilityStatus: AffordabilityStatus;
  readonly affordabilityInsight: string;

  // Funding Solutions (for funding gap)
  readonly expectedInvestmentReturnPercent: number;
  readonly startInvestingDelayYears: number;
  readonly remainingAccumulationYears: number;
  readonly remainingAccumulationMonths: number;
  readonly annualStepUpPercent: number;
  readonly requiredLumpSumToday: number;
  readonly requiredFixedMonthlySIP: number;
  readonly requiredStartingStepUpSIP: number;
  readonly isImmediatePurchase: boolean;
  readonly hasAccumulationHorizon: boolean;

  // Funding Schedule
  readonly yearlyFundingSchedule: readonly YearlyFundingContribution[];

  // Factual context summary
  readonly summaryNarrative: string;
}

export const ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE: HomePurchaseInput = {
  currentPropertyValue: 7500000, // ₹75 Lakhs today
  yearsToPurchase: 5,
  annualPropertyGrowthPercent: 6,
  additionalCostPercent: 10,
  homeLoanFundingPercent: 80,
  homeLoanInterestRatePercent: 8.5,
  loanTenureYears: 20,
  currentMonthlyIncome: 150000, // ₹1.5 Lakhs/month
  annualIncomeGrowthPercent: 8,
  affordabilityThresholdPercent: 35,
  earmarkedAssets: [
    { id: 'asset-1', name: 'Mutual Funds / Equities', amount: 800000 },
    { id: 'asset-2', name: 'Fixed Deposits', amount: 400000 },
  ],
  expectedInvestmentReturnPercent: 12,
  startInvestingDelayYears: 0,
  annualStepUpPercent: 10,
};

/**
 * Validates all domain inputs strictly. Throws FinanceValidationError if any field is invalid.
 */
export function validateHomePurchaseInput(input: HomePurchaseInput): void {
  assertFiniteNonNegative('currentPropertyValue', input.currentPropertyValue);

  if (
    typeof input.yearsToPurchase !== 'number' ||
    !Number.isFinite(input.yearsToPurchase) ||
    !Number.isInteger(input.yearsToPurchase) ||
    input.yearsToPurchase < 0 ||
    input.yearsToPurchase > 35
  ) {
    throw new FinanceValidationError(
      'yearsToPurchase',
      input.yearsToPurchase,
      'Years to purchase must be an integer between 0 and 35'
    );
  }

  const propertyGrowth = input.annualPropertyGrowthPercent ?? 6;
  if (
    typeof propertyGrowth !== 'number' ||
    !Number.isFinite(propertyGrowth) ||
    propertyGrowth < 0 ||
    propertyGrowth > 25
  ) {
    throw new FinanceValidationError(
      'annualPropertyGrowthPercent',
      propertyGrowth,
      'Property price growth rate must be between 0% and 25%'
    );
  }

  const addCost = input.additionalCostPercent ?? 10;
  if (
    typeof addCost !== 'number' ||
    !Number.isFinite(addCost) ||
    addCost < 0 ||
    addCost > 50
  ) {
    throw new FinanceValidationError(
      'additionalCostPercent',
      addCost,
      'Additional acquisition costs must be between 0% and 50%'
    );
  }

  const fundingPct = input.homeLoanFundingPercent ?? 80;
  if (
    typeof fundingPct !== 'number' ||
    !Number.isFinite(fundingPct) ||
    fundingPct < 0 ||
    fundingPct > 95
  ) {
    throw new FinanceValidationError(
      'homeLoanFundingPercent',
      fundingPct,
      'Home loan funding share must be between 0% and 95%'
    );
  }

  const loanRate = input.homeLoanInterestRatePercent ?? 8.5;
  if (
    typeof loanRate !== 'number' ||
    !Number.isFinite(loanRate) ||
    loanRate < 0 ||
    loanRate > 25
  ) {
    throw new FinanceValidationError(
      'homeLoanInterestRatePercent',
      loanRate,
      'Home loan interest rate must be between 0% and 25%'
    );
  }

  const tenure = input.loanTenureYears ?? 20;
  if (
    typeof tenure !== 'number' ||
    !Number.isFinite(tenure) ||
    !Number.isInteger(tenure) ||
    tenure < 1 ||
    tenure > 35
  ) {
    throw new FinanceValidationError(
      'loanTenureYears',
      tenure,
      'Loan tenure must be an integer between 1 and 35 years'
    );
  }

  assertFiniteNonNegative('currentMonthlyIncome', input.currentMonthlyIncome);

  const incomeGrowth = input.annualIncomeGrowthPercent ?? 8;
  if (
    typeof incomeGrowth !== 'number' ||
    !Number.isFinite(incomeGrowth) ||
    incomeGrowth < 0 ||
    incomeGrowth > 25
  ) {
    throw new FinanceValidationError(
      'annualIncomeGrowthPercent',
      incomeGrowth,
      'Income growth rate must be between 0% and 25%'
    );
  }

  const benchmark = input.affordabilityThresholdPercent ?? 35;
  if (
    typeof benchmark !== 'number' ||
    !Number.isFinite(benchmark) ||
    benchmark < 10 ||
    benchmark > 60
  ) {
    throw new FinanceValidationError(
      'affordabilityThresholdPercent',
      benchmark,
      'Affordability benchmark must be between 10% and 60%'
    );
  }

  if (input.earmarkedAssets) {
    if (!Array.isArray(input.earmarkedAssets)) {
      throw new FinanceValidationError('earmarkedAssets', input.earmarkedAssets, 'Earmarked assets must be an array');
    }
    for (let i = 0; i < input.earmarkedAssets.length; i++) {
      const asset = input.earmarkedAssets[i];
      if (!asset || typeof asset.amount !== 'number' || !Number.isFinite(asset.amount) || asset.amount < 0) {
        throw new FinanceValidationError(
          `earmarkedAssets[${i}].amount`,
          asset?.amount,
          'Asset amount must be a non-negative finite number'
        );
      }
    }
  }

  const invReturn = input.expectedInvestmentReturnPercent ?? 12;
  if (
    typeof invReturn !== 'number' ||
    !Number.isFinite(invReturn) ||
    invReturn < 0 ||
    invReturn > 30
  ) {
    throw new FinanceValidationError(
      'expectedInvestmentReturnPercent',
      invReturn,
      'Investment return assumption must be between 0% and 30%'
    );
  }

  const delay = input.startInvestingDelayYears ?? 0;
  if (
    typeof delay !== 'number' ||
    !Number.isFinite(delay) ||
    !Number.isInteger(delay) ||
    delay < 0 ||
    delay > 35
  ) {
    throw new FinanceValidationError(
      'startInvestingDelayYears',
      delay,
      'Investment delay must be an integer between 0 and 35'
    );
  }
  if (input.yearsToPurchase > 0 && delay >= input.yearsToPurchase) {
    throw new FinanceValidationError(
      'startInvestingDelayYears',
      delay,
      `Investment delay (${delay} yrs) must be strictly less than years to purchase (${input.yearsToPurchase} yrs)`
    );
  }
  if (input.yearsToPurchase === 0 && delay > 0) {
    throw new FinanceValidationError(
      'startInvestingDelayYears',
      delay,
      'Investment delay must be 0 for an immediate purchase'
    );
  }

  const stepUp = input.annualStepUpPercent ?? 10;
  if (
    typeof stepUp !== 'number' ||
    !Number.isFinite(stepUp) ||
    stepUp < 0 ||
    stepUp > 30
  ) {
    throw new FinanceValidationError(
      'annualStepUpPercent',
      stepUp,
      'Annual step-up rate must be between 0% and 30%'
    );
  }
}

/**
 * Master calculation engine for family home purchase and upfront acquisition cost planning.
 */
export function calculateHomePurchasePlan(input: HomePurchaseInput): HomePurchaseResult {
  validateHomePurchaseInput(input);

  const currentPropertyValue = input.currentPropertyValue;
  const yearsToPurchase = input.yearsToPurchase;
  const annualPropertyGrowthPercent = input.annualPropertyGrowthPercent ?? 6;
  const additionalCostPercent = input.additionalCostPercent ?? 10;
  const homeLoanFundingPercent = input.homeLoanFundingPercent ?? 80;
  const homeLoanInterestRatePercent = input.homeLoanInterestRatePercent ?? 8.5;
  const loanTenureYears = input.loanTenureYears ?? 20;
  const currentMonthlyIncome = input.currentMonthlyIncome;
  const annualIncomeGrowthPercent = input.annualIncomeGrowthPercent ?? 8;
  const affordabilityThresholdPercent = input.affordabilityThresholdPercent ?? 35;
  const expectedInvestmentReturnPercent = input.expectedInvestmentReturnPercent ?? 12;
  const startInvestingDelayYears = input.startInvestingDelayYears ?? 0;
  const annualStepUpPercent = input.annualStepUpPercent ?? 10;

  // 1. Future Property Value & Acquisition Costs
  const futurePropertyValue =
    yearsToPurchase === 0 || annualPropertyGrowthPercent === 0
      ? currentPropertyValue
      : Math.round(currentPropertyValue * Math.pow(1 + annualPropertyGrowthPercent / 100, yearsToPurchase));

  const additionalPurchaseCosts = Math.round(futurePropertyValue * (additionalCostPercent / 100));
  const totalFutureCost = futurePropertyValue + additionalPurchaseCosts;

  // 2. Loan Principal, Down Payment & Required Upfront Cash
  const loanPrincipal = Math.round(futurePropertyValue * (homeLoanFundingPercent / 100));
  const downPayment = futurePropertyValue - loanPrincipal;
  const totalUpfrontCashRequired = downPayment + additionalPurchaseCosts;

  // 3. Earmarked Funds & Funding Gap
  const totalEarmarkedAssets = (input.earmarkedAssets ?? []).reduce(
    (sum, a) => sum + (Number.isFinite(a.amount) ? Math.max(0, a.amount) : 0),
    0
  );
  const fundingGap = Math.max(0, totalUpfrontCashRequired - totalEarmarkedAssets);
  const isFullyFunded = fundingGap === 0;
  const fundingProgressPercent =
    totalUpfrontCashRequired > 0
      ? Math.min(100, Math.round((totalEarmarkedAssets / totalUpfrontCashRequired) * 1000) / 10)
      : 100;

  // 4. Loan EMI and Scheduled Interest
  let loanEMI = 0;
  let totalScheduledLoanInterest = 0;
  if (loanPrincipal > 0 && loanTenureYears > 0) {
    const tenureMonths = loanTenureYears * 12;
    loanEMI = calculateMonthlyEMI(loanPrincipal, homeLoanInterestRatePercent, tenureMonths);
    const loanSchedule = calculateHomeLoanAmortization({
      principal: loanPrincipal,
      annualInterestRatePercent: homeLoanInterestRatePercent,
      tenureMonths,
    });
    totalScheduledLoanInterest = loanSchedule.totalScheduledInterest;
  }

  // 5. Projected Monthly Income & Affordability
  let projectedMonthlyIncome = 0;
  let emiToIncomeRatioPercent: number | null = null;
  let affordabilityStatus: AffordabilityStatus = 'INCOME_UNAVAILABLE';
  let affordabilityInsight = '';

  if (currentMonthlyIncome <= 0) {
    affordabilityStatus = 'INCOME_UNAVAILABLE';
    affordabilityInsight = 'Monthly income is not provided or zero; affordability ratio cannot be calculated.';
  } else {
    projectedMonthlyIncome =
      yearsToPurchase === 0 || annualIncomeGrowthPercent === 0
        ? currentMonthlyIncome
        : Math.round(currentMonthlyIncome * Math.pow(1 + annualIncomeGrowthPercent / 100, yearsToPurchase));

    if (projectedMonthlyIncome <= 0) {
      affordabilityStatus = 'INCOME_UNAVAILABLE';
      affordabilityInsight = 'Projected monthly income is zero; affordability ratio cannot be calculated.';
    } else {
      emiToIncomeRatioPercent = (loanEMI / projectedMonthlyIncome) * 100;
      if (emiToIncomeRatioPercent <= affordabilityThresholdPercent) {
        affordabilityStatus = 'WITHIN_BENCHMARK';
        affordabilityInsight = `Your estimated EMI is within your selected affordability benchmark of ${affordabilityThresholdPercent}% of projected take-home income.`;
      } else if (emiToIncomeRatioPercent <= 40) {
        affordabilityStatus = 'ABOVE_BENCHMARK_BELOW_40';
        affordabilityInsight = `Your estimated EMI exceeds your selected benchmark of ${affordabilityThresholdPercent}%, but remains below the 40% comparison reference.`;
      } else {
        affordabilityStatus = 'HIGHER_BURDEN';
        affordabilityInsight = `Your estimated EMI represents a higher share of projected take-home income, exceeding the 40% comparison reference.`;
      }
    }
  }

  // 6. Accumulation Funding Solutions
  const remainingAccumulationYears = Math.max(0, yearsToPurchase - startInvestingDelayYears);
  const remainingAccumulationMonths = remainingAccumulationYears * 12;
  const isImmediatePurchase = yearsToPurchase === 0;
  const hasAccumulationHorizon = remainingAccumulationMonths > 0;

  let requiredLumpSumToday = 0;
  let requiredFixedMonthlySIP = 0;
  let requiredStartingStepUpSIP = 0;

  if (fundingGap > 0) {
    if (!hasAccumulationHorizon) {
      // Immediate purchase shortfall: no future accumulation horizon exists
      requiredLumpSumToday = fundingGap;
      requiredFixedMonthlySIP = 0;
      requiredStartingStepUpSIP = 0;
    } else {
      // Lump Sum Today PV equivalent
      if (expectedInvestmentReturnPercent === 0) {
        requiredLumpSumToday = fundingGap;
      } else {
        requiredLumpSumToday = fundingGap / Math.pow(1 + expectedInvestmentReturnPercent / 100, remainingAccumulationYears);
      }

      // Fixed Monthly SIP
      const targetCorpusResult = calculateTargetCorpus({
        targetCorpus: fundingGap,
        tenureMonths: remainingAccumulationMonths,
        annualReturnPercent: expectedInvestmentReturnPercent,
        existingInvestedCapital: 0,
      });
      requiredFixedMonthlySIP = targetCorpusResult.requiredMonthlySIP;

      // Annual Step-Up Starting Monthly SIP
      requiredStartingStepUpSIP = solveRequiredStepUpSIP(
        fundingGap,
        remainingAccumulationMonths,
        expectedInvestmentReturnPercent,
        annualStepUpPercent
      );
    }
  }

  // 7. Yearly Funding Schedule
  const yearlyFundingSchedule: YearlyFundingContribution[] = [];
  if (yearsToPurchase > 0 && fundingGap > 0) {
    let runningFixedCorpus = 0;
    let runningStepUpCorpus = 0;
    const monthlyRate =
      expectedInvestmentReturnPercent === 0
        ? 0
        : Math.pow(1 + expectedInvestmentReturnPercent / 100, 1 / 12) - 1;

    for (let y = 1; y <= yearsToPurchase; y++) {
      const isDelayed = y <= startInvestingDelayYears;
      let fixedMonthly = 0;
      let stepUpMonthly = 0;

      if (!isDelayed) {
        fixedMonthly = requiredFixedMonthlySIP;
        const activeYearIndex = y - startInvestingDelayYears; // 1-indexed active year
        stepUpMonthly = requiredStartingStepUpSIP * Math.pow(1 + annualStepUpPercent / 100, activeYearIndex - 1);

        for (let m = 0; m < 12; m++) {
          runningFixedCorpus = (runningFixedCorpus + fixedMonthly) * (1 + monthlyRate);
          runningStepUpCorpus = (runningStepUpCorpus + stepUpMonthly) * (1 + monthlyRate);
        }
      } else {
        // Delayed year: existing corpus (if any) grows at monthly rate
        for (let m = 0; m < 12; m++) {
          runningFixedCorpus = runningFixedCorpus * (1 + monthlyRate);
          runningStepUpCorpus = runningStepUpCorpus * (1 + monthlyRate);
        }
      }

      yearlyFundingSchedule.push({
        year: y,
        isDelayed,
        fixedMonthlySIP: fixedMonthly,
        fixedAnnualContribution: fixedMonthly * 12,
        stepUpMonthlySIP: stepUpMonthly,
        stepUpAnnualContribution: stepUpMonthly * 12,
        fixedAccumulatedCorpus: Math.round(runningFixedCorpus),
        stepUpAccumulatedCorpus: Math.round(runningStepUpCorpus),
      });
    }
  }

  // 8. Factual Summary Narrative
  let summaryNarrative = '';
  if (isFullyFunded) {
    summaryNarrative = `Your existing earmarked assets cover 100% of the estimated total upfront cash requirement of ₹${totalUpfrontCashRequired.toLocaleString('en-IN')}. No additional monthly SIP accumulation is needed.`;
  } else if (isImmediatePurchase) {
    if (homeLoanFundingPercent === 0) {
      summaryNarrative = `For an immediate home purchase with 100% upfront self-funding (no loan), your total upfront cash requirement is ₹${totalUpfrontCashRequired.toLocaleString('en-IN')} with an immediate funding deficit of ₹${fundingGap.toLocaleString('en-IN')} that must be funded from cash reserves.`;
    } else {
      summaryNarrative = `For an immediate home purchase with an illustrative ${homeLoanFundingPercent}% loan of ₹${loanPrincipal.toLocaleString('en-IN')} (subject to lender eligibility), your total upfront cash requirement is ₹${totalUpfrontCashRequired.toLocaleString('en-IN')} with an immediate funding deficit of ₹${fundingGap.toLocaleString('en-IN')} that must be funded from cash reserves.`;
    }
  } else {
    if (homeLoanFundingPercent === 0) {
      summaryNarrative = `To acquire a ₹${currentPropertyValue.toLocaleString('en-IN')} home in ${yearsToPurchase} year${yearsToPurchase > 1 ? 's' : ''}, the projected cost is ₹${futurePropertyValue.toLocaleString('en-IN')} plus ₹${additionalPurchaseCosts.toLocaleString('en-IN')} in setup/registration costs. With 100% upfront self-funding (no loan), your upfront cash requirement is ₹${totalUpfrontCashRequired.toLocaleString('en-IN')}, leaving a funding gap of ₹${fundingGap.toLocaleString('en-IN')}.`;
    } else {
      summaryNarrative = `To acquire a ₹${currentPropertyValue.toLocaleString('en-IN')} home in ${yearsToPurchase} year${yearsToPurchase > 1 ? 's' : ''}, the projected cost is ₹${futurePropertyValue.toLocaleString('en-IN')} plus ₹${additionalPurchaseCosts.toLocaleString('en-IN')} in setup/registration costs. Assuming an illustrative ${homeLoanFundingPercent}% loan of ₹${loanPrincipal.toLocaleString('en-IN')} (subject to lender eligibility), your upfront cash gap is ₹${fundingGap.toLocaleString('en-IN')}.`;
    }
  }

  return {
    currentPropertyValue,
    yearsToPurchase,
    annualPropertyGrowthPercent,
    futurePropertyValue,
    additionalCostPercent,
    additionalPurchaseCosts,
    totalFutureCost,
    homeLoanFundingPercent,
    loanPrincipal,
    downPayment,
    totalUpfrontCashRequired,
    totalEarmarkedAssets,
    fundingGap,
    isFullyFunded,
    fundingProgressPercent,
    homeLoanInterestRatePercent,
    loanTenureYears,
    loanEMI,
    totalScheduledLoanInterest,
    currentMonthlyIncome,
    annualIncomeGrowthPercent,
    projectedMonthlyIncome,
    emiToIncomeRatioPercent,
    affordabilityThresholdPercent,
    affordabilityStatus,
    affordabilityInsight,
    expectedInvestmentReturnPercent,
    startInvestingDelayYears,
    remainingAccumulationYears,
    remainingAccumulationMonths,
    annualStepUpPercent,
    requiredLumpSumToday,
    requiredFixedMonthlySIP,
    requiredStartingStepUpSIP,
    isImmediatePurchase,
    hasAccumulationHorizon,
    yearlyFundingSchedule,
    summaryNarrative,
  };
}
