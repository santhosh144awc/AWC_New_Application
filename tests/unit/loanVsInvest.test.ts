import { describe, it, expect } from 'vitest';
import {
  calculateLoanVsInvestment,
  type LoanVsInvestmentInput
} from '../../src/domain/finance/loanVsInvest';

describe('Loan vs Investment Trade-off Engine (Unit Tests)', () => {
  it('1. Calculates original loan EMI and interest correctly', () => {
    const input: LoanVsInvestmentInput = {
      loanAmount: 3000000, // 30 Lakhs
      loanInterestRate: 8.5,
      loanTenureYears: 15,
      lumpsumAvailable: 500000, // 5 Lakhs
      expectedInvestmentReturn: 12,
      investmentPeriodYears: 15
    };

    const res = calculateLoanVsInvestment(input);

    expect(res.originalMonthlyEMI).toBeGreaterThan(29000);
    expect(res.originalMonthlyEMI).toBeLessThan(30000);
    expect(res.originalTotalInterest).toBeGreaterThan(2200000);
    expect(res.prepaymentAmount).toBe(500000);
  });

  it('2. Compares Option A Prepayment vs Option B Investment', () => {
    const input: LoanVsInvestmentInput = {
      loanAmount: 3000000,
      loanInterestRate: 8.5,
      loanTenureYears: 15,
      lumpsumAvailable: 500000,
      expectedInvestmentReturn: 12,
      investmentPeriodYears: 15
    };

    const res = calculateLoanVsInvestment(input);

    // Interest saved by prepaying 5L on a 30L loan at 8.5% over 15y
    expect(res.interestSavedByPrepayment).toBeGreaterThan(350000);

    // Future value of 5L invested at 12% over 15y: 500000 * (1.12)^15 = ~27.36 Lakhs
    expect(res.investmentFutureValue).toBeGreaterThan(2700000);
    expect(res.investmentFutureValue).toBeLessThan(2800000);

    // With 12% vs 8.5%, Investment should be betterOption
    expect(res.betterOption).toBe('Invest');
    expect(res.netFinancialDifference).toBeGreaterThan(0);
    expect(res.summaryInsight).toContain('Investing could yield an estimated');
  });

  it('3. Recommends Prepay when loan interest rate exceeds expected investment return', () => {
    const input: LoanVsInvestmentInput = {
      loanAmount: 2000000,
      loanInterestRate: 11, // High interest loan (e.g. personal / old loan)
      loanTenureYears: 10,
      lumpsumAvailable: 500000,
      expectedInvestmentReturn: 7, // Conservative debt investment
      investmentPeriodYears: 10
    };

    const res = calculateLoanVsInvestment(input);

    expect(res.betterOption).toBe('Prepay');
    expect(res.summaryInsight).toContain('Prepaying your loan saves a guaranteed');
  });

  it('4. Recommends Balanced when loan interest rate and investment return are close', () => {
    const input: LoanVsInvestmentInput = {
      loanAmount: 2500000,
      loanInterestRate: 8.5,
      loanTenureYears: 10,
      lumpsumAvailable: 300000,
      expectedInvestmentReturn: 9.5, // Only 1% higher
      investmentPeriodYears: 10
    };

    const res = calculateLoanVsInvestment(input);

    expect(res.betterOption).toBe('Balanced');
    expect(res.summaryInsight).toContain('A hybrid approach');
  });

  it('5. Handles prepayment greater than outstanding loan', () => {
    const input: LoanVsInvestmentInput = {
      loanAmount: 500000,
      loanInterestRate: 8.5,
      loanTenureYears: 5,
      lumpsumAvailable: 1000000, // Surplus exceeds loan
      expectedInvestmentReturn: 12,
      investmentPeriodYears: 5
    };

    const res = calculateLoanVsInvestment(input);

    // Prepayment should be capped at loanAmount
    expect(res.prepaymentAmount).toBe(500000);
    expect(res.newMonthlyEMI).toBe(0);
    expect(res.newTotalInterest).toBe(0);
    expect(res.interestSavedByPrepayment).toBe(res.originalTotalInterest);
  });
});
