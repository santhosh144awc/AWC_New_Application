/**
 * Ant Wealth Creation — Retirement Distribution Planner Calculation Engine
 * 
 * Ported from verified legacy implementation (legacy-reference/AWC_Chatgpt).
 * 
 * Implements the 3-Bucket retirement decumulation methodology:
 * - Bucket 1 (Liquidity): Years 1–3 (Near-term spending)
 * - Bucket 2 (Safety): Years 4–7 (Medium-term stability)
 * - Bucket 3 (Wealth Creation): Years 8+ (Long-term growth)
 * 
 * Mathematical Foundations:
 * - Compound Fisher Real Return: r_real = (1 + r_postTax) / (1 + inflation) - 1
 * - Annuity-Due Beginning-of-Period Withdrawals:
 *     PV_due = PMT * [1 - (1+r)^(-n)] / r * (1 + r)
 * - Present Value Discounting of Future Buckets Back to Today:
 *     InvestmentToday_B2 = PV_due_B2 / (1 + R2)^B1
 *     InvestmentToday_B3 = PV_due_B3 / (1 + R3)^(B1 + B2)
 */

export interface RetirementDistributionInput {
  retirementAge: number; // e.g. 60
  monthlyRetirementExpense: number; // ₹/month at retirement start, e.g. 100000
  lifeExpectancy: number; // e.g. 90
  assumptions?: RetirementDistributionAssumptions;
}

export interface RetirementDistributionAssumptions {
  inflationRate: number; // % p.a. (default: 6%)
  bucket1Return: number; // % p.a. post-tax (default: 6%)
  bucket2Return: number; // % p.a. post-tax (default: 8%)
  bucket3Return: number; // % p.a. post-tax (default: 10%)
}

export interface BucketResult {
  bucketId: 1 | 2 | 3;
  name: string;
  category: 'Liquidity' | 'Safety' | 'Wealth Creation';
  yearsRange: string;
  durationYears: number; // e.g. 3, 4, 23
  startYearOffset: number; // e.g. 0, 3, 7
  postTaxReturn: number; // % p.a.
  realReturn: number; // % p.a. (Fisher)
  startingAnnualExpense: number; // Inflated expense at start of bucket
  startingMonthlyExpense: number; // Monthly equivalent at start
  corpusAtBucketStart: number; // Annuity Due PV at start of bucket
  investmentRequiredToday: number; // Discounted back to Year 0 (today)
  allocationPercent: number; // % of total investment (0-100)
}

export interface RetirementDistributionResult {
  retirementAge: number;
  lifeExpectancy: number;
  distributionYears: number;
  initialAnnualExpense: number;
  initialMonthlyExpense: number;
  inflationRate: number;

  // 3 Buckets
  bucket1: BucketResult;
  bucket2: BucketResult;
  bucket3: BucketResult;

  // Totals & Averages
  totalInvestmentRequiredToday: number;
  weightedAveragePostTaxReturn: number; // % p.a.
  overallRealReturn: number; // % p.a. (Fisher)

  // Contextual Insights
  keyInsight: string;
}

/**
 * 1. Calculate Total Distribution Years
 */
export function calculateDistributionYears(
  retirementAge: number,
  lifeExpectancy: number
): number {
  if (!retirementAge || !lifeExpectancy) return 0;
  return Math.max(0, lifeExpectancy - retirementAge);
}

/**
 * 2. Partition Distribution Years into 3 Buckets
 * B1 = min(3, distributionYears)
 * B2 = min(4, max(0, distributionYears - B1))
 * B3 = max(0, distributionYears - B1 - B2)
 */
export function calculateBucketDurations(distributionYears: number): {
  b1Years: number;
  b2Years: number;
  b3Years: number;
} {
  const total = Math.max(0, distributionYears || 0);
  const b1Years = Math.min(3, total);
  const b2Years = Math.min(4, Math.max(0, total - b1Years));
  const b3Years = Math.max(0, total - b1Years - b2Years);
  return { b1Years, b2Years, b3Years };
}

/**
 * 3. Calculate Initial Annual Expenses
 */
