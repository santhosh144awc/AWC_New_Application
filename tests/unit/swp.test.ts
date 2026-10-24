import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyReturn,
  calculateSWPForMonth,
  calculateActualSWP,
  calculateActualLumpSumWithdrawal,
  calculateSWPPlan,
  type SWPInputs
} from '../../src/domain/finance/swp';

describe('SWP Longevity Simulation Engine (Unit Tests)', () => {
  it('1. Computes effective monthly return rate correctly', () => {
    // 8% annual return: (1 + 0.08)^(1/12) - 1
    const monthlyRate = calculateMonthlyReturn(8);
    expect(monthlyRate).toBeCloseTo(Math.pow(1.08, 1 / 12) - 1, 8);
    // Compound 12 times should match 8%
    expect(Math.pow(1 + monthlyRate, 12) - 1).toBeCloseTo(0.08, 6);
  });

  it('2. Computes step-up monthly SWP at correct annual intervals', () => {
    const basePmt = 50000;
    const stepUp = 6; // 6% p.a.

    // Months 1-12: year 1
    expect(calculateSWPForMonth(1, basePmt, stepUp)).toBe(50000);
    expect(calculateSWPForMonth(12, basePmt, stepUp)).toBe(50000);

    // Month 13: year 2
    expect(calculateSWPForMonth(13, basePmt, stepUp)).toBeCloseTo(50000 * 1.06, 2);

    // Month 25: year 3
    expect(calculateSWPForMonth(25, basePmt, stepUp)).toBeCloseTo(50000 * Math.pow(1.06, 2), 2);
  });

  it('3. Caps withdrawals at available corpus to prevent negative balances', () => {
    expect(calculateActualSWP(50000, 30000)).toBe(30000);
    expect(calculateActualSWP(50000, 100000)).toBe(50000);

    // Lump sum capping
    expect(calculateActualLumpSumWithdrawal(200000, 50000)).toBe(50000);
    expect(calculateActualLumpSumWithdrawal(200000, 500000)).toBe(200000);
  });

  it('4. Simulates sustainable SWP scenario without depletion', () => {
    const inputs: SWPInputs = {
      currentAge: 60,
      annualReturnRate: 9, // 9% return
      stepUpRate: 0,
      initialCorpus: 10000000, // 1 Crore
      monthlySWP: 40000, // 4.8L / yr (4.8% withdrawal rate)
    };

    const res = calculateSWPPlan(inputs);

    expect(res.corpusDepleted).toBe(false);
    expect(res.swpDurationMonths).toBe(600);
    expect(res.finalCorpus).toBeGreaterThan(0);
    expect(res.totalWithdrawal).toBe(40000 * 600);
    expect(res.keyInsight).toContain('comfortably sustains withdrawals throughout the simulated 50-year period');
  });

  it('5. Detects depletion correctly in aggressive withdrawal scenario', () => {
    const inputs: SWPInputs = {
      currentAge: 60,
      annualReturnRate: 6, // 6% return
      stepUpRate: 6, // 6% annual step-up
      initialCorpus: 2000000, // 20 Lakhs
      monthlySWP: 50000, // 6L / yr starting (30% withdrawal rate)
    };

    const res = calculateSWPPlan(inputs);

    expect(res.corpusDepleted).toBe(true);
    expect(res.swpDurationYears).toBeLessThan(5); // Will deplete rapidly
    expect(res.finalCorpus).toBe(0);
    expect(res.keyInsight).toContain('could sustain your planned monthly withdrawals for approximately');
  });

  it('6. Handles milestone lump-sum withdrawals', () => {
    const inputs: SWPInputs = {
      currentAge: 60,
      annualReturnRate: 8,
      stepUpRate: 0,
      initialCorpus: 5000000,
      monthlySWP: 25000,
      lumpSums: [
        { id: 'lump-1', monthNumber: 24, amount: 500000, label: 'Child Wedding' }
      ]
    };

    const res = calculateSWPPlan(inputs);

    expect(res.totalLumpSumWithdrawal).toBe(500000);
    expect(res.totalWithdrawals).toBe(res.totalWithdrawal + 500000);
    expect(res.projection[23].lumpSumWithdrawal).toBe(500000); // 0-indexed month 24
  });
});
