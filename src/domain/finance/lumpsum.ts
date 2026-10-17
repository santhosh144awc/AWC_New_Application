/**
 * Ant Wealth Creation — Lump Sum Investment Compounding Engine
 * 
 * Formalizes:
 * 1. Effective annual rate compounding convention.
 * 2. Full internal floating-point precision with yearly balance progression.
 */

import { assertFiniteNonNegative, assertPositiveInteger, assertValidRatePercent } from './errors';

export interface LumpsumInput {
  /** One-time principal investment amount (>= 0) */
  readonly principal?: number;
  readonly initialPrincipal?: number;
  /** Investment duration in years (positive integer >= 1) */
  readonly years?: number;
  readonly durationYears?: number;
  /** Assumed effective annual rate of return as percentage (-100 < r <= 1000) */
  readonly annualReturnPercent?: number;
  readonly annualReturnRatePercent?: number;
  /** Whether to populate yearly schedule */
  readonly generateSchedule?: boolean;
}

export interface LumpsumYearScheduleItem {
  readonly year: number;
  readonly openingBalance: number;
  readonly growthAmount: number;
  readonly closingBalance: number;
  readonly cumulativeGain: number;
}

export interface LumpsumResult {
  readonly principal: number;
  readonly initialPrincipal: number;
  readonly futureValue: number;
  readonly totalGain: number;
  readonly years: number;
  readonly durationYears: number;
  readonly annualReturnPercent: number;
  readonly yearlySchedule: LumpsumYearScheduleItem[];
  readonly assumptions: {
    readonly rateConvention: 'EFFECTIVE_ANNUAL_COMPOUNDING';
  };
}

/**
 * Calculates compound future value and annual progression for a one-time capital investment.
 */
export function calculateLumpsum(input: LumpsumInput): LumpsumResult {
  const principal = input.principal ?? input.initialPrincipal;
  const years = input.years ?? input.durationYears;
  const annualReturnPercent = input.annualReturnPercent ?? input.annualReturnRatePercent;

  assertFiniteNonNegative('principal', principal as number);
  assertPositiveInteger('years', years as number);
  assertValidRatePercent('annualReturnPercent', annualReturnPercent as number);

  const annualDecimal = (annualReturnPercent as number) / 100;
  const yearlySchedule: LumpsumYearScheduleItem[] = [];

  let runningBalance = principal as number;

  for (let y = 1; y <= (years as number); y++) {
    const openingBalance = runningBalance;
    const growthAmount = openingBalance * annualDecimal;
    runningBalance = openingBalance + growthAmount;

    yearlySchedule.push({
      year: y,
      openingBalance,
      growthAmount,
      closingBalance: runningBalance,
      cumulativeGain: runningBalance - (principal as number),
    });
  }

  // Exact compound formula check
  const directFV = (principal as number) * Math.pow(1 + annualDecimal, years as number);

  return {
    principal: principal as number,
    initialPrincipal: principal as number,
    futureValue: directFV,
    totalGain: directFV - (principal as number),
    years: years as number,
    durationYears: years as number,
    annualReturnPercent: annualReturnPercent as number,
    yearlySchedule,
    assumptions: {
      rateConvention: 'EFFECTIVE_ANNUAL_COMPOUNDING',
    },
  };
}
