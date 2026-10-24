/**
 * Ant Wealth Creation — Retirement Accumulation Planner Calculation Engine
 * 
 * Ported from verified legacy implementation (legacy-reference/AWC_Chatgpt).
 * 
 * Methodology:
 * - Current annual and monthly expense aggregation
 * - Pre-retirement inflation & post-retirement expense reduction
 * - Compound Fisher real return with tax-adjusted returns
 * - Annuity-Due retirement living expense capitalization (type=1)
 * - Discounted legacy/children/charity corpus integration
 * - Expected value aggregation of employment benefits and personal assets at retirement
 * - 3-way funding deficit options: Lump Sum, Fixed Monthly SIP, and Step-Up Monthly SIP
 */

export interface RetirementExpenseInputs {
  householdExpenses: number; // ₹/year
  lifestyleExpenses: number; // ₹/year
  otherExpenses: number; // ₹/year
}

export interface RetirementTimelineInputs {
  currentAge: number; // e.g. 50
  retirementAge: number; // e.g. 60
  inflationPreRetirement: number; // % (default: 6%)
  expenseReductionPercent: number; // % (default: 20%)
}

export interface RetirementCorpusInputs {
  lifeExpectancyAge: number; // e.g. 90
  inflationPostRetirement: number; // % (default: 6%)
  taxRateOnCorpusReturn: number; // % (default: 12.5%)
  corpusReturnPreTax: number; // % (default: 10.5%)
  childrenOrCharityCorpus?: number; // ₹ (default: 0)
}

export interface EmploymentBenefits {
  epfNps: number; // expected value at retirement
  gratuity: number; // expected value at retirement
  superannuationOther: number; // expected value at retirement
}

export interface RetirementAssets {
  fixedDeposits: number; // expected value at retirement
  insuranceMaturity: number; // expected value at retirement
  mutualFundsInvestments: number; // expected value at retirement
}

export interface FreshInvestmentInputs {
  startInvestingDelay: number; // years (default: 0)
  expectedNewInvestmentReturn: number; // % (default: 12%)
  annualStepUpRate: number; // % (default: 10%)
}

export interface RetirementPlannerInput {
  expenses: RetirementExpenseInputs;
  timeline: RetirementTimelineInputs;
  corpus: RetirementCorpusInputs;
  employmentBenefits: EmploymentBenefits;
  retirementAssets: RetirementAssets;
  funding: FreshInvestmentInputs;
}

export interface RetirementPlannerResult {
  // Step 1: Current Expenses
  totalCurrentAnnualExpenses: number;
  currentMonthlyExpenses: number;

  // Step 2: Timeline & Future Expenses
  yearsUntilRetirement: number;
  futureAnnualExpenses: number;
  futureMonthlyExpenses: number;

  // Step 3: Corpus Assumptions & Required Corpus
  yearsPostRetirement: number;
  taxAdjustedReturn: number; // %
  realReturn: number; // %
  livingExpenseCorpusRequired: number; // Annuity Due
  legacyCorpusDiscounted: number;
  totalRetirementCorpusRequired: number;

  // Step 4: Existing Assets & Progress
  totalEmploymentBenefits: number;
  totalOwnAssets: number;
  totalRetirementAssets: number;
  goalProgress: number; // % (0 to 100)
  fundingDeficit: number; // max(0, required - assets)
  isFullyFunded: boolean;

  // Step 5: Fresh Investment Plan
  yearsAvailableForInvestment: number;
  hasSufficientTime: boolean;
  requiredLumpSum: number;
  requiredFixedSIP: number;
  requiredStepUpSIP: number; // starting monthly amount

  // Narrative
  keyInsight: string;
}

/**
 * 1. Total Current Annual Expenses
 */
export function calculateTotalCurrentAnnualExpenses(
  householdExpenses: number,
  lifestyleExpenses: number,
  otherExpenses: number
): number {
  return Math.max(0, householdExpenses || 0) +
         Math.max(0, lifestyleExpenses || 0) +
         Math.max(0, otherExpenses || 0);
}

