import { describe, it, expect } from 'vitest';
import { calculateNetWorth, FinanceValidationError } from '../../src/domain/finance';

describe('netWorth Domain Engine', () => {
  describe('Authoritative Reference Vectors (ENGINE_TEST_VECTOR_REGISTER.csv)', () => {
    it('VEC-WORTH-1: REAL statement balance sheet aggregation', () => {
      const result = calculateNetWorth({
        categories: {
          liquidAssets: 500000,
          financialAssets: 2500000,
          physicalAssets: 7000000,
          securedLiabilities: 4000000,
          unsecuredLiabilities: 0,
        },
      });

      expect(result.liquidAssets).toBe(500000);
      expect(result.financialAssets).toBe(2500000);
      expect(result.physicalAssets).toBe(7000000);
      expect(result.totalAssets).toBe(10000000);

      expect(result.securedLiabilities).toBe(4000000);
      expect(result.unsecuredLiabilities).toBe(0);
      expect(result.totalLiabilities).toBe(4000000);

      // Total Net Worth = 10,000,000 - 4,000,000 = 6,000,000
      expect(result.totalNetWorth).toBe(6000000);

      // Productive Liquid Net Worth = (500,000 + 2,500,000) - 4,000,000 = -1,000,000
      expect(result.productiveLiquidNetWorth).toBe(-1000000);

      // Debt to Asset Ratio = 4,000,000 / 10,000,000 = 0.4
      expect(result.debtToAssetRatio).toBe(0.4);
    });
  });

  describe('Itemized Holdings and Category Aggregations', () => {
    it('aggregates individual itemized assets and liabilities accurately', () => {
      const result = calculateNetWorth({
        assets: [
          { name: 'HDFC Savings', value: 150000, category: 'LIQUID' },
          { name: 'ICICI Liquid Fund', value: 350000, category: 'LIQUID' },
          { name: 'Parag Parikh Flexi Cap', value: 1200000, category: 'FINANCIAL' },
          { name: 'EPF Balance', value: 800000, category: 'FINANCIAL' },
          { name: 'Bangalore Apartment', value: 8500000, category: 'PHYSICAL' },
          { name: 'Physical Gold Jewellery', value: 300000, category: 'PHYSICAL' },
        ],
        liabilities: [
          { name: 'SBI Home Loan', value: 4500000, category: 'SECURED' },
          { name: 'HDFC Credit Card', value: 45000, category: 'UNSECURED' },
        ],
      });

      expect(result.liquidAssets).toBe(500000);
      expect(result.financialAssets).toBe(2000000);
      expect(result.physicalAssets).toBe(8800000);
      expect(result.totalAssets).toBe(11300000);

      expect(result.securedLiabilities).toBe(4500000);
      expect(result.unsecuredLiabilities).toBe(45000);
      expect(result.totalLiabilities).toBe(4545000);

      expect(result.totalNetWorth).toBe(11300000 - 4545000);
      expect(result.productiveLiquidNetWorth).toBe(2500000 - 4545000);
    });

    it('handles zero-asset / zero-liability case without NaN or division by zero, returning null for ratio', () => {
      const result = calculateNetWorth({});
      expect(result.totalAssets).toBe(0);
      expect(result.totalLiabilities).toBe(0);
      expect(result.totalNetWorth).toBe(0);
      expect(result.debtToAssetRatio).toBeNull();
    });

    it('handles zero assets with positive liabilities yielding negative net worth and null debt-to-asset ratio', () => {
      const result = calculateNetWorth({
        categories: {
          securedLiabilities: 200000,
          unsecuredLiabilities: 50000,
        },
      });
      expect(result.totalAssets).toBe(0);
      expect(result.totalLiabilities).toBe(250000);
      expect(result.totalNetWorth).toBe(-250000);
      expect(result.debtToAssetRatio).toBeNull();
    });

    it('maintains accounting invariant: totalNetWorth equals totalAssets minus totalLiabilities', () => {
      const result = calculateNetWorth({
        categories: {
          liquidAssets: 250000,
          financialAssets: 1500000,
          physicalAssets: 4000000,
          securedLiabilities: 2000000,
          unsecuredLiabilities: 500000,
        },
      });

      expect(result.totalNetWorth).toBe(result.totalAssets - result.totalLiabilities);
    });
  });

  describe('Input Validation & Error Handling', () => {
    it('rejects negative values in category totals', () => {
      expect(() => calculateNetWorth({ categories: { liquidAssets: -500 } }))
        .toThrow(FinanceValidationError);
      expect(() => calculateNetWorth({ categories: { securedLiabilities: -1000 } }))
        .toThrow(FinanceValidationError);
    });

    it('rejects non-finite values in category totals', () => {
      expect(() => calculateNetWorth({ categories: { financialAssets: NaN } }))
        .toThrow(FinanceValidationError);
      expect(() => calculateNetWorth({ categories: { unsecuredLiabilities: Infinity } }))
        .toThrow(FinanceValidationError);
    });

    it('rejects negative or non-finite values in itemized lists', () => {
      expect(() => calculateNetWorth({
        assets: [{ name: 'Bad Asset', value: -100, category: 'LIQUID' }],
      })).toThrow(FinanceValidationError);

      expect(() => calculateNetWorth({
        liabilities: [{ name: 'Bad Liability', value: NaN, category: 'SECURED' }],
      })).toThrow(FinanceValidationError);
    });

    it('rejects simultaneously specifying categories and itemized assets/liabilities to prevent double counting', () => {
      expect(() =>
        calculateNetWorth({
          categories: { liquidAssets: 500000 },
          assets: [{ name: 'Bank Balance', value: 500000, category: 'LIQUID' }],
        })
      ).toThrow(FinanceValidationError);
    });
  });

  describe('Fix F: Distinct Net-Worth Measures', () => {
    it('calculates Accounting Net Worth and Productive Liquid Net Worth as distinct formulas', () => {
      // Household with ₹10L liquid, ₹30L financial, ₹80L primary residence, ₹50L home mortgage
      const result = calculateNetWorth({
        categories: {
          liquidAssets: 1000000,
          financialAssets: 3000000,
          physicalAssets: 8000000,
          securedLiabilities: 5000000,
          unsecuredLiabilities: 0,
        },
      });

      // Total Assets = 10L + 30L + 80L = 120L (1.20 Cr)
      expect(result.totalAssets).toBe(12000000);
      // Total Liabilities = 50L
      expect(result.totalLiabilities).toBe(5000000);

      // 1. Accounting Net Worth = Total Assets - Total Liabilities = 120L - 50L = 70L (Positive)
      expect(result.totalNetWorth).toBe(7000000);

      // 2. Productive Liquid Net Worth = (Liquid + Financial) - Total Liabilities
      // (10L + 30L) - 50L = 40L - 50L = -10L (Negative! Showing debt exceeds liquid/financial capital)
      expect(result.productiveLiquidNetWorth).toBe(-1000000);

      // Verifying these two figures are explicitly not equal
      expect(result.totalNetWorth).not.toBe(result.productiveLiquidNetWorth);
    });
  });
});
