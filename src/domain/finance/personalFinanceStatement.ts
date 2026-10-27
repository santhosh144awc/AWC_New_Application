/**
 * Ant Wealth Creation — Personal Finance Statement Calculation Engine
 *
 * Implements pure financial calculations for:
 * 1. Income (Salary, Bonus, Business, Rental, Investments, Custom rows)
 * 2. Expenses (Household [Mode A single sum vs Mode B itemized], Lifestyle, Dependent, Insurance, Loan EMIs)
 * 3. Savings & Ongoing Investments (Annual Savings = Income - Expenses, Surplus = Savings - Ongoing Investments, Surplus Growth Projections)
 * 4. Assets across 6 classes (Liquid, Debt, Equity, Gold, Real Estate, Personal) with owner attribution
 * 5. Liabilities (Home Loan, Vehicle Loan, Personal, Education, Other, Credit Card) with owner attribution
 * 6. Net Worth Summary (Total Assets, Total Liabilities, Net Worth Incl Personal Assets, Net Worth Excl Personal Assets, Key Ratios)
 *
 * ARCHITECTURAL CONTRACT:
 * - 100% Pure TypeScript. No React, DOM, browser storage, or network imports.
 * - In-memory calculation model only.
 * - Prevents double counting by establishing canonical models (especially Mode A vs Mode B expense handling).
 * - Handles zero-denominator edge cases gracefully with null (rendered as "Not available").
 */

import { assertFinite, assertPositiveOrZero, FinanceValidationError } from './errors';

export type ExpenseFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';

/**
 * Frequency multiplier to annual amount.
 * Monthly -> * 12
 * Quarterly -> * 4
 * Half-Yearly -> * 2
 * Annual -> * 1
 */
export function getAnnualMultiplier(frequency: ExpenseFrequency): number {
  switch (frequency) {
    case 'MONTHLY':
      return 12;
    case 'QUARTERLY':
      return 4;
    case 'HALF_YEARLY':
      return 2;
    case 'ANNUAL':
      return 1;
    default:
      throw new FinanceValidationError('frequency', frequency, 'Invalid frequency');
  }
}

export function convertToAnnualAndMonthly(
  amount: number,
  frequency: ExpenseFrequency
): { annualAmount: number; monthlyAmount: number } {
  assertFinite(amount, 'amount');
  assertPositiveOrZero(amount, 'amount');
  const mult = getAnnualMultiplier(frequency);
  const annualAmount = amount * mult;
  const monthlyAmount = annualAmount / 12;
  return { annualAmount, monthlyAmount };
}

// -------------------------------------------------------------
// STAGE 1: INCOME
// -------------------------------------------------------------
export type IncomeSourceCategory =
  | 'SALARY_SELF'
  | 'SALARY_SPOUSE'
  | 'BONUS_SELF'
  | 'BONUS_SPOUSE'
  | 'BUSINESS'
  | 'RENTAL'
  | 'INVESTMENT'
  | 'OTHER';

export interface IncomeLineItem {
  readonly id: string;
  readonly label: string;
  readonly category: IncomeSourceCategory;
  /** Primary entry basis: either monthly or annual */
  readonly inputPeriod: 'MONTHLY' | 'ANNUAL';
  readonly enteredGrossAmount: number;
  /** Deductions (e.g. income tax / professional tax) */
  readonly annualDeductions: number;
}

export interface CalculatedIncomeLineItem extends IncomeLineItem {
  readonly grossAnnualAmount: number;
  readonly grossMonthlyAmount: number;
  readonly netAnnualAmount: number;
  readonly netMonthlyAmount: number;
  readonly percentOfTotalNetIncome: number | null;
}

export interface IncomeStageResult {
  readonly items: readonly CalculatedIncomeLineItem[];
  readonly totalGrossAnnualIncome: number;
  readonly totalAnnualDeductions: number;
  readonly totalNetAnnualIncome: number;
  readonly totalNetMonthlyIncome: number;
}

export function calculateIncomeStage(items: readonly IncomeLineItem[]): IncomeStageResult {
  // Pass 1: compute net annual for all rows
  const computedList = items.map((item) => {
    assertFinite(item.enteredGrossAmount, `enteredGrossAmount for ${item.id}`);
    assertPositiveOrZero(item.enteredGrossAmount, `enteredGrossAmount for ${item.id}`);
    const deductions = item.annualDeductions || 0;
    assertFinite(deductions, `annualDeductions for ${item.id}`);
    assertPositiveOrZero(deductions, `annualDeductions for ${item.id}`);

    let grossAnnual = 0;
    let grossMonthly = 0;
    if (item.inputPeriod === 'MONTHLY') {
      grossMonthly = item.enteredGrossAmount;
      grossAnnual = item.enteredGrossAmount * 12;
    } else {
      grossAnnual = item.enteredGrossAmount;
      grossMonthly = item.enteredGrossAmount / 12;
    }

    const netAnnual = Math.max(0, grossAnnual - deductions);
    const netMonthly = netAnnual / 12;

    return {
      ...item,
      grossAnnualAmount: grossAnnual,
      grossMonthlyAmount: grossMonthly,
      netAnnualAmount: netAnnual,
      netMonthlyAmount: netMonthly,
    };
  });

  const totalGrossAnnualIncome = computedList.reduce((sum, r) => sum + r.grossAnnualAmount, 0);
  const totalAnnualDeductions = computedList.reduce((sum, r) => sum + r.annualDeductions, 0);
  const totalNetAnnualIncome = computedList.reduce((sum, r) => sum + r.netAnnualAmount, 0);
  const totalNetMonthlyIncome = totalNetAnnualIncome / 12;

  // Pass 2: compute percentage share of net income
  const itemsWithPercent: CalculatedIncomeLineItem[] = computedList.map((row) => ({
    ...row,
    percentOfTotalNetIncome:
      totalNetAnnualIncome > 0 ? (row.netAnnualAmount / totalNetAnnualIncome) * 100 : null,
  }));

  return {
    items: itemsWithPercent,
    totalGrossAnnualIncome,
    totalAnnualDeductions,
    totalNetAnnualIncome,
    totalNetMonthlyIncome,
  };
}

