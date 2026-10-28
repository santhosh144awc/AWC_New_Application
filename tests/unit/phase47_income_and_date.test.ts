import { describe, it, expect } from 'vitest';
import { getTodayLocalDateString, formatIndianDate, parseIndianDateToIsoDate } from '../../src/lib/dateUtils';
import {
  calculateIncomeStage,
  type IncomeLineItem,
} from '../../src/domain/finance/personalFinanceStatement';

describe('Phase 47 Date Utilities & Income Synchronization Unit Tests', () => {
  describe('1. Date Utilities (Local Calendar & Indian DD-MM-YYYY format)', () => {
    it('returns today date in local calendar YYYY-MM-DD format without UTC shift', () => {
      const now = new Date();
      const expectedYear = now.getFullYear();
      const expectedMonth = String(now.getMonth() + 1).padStart(2, '0');
      const expectedDay = String(now.getDate()).padStart(2, '0');
      const expectedStr = `${expectedYear}-${expectedMonth}-${expectedDay}`;

      const actualStr = getTodayLocalDateString(now);
      expect(actualStr).toBe(expectedStr);
    });

    it('works correctly for date instances near midnight across local dates', () => {
      // Simulate 11:59 PM on 28th October 2026
      const lateNight = new Date(2026, 9, 28, 23, 59, 59);
      expect(getTodayLocalDateString(lateNight)).toBe('2026-10-28');

      // Simulate 12:01 AM on 29th October 2026
      const earlyMorning = new Date(2026, 9, 29, 0, 1, 0);
      expect(getTodayLocalDateString(earlyMorning)).toBe('2026-10-29');
    });

    it('formats YYYY-MM-DD string to Indian DD-MM-YYYY format', () => {
      expect(formatIndianDate('2026-10-28')).toBe('28-10-2026');
      expect(formatIndianDate('2026-01-05')).toBe('05-01-2026');
      expect(formatIndianDate('2026-12-31')).toBe('31-12-2026');
    });

    it('preserves existing DD-MM-YYYY strings idempotently', () => {
      expect(formatIndianDate('28-10-2026')).toBe('28-10-2026');
    });

    it('handles empty or invalid date gracefully', () => {
      expect(formatIndianDate('')).toBe('');
    });

    it('parses Indian DD-MM-YYYY to ISO YYYY-MM-DD', () => {
      expect(parseIndianDateToIsoDate('28-10-2026')).toBe('2026-10-28');
    });
  });

  describe('2. Income Synchronization Calculations', () => {
    it('1 & 2. Entering 50,000 monthly computes 6,00,000 annual; entering 6,00,000 annual computes 50,000 monthly', () => {
      const itemMonthly: IncomeLineItem = {
        id: 'inc-1',
        label: 'Salary',
        category: 'SALARY_SELF',
        grossMonthlyAmount: 50000,
        grossAnnualAmount: 600000,
        annualDeductions: 0,
      };

      const resMonthly = calculateIncomeStage([itemMonthly]);
      expect(resMonthly.items[0].grossMonthlyAmount).toBe(50000);
      expect(resMonthly.items[0].grossAnnualAmount).toBe(600000);
      expect(resMonthly.items[0].netAnnualAmount).toBe(600000);
      expect(resMonthly.totalGrossAnnualIncome).toBe(600000);

      const itemAnnual: IncomeLineItem = {
        id: 'inc-2',
        label: 'Consulting',
        category: 'BUSINESS',
        grossMonthlyAmount: 50000,
        grossAnnualAmount: 600000,
        annualDeductions: 0,
      };

      const resAnnual = calculateIncomeStage([itemAnnual]);
      expect(resAnnual.items[0].grossAnnualAmount).toBe(600000);
      expect(resAnnual.items[0].grossMonthlyAmount).toBe(50000);
    });

    it('3. Entering zero updates both fields correctly without NaN', () => {
      const itemZero: IncomeLineItem = {
        id: 'inc-zero',
        label: 'Zero Income',
        category: 'OTHER',
        grossMonthlyAmount: 0,
        grossAnnualAmount: 0,
        annualDeductions: 0,
      };

      const res = calculateIncomeStage([itemZero]);
      expect(res.items[0].grossMonthlyAmount).toBe(0);
      expect(res.items[0].grossAnnualAmount).toBe(0);
      expect(res.items[0].netAnnualAmount).toBe(0);
      expect(res.items[0].netMonthlyAmount).toBe(0);
      expect(res.totalGrossAnnualIncome).toBe(0);
    });

    it('6 & 7. Annual deductions remain annual deductions and do not scale with monthly gross', () => {
      const itemWithDeductions: IncomeLineItem = {
        id: 'inc-sal',
        label: 'Salary with Deductions',
        category: 'SALARY_SELF',
        grossMonthlyAmount: 100000,
        grossAnnualAmount: 1200000,
        annualDeductions: 150000, // 1.5 Lakh annual deduction
      };

      const res = calculateIncomeStage([itemWithDeductions]);
      // Net Annual = 12,00,000 - 1,50,000 = 10,50,000
      expect(res.items[0].grossAnnualAmount).toBe(1200000);
      expect(res.items[0].annualDeductions).toBe(150000);
      expect(res.items[0].netAnnualAmount).toBe(1050000);
      expect(res.items[0].netMonthlyAmount).toBe(1050000 / 12);
      expect(res.totalAnnualDeductions).toBe(150000);
      expect(res.totalNetAnnualIncome).toBe(1050000);
    });

    it('8. Total household income reflects each income row exactly once (never adding monthly + annual together)', () => {
      const rows: IncomeLineItem[] = [
        {
          id: 'inc-1',
          label: 'Salary Self',
          category: 'SALARY_SELF',
          grossMonthlyAmount: 100000,
          grossAnnualAmount: 1200000,
          annualDeductions: 100000,
        },
        {
          id: 'inc-2',
          label: 'Salary Spouse',
          category: 'SALARY_SPOUSE',
          grossMonthlyAmount: 50000,
          grossAnnualAmount: 600000,
          annualDeductions: 50000,
        },
      ];

      const res = calculateIncomeStage(rows);
      // Total Gross = 12,00,000 + 6,00,000 = 18,00,000
      expect(res.totalGrossAnnualIncome).toBe(1800000);
      // Deductions = 1,00,000 + 50,000 = 1,50,000
      expect(res.totalAnnualDeductions).toBe(150000);
      // Net Annual = 11,00,000 + 5,50,000 = 16,50,000
      expect(res.totalNetAnnualIncome).toBe(1650000);
      expect(res.totalNetMonthlyIncome).toBe(137500);
    });

    it('9. User-added custom income sources behave identically to predefined sources', () => {
      const customItem: IncomeLineItem = {
        id: 'inc-custom-999',
        label: 'Freelance Tech Advisory',
        category: 'OTHER',
        grossMonthlyAmount: 25000,
        grossAnnualAmount: 300000,
        annualDeductions: 20000,
      };

      const res = calculateIncomeStage([customItem]);
      expect(res.items[0].grossMonthlyAmount).toBe(25000);
      expect(res.items[0].grossAnnualAmount).toBe(300000);
      expect(res.items[0].annualDeductions).toBe(20000);
      expect(res.items[0].netAnnualAmount).toBe(280000);
      expect(res.items[0].netMonthlyAmount).toBeCloseTo(280000 / 12, 2);
    });
  });
});
