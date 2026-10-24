import { describe, it, expect } from 'vitest';
import {
  calculateLoanSipRecovery,
  validateLoanSipRecoveryInputs,
  ILLUSTRATIVE_LOAN_SIP_RECOVERY_EXAMPLE,
  type LoanSipRecoveryInputs,
} from '../../src/domain/finance/loanSipRecovery';

describe('Home Loan + SIP Interest Recovery Engine (Unit Tests)', () => {
  it('1. Calculates illustrative canonical scenario correctly (₹50L, 8.5%, 20y, 15% EMI, 12% return)', () => {
    const res = calculateLoanSipRecovery(ILLUSTRATIVE_LOAN_SIP_RECOVERY_EXAMPLE);

    expect(res.loanPrincipal).toBe(5_000_000);
    expect(res.annualLoanInterestRatePercent).toBe(8.5);
    expect(res.loanTenureYears).toBe(20);
    expect(res.loanTenureMonths).toBe(240);

    // Monthly EMI check (~₹43,391)
    expect(res.monthlyEMI).toBeGreaterThanOrEqual(43380);
    expect(res.monthlyEMI).toBeLessThanOrEqual(43405);

    // Total Repayment & Interest Paid
    expect(res.totalLoanRepayment).toBe(res.monthlyEMI * 240);
    expect(res.totalLoanInterestPaid).toBe(res.totalLoanRepayment - 5_000_000);
    expect(res.totalLoanInterestPaid).toBeGreaterThan(5_400_000);

    // Parallel Monthly SIP at 15% of EMI (~₹6,509)
    expect(res.effectiveMonthlySip).toBe(Math.round(res.monthlyEMI * 0.15));
    expect(res.totalSipInvested).toBe(res.effectiveMonthlySip * 240);

    // Estimated SIP Corpus & Gains (~₹65L corpus, ~₹49L gain)
    expect(res.estimatedSipCorpus).toBeGreaterThan(6_000_000);
    expect(res.estimatedSipCorpus).toBeLessThan(7_000_000);
    expect(res.estimatedSipGain).toBe(res.estimatedSipCorpus - res.totalSipInvested);

    // Offset Ratios
    expect(res.interestGainOffsetPercent).toBeGreaterThan(85);
    expect(res.interestGainOffsetPercent).toBeLessThan(100);
    expect(res.totalCorpusOffsetPercent).toBeGreaterThan(115);

    // Breakeven SIP exists and is realistic (~16.4% of EMI)
    expect(res.breakevenMonthlySip).not.toBeNull();
    expect(res.breakevenMonthlySip!).toBeGreaterThan(res.effectiveMonthlySip);
    expect(res.breakevenSipPercentOfEmi).toBeGreaterThan(15);
    expect(res.breakevenSipPercentOfEmi).toBeLessThan(18);

    // Milestones check
    expect(res.milestones.length).toBe(20);
    expect(res.milestones[0].year).toBe(1);
    expect(res.milestones[19].year).toBe(20);
    expect(res.milestones[19].loanRemainingBalance).toBe(0);
    expect(res.milestones[19].estimatedSipCorpus).toBe(res.estimatedSipCorpus);
  });

  it('2. Supports FIXED_AMOUNT SIP mode with custom monthly contributions', () => {
    const inputs: LoanSipRecoveryInputs = {
      loanPrincipal: 3_000_000, // ₹30 Lakhs
      annualLoanInterestRatePercent: 9.0,
      loanTenureYears: 15,
      sipMode: 'FIXED_AMOUNT',
      fixedMonthlySipAmount: 10_000, // ₹10,000 fixed
      annualInvestmentReturnRatePercent: 11.5,
    };

    const res = calculateLoanSipRecovery(inputs);
    expect(res.effectiveMonthlySip).toBe(10_000);
    expect(res.totalSipInvested).toBe(10_000 * 180); // 15y = 180m -> ₹18 Lakhs
    expect(res.estimatedSipCorpus).toBeGreaterThan(res.totalSipInvested);
    expect(res.estimatedSipGain).toBe(res.estimatedSipCorpus - 1_800_000);
    expect(res.milestones.length).toBe(15);
  });

  it('3. Handles zero investment return (0%) safely without NaN or division by zero', () => {
    const inputs: LoanSipRecoveryInputs = {
      loanPrincipal: 4_000_000,
      annualLoanInterestRatePercent: 8.0,
      loanTenureYears: 10,
      sipMode: 'FIXED_AMOUNT',
      fixedMonthlySipAmount: 5000,
      annualInvestmentReturnRatePercent: 0.0, // 0% return
    };

    const res = calculateLoanSipRecovery(inputs);
    expect(res.totalSipInvested).toBe(5000 * 120); // ₹6 Lakhs
    expect(res.estimatedSipCorpus).toBe(600_000);
    expect(res.estimatedSipGain).toBe(0);
    expect(res.interestGainOffsetPercent).toBe(0);
    expect(res.netGainVsInterestDiff).toBe(-res.totalLoanInterestPaid);
    expect(res.breakevenMonthlySip).toBeNull();
  });

  it('4. Handles short tenure boundary (1 year = 12 months)', () => {
    const inputs: LoanSipRecoveryInputs = {
      loanPrincipal: 200_000,
      annualLoanInterestRatePercent: 10.0,
      loanTenureYears: 1,
      sipMode: 'PERCENTAGE_OF_EMI',
      sipPercentageOfEmi: 10,
      annualInvestmentReturnRatePercent: 12.0,
    };

    const res = calculateLoanSipRecovery(inputs);
    expect(res.loanTenureMonths).toBe(12);
    expect(res.milestones.length).toBe(1);
    expect(res.milestones[0].loanRemainingBalance).toBe(0);
    expect(res.estimatedSipCorpus).toBeGreaterThan(res.totalSipInvested);
  });

  it('5. Handles maximum tenure boundary (30 years = 360 months) and large loans', () => {
    const inputs: LoanSipRecoveryInputs = {
      loanPrincipal: 50_000_000, // ₹5 Crores
      annualLoanInterestRatePercent: 8.75,
      loanTenureYears: 30,
      sipMode: 'PERCENTAGE_OF_EMI',
      sipPercentageOfEmi: 20,
      annualInvestmentReturnRatePercent: 12.5,
    };

    const res = calculateLoanSipRecovery(inputs);
    expect(res.loanTenureMonths).toBe(360);
    expect(res.monthlyEMI).toBeGreaterThan(390_000);
    expect(res.totalLoanInterestPaid).toBeGreaterThan(90_000_000); // 30y interest > principal!
    expect(res.estimatedSipCorpus).toBeGreaterThan(150_000_000);
    expect(res.milestones.length).toBe(30);
  });

  it('6. Validation catches out-of-bounds parameters with descriptive messages', () => {
    // Under min principal
    const issues1 = validateLoanSipRecoveryInputs({
      loanPrincipal: 50_000,
      annualLoanInterestRatePercent: 8.5,
      loanTenureYears: 20,
      sipMode: 'PERCENTAGE_OF_EMI',
      sipPercentageOfEmi: 15,
      annualInvestmentReturnRatePercent: 12,
    });
    expect(issues1.some((i) => i.field === 'loanPrincipal')).toBe(true);

    // Negative interest rate
    const issues2 = validateLoanSipRecoveryInputs({
      loanPrincipal: 1_000_000,
      annualLoanInterestRatePercent: -1,
      loanTenureYears: 20,
      sipMode: 'PERCENTAGE_OF_EMI',
      sipPercentageOfEmi: 15,
      annualInvestmentReturnRatePercent: 12,
    });
    expect(issues2.some((i) => i.field === 'annualLoanInterestRatePercent')).toBe(true);

    // Out of bounds tenure (>30 years)
    const issues3 = validateLoanSipRecoveryInputs({
      loanPrincipal: 1_000_000,
      annualLoanInterestRatePercent: 8.5,
      loanTenureYears: 35,
      sipMode: 'PERCENTAGE_OF_EMI',
      sipPercentageOfEmi: 15,
      annualInvestmentReturnRatePercent: 12,
    });
    expect(issues3.some((i) => i.field === 'loanTenureYears')).toBe(true);

    // Excessive SIP percentage (>100%)
    const issues4 = validateLoanSipRecoveryInputs({
      loanPrincipal: 1_000_000,
      annualLoanInterestRatePercent: 8.5,
      loanTenureYears: 15,
      sipMode: 'PERCENTAGE_OF_EMI',
      sipPercentageOfEmi: 150,
      annualInvestmentReturnRatePercent: 12,
    });
    expect(issues4.some((i) => i.field === 'sipPercentageOfEmi')).toBe(true);

    // Throw on calculate if invalid
    expect(() =>
      calculateLoanSipRecovery({
        loanPrincipal: -100,
        annualLoanInterestRatePercent: 8.5,
        loanTenureYears: 15,
        sipMode: 'PERCENTAGE_OF_EMI',
        sipPercentageOfEmi: 15,
        annualInvestmentReturnRatePercent: 12,
      })
    ).toThrow(/Validation failed/);
  });
});