// -------------------------------------------------------------
// STAGE 2: EXPENSES
// -------------------------------------------------------------
export type ExpenseCategory =
  | 'HOUSEHOLD'
  | 'LIFESTYLE'
  | 'DEPENDENT'
  | 'INSURANCE'
  | 'LOAN_EMI'
  | 'OTHER';

export type HouseholdExpenseMode = 'TOTAL_MODE' | 'ITEMIZED_MODE';

export interface ExpenseLineItem {
  readonly id: string;
  readonly label: string;
  readonly category: ExpenseCategory;
  readonly frequency: ExpenseFrequency;
  readonly enteredAmount: number;
}

export interface CalculatedExpenseLineItem extends ExpenseLineItem {
  readonly annualAmount: number;
  readonly monthlyAmount: number;
  readonly percentOfTotalIncome: number | null;
}

export interface ExpenseStageInputs {
  readonly householdMode: HouseholdExpenseMode;
  /** Used only if householdMode === 'TOTAL_MODE' */
  readonly singleMonthlyHouseholdExpense: number;
  /** Itemized list. Household rows in this list only contribute if householdMode === 'ITEMIZED_MODE' */
  readonly itemizedExpenses: readonly ExpenseLineItem[];
  readonly totalNetAnnualIncome: number;
}

export interface ExpenseCategorySubtotal {
  readonly category: ExpenseCategory;
  readonly label: string;
  readonly annualAmount: number;
  readonly monthlyAmount: number;
  readonly percentOfTotalIncome: number | null;
}

export interface ExpenseStageResult {
  readonly householdMode: HouseholdExpenseMode;
  readonly items: readonly CalculatedExpenseLineItem[];
  readonly categorySubtotals: readonly ExpenseCategorySubtotal[];
  readonly householdSubtotalAnnual: number;
  readonly householdSubtotalMonthly: number;
  readonly lifestyleSubtotalAnnual: number;
  readonly lifestyleSubtotalMonthly: number;
  readonly dependentSubtotalAnnual: number;
  readonly dependentSubtotalMonthly: number;
  readonly insuranceSubtotalAnnual: number;
  readonly insuranceSubtotalMonthly: number;
  readonly loanEmiSubtotalAnnual: number;
  readonly loanEmiSubtotalMonthly: number;
  readonly totalAnnualExpenses: number;
  readonly totalMonthlyExpenses: number;
  readonly expenseToIncomeRatio: number | null;
}

export function calculateExpenseStage(inputs: ExpenseStageInputs): ExpenseStageResult {
  const { householdMode, singleMonthlyHouseholdExpense, itemizedExpenses, totalNetAnnualIncome } = inputs;

  const validSingleExpense = Math.max(0, singleMonthlyHouseholdExpense || 0);

  // Compute calculated line items
  const computedItems: CalculatedExpenseLineItem[] = [];

  if (householdMode === 'TOTAL_MODE') {
    // Add single household entry as an item
    const singleAnnual = validSingleExpense * 12;
    computedItems.push({
      id: 'hh-total-single',
      label: 'Consolidated Household Expenses (Monthly Total Mode)',
      category: 'HOUSEHOLD',
      frequency: 'MONTHLY',
      enteredAmount: validSingleExpense,
      annualAmount: singleAnnual,
      monthlyAmount: validSingleExpense,
      percentOfTotalIncome: totalNetAnnualIncome > 0 ? (singleAnnual / totalNetAnnualIncome) * 100 : null,
    });
  }

  // Iterate over itemized expenses
  for (const item of itemizedExpenses) {
    if (item.category === 'HOUSEHOLD' && householdMode === 'TOTAL_MODE') {
      // Inactive: preserve in items with 0 active contribution or omit?
      // To strictly prevent double-counting, we do not include it in active sums.
      continue;
    }

    const { annualAmount, monthlyAmount } = convertToAnnualAndMonthly(
      item.enteredAmount,
      item.frequency
    );

    computedItems.push({
      ...item,
      annualAmount,
      monthlyAmount,
      percentOfTotalIncome: totalNetAnnualIncome > 0 ? (annualAmount / totalNetAnnualIncome) * 100 : null,
    });
  }

  // Compute category subtotals
  let hhAnnual = 0;
  let lifestyleAnnual = 0;
  let depAnnual = 0;
  let insAnnual = 0;
  let emiAnnual = 0;
  let otherAnnual = 0;

  for (const item of computedItems) {
    switch (item.category) {
      case 'HOUSEHOLD':
        hhAnnual += item.annualAmount;
        break;
      case 'LIFESTYLE':
        lifestyleAnnual += item.annualAmount;
        break;
      case 'DEPENDENT':
        depAnnual += item.annualAmount;
        break;
      case 'INSURANCE':
        insAnnual += item.annualAmount;
        break;
      case 'LOAN_EMI':
        emiAnnual += item.annualAmount;
        break;
      case 'OTHER':
        otherAnnual += item.annualAmount;
        break;
    }
  }

  const totalAnnualExpenses = hhAnnual + lifestyleAnnual + depAnnual + insAnnual + emiAnnual + otherAnnual;
  const totalMonthlyExpenses = totalAnnualExpenses / 12;

  const makeSubtotal = (
    cat: ExpenseCategory,
    lbl: string,
    ann: number
  ): ExpenseCategorySubtotal => ({
    category: cat,
    label: lbl,
    annualAmount: ann,
    monthlyAmount: ann / 12,
    percentOfTotalIncome: totalNetAnnualIncome > 0 ? (ann / totalNetAnnualIncome) * 100 : null,
  });

  const categorySubtotals: ExpenseCategorySubtotal[] = [
    makeSubtotal('HOUSEHOLD', 'Household Expenses', hhAnnual),
    makeSubtotal('LIFESTYLE', 'Lifestyle Expenses', lifestyleAnnual),
    makeSubtotal('DEPENDENT', 'Dependent Expenses', depAnnual),
    makeSubtotal('INSURANCE', 'Insurance Premiums', insAnnual),
    makeSubtotal('LOAN_EMI', 'Loan EMIs', emiAnnual),
  ];
  if (otherAnnual > 0) {
    categorySubtotals.push(makeSubtotal('OTHER', 'Other Expenses', otherAnnual));
  }

  return {
    householdMode,
    items: computedItems,
    categorySubtotals,
    householdSubtotalAnnual: hhAnnual,
    householdSubtotalMonthly: hhAnnual / 12,
    lifestyleSubtotalAnnual: lifestyleAnnual,
    lifestyleSubtotalMonthly: lifestyleAnnual / 12,
    dependentSubtotalAnnual: depAnnual,
    dependentSubtotalMonthly: depAnnual / 12,
    insuranceSubtotalAnnual: insAnnual,
    insuranceSubtotalMonthly: insAnnual / 12,
    loanEmiSubtotalAnnual: emiAnnual,
    loanEmiSubtotalMonthly: emiAnnual / 12,
    totalAnnualExpenses,
    totalMonthlyExpenses,
    expenseToIncomeRatio:
      totalNetAnnualIncome > 0 ? (totalAnnualExpenses / totalNetAnnualIncome) * 100 : null,
  };
}

