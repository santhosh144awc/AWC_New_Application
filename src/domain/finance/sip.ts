/**
 * Ant Wealth Creation — Systematic Investment Plan (SIP) Compounding Engine
 * 
 * Formalizes:
 * 1. Beginning-of-month contribution timing (Annuity-Due).
 * 2. Effective annual rate conversion via geometric equivalence ((1+r)^(1/12) - 1).
 * 3. Annual Step-up dynamics: Initial installment remains constant for the first 12 contributions;
 *    first step-up occurs strictly at Month 13, second at Month 25, etc.
 */

import { assertFiniteNonNegative, assertPositiveInteger, assertStandardInvestmentReturnPercent, FinanceValidationError } from './errors';
import { effectiveAnnualToMonthlyRate } from './investmentRates';

export interface SIPInput {
  /** Monthly investment amount in Rupees (>= 0) */
  readonly monthlyInvestment?: number;
  readonly monthlyInstallment?: number;
  /** Total investment horizon in months (integer >= 1) */
  readonly tenureMonths: number;
  /** Assumed effective annual rate of return as percentage (0 <= r <= 100) */
  readonly annualReturnPercent?: number;
  readonly annualReturnRatePercent?: number;
  /** Optional annual step-up percentage (e.g. 10 for 10% increase per year, >= 0) */
  readonly annualStepUpPercent?: number;
  /** Whether to populate the full month-by-month schedule */
  readonly generateSchedule?: boolean;
}

export interface SIPMonthScheduleItem {
  readonly month: number;
  readonly installment: number;
  readonly monthlyInstallment: number;
  readonly openingBalance: number;
  readonly interestEarned: number;
  readonly closingBalance: number;
  readonly cumulativeInvested: number;
}

export interface SIPYearScheduleItem {
  readonly year: number;
  readonly monthlyInstallment: number;
  readonly annualInvested: number;
  readonly cumulativeInvested: number;
  readonly yearEndBalance: number;
  readonly cumulativeGain: number;
}

export interface SIPResult {
  readonly totalInvested: number;
  readonly futureValue: number;
  readonly totalGain: number;
  readonly effectiveMonthlyRate: number;
  readonly monthlySchedule?: SIPMonthScheduleItem[];
  readonly yearlySchedule: SIPYearScheduleItem[];
  readonly assumptions: {
    readonly timing: 'BEGINNING_OF_MONTH';
    readonly rateConvention: 'EFFECTIVE_ANNUAL_GEOMETRIC';
    readonly stepUpTiming: 'AFTER_FIRST_12_MONTHS';
  };
}

/**
 * Calculates compound future value and schedules for fixed or step-up SIPs.
 */
export function calculateSIP(input: SIPInput, includeMonthlySchedule = false): SIPResult {
  const installment = input.monthlyInvestment ?? input.monthlyInstallment;
  const annualRate = input.annualReturnPercent ?? input.annualReturnRatePercent;

  assertFiniteNonNegative('monthlyInvestment', installment as number);
  assertPositiveInteger('tenureMonths', input.tenureMonths);
  assertStandardInvestmentReturnPercent('annualReturnPercent', annualRate as number);

  const stepUpPercent = input.annualStepUpPercent ?? 0;
  assertFiniteNonNegative('annualStepUpPercent', stepUpPercent);
  if (stepUpPercent > 100) {
    throw new FinanceValidationError('annualStepUpPercent', stepUpPercent, 'Annual step-up cannot exceed 100%');
  }

  const effectiveMonthlyRate = effectiveAnnualToMonthlyRate(annualRate as number);
  const tenureMonths = input.tenureMonths;
  const shouldIncludeMonthly = includeMonthlySchedule || Boolean(input.generateSchedule);

  let currentMonthlyInstallment = installment as number;
  let runningBalance = 0;
  let cumulativeInvested = 0;

  const monthlySchedule: SIPMonthScheduleItem[] = [];
  const yearlySchedule: SIPYearScheduleItem[] = [];

  let currentYearInvested = 0;

  for (let m = 1; m <= tenureMonths; m++) {
    // Step-up rule: applies strictly starting at Month 13, 25, 37...
    if (m > 1 && (m - 1) % 12 === 0) {
      currentMonthlyInstallment = currentMonthlyInstallment * (1 + stepUpPercent / 100);
    }

    const openingBalance = runningBalance;
    cumulativeInvested += currentMonthlyInstallment;
    currentYearInvested += currentMonthlyInstallment;

    // Annuity-due timing: contribution is made at beginning of month, earning interest for the full month
    const balanceBeforeInterest = openingBalance + currentMonthlyInstallment;
    const interestEarned = balanceBeforeInterest * effectiveMonthlyRate;
    runningBalance = balanceBeforeInterest + interestEarned;

    if (shouldIncludeMonthly) {
      monthlySchedule.push({
        month: m,
        installment: currentMonthlyInstallment,
        monthlyInstallment: currentMonthlyInstallment,
        openingBalance,
        interestEarned,
        closingBalance: runningBalance,
        cumulativeInvested,
      });
    }

    // Capture year-end milestones
    if (m % 12 === 0 || m === tenureMonths) {
      const yearIndex = Math.ceil(m / 12);
      yearlySchedule.push({
        year: yearIndex,
        monthlyInstallment: currentMonthlyInstallment,
        annualInvested: currentYearInvested,
        cumulativeInvested,
        yearEndBalance: runningBalance,
        cumulativeGain: runningBalance - cumulativeInvested,
      });
      currentYearInvested = 0;
    }
  }

  return {
    totalInvested: cumulativeInvested,
    futureValue: runningBalance,
    totalGain: runningBalance - cumulativeInvested,
    effectiveMonthlyRate,
    monthlySchedule: shouldIncludeMonthly ? monthlySchedule : undefined,
    yearlySchedule,
    assumptions: {
      timing: 'BEGINNING_OF_MONTH',
      rateConvention: 'EFFECTIVE_ANNUAL_GEOMETRIC',
      stepUpTiming: 'AFTER_FIRST_12_MONTHS',
    },
  };
}
