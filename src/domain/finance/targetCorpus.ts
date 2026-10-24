/**
 * Ant Wealth Creation — Target Corpus Reverse SIP Solver
 * 
 * Formalizes:
 * 1. Reverse Annuity-Due calculation for target milestone accumulation.
 * 2. Uses shared effective annual to monthly rate conversion.
 * 3. Optional offset for existing invested capital.
 */

import { assertFiniteNonNegative, assertPositiveInteger, assertStandardInvestmentReturnPercent, FinanceValidationError } from './errors';
import { effectiveAnnualToMonthlyRate } from './investmentRates';

export interface TargetCorpusInput {
  /** Target future corpus desired in Rupees (> 0) */
  readonly targetCorpus: number;
  /** Accumulation horizon in months (integer >= 1) */
  readonly tenureMonths: number;
  /** Assumed effective annual rate of return as percentage (0 <= r <= 100) */
  readonly annualReturnPercent?: number;
  readonly annualReturnRatePercent?: number;
  /** Existing invested capital earmarked for this goal (optional, >= 0) */
  readonly existingInvestedCapital?: number;
  readonly existingSavings?: number;
}

export interface TargetCorpusResult {
  readonly targetCorpus: number;
  readonly existingCapitalFutureValue: number;
  readonly futureValueOfExistingSavings: number;
  readonly netDeficitToAccumulate: number;
  readonly netTargetDeficit: number;
  readonly requiredMonthlySIP: number;
  readonly totalSIPInvested: number;
  readonly totalInvestedViaSIP: number;
  readonly wealthCreatedBySIP: number;
  readonly effectiveMonthlyRate: number;
  readonly assumptions: {
    readonly timing: 'BEGINNING_OF_MONTH';
    readonly rateConvention: 'EFFECTIVE_ANNUAL_GEOMETRIC';
  };
}

/**
 * Solves for the required monthly beginning-of-month SIP to reach a target corpus.
 */
export function calculateTargetCorpus(input: TargetCorpusInput): TargetCorpusResult {
  const annualReturnPercent = input.annualReturnPercent ?? input.annualReturnRatePercent;
  const existingCapital = input.existingInvestedCapital ?? input.existingSavings ?? 0;

  if (typeof input.targetCorpus !== 'number' || !Number.isFinite(input.targetCorpus) || input.targetCorpus <= 0) {
    throw new FinanceValidationError('targetCorpus', input.targetCorpus, 'Target corpus must be a positive finite number (> 0)');
  }
  assertPositiveInteger('tenureMonths', input.tenureMonths);
  assertStandardInvestmentReturnPercent('annualReturnPercent', annualReturnPercent as number);
  assertFiniteNonNegative('existingInvestedCapital', existingCapital);

  const effectiveMonthlyRate = effectiveAnnualToMonthlyRate(annualReturnPercent as number);
  const tenureMonths = input.tenureMonths;
  const targetCorpus = input.targetCorpus;

  // 1. Calculate future value of existing earmarked savings
  let existingCapitalFutureValue = existingCapital;
  if (existingCapital > 0) {
    existingCapitalFutureValue = existingCapital * Math.pow(1 + (annualReturnPercent as number) / 100, tenureMonths / 12);
  }

  // 2. Net deficit to accumulate through fresh monthly SIP
  const netDeficit = Math.max(0, targetCorpus - existingCapitalFutureValue);

  // 3. Solve for required monthly SIP (Annuity-Due formula)
  let requiredMonthlySIP = 0;

  if (netDeficit > 0) {
    if (effectiveMonthlyRate === 0) {
      // Zero-rate limit: simple linear division
      requiredMonthlySIP = netDeficit / tenureMonths;
    } else {
      const i = effectiveMonthlyRate;
      const compoundFactor = Math.pow(1 + i, tenureMonths);
      // FV = P * (((1+i)^n - 1) / i) * (1+i)
      // P = FV * i / ((1+i) * ((1+i)^n - 1))
      requiredMonthlySIP = (netDeficit * i) / ((1 + i) * (compoundFactor - 1));
    }
  }

  const totalSIPInvested = requiredMonthlySIP * tenureMonths;
  const wealthCreatedBySIP = netDeficit - totalSIPInvested;

  return {
    targetCorpus,
    existingCapitalFutureValue,
    futureValueOfExistingSavings: existingCapitalFutureValue,
    netDeficitToAccumulate: netDeficit,
    netTargetDeficit: netDeficit,
    requiredMonthlySIP,
    totalSIPInvested,
    totalInvestedViaSIP: totalSIPInvested,
    wealthCreatedBySIP,
    effectiveMonthlyRate,
    assumptions: {
      timing: 'BEGINNING_OF_MONTH',
      rateConvention: 'EFFECTIVE_ANNUAL_GEOMETRIC',
    },
  };
}