/**
 * 2. Years Until Retirement
 */
export function calculateYearsUntilRetirement(
  currentAge: number,
  retirementAge: number
): number {
  return Math.max(0, (retirementAge || 0) - (currentAge || 0));
}

/**
 * 3. Future Annual Retirement Expenses
 * Future = CurrentAnnual * (1 + inflationPreRetirement)^yearsUntilRetirement * (1 - expenseReductionPercent)
 */
export function calculateFutureAnnualRetirementExpenses(
  currentAnnualExpenses: number,
  inflationPreRetirement: number,
  yearsUntilRetirement: number,
  expenseReductionPercent: number
): number {
  if (currentAnnualExpenses <= 0 || yearsUntilRetirement < 0) return 0;
  const inf = (inflationPreRetirement || 0) / 100;
  const red = Math.min(100, Math.max(0, expenseReductionPercent || 0)) / 100;
  const inflated = currentAnnualExpenses * Math.pow(1 + inf, yearsUntilRetirement);
  return inflated * (1 - red);
}

/**
 * 4. Monthly Retirement Expenses
 */
export function calculateMonthlyRetirementExpenses(futureAnnualExpenses: number): number {
  if (futureAnnualExpenses <= 0) return 0;
  return Math.round(futureAnnualExpenses / 12);
}

/**
 * 5. Years Post Retirement
 */
export function calculateYearsPostRetirement(
  lifeExpectancyAge: number,
  retirementAge: number
): number {
  return Math.max(0, (lifeExpectancyAge || 0) - (retirementAge || 0));
}

/**
 * 6. Tax-Adjusted Return
 * r_tax = r_gross * (1 - taxRate)
 */
export function calculateTaxAdjustedReturn(
  corpusReturnPreTax: number,
  taxRateOnCorpusReturn: number
): number {
  const r = (corpusReturnPreTax || 0) / 100;
  const tax = Math.min(100, Math.max(0, taxRateOnCorpusReturn || 0)) / 100;
  const rTax = r * (1 - tax);
  return rTax * 100; // Returns exact percentage e.g. 9.1875
}

/**
 * 7. Exact Compound Fisher Real Return
 * r_real = ((1 + r_tax) / (1 + inflationPostRetirement)) - 1
 */
export function calculateRealReturn(
  taxAdjustedReturnPercent: number,
  inflationPostRetirementPercent: number
): number {
  const rTax = (taxAdjustedReturnPercent || 0) / 100;
  const inf = (inflationPostRetirementPercent || 0) / 100;
  if (inf === -1) return 0;
  const rReal = (1 + rTax) / (1 + inf) - 1;
  return rReal * 100; // Returns exact percentage e.g. 3.00707547...
}

/**
 * 8. Retirement Corpus Required (Annuity-Due Living Expenses + Discounted Legacy Corpus)
 * 
 * Living Expenses: Annuity-Due (type = 1, withdrawals at beginning of each year)
 * PV_due = PMT * [1 - (1+r)^(-n)] / r * (1 + r)
 * If r == 0: PV_due = PMT * n
 * 
 * Legacy Corpus:
 * PV_legacy = C / (1 + r)^n (where r is real return)
 */
