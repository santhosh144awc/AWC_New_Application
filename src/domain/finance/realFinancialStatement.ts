/**
 * REAL Financial Statement & Balance Sheet Domain Engine
 *
 * Implements pure financial calculations for:
 * 1. Monthly Household Cash Flow (Take-home income, essential vs discretionary outflows, surplus/deficit, savings rate)
 * 2. Liquid & Safety Assets (Explicit accessibility classification, emergency runway in months)
 * 3. Growth Capital & Property (Productive assets vs personal consumption assets)
 * 4. Liabilities & Consolidated Solvency (Accounting Net Worth vs Productive-Asset-Adjusted Net Worth, Debt-to-Asset ratio)
 *
 * ARCHITECTURAL CONTRACT:
 * - 100% Pure TypeScript. No React, DOM, browser storage, or network imports.
 * - In-memory calculation model only.
 * - Prevents double counting by establishing canonical models.
 * - Handles zero-denominator edge cases gracefully with null (rendered as "Not available").
 */

import { assertFinite, assertPositiveOrZero, FinanceValidationError } from './errors';

export type IncomeCategory =
  | 'SALARY'
  | 'BUSINESS_PROFESSIONAL'
  | 'RENTAL'
  | 'PENSION'
  | 'OTHER_INCOME';

export interface IncomeItem {
  readonly id: string;
  readonly label: string;
  readonly monthlyAmount: number;
  readonly category: IncomeCategory;
}

export type OutflowCategory =
  | 'ESSENTIAL_LIVING'
  | 'HOUSING_UTILITIES'
  | 'EDUCATION_DEPENDENTS'
  | 'INSURANCE'
  | 'LOAN_EMI'
  | 'TRANSPORT_HEALTHCARE'
  | 'DISCRETIONARY_LIFESTYLE'
  | 'OTHER_OUTFLOWS';

export interface OutflowItem {
  readonly id: string;
  readonly label: string;
  readonly monthlyAmount: number;
  readonly category: OutflowCategory;
  readonly isEssential: boolean;
}

export type AssetGroup =
  | 'CASH_RESERVES'
  | 'FINANCIAL_INVESTMENT'
  | 'RETIREMENT_RESTRICTED'
  | 'PERSONAL_PHYSICAL'
  | 'PRODUCTIVE_PROPERTY';

export type AssetPurpose = 'PRODUCTIVE' | 'PERSONAL_USE';

export interface StatementAssetItem {
  readonly id: string;
  readonly label: string;
  readonly estimatedValue: number;
  readonly group: AssetGroup;
  /**
   * Explicit user selection: can this holding be drawn immediately for an emergency
   * without regulatory lock-in, severe penal deduction, or sale of essential utility property?
   */
  readonly isAccessibleSafetyReserve: boolean;
  /**
   * Purpose classification:
   * - PRODUCTIVE: Financial market investments, deposits, rental/commercial property.
   * - PERSONAL_USE: Self-occupied home, personal car/two-wheeler, family jewellery.
   */
  readonly purpose: AssetPurpose;
  readonly notes?: string;
}

export type StatementLiabilityCategory = 'SECURED' | 'UNSECURED';

export interface StatementLiabilityItem {
  readonly id: string;
  readonly label: string;
  readonly outstandingBalance: number;
  readonly category: StatementLiabilityCategory;
  /** Optional informational monthly EMI for cash flow cross-reference */
  readonly monthlyEmi?: number;
}

export interface CashFlowInputs {
  readonly incomes: readonly IncomeItem[];
  readonly outflows: readonly OutflowItem[];
}

export interface CashFlowResult {
  readonly totalMonthlyTakeHomeIncome: number;
  readonly totalMonthlyOutflows: number;
  readonly essentialMonthlyOutflows: number;
  readonly discretionaryMonthlyOutflows: number;
  /** Monthly surplus or deficit (can be negative; never clamped to 0) */
  readonly monthlySurplus: number;
  /** Savings rate as a decimal (e.g. 0.25 = 25%). null if totalMonthlyTakeHomeIncome <= 0 */
  readonly savingsRate: number | null;
}

