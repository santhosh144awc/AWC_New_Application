/**
 * Ant Wealth Creation — Family Life Insurance Protection Needs Domain Engine
 *
 * ARCHITECTURAL CONTRACT:
 * 1. 100% Pure TypeScript calculation logic only.
 * 2. Absolutely NO React, Astro, DOM, browser storage, or network imports.
 * 3. Handles numerical stability for r ≈ g using L'Hôpital limit case.
 * 4. Models 3 distinct pillars:
 *    - Routine Family Living Support (Growing Annuity Present Value)
 *    - Liabilities & Immediate Transition Buffer
 *    - Future Family Milestones (Discounted Present Values)
 * 5. Deducts only user-earmarked funds (never arbitrary total net worth).
 * 6. Computes primary gap against Personal Term Cover, with an optional alternate scenario for Employer Group Cover.
 *
 * SPECIFICATION REFERENCE:
 * product-docs/finance/LIFE_INSURANCE_PLANNER_SPEC.md
 * product-docs/finance/LIFE_INSURANCE_PLANNER_TEST_VECTORS.csv
 */

export interface FutureMilestone {
  id: string;
  name: string;
  costToday: number;
  yearsUntilGoal: number;
  inflationRatePct: number;
}

export interface LifeInsuranceInput {
  // Step 1: Routine Family Support
  annualTakeHomeIncome?: number;
  annualFamilyLivingExpenses: number;
  supportDurationYears: number; // 1 to 45 years
  supportExpenseGrowthPct: number; // 0% to 12% p.a.
  investmentReturnPct: number; // 0% to 15% p.a. safe deployment yield

  // Step 2: Liabilities & Transition Buffer
  homeLoanOutstanding: number;
  otherLoansOutstanding: number;
  otherLiabilities: number;
  immediateTransitionBuffer: number;

  // Step 3: Milestones & Existing Resources
  futureMilestones: FutureMilestone[];
  eligibleEarmarkedFunds: number;
  existingPersonalLifeCover: number;
  employerGroupLifeCover: number;
  includeEmployerGroupCover?: boolean;
}

export interface MilestoneCalculation {
  id: string;
  name: string;
  costToday: number;
  yearsUntilGoal: number;
  inflationRatePct: number;
  futureCost: number;
  presentValue: number;
}

export interface LifeInsuranceValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export interface LifeInsuranceResult {
  // Pillar 1: Routine Living Support
  familySupportPV: number;

  // Pillar 2: Liabilities & Buffer
  homeLoanOutstanding: number;
  otherLoansOutstanding: number;
  otherLiabilities: number;
  totalOutstandingLiabilities: number;
  immediateObligations: number;

  // Pillar 3: Future Milestones
  milestonesTotalPV: number;
  milestoneDetails: MilestoneCalculation[];

  // Offsetting Resources
  eligibleEarmarkedFunds: number;

  // Aggregate Totals
  grossProtectionNeed: number;
  netProtectionNeedAfterEarmarked: number;

  // Personal Cover Evaluation (Primary)
  existingPersonalLifeCover: number;
  additionalPersonalCoverGap: number;
  isFullyCoveredPersonally: boolean;

  // Employer / Group Cover Evaluation (Alternate)
  employerGroupLifeCover: number;
  gapIncludingGroupCover: number;
  isEmployerGroupCoverIncluded: boolean;
  isFullyCoveredWithGroup: boolean;

  // Surplus Metadata
  hasEarmarkedSurplus: boolean;
  earmarkedSurplusAmount: number;
}

/**
 * Calculates the Present Value of a growing annuity representing annual routine family living support.
 *
 * Formula:
 * If r != g: PV = C1 * (1 - ((1 + g) / (1 + r))^n) / (r - g)
 * If |r - g| < 1e-7: PV = (C1 * n) / (1 + r)
 *
 * @param annualLivingExpenses First year routine living support (C1)
 * @param growthPct Annual expense growth percentage (g%)
 * @param returnPct Annual safe investment yield percentage (r%)
 * @param durationYears Number of support years (n)
 */
