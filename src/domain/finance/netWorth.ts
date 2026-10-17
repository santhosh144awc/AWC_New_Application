/**
 * Net Worth and Balance Sheet Aggregation Engine
 *
 * Implements pure financial asset and liability consolidation grounded in the
 * REAL Financial Statement specification. Computes total net worth, productive
 * liquid net worth, and debt-to-asset solvency metrics without subjective advice or scoring.
 */

import { assertFinite, assertPositiveOrZero } from './errors';

export type AssetCategory = 'LIQUID' | 'FINANCIAL' | 'PHYSICAL';
export type LiabilityCategory = 'SECURED' | 'UNSECURED';

export interface AssetItem {
  readonly name: string;
  readonly value: number;
  readonly category: AssetCategory;
}

export interface LiabilityItem {
  readonly name: string;
  readonly value: number;
  readonly category: LiabilityCategory;
}

export interface NetWorthCategoryTotals {
  /** Cash, savings bank accounts, emergency liquid funds */
  readonly liquidAssets?: number;
  /** Productive investments: equity mutual funds, direct stocks, EPF, PPF, NPS, bonds */
  readonly financialAssets?: number;
  /** Illiquid/use assets: primary residence, investment property, gold, jewellery */
  readonly physicalAssets?: number;
  /** Collateralized borrowings: home mortgage, auto loan, property loan */
  readonly securedLiabilities?: number;
  /** Uncollateralized borrowings: personal loans, credit card balances, education loans */
  readonly unsecuredLiabilities?: number;
}

export interface NetWorthInputs {
  /** Aggregated totals by category */
  readonly categories?: NetWorthCategoryTotals;
  /** Optional itemized assets list */
  readonly assets?: readonly AssetItem[];
  /** Optional itemized liabilities list */
  readonly liabilities?: readonly LiabilityItem[];
}

export interface NetWorthResult {
  /** Cash and cash-equivalent liquid holdings */
  readonly liquidAssets: number;
  /** Productive financial market investments and retirement holdings */
  readonly financialAssets: number;
  /** Real estate and physical commodities */
  readonly physicalAssets: number;
  /** Sum of all liquid, financial, and physical asset holdings */
  readonly totalAssets: number;
  /** Total collateralized debts */
  readonly securedLiabilities: number;
  /** Total non-collateralized debts */
  readonly unsecuredLiabilities: number;
  /** Sum of all secured and unsecured liabilities */
  readonly totalLiabilities: number;
  /** Net Worth = Total Assets - Total Liabilities */
  readonly totalNetWorth: number;
  /** Productive Liquid Net Worth = (Liquid + Financial Assets) - Total Liabilities */
  readonly productiveLiquidNetWorth: number;
  /** Debt to Asset Ratio = Total Liabilities / Total Assets (0 if Total Assets is 0) */
  readonly debtToAssetRatio: number;
}

/**
 * Calculates consolidated net worth, category subtotals, and solvency ratios.
 *
 * @param inputs - Category totals and/or itemized asset and liability records
 * @returns Consolidated net worth statement
 * @throws FinanceValidationError if any value is non-finite or negative
 */
export function calculateNetWorth(inputs: NetWorthInputs): NetWorthResult {
  let liquid = 0;
  let financial = 0;
  let physical = 0;
  let secured = 0;
  let unsecured = 0;

  // Process category inputs if provided
  if (inputs.categories) {
    const {
      liquidAssets = 0,
      financialAssets = 0,
      physicalAssets = 0,
      securedLiabilities = 0,
      unsecuredLiabilities = 0,
    } = inputs.categories;

    assertFinite(liquidAssets, 'categories.liquidAssets');
    assertPositiveOrZero(liquidAssets, 'categories.liquidAssets');
    liquid += liquidAssets;

    assertFinite(financialAssets, 'categories.financialAssets');
    assertPositiveOrZero(financialAssets, 'categories.financialAssets');
    financial += financialAssets;

    assertFinite(physicalAssets, 'categories.physicalAssets');
    assertPositiveOrZero(physicalAssets, 'categories.physicalAssets');
    physical += physicalAssets;

    assertFinite(securedLiabilities, 'categories.securedLiabilities');
    assertPositiveOrZero(securedLiabilities, 'categories.securedLiabilities');
    secured += securedLiabilities;

    assertFinite(unsecuredLiabilities, 'categories.unsecuredLiabilities');
    assertPositiveOrZero(unsecuredLiabilities, 'categories.unsecuredLiabilities');
    unsecured += unsecuredLiabilities;
  }

  // Process itemized assets
  if (inputs.assets) {
    for (let i = 0; i < inputs.assets.length; i++) {
      const item = inputs.assets[i];
      assertFinite(item.value, `assets[${i}].value`);
      assertPositiveOrZero(item.value, `assets[${i}].value`);

      if (item.category === 'LIQUID') {
        liquid += item.value;
      } else if (item.category === 'FINANCIAL') {
        financial += item.value;
      } else if (item.category === 'PHYSICAL') {
        physical += item.value;
      }
    }
  }

  // Process itemized liabilities
  if (inputs.liabilities) {
    for (let i = 0; i < inputs.liabilities.length; i++) {
      const item = inputs.liabilities[i];
      assertFinite(item.value, `liabilities[${i}].value`);
      assertPositiveOrZero(item.value, `liabilities[${i}].value`);

      if (item.category === 'SECURED') {
        secured += item.value;
      } else if (item.category === 'UNSECURED') {
        unsecured += item.value;
      }
    }
  }

  const totalAssets = liquid + financial + physical;
  const totalLiabilities = secured + unsecured;
  const totalNetWorth = totalAssets - totalLiabilities;
  const productiveLiquidNetWorth = liquid + financial - totalLiabilities;
  const debtToAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;

  return {
    liquidAssets: liquid,
    financialAssets: financial,
    physicalAssets: physical,
    totalAssets,
    securedLiabilities: secured,
    unsecuredLiabilities: unsecured,
    totalLiabilities,
    totalNetWorth,
    productiveLiquidNetWorth,
    debtToAssetRatio,
  };
}