// -------------------------------------------------------------
// STAGE 3: SAVINGS & ONGOING INVESTMENTS
// -------------------------------------------------------------
export interface OngoingInvestmentItem {
  readonly id: string;
  readonly label: string;
  readonly frequency: ExpenseFrequency;
  readonly enteredAmount: number;
}

export interface CalculatedOngoingInvestmentItem extends OngoingInvestmentItem {
  readonly annualAmount: number;
  readonly monthlyAmount: number;
  readonly percentOfIncome: number | null;
}

export interface SurplusProjectionPoint {
  readonly year: number;
  /** Future value of compounding monthly surplus (invested at beginning of month) */
  readonly projectedCorpus: number;
  readonly cumulativeContributed: number;
  readonly compoundGain: number;
}

export interface SavingsStageInputs {
  readonly totalNetAnnualIncome: number;
  readonly totalAnnualExpenses: number;
  readonly ongoingInvestments: readonly OngoingInvestmentItem[];
  /** Optional annual return rate for surplus growth illustration (e.g. 10 for 10% p.a.) */
  readonly assumedSurplusReturnPercent?: number;
}

export interface SavingsStageResult {
  readonly totalNetAnnualIncome: number;
  readonly totalAnnualExpenses: number;
  readonly annualSavings: number;
  readonly monthlySavings: number;
  readonly savingsRatePercent: number | null;
  readonly ongoingInvestmentItems: readonly CalculatedOngoingInvestmentItem[];
  readonly totalOngoingInvestmentsAnnual: number;
  readonly totalOngoingInvestmentsMonthly: number;
  /** Annual surplus available for fresh investments (can be negative if commitments > savings) */
  readonly annualSurplusForFreshInvestments: number;
  readonly monthlySurplusForFreshInvestments: number;
  /** Projections at 5, 10, 15, 20 years if monthly surplus > 0 and rate is provided */
  readonly surplusProjections: readonly SurplusProjectionPoint[];
  readonly assumedReturnPercent: number;
}

export function calculateSavingsStage(inputs: SavingsStageInputs): SavingsStageResult {
  const {
    totalNetAnnualIncome,
    totalAnnualExpenses,
    ongoingInvestments,
    assumedSurplusReturnPercent = 10,
  } = inputs;

  const annualSavings = totalNetAnnualIncome - totalAnnualExpenses;
  const monthlySavings = annualSavings / 12;
  const savingsRatePercent =
    totalNetAnnualIncome > 0 ? (annualSavings / totalNetAnnualIncome) * 100 : null;

  const calculatedOngoing: CalculatedOngoingInvestmentItem[] = ongoingInvestments.map((inv) => {
    const { annualAmount, monthlyAmount } = convertToAnnualAndMonthly(
      inv.enteredAmount,
      inv.frequency
    );
    return {
      ...inv,
      annualAmount,
      monthlyAmount,
      percentOfIncome:
        totalNetAnnualIncome > 0 ? (annualAmount / totalNetAnnualIncome) * 100 : null,
    };
  });

  const totalOngoingInvestmentsAnnual = calculatedOngoing.reduce(
    (sum, item) => sum + item.annualAmount,
    0
  );
  const totalOngoingInvestmentsMonthly = totalOngoingInvestmentsAnnual / 12;

  const annualSurplusForFreshInvestments = annualSavings - totalOngoingInvestmentsAnnual;
  const monthlySurplusForFreshInvestments = annualSurplusForFreshInvestments / 12;

  // Surplus Growth Projections (at 5, 10, 15, 20 years)
  // Standard monthly compounding annuity: P * [ ( (1 + r)^n - 1 ) / r ] * (1 + r)
  const projections: SurplusProjectionPoint[] = [];
  const validRate = Math.min(Math.max(assumedSurplusReturnPercent, 0), 30);

  if (monthlySurplusForFreshInvestments > 0 && validRate > 0) {
    const r = validRate / 100 / 12;
    const horizons = [5, 10, 15, 20];
    for (const yr of horizons) {
      const n = yr * 12;
      const fvFactor = ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      const projectedCorpus = Math.round(monthlySurplusForFreshInvestments * fvFactor);
      const cumulativeContributed = Math.round(monthlySurplusForFreshInvestments * n);
      const compoundGain = Math.max(0, projectedCorpus - cumulativeContributed);
      projections.push({
        year: yr,
        projectedCorpus,
        cumulativeContributed,
        compoundGain,
      });
    }
  }

  return {
    totalNetAnnualIncome,
    totalAnnualExpenses,
    annualSavings,
    monthlySavings,
    savingsRatePercent,
    ongoingInvestmentItems: calculatedOngoing,
    totalOngoingInvestmentsAnnual,
    totalOngoingInvestmentsMonthly,
    annualSurplusForFreshInvestments,
    monthlySurplusForFreshInvestments,
    surplusProjections: projections,
    assumedReturnPercent: validRate,
  };
}