export function calculateAnnualExpenses(monthlyExpenses: number): number {
  return Math.max(0, (monthlyExpenses || 0) * 12);
}

/**
 * 4. Calculate Inflation-Adjusted Starting Expense for a Bucket
 * Expense = AnnualExpense * (1 + inflation)^startYear
 */
export function calculateInflationAdjustedExpense(
  annualExpenses: number,
  inflationRatePercent: number,
  startYearOffset: number
): number {
  if (annualExpenses <= 0) return 0;
  if (startYearOffset <= 0) return annualExpenses;
  const inf = (inflationRatePercent || 0) / 100;
  return annualExpenses * Math.pow(1 + inf, startYearOffset);
}

/**
 * 5. Calculate Exact Compound Fisher Real Return
 * r_real = (1 + r_postTax) / (1 + inflation) - 1
 */
export function calculateRealReturn(
  postTaxReturnPercent: number,
  inflationRatePercent: number
): number {
  const r = (postTaxReturnPercent || 0) / 100;
  const inf = (inflationRatePercent || 0) / 100;
  if (inf === -1) return 0;
  const rReal = (1 + r) / (1 + inf) - 1;
  return rReal * 100; // Returns percentage e.g. 1.886792%
}

/**
 * 6. Calculate Annuity-Due Present Value
 * PV_due = PMT * [1 - (1+r)^(-n)] / r * (1 + r)
 * If r == 0: PV_due = PMT * n
 */
export function calculateAnnuityDuePV(
  annualExpense: number,
  bucketDurationYears: number,
  realReturnPercent: number
): number {
  if (annualExpense <= 0 || bucketDurationYears <= 0) return 0;

  const pmt = annualExpense;
  const n = bucketDurationYears;
  const r = (realReturnPercent || 0) / 100;

  if (Math.abs(r) < 1e-7) {
    return pmt * n;
  }

  const factor = (1 - Math.pow(1 + r, -n)) / r;
  const pvDue = pmt * factor * (1 + r);
  return Math.max(0, pvDue);
}

/**
 * 7. Bucket 1 Corpus at Start (No Discounting needed since it starts at Year 0)
 */
export function calculateBucket1InvestmentToday(
  annualExpense: number,
  b1DurationYears: number,
  b1RealReturnPercent: number
): number {
  return calculateAnnuityDuePV(annualExpense, b1DurationYears, b1RealReturnPercent);
}

/**
 * 8. Bucket 2 Investment Required Today
 * PV_due_B2 discounted by Bucket 2 post-tax return over B1 years:
 * InvestmentToday_B2 = PV_due_B2 / (1 + R2)^B1
 */
export function calculateBucket2InvestmentToday(
  pvDueB2: number,
  bucket2PostTaxReturnPercent: number,
  b1Years: number
): number {
  if (pvDueB2 <= 0 || b1Years <= 0) return pvDueB2;
  const r = (bucket2PostTaxReturnPercent || 0) / 100;
  return pvDueB2 / Math.pow(1 + r, b1Years);
}

/**
 * 9. Bucket 3 Investment Required Today
 * PV_due_B3 discounted by Bucket 3 post-tax return over (B1 + B2) years:
 * InvestmentToday_B3 = PV_due_B3 / (1 + R3)^(B1 + B2)
 */
export function calculateBucket3InvestmentToday(
  pvDueB3: number,
  bucket3PostTaxReturnPercent: number,
  b1PlusB2Years: number
): number {
  if (pvDueB3 <= 0 || b1PlusB2Years <= 0) return pvDueB3;
  const r = (bucket3PostTaxReturnPercent || 0) / 100;
  return pvDueB3 / Math.pow(1 + r, b1PlusB2Years);
}

/**
 * 10. Calculate Total Investment Required Today
 */
export function calculateTotalInvestmentRequired(
  inv1: number,
  inv2: number,
  inv3: number
): number {
  return Math.max(0, (inv1 || 0) + (inv2 || 0) + (inv3 || 0));
}

/**
 * 11. Calculate Allocation Percentages
 */
