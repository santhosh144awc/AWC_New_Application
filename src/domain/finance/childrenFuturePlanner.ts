/**
 * Ant Wealth Creation — Children's Future Multi-Milestone Planner Domain Engine
 *
 * Implements:
 * 1. Multi-child, multi-milestone planning with independent inflation per milestone.
 * 2. Central existing investments register with strict non-double-counting invariants.
 * 3. Beginning-of-month (Annuity-Due) compounding using effective annual rate conventions.
 * 4. Dual funding solutions: Fixed Monthly SIP vs Annual Step-Up SIP (via calculateSIP solver).
 * 5. Combined family roadmap with year-by-year active milestone cash-flow reconciliation.
 */

import {
  assertFiniteNonNegative,
  assertPositiveInteger,
  assertStandardInvestmentReturnPercent,
  FinanceValidationError,
} from './errors';
import { calculateTargetCorpus } from './targetCorpus';
import { calculateSIP } from './sip';

export type MilestoneCategory =
  | 'SCHOOL_COLLEGE'
  | 'DOMESTIC_HIGHER_EDUCATION'
  | 'OVERSEAS_EDUCATION'
  | 'POSTGRADUATE'
  | 'MARRIAGE_LIFE_EVENT'
  | 'OTHER';

export interface ChildProfile {
  readonly id: string;
  readonly name?: string;
  /** Current age in whole years (0 to 25) */
  readonly currentAge: number;
}

export interface ExistingInvestmentItem {
  readonly id: string;
  readonly label: string;
  /** Current market value in rupees (>= 0) */
  readonly currentValue: number;
}

export interface MilestoneAllocation {
  readonly investmentId: string;
  /** Amount allocated from this investment to this milestone (>= 0) */
  readonly allocatedAmount: number;
}

export interface MilestoneItem {
  readonly id: string;
  readonly childId: string;
  readonly title: string;
  readonly category: MilestoneCategory;
  /** Target age in whole years when funds must be ready (> child's current age; horizon <= 35) */
  readonly targetAge: number;
  /** Estimated cost in today's rupees (> 0) */
  readonly costToday: number;
  /** Assumed annual education/milestone inflation rate (0 <= r <= 25) */
  readonly annualInflationPercent: number;
  readonly allocations: readonly MilestoneAllocation[];
}

export interface ChildrenFuturePlannerInputs {
  readonly children: readonly ChildProfile[];
  readonly existingInvestments: readonly ExistingInvestmentItem[];
  readonly milestones: readonly MilestoneItem[];
  /** Shared assumed effective annual return on investments (0 <= r <= 50) */
  readonly assumedAnnualReturnPercent: number;
  /** Annual step-up percentage for step-up SIP option (0 <= s <= 50, default 10) */
  readonly annualStepUpPercent?: number;
}

export interface MilestoneCalculationResult {
  readonly milestoneId: string;
  readonly childId: string;
  readonly childName: string;
  readonly title: string;
  readonly category: MilestoneCategory;
  readonly childCurrentAge: number;
  readonly targetAge: number;
  readonly horizonYears: number;
  readonly tenureMonths: number;
  readonly costToday: number;
  readonly annualInflationPercent: number;
  readonly futureGoalCost: number;
  readonly inflationImpactCost: number;
  readonly allocatedCurrentAssets: number;
  readonly futureValueOfAllocatedAssets: number;
  readonly fundingShortfall: number;
  readonly isFullyCovered: boolean;
  readonly requiredFixedMonthlySIP: number;
  readonly totalFixedSIPInvested: number;
  readonly requiredStepUpMonthlySIP: number;
  readonly totalStepUpSIPInvested: number;
  readonly singleLumpSumEquivalentToday: number;
}

export interface InvestmentReconciliationItem {
  readonly investmentId: string;
  readonly label: string;
  readonly currentValue: number;
  readonly totalAllocatedAmount: number;
  readonly unallocatedAmount: number;
  readonly allocationPercent: number;
}