export interface AssetConsolidationResult {
  readonly totalAssets: number;
  readonly cashReservesTotal: number;
  readonly financialInvestmentsTotal: number;
  readonly retirementRestrictedTotal: number;
  readonly personalPhysicalTotal: number;
  readonly productivePropertyTotal: number;
  /** Only holdings explicitly confirmed as accessible for family emergencies */
  readonly accessibleSafetyReserves: number;
  /** Productive / income-generating / compoundable assets */
  readonly productiveAssets: number;
  /** Personal lifestyle consumption assets (primary home, personal vehicle, jewellery) */
  readonly personalConsumptionAssets: number;
  /** Emergency runway in months. null if essentialMonthlyOutflows <= 0 */
  readonly emergencyRunwayMonths: number | null;
}

export interface LiabilityConsolidationResult {
  readonly totalLiabilities: number;
  readonly securedLiabilitiesTotal: number;
  readonly unsecuredLiabilitiesTotal: number;
}

export interface RealFinancialStatementInputs {
  readonly incomes: readonly IncomeItem[];
  readonly outflows: readonly OutflowItem[];
  readonly assets: readonly StatementAssetItem[];
  readonly liabilities: readonly StatementLiabilityItem[];
}

export interface RealFinancialStatementResult {
  readonly cashFlow: CashFlowResult;
  readonly assetConsolidation: AssetConsolidationResult;
  readonly liabilityConsolidation: LiabilityConsolidationResult;
  /** Standard accounting identity: Total Assets - Total Liabilities */
  readonly accountingNetWorth: number;
  /**
   * Supplementary measure: Productive Assets - Total Liabilities.
   * (Total Assets - Personal Consumption Assets) - Total Liabilities.
   */
  readonly productiveAssetAdjustedNetWorth: number;
  /** Debt to Asset Ratio = Total Liabilities / Total Assets. null if Total Assets === 0 */
  readonly debtToAssetRatio: number | null;
}

// Upper boundary for retail safety validation: 1 Lakh Crore (₹1,00,00,00,00,000)
const MAX_REALISTIC_AMOUNT = 1_000_000_000_000;

/**
 * Validates a currency amount for financial statements.
 */
function validateStatementAmount(value: number, contextName: string): void {
  assertFinite(value, contextName);
  assertPositiveOrZero(value, contextName);
  if (value > MAX_REALISTIC_AMOUNT) {
    throw new FinanceValidationError(
      contextName,
      value,
      `Value exceeds maximum realistic household threshold of ₹${MAX_REALISTIC_AMOUNT.toLocaleString('en-IN')}`
    );
  }
}

/**
 * Calculates monthly household cash flow metrics.
 */
export function calculateCashFlow(inputs: CashFlowInputs): CashFlowResult {
  let totalIncome = 0;
  for (let i = 0; i < inputs.incomes.length; i++) {
    const item = inputs.incomes[i];
    validateStatementAmount(item.monthlyAmount, `incomes[${i}].monthlyAmount`);
    totalIncome += item.monthlyAmount;
  }

  let totalOutflow = 0;
  let essentialOutflow = 0;
  let discretionaryOutflow = 0;

  for (let i = 0; i < inputs.outflows.length; i++) {
    const item = inputs.outflows[i];
    validateStatementAmount(item.monthlyAmount, `outflows[${i}].monthlyAmount`);
    totalOutflow += item.monthlyAmount;
    if (item.isEssential) {
      essentialOutflow += item.monthlyAmount;
    } else {
      discretionaryOutflow += item.monthlyAmount;
    }
  }

  const monthlySurplus = totalIncome - totalOutflow;
  const savingsRate = totalIncome > 0 ? monthlySurplus / totalIncome : null;

  return {
    totalMonthlyTakeHomeIncome: totalIncome,
    totalMonthlyOutflows: totalOutflow,
    essentialMonthlyOutflows: essentialOutflow,
    discretionaryMonthlyOutflows: discretionaryOutflow,
    monthlySurplus,
    savingsRate,
  };
}

