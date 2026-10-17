/**
 * Ant Wealth Creation — Milestone Goal Planning Engine
 * 
 * Formalizes:
 * 1. Independent modeling of inflation rate vs investment return rate.
 * 2. Compounding future milestone cost.
 * 3. Earmarked existing savings growth.
 * 4. Required monthly SIP calculation via targetCorpus solver.
 */

import { assertFiniteNonNegative, assertPositiveInteger, assertValidRatePercent, FinanceValidationError } from './errors';
import { calculateTargetCorpus } from './targetCorpus';

export interface GoalPlannerInput {
  /** Estimated cost of the goal in today's money (> 0) */
  readonly costToday?: number;
  readonly currentGoalCost?: number;
  /** Number of years until milestone is reached (integer >= 1) */
  readonly yearsHorizon?: number;
  readonly timeHorizonYears?: number;
  /** Assumed annual inflation rate for this goal category (e.g. 8 for education, >= 0) */
  readonly annualInflationPercent?: number;
  readonly annualInflationRatePercent?: number;
  /** Assumed effective annual rate of return on investments (-100 < r <= 1000) */
  readonly assumedAnnualReturnPercent?: number;
  readonly annualReturnRatePercent?: number;
  /** Existing savings/investments earmarked for this goal (optional, >= 0) */
  readonly existingSavings?: number;
}

export interface GoalPlannerResult {
  readonly costToday: number;
  readonly currentGoalCost: number;
  readonly yearsHorizon: number;
  readonly timeHorizonYears: number;
  readonly tenureMonths: number;
  readonly annualInflationPercent: number;
  readonly assumedAnnualReturnPercent: number;
  readonly futureGoalCost: number;
  readonly inflationImpactCost: number;
  readonly existingSavingsFutureValue: number;
  readonly futureValueOfExistingSavings: number;
  readonly netFundingDeficit: number;
  readonly requiredMonthlySIP: number;
  readonly totalFreshSIPInvested: number;
  readonly growthFromSIP: number;
  readonly assumptions: {
    readonly inflationCompounding: 'EFFECTIVE_ANNUAL';
    readonly investmentCompounding: 'EFFECTIVE_ANNUAL_GEOMETRIC';
    readonly contributionTiming: 'BEGINNING_OF_MONTH';
  };
}

/**
 * Calculates inflation-adjusted future goal cost, existing capital growth, and required SIP.
 */
export function calculateGoalPlan(input: GoalPlannerInput): GoalPlannerResult {
  const cost = input.costToday ?? input.currentGoalCost;
  const years = input.yearsHorizon ?? input.timeHorizonYears;
  const inflationPercent = input.annualInflationPercent ?? input.annualInflationRatePercent;
  const returnPercent = input.assumedAnnualReturnPercent ?? input.annualReturnRatePercent;
  const existingSavings = input.existingSavings ?? 0;

  if (typeof cost !== 'number' || !Number.isFinite(cost) || cost <= 0) {
    throw new FinanceValidationError('costToday', cost as number, 'Goal cost must be a positive finite number (> 0)');
  }
  assertPositiveInteger('yearsHorizon', years as number);
  assertFiniteNonNegative('annualInflationPercent', inflationPercent as number);
  if ((inflationPercent as number) > 100) {
    throw new FinanceValidationError('annualInflationPercent', inflationPercent, 'Annual inflation rate cannot exceed 100%');
  }
  assertValidRatePercent('assumedAnnualReturnPercent', returnPercent as number);
  assertFiniteNonNegative('existingSavings', existingSavings);

  const yearsHorizon = years as number;
  const tenureMonths = yearsHorizon * 12;

  // 1. Inflate milestone cost into future rupees: C_future = C_today * (1 + inflation)^years
  const inflationDecimal = (inflationPercent as number) / 100;
  const futureGoalCost = (cost as number) * Math.pow(1 + inflationDecimal, yearsHorizon);
  const inflationImpactCost = futureGoalCost - (cost as number);

  // 2. Feed into target corpus reverse solver with existing savings offset
  const targetResult = calculateTargetCorpus({
    targetCorpus: futureGoalCost,
    tenureMonths,
    annualReturnPercent: returnPercent as number,
    existingInvestedCapital: existingSavings,
  });

  return {
    costToday: cost as number,
    currentGoalCost: cost as number,
    yearsHorizon,
    timeHorizonYears: yearsHorizon,
    tenureMonths,
    annualInflationPercent: inflationPercent as number,
    assumedAnnualReturnPercent: returnPercent as number,
    futureGoalCost,
    inflationImpactCost,
    existingSavingsFutureValue: targetResult.existingCapitalFutureValue,
    futureValueOfExistingSavings: targetResult.existingCapitalFutureValue,
    netFundingDeficit: targetResult.netDeficitToAccumulate,
    requiredMonthlySIP: targetResult.requiredMonthlySIP,
    totalFreshSIPInvested: targetResult.totalSIPInvested,
    growthFromSIP: targetResult.wealthCreatedBySIP,
    assumptions: {
      inflationCompounding: 'EFFECTIVE_ANNUAL',
      investmentCompounding: 'EFFECTIVE_ANNUAL_GEOMETRIC',
      contributionTiming: 'BEGINNING_OF_MONTH',
    },
  };
}
