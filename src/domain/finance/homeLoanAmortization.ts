/**
 * Home Loan Amortization and Reducing-Balance Engine
 *
 * Implements standard monthly reducing-balance amortization schedules, fixed EMI calculation,
 * interest/principal splits, and part-prepayment scenarios (tenure reduction vs EMI reduction).
 *
 * Distinct from investment CAGR conventions, retail loan interest uses a nominal annual rate
 * divided by 12, with payments occurring at the end of each monthly period.
 * Processing fees, statutory taxes, insurance premiums, and penalties are explicitly excluded.
 */

import { assertFinite, assertPositive, assertPositiveInteger, assertPositiveOrZero, FinanceValidationError } from './errors';

export type PrepaymentMode = 'REDUCE_TENURE' | 'REDUCE_EMI';

export interface PrepaymentEntry {
  /** Month index at which prepayment is executed (1-indexed) */
  readonly month: number;
  /** Extra lump-sum principal prepayment amount */
  readonly amount: number;
}

export interface HomeLoanAmortizationInputs {
  /** Loan principal amount in currency units (e.g., INR) */
  readonly principal: number;
  /** Quoted nominal annual interest rate as a percentage (e.g., 8.5 for 8.5% p.a.) */
  readonly annualInterestRatePercent: number;
  /** Loan duration in months */
  readonly tenureMonths: number;
  /** Optional part-prepayment schedule */
  readonly prepayments?: readonly PrepaymentEntry[];
  /** Strategy when prepayments occur: REDUCE_TENURE (default) or REDUCE_EMI */
  readonly prepaymentMode?: PrepaymentMode;
}

export interface LoanScheduleMonth {
  readonly month: number;
  readonly openingBalance: number;
  readonly interestAccrued: number;
  readonly scheduledPrincipal: number;
  readonly scheduledEMI: number;
  readonly prepayment: number;
  readonly totalPayment: number;
  readonly closingBalance: number;
}

export interface HomeLoanAmortizationResult {
  readonly initialPrincipal: number;
  readonly annualInterestRatePercent: number;
  readonly originalTenureMonths: number;
  readonly effectiveTenureMonths: number;
  readonly initialMonthlyEMI: number;
  readonly totalScheduledInterest: number;
  readonly totalInterestPaid: number;
  readonly totalPrepaymentsPaid: number;
  readonly totalAmountPaid: number;
  readonly interestSavings: number;
  readonly schedule: readonly LoanScheduleMonth[];
}

/**
 * Computes standard fixed monthly EMI using reducing-balance formula.
 *
 * EMI = P * (i * (1+i)^n) / ((1+i)^n - 1)
 * Limit when i = 0: EMI = P / n
 */
