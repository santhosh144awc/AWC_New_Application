/**
 * Ant Wealth Creation — Investment Rate Conversion Utilities
 * 
 * Formalizes GATE-B Rate Semantics:
 * An input displayed as "Assumed annual return" represents an EFFECTIVE ANNUAL GROWTH RATE (EAR),
 * not a nominal annual rate divided by twelve.
 * 
 * For monthly compounding, the equivalent effective monthly rate satisfies:
 *   (1 + i_monthly)^12 = 1 + r_annual
 *   i_monthly = (1 + r_annual)^(1/12) - 1
 */

import { assertValidRatePercent } from './errors';

export interface RateConversionResult {
  readonly annualRatePercent: number;
  readonly annualRateDecimal: number;
  readonly annualEffectiveDecimal: number;
  readonly monthlyEquivalentDecimal: number;
  readonly effectiveMonthlyRate: number;
  readonly monthlyEquivalentPercent: number;
  readonly nominalMonthlyRate: number;
}

/**
 * Converts an effective annual rate (supplied in percentage, e.g., 12.0 for 12%)
 * to its mathematically equivalent effective monthly rate decimal.
 * 
 * NOTE: This is a low-level mathematical converter using assertValidRatePercent (-100 < r <= 1000).
 * Consumer-facing financial engines (SIP, Lumpsum, Target Corpus, Goal Planner) must enforce
 * their standard contract (0 <= r <= 100) via assertStandardInvestmentReturnPercent prior to conversion.
 *
 * @param annualRatePercent Annual effective return rate as a percentage (-100 < r <= 1000)
 * @returns Monthly equivalent effective rate as a decimal (e.g. ~0.00948879 for 12%)
 */
export function effectiveAnnualToMonthlyRate(annualRatePercent: number): number {
  assertValidRatePercent('annualRatePercent', annualRatePercent);

  // Exact boundary for zero return
  if (annualRatePercent === 0) {
    return 0;
  }

  const annualDecimal = annualRatePercent / 100;
  return Math.pow(1 + annualDecimal, 1 / 12) - 1;
}

/**
 * Returns full rate conversion details for auditing and display.
 */
export function getInvestmentRateDetails(annualRatePercent: number): RateConversionResult {
  const annualDecimal = annualRatePercent / 100;
  const monthlyDecimal = effectiveAnnualToMonthlyRate(annualRatePercent);
  const nominalMonthly = annualDecimal / 12;

  return {
    annualRatePercent,
    annualRateDecimal: annualDecimal,
    annualEffectiveDecimal: annualDecimal,
    monthlyEquivalentDecimal: monthlyDecimal,
    effectiveMonthlyRate: monthlyDecimal,
    monthlyEquivalentPercent: monthlyDecimal * 100,
    nominalMonthlyRate: nominalMonthly,
  };
}