/**
 * Consolidates household assets and computes emergency runway.
 */
export function calculateAssetConsolidation(
  assets: readonly StatementAssetItem[],
  essentialMonthlyOutflows: number = 0
): AssetConsolidationResult {
  assertFinite(essentialMonthlyOutflows, 'essentialMonthlyOutflows');
  assertPositiveOrZero(essentialMonthlyOutflows, 'essentialMonthlyOutflows');

  let cashReserves = 0;
  let financialInvestments = 0;
  let retirementRestricted = 0;
  let personalPhysical = 0;
  let productiveProperty = 0;

  let accessibleReserves = 0;
  let productiveAssets = 0;
  let personalConsumptionAssets = 0;

  for (let i = 0; i < assets.length; i++) {
    const item = assets[i];
    validateStatementAmount(item.estimatedValue, `assets[${i}].estimatedValue`);

    // Strict classification validation:
    // Restricted retirement assets (EPF/PPF/NPS), personal physical assets, and productive property cannot be emergency reserves.
    if (
      item.isAccessibleSafetyReserve &&
      (item.group === 'RETIREMENT_RESTRICTED' || item.group === 'PERSONAL_PHYSICAL' || item.group === 'PRODUCTIVE_PROPERTY')
    ) {
      throw new FinanceValidationError(
        `assets[${i}].isAccessibleSafetyReserve`,
        item.isAccessibleSafetyReserve,
        `Restricted retirement assets, personal-use physical property, and real estate / productive property cannot be classified as immediate emergency safety reserves.`
      );
    }

    // Strict asset group to purpose classification invariant:
    // - PERSONAL_PHYSICAL -> PERSONAL_USE
    // - CASH_RESERVES, FINANCIAL_INVESTMENT, RETIREMENT_RESTRICTED, PRODUCTIVE_PROPERTY -> PRODUCTIVE
    if (item.group === 'PERSONAL_PHYSICAL') {
      if (item.purpose !== 'PERSONAL_USE') {
        throw new FinanceValidationError(
          `assets[${i}].purpose`,
          item.purpose,
          `Personal physical assets (primary residence, personal vehicles, jewellery) must be classified as PERSONAL_USE purpose.`
        );
      }
    } else {
      if (item.purpose !== 'PRODUCTIVE') {
        throw new FinanceValidationError(
          `assets[${i}].purpose`,
          item.purpose,
          `Asset group ${item.group} must be classified as PRODUCTIVE purpose.`
        );
      }
    }

    // Accumulate by group
    switch (item.group) {
      case 'CASH_RESERVES':
        cashReserves += item.estimatedValue;
        break;
      case 'FINANCIAL_INVESTMENT':
        financialInvestments += item.estimatedValue;
        break;
      case 'RETIREMENT_RESTRICTED':
        retirementRestricted += item.estimatedValue;
        break;
      case 'PERSONAL_PHYSICAL':
        personalPhysical += item.estimatedValue;
        break;
      case 'PRODUCTIVE_PROPERTY':
        productiveProperty += item.estimatedValue;
        break;
    }

    // Accumulate accessible reserves
    if (item.isAccessibleSafetyReserve) {
      accessibleReserves += item.estimatedValue;
    }

    // Accumulate by purpose
    if (item.purpose === 'PRODUCTIVE') {
      productiveAssets += item.estimatedValue;
    } else {
      personalConsumptionAssets += item.estimatedValue;
    }
  }

  const totalAssets =
    cashReserves +
    financialInvestments +
    retirementRestricted +
    personalPhysical +
    productiveProperty;

  // Emergency runway in months
  const emergencyRunwayMonths =
    essentialMonthlyOutflows > 0
      ? accessibleReserves / essentialMonthlyOutflows
      : null;

  return {
    totalAssets,
    cashReservesTotal: cashReserves,
    financialInvestmentsTotal: financialInvestments,
    retirementRestrictedTotal: retirementRestricted,
    personalPhysicalTotal: personalPhysical,
    productivePropertyTotal: productiveProperty,
    accessibleSafetyReserves: accessibleReserves,
    productiveAssets,
    personalConsumptionAssets,
    emergencyRunwayMonths,
  };
}

