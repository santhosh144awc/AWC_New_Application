import { describe, it, expect } from 'vitest';
import {
  calculateIncomeStage,
  calculateExpenseStage,
  calculateSavingsStage,
  calculateAssetStage,
  calculateLiabilityStage,
  calculateComprehensivePersonalFinanceStatement,
  convertToAnnualAndMonthly,
  getAnnualMultiplier,
  DEFAULT_INCOME_ITEMS,
  DEFAULT_ITEMIZED_EXPENSES,
  DEFAULT_ONGOING_INVESTMENTS,
  DEFAULT_ASSET_ITEMS,
  DEFAULT_LIABILITY_ITEMS,
  type IncomeLineItem,
  type ExpenseLineItem,
  type AssetLineItem,
  type LiabilityLineItem,
  type OngoingInvestmentItem,
  type ComprehensiveStatementInputs,
} from '../../src/domain/finance/personalFinanceStatement';

describe('Personal Finance Statement Domain Engine', () => {

  describe('1. Frequency conversions', () => {
    it('correctly converts all 4 supported frequencies', () => {
      expect(getAnnualMultiplier('MONTHLY')).toBe(12);
      expect(getAnnualMultiplier('QUARTERLY')).toBe(4);
      expect(getAnnualMultiplier('HALF_YEARLY')).toBe(2);
      expect(getAnnualMultiplier('ANNUAL')).toBe(1);

      const m = convertToAnnualAndMonthly(10000, 'MONTHLY');
      expect(m.annualAmount).toBe(120000);
      expect(m.monthlyAmount).toBe(10000);

      const q = convertToAnnualAndMonthly(30000, 'QUARTERLY');
      expect(q.annualAmount).toBe(120000);
      expect(q.monthlyAmount).toBe(10000);

      const h = convertToAnnualAndMonthly(60000, 'HALF_YEARLY');
      expect(h.annualAmount).toBe(120000);
      expect(h.monthlyAmount).toBe(10000);

      const a = convertToAnnualAndMonthly(120000, 'ANNUAL');
      expect(a.annualAmount).toBe(120000);
      expect(a.monthlyAmount).toBe(10000);
    });
  });

  describe('2. Income Stage Calculations', () => {
    it('calculates monthly and annual inputs with deductions correctly', () => {
      const items: IncomeLineItem[] = [
        {
          id: 'sal-1',
          label: 'Salary',
          category: 'SALARY_SELF',
          inputPeriod: 'MONTHLY',
          enteredGrossAmount: 100000,
          annualDeductions: 120000,
        },
        {
          id: 'bon-1',
          label: 'Bonus',
          category: 'BONUS_SELF',
          inputPeriod: 'ANNUAL',
          enteredGrossAmount: 200000,
          annualDeductions: 20000,
        },
      ];

      const res = calculateIncomeStage(items);
      expect(res.totalGrossAnnualIncome).toBe(1200000 + 200000); // 14,00,000
      expect(res.totalAnnualDeductions).toBe(120000 + 20000); // 1,40,000
      expect(res.totalNetAnnualIncome).toBe(1260000);
      expect(res.totalNetMonthlyIncome).toBe(105000);

      // Percentage check
      expect(res.items[0].netAnnualAmount).toBe(1080000);
      expect(res.items[0].percentOfTotalNetIncome).toBeCloseTo((1080000 / 1260000) * 100, 2);
    });

    it('handles empty income gracefully with 0 totals and null percentages', () => {
      const res = calculateIncomeStage([]);
      expect(res.totalGrossAnnualIncome).toBe(0);
      expect(res.totalNetAnnualIncome).toBe(0);
      expect(res.totalNetMonthlyIncome).toBe(0);
      expect(res.items).toHaveLength(0);
    });
  });

  describe('3. Expense Stage Calculations (Mode A vs Mode B)', () => {
    const itemized: ExpenseLineItem[] = [
      { id: 'h1', label: 'Rent', category: 'HOUSEHOLD', frequency: 'MONTHLY', enteredAmount: 30000 },
      { id: 'h2', label: 'Food', category: 'HOUSEHOLD', frequency: 'MONTHLY', enteredAmount: 20000 },
      { id: 'l1', label: 'Dining', category: 'LIFESTYLE', frequency: 'MONTHLY', enteredAmount: 5000 },
      { id: 'd1', label: 'School', category: 'DEPENDENT', frequency: 'QUARTERLY', enteredAmount: 15000 }, // 60k/yr
      { id: 'i1', label: 'Term Life', category: 'INSURANCE', frequency: 'ANNUAL', enteredAmount: 24000 },
      { id: 'e1', label: 'Car EMI', category: 'LOAN_EMI', frequency: 'MONTHLY', enteredAmount: 10000 },
    ];

    it('Mode B (Itemized) sums itemized household expenses without single sum interference', () => {
      const res = calculateExpenseStage({
        householdMode: 'ITEMIZED_MODE',
        singleMonthlyHouseholdExpense: 999999, // Inactive
        itemizedExpenses: itemized,
        totalNetAnnualIncome: 1200000,
      });

      // Household = (30k + 20k) * 12 = 600,000
      expect(res.householdSubtotalAnnual).toBe(600000);
      expect(res.householdSubtotalMonthly).toBe(50000);

      // Lifestyle = 5k * 12 = 60,000
      expect(res.lifestyleSubtotalAnnual).toBe(60000);

      // Dependent = 15k * 4 = 60,000
      expect(res.dependentSubtotalAnnual).toBe(60000);

      // Insurance = 24,000
      expect(res.insuranceSubtotalAnnual).toBe(24000);

      // EMI = 10k * 12 = 120,000
      expect(res.loanEmiSubtotalAnnual).toBe(120000);

      // Total = 600k + 60k + 60k + 24k + 120k = 864,000
      expect(res.totalAnnualExpenses).toBe(864000);
      expect(res.totalMonthlyExpenses).toBe(72000);
      expect(res.expenseToIncomeRatio).toBeCloseTo((864000 / 1200000) * 100, 2);
    });

    it('Mode A (Single Sum) strictly uses single monthly household expense and ignores itemized household items', () => {
      const res = calculateExpenseStage({
        householdMode: 'TOTAL_MODE',
        singleMonthlyHouseholdExpense: 40000, // 480,000 annual
        itemizedExpenses: itemized,
        totalNetAnnualIncome: 1200000,
      });

      // Household = 40,000 * 12 = 480,000 (NOT 600k + 480k)
      expect(res.householdSubtotalAnnual).toBe(480000);
      expect(res.householdSubtotalMonthly).toBe(40000);

      // Other categories remain active
      expect(res.lifestyleSubtotalAnnual).toBe(60000);
      expect(res.dependentSubtotalAnnual).toBe(60000);
      expect(res.insuranceSubtotalAnnual).toBe(24000);
      expect(res.loanEmiSubtotalAnnual).toBe(120000);

      // Total = 480k + 60k + 60k + 24k + 120k = 744,000
      expect(res.totalAnnualExpenses).toBe(744000);
      expect(res.totalMonthlyExpenses).toBe(62000);
    });
  });

  describe('4. Savings & Ongoing Investments Stage', () => {
    it('calculates savings and surplus correctly when positive', () => {
      const ongoing: OngoingInvestmentItem[] = [
        { id: 'sip1', label: 'SIP', frequency: 'MONTHLY', enteredAmount: 20000 }, // 240k/yr
        { id: 'ppf1', label: 'PPF', frequency: 'ANNUAL', enteredAmount: 60000 },
      ];

      const res = calculateSavingsStage({
        totalNetAnnualIncome: 1200000,
        totalAnnualExpenses: 700000,
        ongoingInvestments: ongoing,
        assumedSurplusReturnPercent: 12,
      });

      // Annual Savings = 1,200,000 - 700,000 = 500,000
      expect(res.annualSavings).toBe(500000);
      expect(res.monthlySavings).toBeCloseTo(500000 / 12, 2);
      expect(res.savingsRatePercent).toBeCloseTo((500000 / 1200000) * 100, 2);

      // Ongoing Investments = 240,000 + 60,000 = 300,000
      expect(res.totalOngoingInvestmentsAnnual).toBe(300000);
      expect(res.totalOngoingInvestmentsMonthly).toBe(25000);

      // Surplus = 500,000 - 300,000 = 200,000
      expect(res.annualSurplusForFreshInvestments).toBe(200000);
      expect(res.monthlySurplusForFreshInvestments).toBeCloseTo(200000 / 12, 2);

      // Projections generated for 5, 10, 15, 20 yrs
      expect(res.surplusProjections).toHaveLength(4);
      expect(res.surplusProjections[0].year).toBe(5);
      expect(res.surplusProjections[0].projectedCorpus).toBeGreaterThan(res.surplusProjections[0].cumulativeContributed);
    });

    it('accurately displays negative surplus without clamping to 0 when expenses exceed savings', () => {
      const ongoing: OngoingInvestmentItem[] = [
        { id: 'sip1', label: 'SIP', frequency: 'MONTHLY', enteredAmount: 20000 }, // 240k/yr
      ];

      const res = calculateSavingsStage({
        totalNetAnnualIncome: 600000,
        totalAnnualExpenses: 500000, // Savings = 100k
        ongoingInvestments: ongoing, // Ongoing = 240k -> Surplus = -140k
      });

      expect(res.annualSavings).toBe(100000);
      expect(res.annualSurplusForFreshInvestments).toBe(-140000);
      expect(res.monthlySurplusForFreshInvestments).toBeCloseTo(-140000 / 12, 2);
      // No projections for negative surplus
      expect(res.surplusProjections).toHaveLength(0);
    });
  });

  describe('5. Asset Stage (6 Classes & Owner Attribution)', () => {
    it('aggregates asset classes and owner attribution faithfully', () => {
      const assets: AssetLineItem[] = [
        { id: 'a1', label: 'Bank', assetClass: 'LIQUID', selfAmount: 100000, spouseAmount: 50000, childrenAmount: 0 },
        { id: 'a2', label: 'FD', assetClass: 'DEBT', selfAmount: 200000, spouseAmount: 100000, childrenAmount: 0 },
        { id: 'a3', label: 'MF', assetClass: 'EQUITY', selfAmount: 500000, spouseAmount: 200000, childrenAmount: 50000 },
        { id: 'a4', label: 'SGB', assetClass: 'GOLD', selfAmount: 100000, spouseAmount: 50000, childrenAmount: 0 },
        { id: 'a5', label: 'Plot', assetClass: 'REAL_ESTATE', selfAmount: 1500000, spouseAmount: 0, childrenAmount: 0 },
        { id: 'a6', label: 'Home', assetClass: 'PERSONAL', selfAmount: 4000000, spouseAmount: 2000000, childrenAmount: 0 },
      ];

      const res = calculateAssetStage(assets);

      expect(res.totalLiquidAssets).toBe(150000);
      expect(res.totalDebtAssets).toBe(300000);
      expect(res.totalEquityAssets).toBe(750000);
      expect(res.totalGoldAssets).toBe(150000);
      expect(res.totalRealEstateAssets).toBe(1500000);
      expect(res.totalPersonalAssets).toBe(6000000);

      // Productive assets = Liquid + Debt + Equity + Gold + Real Estate (Excludes Personal)
      expect(res.totalProductiveAssets).toBe(150000 + 300000 + 750000 + 150000 + 1500000); // 2,850,000

      // Total assets = 2,850,000 + 6,000,000 = 8,850,000
      expect(res.totalAssets).toBe(8850000);

      // Owner sums
      expect(res.totalSelfAssets).toBe(100000 + 200000 + 500000 + 100000 + 1500000 + 4000000); // 6,400,000
      expect(res.totalSpouseAssets).toBe(50000 + 100000 + 200000 + 50000 + 0 + 2000000); // 2,400,000
      expect(res.totalChildrenAssets).toBe(50000);
      expect(res.totalSelfAssets + res.totalSpouseAssets + res.totalChildrenAssets).toBe(res.totalAssets);
    });
  });

  describe('6. Liabilities Stage & Debt-to-Asset Ratio', () => {
    it('aggregates liabilities across owners and computes debt-to-asset ratio', () => {
      const liabilities: LiabilityLineItem[] = [
        { id: 'l1', label: 'Home Loan', type: 'HOME_LOAN', selfAmount: 2000000, spouseAmount: 500000, childrenAmount: 0 },
        { id: 'l2', label: 'Car Loan', type: 'VEHICLE_LOAN', selfAmount: 300000, spouseAmount: 0, childrenAmount: 0 },
      ];

      const res = calculateLiabilityStage(liabilities, 10000000); // 1 Crore assets
      expect(res.totalLiabilities).toBe(2800000);
      expect(res.totalSelfLiabilities).toBe(2300000);
      expect(res.totalSpouseLiabilities).toBe(500000);
      expect(res.debtToAssetRatioPercent).toBeCloseTo(28, 2);
    });

    it('returns null debtToAssetRatioPercent when totalAssets is 0', () => {
      const liabilities: LiabilityLineItem[] = [
        { id: 'l1', label: 'Car Loan', type: 'VEHICLE_LOAN', selfAmount: 100000, spouseAmount: 0, childrenAmount: 0 },
      ];
      const res = calculateLiabilityStage(liabilities, 0);
      expect(res.debtToAssetRatioPercent).toBeNull();
    });
  });

  describe('7. Comprehensive Personal Finance Statement & Net Worth Reconciliation', () => {
    it('reconciles Net Worth Incl. Personal Assets and Net Worth Excl. Personal Assets strictly matching Excel workbook formulas', () => {
      const inputs: ComprehensiveStatementInputs = {
        metadata: {
          clientName: 'Rahul & Priya Sharma',
          statementDate: '2026-10-28',
          preparedBy: 'C. Santhosh Sathriyan',
        },
        incomeItems: DEFAULT_INCOME_ITEMS,
        expenseInputs: {
          householdMode: 'ITEMIZED_MODE',
          singleMonthlyHouseholdExpense: 0,
          itemizedExpenses: DEFAULT_ITEMIZED_EXPENSES,
        },
        ongoingInvestments: DEFAULT_ONGOING_INVESTMENTS,
        assetItems: DEFAULT_ASSET_ITEMS,
        liabilityItems: DEFAULT_LIABILITY_ITEMS,
      };

      const result = calculateComprehensivePersonalFinanceStatement(inputs);

      // Verify Excel Workbook formula invariants:
      // Row 123: Total Assets
      // Row 124: Total Liabilities
      // Row 125: Networth (Including Personal Assets) = Total Assets - Total Liabilities
      // Row 126: Networth (Excluding Personal Assets) = Total Assets - Total Liabilities - Total Personal Assets
      expect(result.netWorthIncludingPersonalAssets).toBe(result.totalAssets - result.totalLiabilities);
      expect(result.netWorthExcludingPersonalAssets).toBe(
        result.totalAssets - result.totalLiabilities - result.totalPersonalAssets
      );
      expect(result.netWorthIncludingPersonalAssets - result.netWorthExcludingPersonalAssets).toBe(
        result.totalPersonalAssets
      );

      // Verify emergency runway
      expect(result.liquidAssetsRunwayMonths).not.toBeNull();
      expect(result.liquidAssetsRunwayMonths!).toBeGreaterThan(0);

      // Verify productive assets ratio
      expect(result.productiveAssetsRatioPercent).toBeGreaterThan(0);
      expect(result.productiveAssetsRatioPercent!).toBeLessThan(100);
    });

    it('handles totally blank statement without NaN or throw', () => {
      const blankInputs: ComprehensiveStatementInputs = {
        metadata: {
          clientName: '',
          statementDate: '2026-10-28',
          preparedBy: 'C. Santhosh Sathriyan',
        },
        incomeItems: [],
        expenseInputs: {
          householdMode: 'TOTAL_MODE',
          singleMonthlyHouseholdExpense: 0,
          itemizedExpenses: [],
        },
        ongoingInvestments: [],
        assetItems: [],
        liabilityItems: [],
      };

      const res = calculateComprehensivePersonalFinanceStatement(blankInputs);
      expect(res.totalAssets).toBe(0);
      expect(res.totalLiabilities).toBe(0);
      expect(res.netWorthIncludingPersonalAssets).toBe(0);
      expect(res.netWorthExcludingPersonalAssets).toBe(0);
      expect(res.savingsRatePercent).toBeNull();
      expect(res.debtToAssetRatioPercent).toBeNull();
      expect(res.liquidAssetsRunwayMonths).toBeNull();
      expect(res.productiveAssetsRatioPercent).toBeNull();
    });
  });

});