export interface FamilyYearScheduleItem {
  readonly year: number;
  /** Number of active milestones accumulating funds in this year */
  readonly activeMilestonesCount: number;
  /** Monthly outlay in this year under fixed SIP mode */
  readonly fixedMonthlyOutlay: number;
  /** Annual outlay in this year under fixed SIP mode */
  readonly fixedAnnualOutlay: number;
  /** Monthly outlay in this year under step-up SIP mode */
  readonly stepUpMonthlyOutlay: number;
  /** Annual outlay in this year under step-up SIP mode */
  readonly stepUpAnnualOutlay: number;
}

export interface ChildrenFuturePlannerResult {
  readonly childrenCount: number;
  readonly milestonesCount: number;
  readonly assumedAnnualReturnPercent: number;
  readonly annualStepUpPercent: number;
  readonly milestoneResults: readonly MilestoneCalculationResult[];
  readonly investmentReconciliations: readonly InvestmentReconciliationItem[];
  readonly totalCostToday: number;
  /** Sum of separate future outlays at their respective milestone target dates */
  readonly totalFutureMilestoneCosts: number;
  readonly totalAllocatedCurrentAssets: number;
  readonly totalFutureValueOfAllocatedAssets: number;
  readonly totalFundingShortfall: number;
  /** Total required starting monthly SIP in Year 1 across all active milestones (Fixed mode) */
  readonly totalStartingFixedMonthlySIP: number;
  /** Total required starting monthly SIP in Year 1 across all active milestones (Step-Up mode) */
  readonly totalStartingStepUpMonthlySIP: number;
  /** Sum of single lump-sum equivalents required today across milestones */
  readonly totalLumpSumEquivalentToday: number;
  readonly yearlySchedule: readonly FamilyYearScheduleItem[];
  readonly assumptions: {
    readonly inflationCompounding: 'EFFECTIVE_ANNUAL';
    readonly investmentCompounding: 'EFFECTIVE_ANNUAL_GEOMETRIC';
    readonly contributionTiming: 'BEGINNING_OF_MONTH';
    readonly stepUpTiming: 'AFTER_FIRST_12_MONTHS';
  };
}

/**
 * Solves for the initial base monthly SIP required such that:
 * calculateSIP({ monthlyInvestment: M0, tenureMonths, annualReturnPercent, annualStepUpPercent }).futureValue === targetShortfall
 * within a 0.01 rupee tolerance.
 */
export function solveRequiredStepUpSIP(
  targetShortfall: number,
  tenureMonths: number,
  annualReturnPercent: number,
  annualStepUpPercent: number
): number {
  if (targetShortfall <= 0 || tenureMonths <= 0) {
    return 0;
  }

  // If step-up is 0%, delegate directly to target corpus solver
  if (annualStepUpPercent === 0) {
    const res = calculateTargetCorpus({
      targetCorpus: targetShortfall,
      tenureMonths,
      annualReturnPercent,
      existingInvestedCapital: 0,
    });
    return res.requiredMonthlySIP;
  }

  // Linear evaluation: future value scales linearly with initial monthly installment
  const unitResult = calculateSIP({
    monthlyInvestment: 1.0,
    tenureMonths,
    annualReturnPercent,
    annualStepUpPercent,
  });

  if (unitResult.futureValue <= 0) {
    return targetShortfall / tenureMonths;
  }

  const initialEstimate = targetShortfall / unitResult.futureValue;

  // Refine using bisection / secant if numerical roundoff exceeds 0.01 INR
  let low = 0;
  let high = initialEstimate * 2;
  let guess = initialEstimate;

  for (let iter = 0; iter < 40; iter++) {
    const testRes = calculateSIP({
      monthlyInvestment: guess,
      tenureMonths,
      annualReturnPercent,
      annualStepUpPercent,
    });
    const diff = testRes.futureValue - targetShortfall;

    if (Math.abs(diff) <= 0.01) {
      return guess;
    }

    if (diff < 0) {
      low = guess;
    } else {
      high = guess;
    }
    guess = (low + high) / 2;
  }

  return guess;
}

