import React, { useState, useId, useMemo } from 'react';
import {
  calculateLoanPrepaymentVsInvestment,
  type LoanPrepaymentVsInvestmentResult,
  type OneTimeSurplusEntry,
} from '../../domain/finance/loanPrepaymentVsInvestment';
import { formatINR, formatIndianCompact, formatPercentage } from '../../lib/formatters';

interface OneTimeUIItem {
  id: string;
  month: string;
  amount: string;
  label: string;
}

interface OneTimeRowError {
  monthError: string | null;
  amountError: string | null;
  labelError: string | null;
  isValid: boolean;
}

interface FormInputs {
  principal: string;
  annualLoanInterestRatePercent: string;
  remainingTenureYears: string;
  monthlySurplus: string;
  annualInvestmentReturnPercent: string;
}

const DEFAULT_INPUTS: FormInputs = {
  principal: '3000000', // ₹30 Lakhs
  annualLoanInterestRatePercent: '8.5', // 8.5% p.a.
  remainingTenureYears: '15', // 15 years = 180 months
  monthlySurplus: '10000', // ₹10,000/month
  annualInvestmentReturnPercent: '12.0', // 12% EAR
};

const DEFAULT_ONE_TIMES: OneTimeUIItem[] = [
  { id: 'ot-1', month: '12', amount: '100000', label: 'Year 1 Annual Bonus' },
];

