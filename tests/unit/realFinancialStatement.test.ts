import { describe, it, expect } from 'vitest';
import {
  calculateCashFlow,
  calculateAssetConsolidation,
  calculateRealFinancialStatement,
  calculateQuickNetWorth,
  calculateNetWorth,
  CANONICAL_URBAN_FAMILY_SAMPLE,
  FinanceValidationError,
  type IncomeItem,
  type OutflowItem,
  type StatementAssetItem,
  type StatementLiabilityItem,
} from '../../src/domain/finance';

describe('REAL Financial Statement Domain Engine', () => {
  describe('Authoritative Reference Vectors (REAL_FINANCIAL_STATEMENT_TEST_VECTORS.csv)', () => {
    it('VEC-REAL-01: Standard salaried urban family with home mortgage and consumption assets', () => {
      const incomes: IncomeItem[] = [
        { id: 'inc-1', label: 'Primary Salary', monthlyAmount: 150000, category: 'SALARY' },
        { id: 'inc-2', label: 'Spouse Salary', monthlyAmount: 75000, category: 'SALARY' },
      ];

      const outflows: OutflowItem[] = [
        { id: 'out-1', label: 'Groceries & Utilities', monthlyAmount: 40000, category: 'ESSENTIAL_LIVING', isEssential: true },
        { id: 'out-2', label: 'School Fees', monthlyAmount: 25000, category: 'EDUCATION_DEPENDENTS', isEssential: true },
        { id: 'out-3', label: 'Term & Health Insurance', monthlyAmount: 10000, category: 'INSURANCE', isEssential: true },
        { id: 'out-4', label: 'Home Loan EMI', monthlyAmount: 50000, category: 'LOAN_EMI', isEssential: true },
        { id: 'out-5', label: 'Dining & Entertainment', monthlyAmount: 20000, category: 'DISCRETIONARY_LIFESTYLE', isEssential: false },
        { id: 'out-6', label: 'Vacation Reserve', monthlyAmount: 15000, category: 'DISCRETIONARY_LIFESTYLE', isEssential: false },
      ];

      const assets: StatementAssetItem[] = [
        { id: 'ast-1', label: 'Savings Bank Account', estimatedValue: 250000, group: 'CASH_RESERVES', isAccessibleSafetyReserve: true, purpose: 'PRODUCTIVE' },
        { id: 'ast-2', label: 'Emergency Liquid Fund', estimatedValue: 500000, group: 'CASH_RESERVES', isAccessibleSafetyReserve: true, purpose: 'PRODUCTIVE' },
        { id: 'ast-3', label: 'Equity Mutual Funds', estimatedValue: 1500000, group: 'FINANCIAL_INVESTMENT', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
        { id: 'ast-4', label: 'EPF + PPF Balance', estimatedValue: 1200000, group: 'RETIREMENT_RESTRICTED', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
        { id: 'ast-5', label: 'Primary Residence', estimatedValue: 8500000, group: 'PERSONAL_PHYSICAL', isAccessibleSafetyReserve: false, purpose: 'PERSONAL_USE' },
        { id: 'ast-6', label: 'Family Car', estimatedValue: 600000, group: 'PERSONAL_PHYSICAL', isAccessibleSafetyReserve: false, purpose: 'PERSONAL_USE' },
        { id: 'ast-7', label: 'Family Jewellery', estimatedValue: 400000, group: 'PERSONAL_PHYSICAL', isAccessibleSafetyReserve: false, purpose: 'PERSONAL_USE' },
      ];

      const liabilities: StatementLiabilityItem[] = [
        { id: 'lia-1', label: 'Home Loan Balance', outstandingBalance: 4200000, category: 'SECURED', monthlyEmi: 50000 },
        { id: 'lia-2', label: 'Car Loan Balance', outstandingBalance: 250000, category: 'SECURED' },
        { id: 'lia-3', label: 'Credit Card Outstanding', outstandingBalance: 50000, category: 'UNSECURED' },
      ];

      const result = calculateRealFinancialStatement({ incomes, outflows, assets, liabilities });

      // Cash Flow Checks
      expect(result.cashFlow.totalMonthlyTakeHomeIncome).toBe(225000);
      expect(result.cashFlow.totalMonthlyOutflows).toBe(160000);
      expect(result.cashFlow.essentialMonthlyOutflows).toBe(125000);
      expect(result.cashFlow.discretionaryMonthlyOutflows).toBe(35000);
      expect(result.cashFlow.monthlySurplus).toBe(65000);
      expect(result.cashFlow.savingsRate).toBeCloseTo(65000 / 225000, 5); // ~28.89%

      // Asset & Emergency Runway Checks
      expect(result.assetConsolidation.totalAssets).toBe(12950000);
      expect(result.assetConsolidation.cashReservesTotal).toBe(750000);
      expect(result.assetConsolidation.financialInvestmentsTotal).toBe(1500000);
      expect(result.assetConsolidation.retirementRestrictedTotal).toBe(1200000);
      expect(result.assetConsolidation.personalPhysicalTotal).toBe(9500000);
      expect(result.assetConsolidation.accessibleSafetyReserves).toBe(750000);
      expect(result.assetConsolidation.productiveAssets).toBe(3450000);
      expect(result.assetConsolidation.personalConsumptionAssets).toBe(9500000);
      expect(result.assetConsolidation.emergencyRunwayMonths).toBeCloseTo(750000 / 125000, 5); // Exactly 6.0 months

      // Liabilities Checks
      expect(result.liabilityConsolidation.totalLiabilities).toBe(4500000);
      expect(result.liabilityConsolidation.securedLiabilitiesTotal).toBe(4450000);
      expect(result.liabilityConsolidation.unsecuredLiabilitiesTotal).toBe(50000);

      // Solvency & Net Worth Checks
      // Accounting Net Worth = 12,950,000 - 4,500,000 = 8,450,000
      expect(result.accountingNetWorth).toBe(8450000);

      // Productive-Asset-Adjusted Net Worth = 3,450,000 - 4,500,000 = -1,050,000 (Negative!)
      expect(result.productiveAssetAdjustedNetWorth).toBe(-1050000);

      // Debt to Asset Ratio = 4,500,000 / 12,950,000
      expect(result.debtToAssetRatio).toBeCloseTo(4500000 / 12950000, 5); // ~0.34749
    });

    it('Fix C: CANONICAL_URBAN_FAMILY_SAMPLE produces exact registered outputs of VEC-REAL-01', () => {
      const result = calculateRealFinancialStatement(CANONICAL_URBAN_FAMILY_SAMPLE);

      // Total Income = 225,000
      expect(result.cashFlow.totalMonthlyTakeHomeIncome).toBe(225000);
      // Total Outflows = 160,000 (Essential: 125,000, Discretionary: 35,000)
      expect(result.cashFlow.totalMonthlyOutflows).toBe(160000);
      expect(result.cashFlow.essentialMonthlyOutflows).toBe(125000);
      expect(result.cashFlow.discretionaryMonthlyOutflows).toBe(35000);
      // Monthly Surplus = 65,000
      expect(result.cashFlow.monthlySurplus).toBe(65000);
      // Savings Rate = 65000 / 225000 (~28.89%)
      expect(result.cashFlow.savingsRate).toBeCloseTo(65000 / 225000, 5);

      // Total Assets = 12,950,000 (Notice: No extra ₹3,00,000 FD)
      expect(result.assetConsolidation.totalAssets).toBe(12950000);
      // Accessible Safety Reserves = 750,000
      expect(result.assetConsolidation.accessibleSafetyReserves).toBe(750000);
      // Emergency Runway = 750,000 / 125,000 = Exactly 6.00 months
      expect(result.assetConsolidation.emergencyRunwayMonths).toBeCloseTo(6.0, 5);
      // Productive Assets = 3,450,000
      expect(result.assetConsolidation.productiveAssets).toBe(3450000);
      // Personal Consumption Assets = 9,500,000 (85L home + 6L car + 4L jewellery)
      expect(result.assetConsolidation.personalConsumptionAssets).toBe(9500000);

      // Total Liabilities = 4,500,000
      expect(result.liabilityConsolidation.totalLiabilities).toBe(4500000);
      // Accounting Net Worth = 12,950,000 - 4,500,000 = 8,450,000
      expect(result.accountingNetWorth).toBe(8450000);
      // Productive-Asset-Adjusted Net Worth = 3,450,000 - 4,500,000 = -1,050,000
      expect(result.productiveAssetAdjustedNetWorth).toBe(-1050000);
      // Debt to Asset Ratio = 4,500,000 / 12,950,000 (~0.34749)
      expect(result.debtToAssetRatio).toBeCloseTo(4500000 / 12950000, 5);
    });

    it('VEC-REAL-02: Zero-denominator edge cases (Zero income, zero essential outflow, zero total assets)', () => {
      const result = calculateRealFinancialStatement({
        incomes: [],
        outflows: [],
        assets: [],
        liabilities: [
          { id: 'lia-1', label: 'Unsecured Credit Line', outstandingBalance: 100000, category: 'UNSECURED' },
        ],
      });

      expect(result.cashFlow.totalMonthlyTakeHomeIncome).toBe(0);
      expect(result.cashFlow.totalMonthlyOutflows).toBe(0);
      expect(result.cashFlow.essentialMonthlyOutflows).toBe(0);
      expect(result.cashFlow.discretionaryMonthlyOutflows).toBe(0);
      expect(result.cashFlow.monthlySurplus).toBe(0);
      expect(result.cashFlow.savingsRate).toBeNull(); // Zero income -> null

      expect(result.assetConsolidation.totalAssets).toBe(0);
      expect(result.assetConsolidation.accessibleSafetyReserves).toBe(0);
      expect(result.assetConsolidation.emergencyRunwayMonths).toBeNull(); // Zero essential outflows -> null

      expect(result.liabilityConsolidation.totalLiabilities).toBe(100000);
      expect(result.accountingNetWorth).toBe(-100000);
      expect(result.productiveAssetAdjustedNetWorth).toBe(-100000);
      expect(result.debtToAssetRatio).toBeNull(); // Zero total assets -> null
    });

    it('VEC-REAL-03: High surplus family with commercial rental property and debt-free status', () => {
      const result = calculateRealFinancialStatement({
        incomes: [
          { id: 'inc-1', label: 'Consulting Practice', monthlyAmount: 300000, category: 'BUSINESS_PROFESSIONAL' },
          { id: 'inc-2', label: 'Rental Income', monthlyAmount: 50000, category: 'RENTAL' },
        ],
        outflows: [
          { id: 'out-1', label: 'Essential Living', monthlyAmount: 70000, category: 'ESSENTIAL_LIVING', isEssential: true },
          { id: 'out-2', label: 'Discretionary Lifestyle', monthlyAmount: 30000, category: 'DISCRETIONARY_LIFESTYLE', isEssential: false },
        ],
        assets: [
          { id: 'ast-1', label: 'Current & Savings Account', estimatedValue: 1000000, group: 'CASH_RESERVES', isAccessibleSafetyReserve: true, purpose: 'PRODUCTIVE' },
          { id: 'ast-2', label: 'Fixed Deposits', estimatedValue: 1500000, group: 'FINANCIAL_INVESTMENT', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
          { id: 'ast-3', label: 'Direct Stocks & Funds', estimatedValue: 5000000, group: 'FINANCIAL_INVESTMENT', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
          { id: 'ast-4', label: 'Commercial Shop (Rental)', estimatedValue: 4000000, group: 'PRODUCTIVE_PROPERTY', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
          { id: 'ast-5', label: 'Primary Residence', estimatedValue: 6000000, group: 'PERSONAL_PHYSICAL', isAccessibleSafetyReserve: false, purpose: 'PERSONAL_USE' },
        ],
        liabilities: [],
      });

      expect(result.cashFlow.totalMonthlyTakeHomeIncome).toBe(350000);
      expect(result.cashFlow.totalMonthlyOutflows).toBe(100000);
      expect(result.cashFlow.monthlySurplus).toBe(250000);
      expect(result.cashFlow.savingsRate).toBeCloseTo(250000 / 350000, 5); // ~71.43%

      expect(result.assetConsolidation.totalAssets).toBe(17500000);
      expect(result.assetConsolidation.accessibleSafetyReserves).toBe(1000000);
      expect(result.assetConsolidation.emergencyRunwayMonths).toBeCloseTo(1000000 / 70000, 5); // ~14.29 months
      expect(result.assetConsolidation.productiveAssets).toBe(11500000);
      expect(result.assetConsolidation.personalConsumptionAssets).toBe(6000000);

      expect(result.liabilityConsolidation.totalLiabilities).toBe(0);
      expect(result.accountingNetWorth).toBe(17500000);
      expect(result.productiveAssetAdjustedNetWorth).toBe(11500000);
      expect(result.debtToAssetRatio).toBe(0);
    });

    it('VEC-REAL-04: Household in monthly deficit with heavy debt burden', () => {
      const result = calculateRealFinancialStatement({
        incomes: [
          { id: 'inc-1', label: 'Take-home Salary', monthlyAmount: 60000, category: 'SALARY' },
        ],
        outflows: [
          { id: 'out-1', label: 'Essential Living & Rent', monthlyAmount: 75000, category: 'ESSENTIAL_LIVING', isEssential: true },
          { id: 'out-2', label: 'Discretionary Dining', monthlyAmount: 15000, category: 'DISCRETIONARY_LIFESTYLE', isEssential: false },
        ],
        assets: [
          { id: 'ast-1', label: 'Bank Account', estimatedValue: 30000, group: 'CASH_RESERVES', isAccessibleSafetyReserve: true, purpose: 'PRODUCTIVE' },
          { id: 'ast-2', label: 'EPF Balance', estimatedValue: 200000, group: 'RETIREMENT_RESTRICTED', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
          { id: 'ast-3', label: 'Two Wheeler', estimatedValue: 50000, group: 'PERSONAL_PHYSICAL', isAccessibleSafetyReserve: false, purpose: 'PERSONAL_USE' },
        ],
        liabilities: [
          { id: 'lia-1', label: 'Personal Loan', outstandingBalance: 300000, category: 'UNSECURED' },
          { id: 'lia-2', label: 'Credit Card Debt', outstandingBalance: 120000, category: 'UNSECURED' },
        ],
      });

      // Deficit is clearly negative, never clamped to zero
      expect(result.cashFlow.monthlySurplus).toBe(-30000);
      expect(result.cashFlow.savingsRate).toBeCloseTo(-30000 / 60000, 5); // -50.0%

      expect(result.assetConsolidation.accessibleSafetyReserves).toBe(30000);
      expect(result.assetConsolidation.emergencyRunwayMonths).toBeCloseTo(30000 / 75000, 5); // 0.4 months

      expect(result.assetConsolidation.totalAssets).toBe(280000);
      expect(result.assetConsolidation.productiveAssets).toBe(230000);
      expect(result.assetConsolidation.personalConsumptionAssets).toBe(50000);

      expect(result.liabilityConsolidation.totalLiabilities).toBe(420000);
      expect(result.accountingNetWorth).toBe(-140000);
      expect(result.productiveAssetAdjustedNetWorth).toBe(-190000);
      expect(result.debtToAssetRatio).toBeCloseTo(420000 / 280000, 5); // 1.5
    });

    it('VEC-REAL-05: Strict exclusion of restricted retirement and physical assets from emergency runway', () => {
      const result = calculateRealFinancialStatement({
        incomes: [
          { id: 'inc-1', label: 'Salary', monthlyAmount: 100000, category: 'SALARY' },
        ],
        outflows: [
          { id: 'out-1', label: 'Essential Living', monthlyAmount: 50000, category: 'ESSENTIAL_LIVING', isEssential: true },
          { id: 'out-2', label: 'Discretionary', monthlyAmount: 20000, category: 'DISCRETIONARY_LIFESTYLE', isEssential: false },
        ],
        assets: [
          { id: 'ast-1', label: 'Savings Account', estimatedValue: 100000, group: 'CASH_RESERVES', isAccessibleSafetyReserve: true, purpose: 'PRODUCTIVE' },
          { id: 'ast-2', label: 'PPF', estimatedValue: 1500000, group: 'RETIREMENT_RESTRICTED', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
          { id: 'ast-3', label: 'NPS Tier 1', estimatedValue: 1000000, group: 'RETIREMENT_RESTRICTED', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
          { id: 'ast-4', label: 'Sovereign Gold Bonds', estimatedValue: 500000, group: 'FINANCIAL_INVESTMENT', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
        ],
        liabilities: [],
      });

      // Only ₹1,00,000 bank savings is counted as accessible reserve; PPF, NPS, SGB are excluded
      expect(result.assetConsolidation.accessibleSafetyReserves).toBe(100000);
      expect(result.assetConsolidation.emergencyRunwayMonths).toBeCloseTo(100000 / 50000, 5); // 2.0 months
      expect(result.assetConsolidation.totalAssets).toBe(3100000);
    });
  });

  describe('Validation & Boundary Protection', () => {
    it('rejects classifying restricted retirement holdings as accessible emergency safety reserves', () => {
      expect(() =>
        calculateAssetConsolidation([
          {
            id: 'ast-bad',
            label: 'EPF Locked Balance',
            estimatedValue: 500000,
            group: 'RETIREMENT_RESTRICTED',
            isAccessibleSafetyReserve: true,
            purpose: 'PRODUCTIVE',
          },
        ])
      ).toThrow(FinanceValidationError);
    });

    it('rejects classifying personal physical property as accessible emergency safety reserves', () => {
      expect(() =>
        calculateAssetConsolidation([
          {
            id: 'ast-bad',
            label: 'Primary Flat',
            estimatedValue: 7500000,
            group: 'PERSONAL_PHYSICAL',
            isAccessibleSafetyReserve: true,
            purpose: 'PERSONAL_USE',
          },
        ])
      ).toThrow(FinanceValidationError);
    });

    it('rejects classifying productive property (real estate/land) as accessible emergency safety reserves', () => {
      expect(() =>
        calculateAssetConsolidation([
          {
            id: 'ast-bad-property',
            label: 'Rental Commercial Shop',
            estimatedValue: 4000000,
            group: 'PRODUCTIVE_PROPERTY',
            isAccessibleSafetyReserve: true,
            purpose: 'PRODUCTIVE',
          },
        ])
      ).toThrow(FinanceValidationError);
    });

    it('Fix E: rejects incompatible purpose on all asset groups', () => {
      // 1. PERSONAL_PHYSICAL with PRODUCTIVE must throw
      expect(() =>
        calculateAssetConsolidation([
          {
            id: 'ast-1',
            label: 'Home Flat',
            estimatedValue: 7500000,
            group: 'PERSONAL_PHYSICAL',
            isAccessibleSafetyReserve: false,
            purpose: 'PRODUCTIVE',
          },
        ])
      ).toThrow(FinanceValidationError);

      // 2. CASH_RESERVES with PERSONAL_USE must throw
      expect(() =>
        calculateAssetConsolidation([
          {
            id: 'ast-2',
            label: 'Savings Bank Account',
            estimatedValue: 200000,
            group: 'CASH_RESERVES',
            isAccessibleSafetyReserve: true,
            purpose: 'PERSONAL_USE',
          },
        ])
      ).toThrow(FinanceValidationError);

      // 3. FINANCIAL_INVESTMENT with PERSONAL_USE must throw
      expect(() =>
        calculateAssetConsolidation([
          {
            id: 'ast-3',
            label: 'Mutual Funds',
            estimatedValue: 500000,
            group: 'FINANCIAL_INVESTMENT',
            isAccessibleSafetyReserve: false,
            purpose: 'PERSONAL_USE',
          },
        ])
      ).toThrow(FinanceValidationError);

      // 4. RETIREMENT_RESTRICTED with PERSONAL_USE must throw
      expect(() =>
        calculateAssetConsolidation([
          {
            id: 'ast-4',
            label: 'EPF Balance',
            estimatedValue: 800000,
            group: 'RETIREMENT_RESTRICTED',
            isAccessibleSafetyReserve: false,
            purpose: 'PERSONAL_USE',
          },
        ])
      ).toThrow(FinanceValidationError);

      // 5. PRODUCTIVE_PROPERTY with PERSONAL_USE must throw
      expect(() =>
        calculateAssetConsolidation([
          {
            id: 'ast-5',
            label: 'Commercial Office Space',
            estimatedValue: 3000000,
            group: 'PRODUCTIVE_PROPERTY',
            isAccessibleSafetyReserve: false,
            purpose: 'PERSONAL_USE',
          },
        ])
      ).toThrow(FinanceValidationError);
    });

    it('Fix E: tests row transition when changing group from PERSONAL_PHYSICAL to RETIREMENT_RESTRICTED', () => {
      // Original personal physical asset
      const originalAsset: StatementAssetItem = {
        id: 'ast-dynamic',
        label: 'Old Land Parcel',
        estimatedValue: 1000000,
        group: 'PERSONAL_PHYSICAL',
        isAccessibleSafetyReserve: false,
        purpose: 'PERSONAL_USE',
      };

      // If group is changed to RETIREMENT_RESTRICTED without updating purpose to PRODUCTIVE, domain engine throws
      const invalidTransitionAsset: StatementAssetItem = {
        ...originalAsset,
        group: 'RETIREMENT_RESTRICTED',
      };
      expect(() => calculateAssetConsolidation([invalidTransitionAsset])).toThrow(FinanceValidationError);

      // When synchronized properly with purpose: 'PRODUCTIVE' and isAccessibleSafetyReserve: false, it succeeds
      const validTransitionAsset: StatementAssetItem = {
        ...originalAsset,
        group: 'RETIREMENT_RESTRICTED',
        purpose: 'PRODUCTIVE',
        isAccessibleSafetyReserve: false,
      };
      const result = calculateAssetConsolidation([validTransitionAsset]);
      expect(result.retirementRestrictedTotal).toBe(1000000);
      expect(result.productiveAssets).toBe(1000000);
      expect(result.personalConsumptionAssets).toBe(0);
      expect(result.accessibleSafetyReserves).toBe(0);
    });

    it('rejects negative income or outflow amounts', () => {
      expect(() =>
        calculateCashFlow({
          incomes: [{ id: '1', label: 'Income', monthlyAmount: -5000, category: 'SALARY' }],
          outflows: [],
        })
      ).toThrow(FinanceValidationError);

      expect(() =>
        calculateCashFlow({
          incomes: [],
          outflows: [{ id: '1', label: 'Outflow', monthlyAmount: -1000, category: 'ESSENTIAL_LIVING', isEssential: true }],
        })
      ).toThrow(FinanceValidationError);
    });

    it('rejects non-finite or excessive amounts exceeding household threshold', () => {
      expect(() =>
        calculateCashFlow({
          incomes: [{ id: '1', label: 'Income', monthlyAmount: NaN, category: 'SALARY' }],
          outflows: [],
        })
      ).toThrow(FinanceValidationError);

      expect(() =>
        calculateCashFlow({
          incomes: [{ id: '1', label: 'Huge Income', monthlyAmount: 1e15, category: 'SALARY' }],
          outflows: [],
        })
      ).toThrow(FinanceValidationError);
    });
  });

  describe('Quick Net Worth Engine (calculateQuickNetWorth)', () => {
    it('aggregates category totals correctly', () => {
      const result = calculateQuickNetWorth({
        categories: {
          liquidAssets: 400000,
          financialAssets: 1600000,
          physicalAssets: 5000000,
          securedLiabilities: 2500000,
          unsecuredLiabilities: 200000,
        },
      });

      expect(result.liquidAssets).toBe(400000);
      expect(result.financialAssets).toBe(1600000);
      expect(result.physicalAssets).toBe(5000000);
      expect(result.totalAssets).toBe(7000000);
      expect(result.totalLiabilities).toBe(2700000);
      expect(result.accountingNetWorth).toBe(4300000);
      expect(result.debtToAssetRatio).toBeCloseTo(2700000 / 7000000, 5);
    });

    it('handles zero assets case returning null for debtToAssetRatio', () => {
      const result = calculateQuickNetWorth({
        categories: {
          liquidAssets: 0,
          financialAssets: 0,
          physicalAssets: 0,
          securedLiabilities: 0,
          unsecuredLiabilities: 100000,
        },
      });

      expect(result.totalAssets).toBe(0);
      expect(result.totalLiabilities).toBe(100000);
      expect(result.accountingNetWorth).toBe(-100000);
      expect(result.debtToAssetRatio).toBeNull(); // Not available!
    });

    it('rejects passing both category totals and itemized assets/liabilities simultaneously', () => {
      expect(() =>
        calculateQuickNetWorth({
          categories: { liquidAssets: 200000 },
          assets: [
            {
              id: 'a1',
              label: 'Bank Account',
              estimatedValue: 200000,
              group: 'CASH_RESERVES',
              isAccessibleSafetyReserve: true,
              purpose: 'PRODUCTIVE',
            },
          ],
        })
      ).toThrow(FinanceValidationError);
    });
  });

  describe('Fix F: Three Net-Worth Measures Comparison', () => {
    it('demonstrates the exact differences between Accounting Net Worth, Productive-Asset-Adjusted Net Worth, and Productive Liquid Net Worth', () => {
      // Household with:
      // - Liquid: ₹5,00,000 (Bank + Liquid Funds)
      // - Financial Investment: ₹20,00,000 (Equity Mutual Funds)
      // - Retirement: ₹15,00,000 (EPF/PPF - Productive, illiquid)
      // - Primary Home: ₹80,00,000 (Personal consumption physical)
      // - Liabilities: ₹50,00,000 (Home loan principal)

      const statementResult = calculateRealFinancialStatement({
        incomes: [{ id: 'inc-1', label: 'Salary', monthlyAmount: 150000, category: 'SALARY' }],
        outflows: [{ id: 'out-1', label: 'Living', monthlyAmount: 60000, category: 'ESSENTIAL_LIVING', isEssential: true }],
        assets: [
          { id: 'a1', label: 'Cash & Liquid', estimatedValue: 500000, group: 'CASH_RESERVES', isAccessibleSafetyReserve: true, purpose: 'PRODUCTIVE' },
          { id: 'a2', label: 'Equity Mutual Funds', estimatedValue: 2000000, group: 'FINANCIAL_INVESTMENT', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
          { id: 'a3', label: 'EPF Retirement', estimatedValue: 1500000, group: 'RETIREMENT_RESTRICTED', isAccessibleSafetyReserve: false, purpose: 'PRODUCTIVE' },
          { id: 'a4', label: 'Self-Occupied Home', estimatedValue: 8000000, group: 'PERSONAL_PHYSICAL', isAccessibleSafetyReserve: false, purpose: 'PERSONAL_USE' },
        ],
        liabilities: [
          { id: 'l1', label: 'Home Mortgage', outstandingBalance: 5000000, category: 'SECURED' },
        ],
      });

      // Total Assets = 5L + 20L + 15L + 80L = 120 Lakhs (₹1,20,00,000)
      // Total Liabilities = 50 Lakhs (₹50,00,000)
      expect(statementResult.assetConsolidation.totalAssets).toBe(12000000);
      expect(statementResult.liabilityConsolidation.totalLiabilities).toBe(5000000);

      // Measure 1: Accounting Net Worth = Total Assets - Total Liabilities
      // 120L - 50L = +70 Lakhs
      expect(statementResult.accountingNetWorth).toBe(7000000);

      // Measure 2: Productive-Asset-Adjusted Net Worth = Productive Assets - Total Liabilities
      // Productive Assets = 5L + 20L + 15L = 40 Lakhs.
      // 40L - 50L = -10 Lakhs (Deficit in productive capital backing debts!)
      expect(statementResult.productiveAssetAdjustedNetWorth).toBe(-1000000);

      // Measure 3: Productive Liquid Net Worth (from calculateNetWorth)
      // (Liquid + Financial) - Total Liabilities
      // (5L + 20L) - 50L = 25L - 50L = -25 Lakhs (Excluding retirement and physical assets)
      const quickNw = calculateNetWorth({
        categories: {
          liquidAssets: 500000,
          financialAssets: 2000000,
          physicalAssets: 8000000 + 1500000, // Physical/restricted
          securedLiabilities: 5000000,
          unsecuredLiabilities: 0,
        },
      });
      expect(quickNw.productiveLiquidNetWorth).toBe(-2500000);

      // Explicit assertions that none of these three measures are conflated
      expect(statementResult.accountingNetWorth).toBe(7000000);
      expect(statementResult.productiveAssetAdjustedNetWorth).toBe(-1000000);
      expect(quickNw.productiveLiquidNetWorth).toBe(-2500000);
      expect(statementResult.accountingNetWorth).not.toBe(statementResult.productiveAssetAdjustedNetWorth);
      expect(statementResult.productiveAssetAdjustedNetWorth).not.toBe(quickNw.productiveLiquidNetWorth);
    });
  });
});

