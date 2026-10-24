import { describe, it, expect } from 'vitest';
import {
  calculateDistributionYears,
  calculateBucketDurations,
  calculateRealReturn,
  calculateAnnuityDuePV,
  calculateBucket2InvestmentToday,
  calculateBucket3InvestmentToday,
  calculateRetirementDistributionPlan,
  type RetirementDistributionInput
} from '../../src/domain/finance/retirementDistribution';

describe('Retirement Distribution 3-Bucket Calculation Engine (Unit Tests)', () => {
  it('1. Correctly calculates distribution years and partitions into 3 buckets', () => {
    const distYrs = calculateDistributionYears(60, 90);
    expect(distYrs).toBe(30);

    const { b1Years, b2Years, b3Years } = calculateBucketDurations(distYrs);
    expect(b1Years).toBe(3); // Years 1-3
    expect(b2Years).toBe(4); // Years 4-7
    expect(b3Years).toBe(23); // Years 8-30
    expect(b1Years + b2Years + b3Years).toBe(30);
  });

  it('2. Correctly handles short horizons (e.g. 5 years)', () => {
    const distYrs = calculateDistributionYears(60, 65);
    expect(distYrs).toBe(5);

    const { b1Years, b2Years, b3Years } = calculateBucketDurations(distYrs);
    expect(b1Years).toBe(3);
    expect(b2Years).toBe(2);
    expect(b3Years).toBe(0);
  });

  it('3. Computes Fisher real return for each bucket', () => {
    // Bucket 1: 6% return, 6% inflation => (1.06 / 1.06) - 1 = 0%
    const b1Real = calculateRealReturn(6, 6);
    expect(b1Real).toBeCloseTo(0, 6);

    // Bucket 2: 8% return, 6% inflation => (1.08 / 1.06) - 1 = 1.88679%
    const b2Real = calculateRealReturn(8, 6);
    expect(b2Real).toBeCloseTo(1.886792, 4);

    // Bucket 3: 10% return, 6% inflation => (1.10 / 1.06) - 1 = 3.77358%
    const b3Real = calculateRealReturn(10, 6);
    expect(b3Real).toBeCloseTo(3.773585, 4);
  });

  it('4. Computes annuity due PV with zero and positive real return', () => {
    // With 0% real return, 3 years at 12L/yr = 36L exactly
    const pvZero = calculateAnnuityDuePV(1200000, 3, 0);
    expect(pvZero).toBe(3600000);

    // With positive real return
    const pvPositive = calculateAnnuityDuePV(1200000, 4, 1.886792);
    expect(pvPositive).toBeGreaterThan(0);
    expect(pvPositive).toBeLessThan(4800000); // Less than 4 * 12L because real return > 0
  });

  it('5. Computes discounting of Bucket 2 and Bucket 3 back to today', () => {
    const pvB2 = 4500000;
    // Discounted over B1 (3 years) at 8% p.a.
    const invB2 = calculateBucket2InvestmentToday(pvB2, 8, 3);
    expect(invB2).toBeCloseTo(4500000 / Math.pow(1.08, 3), 0);

    const pvB3 = 30000000;
    // Discounted over B1 + B2 (7 years) at 10% p.a.
    const invB3 = calculateBucket3InvestmentToday(pvB3, 10, 7);
    expect(invB3).toBeCloseTo(30000000 / Math.pow(1.10, 7), 0);
  });

  it('6. Full orchestrator test for standard retirement case', () => {
    const input: RetirementDistributionInput = {
      retirementAge: 60,
      monthlyRetirementExpense: 100000, // 1 Lakh/month
      lifeExpectancy: 90,
      assumptions: {
        inflationRate: 6,
        bucket1Return: 6,
        bucket2Return: 8,
        bucket3Return: 10
      }
    };

    const res = calculateRetirementDistributionPlan(input);

    expect(res.distributionYears).toBe(30);
    expect(res.initialAnnualExpense).toBe(1200000);
    expect(res.bucket1.durationYears).toBe(3);
    expect(res.bucket2.durationYears).toBe(4);
    expect(res.bucket3.durationYears).toBe(23);

    expect(res.bucket1.investmentRequiredToday).toBe(3600000); // 3 * 12L since real return is 0
    expect(res.bucket2.investmentRequiredToday).toBeGreaterThan(0);
    expect(res.bucket3.investmentRequiredToday).toBeGreaterThan(0);

    expect(res.totalInvestmentRequiredToday).toBe(
      res.bucket1.investmentRequiredToday +
      res.bucket2.investmentRequiredToday +
      res.bucket3.investmentRequiredToday
    );

    // Sum of allocations should be ~100%
    const totalAlloc = res.bucket1.allocationPercent + res.bucket2.allocationPercent + res.bucket3.allocationPercent;
    expect(totalAlloc).toBeCloseTo(100, 0);

    expect(res.keyInsight).toContain('By segmenting your 30-year retirement into 3 time horizons');
  });
});