export function calculateRetirementCorpusRequired(
  futureAnnualExpenses: number,
  yearsPostRetirement: number,
  realReturnPercent: number,
  childrenOrCharityCorpus: number = 0
): { livingCorpus: number; legacyCorpus: number; totalCorpus: number } {
  if (futureAnnualExpenses <= 0 && childrenOrCharityCorpus <= 0) {
    return { livingCorpus: 0, legacyCorpus: 0, totalCorpus: 0 };
  }
  if (yearsPostRetirement <= 0) {
    return {
      livingCorpus: Math.max(0, futureAnnualExpenses || 0),
      legacyCorpus: Math.max(0, childrenOrCharityCorpus || 0),
      totalCorpus: Math.max(0, (futureAnnualExpenses || 0) + (childrenOrCharityCorpus || 0))
    };
  }

  const pmt = Math.max(0, futureAnnualExpenses || 0);
  const n = yearsPostRetirement;
  const r = (realReturnPercent || 0) / 100;

  let livingCorpus: number;
  if (pmt === 0) {
    livingCorpus = 0;
  } else if (Math.abs(r) < 1e-7) {
    livingCorpus = pmt * n;
  } else {
    const factor = (1 - Math.pow(1 + r, -n)) / r;
    livingCorpus = pmt * factor * (1 + r);
  }
  livingCorpus = Math.round(Math.max(0, livingCorpus));

  let legacyCorpus = 0;
  if (childrenOrCharityCorpus > 0) {
    if (Math.abs(r) < 1e-7) {
      legacyCorpus = childrenOrCharityCorpus;
    } else {
      legacyCorpus = Math.round(childrenOrCharityCorpus / Math.pow(1 + r, n));
    }
  }

  const totalCorpus = livingCorpus + legacyCorpus;
  return { livingCorpus, legacyCorpus, totalCorpus };
}

/**
 * 9. Employment Benefits Aggregation (Expected Values at Retirement)
 */
export function calculateEmploymentBenefits(
  epfNps: number,
  gratuity: number,
  superannuationOther: number
): number {
  return Math.max(0, epfNps || 0) +
         Math.max(0, gratuity || 0) +
         Math.max(0, superannuationOther || 0);
}

/**
 * 10. Own Assets Aggregation (Expected Values at Retirement)
 */
export function calculateOwnAssetsAtRetirement(
  fixedDeposits: number,
  insuranceMaturity: number,
  mutualFundsInvestments: number
): number {
  return Math.max(0, fixedDeposits || 0) +
         Math.max(0, insuranceMaturity || 0) +
         Math.max(0, mutualFundsInvestments || 0);
}

/**
 * 11. Total Retirement Assets Available at Retirement
 */
export function calculateTotalRetirementAssets(
  totalEmploymentBenefits: number,
  totalOwnAssets: number
): number {
  return Math.max(0, totalEmploymentBenefits || 0) + Math.max(0, totalOwnAssets || 0);
}

/**
 * 12. Goal Progress Percentage (0% to 100% cap)
 */
export function calculateGoalProgress(
  totalRetirementAssets: number,
  totalRetirementCorpusRequired: number
): number {
  if (totalRetirementCorpusRequired <= 0) {
    return totalRetirementAssets > 0 ? 100 : 0;
  }
  if (totalRetirementAssets <= 0) return 0;
  const progress = (totalRetirementAssets / totalRetirementCorpusRequired) * 100;
  return Math.min(100, Math.max(0, Math.round(progress * 100) / 100));
}

/**
 * 13. Funding Deficit
 */
export function calculateFundingDeficit(
  totalRetirementCorpusRequired: number,
  totalRetirementAssets: number
): number {
  return Math.max(0, (totalRetirementCorpusRequired || 0) - (totalRetirementAssets || 0));
}

/**
 * 14. Required Lump Sum Today
 * LumpSum = Deficit / (1 + r)^t
 */
export function calculateRequiredLumpSum(
  fundingDeficit: number,
  expectedNewInvestmentReturnPercent: number,
  yearsAvailableForInvestment: number
): number {
  if (fundingDeficit <= 0) return 0;
  if (yearsAvailableForInvestment <= 0) return fundingDeficit;

  const r = (expectedNewInvestmentReturnPercent || 0) / 100;
  if (r === 0) return fundingDeficit;

  const lumpSum = fundingDeficit / Math.pow(1 + r, yearsAvailableForInvestment);
  return Math.round(lumpSum);
}

/**
 * 15. Required Fixed Monthly SIP
 * Monthly SIP = Deficit * i / ((1 + r)^t - 1)
 * with i = (1 + r)^(1/12) - 1
 */
