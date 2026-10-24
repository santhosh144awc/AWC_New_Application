/**
 * Ant Wealth Creation — Home Loan + SIP Interest Recovery Engine
 *
 * ARCHITECTURAL CONTRACT:
 * 1. 100% pure TypeScript financial calculation engine.
 * 2. Zero UI, React, DOM, or storage imports.
 * 3. Clear monthly reducing-balance loan amortization alongside parallel compounding SIP.
 * 4. Distinctly separates invested SIP capital from investment growth (gains).
 * 5. Honest disclaimers: market returns fluctuate and are not guaranteed; loan interest is a fixed legal liability.
 */

export interface LoanSipRecoveryInputs {
  /** Loan principal amount borrowed in INR (e.g. 5,000,000 for ₹50 Lakhs) */
  readonly loanPrincipal: number;
  /** Quoted annual loan interest rate percentage (e.g. 8.5 for 8.5% p.a.) */
  readonly annualLoanInterestRatePercent: number;
  /** Loan tenure in years (e.g. 20) */
  readonly loanTenureYears: number;
  /** Input mode for parallel SIP: percentage of EMI or custom fixed monthly amount */
  readonly sipMode: 'PERCENTAGE_OF_EMI' | 'FIXED_AMOUNT';
  /** Parallel SIP percentage of monthly EMI (e.g. 15 for 15%) */
  readonly sipPercentageOfEmi?: number;
  /** Parallel fixed monthly SIP amount in INR (if sipMode === 'FIXED_AMOUNT') */
  readonly fixedMonthlySipAmount?: number;
  /** Assumed annual equity mutual fund return rate percentage (e.g. 12 for 12% p.a.) */
  readonly annualInvestmentReturnRatePercent: number;
}

export interface LoanSipMilestoneYear {
  readonly year: number;
  readonly month: number;
  readonly loanRemainingBalance: number;
  readonly cumulativeLoanInterestPaid: number;
  readonly cumulativeSipInvested: number;
  readonly estimatedSipCorpus: number;
  readonly estimatedSipGain: number;
}

export interface LoanSipRecoveryResult {
  readonly loanPrincipal: number;
  readonly annualLoanInterestRatePercent: number;
  readonly loanTenureYears: number;
  readonly loanTenureMonths: number;
  readonly monthlyEMI: number;
  readonly totalLoanRepayment: number;
  readonly totalLoanInterestPaid: number;

  readonly effectiveMonthlySip: number;
  readonly sipPercentageOfEmiActual: number;
  readonly annualInvestmentReturnRatePercent: number;
  readonly totalSipInvested: number;
  readonly estimatedSipCorpus: number;
  readonly estimatedSipGain: number;

  /** Difference between estimated SIP investment gains and total loan interest paid */
  readonly netGainVsInterestDiff: number;
  /** Net difference between total SIP maturity corpus and total loan cost (Principal + Interest) */
  readonly netCorpusVsTotalLoanDiff: number;
  /** Percentage of loan interest offset purely by investment gains (SIP Gain / Total Interest * 100) */
  readonly interestGainOffsetPercent: number;
  /** Percentage of loan interest offset by total SIP maturity corpus (SIP Corpus / Total Interest * 100) */
  readonly totalCorpusOffsetPercent: number;

  /** Breakeven monthly SIP needed so that SIP gain equals 100% of loan interest */
  readonly breakevenMonthlySip: number | null;
  /** Breakeven SIP as a percentage of monthly EMI */
  readonly breakevenSipPercentOfEmi: number | null;

  /** Yearly milestone snapshots throughout the tenure */
  readonly milestones: readonly LoanSipMilestoneYear[];
}

export interface ValidationIssue {
  readonly field: string;
  readonly message: string;
}