/**
 * Primary domain engine for Children's Future Multi-Milestone Planning.
 */
export function calculateChildrenFuturePlan(
  inputs: ChildrenFuturePlannerInputs
): ChildrenFuturePlannerResult {
  const returnRate = inputs.assumedAnnualReturnPercent;
  const stepUpRate = inputs.annualStepUpPercent ?? 10.0;

  assertStandardInvestmentReturnPercent('assumedAnnualReturnPercent', returnRate);
  if (returnRate > 50) {
    throw new FinanceValidationError(
      'assumedAnnualReturnPercent',
      returnRate,
      'Assumed annual return rate cannot exceed 50%'
    );
  }
  assertFiniteNonNegative('annualStepUpPercent', stepUpRate);
  if (stepUpRate > 50) {
    throw new FinanceValidationError(
      'annualStepUpPercent',
      stepUpRate,
      'Annual step-up percentage cannot exceed 50%'
    );
  }

  // 1. Validate children profiles
  const childMap = new Map<string, ChildProfile>();
  for (let i = 0; i < inputs.children.length; i++) {
    const ch = inputs.children[i];
    if (!ch.id || typeof ch.id !== 'string') {
      throw new FinanceValidationError(`children[${i}].id`, ch.id, 'Child ID must be a non-empty string');
    }
    if (childMap.has(ch.id)) {
      throw new FinanceValidationError(`children[${i}].id`, ch.id, `Duplicate child ID: ${ch.id}`);
    }
    assertFiniteNonNegative(`children[${i}].currentAge`, ch.currentAge);
    if (!Number.isInteger(ch.currentAge) || ch.currentAge > 25) {
      throw new FinanceValidationError(
        `children[${i}].currentAge`,
        ch.currentAge,
        'Child current age must be an integer between 0 and 25'
      );
    }
    childMap.set(ch.id, ch);
  }

  // 2. Validate existing investments
  const investmentMap = new Map<string, ExistingInvestmentItem>();
  const investmentAllocatedTotals = new Map<string, number>();

  for (let i = 0; i < inputs.existingInvestments.length; i++) {
    const inv = inputs.existingInvestments[i];
    if (!inv.id || typeof inv.id !== 'string') {
      throw new FinanceValidationError(`existingInvestments[${i}].id`, inv.id, 'Investment ID must be a non-empty string');
    }
    if (investmentMap.has(inv.id)) {
      throw new FinanceValidationError(`existingInvestments[${i}].id`, inv.id, `Duplicate investment ID: ${inv.id}`);
    }
    assertFiniteNonNegative(`existingInvestments[${i}].currentValue`, inv.currentValue);
    if (inv.currentValue > 1e9) {
      throw new FinanceValidationError(
        `existingInvestments[${i}].currentValue`,
        inv.currentValue,
        'Investment value exceeds maximum supported threshold'
      );
    }
    investmentMap.set(inv.id, inv);
    investmentAllocatedTotals.set(inv.id, 0);
  }

  // 3. Track allocations and validate milestones
  const milestoneIds = new Set<string>();
  for (let i = 0; i < inputs.milestones.length; i++) {
    const m = inputs.milestones[i];
    if (!m.id || typeof m.id !== 'string') {
      throw new FinanceValidationError(`milestones[${i}].id`, m.id, 'Milestone ID must be a non-empty string');
    }
    if (milestoneIds.has(m.id)) {
      throw new FinanceValidationError(`milestones[${i}].id`, m.id, `Duplicate milestone ID: ${m.id}`);
    }
    milestoneIds.add(m.id);

    const child = childMap.get(m.childId);
    if (!child) {
      throw new FinanceValidationError(
        `milestones[${i}].childId`,
        m.childId,
        `Milestone references non-existent child ID: ${m.childId}`
      );
    }

    assertPositiveInteger(`milestones[${i}].targetAge`, m.targetAge);
    if (m.targetAge <= child.currentAge) {
      throw new FinanceValidationError(
        `milestones[${i}].targetAge`,
        m.targetAge,
        `Target age (${m.targetAge}) must be strictly greater than child current age (${child.currentAge})`
      );
    }

    const horizon = m.targetAge - child.currentAge;
    if (horizon > 35) {
      throw new FinanceValidationError(
        `milestones[${i}].targetAge`,
        m.targetAge,
        `Planning horizon of ${horizon} years exceeds maximum supported 35-year limit`
      );
    }

    if (typeof m.costToday !== 'number' || !Number.isFinite(m.costToday) || m.costToday <= 0) {
      throw new FinanceValidationError(
        `milestones[${i}].costToday`,
        m.costToday,
        'Milestone cost today must be a positive finite number (> 0)'
      );
    }
    if (m.costToday > 500000000) {
      // 50 Crore upper threshold
      throw new FinanceValidationError(
        `milestones[${i}].costToday`,
        m.costToday,
        'Milestone cost today exceeds realistic upper bound (₹50 Crore)'
      );
    }

    assertFiniteNonNegative(`milestones[${i}].annualInflationPercent`, m.annualInflationPercent);
    if (m.annualInflationPercent > 25) {
      throw new FinanceValidationError(
        `milestones[${i}].annualInflationPercent`,
        m.annualInflationPercent,
        'Assumed inflation rate cannot exceed 25%'
      );
    }

    // Accumulate allocations for double-counting validation
    if (m.allocations && Array.isArray(m.allocations)) {
      for (let j = 0; j < m.allocations.length; j++) {
        const alloc = m.allocations[j];
        if (!investmentMap.has(alloc.investmentId)) {
          throw new FinanceValidationError(
            `milestones[${i}].allocations[${j}].investmentId`,
            alloc.investmentId,
            `Allocation references unknown investment ID: ${alloc.investmentId}`
          );
        }
        assertFiniteNonNegative(
          `milestones[${i}].allocations[${j}].allocatedAmount`,
          alloc.allocatedAmount
        );

        const currentTotal = investmentAllocatedTotals.get(alloc.investmentId) ?? 0;
        investmentAllocatedTotals.set(alloc.investmentId, currentTotal + alloc.allocatedAmount);
      }
    }
  }

  // 4. Strict Non-Double-Counting Invariant:
  // Total allocations across all milestones must never exceed each source asset's current value
  for (const [invId, totalAllocated] of investmentAllocatedTotals.entries()) {
    const inv = investmentMap.get(invId)!;
    if (totalAllocated > inv.currentValue + 0.01) {
      throw new FinanceValidationError(
        `investment[${invId}].allocatedAmount`,
        totalAllocated,
        `Total allocations across all milestones (₹${totalAllocated.toLocaleString('en-IN')}) exceed available asset value of "${inv.label}" (₹${inv.currentValue.toLocaleString('en-IN')}).`
      );
    }
  }

  // 5. Per-Milestone Calculations
  const milestoneResults: MilestoneCalculationResult[] = [];
  let totalCostToday = 0;
  let totalFutureMilestoneCosts = 0;
  let totalAllocatedCurrentAssets = 0;
  let totalFutureValueOfAllocatedAssets = 0;
  let totalFundingShortfall = 0;
  let totalStartingFixedMonthlySIP = 0;
  let totalStartingStepUpMonthlySIP = 0;
  let totalLumpSumEquivalentToday = 0;

  let maxHorizonYears = 0;

  for (let i = 0; i < inputs.milestones.length; i++) {
    const m = inputs.milestones[i];
    const child = childMap.get(m.childId)!;
    const horizonYears = m.targetAge - child.currentAge;
    const tenureMonths = horizonYears * 12;
    if (horizonYears > maxHorizonYears) {
      maxHorizonYears = horizonYears;
    }

    totalCostToday += m.costToday;

    // A. Future Goal Cost (effective annual inflation)
    const inflationDecimal = m.annualInflationPercent / 100;
    const futureGoalCost = m.costToday * Math.pow(1 + inflationDecimal, horizonYears);
    const inflationImpactCost = futureGoalCost - m.costToday;
    totalFutureMilestoneCosts += futureGoalCost;

    // B. Allocated investments for this milestone
    let allocatedCurrentAssets = 0;
    if (m.allocations && Array.isArray(m.allocations)) {
      for (const alloc of m.allocations) {
        allocatedCurrentAssets += alloc.allocatedAmount;
      }
    }
    totalAllocatedCurrentAssets += allocatedCurrentAssets;

    // C. Future value of allocated investments
    const returnDecimal = returnRate / 100;
    const futureValueOfAllocatedAssets =
      allocatedCurrentAssets * Math.pow(1 + returnDecimal, horizonYears);
    totalFutureValueOfAllocatedAssets += futureValueOfAllocatedAssets;

    // D. Net funding shortfall
    const fundingShortfall = Math.max(0, futureGoalCost - futureValueOfAllocatedAssets);
    totalFundingShortfall += fundingShortfall;
    const isFullyCovered = fundingShortfall <= 0.005;

    // E. Monthly contributions and lump-sum equivalent
    let requiredFixedMonthlySIP = 0;
    let totalFixedSIPInvested = 0;
    let requiredStepUpMonthlySIP = 0;
    let totalStepUpSIPInvested = 0;
    let singleLumpSumEquivalentToday = 0;

    if (!isFullyCovered) {
      // 1. Fixed SIP
      const fixedResult = calculateTargetCorpus({
        targetCorpus: fundingShortfall,
        tenureMonths,
        annualReturnPercent: returnRate,
        existingInvestedCapital: 0,
      });
      requiredFixedMonthlySIP = fixedResult.requiredMonthlySIP;
      totalFixedSIPInvested = fixedResult.totalSIPInvested;

      // 2. Step-Up SIP
      requiredStepUpMonthlySIP = solveRequiredStepUpSIP(
        fundingShortfall,
        tenureMonths,
        returnRate,
        stepUpRate
      );
      const stepUpSim = calculateSIP({
        monthlyInvestment: requiredStepUpMonthlySIP,
        tenureMonths,
        annualReturnPercent: returnRate,
        annualStepUpPercent: stepUpRate,
      });
      totalStepUpSIPInvested = stepUpSim.totalInvested;

      // 3. Single lump-sum equivalent today
      singleLumpSumEquivalentToday =
        returnRate === 0
          ? fundingShortfall
          : fundingShortfall / Math.pow(1 + returnDecimal, horizonYears);
    }

    totalStartingFixedMonthlySIP += requiredFixedMonthlySIP;
    totalStartingStepUpMonthlySIP += requiredStepUpMonthlySIP;
    totalLumpSumEquivalentToday += singleLumpSumEquivalentToday;

    milestoneResults.push({
      milestoneId: m.id,
      childId: child.id,
      childName: child.name || `Child ${inputs.children.indexOf(child) + 1}`,
      title: m.title,
      category: m.category,
      childCurrentAge: child.currentAge,
      targetAge: m.targetAge,
      horizonYears,
      tenureMonths,
      costToday: m.costToday,
      annualInflationPercent: m.annualInflationPercent,
      futureGoalCost,
      inflationImpactCost,
      allocatedCurrentAssets,
      futureValueOfAllocatedAssets,
      fundingShortfall,
      isFullyCovered,
      requiredFixedMonthlySIP,
      totalFixedSIPInvested,
      requiredStepUpMonthlySIP,
      totalStepUpSIPInvested,
      singleLumpSumEquivalentToday,
    });
  }

  // 6. Investment Reconciliations
  const investmentReconciliations: InvestmentReconciliationItem[] = [];
  for (const inv of inputs.existingInvestments) {
    const allocated = investmentAllocatedTotals.get(inv.id) ?? 0;
    const unallocated = Math.max(0, inv.currentValue - allocated);
    const allocationPercent = inv.currentValue > 0 ? (allocated / inv.currentValue) * 100 : 0;

    investmentReconciliations.push({
      investmentId: inv.id,
      label: inv.label,
      currentValue: inv.currentValue,
      totalAllocatedAmount: allocated,
      unallocatedAmount: unallocated,
      allocationPercent,
    });
  }

  // 7. Year-by-Year Family Contribution Schedule
  const yearlySchedule: FamilyYearScheduleItem[] = [];

  for (let year = 1; year <= maxHorizonYears; year++) {
    let activeMilestonesCount = 0;
    let fixedMonthlyOutlay = 0;
    let stepUpMonthlyOutlay = 0;

    for (const mr of milestoneResults) {
      if (year <= mr.horizonYears && !mr.isFullyCovered) {
        activeMilestonesCount++;
        // Fixed SIP remains constant for all active years of this milestone
        fixedMonthlyOutlay += mr.requiredFixedMonthlySIP;

        // Step-Up SIP increases by stepUpRate every 12 months (year 1 is base, year 2 is base * (1+s), etc.)
        const stepMultiplier = Math.pow(1 + stepUpRate / 100, year - 1);
        stepUpMonthlyOutlay += mr.requiredStepUpMonthlySIP * stepMultiplier;
      }
    }

    yearlySchedule.push({
      year,
      activeMilestonesCount,
      fixedMonthlyOutlay,
      fixedAnnualOutlay: fixedMonthlyOutlay * 12,
      stepUpMonthlyOutlay,
      stepUpAnnualOutlay: stepUpMonthlyOutlay * 12,
    });
  }

  return {
    childrenCount: inputs.children.length,
    milestonesCount: inputs.milestones.length,
    assumedAnnualReturnPercent: returnRate,
    annualStepUpPercent: stepUpRate,
    milestoneResults,
    investmentReconciliations,
    totalCostToday,
    totalFutureMilestoneCosts,
    totalAllocatedCurrentAssets,
    totalFutureValueOfAllocatedAssets,
    totalFundingShortfall,
    totalStartingFixedMonthlySIP,
    totalStartingStepUpMonthlySIP,
    totalLumpSumEquivalentToday,
    yearlySchedule,
    assumptions: {
      inflationCompounding: 'EFFECTIVE_ANNUAL',
      investmentCompounding: 'EFFECTIVE_ANNUAL_GEOMETRIC',
      contributionTiming: 'BEGINNING_OF_MONTH',
      stepUpTiming: 'AFTER_FIRST_12_MONTHS',
    },
  };
}

