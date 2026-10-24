/**
 * Ant Wealth Creation — Advanced SIP Growth Simulator Engine
 * 
 * Formalizes:
 * 1. Effective Annual Rate (EAR) converted to monthly geometric rate: i = (1 + EAR)^(1/12) - 1.
 * 2. Recurring monthly SIP cash flows occurring at beginning-of-month (Annuity-Due timing).
 * 3. Annual Step-Up with configurable cap year (retaining capped monthly installment thereafter).
 * 4. Multi-injection one-time lump-sum contributions added at beginning of specified projection years.
 * 5. Post-SIP holding period during which the accumulated corpus continues to compound monthly.
 * 6. Zero-return baseline identity: final corpus equals exact total contributions.
 */

import {
  assertFiniteNonNegative,
  assertStandardInvestmentReturnPercent,
  assertValidSipDurationYears,
  assertValidPostSipYears,
  FinanceValidationError,
} from './errors';
import { effectiveAnnualToMonthlyRate } from './investmentRates';

export interface SipGrowthLumpSumEntry {
  /** Optional stable client-side identifier */
  readonly id?: string;
  /** Projection year in which lump sum is added (1 <= year <= totalProjectionYears) */
  readonly year: number;
  /** Capital amount added at beginning of the selected projection year (> 0) */
  readonly amount: number;
  /** Optional user label (e.g. 'Annual Bonus', 'Maturity Proceed') */
  readonly label?: string;
}

export interface SipGrowthInput {
  /** Monthly recurring investment amount (>= 0). Can be 0 if one or more lump sums are specified */
  readonly monthlySIP: number;
  /** Number of years monthly SIP contributions continue (positive integer >= 1) */
  readonly sipDurationYears: number;
  /** Annual percentage increase in monthly contribution (0 <= s <= 50). Defaults to 0 */
  readonly stepUpPercent?: number;
  /** 
   * Number of years for which annual step-ups apply (1 <= duration <= sipDurationYears).
   * Year 1 uses monthlySIP; Year 2 uses monthlySIP * (1 + s); ... Year K uses monthlySIP * (1 + s)^(K-1).
   * For years > K, contribution remains capped at Year K's installment.
   * Defaults to sipDurationYears.
   */
  readonly stepUpDurationYears?: number;
  /** Assumed effective annual rate of return as percentage (0 <= r <= 100) */
  readonly annualReturnPercent: number;
  /** Additional years to hold accumulated balance after monthly SIP stops (0 <= y <= 30). Defaults to 0 */
  readonly postSipYears?: number;
  /** Optional list of one-time investments added at beginning of specified projection years */
  readonly lumpSums?: readonly SipGrowthLumpSumEntry[];
}

export interface SipGrowthYearScheduleItem {
  readonly year: number;
  /** Whether recurring monthly SIP contributions were active during this year */
  readonly isSipActive: boolean;
  /** Balance at start of year before any Year y additions */
  readonly openingBalance: number;
  /** Total recurring monthly SIP contributions made during this year */
  readonly sipContributions: number;
  /** Total one-time lump-sum contributions added at beginning of this year */
  readonly lumpSumContributions: number;
  /** Total contributions added during this year (SIP + Lump Sum) */
  readonly totalYearContributions: number;
  /** Total compound growth earned during this year */
  readonly growthAmount: number;
  /** Closing balance at end of this year */
  readonly closingBalance: number;
  /** Cumulative contributions made from Year 1 through end of Year y */
  readonly cumulativeContributions: number;
  /** Cumulative growth earned from Year 1 through end of Year y */
  readonly cumulativeGrowth: number;
}