export function calculateRequiredFixedSIP(
  fundingDeficit: number,
  expectedNewInvestmentReturnPercent: number,
  yearsAvailableForInvestment: number
): number {
  if (fundingDeficit <= 0 || yearsAvailableForInvestment <= 0) return 0;

  const t = yearsAvailableForInvestment;
  const n = Math.round(t * 12);
  if (n <= 0) return 0;

  const annualRate = (expectedNewInvestmentReturnPercent || 0) / 100;
  if (annualRate === 0) {
    return Math.round(fundingDeficit / n);
  }

  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  const totalGrowth = Math.pow(1 + annualRate, t);
  const pmt = (fundingDeficit * monthlyRate) / (totalGrowth - 1);
  return Math.round(pmt);
}

/**
 * 16. Required Annual Step-Up Monthly SIP
 */
export function calculateRequiredStepUpSIP(
  fundingDeficit: number,
  expectedNewInvestmentReturnPercent: number,
  yearsAvailableForInvestment: number,
  annualStepUpRatePercent: number
): number {
  if (fundingDeficit <= 0 || yearsAvailableForInvestment <= 0) return 0;

  const t = yearsAvailableForInvestment;
  const r = (expectedNewInvestmentReturnPercent || 0) / 100;
  const g = (annualStepUpRatePercent || 0) / 100;

  let fv1: number;
  if (Math.abs(r - g) < 1e-7) {
    fv1 = fundingDeficit / (t * Math.pow(1 + r, t - 1));
  } else {
    const numerator = fundingDeficit * (r - g);
    const denominator = Math.pow(1 + r, t) - Math.pow(1 + g, t);
    fv1 = numerator / denominator;
  }

  if (r === 0) {
    return Math.round(fv1 / 12);
  }

  const monthlyRate = Math.pow(1 + r, 1 / 12) - 1;
  const factor12 = Math.pow(1 + monthlyRate, 12);
  const startingMonthlyPmt = (fv1 * monthlyRate) / (factor12 - 1);
  return Math.round(startingMonthlyPmt);
}

/**
 * 17. Master Retirement Accumulation Plan Orchestrator
 */
