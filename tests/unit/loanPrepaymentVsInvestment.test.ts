import { describe, expect, it } from 'vitest';
import {
  calculateLoanPrepaymentVsInvestment,
  FinanceValidationError,
  type LoanPrepaymentVsInvestmentInputs,
} from '../../src/domain/finance';

describe('Home Loan Foreclosure vs Parallel Investment Engine (loanPrepaymentVsInvestment)', () => {
  describe('1. Authoritative Registered Vectors (VEC-LOAN-VS-INV-1 to 5)', () => {
    it('VEC-LOAN-VS-INV-1: Zero Surplus Baseline (both options identical, diff = 0)', () => {
      const inputs: LoanPrepaymentVsInvestmentInputs = {
        principal: 120_000,
        annualLoanInterestRatePercent: 12,
        remainingTenureMonths: 12,
        monthlySurplus: 0,
        annualInvestmentReturnPercent: 12,
        oneTimeSurpluses: [],
      };

      const result = calculateLoanPrepaymentVsInvestment(inputs);

      // Baseline EMI: 120000 * 0.01 * 1.01^12 / (1.01^12 - 1) = 10661.8546
      expect(result.originalMonthlyEMI).toBeCloseTo(10661.8546, 4);
      expect(result.baselineTotalInterest).toBeCloseTo(7942.2557, 4);

      // Scenario A
      expect(result.scenarioA.loanPayoffMonth).toBe(12);
      expect(result.scenarioA.monthsSaved).toBe(0);
      expect(result.scenarioA.totalInterestPaid).toBeCloseTo(7942.2557, 4);
      expect(result.scenarioA.interestSaved).toBeCloseTo(0.0, 4);
      expect(result.scenarioA.totalInvestedCapital).toBe(0);
      expect(result.scenarioA.finalInvestmentCorpus).toBe(0);
      expect(result.scenarioA.endingLoanBalance).toBe(0);

      // Scenario B
      expect(result.scenarioB.loanPayoffMonth).toBe(12);
      expect(result.scenarioB.monthsSaved).toBe(0);
      expect(result.scenarioB.totalInterestPaid).toBeCloseTo(7942.2557, 4);
      expect(result.scenarioB.interestSaved).toBe(0);
      expect(result.scenarioB.totalInvestedCapital).toBe(0);
      expect(result.scenarioB.finalInvestmentCorpus).toBe(0);
      expect(result.scenarioB.endingLoanBalance).toBe(0);

      expect(result.netFinancialDifference).toBeCloseTo(0.0, 4);
    });

    it('VEC-LOAN-VS-INV-2: Zero Interest & Zero Return (proves budget fairness & principal conservation)', () => {
      const inputs: LoanPrepaymentVsInvestmentInputs = {
        principal: 120_000,
        annualLoanInterestRatePercent: 0,
        remainingTenureMonths: 12,
        monthlySurplus: 2_000,
        annualInvestmentReturnPercent: 0,
        oneTimeSurpluses: [],
      };

      const result = calculateLoanPrepaymentVsInvestment(inputs);

      expect(result.originalMonthlyEMI).toBe(10_000);
      expect(result.baselineTotalInterest).toBe(0);

      // Scenario A: 12,000/mo pays off 120k in month 10. Months 11-12 invest 12k/mo = 24k
      expect(result.scenarioA.loanPayoffMonth).toBe(10);
      expect(result.scenarioA.monthsSaved).toBe(2);
      expect(result.scenarioA.totalInterestPaid).toBe(0);
      expect(result.scenarioA.interestSaved).toBe(0);
      expect(result.scenarioA.totalInvestedCapital).toBe(24_000);
      expect(result.scenarioA.finalInvestmentCorpus).toBe(24_000);

      // Scenario B: invests 2k/mo * 12 = 24k
      expect(result.scenarioB.loanPayoffMonth).toBe(12);
      expect(result.scenarioB.monthsSaved).toBe(0);
      expect(result.scenarioB.totalInterestPaid).toBe(0);
      expect(result.scenarioB.totalInvestedCapital).toBe(24_000);
      expect(result.scenarioB.finalInvestmentCorpus).toBe(24_000);

      expect(result.netFinancialDifference).toBe(0);
      expect(result.totalHouseholdBudget).toBe(144_000);
      expect(result.totalSurplusProvided).toBe(24_000);
    });

    it('VEC-LOAN-VS-INV-3: Positive Loan Rate & Zero Return (interest saved translates 1:1 into invested capital)', () => {
      const inputs: LoanPrepaymentVsInvestmentInputs = {
        principal: 240_000,
        annualLoanInterestRatePercent: 12,
        remainingTenureMonths: 12,
        monthlySurplus: 10_000,
        annualInvestmentReturnPercent: 0,
        oneTimeSurpluses: [],
      };

      const result = calculateLoanPrepaymentVsInvestment(inputs);

      expect(result.originalMonthlyEMI).toBeCloseTo(21323.7093, 4);
      expect(result.baselineTotalInterest).toBeCloseTo(15884.5114, 4);

      // Scenario A pays off in Month 9
      expect(result.scenarioA.loanPayoffMonth).toBe(9);
      expect(result.scenarioA.monthsSaved).toBe(3);
      expect(result.scenarioA.totalInterestPaid).toBeCloseTo(10940.8244, 4);
      expect(result.scenarioA.interestSaved).toBeCloseTo(4943.6870, 4);
      expect(result.scenarioA.totalInvestedCapital).toBeCloseTo(124943.6870, 4);
      expect(result.scenarioA.finalInvestmentCorpus).toBeCloseTo(124943.6870, 4);
      expect(result.scenarioA.totalInvestmentGrowth).toBe(0);

      // Scenario B
      expect(result.scenarioB.totalInvestedCapital).toBe(120_000);
      expect(result.scenarioB.finalInvestmentCorpus).toBe(120_000);
      expect(result.scenarioB.totalInvestmentGrowth).toBe(0);

      // Exact mathematical identity: investedA - investedB == interestSaved
      expect(result.netFinancialDifference).toBeCloseTo(4943.6870, 4);
      expect(result.scenarioA.totalInvestedCapital - result.scenarioB.totalInvestedCapital).toBeCloseTo(
        result.scenarioA.interestSaved,
        4
      );
    });

    it('VEC-LOAN-VS-INV-4: Positive Loan Rate & 12% EAR Return (geometric compounding)', () => {
      const inputs: LoanPrepaymentVsInvestmentInputs = {
        principal: 240_000,
        annualLoanInterestRatePercent: 12,
        remainingTenureMonths: 12,
        monthlySurplus: 10_000,
        annualInvestmentReturnPercent: 12,
        oneTimeSurpluses: [],
      };

      const result = calculateLoanPrepaymentVsInvestment(inputs);

      expect(result.originalMonthlyEMI).toBeCloseTo(21323.7093, 4);
      expect(result.baselineTotalInterest).toBeCloseTo(15884.5114, 4);

      expect(result.scenarioA.loanPayoffMonth).toBe(9);
      expect(result.scenarioA.monthsSaved).toBe(3);
      expect(result.scenarioA.finalInvestmentCorpus).toBeCloseTo(126728.2489, 4);
      expect(result.scenarioA.totalInvestmentGrowth).toBeCloseTo(1784.5620, 4);

      // Scenario B matches closed-form ordinary annuity: 10000 * 0.12 / ((1.12)^(1/12) - 1)
      expect(result.scenarioB.totalInvestedCapital).toBe(120_000);
      expect(result.scenarioB.finalInvestmentCorpus).toBeCloseTo(126464.9791, 4);
      expect(result.scenarioB.totalInvestmentGrowth).toBeCloseTo(6464.9791, 4);

      expect(result.netFinancialDifference).toBeCloseTo(263.2699, 4);
    });

    it('VEC-LOAN-VS-INV-5: One-Time Surplus Cash Injection (Month 3: 50,000)', () => {
      const inputs: LoanPrepaymentVsInvestmentInputs = {
        principal: 240_000,
        annualLoanInterestRatePercent: 12,
        remainingTenureMonths: 12,
        monthlySurplus: 10_000,
        annualInvestmentReturnPercent: 12,
        oneTimeSurpluses: [{ id: 'lum-1', month: 3, amount: 50_000 }],
      };

      const result = calculateLoanPrepaymentVsInvestment(inputs);

      expect(result.totalSurplusProvided).toBe(170_000);
      expect(result.scenarioA.loanPayoffMonth).toBe(7);
      expect(result.scenarioA.monthsSaved).toBe(5);
      expect(result.scenarioA.totalInterestPaid).toBeCloseTo(8593.5691, 4);
      expect(result.scenarioA.interestSaved).toBeCloseTo(7290.9422, 4);

      expect(result.scenarioA.finalInvestmentCorpus).toBeCloseTo(181291.0919, 4);
      expect(result.scenarioB.finalInvestmentCorpus).toBeCloseTo(180900.6427, 4);
      expect(result.netFinancialDifference).toBeCloseTo(390.4493, 4);
    });
  });

  describe('2. Invariant & Conservation Tests', () => {
    it('verifies exact household monthly cash budget reconciliation for every month', () => {
      const inputs: LoanPrepaymentVsInvestmentInputs = {
        principal: 500_000,
        annualLoanInterestRatePercent: 8.5,
        remainingTenureMonths: 60,
        monthlySurplus: 5_000,
        annualInvestmentReturnPercent: 10,
        oneTimeSurpluses: [
          { id: '1', month: 12, amount: 25_000 },
          { id: '2', month: 24, amount: 50_000 },
        ],
      };

      const result = calculateLoanPrepaymentVsInvestment(inputs);

      for (const row of result.schedule) {
        // Scenario A conservation: EMI + Prepay + Invested == Budget
        const totalA =
          row.scenarioA.scheduledEMI +
          row.scenarioA.principalPrepayment +
          row.scenarioA.investmentContribution;
        expect(totalA).toBeCloseTo(row.monthlyBudget, 4);

        // Scenario B conservation: EMI + Invested == Budget
        const totalB = row.scenarioB.scheduledEMI + row.scenarioB.investmentContribution;
        expect(totalB).toBeCloseTo(row.monthlyBudget, 4);

        // Balances never negative
        expect(row.scenarioA.closingLoanBalance).toBeGreaterThanOrEqual(0);
        expect(row.scenarioB.closingLoanBalance).toBeGreaterThanOrEqual(0);
        expect(row.scenarioA.closingInvestmentBalance).toBeGreaterThanOrEqual(0);
        expect(row.scenarioB.closingInvestmentBalance).toBeGreaterThanOrEqual(0);
      }
    });

    it('aggregates same-month one-time surplus entries additively', () => {
      const inputsSeparate: LoanPrepaymentVsInvestmentInputs = {
        principal: 200_000,
        annualLoanInterestRatePercent: 9,
        remainingTenureMonths: 24,
        monthlySurplus: 2_000,
        annualInvestmentReturnPercent: 11,
        oneTimeSurpluses: [
          { id: 'a', month: 6, amount: 10_000 },
          { id: 'b', month: 6, amount: 15_000 },
        ],
      };

      const inputsCombined: LoanPrepaymentVsInvestmentInputs = {
        principal: 200_000,
        annualLoanInterestRatePercent: 9,
        remainingTenureMonths: 24,
        monthlySurplus: 2_000,
        annualInvestmentReturnPercent: 11,
        oneTimeSurpluses: [{ id: 'ab', month: 6, amount: 25_000 }],
      };

      const resSeparate = calculateLoanPrepaymentVsInvestment(inputsSeparate);
      const resCombined = calculateLoanPrepaymentVsInvestment(inputsCombined);

      expect(resSeparate.scenarioA.finalInvestmentCorpus).toBeCloseTo(
        resCombined.scenarioA.finalInvestmentCorpus,
        4
      );
      expect(resSeparate.scenarioB.finalInvestmentCorpus).toBeCloseTo(
        resCombined.scenarioB.finalInvestmentCorpus,
        4
      );
    });

    it('does not mutate input objects', () => {
      const oneTime = [{ id: 'fix-1', month: 4, amount: 20_000 }];
      const inputs: LoanPrepaymentVsInvestmentInputs = {
        principal: 300_000,
        annualLoanInterestRatePercent: 8,
        remainingTenureMonths: 36,
        monthlySurplus: 4_000,
        annualInvestmentReturnPercent: 9,
        oneTimeSurpluses: oneTime,
      };

      const originalSnapshot = JSON.stringify(inputs);
      calculateLoanPrepaymentVsInvestment(inputs);
      expect(JSON.stringify(inputs)).toBe(originalSnapshot);
    });

    it('handles large surplus that pays off loan in month 1 and invests remainder', () => {
      const inputs: LoanPrepaymentVsInvestmentInputs = {
        principal: 100_000,
        annualLoanInterestRatePercent: 12,
        remainingTenureMonths: 12,
        monthlySurplus: 150_000, // surplus exceeds total principal
        annualInvestmentReturnPercent: 12,
      };

      const result = calculateLoanPrepaymentVsInvestment(inputs);

      expect(result.scenarioA.loanPayoffMonth).toBe(1);
      expect(result.scenarioA.monthsSaved).toBe(11);
      expect(result.scenarioA.endingLoanBalance).toBe(0);
      expect(result.schedule[0].scenarioA.closingLoanBalance).toBe(0);
      expect(result.schedule[0].scenarioA.investmentContribution).toBeGreaterThan(0);
    });
  });

  describe('3. Boundary Rejection & Error Handling', () => {
    it('rejects non-positive principal', () => {
      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: 0,
          annualLoanInterestRatePercent: 9,
          remainingTenureMonths: 24,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: 10,
        })
      ).toThrow(FinanceValidationError);

      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: -50000,
          annualLoanInterestRatePercent: 9,
          remainingTenureMonths: 24,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: 10,
        })
      ).toThrow(FinanceValidationError);
    });

    it('rejects tenure outside 1 to 360 months or fractional tenure', () => {
      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: 100_000,
          annualLoanInterestRatePercent: 9,
          remainingTenureMonths: 0,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: 10,
        })
      ).toThrow(FinanceValidationError);

      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: 100_000,
          annualLoanInterestRatePercent: 9,
          remainingTenureMonths: 361,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: 10,
        })
      ).toThrow(FinanceValidationError);

      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: 100_000,
          annualLoanInterestRatePercent: 9,
          remainingTenureMonths: 12.5,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: 10,
        })
      ).toThrow(FinanceValidationError);
    });

    it('rejects invalid loan interest rate (> 100% or negative)', () => {
      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: 100_000,
          annualLoanInterestRatePercent: -1,
          remainingTenureMonths: 12,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: 10,
        })
      ).toThrow(FinanceValidationError);

      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: 100_000,
          annualLoanInterestRatePercent: 105,
          remainingTenureMonths: 12,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: 10,
        })
      ).toThrow(FinanceValidationError);
    });

    it('rejects invalid investment return rate (< 0 or > 100)', () => {
      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: 100_000,
          annualLoanInterestRatePercent: 8,
          remainingTenureMonths: 12,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: -2,
        })
      ).toThrow(FinanceValidationError);

      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: 100_000,
          annualLoanInterestRatePercent: 8,
          remainingTenureMonths: 12,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: 120,
        })
      ).toThrow(FinanceValidationError);
    });

    it('rejects one-time surplus with month outside tenure, negative amount, or invalid id', () => {
      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: 100_000,
          annualLoanInterestRatePercent: 8,
          remainingTenureMonths: 12,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: 10,
          oneTimeSurpluses: [{ id: 'bad', month: 13, amount: 5000 }],
        })
      ).toThrow(FinanceValidationError);

      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: 100_000,
          annualLoanInterestRatePercent: 8,
          remainingTenureMonths: 12,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: 10,
          oneTimeSurpluses: [{ id: 'bad', month: 0, amount: 5000 }],
        })
      ).toThrow(FinanceValidationError);

      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: 100_000,
          annualLoanInterestRatePercent: 8,
          remainingTenureMonths: 12,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: 10,
          oneTimeSurpluses: [{ id: 'bad', month: 5, amount: -100 }],
        })
      ).toThrow(FinanceValidationError);

      expect(() =>
        calculateLoanPrepaymentVsInvestment({
          principal: 100_000,
          annualLoanInterestRatePercent: 8,
          remainingTenureMonths: 12,
          monthlySurplus: 1000,
          annualInvestmentReturnPercent: 10,
          oneTimeSurpluses: [{ id: '', month: 5, amount: 1000 }],
        })
      ).toThrow(FinanceValidationError);
    });
  });

  describe('4. Remediation Invariant Tests (Prompt 12)', () => {
    it('preserves residual cash in payoff month when injection exceeds remaining debt', () => {
      // 100k principal, 12 months, 0% loan interest -> EMI 8,333.3333
      // In month 2, huge lump sum of 150,000 is injected.
      // Payoff needed in month 2 is ~91,666.67.
      // Total budget in month 2 = 8,333.33 + 150,000 = 158,333.33.
      // Entire remaining debt is cleared, and all residual unspent budget is invested at month end.
      const result = calculateLoanPrepaymentVsInvestment({
        principal: 100_000,
        annualLoanInterestRatePercent: 0,
        remainingTenureMonths: 12,
        monthlySurplus: 0,
        annualInvestmentReturnPercent: 12,
        oneTimeSurpluses: [{ id: 'ot-huge', month: 2, amount: 150_000 }],
      });

      expect(result.scenarioA.loanPayoffMonth).toBe(2);
      expect(result.scenarioA.endingLoanBalance).toBe(0);

      // Verify Month 2 row: actualEmi + prepay + invested == monthlyBudget
      const month2Row = result.schedule[1];
      const sumAllocated =
        month2Row.scenarioA.scheduledEMI +
        month2Row.scenarioA.principalPrepayment +
        month2Row.scenarioA.investmentContribution;
      expect(sumAllocated).toBeCloseTo(month2Row.monthlyBudget, 4);

      // Residual cash invested is strictly positive and equals monthlyBudget - total debt payoff
      expect(month2Row.scenarioA.investmentContribution).toBeGreaterThan(0);
      expect(month2Row.scenarioA.closingLoanBalance).toBe(0);
    });

    it('handles milestone injections after Strategy A has already cleared the loan transparently', () => {
      // Loan cleared in month 3, then extra injection in month 6
      const result = calculateLoanPrepaymentVsInvestment({
        principal: 60_000,
        annualLoanInterestRatePercent: 0,
        remainingTenureMonths: 12,
        monthlySurplus: 15_000, // Monthly budget = 5,000 + 15,000 = 20,000. Pays off 60k in 3 months.
        annualInvestmentReturnPercent: 0,
        oneTimeSurpluses: [{ id: 'ot-post', month: 6, amount: 30_000 }],
      });

      expect(result.scenarioA.loanPayoffMonth).toBe(3);
      expect(result.scenarioA.monthsSaved).toBe(9);

      // In month 6, loan is 0, so entire budget (5k EMI + 15k surplus + 30k injection = 50,000) must be invested
      const month6Row = result.schedule[5];
      expect(month6Row.monthlyBudget).toBe(50_000);
      expect(month6Row.scenarioA.scheduledEMI).toBe(0);
      expect(month6Row.scenarioA.principalPrepayment).toBe(0);
      expect(month6Row.scenarioA.investmentContribution).toBe(50_000);
      expect(month6Row.scenarioB.investmentContribution).toBe(45_000); // 15k surplus + 30k injection

      // Full horizon budget identity
      for (const row of result.schedule) {
        expect(
          row.scenarioA.scheduledEMI +
            row.scenarioA.principalPrepayment +
            row.scenarioA.investmentContribution
        ).toBeCloseTo(row.monthlyBudget, 4);
      }
    });

    it('verifies that output metrics reconcile to the schedule row sums within numerical tolerance', () => {
      const result = calculateLoanPrepaymentVsInvestment({
        principal: 500_000,
        annualLoanInterestRatePercent: 9.2,
        remainingTenureMonths: 36,
        monthlySurplus: 8_000,
        annualInvestmentReturnPercent: 11.5,
        oneTimeSurpluses: [
          { id: 'ot-1', month: 6, amount: 20_000 },
          { id: 'ot-2', month: 18, amount: 40_000 },
        ],
      });

      let sumBudget = 0;
      let sumInterestA = 0;
      let sumInterestB = 0;
      let sumInvestedA = 0;
      let sumInvestedB = 0;

      for (const row of result.schedule) {
        sumBudget += row.monthlyBudget;
        sumInterestA += row.scenarioA.loanInterest;
        sumInterestB += row.scenarioB.loanInterest;
        sumInvestedA += row.scenarioA.investmentContribution;
        sumInvestedB += row.scenarioB.investmentContribution;

        // Invariant: debt balance is never negative
        expect(row.scenarioA.closingLoanBalance).toBeGreaterThanOrEqual(0);
        expect(row.scenarioB.closingLoanBalance).toBeGreaterThanOrEqual(0);
      }

      expect(result.totalHouseholdBudget).toBeCloseTo(sumBudget, 4);
      expect(result.scenarioA.totalInterestPaid).toBeCloseTo(sumInterestA, 4);
      expect(result.scenarioB.totalInterestPaid).toBeCloseTo(sumInterestB, 4);
      expect(result.scenarioA.totalInvestedCapital).toBeCloseTo(sumInvestedA, 4);
      expect(result.scenarioB.totalInvestedCapital).toBeCloseTo(sumInvestedB, 4);
      expect(result.scenarioA.endingLoanBalance).toBe(0);
      expect(result.scenarioB.endingLoanBalance).toBe(0);
    });

    it('exposes updated, cautious limitations without old tax sections or unconditional RBI assertions', () => {
      const result = calculateLoanPrepaymentVsInvestment({
        principal: 100_000,
        annualLoanInterestRatePercent: 8,
        remainingTenureMonths: 12,
        monthlySurplus: 1000,
        annualInvestmentReturnPercent: 10,
      });

      const limitationsText = result.assumptions.limitations.join(' ');
      expect(limitationsText).toContain('Tax deductions and taxes on investment gains are not included');
      expect(limitationsText).toContain('This simulation excludes lender prepayment charges');
      expect(limitationsText).toContain("Prepaying reduces future loan interest under the loan's terms");
      expect(limitationsText).not.toContain('Section 24(b)');
      expect(limitationsText).not.toContain('Section 80C');
      expect(limitationsText).not.toContain('zero prepayment penalties per RBI guidelines');
    });
  });
});