export function calculateAllocationPercentages(
  inv1: number,
  inv2: number,
  inv3: number,
  total: number
): { alloc1: number; alloc2: number; alloc3: number } {
  if (total <= 0) {
    return { alloc1: 0, alloc2: 0, alloc3: 0 };
  }
  const raw1 = (inv1 / total) * 100;
  const raw2 = (inv2 / total) * 100;
  const raw3 = (inv3 / total) * 100;

  return {
    alloc1: Math.round(raw1 * 100) / 100,
    alloc2: Math.round(raw2 * 100) / 100,
    alloc3: Math.round(raw3 * 100) / 100
  };
}

/**
 * 12. Calculate Weighted Average Post-Tax Return (based on bucket durations)
 */
export function calculateWeightedAverageReturn(
  b1Years: number,
  ret1: number,
  b2Years: number,
  ret2: number,
  b3Years: number,
  ret3: number,
  totalDistributionYears: number
): number {
  if (totalDistributionYears <= 0) return 0;
  const weightedSum = (b1Years * ret1) + (b2Years * ret2) + (b3Years * ret3);
  return weightedSum / totalDistributionYears;
}

/**
 * 13. Calculate Overall Real Return from Weighted Post-Tax Return
 */
export function calculateOverallRealReturn(
  weightedPostTaxReturnPercent: number,
  inflationRatePercent: number
): number {
  return calculateRealReturn(weightedPostTaxReturnPercent, inflationRatePercent);
}

/**
 * 14. Master Retirement Distribution Plan Orchestrator
 */