/**
 * Consolidates household liabilities.
 */
export function calculateLiabilityConsolidation(
  liabilities: readonly StatementLiabilityItem[]
): LiabilityConsolidationResult {
  let secured = 0;
  let unsecured = 0;

  for (let i = 0; i < liabilities.length; i++) {
    const item = liabilities[i];
    validateStatementAmount(item.outstandingBalance, `liabilities[${i}].outstandingBalance`);
    if (item.monthlyEmi !== undefined) {
      validateStatementAmount(item.monthlyEmi, `liabilities[${i}].monthlyEmi`);
    }

    if (item.category === 'SECURED') {
      secured += item.outstandingBalance;
    } else {
      unsecured += item.outstandingBalance;
    }
  }

  return {
    totalLiabilities: secured + unsecured,
    securedLiabilitiesTotal: secured,
    unsecuredLiabilitiesTotal: unsecured,
  };
}

/**
 * Calculates the comprehensive REAL Financial Statement.
 *
 * Implements the 4-stage balance sheet aggregation:
 * 1. Cash flow (surplus/deficit, savings rate)
 * 2. Liquid & safety assets (accessible reserves, emergency runway)
 * 3. Growth capital & property (productive assets vs personal consumption assets)
 * 4. Liabilities & true net worth review (Accounting Net Worth, Productive Net Worth, Debt-to-Asset ratio)
 */
export function calculateRealFinancialStatement(
  inputs: RealFinancialStatementInputs
): RealFinancialStatementResult {
  const cashFlow = calculateCashFlow({
    incomes: inputs.incomes,
    outflows: inputs.outflows,
  });

  const assetConsolidation = calculateAssetConsolidation(
    inputs.assets,
    cashFlow.essentialMonthlyOutflows
  );

  const liabilityConsolidation = calculateLiabilityConsolidation(inputs.liabilities);

  const totalAssets = assetConsolidation.totalAssets;
  const totalLiabilities = liabilityConsolidation.totalLiabilities;

  const accountingNetWorth = totalAssets - totalLiabilities;
  const productiveAssetAdjustedNetWorth =
    assetConsolidation.productiveAssets - totalLiabilities;

  const debtToAssetRatio =
    totalAssets > 0 ? totalLiabilities / totalAssets : null;

  return {
    cashFlow,
    assetConsolidation,
    liabilityConsolidation,
    accountingNetWorth,
    productiveAssetAdjustedNetWorth,
    debtToAssetRatio,
  };
}

export interface QuickNetWorthCategoryInputs {
  readonly liquidAssets?: number;
  readonly financialAssets?: number;
  readonly physicalAssets?: number;
  readonly securedLiabilities?: number;
  readonly unsecuredLiabilities?: number;
}

export interface QuickNetWorthInputs {
  /** High-level category totals */
  readonly categories?: QuickNetWorthCategoryInputs;
  /** Itemized asset list */
  readonly assets?: readonly StatementAssetItem[];
  /** Itemized liability list */
  readonly liabilities?: readonly StatementLiabilityItem[];
}

export interface QuickNetWorthResult {
  readonly liquidAssets: number;
  readonly financialAssets: number;
  readonly physicalAssets: number;
  readonly totalAssets: number;
  readonly securedLiabilities: number;
  readonly unsecuredLiabilities: number;
  readonly totalLiabilities: number;
  readonly accountingNetWorth: number;
  /** Debt to Asset Ratio. null if Total Assets === 0 */
  readonly debtToAssetRatio: number | null;
}

/**
 * Calculates quick household net worth with strict double-counting prevention.
 */