// -------------------------------------------------------------
// STAGE 4: ASSETS (6 Classes + Owner Attribution)
// -------------------------------------------------------------
export type AssetClass =
  | 'LIQUID'
  | 'DEBT'
  | 'EQUITY'
  | 'GOLD'
  | 'REAL_ESTATE'
  | 'PERSONAL';

export interface AssetLineItem {
  readonly id: string;
  readonly label: string;
  readonly assetClass: AssetClass;
  readonly selfAmount: number;
  readonly spouseAmount: number;
  readonly childrenAmount: number;
  readonly purposeGoal?: string;
}

export interface CalculatedAssetLineItem extends AssetLineItem {
  readonly totalValue: number;
  readonly percentOfTotalAssets: number | null;
}

export interface AssetClassSubtotal {
  readonly assetClass: AssetClass;
  readonly label: string;
  readonly totalValue: number;
  readonly selfTotal: number;
  readonly spouseTotal: number;
  readonly childrenTotal: number;
  readonly percentOfTotalAssets: number | null;
}

export interface AssetStageResult {
  readonly items: readonly CalculatedAssetLineItem[];
  readonly classSubtotals: readonly AssetClassSubtotal[];
  readonly totalAssets: number;
  readonly totalLiquidAssets: number;
  readonly totalDebtAssets: number;
  readonly totalEquityAssets: number;
  readonly totalGoldAssets: number;
  readonly totalRealEstateAssets: number;
  readonly totalPersonalAssets: number;
  /** Productive assets = Liquid + Debt + Equity + Gold + Real Estate (investments) */
  readonly totalProductiveAssets: number;
  readonly totalSelfAssets: number;
  readonly totalSpouseAssets: number;
  readonly totalChildrenAssets: number;
}

export function calculateAssetStage(items: readonly AssetLineItem[]): AssetStageResult {
  // Pass 1: compute line item totals
  const computedList: CalculatedAssetLineItem[] = items.map((item) => {
    const s = Math.max(0, item.selfAmount || 0);
    const sp = Math.max(0, item.spouseAmount || 0);
    const c = Math.max(0, item.childrenAmount || 0);
    const total = s + sp + c;
    return {
      ...item,
      selfAmount: s,
      spouseAmount: sp,
      childrenAmount: c,
      totalValue: total,
      percentOfTotalAssets: null, // will populate in pass 2
    };
  });

  const totalAssets = computedList.reduce((sum, r) => sum + r.totalValue, 0);

  // Pass 2: percentage share
  const itemsWithPercent: CalculatedAssetLineItem[] = computedList.map((row) => ({
    ...row,
    percentOfTotalAssets: totalAssets > 0 ? (row.totalValue / totalAssets) * 100 : null,
  }));

  const classNames: Record<AssetClass, string> = {
    LIQUID: 'Liquid Assets',
    DEBT: 'Debt Assets',
    EQUITY: 'Equity Assets',
    GOLD: 'Gold Assets',
    REAL_ESTATE: 'Real Estate Assets (Investments)',
    PERSONAL: 'Personal Assets (Residence, Vehicles, Gold)',
  };

  const classOrder: AssetClass[] = ['LIQUID', 'DEBT', 'EQUITY', 'GOLD', 'REAL_ESTATE', 'PERSONAL'];

  const classSubtotals: AssetClassSubtotal[] = classOrder.map((cls) => {
    const inCls = itemsWithPercent.filter((r) => r.assetClass === cls);
    const clsTotal = inCls.reduce((sum, r) => sum + r.totalValue, 0);
    const sTotal = inCls.reduce((sum, r) => sum + r.selfAmount, 0);
    const spTotal = inCls.reduce((sum, r) => sum + r.spouseAmount, 0);
    const cTotal = inCls.reduce((sum, r) => sum + r.childrenAmount, 0);

    return {
      assetClass: cls,
      label: classNames[cls],
      totalValue: clsTotal,
      selfTotal: sTotal,
      spouseTotal: spTotal,
      childrenTotal: cTotal,
      percentOfTotalAssets: totalAssets > 0 ? (clsTotal / totalAssets) * 100 : null,
    };
  });

  const getSub = (cls: AssetClass) =>
    classSubtotals.find((c) => c.assetClass === cls)?.totalValue || 0;

  const totalLiquidAssets = getSub('LIQUID');
  const totalDebtAssets = getSub('DEBT');
  const totalEquityAssets = getSub('EQUITY');
  const totalGoldAssets = getSub('GOLD');
  const totalRealEstateAssets = getSub('REAL_ESTATE');
  const totalPersonalAssets = getSub('PERSONAL');

  const totalProductiveAssets =
    totalLiquidAssets + totalDebtAssets + totalEquityAssets + totalGoldAssets + totalRealEstateAssets;

  const totalSelfAssets = itemsWithPercent.reduce((sum, r) => sum + r.selfAmount, 0);
  const totalSpouseAssets = itemsWithPercent.reduce((sum, r) => sum + r.spouseAmount, 0);
  const totalChildrenAssets = itemsWithPercent.reduce((sum, r) => sum + r.childrenAmount, 0);

  return {
    items: itemsWithPercent,
    classSubtotals,
    totalAssets,
    totalLiquidAssets,
    totalDebtAssets,
    totalEquityAssets,
    totalGoldAssets,
    totalRealEstateAssets,
    totalPersonalAssets,
    totalProductiveAssets,
    totalSelfAssets,
    totalSpouseAssets,
    totalChildrenAssets,
  };
}

// -------------------------------------------------------------
// STAGE 5: LIABILITIES
// -------------------------------------------------------------
export type LiabilityType =
  | 'HOME_LOAN'
  | 'VEHICLE_LOAN'
  | 'PERSONAL_LOAN'
  | 'EDUCATION_LOAN'
  | 'OTHER_LOAN'
  | 'CREDIT_CARD';