export const LOAN_SIP_RECOVERY_LIMITS = {
  MIN_PRINCIPAL: 100_000,          // ₹1 Lakh
  MAX_PRINCIPAL: 100_000_000,       // ₹10 Crores
  MIN_LOAN_RATE: 0.1,              // 0.1% p.a.
  MAX_LOAN_RATE: 25.0,             // 25.0% p.a.
  MIN_TENURE_YEARS: 1,             // 1 year
  MAX_TENURE_YEARS: 30,            // 30 years
  MIN_SIP_PERCENT: 1.0,            // 1% of EMI
  MAX_SIP_PERCENT: 100.0,          // 100% of EMI
  MIN_FIXED_SIP: 500,              // ₹500
  MAX_FIXED_SIP: 1_000_000,        // ₹10 Lakhs/month
  MIN_INVESTMENT_RETURN: 0.0,      // 0% p.a.
  MAX_INVESTMENT_RETURN: 30.0,     // 30% p.a.
} as const;

export const ILLUSTRATIVE_LOAN_SIP_RECOVERY_EXAMPLE: LoanSipRecoveryInputs = {
  loanPrincipal: 5_000_000,        // ₹50 Lakhs
  annualLoanInterestRatePercent: 8.5,
  loanTenureYears: 20,
  sipMode: 'PERCENTAGE_OF_EMI',
  sipPercentageOfEmi: 15,          // 15% of EMI
  annualInvestmentReturnRatePercent: 12.0,
};

/**
 * Validates loan and parallel SIP recovery inputs against safe mathematical boundaries.
 */
export function validateLoanSipRecoveryInputs(inputs: LoanSipRecoveryInputs): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Number.isFinite(inputs.loanPrincipal) || inputs.loanPrincipal < LOAN_SIP_RECOVERY_LIMITS.MIN_PRINCIPAL) {
    issues.push({ field: 'loanPrincipal', message: `Loan principal must be at least ₹${LOAN_SIP_RECOVERY_LIMITS.MIN_PRINCIPAL.toLocaleString('en-IN')}.` });
  } else if (inputs.loanPrincipal > LOAN_SIP_RECOVERY_LIMITS.MAX_PRINCIPAL) {
    issues.push({ field: 'loanPrincipal', message: `Loan principal cannot exceed ₹${(LOAN_SIP_RECOVERY_LIMITS.MAX_PRINCIPAL / 10_000_000).toFixed(0)} Crores.` });
  }

  if (!Number.isFinite(inputs.annualLoanInterestRatePercent) || inputs.annualLoanInterestRatePercent < LOAN_SIP_RECOVERY_LIMITS.MIN_LOAN_RATE || inputs.annualLoanInterestRatePercent > LOAN_SIP_RECOVERY_LIMITS.MAX_LOAN_RATE) {
    issues.push({ field: 'annualLoanInterestRatePercent', message: `Loan interest rate must be between ${LOAN_SIP_RECOVERY_LIMITS.MIN_LOAN_RATE}% and ${LOAN_SIP_RECOVERY_LIMITS.MAX_LOAN_RATE}%.` });
  }

  if (!Number.isFinite(inputs.loanTenureYears) || inputs.loanTenureYears < LOAN_SIP_RECOVERY_LIMITS.MIN_TENURE_YEARS || inputs.loanTenureYears > LOAN_SIP_RECOVERY_LIMITS.MAX_TENURE_YEARS) {
    issues.push({ field: 'loanTenureYears', message: `Loan tenure must be between ${LOAN_SIP_RECOVERY_LIMITS.MIN_TENURE_YEARS} and ${LOAN_SIP_RECOVERY_LIMITS.MAX_TENURE_YEARS} years.` });
  }

  if (inputs.sipMode === 'PERCENTAGE_OF_EMI') {
    const pct = inputs.sipPercentageOfEmi ?? 0;
    if (!Number.isFinite(pct) || pct < LOAN_SIP_RECOVERY_LIMITS.MIN_SIP_PERCENT || pct > LOAN_SIP_RECOVERY_LIMITS.MAX_SIP_PERCENT) {
      issues.push({ field: 'sipPercentageOfEmi', message: `SIP percentage must be between ${LOAN_SIP_RECOVERY_LIMITS.MIN_SIP_PERCENT}% and ${LOAN_SIP_RECOVERY_LIMITS.MAX_SIP_PERCENT}% of EMI.` });
    }
  } else {
    const fixed = inputs.fixedMonthlySipAmount ?? 0;
    if (!Number.isFinite(fixed) || fixed < LOAN_SIP_RECOVERY_LIMITS.MIN_FIXED_SIP || fixed > LOAN_SIP_RECOVERY_LIMITS.MAX_FIXED_SIP) {
      issues.push({ field: 'fixedMonthlySipAmount', message: `Monthly SIP amount must be between ₹${LOAN_SIP_RECOVERY_LIMITS.MIN_FIXED_SIP} and ₹${LOAN_SIP_RECOVERY_LIMITS.MAX_FIXED_SIP.toLocaleString('en-IN')}.` });
    }
  }

  if (!Number.isFinite(inputs.annualInvestmentReturnRatePercent) || inputs.annualInvestmentReturnRatePercent < LOAN_SIP_RECOVERY_LIMITS.MIN_INVESTMENT_RETURN || inputs.annualInvestmentReturnRatePercent > LOAN_SIP_RECOVERY_LIMITS.MAX_INVESTMENT_RETURN) {
    issues.push({ field: 'annualInvestmentReturnRatePercent', message: `Investment return rate must be between ${LOAN_SIP_RECOVERY_LIMITS.MIN_INVESTMENT_RETURN}% and ${LOAN_SIP_RECOVERY_LIMITS.MAX_INVESTMENT_RETURN}%.` });
  }

  return issues;
}

