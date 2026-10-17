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
          { name: 'Sovereign Gold Bonds', value: 300000, category: 'PHYSICAL' },
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

    it('handles zero-asset / zero-liability case without NaN or division by zero', () => {
      const result = calculateNetWorth({});
      expect(result.totalAssets).toBe(0);
      expect(result.totalLiabilities).toBe(0);
      expect(result.totalNetWorth).toBe(0);
      expect(result.debtToAssetRatio).toBe(0);
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
  });
});