export interface LiabilityLineItem {
  readonly id: string;
  readonly label: string;
  readonly type: LiabilityType;
  readonly selfAmount: number;
  readonly spouseAmount: number;
  readonly childrenAmount: number;
  readonly purposeGoal?: string;
}

export interface CalculatedLiabilityLineItem extends LiabilityLineItem {
  readonly totalOutstanding: number;
  readonly percentOfTotalLiabilities: number | null;
  readonly percentOfTotalAssets: number | null;
}

export interface LiabilityStageResult {
  readonly items: readonly CalculatedLiabilityLineItem[];
  readonly totalLiabilities: number;
  readonly totalSelfLiabilities: number;
  readonly totalSpouseLiabilities: number;
  readonly totalChildrenLiabilities: number;
  readonly debtToAssetRatioPercent: number | null;
}

export function calculateLiabilityStage(
  items: readonly LiabilityLineItem[],
  totalAssets: number
): LiabilityStageResult {
  const computedList = items.map((item) => {
    const s = Math.max(0, item.selfAmount || 0);
    const sp = Math.max(0, item.spouseAmount || 0);
    const c = Math.max(0, item.childrenAmount || 0);
    const total = s + sp + c;
    return {
      ...item,
      selfAmount: s,
      spouseAmount: sp,
      childrenAmount: c,
      totalOutstanding: total,
      percentOfTotalLiabilities: null,
      percentOfTotalAssets: totalAssets > 0 ? (total / totalAssets) * 100 : null,
    };
  });

  const totalLiabilities = computedList.reduce((sum, r) => sum + r.totalOutstanding, 0);

  const itemsWithPercent: CalculatedLiabilityLineItem[] = computedList.map((row) => ({
    ...row,
    percentOfTotalLiabilities:
      totalLiabilities > 0 ? (row.totalOutstanding / totalLiabilities) * 100 : null,
  }));

  const totalSelfLiabilities = itemsWithPercent.reduce((sum, r) => sum + r.selfAmount, 0);
  const totalSpouseLiabilities = itemsWithPercent.reduce((sum, r) => sum + r.spouseAmount, 0);
  const totalChildrenLiabilities = itemsWithPercent.reduce((sum, r) => sum + r.childrenAmount, 0);

  return {
    items: itemsWithPercent,
    totalLiabilities,
    totalSelfLiabilities,
    totalSpouseLiabilities,
    totalChildrenLiabilities,
    debtToAssetRatioPercent: totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : null,
  };
}

// -------------------------------------------------------------
// STAGE 6: NET WORTH & FINAL RECONCILIATION
// -------------------------------------------------------------
export interface ClientStatementMetadata {
  clientName: string;
  spouseName?: string;
  childrenNames?: string[];
  statementDate: string; // YYYY-MM-DD
  preparedBy: string;
  discussionNotes?: string;
}

export interface ComprehensiveStatementInputs {
  readonly metadata: ClientStatementMetadata;
  readonly incomeItems: readonly IncomeLineItem[];
  readonly expenseInputs: {
    householdMode: HouseholdExpenseMode;
    singleMonthlyHouseholdExpense: number;
    itemizedExpenses: readonly ExpenseLineItem[];
  };
  readonly ongoingInvestments: readonly OngoingInvestmentItem[];
  readonly assetItems: readonly AssetLineItem[];
  readonly liabilityItems: readonly LiabilityLineItem[];
  readonly assumedSurplusReturnPercent?: number;
}

export interface PersonalFinanceStatementResult {
  readonly metadata: ClientStatementMetadata;
  readonly incomeStage: IncomeStageResult;
  readonly expenseStage: ExpenseStageResult;
  readonly savingsStage: SavingsStageResult;
  readonly assetStage: AssetStageResult;
  readonly liabilityStage: LiabilityStageResult;
  // Key Net Worth metrics
  readonly totalAssets: number;
  readonly totalLiabilities: number;
  /** Net Worth (Including Personal Assets) = Total Assets - Total Liabilities */
  readonly netWorthIncludingPersonalAssets: number;
  /** Net Worth (Excluding Personal Assets) = Total Assets - Total Liabilities - Personal Assets */
  readonly netWorthExcludingPersonalAssets: number;
  readonly totalPersonalAssets: number;
  // Key Ratios
  readonly savingsRatePercent: number | null;
  readonly debtToAssetRatioPercent: number | null;
  readonly liquidAssetsRunwayMonths: number | null;
  readonly productiveAssetsRatioPercent: number | null;
}