export function calculateRetirementDistributionPlan(
  input: RetirementDistributionInput
): RetirementDistributionResult {
  const retirementAge = Math.max(18, Math.min(100, input.retirementAge || 60));
  const lifeExpectancy = Math.max(retirementAge, Math.min(120, input.lifeExpectancy || 90));
  const distributionYears = calculateDistributionYears(retirementAge, lifeExpectancy);

  const monthlyExpense = Math.max(0, input.monthlyRetirementExpense || 0);
  const annualExpense = calculateAnnualExpenses(monthlyExpense);

  const inflationRate = input.assumptions?.inflationRate ?? 6;
  const b1Return = input.assumptions?.bucket1Return ?? 6;
  const b2Return = input.assumptions?.bucket2Return ?? 8;
  const b3Return = input.assumptions?.bucket3Return ?? 10;

  const { b1Years, b2Years, b3Years } = calculateBucketDurations(distributionYears);

  // --- BUCKET 1 (Liquidity: Years 1 to B1) ---
  const b1RealReturn = calculateRealReturn(b1Return, inflationRate);
  const b1StartingExpense = calculateInflationAdjustedExpense(annualExpense, inflationRate, 0);
  const b1CorpusAtStart = calculateAnnuityDuePV(b1StartingExpense, b1Years, b1RealReturn);
  const b1InvestmentToday = calculateBucket1InvestmentToday(b1StartingExpense, b1Years, b1RealReturn);

  // --- BUCKET 2 (Safety: Years B1+1 to B1+B2) ---
  const b2RealReturn = calculateRealReturn(b2Return, inflationRate);
  const b2StartingExpense = calculateInflationAdjustedExpense(annualExpense, inflationRate, b1Years);
  const b2CorpusAtStart = calculateAnnuityDuePV(b2StartingExpense, b2Years, b2RealReturn);
  const b2InvestmentToday = calculateBucket2InvestmentToday(b2CorpusAtStart, b2Return, b1Years);

  // --- BUCKET 3 (Wealth Creation: Years B1+B2+1 to Total) ---
  const b3StartYearOffset = b1Years + b2Years;
  const b3RealReturn = calculateRealReturn(b3Return, inflationRate);
  const b3StartingExpense = calculateInflationAdjustedExpense(annualExpense, inflationRate, b3StartYearOffset);
  const b3CorpusAtStart = calculateAnnuityDuePV(b3StartingExpense, b3Years, b3RealReturn);
  const b3InvestmentToday = calculateBucket3InvestmentToday(b3CorpusAtStart, b3Return, b3StartYearOffset);

  // Total Investment
  const totalInvestmentRequiredToday = calculateTotalInvestmentRequired(
    b1InvestmentToday,
    b2InvestmentToday,
    b3InvestmentToday
  );

  // Allocations
  const { alloc1, alloc2, alloc3 } = calculateAllocationPercentages(
    b1InvestmentToday,
    b2InvestmentToday,
    b3InvestmentToday,
    totalInvestmentRequiredToday
  );

  // Weighted Returns
  const weightedAveragePostTaxReturn = calculateWeightedAverageReturn(
    b1Years,
    b1Return,
    b2Years,
    b2Return,
    b3Years,
    b3Return,
    distributionYears
  );
  const overallRealReturn = calculateOverallRealReturn(weightedAveragePostTaxReturn, inflationRate);

  // Bucket Result Objects
  const bucket1: BucketResult = {
    bucketId: 1,
    name: 'Bucket 1 — Liquidity',
    category: 'Liquidity',
    yearsRange: b1Years > 0 ? `Years 1–${b1Years}` : '0 Years',
    durationYears: b1Years,
    startYearOffset: 0,
    postTaxReturn: b1Return,
    realReturn: b1RealReturn,
    startingAnnualExpense: b1StartingExpense,
    startingMonthlyExpense: Math.round(b1StartingExpense / 12),
    corpusAtBucketStart: Math.round(b1CorpusAtStart),
    investmentRequiredToday: Math.round(b1InvestmentToday),
    allocationPercent: alloc1
  };

  const bucket2: BucketResult = {
    bucketId: 2,
    name: 'Bucket 2 — Safety',
    category: 'Safety',
    yearsRange: b2Years > 0 ? `Years ${b1Years + 1}–${b1Years + b2Years}` : '0 Years',
    durationYears: b2Years,
    startYearOffset: b1Years,
    postTaxReturn: b2Return,
    realReturn: b2RealReturn,
    startingAnnualExpense: b2StartingExpense,
    startingMonthlyExpense: Math.round(b2StartingExpense / 12),
    corpusAtBucketStart: Math.round(b2CorpusAtStart),
    investmentRequiredToday: Math.round(b2InvestmentToday),
    allocationPercent: alloc2
  };

  const bucket3: BucketResult = {
    bucketId: 3,
    name: 'Bucket 3 — Wealth Creation',
    category: 'Wealth Creation',
    yearsRange: b3Years > 0 ? `Years ${b3StartYearOffset + 1}+ (${b3Years} yrs)` : '0 Years',
    durationYears: b3Years,
    startYearOffset: b3StartYearOffset,
    postTaxReturn: b3Return,
    realReturn: b3RealReturn,
    startingAnnualExpense: b3StartingExpense,
    startingMonthlyExpense: Math.round(b3StartingExpense / 12),
    corpusAtBucketStart: Math.round(b3CorpusAtStart),
    investmentRequiredToday: Math.round(b3InvestmentToday),
    allocationPercent: alloc3
  };

  // Generate Factual Observation
  let keyInsight = '';
  if (totalInvestmentRequiredToday === 0) {
    keyInsight = 'Enter your planned retirement age and living expenses to structure your three-bucket retirement income roadmap.';
  } else if (b3Years > 0) {
    keyInsight = `By segmenting your ${distributionYears}-year retirement into 3 time horizons, ${alloc3}% (₹${Math.round(b3InvestmentToday).toLocaleString('en-IN')}) is allocated to long-term wealth creation, allowing your capital to compound at ${b3Return}% before being drawn down.`;
  } else {
    keyInsight = `For a ${distributionYears}-year retirement horizon, your immediate and medium-term liquidity needs represent the primary capital requirement.`;
  }

  return {
    retirementAge,
    lifeExpectancy,
    distributionYears,
    initialAnnualExpense: annualExpense,
    initialMonthlyExpense: monthlyExpense,
    inflationRate,
    bucket1,
    bucket2,
    bucket3,
    totalInvestmentRequiredToday: Math.round(totalInvestmentRequiredToday),
    weightedAveragePostTaxReturn: Math.round(weightedAveragePostTaxReturn * 100) / 100,
    overallRealReturn: Math.round(overallRealReturn * 100) / 100,
    keyInsight
  };
}