export function calculateFamilySupportPV(
  annualLivingExpenses: number,
  growthPct: number,
  returnPct: number,
  durationYears: number
): number {
  if (
    !Number.isFinite(annualLivingExpenses) ||
    annualLivingExpenses <= 0 ||
    !Number.isFinite(durationYears) ||
    durationYears <= 0 ||
    !Number.isFinite(growthPct) ||
    !Number.isFinite(returnPct)
  ) {
    return 0;
  }

  const g = Math.max(0, growthPct) / 100;
  const r = Math.max(0, returnPct) / 100;
  const n = Math.round(durationYears);

  // Numerical stability tolerance for r ≈ g
  if (Math.abs(r - g) < 1e-7) {
    return (annualLivingExpenses * n) / (1 + r);
  }

  const ratio = (1 + g) / (1 + r);
  const pv = (annualLivingExpenses * (1 - Math.pow(ratio, n))) / (r - g);
  return Math.max(0, pv);
}

/**
 * Calculates the projected future cost and present value to reserve today for a future milestone.
 *
 * @param costToday Cost in today's rupees (G0)
 * @param inflationRatePct Milestone inflation rate percentage (g%)
 * @param returnPct Annual safe investment yield percentage (r%)
 * @param yearsUntilGoal Horizon in years (t)
 */
export function calculateMilestonePV(
  costToday: number,
  inflationRatePct: number,
  returnPct: number,
  yearsUntilGoal: number
): { futureCost: number; presentValue: number } {
  if (
    !Number.isFinite(costToday) ||
    costToday <= 0 ||
    !Number.isFinite(inflationRatePct) ||
    !Number.isFinite(returnPct) ||
    !Number.isFinite(yearsUntilGoal)
  ) {
    return { futureCost: 0, presentValue: 0 };
  }

  const t = Math.max(0, Math.round(yearsUntilGoal));
  if (t === 0) {
    return { futureCost: costToday, presentValue: costToday };
  }

  const g = Math.max(0, inflationRatePct) / 100;
  const r = Math.max(0, returnPct) / 100;

  const futureCost = costToday * Math.pow(1 + g, t);
  const presentValue = r === 0 ? futureCost : futureCost / Math.pow(1 + r, t);

  return {
    futureCost: Math.max(0, futureCost),
    presentValue: Math.max(0, presentValue),
  };
}

/**
 * Validates inputs for the Life Insurance Protection Needs Planner.
 */