export function calculateComprehensivePersonalFinanceStatement(
  inputs: ComprehensiveStatementInputs
): PersonalFinanceStatementResult {
  // 1. Income Stage
  const incomeStage = calculateIncomeStage(inputs.incomeItems);

  // 2. Expense Stage
  const expenseStage = calculateExpenseStage({
    householdMode: inputs.expenseInputs.householdMode,
    singleMonthlyHouseholdExpense: inputs.expenseInputs.singleMonthlyHouseholdExpense,
    itemizedExpenses: inputs.expenseInputs.itemizedExpenses,
    totalNetAnnualIncome: incomeStage.totalNetAnnualIncome,
  });

  // 3. Savings Stage
  const savingsStage = calculateSavingsStage({
    totalNetAnnualIncome: incomeStage.totalNetAnnualIncome,
    totalAnnualExpenses: expenseStage.totalAnnualExpenses,
    ongoingInvestments: inputs.ongoingInvestments,
    assumedSurplusReturnPercent: inputs.assumedSurplusReturnPercent ?? 10,
  });

  // 4. Asset Stage
  const assetStage = calculateAssetStage(inputs.assetItems);

  // 5. Liability Stage
  const liabilityStage = calculateLiabilityStage(inputs.liabilityItems, assetStage.totalAssets);

  // 6. Net Worth calculations
  const totalAssets = assetStage.totalAssets;
  const totalLiabilities = liabilityStage.totalLiabilities;
  const totalPersonalAssets = assetStage.totalPersonalAssets;

  const netWorthIncludingPersonalAssets = totalAssets - totalLiabilities;
  const netWorthExcludingPersonalAssets = totalAssets - totalLiabilities - totalPersonalAssets;

  // Key Ratios
  const savingsRatePercent = savingsStage.savingsRatePercent;
  const debtToAssetRatioPercent = liabilityStage.debtToAssetRatioPercent;

  // Liquid assets runway: Total Liquid Assets / Total Monthly Expenses
  const liquidAssetsRunwayMonths =
    expenseStage.totalMonthlyExpenses > 0
      ? assetStage.totalLiquidAssets / expenseStage.totalMonthlyExpenses
      : null;

  // Productive assets ratio: Total Productive Assets / Total Assets
  const productiveAssetsRatioPercent =
    totalAssets > 0 ? (assetStage.totalProductiveAssets / totalAssets) * 100 : null;

  return {
    metadata: inputs.metadata,
    incomeStage,
    expenseStage,
    savingsStage,
    assetStage,
    liabilityStage,
    totalAssets,
    totalLiabilities,
    netWorthIncludingPersonalAssets,
    netWorthExcludingPersonalAssets,
    totalPersonalAssets,
    savingsRatePercent,
    debtToAssetRatioPercent,
    liquidAssetsRunwayMonths,
    productiveAssetsRatioPercent,
  };
}

// -------------------------------------------------------------
// CANONICAL DEFAULT FIXTURES (Aligned with ProTool_04 Excel Workbook)
// -------------------------------------------------------------
export const DEFAULT_INCOME_ITEMS: IncomeLineItem[] = [
  {
    id: 'inc-sal-self',
    label: 'Salary Income (Self)',
    category: 'SALARY_SELF',
    inputPeriod: 'MONTHLY',
    enteredGrossAmount: 150000,
    annualDeductions: 180000, // TDS / Taxes
  },
  {
    id: 'inc-sal-spouse',
    label: 'Salary Income (Spouse)',
    category: 'SALARY_SPOUSE',
    inputPeriod: 'MONTHLY',
    enteredGrossAmount: 80000,
    annualDeductions: 60000,
  },
  {
    id: 'inc-bonus-self',
    label: 'Annual Bonus (Self)',
    category: 'BONUS_SELF',
    inputPeriod: 'ANNUAL',
    enteredGrossAmount: 200000,
    annualDeductions: 40000,
  },
  {
    id: 'inc-bonus-spouse',
    label: 'Annual Bonus (Spouse)',
    category: 'BONUS_SPOUSE',
    inputPeriod: 'ANNUAL',
    enteredGrossAmount: 100000,
    annualDeductions: 20000,
  },
  {
    id: 'inc-business',
    label: 'Business / Professional Income',
    category: 'BUSINESS',
    inputPeriod: 'ANNUAL',
    enteredGrossAmount: 0,
    annualDeductions: 0,
  },
  {
    id: 'inc-rental',
    label: 'Rental Income',
    category: 'RENTAL',
    inputPeriod: 'MONTHLY',
    enteredGrossAmount: 25000,
    annualDeductions: 30000,
  },
  {
    id: 'inc-investment',
    label: 'Investment Income (Dividends/Interest)',
    category: 'INVESTMENT',
    inputPeriod: 'ANNUAL',
    enteredGrossAmount: 50000,
    annualDeductions: 5000,
  },
];