export function calculateQuickNetWorth(inputs: QuickNetWorthInputs): QuickNetWorthResult {
  const hasCategories = Boolean(
    inputs.categories &&
    (inputs.categories.liquidAssets !== undefined ||
      inputs.categories.financialAssets !== undefined ||
      inputs.categories.physicalAssets !== undefined ||
      inputs.categories.securedLiabilities !== undefined ||
      inputs.categories.unsecuredLiabilities !== undefined)
  );
  const hasItemized = Boolean(
    (inputs.assets && inputs.assets.length > 0) ||
    (inputs.liabilities && inputs.liabilities.length > 0)
  );

  if (hasCategories && hasItemized) {
    throw new FinanceValidationError(
      'inputs',
      inputs,
      'Cannot provide both category totals and itemized assets/liabilities simultaneously; specify either category totals or itemized records to prevent double counting.'
    );
  }

  let liquid = 0;
  let financial = 0;
  let physical = 0;
  let secured = 0;
  let unsecured = 0;

  if (inputs.categories) {
    const {
      liquidAssets = 0,
      financialAssets = 0,
      physicalAssets = 0,
      securedLiabilities = 0,
      unsecuredLiabilities = 0,
    } = inputs.categories;

    validateStatementAmount(liquidAssets, 'categories.liquidAssets');
    validateStatementAmount(financialAssets, 'categories.financialAssets');
    validateStatementAmount(physicalAssets, 'categories.physicalAssets');
    validateStatementAmount(securedLiabilities, 'categories.securedLiabilities');
    validateStatementAmount(unsecuredLiabilities, 'categories.unsecuredLiabilities');

    liquid = liquidAssets;
    financial = financialAssets;
    physical = physicalAssets;
    secured = securedLiabilities;
    unsecured = unsecuredLiabilities;
  } else if (inputs.assets || inputs.liabilities) {
    if (inputs.assets) {
      for (let i = 0; i < inputs.assets.length; i++) {
        const item = inputs.assets[i];
        validateStatementAmount(item.estimatedValue, `assets[${i}].estimatedValue`);
        if (item.group === 'CASH_RESERVES') {
          liquid += item.estimatedValue;
        } else if (
          item.group === 'FINANCIAL_INVESTMENT' ||
          item.group === 'RETIREMENT_RESTRICTED'
        ) {
          financial += item.estimatedValue;
        } else {
          physical += item.estimatedValue;
        }
      }
    }

    if (inputs.liabilities) {
      for (let i = 0; i < inputs.liabilities.length; i++) {
        const item = inputs.liabilities[i];
        validateStatementAmount(item.outstandingBalance, `liabilities[${i}].outstandingBalance`);
        if (item.category === 'SECURED') {
          secured += item.outstandingBalance;
        } else {
          unsecured += item.outstandingBalance;
        }
      }
    }
  }

  const totalAssets = liquid + financial + physical;
  const totalLiabilities = secured + unsecured;
  const accountingNetWorth = totalAssets - totalLiabilities;
  const debtToAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets : null;

  return {
    liquidAssets: liquid,
    financialAssets: financial,
    physicalAssets: physical,
    totalAssets,
    securedLiabilities: secured,
    unsecuredLiabilities: unsecured,
    totalLiabilities,
    accountingNetWorth,
    debtToAssetRatio,
  };
}

export interface CanonicalUrbanFamilySample {
  readonly incomes: readonly IncomeItem[];
  readonly outflows: readonly OutflowItem[];
  readonly assets: readonly StatementAssetItem[];
  readonly liabilities: readonly StatementLiabilityItem[];
}

/**
 * Authoritative Canonical Illustrative Household Dataset (Reference: VEC-REAL-01)
 *
 * Models a standard dual-income urban household with home mortgage, car loan,
 * liquid emergency reserves, equity mutual funds, EPF/PPF retirement holdings,
 * primary self-occupied residence, vehicle, and family jewellery.
 *
 * Metrics produced by this dataset match VEC-REAL-01 exactly:
 * - Total Monthly Income: ₹2,25,000
 * - Total Monthly Outflows: ₹1,60,000 (Essential: ₹1,25,000, Discretionary: ₹35,000)
 * - Monthly Surplus: ₹65,000 (Savings Rate: 28.89%)
 * - Total Assets: ₹1,29,50,000
 * - Accessible Safety Reserves: ₹7,50,000 (Runway: 6.00 months)
 * - Productive Assets: ₹34,50,000
 * - Personal Consumption Assets: ₹95,00,000
 * - Total Liabilities: ₹45,00,000
 * - Accounting Net Worth: ₹84,50,000
 * - Productive-Asset-Adjusted Net Worth: -₹10,50,000
 * - Debt-to-Asset Ratio: ~0.34749 (34.75%)
 */