/**
 * Authoritative Canonical Urban Family Sample Fixture
 * Matches VEC-KID-06 exactly.
 */
export const CANONICAL_CHILDREN_PLANNER_SAMPLE: ChildrenFuturePlannerInputs = {
  children: [
    { id: 'kid-1', name: 'Aarav', currentAge: 6 },
    { id: 'kid-2', name: 'Ananya', currentAge: 3 },
  ],
  existingInvestments: [
    { id: 'inv-1', label: 'Earmarked Education Mutual Funds', currentValue: 500000 },
    { id: 'inv-2', label: 'Sukanya / Long-Term Fixed Deposit', currentValue: 300000 },
  ],
  milestones: [
    {
      id: 'ms-1',
      childId: 'kid-1',
      title: 'Undergraduate College / B.Tech',
      category: 'DOMESTIC_HIGHER_EDUCATION',
      targetAge: 18,
      costToday: 2000000,
      annualInflationPercent: 8.0,
      allocations: [
        { investmentId: 'inv-1', allocatedAmount: 200000 },
        { investmentId: 'inv-2', allocatedAmount: 100000 },
      ],
    },
    {
      id: 'ms-2',
      childId: 'kid-2',
      title: 'Overseas Masters Degree',
      category: 'OVERSEAS_EDUCATION',
      targetAge: 21,
      costToday: 3500000,
      annualInflationPercent: 9.0,
      allocations: [{ investmentId: 'inv-1', allocatedAmount: 200000 }],
    },
  ],
  assumedAnnualReturnPercent: 10.0,
  annualStepUpPercent: 10.0,
};
