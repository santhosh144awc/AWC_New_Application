/**
 * Ant Wealth Creation — Home Loan Foreclosure vs Parallel Investment Engine
 *
 * Implements a transparent, month-by-month cash-flow comparison between:
 * 1. Scenario A: Prepaying home loan principal with available surplus cash, and upon full loan payoff,
 *    investing the entire freed household cash budget through the remainder of the original loan tenure.
 * 2. Scenario B: Continuing the scheduled home loan amortization and investing the surplus cash in parallel.
 *
 * Core Principles:
 * - Equal Household Cash Budget in every month: Baseline EMI + Monthly Surplus + One-Time Surplus.
 * - Common Comparison Horizon: Evaluated through the original scheduled loan tenure (remainingTenureMonths).
 * - Cash-Flow Timing: End-of-month contributions for both loan prepayments and investment deposits.
 * - Effective Annual Return (EAR) converted geometrically: i_inv = (1 + EAR)^(1/12) - 1. Never divided by 12.
 * - Excludes taxes, section deductions (GATE-A / GATE-C blocked), lender penalties, and insurance charges.
 */

import {
  assertLoanInterestRatePercent,
  assertPositive,
  assertPositiveInteger,
  assertPositiveOrZero,
  assertStandardInvestmentReturnPercent,
  FinanceValidationError,
} from './errors';
import { effectiveAnnualToMonthlyRate } from './investmentRates';

export interface OneTimeSurplusEntry {
  /** Unique client-side identifier for the entry */
  readonly id: string;
  /** Month index in which the cash injection occurs (1-indexed, 1 <= month <= remainingTenureMonths) */
  readonly month: number;
  /** Extra lump-sum cash surplus amount in INR (strictly positive) */
  readonly amount: number;
}

export interface LoanPrepaymentVsInvestmentInputs {
  /** Remaining home loan principal balance in INR (strictly positive, e.g., 10,000 to 50,00,00,000) */
  readonly principal: number;
  /** Quoted nominal annual interest rate on the home loan in percent (e.g., 8.5 for 8.5% p.a.) */
  readonly annualLoanInterestRatePercent: number;
  /** Remaining scheduled loan tenure in whole months (1 to 360 months) */
  readonly remainingTenureMonths: number;
  /** Monthly surplus cash available beyond the scheduled EMI in INR (>= 0) */
  readonly monthlySurplus: number;
  /** Assumed Effective Annual Return (EAR) on parallel investment in percent (0 to 100) */
  readonly annualInvestmentReturnPercent: number;
  /** Optional list of extra milestone cash injections scheduled at specific months */
  readonly oneTimeSurpluses?: readonly OneTimeSurplusEntry[];
}

export interface ScenarioMonthState {
  readonly openingLoanBalance: number;
  readonly loanInterest: number;
  readonly scheduledEMI: number;
  readonly principalPrepayment: number;
  readonly totalDebtPayment: number;
  readonly closingLoanBalance: number;
  readonly openingInvestmentBalance: number;
  readonly investmentContribution: number;
  readonly investmentGrowth: number;
  readonly closingInvestmentBalance: number;
  readonly netFinancialPosition: number;
}

export interface ComparisonScheduleMonth {
  readonly month: number;
  readonly monthlyBudget: number;
  readonly scenarioA: ScenarioMonthState;
  readonly scenarioB: ScenarioMonthState;
}

export interface ScenarioSummary {
  readonly loanPayoffMonth: number;
  readonly monthsSaved: number;
  readonly totalInterestPaid: number;
  readonly interestSaved: number;
  readonly totalInvestedCapital: number;
  readonly finalInvestmentCorpus: number;
  readonly totalInvestmentGrowth: number;
  readonly endingLoanBalance: number;
  readonly netFinancialPosition: number;
}

export interface LoanPrepaymentVsInvestmentResult {
  readonly originalMonthlyEMI: number;
  readonly baselineTotalInterest: number;
  readonly comparisonHorizonMonths: number;
  readonly totalSurplusProvided: number;
  readonly totalHouseholdBudget: number;
  readonly scenarioA: ScenarioSummary;
  readonly scenarioB: ScenarioSummary;
  readonly netFinancialDifference: number;
  readonly schedule: readonly ComparisonScheduleMonth[];
  readonly assumptions: {
    readonly annualLoanInterestRatePercent: number;
    readonly annualInvestmentReturnPercent: number;
    readonly monthlyInvestmentRatePercent: number;
    readonly timingConvention: string;
    readonly limitations: readonly string[];
  };
}