export default function LoanPrepaymentVsInvestmentIsland(): React.JSX.Element {
  const [inputs, setInputs] = useState<FormInputs>(DEFAULT_INPUTS);
  const [oneTimes, setOneTimes] = useState<OneTimeUIItem[]>(DEFAULT_ONE_TIMES);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [showOneTimes, setShowOneTimes] = useState<boolean>(true);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const baseId = useId();

  // Parsing values
  const principalTrimmed = inputs.principal.trim();
  const loanRateTrimmed = inputs.annualLoanInterestRatePercent.trim();
  const tenureYearsTrimmed = inputs.remainingTenureYears.trim();
  const surplusTrimmed = inputs.monthlySurplus.trim();
  const returnTrimmed = inputs.annualInvestmentReturnPercent.trim();

  const principalNum = principalTrimmed === '' ? NaN : Number(principalTrimmed);
  const loanRateNum = loanRateTrimmed === '' ? NaN : Number(loanRateTrimmed);
  const tenureYearsNum = tenureYearsTrimmed === '' ? NaN : Number(tenureYearsTrimmed);
  const surplusNum = surplusTrimmed === '' ? NaN : Number(surplusTrimmed);
  const returnNum = returnTrimmed === '' ? NaN : Number(returnTrimmed);

  // Derived tenure in months (guarded to positive integer)
  const tenureMonths =
    Number.isFinite(tenureYearsNum) && tenureYearsNum >= 1 && tenureYearsNum <= 30
      ? Math.round(tenureYearsNum * 12)
      : 180;

  // Input validations aligned with 100% synchronized sliders
  const isPrincipalValid =
    principalTrimmed !== '' &&
    Number.isFinite(principalNum) &&
    principalNum >= 10000 &&
    principalNum <= 100000000;

  const isLoanRateValid =
    loanRateTrimmed !== '' &&
    Number.isFinite(loanRateNum) &&
    loanRateNum >= 0 &&
    loanRateNum <= 30;

  const isTenureValid =
    tenureYearsTrimmed !== '' &&
    Number.isFinite(tenureYearsNum) &&
    tenureYearsNum >= 1 &&
    tenureYearsNum <= 30 &&
    Number.isInteger(tenureYearsNum);

  const isSurplusValid =
    surplusTrimmed !== '' &&
    Number.isFinite(surplusNum) &&
    surplusNum >= 0 &&
    surplusNum <= 1000000;

  const isReturnValid =
    returnTrimmed !== '' &&
    Number.isFinite(returnNum) &&
    returnNum >= 0 &&
    returnNum <= 50;

  // Validate every visible one-time injection row individually
  const oneTimeRowErrors: Record<string, OneTimeRowError> = useMemo(() => {
    const errors: Record<string, OneTimeRowError> = {};

    for (const item of oneTimes) {
      const mTrimmed = item.month.trim();
      const mNum = mTrimmed === '' ? NaN : Number(mTrimmed);

      let monthError: string | null = null;
      if (mTrimmed === '') {
        monthError = 'Please enter an injection month.';
      } else if (!Number.isFinite(mNum) || !Number.isInteger(mNum) || mNum < 1) {
        monthError = 'Month must be a positive whole number (min 1).';
      } else if (mNum > tenureMonths) {
        monthError = `Month ${mNum} exceeds the current loan tenure of ${tenureMonths} months. Update the month or increase tenure.`;
      }

      const aTrimmed = item.amount.trim();
      const aNum = aTrimmed === '' ? NaN : Number(aTrimmed);

      let amountError: string | null = null;
      if (aTrimmed === '') {
        amountError = 'Please enter an injection amount.';
      } else if (!Number.isFinite(aNum) || aNum <= 0) {
        amountError = 'Amount must be strictly greater than ₹0.';
      } else if (aNum > 100000000) {
        amountError = 'Amount cannot exceed ₹10,00,00,000.';
      }

      let labelError: string | null = null;
      if (item.label.length > 60) {
        labelError = 'Label must be 60 characters or fewer.';
      }

      errors[item.id] = {
        monthError,
        amountError,
        labelError,
        isValid: !monthError && !amountError && !labelError,
      };
    }

    return errors;
  }, [oneTimes, tenureMonths]);

  const areOneTimesValid = useMemo(() => {
    return oneTimes.every((item) => oneTimeRowErrors[item.id]?.isValid);
  }, [oneTimes, oneTimeRowErrors]);

  // Never silently filter out visible rows: parse only when all visible rows are valid
  const parsedOneTimes: OneTimeSurplusEntry[] = useMemo(() => {
    if (!areOneTimesValid) return [];
    return oneTimes.map((item) => ({
      id: item.id,
      month: Number(item.month.trim()),
      amount: Number(item.amount.trim()),
    }));
  }, [oneTimes, areOneTimesValid]);

  const areBaseInputsValid =
    isPrincipalValid && isLoanRateValid && isTenureValid && isSurplusValid && isReturnValid;

  const areAllInputsValid = areBaseInputsValid && areOneTimesValid;

  // Calculate result safely
  const result: LoanPrepaymentVsInvestmentResult | null = useMemo(() => {
    if (!areAllInputsValid) return null;
    try {
      return calculateLoanPrepaymentVsInvestment({
        principal: principalNum,
        annualLoanInterestRatePercent: loanRateNum,
        remainingTenureMonths: tenureMonths,
        monthlySurplus: surplusNum,
        annualInvestmentReturnPercent: returnNum,
        oneTimeSurpluses: parsedOneTimes,
      });
    } catch {
      return null;
    }
  }, [
    areAllInputsValid,
    principalNum,
    loanRateNum,
    tenureMonths,
    surplusNum,
    returnNum,
    parsedOneTimes,
  ]);

  // Handlers for inputs
  const handleInputChange = (field: keyof FormInputs, value: string) => {
    setIsCustom(true);
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddOneTime = () => {
    setIsCustom(true);
    if (oneTimes.length >= 10) return;
    const newId = `ot-${Date.now()}`;
    const nextMonth = Math.min(12, tenureMonths);
    setOneTimes((prev) => [
      ...prev,
      { id: newId, month: String(nextMonth), amount: '50000', label: 'Extra Principal Prepayment' },
    ]);
  };

  const handleUpdateOneTime = (id: string, field: 'month' | 'amount' | 'label', val: string) => {
    setIsCustom(true);
    setOneTimes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveOneTime = (id: string) => {
    setIsCustom(true);
    setOneTimes((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReset = () => {
    setIsCustom(false);
    setInputs(DEFAULT_INPUTS);
    setOneTimes(DEFAULT_ONE_TIMES);
    setShowOneTimes(true);
    setShowSchedule(false);
  };

  const scrollToInputs = () => {
    const el = document.getElementById(`${baseId}-principal`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  const scrollToResults = () => {
    const el = document.getElementById('loan-outcome-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Synchronized bounded slider values
  const sliderPrincipalValue = Math.min(
    100000000,
    Math.max(10000, Number.isFinite(principalNum) ? principalNum : 10000)
  );
  const sliderLoanRateValue = Math.min(
    30,
    Math.max(0, Number.isFinite(loanRateNum) ? loanRateNum : 0)
  );
  const sliderTenureValue = Math.min(
    30,
    Math.max(1, Number.isFinite(tenureYearsNum) ? tenureYearsNum : 1)
  );
  const sliderSurplusValue = Math.min(
    1000000,
    Math.max(0, Number.isFinite(surplusNum) ? surplusNum : 0)
  );
  const sliderReturnValue = Math.min(
    50,
    Math.max(0, Number.isFinite(returnNum) ? returnNum : 0)
  );

  return (
    <div className="home-loan-workbench-wrapper" id="home-loan-foreclosure-calculator">
      {/* Mobile Live Result Summary (< 850px) */}
      <div className="mobile-result-summary" id="home-loan-mobile-summary" aria-label="Quick Investment Result">
        <div className="mobile-summary-header">
          <span className="mobile-summary-tag">
            {isCustom ? 'Custom scenario active' : 'Illustrative example'}
          </span>
          <span className="mobile-summary-subtitle">Estimated Net Difference</span>
        </div>

        <div className="mobile-summary-main">
          {areAllInputsValid && result ? (
            <>
              <div className="mobile-summary-value" id="home-loan-mobile-headline-val">
                {result.netFinancialDifference >= 0
                  ? `Strategy A ahead by ${formatINR(result.netFinancialDifference)}`
                  : `Strategy B ahead by ${formatINR(Math.abs(result.netFinancialDifference))}`}
              </div>
              <div className="mobile-summary-compact">
                Outcome at {tenureMonths} Months ({inputs.remainingTenureYears} Years) with same budget
              </div>
              <div className="mobile-summary-pills">
                <span className="mobile-pill">
                  Strategy A: {formatIndianCompact(result.scenarioA.netFinancialPosition)} net
                </span>
                <span className="mobile-pill highlight">
                  Strategy B: {formatIndianCompact(result.scenarioB.netFinancialPosition)} net
                </span>
              </div>
            </>
          ) : (
            <div className="mobile-summary-unavailable">
              <span>Simulation inputs need review</span>
            </div>
          )}
        </div>

        <div className="mobile-summary-actions">
          <button
            type="button"
            className="mobile-action-btn primary"
            id="mobile-adjust-assumptions-btn"
            onClick={scrollToInputs}
          >
            Adjust assumptions ↓
          </button>
          <button
            type="button"
            className="mobile-action-btn secondary"
            id="mobile-view-breakdown-btn"
            onClick={scrollToResults}
          >
            View full breakdown ↓
          </button>
        </div>
      </div>

      {/* Illustrative Example Notice Banner */}
      <div
        className={`workbench-notice-banner ${isCustom ? 'custom-active' : ''}`}
        id="loan-notice-banner"
        role="region"
        aria-label="Simulation Notice"
      >
        <div className="notice-icon" aria-hidden="true">
          {isCustom ? '⚙️' : 'ℹ️'}
        </div>
        <div className="notice-content">
          <strong>{isCustom ? 'Custom scenario active' : 'Illustrative example — not your figures'}</strong>
          <span className="notice-sub">
            {isCustom
              ? 'Results update automatically as you adjust mortgage balance, surplus, return, or milestone cash injections.'
              : 'Showing a starting scenario with ₹30L loan at 8.5% p.a., 15-year remaining term, ₹10,000/mo surplus, 12% investment return, and ₹1L injection at Month 12.'}
          </span>
        </div>
        {isCustom && (
          <button
            type="button"
            className="workbench-reset-btn"
            id="reset-loan-calc-btn"
            onClick={handleReset}
          >
            Reset to Illustrative Example
          </button>
        )}
      </div>

      {/* Main Two-Column Connected Workbench */}
      <div className="calc-layout-grid">
        {/* Left Column: Form Controls (1.08fr) */}
        <div className="calc-controls-col">
          <div className="calc-card">
            <h3 className="card-section-title">Core Mortgage & Investment Assumptions</h3>
            <p className="card-section-desc">
              Define your current home loan parameters and discretionary household cash flow.
            </p>

            {/* 1. Outstanding Principal */}
            <div className="input-group">
              <div className="input-header">
                <label htmlFor={`${baseId}-principal`} className="input-label">
                  Outstanding Home Loan Balance
                </label>
                <span className="input-hint">{formatIndianCompact(isPrincipalValid ? principalNum : 0)}</span>
              </div>
              <div className="input-affix-wrapper">
                <span className="input-prefix">₹</span>
                <input
                  id={`${baseId}-principal`}
                  type="number"
                  inputMode="numeric"
                  className={`input-field ${!isPrincipalValid && principalTrimmed !== '' ? 'input-error' : ''}`}
                  value={inputs.principal}
                  onChange={(e) => handleInputChange('principal', e.target.value)}
                  min={10000}
                  max={100000000}
                  step={10000}
                  aria-describedby={`${baseId}-principal-hint`}
                  aria-invalid={!isPrincipalValid && principalTrimmed !== ''}
                />
              </div>
              <input
                id={`${baseId}-principal-slider`}
                type="range"
                className="input-range-slider"
                value={sliderPrincipalValue}
                onChange={(e) => handleInputChange('principal', e.target.value)}
                min={10000}
                max={100000000}
                step={10000}
                aria-label="Outstanding Loan Principal Slider"
              />
              <div className="slider-ticks" aria-hidden="true">
                <span>₹10,000</span>
                <span>₹10 Cr</span>
              </div>
              <span id={`${baseId}-principal-hint`} className="helper-text">
                {!isPrincipalValid && principalTrimmed !== '' ? (
                  <span className="field-error" role="alert">
                    Please enter a loan balance between ₹10,000 and ₹10,00,00,000.
                  </span>
                ) : (
                  'Supported balance: ₹10,000 to ₹10,00,00,000 (₹10 Crore).'
                )}
              </span>
            </div>

            {/* 2. Loan Interest Rate */}
            <div className="input-group">
              <div className="input-header">
                <label htmlFor={`${baseId}-loan-rate`} className="input-label">
                  Annual Loan Interest Rate
                </label>
                <span className="input-hint">{formatPercentage(isLoanRateValid ? loanRateNum : 0)}</span>
              </div>
              <div className="input-affix-wrapper">
                <input
                  id={`${baseId}-loan-rate`}
                  type="number"
                  inputMode="decimal"
                  className={`input-field ${!isLoanRateValid && loanRateTrimmed !== '' ? 'input-error' : ''}`}
                  value={inputs.annualLoanInterestRatePercent}
                  onChange={(e) => handleInputChange('annualLoanInterestRatePercent', e.target.value)}
                  min={0}
                  max={30}
                  step={0.1}
                  aria-describedby={`${baseId}-loan-rate-hint`}
                  aria-invalid={!isLoanRateValid && loanRateTrimmed !== ''}
                />
                <span className="input-suffix">% p.a.</span>
              </div>
              <input
                id={`${baseId}-loan-rate-slider`}
                type="range"
                className="input-range-slider"
                value={sliderLoanRateValue}
                onChange={(e) => handleInputChange('annualLoanInterestRatePercent', e.target.value)}
                min={0}
                max={30}
                step={0.1}
                aria-label="Loan Interest Rate Slider"
              />
              <div className="slider-ticks" aria-hidden="true">
                <span>0%</span>
                <span>30% p.a. (Reducing Balance)</span>
              </div>
              <span id={`${baseId}-loan-rate-hint`} className="helper-text">
                {!isLoanRateValid && loanRateTrimmed !== '' ? (
                  <span className="field-error" role="alert">
                    Please enter an interest rate between 0.0% and 30.0% p.a.
                  </span>
                ) : (
                  'Quoted nominal annual interest rate on reducing balance.'
                )}
              </span>
            </div>

            {/* 3. Remaining Tenure */}
            <div className="input-group">
              <div className="input-header">
                <label htmlFor={`${baseId}-tenure`} className="input-label">
                  Remaining Loan Tenure (Years)
                </label>
                <span className="input-hint">{tenureMonths} Months ({inputs.remainingTenureYears} Yrs)</span>
              </div>
              <div className="input-affix-wrapper">
                <input
                  id={`${baseId}-tenure`}
                  type="number"
                  inputMode="numeric"
                  className={`input-field ${!isTenureValid && tenureYearsTrimmed !== '' ? 'input-error' : ''}`}
                  value={inputs.remainingTenureYears}
                  onChange={(e) => handleInputChange('remainingTenureYears', e.target.value)}
                  min={1}
                  max={30}
                  step={1}
                  aria-describedby={`${baseId}-tenure-hint`}
                  aria-invalid={!isTenureValid && tenureYearsTrimmed !== ''}
                />
                <span className="input-suffix">Years left</span>
              </div>
              <input
                id={`${baseId}-tenure-slider`}
                type="range"
                className="input-range-slider"
                value={sliderTenureValue}
                onChange={(e) => handleInputChange('remainingTenureYears', e.target.value)}
                min={1}
                max={30}
                step={1}
                aria-label="Remaining Loan Tenure Slider"
              />
              <div className="slider-ticks" aria-hidden="true">
                <span>1 Year</span>
                <span>30 Years Remaining</span>
              </div>
              <span id={`${baseId}-tenure-hint`} className="helper-text">
                {!isTenureValid && tenureYearsTrimmed !== '' ? (
                  <span className="field-error" role="alert">
                    Please enter whole years between 1 and 30.
                  </span>
                ) : (
                  'Time remaining on current mortgage, not original loan duration.'
                )}
              </span>
            </div>

            {/* 4. Monthly Cash Surplus */}
            <div className="input-group">
              <div className="input-header">
                <label htmlFor={`${baseId}-surplus`} className="input-label">
                  Extra Monthly Household Cash Surplus
                </label>
                <span className="input-hint">{formatIndianCompact(isSurplusValid ? surplusNum : 0)}</span>
              </div>
              <div className="input-affix-wrapper">
                <span className="input-prefix">₹</span>
                <input
                  id={`${baseId}-surplus`}
                  type="number"
                  inputMode="numeric"
                  className={`input-field ${!isSurplusValid && surplusTrimmed !== '' ? 'input-error' : ''}`}
                  value={inputs.monthlySurplus}
                  onChange={(e) => handleInputChange('monthlySurplus', e.target.value)}
                  min={0}
                  max={1000000}
                  step={1000}
                  aria-describedby={`${baseId}-surplus-hint`}
                  aria-invalid={!isSurplusValid && surplusTrimmed !== ''}
                />
              </div>
              <input
                id={`${baseId}-surplus-slider`}
                type="range"
                className="input-range-slider"
                value={sliderSurplusValue}
                onChange={(e) => handleInputChange('monthlySurplus', e.target.value)}
                min={0}
                max={1000000}
                step={1000}
                aria-label="Extra Monthly Household Cash Surplus Slider"
              />
              <div className="slider-ticks" aria-hidden="true">
                <span>₹0 (EMI Only)</span>
                <span>₹10,00,000/mo</span>
              </div>
              <span id={`${baseId}-surplus-hint`} className="helper-text">
                {!isSurplusValid && surplusTrimmed !== '' ? (
                  <span className="field-error" role="alert">
                    Please enter monthly surplus between ₹0 and ₹10,00,000.
                  </span>
                ) : (
                  'Discretionary cash you can commit each month beyond your baseline EMI.'
                )}
              </span>
            </div>

            {/* 5. Assumed Investment Return */}
            <div className="input-group">
              <div className="input-header">
                <label htmlFor={`${baseId}-return`} className="input-label">
                  Assumed Annual Investment Return (EAR)
                </label>
                <span className="input-hint">{formatPercentage(isReturnValid ? returnNum : 0)}</span>
              </div>
              <div className="input-affix-wrapper">
                <input
                  id={`${baseId}-return`}
                  type="number"
                  inputMode="decimal"
                  className={`input-field ${!isReturnValid && returnTrimmed !== '' ? 'input-error' : ''}`}
                  value={inputs.annualInvestmentReturnPercent}
                  onChange={(e) => handleInputChange('annualInvestmentReturnPercent', e.target.value)}
                  min={0}
                  max={50}
                  step={0.5}
                  aria-describedby={`${baseId}-return-hint`}
                  aria-invalid={!isReturnValid && returnTrimmed !== ''}
                />
                <span className="input-suffix">% p.a.</span>
              </div>
              <input
                id={`${baseId}-return-slider`}
                type="range"
                className="input-range-slider"
                value={sliderReturnValue}
                onChange={(e) => handleInputChange('annualInvestmentReturnPercent', e.target.value)}
                min={0}
                max={50}
                step={0.5}
                aria-label="Assumed Investment Return Slider"
              />
              <div className="slider-ticks" aria-hidden="true">
                <span>0%</span>
                <span>50% p.a.</span>
              </div>
              <span id={`${baseId}-return-hint`} className="helper-text">
                {!isReturnValid && returnTrimmed !== '' ? (
                  <span className="field-error" role="alert">
                    Please enter an assumed return between 0.0% and 50.0% p.a.
                  </span>
                ) : (
                  'Effective Annual Rate (EAR) converted via: i = (1 + r)^(1/12) - 1. End-of-month timing.'
                )}
              </span>
            </div>

            {/* Budget Fairness & Scope Callout */}
            <div className="budget-callout-box">
              <div className="callout-header">
                <span className="callout-icon">⚖️</span>
                <strong>Fair Comparison Rule & Scope Note</strong>
              </div>
              <p className="callout-text">
                Both strategies are modelled over the exact same <strong>{tenureMonths} months</strong> using the identical monthly cash budget (Scheduled EMI + Surplus). Once Strategy A clears the loan, that freed cash budget is invested.
              </p>
              <div className="scope-tag">Taxes and lender charges are excluded (GATE-C)</div>
            </div>
          </div>

          {/* Expandable Milestone One-Time Injections */}
          <div className="calc-card onetime-card" id="onetime-surplus-container">
            <div className="card-header-flex">
              <div>
                <h3 className="card-section-title">Milestone One-Time Capital Injections</h3>
                <p className="card-subtitle">
                  Include bonuses, incentives, or maturing deposits for extra principal prepayment or parallel investment.
                </p>
              </div>
              <div className="card-header-actions">
                <button
                  type="button"
                  id="toggle-onetime-surplus-btn"
                  className="btn-toggle-subtle"
                  onClick={() => setShowOneTimes((prev) => !prev)}
                  aria-expanded={showOneTimes}
                  aria-controls="onetime-list-section"
                >
                  {showOneTimes ? '▲ Collapse' : `▼ Expand (${oneTimes.length} Active)`}
                </button>
                {showOneTimes && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    id="add-onetime-row-btn"
                    onClick={handleAddOneTime}
                    disabled={oneTimes.length >= 10}
                    aria-label="Add a one-time cash injection"
                  >
                    + Add Injection
                  </button>
                )}
              </div>
            </div>

            {showOneTimes && (
              <div id="onetime-list-section">
                {oneTimes.length === 0 ? (
                  <div className="empty-notice">
                    <span>No one-time lump-sum injections scheduled. Click <strong>+ Add Injection</strong> to schedule milestone additions.</span>
                  </div>
                ) : (
                  <div className="one-time-list">
                {oneTimes.map((item, index) => {
                  const rowErr = oneTimeRowErrors[item.id];
                  const hasRowError = Boolean(rowErr && !rowErr.isValid);

                  return (
                    <div key={item.id} className="one-time-item-wrapper">
                      <div className={`one-time-row ${hasRowError ? 'row-has-error' : ''}`}>
                        <div className="one-time-field">
                          <label htmlFor={`${baseId}-ot-month-${item.id}`} className="sr-only">
                            Injection Month (1 to {tenureMonths})
                          </label>
                          <div className="input-affix-wrapper affix-sm">
                            <span className="input-prefix">Mo</span>
                            <input
                              id={`${baseId}-ot-month-${item.id}`}
                              type="number"
                              className={`input-field input-sm ${rowErr?.monthError ? 'input-error' : ''}`}
                              value={item.month}
                              onChange={(e) => handleUpdateOneTime(item.id, 'month', e.target.value)}
                              min={1}
                              max={tenureMonths}
                              placeholder="Month"
                              aria-invalid={Boolean(rowErr?.monthError)}
                              aria-describedby={rowErr?.monthError ? `${baseId}-ot-month-err-${item.id}` : undefined}
                            />
                          </div>
                        </div>

                        <div className="one-time-field flex-grow">
                          <label htmlFor={`${baseId}-ot-amount-${item.id}`} className="sr-only">
                            Injection Amount in Rupees
                          </label>
                          <div className="input-affix-wrapper affix-sm">
                            <span className="input-prefix">₹</span>
                            <input
                              id={`${baseId}-ot-amount-${item.id}`}
                              type="number"
                              className={`input-field input-sm ${rowErr?.amountError ? 'input-error' : ''}`}
                              value={item.amount}
                              onChange={(e) => handleUpdateOneTime(item.id, 'amount', e.target.value)}
                              min={1000}
                              step={5000}
                              placeholder="Amount"
                              aria-invalid={Boolean(rowErr?.amountError)}
                              aria-describedby={rowErr?.amountError ? `${baseId}-ot-amount-err-${item.id}` : undefined}
                            />
                          </div>
                        </div>

                        <div className="one-time-field flex-label">
                          <label htmlFor={`${baseId}-ot-label-${item.id}`} className="sr-only">
                            Injection Label or Note
                          </label>
                          <input
                            id={`${baseId}-ot-label-${item.id}`}
                            type="text"
                            className={`input-field input-sm ${rowErr?.labelError ? 'input-error' : ''}`}
                            value={item.label}
                            onChange={(e) => handleUpdateOneTime(item.id, 'label', e.target.value)}
                            placeholder="e.g. Annual Bonus"
                            aria-invalid={Boolean(rowErr?.labelError)}
                            aria-describedby={rowErr?.labelError ? `${baseId}-ot-label-err-${item.id}` : undefined}
                          />
                        </div>

                        <button
                          type="button"
                          className="btn-danger-icon"
                          onClick={() => handleRemoveOneTime(item.id)}
                          aria-label={`Remove injection row ${index + 1}`}
                          title="Remove row"
                        >
                          ×
                        </button>
                      </div>

                      {hasRowError && (
                        <div className="one-time-errors-list" role="alert">
                          {rowErr.monthError && (
                            <span id={`${baseId}-ot-month-err-${item.id}`} className="field-error">
                              • {rowErr.monthError}
                            </span>
                          )}
                          {rowErr.amountError && (
                            <span id={`${baseId}-ot-amount-err-${item.id}`} className="field-error">
                              • {rowErr.amountError}
                            </span>
                          )}
                          {rowErr.labelError && (
                            <span id={`${baseId}-ot-label-err-${item.id}`} className="field-error">
                              • {rowErr.labelError}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results & Projections (0.92fr) */}
        <div className="calc-results-col" id="loan-outcome-card">
          {areAllInputsValid && result ? (
            <div className="results-panel-card">
              {/* Primary Comparison Headline Outcome */}
              <div className="outcome-header">
                <span className="outcome-category-badge">Decision Analysis Result</span>
                <h3 className="outcome-primary-title">Estimated Difference in Net Financial Position</h3>
                <div className="outcome-headline-number" id="loan-outcome-headline">
                  {result.netFinancialDifference >= 0
                    ? `Strategy A ahead by ${formatINR(result.netFinancialDifference)}`
                    : `Strategy B ahead by ${formatINR(Math.abs(result.netFinancialDifference))}`}
                </div>
                <div className="outcome-compact-subtitle">
                  Outcome evaluated over {result.comparisonHorizonMonths} Months ({inputs.remainingTenureYears} Years) with identical household cash budget
                </div>
                <div className="horizon-pill">
                  Equal Monthly Budget: {formatINR(result.originalMonthlyEMI + (Number.isFinite(surplusNum) ? surplusNum : 0))}/mo + One-Time Surpluses
                </div>
              </div>

              {/* Baseline Mortgage Context */}
              <div className="baseline-banner">
                <div className="baseline-item">
                  <span className="baseline-label">Scheduled Monthly EMI</span>
                  <span className="baseline-val">{formatINR(result.originalMonthlyEMI)}</span>
                </div>
                <div className="baseline-item">
                  <span className="baseline-label">Baseline Total Interest</span>
                  <span className="baseline-val">{formatINR(result.baselineTotalInterest)}</span>
                </div>
                <div className="baseline-item">
                  <span className="baseline-label">Total Household Budget</span>
                  <span className="baseline-val">{formatINR(result.totalHouseholdBudget)}</span>
                </div>
                <div className="baseline-item">
                  <span className="baseline-label">Comparison Horizon</span>
                  <span className="baseline-val">{result.comparisonHorizonMonths} Months ({inputs.remainingTenureYears} Yrs)</span>
                </div>
              </div>

              {/* Side-by-Side Strategy Cards */}
              <div className="comparison-results-grid">
                {/* Strategy A */}
                <div className="result-strategy-card card-a">
                  <div className="card-header-badge">Strategy A</div>
                  <h4 className="result-card-heading">Prepay First, Then Invest</h4>

                  <div className="metric-row highlight">
                    <span className="m-label">Loan Cleared In</span>
                    <span className="m-val text-brand">
                      Month {result.scenarioA.loanPayoffMonth}{' '}
                      <small className="m-sub">
                        ({Math.floor(result.scenarioA.loanPayoffMonth / 12)}y {result.scenarioA.loanPayoffMonth % 12}m)
                      </small>
                    </span>
                  </div>

                  <div className="metric-row">
                    <span className="m-label">Time Saved off Mortgage</span>
                    <span className="m-val text-success">
                      {result.scenarioA.monthsSaved} Months ({(result.scenarioA.monthsSaved / 12).toFixed(1)} yrs)
                    </span>
                  </div>

                  <div className="metric-row">
                    <span className="m-label">Interest Paid to Bank</span>
                    <span className="m-val">{formatINR(result.scenarioA.totalInterestPaid)}</span>
                  </div>

                  <div className="metric-row">
                    <span className="m-label">Total Interest Saved</span>
                    <span className="m-val text-success">{formatINR(result.scenarioA.interestSaved)}</span>
                  </div>

                  <div className="metric-row">
                    <span className="m-label">Invested Post-Payoff</span>
                    <span className="m-val">{formatINR(result.scenarioA.totalInvestedCapital)}</span>
                  </div>

                  <div className="metric-row final-corpus-row">
                    <span className="m-label">Final Investment Corpus</span>
                    <span className="m-val m-large text-brand">{formatINR(result.scenarioA.finalInvestmentCorpus)}</span>
                  </div>

                  <div className="metric-row position-row">
                    <span className="m-label">Net Financial Position</span>
                    <span className="m-val font-semibold">{formatINR(result.scenarioA.netFinancialPosition)}</span>
                  </div>
                </div>

                {/* Strategy B */}
                <div className="result-strategy-card card-b">
                  <div className="card-header-badge">Strategy B</div>
                  <h4 className="result-card-heading">Invest Surplus Alongside Loan</h4>

                  <div className="metric-row highlight">
                    <span className="m-label">Loan Cleared In</span>
                    <span className="m-val">
                      Month {result.scenarioB.loanPayoffMonth}{' '}
                      <small className="m-sub">({inputs.remainingTenureYears} Years)</small>
                    </span>
                  </div>

                  <div className="metric-row">
                    <span className="m-label">Time Saved off Mortgage</span>
                    <span className="m-val text-muted">0 Months (Full Term)</span>
                  </div>

                  <div className="metric-row">
                    <span className="m-label">Interest Paid to Bank</span>
                    <span className="m-val">{formatINR(result.scenarioB.totalInterestPaid)}</span>
                  </div>

                  <div className="metric-row">
                    <span className="m-label">Total Interest Saved</span>
                    <span className="m-val text-muted">₹0 (Full Interest Paid)</span>
                  </div>

                  <div className="metric-row">
                    <span className="m-label">Invested Monthly</span>
                    <span className="m-val">{formatINR(result.scenarioB.totalInvestedCapital)}</span>
                  </div>

                  <div className="metric-row final-corpus-row">
                    <span className="m-label">Final Investment Corpus</span>
                    <span className="m-val m-large text-accent">{formatINR(result.scenarioB.finalInvestmentCorpus)}</span>
                  </div>

                  <div className="metric-row position-row">
                    <span className="m-label">Net Financial Position</span>
                    <span className="m-val font-semibold">{formatINR(result.scenarioB.netFinancialPosition)}</span>
                  </div>
                </div>
              </div>

              {/* Comparison Difference Summary Banner */}
              <div className="difference-summary-banner" role="region" aria-label="Comparison Summary">
                <div className="diff-header">
                  <span className="diff-title">Outcome at Common Horizon ({tenureMonths} Months):</span>
                  <span
                    className={`diff-pill ${
                      result.netFinancialDifference >= 0 ? 'pill-a' : 'pill-b'
                    }`}
                  >
                    {result.netFinancialDifference >= 0
                      ? `Strategy A ahead by ${formatINR(result.netFinancialDifference)}`
                      : `Strategy B ahead by ${formatINR(Math.abs(result.netFinancialDifference))}`}
                  </span>
                </div>
                <p className="diff-desc">
                  {result.netFinancialDifference >= 0 ? (
                    <>
                      By prepaying the loan, you save <strong>{formatINR(result.scenarioA.interestSaved)}</strong> in mortgage interest and eliminate debt <strong>{result.scenarioA.monthsSaved} months sooner</strong>. Reinvesting your freed household cash flow produces a final investment portfolio of <strong>{formatINR(result.scenarioA.finalInvestmentCorpus)}</strong>, surpassing parallel investing by <strong>{formatINR(result.netFinancialDifference)}</strong> under these specific assumptions.
                    </>
                  ) : (
                    <>
                      Parallel investing harnesses compound market growth for the entire {inputs.remainingTenureYears} years, accumulating <strong>{formatINR(result.scenarioB.finalInvestmentCorpus)}</strong>. This exceeds Strategy A's post-payoff portfolio by <strong>{formatINR(Math.abs(result.netFinancialDifference))}</strong>, provided your investments achieve the assumed <strong>{inputs.annualInvestmentReturnPercent}% annual return</strong>.
                    </>
                  )}
                </p>
              </div>

              {/* Collapsible Month-by-Month Progression Table */}
              <div className="schedule-section">
                <button
                  type="button"
                  id="toggle-loan-schedule-btn"
                  className="btn-toggle-schedule"
                  onClick={() => setShowSchedule((prev) => !prev)}
                  aria-expanded={showSchedule}
                  aria-controls="comparison-schedule-panel"
                >
                  {showSchedule ? '▲ Hide Month-by-Month Audit Schedule' : '▼ View Month-by-Month Audit Schedule'}
                </button>

                {showSchedule && (
                  <div
                    id="comparison-schedule-panel"
                    className="schedule-panel"
                    role="region"
                    aria-label="Month by month comparison progression"
                  >
                    <div className="table-responsive">
                      <table className="comparison-table" id="loan-schedule-table">
                        <thead>
                          <tr>
                            <th scope="col" rowSpan={2}>Mo</th>
                            <th scope="col" rowSpan={2}>Budget</th>
                            <th scope="col" colSpan={3} className="th-group-a">Strategy A (Prepay First)</th>
                            <th scope="col" colSpan={3} className="th-group-b">Strategy B (Invest Surplus)</th>
                          </tr>
                          <tr>
                            <th scope="col">Closing Loan</th>
                            <th scope="col">Invested</th>
                            <th scope="col">Closing Corpus</th>
                            <th scope="col">Closing Loan</th>
                            <th scope="col">Invested</th>
                            <th scope="col">Closing Corpus</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.schedule.map((row) => (
                            <tr key={row.month} className={row.month === result.scenarioA.loanPayoffMonth ? 'tr-payoff' : ''}>
                              <td className="td-month">
                                {row.month}
                                {row.month === result.scenarioA.loanPayoffMonth && (
                                  <span className="badge-payoff" title="Loan completely cleared">Paid</span>
                                )}
                              </td>
                              <td>{formatINR(row.monthlyBudget)}</td>
                              <td>{formatINR(row.scenarioA.closingLoanBalance)}</td>
                              <td>{formatINR(row.scenarioA.investmentContribution)}</td>
                              <td className="td-corpus-a">{formatINR(row.scenarioA.closingInvestmentBalance)}</td>
                              <td>{formatINR(row.scenarioB.closingLoanBalance)}</td>
                              <td>{formatINR(row.scenarioB.investmentContribution)}</td>
                              <td className="td-corpus-b">{formatINR(row.scenarioB.closingInvestmentBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Native <details> Methodology & Assumptions Disclosure */}
              <details className="methodology-details">
                <summary className="methodology-summary">
                  <span>Calculation Methodology, Assumptions & Limitations</span>
                  <span className="disclosure-chevron" aria-hidden="true">▾</span>
                </summary>
                <div className="methodology-content">
                  <p>
                    <strong>Fair Comparison Rule:</strong> Both options are evaluated over the exact same loan horizon ({result.comparisonHorizonMonths} months) with the exact same total household cash budget ({formatINR(result.totalHouseholdBudget)}) every month.
                  </p>
                  <p>
                    <strong>Investment Rate Conversion:</strong> The assumed annual investment return ({result.assumptions.annualInvestmentReturnPercent}%) is converted to a monthly geometric effective rate via <code>i = (1 + r)^(1/12) - 1</code> ({result.assumptions.monthlyInvestmentRatePercent.toFixed(4)}% per month). Cash flows are assumed at end-of-month timing.
                  </p>
                  <p>
                    <strong>Home Loan Reducing Balance:</strong> Monthly loan interest is calculated using standard reducing-balance amortization at {result.assumptions.annualLoanInterestRatePercent}% p.a. divided by 12.
                  </p>
                  <div className="limitations-box">
                    <strong>Model Limitations & Scope:</strong>
                    <ul className="limitations-list">
                      {result.assumptions.limitations.map((lim, idx) => (
                        <li key={idx}>{lim}</li>
                      ))}
                      <li>Tax deductions and taxes on investment gains are not included in this tool (GATE-C).</li>
                      <li>This simulation excludes lender prepayment charges, processing fees, and penalties.</li>
                    </ul>
                  </div>
                </div>
              </details>
            </div>
          ) : (
            <div className="calc-pending-card">
              <div className="pending-icon" aria-hidden="true">⚠️</div>
              <h4 className="pending-title">Simulation inputs need review</h4>
              <p className="pending-desc">
                Please correct the flagged inputs on the left to recalculate the loan prepayment vs parallel investment comparison.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .home-loan-workbench-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 16px;
        }

        /* Mobile Live Result Summary (< 850px) */
        .mobile-result-summary {
          display: none;
        }

        @media (max-width: 850px) {
          .mobile-result-summary {
            display: block;
            background-color: var(--awc-navy);
            color: #ffffff;
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 10px 28px rgba(23,48,71,.18);
          }

          .mobile-summary-header {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            margin-bottom: 12px;
          }

          @media (min-width: 380px) {
            .mobile-summary-header {
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              gap: 10px;
            }
          }

          .mobile-summary-tag {
            display: inline-block;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background-color: rgba(242, 198, 93, 0.18);
            color: var(--awc-gold);
            padding: 3px 10px;
            border-radius: 12px;
            white-space: nowrap;
            line-height: 1.2;
          }

          .mobile-summary-subtitle {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.75);
            white-space: nowrap;
          }

          .mobile-summary-value {
            font-size: clamp(20px, 6vw, 26px);
            font-weight: 900;
            color: var(--awc-gold);
            letter-spacing: -0.03em;
            line-height: 1.2;
            margin-bottom: 4px;
          }

          .mobile-summary-compact {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.85);
            margin-bottom: 12px;
          }

          .mobile-summary-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
          }

          .mobile-pill {
            font-size: 11px;
            font-weight: 700;
            background-color: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 8px;
          }

          .mobile-pill.highlight {
            background-color: rgba(207, 239, 227, 0.2);
            color: var(--awc-mint);
          }

          .mobile-summary-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .mobile-action-btn {
            min-height: 44px;
            padding: 10px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 750;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            transition: all 0.2s ease;
          }

          .mobile-action-btn.primary {
            background-color: var(--color-text-brand);
            color: #ffffff;
          }

          .mobile-action-btn.secondary {
            background-color: rgba(255, 255, 255, 0.15);
            color: #ffffff;
          }

          .mobile-summary-unavailable {
            padding: 16px 0;
            font-size: 13px;
            color: var(--awc-gold);
            font-weight: 700;
          }
        }

        /* Notice Banner */
        .workbench-notice-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          background-color: var(--awc-jade-soft);
          border: 1px solid rgba(22, 135, 126, 0.2);
          border-left: 4px solid var(--color-border-interactive);
          border-radius: 12px;
          font-size: 13px;
          color: var(--awc-navy);
        }

        .workbench-notice-banner.custom-active {
          background-color: #F8F9FA;
          border-left-color: var(--color-text-muted);
        }

        .notice-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .notice-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-grow: 1;
        }

        .notice-sub {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .workbench-reset-btn {
          background: none;
          border: 1px solid var(--awc-line);
          background-color: #ffffff;
          color: var(--color-text-brand);
          font-size: 12px;
          font-weight: 750;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .workbench-reset-btn:hover {
          border-color: var(--color-border-interactive);
          background-color: var(--awc-paper);
        }

        /* Two-Column Connected Workbench Grid */
        .calc-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (min-width: 851px) {
          .calc-layout-grid {
            grid-template-columns: 1.08fr 0.92fr;
            gap: 28px;
          }
        }

        .calc-card {
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 16px rgba(23, 48, 71, 0.04);
          margin-bottom: 24px;
        }

        .card-section-title {
          font-size: 18px;
          font-weight: 850;
          letter-spacing: -0.02em;
          color: var(--awc-navy);
          margin: 0 0 6px;
        }

        .card-section-desc {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0 0 20px;
        }

        .card-subtitle {
          font-size: 12.5px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .input-group {
          margin-bottom: 22px;
        }

        .input-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 6px;
        }

        .input-label {
          font-size: 13.5px;
          font-weight: 750;
          color: var(--awc-navy);
        }

        .input-hint {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-brand);
        }

        .input-affix-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-prefix {
          position: absolute;
          left: 14px;
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .input-suffix {
          position: absolute;
          right: 14px;
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .input-field {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          font-size: 15px;
          font-weight: 750;
          color: var(--awc-navy);
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .input-affix-wrapper .input-prefix ~ .input-field {
          padding-left: 32px;
        }

        .input-affix-wrapper .input-field ~ .input-suffix {
          padding-right: 48px;
        }

        .input-field:focus {
          outline: none;
          background-color: #ffffff;
          border-color: var(--color-border-interactive);
          box-shadow: 0 0 0 3px rgba(22, 135, 126, 0.15);
        }

        .input-field.input-error {
          border-color: #DC2626;
          background-color: #FEF2F2;
        }

        .input-range-slider {
          width: 100%;
          margin: 10px 0 4px;
          accent-color: var(--color-text-brand);
          cursor: pointer;
        }

        .slider-ticks {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--color-text-muted);
          margin-bottom: 4px;
        }

        .helper-text {
          font-size: 11.5px;
          color: var(--color-text-muted);
          line-height: 1.4;
          display: block;
        }

        .field-error {
          color: #DC2626;
          font-weight: 700;
        }

        /* Budget Fairness Callout */
        .budget-callout-box {
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 12px;
          padding: 16px;
          margin-top: 10px;
        }

        .callout-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--awc-navy);
          margin-bottom: 6px;
        }

        .callout-icon {
          font-size: 16px;
        }

        .callout-text {
          font-size: 12.5px;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0 0 8px;
        }

        .scope-tag {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          background-color: rgba(74, 96, 114, 0.1);
          padding: 3px 8px;
          border-radius: 6px;
        }

        /* Milestone Injections Card */
        .onetime-card {
          margin-bottom: 0;
        }

        .card-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        .btn-secondary {
          background-color: var(--awc-jade-soft);
          color: var(--color-text-brand);
          border: 1px solid rgba(22, 135, 126, 0.25);
          font-size: 12.5px;
          font-weight: 750;
          padding: 8px 14px;
          border-radius: 10px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: var(--color-text-brand);
          color: #ffffff;
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .card-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-toggle-subtle {
          background: none;
          border: 1px solid var(--awc-line);
          background-color: var(--awc-paper);
          color: var(--awc-navy);
          font-size: 12px;
          font-weight: 750;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .btn-toggle-subtle:hover {
          border-color: var(--color-border-interactive);
          color: var(--color-text-brand);
        }

        .empty-notice {
          font-size: 12.5px;
          color: var(--color-text-muted);
          padding: 16px;
          background-color: var(--awc-paper);
          border-radius: 10px;
          border: 1px dashed var(--awc-line);
        }

        .one-time-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .one-time-item-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .one-time-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .one-time-row.row-has-error {
          border-left: 3px solid #DC2626;
          padding-left: 6px;
        }

        .affix-sm .input-prefix {
          left: 10px;
          font-size: 12px;
        }

        .input-sm {
          height: 38px;
          font-size: 13px;
          padding: 0 10px;
        }

        .affix-sm .input-prefix ~ .input-sm {
          padding-left: 28px;
        }

        .flex-grow {
          flex: 1 1 120px;
        }

        .flex-label {
          flex: 1.2 1 140px;
        }

        .btn-danger-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #FEE2E2;
          color: #DC2626;
          border: 1px solid #FCA5A5;
          border-radius: 10px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-danger-icon:hover {
          background-color: #DC2626;
          color: #ffffff;
        }

        .one-time-errors-list {
          display: flex;
          flex-direction: column;
          font-size: 11.5px;
          padding-left: 4px;
        }

        /* Results Column (0.92fr Sticky Atlantic Navy) */
        .calc-results-col {
          position: sticky;
          top: 96px;
        }

        .results-panel-card {
          background-color: var(--awc-navy);
          color: #ffffff;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 12px 36px rgba(23, 48, 71, 0.16);
        }

        .outcome-header {
          margin-bottom: 20px;
        }

        .outcome-category-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--awc-gold);
          background-color: rgba(242, 198, 93, 0.15);
          padding: 4px 10px;
          border-radius: 12px;
          margin-bottom: 8px;
        }

        .outcome-primary-title {
          font-size: 14px;
          font-weight: 750;
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 6px;
        }

        .outcome-headline-number {
          font-size: clamp(24px, 3.2vw, 36px);
          font-weight: 900;
          color: var(--awc-gold);
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 6px;
        }

        .outcome-compact-subtitle {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.75);
          margin-bottom: 10px;
        }

        .horizon-pill {
          display: inline-block;
          font-size: 11.5px;
          font-weight: 700;
          background-color: rgba(207, 239, 227, 0.15);
          color: var(--awc-mint);
          padding: 5px 12px;
          border-radius: 10px;
        }

        /* Baseline Context Banner */
        .baseline-banner {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          background-color: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 20px;
        }

        .baseline-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .baseline-label {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.65);
        }

        .baseline-val {
          font-size: 13.5px;
          font-weight: 800;
          color: #ffffff;
        }

        /* Side-by-Side Comparison Cards Grid */
        .comparison-results-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 20px;
        }

        @media (max-width: 600px) {
          .comparison-results-grid {
            grid-template-columns: 1fr;
          }
        }

        .result-strategy-card {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .result-strategy-card.card-a {
          border-top: 3px solid var(--color-border-interactive);
        }

        .result-strategy-card.card-b {
          border-top: 3px solid var(--awc-gold);
        }

        .card-header-badge {
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.7);
        }

        .result-card-heading {
          font-size: 14.5px;
          font-weight: 850;
          color: #ffffff;
          margin: 0;
          line-height: 1.25;
        }

        .metric-row {
          display: flex;
          flex-direction: column;
          gap: 1px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 6px;
        }

        .metric-row.highlight {
          border-top: none;
          padding-top: 0;
        }

        .m-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.65);
        }

        .m-val {
          font-size: 13.5px;
          font-weight: 750;
          color: #ffffff;
        }

        .m-val.text-brand {
          color: var(--awc-mint);
        }

        .m-val.text-accent {
          color: var(--awc-gold);
        }

        .m-val.text-success {
          color: #6EE7B7;
        }

        .m-val.text-muted {
          color: rgba(255, 255, 255, 0.5);
        }

        .m-val.m-large {
          font-size: 16px;
          font-weight: 850;
        }

        .final-corpus-row {
          background-color: rgba(255, 255, 255, 0.04);
          padding: 8px 10px;
          border-radius: 8px;
          border-top: none;
        }

        .position-row {
          background-color: rgba(255, 255, 255, 0.08);
          padding: 8px 10px;
          border-radius: 8px;
          border-top: none;
        }

        .position-row .m-val {
          font-size: 15px;
          color: var(--awc-gold);
        }

        .m-sub {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
        }

        /* Outcome Difference Banner */
        .difference-summary-banner {
          background-color: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .diff-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .diff-title {
          font-size: 12.5px;
          font-weight: 750;
          color: rgba(255, 255, 255, 0.85);
        }

        .diff-pill {
          font-size: 12px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 8px;
        }

        .diff-pill.pill-a {
          background-color: rgba(22, 135, 126, 0.3);
          color: var(--awc-mint);
          border: 1px solid var(--color-border-interactive);
        }

        .diff-pill.pill-b {
          background-color: rgba(242, 198, 93, 0.25);
          color: var(--awc-gold);
          border: 1px solid rgba(242, 198, 93, 0.5);
        }

        .diff-desc {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.55;
          margin: 0;
        }

        /* Schedule Toggle & Table */
        .schedule-section {
          margin-bottom: 16px;
        }

        .btn-toggle-schedule {
          width: 100%;
          min-height: 44px;
          background-color: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          font-size: 13px;
          font-weight: 750;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-toggle-schedule:hover {
          background-color: rgba(255, 255, 255, 0.14);
        }

        .schedule-panel {
          margin-top: 12px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .table-responsive {
          overflow-x: auto;
          max-height: 380px;
          overflow-y: auto;
        }

        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.85);
        }

        .comparison-table th,
        .comparison-table td {
          padding: 6px 8px;
          text-align: right;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          white-space: nowrap;
        }

        .comparison-table th {
          position: sticky;
          top: 0;
          background-color: #112537;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 750;
        }

        .comparison-table th.th-group-a {
          background-color: rgba(22, 135, 126, 0.3);
          color: var(--awc-mint);
          text-align: center;
        }

        .comparison-table th.th-group-b {
          background-color: rgba(242, 198, 93, 0.25);
          color: var(--awc-gold);
          text-align: center;
        }

        .td-month {
          text-align: center !important;
          font-weight: 700;
        }

        .badge-payoff {
          font-size: 9px;
          font-weight: 800;
          background-color: #059669;
          color: #ffffff;
          padding: 2px 5px;
          border-radius: 4px;
          margin-left: 4px;
        }

        .tr-payoff {
          background-color: rgba(5, 150, 105, 0.15);
        }

        .td-corpus-a {
          color: var(--awc-mint);
          font-weight: 750;
        }

        .td-corpus-b {
          color: var(--awc-gold);
          font-weight: 750;
        }

        /* Methodology Details */
        .methodology-details {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 14px;
        }

        .methodology-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
          font-weight: 750;
          color: rgba(255, 255, 255, 0.75);
          cursor: pointer;
          list-style: none;
        }

        .methodology-summary::-webkit-details-marker {
          display: none;
        }

        .methodology-summary:hover {
          color: #ffffff;
        }

        .disclosure-chevron {
          transition: transform 0.2s ease;
        }

        .methodology-details[open] .disclosure-chevron {
          transform: rotate(180deg);
        }

        .methodology-content {
          padding-top: 12px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }

        .methodology-content code {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 2px 5px;
          border-radius: 4px;
          color: var(--awc-mint);
        }

        .limitations-box {
          background-color: rgba(0, 0, 0, 0.2);
          padding: 12px;
          border-radius: 8px;
          margin-top: 8px;
        }

        .limitations-list {
          margin: 6px 0 0 16px;
          padding: 0;
        }

        .limitations-list li {
          margin-bottom: 4px;
        }

        /* Fallback Card */
        .calc-pending-card {
          background-color: var(--awc-navy);
          color: #ffffff;
          border-radius: 20px;
          padding: 32px 24px;
          text-align: center;
        }

        .pending-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .pending-title {
          font-size: 16px;
          font-weight: 850;
          color: var(--awc-gold);
          margin: 0 0 8px;
        }

        .pending-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 600px) {
          .calc-card,
          .results-panel-card {
            padding: 18px 14px;
            border-radius: 16px;
          }

          .card-header-flex {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .card-header-actions {
            display: flex;
            justify-content: space-between;
            width: 100%;
          }

          .one-time-row {
            display: grid;
            grid-template-columns: 78px 1fr 38px;
            gap: 8px;
            align-items: center;
          }

          .one-time-field.flex-label {
            grid-column: 1 / -1;
            width: 100%;
          }

          .baseline-banner {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            padding: 12px;
          }

          .comparison-results-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