/**
 * Pure calculation engine for Home Loan amortization paired with parallel monthly SIP wealth accumulation.
 */
export function calculateLoanSipRecovery(inputs: LoanSipRecoveryInputs): LoanSipRecoveryResult {
  const issues = validateLoanSipRecoveryInputs(inputs);
  if (issues.length > 0) {
    throw new Error(`Validation failed: ${issues.map((i) => i.message).join(' ')}`);
  }

  const {
    loanPrincipal,
    annualLoanInterestRatePercent,
    loanTenureYears,
    sipMode,
    sipPercentageOfEmi,
    fixedMonthlySipAmount,
    annualInvestmentReturnRatePercent,
  } = inputs;

  const n = loanTenureYears * 12;
  const monthlyLoanRate = (annualLoanInterestRatePercent / 100) / 12;
  const monthlyInvestmentRate = (annualInvestmentReturnRatePercent / 100) / 12;

  // 1. Calculate Loan Monthly EMI
  let monthlyEMI: number;
  if (monthlyLoanRate > 0) {
    const factor = Math.pow(1 + monthlyLoanRate, n);
    monthlyEMI = (loanPrincipal * monthlyLoanRate * factor) / (factor - 1);
  } else {
    monthlyEMI = loanPrincipal / n;
  }

  const roundedEMI = Math.round(monthlyEMI);
  const totalLoanRepayment = roundedEMI * n;
  const totalLoanInterestPaid = Math.max(0, totalLoanRepayment - loanPrincipal);

  // 2. Calculate Effective Monthly SIP Amount
  let effectiveMonthlySip: number;
  if (sipMode === 'PERCENTAGE_OF_EMI') {
    const pct = sipPercentageOfEmi ?? 15;
    effectiveMonthlySip = Math.round((roundedEMI * pct) / 100);
  } else {
    effectiveMonthlySip = Math.round(fixedMonthlySipAmount ?? 5000);
  }

  const actualSipPercentOfEmi = roundedEMI > 0
    ? Number(((effectiveMonthlySip / roundedEMI) * 100).toFixed(2))
    : 0;

  // 3. Parallel SIP Compounding (Beginning-of-month annuity-due)
  let estimatedSipCorpus: number;
  if (monthlyInvestmentRate > 0) {
    const compFactor = Math.pow(1 + monthlyInvestmentRate, n);
    estimatedSipCorpus = effectiveMonthlySip * ((compFactor - 1) / monthlyInvestmentRate) * (1 + monthlyInvestmentRate);
  } else {
    estimatedSipCorpus = effectiveMonthlySip * n;
  }

  const roundedSipCorpus = Math.round(estimatedSipCorpus);
  const totalSipInvested = effectiveMonthlySip * n;
  const estimatedSipGain = Math.max(0, roundedSipCorpus - totalSipInvested);

  // 4. Comparison & Offset Metrics
  const netGainVsInterestDiff = estimatedSipGain - totalLoanInterestPaid;
  const netCorpusVsTotalLoanDiff = roundedSipCorpus - (loanPrincipal + totalLoanInterestPaid);

  const interestGainOffsetPercent = totalLoanInterestPaid > 0
    ? Number(((estimatedSipGain / totalLoanInterestPaid) * 100).toFixed(2))
    : 0;

  const totalCorpusOffsetPercent = totalLoanInterestPaid > 0
    ? Number(((roundedSipCorpus / totalLoanInterestPaid) * 100).toFixed(2))
    : 0;

  // 5. Breakeven Monthly SIP Solver (exact monthly SIP needed for SIP gain to match loan interest)
  let breakevenMonthlySip: number | null = null;
  let breakevenSipPercentOfEmi: number | null = null;

  if (monthlyInvestmentRate > 0 && totalLoanInterestPaid > 0) {
    const compFactor = Math.pow(1 + monthlyInvestmentRate, n);
    const unitGain = ((compFactor - 1) / monthlyInvestmentRate) * (1 + monthlyInvestmentRate) - n;
    if (unitGain > 0) {
      breakevenMonthlySip = Math.round(totalLoanInterestPaid / unitGain);
      breakevenSipPercentOfEmi = roundedEMI > 0
        ? Number(((breakevenMonthlySip / roundedEMI) * 100).toFixed(2))
        : null;
    }
  }

  // 6. Generate Milestone Snapshots (every 1 to 5 years depending on tenure, plus final year)
  const milestones: LoanSipMilestoneYear[] = [];
  let currentBalance = loanPrincipal;
  let cumInterest = 0;

  for (let m = 1; m <= n; m++) {
    const interestForMonth = currentBalance * monthlyLoanRate;
    const principalForMonth = m === n ? currentBalance : Math.min(currentBalance, roundedEMI - interestForMonth);
    cumInterest += interestForMonth;
    currentBalance = m === n ? 0 : Math.max(0, currentBalance - principalForMonth);

    // Record at annual boundaries and final month
    if (m % 12 === 0 || m === n) {
      const year = Math.ceil(m / 12);
      let sipCorpusAtMonth: number;
      if (monthlyInvestmentRate > 0) {
        const factorM = Math.pow(1 + monthlyInvestmentRate, m);
        sipCorpusAtMonth = effectiveMonthlySip * ((factorM - 1) / monthlyInvestmentRate) * (1 + monthlyInvestmentRate);
      } else {
        sipCorpusAtMonth = effectiveMonthlySip * m;
      }
      const roundedCorpusM = Math.round(sipCorpusAtMonth);
      const investedM = effectiveMonthlySip * m;

      milestones.push({
        year,
        month: m,
        loanRemainingBalance: Math.round(currentBalance),
        cumulativeLoanInterestPaid: Math.round(cumInterest),
        cumulativeSipInvested: investedM,
        estimatedSipCorpus: roundedCorpusM,
        estimatedSipGain: Math.max(0, roundedCorpusM - investedM),
      });
    }
  }

  return {
    loanPrincipal,
    annualLoanInterestRatePercent,
    loanTenureYears,
    loanTenureMonths: n,
    monthlyEMI: roundedEMI,
    totalLoanRepayment,
    totalLoanInterestPaid,
    effectiveMonthlySip,
    sipPercentageOfEmiActual: actualSipPercentOfEmi,
    annualInvestmentReturnRatePercent,
    totalSipInvested,
    estimatedSipCorpus: roundedSipCorpus,
    estimatedSipGain,
    netGainVsInterestDiff,
    netCorpusVsTotalLoanDiff,
    interestGainOffsetPercent,
    totalCorpusOffsetPercent,
    breakevenMonthlySip,
    breakevenSipPercentOfEmi,
    milestones,
  };
}