/**
 * Validates all inputs against consumer financial planning contracts.
 */
function validateInputs(inputs: LoanPrepaymentVsInvestmentInputs): void {
  assertPositive(inputs.principal, 'principal');
  assertLoanInterestRatePercent('annualLoanInterestRatePercent', inputs.annualLoanInterestRatePercent);
  assertPositiveInteger('remainingTenureMonths', inputs.remainingTenureMonths);
  
  if (inputs.remainingTenureMonths > 360) {
    throw new FinanceValidationError(
      'remainingTenureMonths',
      inputs.remainingTenureMonths,
      'Remaining loan tenure cannot exceed 360 months (30 years)'
    );
  }

  assertPositiveOrZero(inputs.monthlySurplus, 'monthlySurplus');
  assertStandardInvestmentReturnPercent('annualInvestmentReturnPercent', inputs.annualInvestmentReturnPercent);

  if (inputs.oneTimeSurpluses !== undefined) {
    if (!Array.isArray(inputs.oneTimeSurpluses)) {
      throw new FinanceValidationError('oneTimeSurpluses', inputs.oneTimeSurpluses, 'Must be an array if provided');
    }

    inputs.oneTimeSurpluses.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object') {
        throw new FinanceValidationError(`oneTimeSurpluses[${idx}]`, entry, 'Must be a valid object');
      }
      if (typeof entry.id !== 'string' || entry.id.trim() === '') {
        throw new FinanceValidationError(`oneTimeSurpluses[${idx}].id`, entry.id, 'Entry id must be a non-empty string');
      }
      assertPositiveInteger(`oneTimeSurpluses[${idx}].month`, entry.month);
      if (entry.month > inputs.remainingTenureMonths) {
        throw new FinanceValidationError(
          `oneTimeSurpluses[${idx}].month`,
          entry.month,
          `One-time surplus month cannot exceed remaining loan tenure (${inputs.remainingTenureMonths} months)`
        );
      }
      assertPositive(entry.amount, `oneTimeSurpluses[${idx}].amount`);
    });
  }
}

/**
 * Computes scheduled reducing-balance monthly EMI.
 */
function calculateScheduledEMI(principal: number, monthlyLoanRate: number, tenureMonths: number): number {
  if (monthlyLoanRate === 0) {
    return principal / tenureMonths;
  }
  const factor = Math.pow(1 + monthlyLoanRate, tenureMonths);
  return (principal * monthlyLoanRate * factor) / (factor - 1);
}

/**
 * Runs the Home Loan Foreclosure vs Parallel Investment simulation.
 */