export const DEFAULT_ITEMIZED_EXPENSES: ExpenseLineItem[] = [
  // Household
  { id: 'exp-hh-rent', label: 'House Rent', category: 'HOUSEHOLD', frequency: 'MONTHLY', enteredAmount: 35000 },
  { id: 'exp-hh-maint', label: 'Society Maintenance, Repair & Upkeep', category: 'HOUSEHOLD', frequency: 'MONTHLY', enteredAmount: 4000 },
  { id: 'exp-hh-food', label: 'Food, Grocery & Toiletries', category: 'HOUSEHOLD', frequency: 'MONTHLY', enteredAmount: 28000 },
  { id: 'exp-hh-fuel', label: 'Vehicle Fuel, Maintenance & Local Travel', category: 'HOUSEHOLD', frequency: 'MONTHLY', enteredAmount: 8000 },
  { id: 'exp-hh-med', label: 'Medicines, Doctor & Routine Healthcare', category: 'HOUSEHOLD', frequency: 'MONTHLY', enteredAmount: 4000 },
  { id: 'exp-hh-util', label: 'Electricity, Gas & Water Utilities', category: 'HOUSEHOLD', frequency: 'MONTHLY', enteredAmount: 5500 },
  { id: 'exp-hh-help', label: 'Domestic Help & Housekeeping', category: 'HOUSEHOLD', frequency: 'MONTHLY', enteredAmount: 6500 },
  { id: 'exp-hh-comm', label: 'Mobile, Telephone & Broadband Internet', category: 'HOUSEHOLD', frequency: 'MONTHLY', enteredAmount: 2500 },
  { id: 'exp-hh-subs', label: 'OTT, TV Subscriptions & Newspapers', category: 'HOUSEHOLD', frequency: 'MONTHLY', enteredAmount: 1500 },
  { id: 'exp-hh-other', label: 'Other Household Miscellaneous', category: 'HOUSEHOLD', frequency: 'MONTHLY', enteredAmount: 2000 },
  // Lifestyle
  { id: 'exp-life-clothes', label: 'Clothes & Accessories', category: 'LIFESTYLE', frequency: 'MONTHLY', enteredAmount: 6000 },
  { id: 'exp-life-shop', label: 'Shopping, Gifts & Electronics', category: 'LIFESTYLE', frequency: 'QUARTERLY', enteredAmount: 15000 },
  { id: 'exp-life-dine', label: 'Dining Out, Movies & Entertainment', category: 'LIFESTYLE', frequency: 'MONTHLY', enteredAmount: 8000 },
  { id: 'exp-life-care', label: 'Personal Care, Salon, Spa & Gym', category: 'LIFESTYLE', frequency: 'MONTHLY', enteredAmount: 3500 },
  { id: 'exp-life-vac', label: 'Travel & Annual Family Vacations', category: 'LIFESTYLE', frequency: 'ANNUAL', enteredAmount: 120000 },
  { id: 'exp-life-coach', label: 'Fitness / Professional Advisory Fees', category: 'LIFESTYLE', frequency: 'ANNUAL', enteredAmount: 15000 },
  { id: 'exp-life-club', label: 'Hobbies & Club Memberships', category: 'LIFESTYLE', frequency: 'ANNUAL', enteredAmount: 10000 },
  { id: 'exp-life-course', label: 'Professional Courses & Skill Development', category: 'LIFESTYLE', frequency: 'ANNUAL', enteredAmount: 25000 },
  { id: 'exp-life-charity', label: 'Charity & Social Contributions', category: 'LIFESTYLE', frequency: 'ANNUAL', enteredAmount: 12000 },
  // Dependents
  { id: 'exp-dep-school', label: "Children's Schooling, College & Tuition Fees", category: 'DEPENDENT', frequency: 'QUARTERLY', enteredAmount: 45000 },
  { id: 'exp-dep-parents', label: 'Monthly Financial Contribution to Parents', category: 'DEPENDENT', frequency: 'MONTHLY', enteredAmount: 15000 },
  { id: 'exp-dep-relatives', label: 'Support for Extended Family', category: 'DEPENDENT', frequency: 'ANNUAL', enteredAmount: 20000 },
  // Insurance Premiums
  { id: 'exp-ins-life', label: 'Life Insurance (Pure Term Plans)', category: 'INSURANCE', frequency: 'ANNUAL', enteredAmount: 32000 },
  { id: 'exp-ins-health', label: 'Health Insurance (Family Floater + Super Top-up)', category: 'INSURANCE', frequency: 'ANNUAL', enteredAmount: 28000 },
  { id: 'exp-ins-gen', label: 'General Insurance (Motor & Home Shield)', category: 'INSURANCE', frequency: 'ANNUAL', enteredAmount: 18000 },
  // Loan EMIs
  { id: 'exp-emi-home', label: 'Home Loan Monthly EMI', category: 'LOAN_EMI', frequency: 'MONTHLY', enteredAmount: 42000 },
  { id: 'exp-emi-car', label: 'Vehicle Loan Monthly EMI', category: 'LOAN_EMI', frequency: 'MONTHLY', enteredAmount: 14000 },
  { id: 'exp-emi-other', label: 'Other Personal / Education Loan EMIs', category: 'LOAN_EMI', frequency: 'MONTHLY', enteredAmount: 0 },
];

export const DEFAULT_ONGOING_INVESTMENTS: OngoingInvestmentItem[] = [
  { id: 'inv-sip-equity', label: 'Equity Mutual Fund Systematic Investment Plans (SIPs)', frequency: 'MONTHLY', enteredAmount: 35000 },
  { id: 'inv-sip-rd', label: 'Recurring Deposits & Post Office RDs', frequency: 'MONTHLY', enteredAmount: 5000 },
  { id: 'inv-sip-ppf', label: 'PPF Annual Contribution', frequency: 'ANNUAL', enteredAmount: 150000 },
  { id: 'inv-sip-nps', label: 'NPS Voluntary Contribution', frequency: 'ANNUAL', enteredAmount: 50000 },
];