export function validateLifeInsuranceInput(input: LifeInsuranceInput): LifeInsuranceValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (
    input.annualTakeHomeIncome !== undefined &&
    (!Number.isFinite(input.annualTakeHomeIncome) || input.annualTakeHomeIncome < 0)
  ) {
    errors.annualTakeHomeIncome = 'Annual take-home income must be a non-negative number.';
  }

  if (!Number.isFinite(input.annualFamilyLivingExpenses) || input.annualFamilyLivingExpenses < 0) {
    errors.annualFamilyLivingExpenses = 'Annual family living expenses must be a non-negative number.';
  }

  // Warning when family routine living expenses exceed take-home income
  if (
    typeof input.annualTakeHomeIncome === 'number' &&
    input.annualTakeHomeIncome > 0 &&
    input.annualFamilyLivingExpenses > input.annualTakeHomeIncome
  ) {
    warnings.annualFamilyLivingExpenses =
      'Family routine living expense contribution exceeds your annual take-home income. Please confirm this excludes personal expenses and loan EMIs entered separately.';
  }

  if (
    !Number.isFinite(input.supportDurationYears) ||
    input.supportDurationYears < 1 ||
    input.supportDurationYears > 45
  ) {
    errors.supportDurationYears = 'Support duration must be between 1 and 45 years.';
  }

  if (
    !Number.isFinite(input.supportExpenseGrowthPct) ||
    input.supportExpenseGrowthPct < 0 ||
    input.supportExpenseGrowthPct > 12
  ) {
    errors.supportExpenseGrowthPct = 'Expense growth rate must be between 0% and 12%.';
  }

  if (
    !Number.isFinite(input.investmentReturnPct) ||
    input.investmentReturnPct < 0 ||
    input.investmentReturnPct > 15
  ) {
    errors.investmentReturnPct = 'Assumed investment return must be between 0% and 15%.';
  }

  // Validate liabilities and buffers
  const nonNegativeFields: (keyof LifeInsuranceInput)[] = [
    'homeLoanOutstanding',
    'otherLoansOutstanding',
    'otherLiabilities',
    'immediateTransitionBuffer',
    'eligibleEarmarkedFunds',
    'existingPersonalLifeCover',
    'employerGroupLifeCover',
  ];

  for (const field of nonNegativeFields) {
    const val = input[field];
    if (typeof val === 'number' && (!Number.isFinite(val) || val < 0)) {
      errors[field] = 'Value cannot be negative.';
    }
  }

  // Validate milestones
  if (Array.isArray(input.futureMilestones)) {
    input.futureMilestones.forEach((m, idx) => {
      if (!Number.isFinite(m.costToday) || m.costToday < 0) {
        errors[`milestone_${idx}_cost`] = `Milestone "${m.name || idx + 1}" cost must be non-negative.`;
      }
      if (!Number.isFinite(m.yearsUntilGoal) || m.yearsUntilGoal < 0 || m.yearsUntilGoal > 50) {
        errors[`milestone_${idx}_years`] = `Milestone "${m.name || idx + 1}" horizon must be between 0 and 50 years.`;
      }
      if (!Number.isFinite(m.inflationRatePct) || m.inflationRatePct < 0 || m.inflationRatePct > 15) {
        errors[`milestone_${idx}_growth`] = `Milestone "${m.name || idx + 1}" inflation rate must be between 0% and 15%.`;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Computes the complete Life Insurance Protection Needs Plan.
 *
 * Enforces a strict input validation contract. If the input fails validateLifeInsuranceInput,
 * an Error is thrown detailing the validation failures rather than silently producing
 * plausible-looking numbers from invalid domain input.
 *
 * @throws {Error} When input fails validateLifeInsuranceInput validation
 */
export function calculateLifeInsurancePlan(input: LifeInsuranceInput): LifeInsuranceResult {
  const validation = validateLifeInsuranceInput(input);
  if (!validation.isValid) {
    const errorDetails = Object.entries(validation.errors)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
    throw new Error(`Cannot calculate life insurance plan with invalid input: ${errorDetails}`);
  }

  const safeAnnualExpenses = Math.max(0, input.annualFamilyLivingExpenses || 0);
  const safeGrowth = Math.max(0, Math.min(12, input.supportExpenseGrowthPct ?? 6));
  const safeReturn = Math.max(0, Math.min(15, input.investmentReturnPct ?? 7.5));
  const safeDuration = Math.max(1, Math.min(45, Math.round(input.supportDurationYears || 20)));

  // Pillar 1: Routine Family Support
  const familySupportPV = calculateFamilySupportPV(
    safeAnnualExpenses,
    safeGrowth,
    safeReturn,
    safeDuration
  );

  // Pillar 2: Liabilities & Transition Buffer
  const homeLoanOutstanding = Math.max(0, input.homeLoanOutstanding || 0);
  const otherLoansOutstanding = Math.max(0, input.otherLoansOutstanding || 0);
  const otherLiabilities = Math.max(0, input.otherLiabilities || 0);
  const totalOutstandingLiabilities = homeLoanOutstanding + otherLoansOutstanding + otherLiabilities;
  const immediateObligations = Math.max(0, input.immediateTransitionBuffer || 0);

  // Pillar 3: Future Milestones
  const milestoneDetails: MilestoneCalculation[] = (input.futureMilestones || []).map((m) => {
    const { futureCost, presentValue } = calculateMilestonePV(
      m.costToday,
      m.inflationRatePct,
      safeReturn,
      m.yearsUntilGoal
    );
    return {
      id: m.id,
      name: m.name,
      costToday: m.costToday,
      yearsUntilGoal: m.yearsUntilGoal,
      inflationRatePct: m.inflationRatePct,
      futureCost,
      presentValue,
    };
  });

  const milestonesTotalPV = milestoneDetails.reduce((sum, m) => sum + m.presentValue, 0);

  // Earmarked Assets
  const eligibleEarmarkedFunds = Math.max(0, input.eligibleEarmarkedFunds || 0);

  // Gross and Net Needs
  const grossProtectionNeed =
    familySupportPV + totalOutstandingLiabilities + immediateObligations + milestonesTotalPV;
  const netProtectionNeedAfterEarmarked = Math.max(0, grossProtectionNeed - eligibleEarmarkedFunds);

  // Personal Cover Evaluation
  const existingPersonalLifeCover = Math.max(0, input.existingPersonalLifeCover || 0);
  const additionalPersonalCoverGap = Math.max(
    0,
    netProtectionNeedAfterEarmarked - existingPersonalLifeCover
  );
  const isFullyCoveredPersonally =
    netProtectionNeedAfterEarmarked === 0 || additionalPersonalCoverGap === 0;

  // Employer / Group Cover Evaluation
  const employerGroupLifeCover = Math.max(0, input.employerGroupLifeCover || 0);
  const gapIncludingGroupCover = Math.max(
    0,
    netProtectionNeedAfterEarmarked - existingPersonalLifeCover - employerGroupLifeCover
  );
  const isEmployerGroupCoverIncluded = Boolean(input.includeEmployerGroupCover);
  const isFullyCoveredWithGroup =
    netProtectionNeedAfterEarmarked === 0 || gapIncludingGroupCover === 0;

  // Surplus Detection
  const hasEarmarkedSurplus = eligibleEarmarkedFunds > grossProtectionNeed;
  const earmarkedSurplusAmount = hasEarmarkedSurplus
    ? eligibleEarmarkedFunds - grossProtectionNeed
    : 0;

  return {
    familySupportPV,
    homeLoanOutstanding,
    otherLoansOutstanding,
    otherLiabilities,
    totalOutstandingLiabilities,
    immediateObligations,
    milestonesTotalPV,
    milestoneDetails,
    eligibleEarmarkedFunds,
    grossProtectionNeed,
    netProtectionNeedAfterEarmarked,
    existingPersonalLifeCover,
    additionalPersonalCoverGap,
    isFullyCoveredPersonally,
    employerGroupLifeCover,
    gapIncludingGroupCover,
    isEmployerGroupCoverIncluded,
    isFullyCoveredWithGroup,
    hasEarmarkedSurplus,
    earmarkedSurplusAmount,
  };
}

/**
 * Standard illustrative Indian family example matching VEC-LIFE-09.
 */
export const ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE: LifeInsuranceInput = {
  annualTakeHomeIncome: 1800000,
  annualFamilyLivingExpenses: 720000,
  supportDurationYears: 22,
  supportExpenseGrowthPct: 6.0,
  investmentReturnPct: 7.5,
  homeLoanOutstanding: 4500000,
  otherLoansOutstanding: 0,
  otherLiabilities: 0,
  immediateTransitionBuffer: 500000,
  futureMilestones: [
    {
      id: 'milestone-edu',
      name: "Children's Higher Education",
      costToday: 2500000,
      yearsUntilGoal: 12,
      inflationRatePct: 8.0,
    },
    {
      id: 'milestone-marr',
      name: 'Dependent Support / Family Goal',
      costToday: 1500000,
      yearsUntilGoal: 16,
      inflationRatePct: 7.0,
    },
  ],
  eligibleEarmarkedFunds: 2000000,
  existingPersonalLifeCover: 5000000,
  employerGroupLifeCover: 2500000,
  includeEmployerGroupCover: false,
};