export const CANONICAL_URBAN_FAMILY_SAMPLE: CanonicalUrbanFamilySample = {
  incomes: [
    { id: 'inc-1', label: 'Primary Salary (Take-home)', monthlyAmount: 150000, category: 'SALARY' },
    { id: 'inc-2', label: 'Spouse / Secondary Income', monthlyAmount: 75000, category: 'SALARY' },
  ],
  outflows: [
    { id: 'out-1', label: 'Groceries, Utilities & Household', monthlyAmount: 40000, category: 'ESSENTIAL_LIVING', isEssential: true },
    { id: 'out-2', label: 'Children Education & Childcare', monthlyAmount: 25000, category: 'EDUCATION_DEPENDENTS', isEssential: true },
    { id: 'out-3', label: 'Term & Health Insurance Premiums', monthlyAmount: 10000, category: 'INSURANCE', isEssential: true },
    { id: 'out-4', label: 'Home Loan / Property EMI', monthlyAmount: 50000, category: 'LOAN_EMI', isEssential: true },
    { id: 'out-5', label: 'Dining, Outings & Entertainment', monthlyAmount: 20000, category: 'DISCRETIONARY_LIFESTYLE', isEssential: false },
    { id: 'out-6', label: 'Annual Vacation & Festivals Reserve', monthlyAmount: 15000, category: 'DISCRETIONARY_LIFESTYLE', isEssential: false },
  ],
  assets: [
    { id: 'ast-1', label: 'Savings Bank Account Balances', estimatedValue: 250000, group: 'CASH_RESERVES', isAccessibleSafetyReserve: true, purpose: 'PRODUCTIVE' },
    { id: 'ast-2', label: 'Liquid Mutual Funds (Emergency Fund)', estimatedValue: 500000, group: 'CASH_RESERVES', isAccessibleSafetyReserve: true, purpose: 'PRODUCTIVE' },
    { id: 'ast-3', label: 'Equity Mutual Funds & Direct Shares', estimatedValue: 1500000, group: 'FINANCIAL_INVESTMENT', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
    { id: 'ast-4', label: 'EPF, PPF & NPS Retirement Debt', estimatedValue: 1200000, group: 'RETIREMENT_RESTRICTED', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
    { id: 'ast-5', label: 'Primary Residence (Self-Occupied Home)', estimatedValue: 8500000, group: 'PERSONAL_PHYSICAL', isAccessibleSafetyReserve: false, purpose: 'PERSONAL_USE' },
    { id: 'ast-6', label: 'Family Car & Two-Wheeler', estimatedValue: 600000, group: 'PERSONAL_PHYSICAL', isAccessibleSafetyReserve: false, purpose: 'PERSONAL_USE' },
    { id: 'ast-7', label: 'Family Jewellery', estimatedValue: 400000, group: 'PERSONAL_PHYSICAL', isAccessibleSafetyReserve: false, purpose: 'PERSONAL_USE' },
  ],
  liabilities: [
    { id: 'lia-1', label: 'Outstanding Home Loan Principal', outstandingBalance: 4200000, category: 'SECURED', monthlyEmi: 50000 },
    { id: 'lia-2', label: 'Vehicle Loan Outstanding Principal', outstandingBalance: 250000, category: 'SECURED', monthlyEmi: 12000 },
    { id: 'lia-3', label: 'Credit Card Outstanding Balance', outstandingBalance: 50000, category: 'UNSECURED', monthlyEmi: 5000 },
  ],
};