export const DEFAULT_ASSET_ITEMS: AssetLineItem[] = [
  // Liquid Assets
  { id: 'ast-liq-sb', label: 'Savings Bank Accounts', assetClass: 'LIQUID', selfAmount: 250000, spouseAmount: 180000, childrenAmount: 0, purposeGoal: 'Daily Cash Flow & Buffer' },
  { id: 'ast-liq-mf', label: 'Liquid Mutual Funds / Overnight Funds', assetClass: 'LIQUID', selfAmount: 400000, spouseAmount: 200000, childrenAmount: 0, purposeGoal: 'Emergency Reserve (6 Months)' },
  { id: 'ast-liq-cash', label: 'Cash in Hand', assetClass: 'LIQUID', selfAmount: 30000, spouseAmount: 20000, childrenAmount: 0, purposeGoal: 'Household Contingency' },

  // Debt Assets
  { id: 'ast-debt-fd', label: 'Bank & Corporate Fixed Deposits', assetClass: 'DEBT', selfAmount: 500000, spouseAmount: 300000, childrenAmount: 0, purposeGoal: 'Near-term Capital Preservation' },
  { id: 'ast-debt-ppf', label: 'Public Provident Fund (PPF)', assetClass: 'DEBT', selfAmount: 850000, spouseAmount: 620000, childrenAmount: 0, purposeGoal: 'Long-term Debt Compounding' },
  { id: 'ast-debt-epf', label: 'EPF / Voluntary PF / Gratuity Current Value', assetClass: 'DEBT', selfAmount: 1450000, spouseAmount: 780000, childrenAmount: 0, purposeGoal: 'Retirement Anchor' },
  { id: 'ast-debt-nsc', label: 'NSC / Post Office MIS / KVP / RDs', assetClass: 'DEBT', selfAmount: 150000, spouseAmount: 0, childrenAmount: 0, purposeGoal: 'Fixed Income Safety' },
  { id: 'ast-debt-nps', label: 'NPS (Debt Portion - Tier I)', assetClass: 'DEBT', selfAmount: 280000, spouseAmount: 140000, childrenAmount: 0, purposeGoal: 'Retirement Annuity Foundation' },
  { id: 'ast-debt-funds', label: 'Debt Mutual Funds (Short Duration / Corporate Bond)', assetClass: 'DEBT', selfAmount: 350000, spouseAmount: 150000, childrenAmount: 0, purposeGoal: 'Tax-deferred Debt Reserves' },
  { id: 'ast-debt-ins-sv', label: 'Insurance Policies (Traditional Surrender Value)', assetClass: 'DEBT', selfAmount: 180000, spouseAmount: 120000, childrenAmount: 0, purposeGoal: 'Guaranteed Return Endowment' },
  { id: 'ast-debt-bonds', label: 'Sovereign / Corporate Bonds & Debentures', assetClass: 'DEBT', selfAmount: 200000, spouseAmount: 0, childrenAmount: 0, purposeGoal: 'Fixed Yield' },

  // Equity Assets
  { id: 'ast-eq-mf', label: 'Equity Mutual Funds (Flexi Cap, Large & Mid Cap)', assetClass: 'EQUITY', selfAmount: 1850000, spouseAmount: 1100000, childrenAmount: 250000, purposeGoal: "Children Education & Long-term Growth" },
  { id: 'ast-eq-direct', label: 'Direct Stocks & Demat Holdings', assetClass: 'EQUITY', selfAmount: 650000, spouseAmount: 250000, childrenAmount: 0, purposeGoal: 'Long-term Wealth Creation' },
  { id: 'ast-eq-nps', label: 'NPS (Equity Portion - Tier I)', assetClass: 'EQUITY', selfAmount: 420000, spouseAmount: 210000, childrenAmount: 0, purposeGoal: 'Retirement Wealth Compounding' },
  { id: 'ast-eq-pms', label: 'PMS / AIF Holdings', assetClass: 'EQUITY', selfAmount: 0, spouseAmount: 0, childrenAmount: 0, purposeGoal: 'Alternative Equity Growth' },
  { id: 'ast-eq-ulip', label: 'Unit-Linked Insurance Plans (ULIP Surrender Value)', assetClass: 'EQUITY', selfAmount: 250000, spouseAmount: 0, childrenAmount: 0, purposeGoal: 'Market-linked Endowment' },

  // Gold Assets
  { id: 'ast-gold-mf', label: 'Gold ETFs & Mutual Funds', assetClass: 'GOLD', selfAmount: 180000, spouseAmount: 120000, childrenAmount: 0, purposeGoal: 'Inflation & Currency Hedge' },
  { id: 'ast-gold-sgb', label: 'Sovereign Gold Bonds (SGBs)', assetClass: 'GOLD', selfAmount: 350000, spouseAmount: 250000, childrenAmount: 0, purposeGoal: 'Sovereign Guaranteed Gold' },
  { id: 'ast-gold-bars', label: 'Physical Gold Bars & Bullion Coins', assetClass: 'GOLD', selfAmount: 100000, spouseAmount: 150000, childrenAmount: 0, purposeGoal: 'Physical Gold Reserve' },

  // Real Estate Assets (Investments)
  { id: 'ast-re-apt', label: 'Apartment / House Held for Rental Investment', assetClass: 'REAL_ESTATE', selfAmount: 4500000, spouseAmount: 0, childrenAmount: 0, purposeGoal: 'Rental Cash Flow & Capital Appreciation' },
  { id: 'ast-re-land', label: 'Plot / Land / Commercial Space', assetClass: 'REAL_ESTATE', selfAmount: 2500000, spouseAmount: 0, childrenAmount: 0, purposeGoal: 'Long-term Real Asset Growth' },
  { id: 'ast-re-reit', label: 'Real Estate Investment Trusts (REITs)', assetClass: 'REAL_ESTATE', selfAmount: 150000, spouseAmount: 50000, childrenAmount: 0, purposeGoal: 'Liquid Commercial Real Estate' },

  // Personal Assets (Notional / Consumption)
  { id: 'ast-pers-home', label: 'Primary Self-Occupied Residence', assetClass: 'PERSONAL', selfAmount: 6500000, spouseAmount: 2500000, childrenAmount: 0, purposeGoal: 'Family Shelter & Security' },
  { id: 'ast-pers-car', label: 'Personal Vehicles (Car & Two-Wheelers)', assetClass: 'PERSONAL', selfAmount: 750000, spouseAmount: 150000, childrenAmount: 0, purposeGoal: 'Family Utility & Mobility' },
  { id: 'ast-pers-jewel', label: 'Personal Jewellery & Heirloom Ornaments', assetClass: 'PERSONAL', selfAmount: 200000, spouseAmount: 1200000, childrenAmount: 300000, purposeGoal: 'Family Cultural & Personal Ornaments' },
];

export const DEFAULT_LIABILITY_ITEMS: LiabilityLineItem[] = [
  { id: 'lia-home', label: 'Primary Home Loan (Outstanding Principal)', type: 'HOME_LOAN', selfAmount: 3200000, spouseAmount: 800000, childrenAmount: 0, purposeGoal: 'Primary Home Purchase' },
  { id: 'lia-car', label: 'Vehicle Loan (Outstanding Principal)', type: 'VEHICLE_LOAN', selfAmount: 420000, spouseAmount: 0, childrenAmount: 0, purposeGoal: 'Family Car Loan' },
  { id: 'lia-pers', label: 'Personal Loan Outstanding', type: 'PERSONAL_LOAN', selfAmount: 0, spouseAmount: 0, childrenAmount: 0, purposeGoal: 'Emergency Expense' },
  { id: 'lia-edu', label: 'Higher Education Loan Outstanding', type: 'EDUCATION_LOAN', selfAmount: 0, spouseAmount: 0, childrenAmount: 0, purposeGoal: 'Degree Financing' },
  { id: 'lia-other', label: 'Other Loans (Gold Loan, Loan Against Property)', type: 'OTHER_LOAN', selfAmount: 0, spouseAmount: 0, childrenAmount: 0, purposeGoal: 'Secured Borrowing' },
  { id: 'lia-cc', label: 'Credit Card Outstanding Balance (Billing Cycle)', type: 'CREDIT_CARD', selfAmount: 45000, spouseAmount: 25000, childrenAmount: 0, purposeGoal: 'Monthly Rolling Purchases' },
];