export function calculateMonthlyEMI(principal: number, annualInterestRatePercent: number, tenureMonths: number): number {
  assertFinite(principal, 'principal');
  assertPositive(principal, 'principal');
  assertFinite(annualInterestRatePercent, 'annualInterestRatePercent');
  assertPositiveOrZero(annualInterestRatePercent, 'annualInterestRatePercent');
  assertPositiveInteger(tenureMonths, 'tenureMonths');

  if (annualInterestRatePercent === 0) {
    return principal / tenureMonths;
  }

  const monthlyRate = (annualInterestRatePercent / 100) / 12;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return principal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Generates month-by-month loan amortization schedule, tracking interest accrual,
 * principal amortization, and the financial impact of part-prepayments.
 */
export function calculateHomeLoanAmortization(inputs: HomeLoanAmortizationInputs): HomeLoanAmortizationResult {
  const {
    principal,
    annualInterestRatePercent,
    tenureMonths,
    prepayments = [],
    prepaymentMode = 'REDUCE_TENURE',
  } = inputs;

  assertFinite(principal, 'principal');
  assertPositive(principal, 'principal');
  assertFinite(annualInterestRatePercent, 'annualInterestRatePercent');
  assertPositiveOrZero(annualInterestRatePercent, 'annualInterestRatePercent');
  if (annualInterestRatePercent > 100) {
    throw new FinanceValidationError('annualInterestRatePercent', annualInterestRatePercent, 'Loan interest rate cannot exceed 100%');
  }
  assertPositiveInteger(tenureMonths, 'tenureMonths');

  // Validate prepayments
  const prepayMap = new Map<number, number>();
  for (let i = 0; i < prepayments.length; i++) {
    const p = prepayments[i];
    assertPositiveInteger(p.month, `prepayments[${i}].month`);
    if (p.month > tenureMonths) {
      throw new FinanceValidationError(`prepayments[${i}].month`, p.month, `Prepayment month cannot exceed tenure (${tenureMonths})`);
    }
    assertFinite(p.amount, `prepayments[${i}].amount`);
    assertPositive(p.amount, `prepayments[${i}].amount`);
    prepayMap.set(p.month, (prepayMap.get(p.month) || 0) + p.amount);
  }

  const monthlyRate = (annualInterestRatePercent / 100) / 12;
  const initialEMI = calculateMonthlyEMI(principal, annualInterestRatePercent, tenureMonths);

  // Baseline scenario (without prepayments) for interest savings comparison
  let baselineTotalInterest = 0;
  {
    let bBalance = principal;
    for (let m = 1; m <= tenureMonths; m++) {
      const bInterest = bBalance * monthlyRate;
      const bPrincipal = Math.min(bBalance, initialEMI - bInterest);
      baselineTotalInterest += bInterest;
      bBalance -= bPrincipal;
      if (bBalance <= 1e-7) break;
    }
  }

  const schedule: LoanScheduleMonth[] = [];
  let currentBalance = principal;
  let currentEMI = initialEMI;
  let totalInterest = 0;
  let totalPrepayments = 0;
  let totalPayments = 0;

  for (let month = 1; month <= tenureMonths; month++) {
    if (currentBalance <= 1e-7) {
      break;
    }

    const openingBalance = currentBalance;
    const interestAccrued = openingBalance * monthlyRate;
    totalInterest += interestAccrued;

    // Scheduled payment cannot exceed opening balance + accrued interest
    const scheduledPayment = Math.min(currentEMI, openingBalance + interestAccrued);
    const scheduledPrincipal = scheduledPayment - interestAccrued;

    let balanceAfterScheduled = openingBalance - scheduledPrincipal;
    if (balanceAfterScheduled < 0) balanceAfterScheduled = 0;

    // Apply prepayment for this month if any
    let extraPrepay = prepayMap.get(month) || 0;
    if (extraPrepay > balanceAfterScheduled) {
      extraPrepay = balanceAfterScheduled; // Cap prepayment at remaining balance
    }

    totalPrepayments += extraPrepay;
    const monthTotalPayment = scheduledPayment + extraPrepay;
    totalPayments += monthTotalPayment;

    const closingBalance = balanceAfterScheduled - extraPrepay;
    currentBalance = closingBalance <= 1e-7 ? 0 : closingBalance;

    schedule.push({
      month,
      openingBalance,
      interestAccrued,
      scheduledPrincipal,
      scheduledEMI: scheduledPayment,
      prepayment: extraPrepay,
      totalPayment: monthTotalPayment,
      closingBalance: currentBalance,
    });

    if (currentBalance === 0) {
      break;
    }

    // Recalculate EMI if in REDUCE_EMI mode and prepayment was applied
    if (prepaymentMode === 'REDUCE_EMI' && extraPrepay > 0) {
      const remainingMonths = tenureMonths - month;
      if (remainingMonths > 0) {
        currentEMI = calculateMonthlyEMI(currentBalance, annualInterestRatePercent, remainingMonths);
      }
    }
  }

  const effectiveTenureMonths = schedule.length;
  const interestSavings = Math.max(0, baselineTotalInterest - totalInterest);

  return {
    initialPrincipal: principal,
    annualInterestRatePercent,
    originalTenureMonths: tenureMonths,
    effectiveTenureMonths,
    initialMonthlyEMI: initialEMI,
    totalScheduledInterest: baselineTotalInterest,
    totalInterestPaid: totalInterest,
    totalPrepaymentsPaid: totalPrepayments,
    totalAmountPaid: totalPayments,
    interestSavings,
    schedule,
  };
}