export interface SipGrowthResult {
  readonly finalCorpus: number;
  readonly totalSIPInvested: number;
  readonly totalLumpSumsInvested: number;
  readonly totalInvested: number;
  readonly totalGrowth: number;
  readonly effectiveMonthlyRate: number;
  readonly sipDurationYears: number;
  readonly postSipYears: number;
  readonly totalProjectionYears: number;
  readonly annualReturnPercent: number;
  readonly stepUpPercent: number;
  readonly stepUpDurationYears: number;
  readonly yearlySchedule: SipGrowthYearScheduleItem[];
  readonly assumptions: {
    readonly rateConvention: 'EFFECTIVE_ANNUAL_COMPOUNDING';
    readonly monthlyRateFormula: 'i = (1 + r)^(1/12) - 1';
    readonly sipTiming: 'BEGINNING_OF_MONTH';
    readonly lumpSumTiming: 'BEGINNING_OF_SELECTED_YEAR';
    readonly postSipHolding: 'MONTHLY_COMPOUNDING_WITHOUT_FRESH_SIP';
  };
}

/**
 * Calculates compound future value, multi-lump-sum inflows, capped step-ups, and holding period progression.
 */
export function calculateSIPGrowth(input: SipGrowthInput): SipGrowthResult {
  const {
    monthlySIP,
    sipDurationYears,
    stepUpPercent = 0,
    annualReturnPercent,
    postSipYears = 0,
    lumpSums = [],
  } = input;

  // 1. Parameter Validation
  assertFiniteNonNegative('monthlySIP', monthlySIP);
  assertValidSipDurationYears('sipDurationYears', sipDurationYears);
  assertValidPostSipYears('postSipYears', postSipYears);
  assertStandardInvestmentReturnPercent('annualReturnPercent', annualReturnPercent);

  // Validate stepUpPercent (0 to 50)
  if (
    typeof stepUpPercent !== 'number' ||
    !Number.isFinite(stepUpPercent) ||
    stepUpPercent < 0 ||
    stepUpPercent > 50
  ) {
    throw new FinanceValidationError(
      'stepUpPercent',
      stepUpPercent,
      'Step-up percentage must be a finite number between 0% and 50%.'
    );
  }

  // Validate stepUpDurationYears (1 to sipDurationYears)
  const stepUpDurationYears = input.stepUpDurationYears ?? sipDurationYears;
  if (
    typeof stepUpDurationYears !== 'number' ||
    !Number.isFinite(stepUpDurationYears) ||
    !Number.isInteger(stepUpDurationYears) ||
    stepUpDurationYears < 1 ||
    stepUpDurationYears > sipDurationYears
  ) {
    throw new FinanceValidationError(
      'stepUpDurationYears',
      stepUpDurationYears,
      `Step-up duration must be an integer between 1 and ${sipDurationYears} years.`
    );
  }

  const totalProjectionYears = sipDurationYears + postSipYears;
  if (totalProjectionYears > 70) {
    throw new FinanceValidationError(
      'totalProjectionYears',
      totalProjectionYears,
      'Total projection horizon cannot exceed 70 years.'
    );
  }

  // Validate lumpSums
  if (!Array.isArray(lumpSums)) {
    throw new FinanceValidationError('lumpSums', lumpSums, 'Lump sums must be an array.');
  }

  const lumpSumsByYear = new Map<number, number>();
  let totalLumpSumsSum = 0;

  for (let idx = 0; idx < lumpSums.length; idx++) {
    const ls = lumpSums[idx];
    if (typeof ls !== 'object' || ls === null) {
      throw new FinanceValidationError(`lumpSums[${idx}]`, ls, 'Lump sum entry must be an object.');
    }
    if (typeof ls.amount !== 'number' || !Number.isFinite(ls.amount) || ls.amount <= 0) {
      throw new FinanceValidationError(
        `lumpSums[${idx}].amount`,
        ls.amount,
        'Lump sum amount must be a positive finite number (> 0).'
      );
    }
    if (
      typeof ls.year !== 'number' ||
      !Number.isFinite(ls.year) ||
      !Number.isInteger(ls.year) ||
      ls.year < 1 ||
      ls.year > totalProjectionYears
    ) {
      throw new FinanceValidationError(
        `lumpSums[${idx}].year`,
        ls.year,
        `Lump sum year must be an integer between 1 and total projection horizon (${totalProjectionYears} years).`
      );
    }

    lumpSumsByYear.set(ls.year, (lumpSumsByYear.get(ls.year) ?? 0) + ls.amount);
    totalLumpSumsSum += ls.amount;
  }

  // At least one positive contribution must exist
  if (monthlySIP === 0 && totalLumpSumsSum === 0) {
    throw new FinanceValidationError(
      'monthlySIP',
      monthlySIP,
      'At least one recurring monthly SIP or one-time lump sum must be greater than zero.'
    );
  }

  // 2. Financial Rate Derivation
  const effectiveMonthlyRate = effectiveAnnualToMonthlyRate(annualReturnPercent);

  // 3. Month-by-Month Simulation & Yearly Schedule Assembly
  const yearlySchedule: SipGrowthYearScheduleItem[] = [];
  let runningBalance = 0;
  let runningCumulativeInvested = 0;

  for (let y = 1; y <= totalProjectionYears; y++) {
    const openingBalance = runningBalance;
    const isSipActive = y <= sipDurationYears;
    const yearLumpSum = lumpSumsByYear.get(y) ?? 0;
    let yearSip = 0;
    let yearGrowth = 0;

    for (let m = 1; m <= 12; m++) {
      // Lump sum added at beginning of Year y (Month 1 of that year), before growth
      if (m === 1 && yearLumpSum > 0) {
        runningBalance += yearLumpSum;
      }

      // Monthly SIP added at beginning of month, before growth
      if (isSipActive && monthlySIP > 0) {
        const effectiveStepUpYear = Math.min(y, stepUpDurationYears);
        const installment = stepUpPercent > 0
          ? monthlySIP * Math.pow(1 + stepUpPercent / 100, effectiveStepUpYear - 1)
          : monthlySIP;

        runningBalance += installment;
        yearSip += installment;
      }

      // Apply monthly effective return
      const monthlyGrowth = runningBalance * effectiveMonthlyRate;
      runningBalance += monthlyGrowth;
      yearGrowth += monthlyGrowth;
    }

    const totalYearInvested = yearSip + yearLumpSum;
    runningCumulativeInvested += totalYearInvested;
    const closingBalance = runningBalance;
    const cumulativeGrowth = closingBalance - runningCumulativeInvested;

    yearlySchedule.push({
      year: y,
      isSipActive,
      openingBalance,
      sipContributions: yearSip,
      lumpSumContributions: yearLumpSum,
      totalYearContributions: totalYearInvested,
      growthAmount: yearGrowth,
      closingBalance,
      cumulativeContributions: runningCumulativeInvested,
      cumulativeGrowth,
    });
  }

  const finalCorpus = runningBalance;
  const totalSIPInvested = yearlySchedule.reduce((sum, item) => sum + item.sipContributions, 0);
  const totalLumpSumsInvested = yearlySchedule.reduce((sum, item) => sum + item.lumpSumContributions, 0);
  const totalInvested = totalSIPInvested + totalLumpSumsInvested;
  const totalGrowth = finalCorpus - totalInvested;

  return {
    finalCorpus,
    totalSIPInvested,
    totalLumpSumsInvested,
    totalInvested,
    totalGrowth,
    effectiveMonthlyRate,
    sipDurationYears,
    postSipYears,
    totalProjectionYears,
    annualReturnPercent,
    stepUpPercent,
    stepUpDurationYears,
    yearlySchedule,
    assumptions: {
      rateConvention: 'EFFECTIVE_ANNUAL_COMPOUNDING',
      monthlyRateFormula: 'i = (1 + r)^(1/12) - 1',
      sipTiming: 'BEGINNING_OF_MONTH',
      lumpSumTiming: 'BEGINNING_OF_SELECTED_YEAR',
      postSipHolding: 'MONTHLY_COMPOUNDING_WITHOUT_FRESH_SIP',
    },
  };
}