export function calculateRetirementAccumulationPlan(
  input: RetirementPlannerInput
): RetirementPlannerResult {
  // Step 1: Current Expenses
  const totalCurrentAnnualExpenses = calculateTotalCurrentAnnualExpenses(
    input.expenses?.householdExpenses || 0,
    input.expenses?.lifestyleExpenses || 0,
    input.expenses?.otherExpenses || 0
  );
  const currentMonthlyExpenses = Math.round(totalCurrentAnnualExpenses / 12);

  // Step 2: Timeline & Future Expenses
  const currentAge = Math.max(18, Math.min(100, input.timeline?.currentAge || 50));
  const retirementAge = Math.max(currentAge + 1, Math.min(100, input.timeline?.retirementAge || 60));
  const yearsUntilRetirement = calculateYearsUntilRetirement(currentAge, retirementAge);
  const inflationPreRetirement = input.timeline?.inflationPreRetirement ?? 6;
  const expenseReductionPercent = input.timeline?.expenseReductionPercent ?? 20;

  const futureAnnualExpenses = calculateFutureAnnualRetirementExpenses(
    totalCurrentAnnualExpenses,
    inflationPreRetirement,
    yearsUntilRetirement,
    expenseReductionPercent
  );
  const futureMonthlyExpenses = calculateMonthlyRetirementExpenses(futureAnnualExpenses);

  // Step 3: Corpus Assumptions & Calculations
  const lifeExpectancyAge = Math.max(retirementAge + 1, Math.min(120, input.corpus?.lifeExpectancyAge || 90));
  const yearsPostRetirement = calculateYearsPostRetirement(lifeExpectancyAge, retirementAge);
  const inflationPostRetirement = input.corpus?.inflationPostRetirement ?? 6;
  const taxRateOnCorpusReturn = input.corpus?.taxRateOnCorpusReturn ?? 12.5;
  const corpusReturnPreTax = input.corpus?.corpusReturnPreTax ?? 10.5;
  const childrenOrCharityCorpus = Math.max(0, input.corpus?.childrenOrCharityCorpus || 0);

  const taxAdjustedReturn = calculateTaxAdjustedReturn(corpusReturnPreTax, taxRateOnCorpusReturn);
  const realReturn = calculateRealReturn(taxAdjustedReturn, inflationPostRetirement);

  const { livingCorpus, legacyCorpus, totalCorpus } = calculateRetirementCorpusRequired(
    futureAnnualExpenses,
    yearsPostRetirement,
    realReturn,
    childrenOrCharityCorpus
  );

  // Step 4: Existing Retirement Resources
  const totalEmploymentBenefits = calculateEmploymentBenefits(
    input.employmentBenefits?.epfNps || 0,
    input.employmentBenefits?.gratuity || 0,
    input.employmentBenefits?.superannuationOther || 0
  );
  const totalOwnAssets = calculateOwnAssetsAtRetirement(
    input.retirementAssets?.fixedDeposits || 0,
    input.retirementAssets?.insuranceMaturity || 0,
    input.retirementAssets?.mutualFundsInvestments || 0
  );
  const totalRetirementAssets = calculateTotalRetirementAssets(
    totalEmploymentBenefits,
    totalOwnAssets
  );

  const goalProgress = calculateGoalProgress(totalRetirementAssets, totalCorpus);
  const fundingDeficit = calculateFundingDeficit(totalCorpus, totalRetirementAssets);
  const isFullyFunded = fundingDeficit === 0;

  // Step 5: Fresh Investment Plan
  const startInvestingDelay = Math.max(0, Math.min(yearsUntilRetirement - 1, input.funding?.startInvestingDelay || 0));
  const yearsAvailableForInvestment = Math.max(0, yearsUntilRetirement - startInvestingDelay);
  const hasSufficientTime = yearsAvailableForInvestment > 0;
  const expectedNewInvestmentReturn = input.funding?.expectedNewInvestmentReturn ?? 12;
  const annualStepUpRate = input.funding?.annualStepUpRate ?? 10;

  const requiredLumpSum = hasSufficientTime
    ? calculateRequiredLumpSum(fundingDeficit, expectedNewInvestmentReturn, yearsAvailableForInvestment)
    : fundingDeficit;

  const requiredFixedSIP = hasSufficientTime
    ? calculateRequiredFixedSIP(fundingDeficit, expectedNewInvestmentReturn, yearsAvailableForInvestment)
    : 0;

  const requiredStepUpSIP = hasSufficientTime
    ? calculateRequiredStepUpSIP(fundingDeficit, expectedNewInvestmentReturn, yearsAvailableForInvestment, annualStepUpRate)
    : 0;

  // Contextual Factual Insight
  let keyInsight = '';
  if (isFullyFunded) {
    keyInsight = `Your existing retirement resources fully cover 100% of your estimated retirement corpus requirement.`;
  } else if (goalProgress > 0) {
    keyInsight = `Your existing retirement resources cover approximately ${goalProgress}% of your estimated requirement. Your remaining funding gap is ₹${fundingDeficit.toLocaleString('en-IN')}.`;
  } else {
    keyInsight = `To maintain your current lifestyle post-retirement at age ${retirementAge}, you will need an estimated corpus of ₹${totalCorpus.toLocaleString('en-IN')}.`;
  }

  return {
    totalCurrentAnnualExpenses,
    currentMonthlyExpenses,
    yearsUntilRetirement,
    futureAnnualExpenses: Math.round(futureAnnualExpenses),
    futureMonthlyExpenses,
    yearsPostRetirement,
    taxAdjustedReturn,
    realReturn,
    livingExpenseCorpusRequired: livingCorpus,
    legacyCorpusDiscounted: legacyCorpus,
    totalRetirementCorpusRequired: totalCorpus,
    totalEmploymentBenefits,
    totalOwnAssets,
    totalRetirementAssets,
    goalProgress,
    fundingDeficit,
    isFullyFunded,
    yearsAvailableForInvestment,
    hasSufficientTime,
    requiredLumpSum,
    requiredFixedSIP,
    requiredStepUpSIP,
    keyInsight
  };
}
