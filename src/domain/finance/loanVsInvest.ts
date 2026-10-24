/**
 * Ant Wealth Creation — Loan Prepayment vs Investment Trade-off Engine
 * 
 * Ported from verified legacy implementation (legacy-reference/AWC_Chatgpt).
 * 
 * Compares:
 * - Option A (Debt Foreclosure / Prepayment): Guaranteed interest reduction by applying lumpsum surplus.
 * - Option B (Wealth Creation / Parallel Investment): Compounding capital in diversified equity at expected return.
 */

export interface LoanVsInvestmentInput {
  loanAmount: number;
  loanInterestRate: number; // % p.a.
  loanTenureYears: number;
  lumpsumAvailable: number;
  expectedInvestmentReturn: number; // % p.a.
  investmentPeriodYears: number;
}

export interface LoanVsInvestmentResult {
  originalMonthlyEMI: number;
  originalTotalInterest: number;
  originalTotalPayment: number;

  // Option A: Prepayment
  prepaymentAmount: number;
  newMonthlyEMI: number;
  newTotalInterest: number;
  interestSavedByPrepayment: number;

  // Option B: Investing
  investmentFutureValue: number;
  investmentGain: number;

  // Comparison Summary
  netFinancialDifference: number; // Investment FV - (Lumpsum + Interest Saved)
  betterOption: 'Invest' | 'Prepay' | 'Balanced';
  summaryInsight: string;
}

export function calculateLoanVsInvestment(input: LoanVsInvestmentInput): LoanVsInvestmentResult {
  const {
    loanAmount,
    loanInterestRate,
    loanTenureYears,
    lumpsumAvailable,
    expectedInvestmentReturn,
    investmentPeriodYears
  } = input;

  // Monthly loan interest rate
  const monthlyLoanRate = (loanInterestRate > 0) ? loanInterestRate / 12 / 100 : 0;
  const totalMonths = Math.max(1, loanTenureYears * 12);

  // Original Loan EMI calculation: P * r * (1+r)^n / ((1+r)^n - 1)
  let originalMonthlyEMI = 0;
  let originalTotalPayment = 0;
  let originalTotalInterest = 0;

  if (monthlyLoanRate > 0 && loanAmount > 0) {
    const factor = Math.pow(1 + monthlyLoanRate, totalMonths);
    originalMonthlyEMI = Math.round((loanAmount * monthlyLoanRate * factor) / (factor - 1));
    originalTotalPayment = originalMonthlyEMI * totalMonths;
    originalTotalInterest = Math.max(0, originalTotalPayment - loanAmount);
  } else if (loanAmount > 0) {
    originalMonthlyEMI = Math.round(loanAmount / totalMonths);
    originalTotalPayment = loanAmount;
    originalTotalInterest = 0;
  }

  // Option A: Prepayment Analysis
  const validPrepayment = Math.min(loanAmount, Math.max(0, lumpsumAvailable));
  const newPrincipal = Math.max(0, loanAmount - validPrepayment);

  let newMonthlyEMI = 0;
  let newTotalPayment = 0;
  let newTotalInterest = 0;

  if (monthlyLoanRate > 0 && newPrincipal > 0) {
    const factor = Math.pow(1 + monthlyLoanRate, totalMonths);
    newMonthlyEMI = Math.round((newPrincipal * monthlyLoanRate * factor) / (factor - 1));
    newTotalPayment = newMonthlyEMI * totalMonths;
    newTotalInterest = Math.max(0, newTotalPayment - newPrincipal);
  } else if (newPrincipal > 0) {
    newMonthlyEMI = Math.round(newPrincipal / totalMonths);
    newTotalPayment = newPrincipal;
    newTotalInterest = 0;
  }

  const interestSavedByPrepayment = Math.max(0, originalTotalInterest - newTotalInterest);

  // Option B: Investment Analysis using compound interest: FV = P * (1 + r)^t
  const r = Math.max(0, expectedInvestmentReturn / 100);
  const t = Math.max(0, investmentPeriodYears);
  const investmentFutureValue = Math.round(validPrepayment * Math.pow(1 + r, t));
  const investmentGain = Math.max(0, investmentFutureValue - validPrepayment);

  // Comparison: Net benefit of investing over prepayment
  const netFinancialDifference = Math.round(investmentFutureValue - (validPrepayment + interestSavedByPrepayment));

  let betterOption: 'Invest' | 'Prepay' | 'Balanced' = 'Balanced';
  let summaryInsight = '';

  if (expectedInvestmentReturn > loanInterestRate + 2) {
    betterOption = 'Invest';
    summaryInsight = `Investing could yield an estimated ₹${Math.abs(netFinancialDifference).toLocaleString('en-IN')} more in wealth over ${investmentPeriodYears} years, assuming expected market returns.`;
  } else if (loanInterestRate >= expectedInvestmentReturn) {
    betterOption = 'Prepay';
    summaryInsight = `Prepaying your loan saves a guaranteed ₹${interestSavedByPrepayment.toLocaleString('en-IN')} in interest and eliminates monthly debt obligations immediately.`;
  } else {
    betterOption = 'Balanced';
    summaryInsight = `The return rates are close (${loanInterestRate}% loan vs ${expectedInvestmentReturn}% investment). A hybrid approach (partial prepayment + partial SIP) offers both debt reduction and wealth creation.`;
  }

  return {
    originalMonthlyEMI,
    originalTotalInterest,
    originalTotalPayment,
    prepaymentAmount: validPrepayment,
    newMonthlyEMI,
    newTotalInterest,
    interestSavedByPrepayment,
    investmentFutureValue,
    investmentGain,
    netFinancialDifference,
    betterOption,
    summaryInsight
  };
}