export function calculateLoanPrepaymentVsInvestment(
  inputs: LoanPrepaymentVsInvestmentInputs
): LoanPrepaymentVsInvestmentResult {
  validateInputs(inputs);

  const {
    principal,
    annualLoanInterestRatePercent,
    remainingTenureMonths,
    monthlySurplus,
    annualInvestmentReturnPercent,
    oneTimeSurpluses = [],
  } = inputs;

  // Rate conversions
  const monthlyLoanRate = annualLoanInterestRatePercent / 1200;
  const monthlyInvestmentRate = effectiveAnnualToMonthlyRate(annualInvestmentReturnPercent);

  // Baseline scheduled EMI
  const originalMonthlyEMI = calculateScheduledEMI(principal, monthlyLoanRate, remainingTenureMonths);

  // Aggregate one-time surpluses by month
  const oneTimeMap = new Map<number, number>();
  for (const entry of oneTimeSurpluses) {
    const existing = oneTimeMap.get(entry.month) ?? 0;
    oneTimeMap.set(entry.month, existing + entry.amount);
  }

  // Pre-calculate baseline loan amortization to establish true baseline interest
  let baseBalance = principal;
  let baselineTotalInterest = 0;
  for (let m = 1; m <= remainingTenureMonths; m++) {
    const interest = baseBalance * monthlyLoanRate;
    baselineTotalInterest += interest;
    const payoffNeeded = baseBalance + interest;
    const actualEmi = Math.min(originalMonthlyEMI, payoffNeeded);
    baseBalance = payoffNeeded - actualEmi;
  }

  // Simulation state
  let loanBalanceA = principal;
  let totalInterestA = 0;
  let investmentCorpusA = 0;
  let totalInvestedA = 0;
  let payoffMonthA = remainingTenureMonths;
  let paidOffA = false;

  let loanBalanceB = principal;
  let totalInterestB = 0;
  let investmentCorpusB = 0;
  let totalInvestedB = 0;

  let totalSurplusProvided = 0;
  let totalHouseholdBudget = 0;

  const schedule: ComparisonScheduleMonth[] = [];

  for (let m = 1; m <= remainingTenureMonths; m++) {
    const oneTimeSurplusM = oneTimeMap.get(m) ?? 0;
    const monthlySurplusM = monthlySurplus + oneTimeSurplusM;
    const monthlyBudgetM = originalMonthlyEMI + monthlySurplusM;

    totalSurplusProvided += monthlySurplusM;
    totalHouseholdBudget += monthlyBudgetM;

    // --- Scenario A (Prepay, then invest freed cash) ---
    const openingLoanA = loanBalanceA;
    const openingInvA = investmentCorpusA;

    let interestA_m = 0;
    let actualEmiA_m = 0;
    let actualPrepayA_m = 0;
    let cashInvestedA_m = 0;

    if (loanBalanceA > 0) {
      interestA_m = loanBalanceA * monthlyLoanRate;
      totalInterestA += interestA_m;
      const payoffNeeded = loanBalanceA + interestA_m;

      if (payoffNeeded <= originalMonthlyEMI) {
        // Loan pays off with partial or exact EMI
        actualEmiA_m = payoffNeeded;
        actualPrepayA_m = 0;
        loanBalanceA = 0;
        cashInvestedA_m = monthlyBudgetM - actualEmiA_m;
        if (!paidOffA) {
          payoffMonthA = m;
          paidOffA = true;
        }
      } else {
        // Regular EMI paid
        actualEmiA_m = originalMonthlyEMI;
        const principalAfterEmi = payoffNeeded - actualEmiA_m;
        const availableSurplus = monthlyBudgetM - actualEmiA_m;

        if (availableSurplus >= principalAfterEmi) {
          // Prepayment pays off the remaining principal completely
          actualPrepayA_m = principalAfterEmi;
          loanBalanceA = 0;
          cashInvestedA_m = availableSurplus - actualPrepayA_m;
          if (!paidOffA) {
            payoffMonthA = m;
            paidOffA = true;
          }
        } else {
          actualPrepayA_m = availableSurplus;
          loanBalanceA = principalAfterEmi - actualPrepayA_m;
          cashInvestedA_m = 0;
        }
      }
    } else {
      // Loan already fully paid in an earlier month; invest entire freed budget
      interestA_m = 0;
      actualEmiA_m = 0;
      actualPrepayA_m = 0;
      loanBalanceA = 0;
      cashInvestedA_m = monthlyBudgetM;
    }

    if (loanBalanceA <= 1e-9) {
      loanBalanceA = 0;
      if (!paidOffA) {
        payoffMonthA = m;
        paidOffA = true;
      }
    }

    const invGrowthA_m = openingInvA * monthlyInvestmentRate;
    investmentCorpusA = openingInvA + invGrowthA_m + cashInvestedA_m;
    totalInvestedA += cashInvestedA_m;

    const totalDebtPaymentA_m = actualEmiA_m + actualPrepayA_m;
    const closingLoanA = loanBalanceA;
    const closingInvA = investmentCorpusA;

    // --- Scenario B (Maintain loan, invest surplus in parallel) ---
    const openingLoanB = loanBalanceB;
    const openingInvB = investmentCorpusB;

    const interestB_m = loanBalanceB * monthlyLoanRate;
    totalInterestB += interestB_m;
    const payoffNeededB = loanBalanceB + interestB_m;
    const actualEmiB_m = Math.min(originalMonthlyEMI, payoffNeededB);
    const actualPrepayB_m = 0;
    loanBalanceB = Math.max(0, payoffNeededB - actualEmiB_m);

    if (m === remainingTenureMonths || loanBalanceB <= 1e-4) {
      loanBalanceB = 0;
    }

    const cashInvestedB_m = monthlySurplusM;
    const invGrowthB_m = openingInvB * monthlyInvestmentRate;
    investmentCorpusB = openingInvB + invGrowthB_m + cashInvestedB_m;
    totalInvestedB += cashInvestedB_m;

    const totalDebtPaymentB_m = actualEmiB_m;
    const closingLoanB = loanBalanceB;
    const closingInvB = investmentCorpusB;

    schedule.push({
      month: m,
      monthlyBudget: monthlyBudgetM,
      scenarioA: {
        openingLoanBalance: openingLoanA,
        loanInterest: interestA_m,
        scheduledEMI: actualEmiA_m,
        principalPrepayment: actualPrepayA_m,
        totalDebtPayment: totalDebtPaymentA_m,
        closingLoanBalance: closingLoanA,
        openingInvestmentBalance: openingInvA,
        investmentContribution: cashInvestedA_m,
        investmentGrowth: invGrowthA_m,
        closingInvestmentBalance: closingInvA,
        netFinancialPosition: closingInvA - closingLoanA,
      },
      scenarioB: {
        openingLoanBalance: openingLoanB,
        loanInterest: interestB_m,
        scheduledEMI: actualEmiB_m,
        principalPrepayment: actualPrepayB_m,
        totalDebtPayment: totalDebtPaymentB_m,
        closingLoanBalance: closingLoanB,
        openingInvestmentBalance: openingInvB,
        investmentContribution: cashInvestedB_m,
        investmentGrowth: invGrowthB_m,
        closingInvestmentBalance: closingInvB,
        netFinancialPosition: closingInvB - closingLoanB,
      },
    });
  }

  const interestSavedA = Math.max(0, baselineTotalInterest - totalInterestA);
  const monthsSavedA = Math.max(0, remainingTenureMonths - payoffMonthA);

  const scenarioASummary: ScenarioSummary = {
    loanPayoffMonth: payoffMonthA,
    monthsSaved: monthsSavedA,
    totalInterestPaid: totalInterestA,
    interestSaved: interestSavedA,
    totalInvestedCapital: totalInvestedA,
    finalInvestmentCorpus: investmentCorpusA,
    totalInvestmentGrowth: Math.max(0, investmentCorpusA - totalInvestedA),
    endingLoanBalance: loanBalanceA,
    netFinancialPosition: investmentCorpusA - loanBalanceA,
  };

  const scenarioBSummary: ScenarioSummary = {
    loanPayoffMonth: remainingTenureMonths,
    monthsSaved: 0,
    totalInterestPaid: totalInterestB,
    interestSaved: 0,
    totalInvestedCapital: totalInvestedB,
    finalInvestmentCorpus: investmentCorpusB,
    totalInvestmentGrowth: Math.max(0, investmentCorpusB - totalInvestedB),
    endingLoanBalance: loanBalanceB,
    netFinancialPosition: investmentCorpusB - loanBalanceB,
  };

  const netFinancialDifference = scenarioASummary.netFinancialPosition - scenarioBSummary.netFinancialPosition;

  return {
    originalMonthlyEMI,
    baselineTotalInterest,
    comparisonHorizonMonths: remainingTenureMonths,
    totalSurplusProvided,
    totalHouseholdBudget,
    scenarioA: scenarioASummary,
    scenarioB: scenarioBSummary,
    netFinancialDifference,
    schedule,
    assumptions: {
      annualLoanInterestRatePercent,
      annualInvestmentReturnPercent,
      monthlyInvestmentRatePercent: monthlyInvestmentRate * 100,
      timingConvention: 'End-of-month contributions for both loan debt payments and investment deposits',
      limitations: [
        'Tax deductions and taxes on investment gains are not included. Tax treatment depends on the applicable tax year and individual circumstances; seek qualified advice.',
        'This simulation excludes lender prepayment charges. Actual eligibility and charges depend on the loan agreement, lender, loan type, and applicable RBI rules. Check the sanction letter/KFS or confirm with the lender.',
        "Prepaying reduces future loan interest under the loan's terms. The financial benefit depends on the loan's rate and schedule, applicable charges, and any tax effects. Investment growth is uncertain and can be negative.",
        'Prepaying debt commits capital into home equity. Before committing surplus funds to debt prepayment or market-linked investments, ensure you maintain an emergency reserve accessible for urgent family needs.',
      ],
    },
  };
}
