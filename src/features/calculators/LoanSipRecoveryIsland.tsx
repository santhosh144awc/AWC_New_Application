import React, { useState, useMemo } from 'react';
import {
  calculateLoanSipRecovery,
  validateLoanSipRecoveryInputs,
  type LoanSipRecoveryInputs,
  type LoanSipRecoveryResult,
} from '../../domain/finance/loanSipRecovery';
import { formatINR, formatIndianCompact } from '../../lib/formatters';

interface FormState {
  loanPrincipal: string;
  annualLoanInterestRatePercent: string;
  loanTenureYears: string;
  sipMode: 'PERCENTAGE_OF_EMI' | 'FIXED_AMOUNT';
  sipPercentageOfEmi: string;
  fixedMonthlySipAmount: string;
  annualInvestmentReturnRatePercent: string;
}

const EMPTY_FORM_STATE: FormState = {
  loanPrincipal: '',
  annualLoanInterestRatePercent: '',
  loanTenureYears: '',
  sipMode: 'PERCENTAGE_OF_EMI',
  sipPercentageOfEmi: '',
  fixedMonthlySipAmount: '',
  annualInvestmentReturnRatePercent: '',
};

const DEFAULT_FORM_STATE: FormState = {
  loanPrincipal: '5000000', // ₹50 Lakhs
  annualLoanInterestRatePercent: '8.5',
  loanTenureYears: '20',
  sipMode: 'PERCENTAGE_OF_EMI',
  sipPercentageOfEmi: '15',
  fixedMonthlySipAmount: '6500',
  annualInvestmentReturnRatePercent: '12.0',
};

export default function LoanSipRecoveryIsland(): React.JSX.Element {
  const [form, setForm] = useState<FormState>(EMPTY_FORM_STATE);
  const [showMilestones, setShowMilestones] = useState<boolean>(false);

  const isBlank =
    form.loanPrincipal.trim() === '' &&
    form.annualLoanInterestRatePercent.trim() === '' &&
    form.loanTenureYears.trim() === '' &&
    form.sipPercentageOfEmi.trim() === '' &&
    form.fixedMonthlySipAmount.trim() === '' &&
    form.annualInvestmentReturnRatePercent.trim() === '';

  const principalNum = form.loanPrincipal.trim() === '' ? NaN : Number(form.loanPrincipal);
  const loanRateNum = form.annualLoanInterestRatePercent.trim() === '' ? NaN : Number(form.annualLoanInterestRatePercent);
  const tenureNum = form.loanTenureYears.trim() === '' ? NaN : Number(form.loanTenureYears);
  const sipPctNum = form.sipPercentageOfEmi.trim() === '' ? NaN : Number(form.sipPercentageOfEmi);
  const fixedSipNum = form.fixedMonthlySipAmount.trim() === '' ? NaN : Number(form.fixedMonthlySipAmount);
  const returnRateNum = form.annualInvestmentReturnRatePercent.trim() === '' ? NaN : Number(form.annualInvestmentReturnRatePercent);

  const inputs: LoanSipRecoveryInputs = useMemo(
    () => ({
      loanPrincipal: principalNum,
      annualLoanInterestRatePercent: loanRateNum,
      loanTenureYears: tenureNum,
      sipMode: form.sipMode,
      sipPercentageOfEmi: sipPctNum,
      fixedMonthlySipAmount: fixedSipNum,
      annualInvestmentReturnRatePercent: returnRateNum,
    }),
    [principalNum, loanRateNum, tenureNum, form.sipMode, sipPctNum, fixedSipNum, returnRateNum]
  );

  const validationIssues = useMemo(() => validateLoanSipRecoveryInputs(inputs), [inputs]);
  const isValid = validationIssues.length === 0;

  const result: LoanSipRecoveryResult | null = useMemo(() => {
    if (!isValid) return null;
    try {
      return calculateLoanSipRecovery(inputs);
    } catch {
      return null;
    }
  }, [isValid, inputs]);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoadSample = () => {
    setForm(DEFAULT_FORM_STATE);
    setShowMilestones(false);
  };

  const handleReset = () => {
    setForm(EMPTY_FORM_STATE);
    setShowMilestones(false);
  };

  return (
    <div className="recovery-workbench" id="loan-sip-recovery-calculator" data-testid="recovery-workbench">
      {/* Main 2-Column Connected Workbench */}
      <div className="workbench-grid">
        {/* Left Column: Standard Assumptions Card */}
        <section className="workbench-card surface controls-card" aria-labelledby="recovery-controls-heading">
          <div className="controls-header">
            <div>
              <h2 id="recovery-controls-heading" className="calc-title">Home Loan &amp; Parallel SIP</h2>
              <p className="calc-description">Enter your loan and parallel SIP details or load sample data.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleLoadSample}
                className="sample-btn"
                id="load-sample-recovery-btn"
                data-testid="load-sample-recovery-btn"
                aria-label="Load sample data"
              >
                Sample Data
              </button>
              {!isBlank && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="reset-btn"
                  id="recovery-reset-btn"
                  data-testid="recovery-reset-btn"
                  aria-label="Clear all inputs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="recovery-form">
            {/* 1. Loan Principal */}
            <div className="range-field">
              <div className="field-head">
                <div>
                  <label htmlFor="recovery-loan-amount" className="field-label">
                    Home Loan Principal
                  </label>
                  {Number.isFinite(principalNum) && principalNum > 0 && (
                    <span className="compact-pill">{formatIndianCompact(principalNum)}</span>
                  )}
                </div>
                <div className="input-with-symbol">
                  <span className="currency-prefix" aria-hidden="true">₹</span>
                  <input
                    type="number"
                    id="recovery-loan-amount"
                    placeholder="0"
                    value={form.loanPrincipal}
                    onChange={(e) => handleInputChange('loanPrincipal', e.target.value)}
                    min={100000}
                    max={100000000}
                    step={50000}
                    className="num-input"
                  />
                </div>
              </div>
              <input
                type="range"
                min={500000}
                max={20000000}
                step={100000}
                value={Number.isFinite(principalNum) && principalNum >= 500000 && principalNum <= 20000000 ? principalNum : 500000}
                onChange={(e) => handleInputChange('loanPrincipal', e.target.value)}
                className="range-slider"
                aria-label="Home Loan Principal slider"
              />
              <div className="range-ends">
                <span>₹5 Lakhs</span>
                <span>₹2 Crores</span>
              </div>
            </div>

            {/* 2. Loan Interest Rate */}
            <div className="range-field">
              <div className="field-head">
                <label htmlFor="recovery-interest-rate" className="field-label">
                  Annual Loan Interest Rate
                </label>
                <div className="input-with-symbol">
                  <input
                    type="number"
                    id="recovery-interest-rate"
                    placeholder="0"
                    value={form.annualLoanInterestRatePercent}
                    onChange={(e) => handleInputChange('annualLoanInterestRatePercent', e.target.value)}
                    min={0.1}
                    max={25.0}
                    step={0.1}
                    className="num-input"
                  />
                  <span className="percent-suffix" aria-hidden="true">%</span>
                </div>
              </div>
              <input
                type="range"
                min={6.0}
                max={15.0}
                step={0.1}
                value={Number.isFinite(loanRateNum) && loanRateNum >= 6 && loanRateNum <= 15 ? loanRateNum : 6.0}
                onChange={(e) => handleInputChange('annualLoanInterestRatePercent', e.target.value)}
                className="range-slider"
                aria-label="Annual loan interest rate slider"
              />
              <div className="range-ends">
                <span>6.0% p.a.</span>
                <span>15.0% p.a.</span>
              </div>
            </div>

            {/* 3. Loan Tenure */}
            <div className="range-field">
              <div className="field-head">
                <div>
                  <label htmlFor="recovery-tenure" className="field-label">
                    Loan Tenure
                  </label>
                  {Number.isFinite(tenureNum) && tenureNum > 0 && (
                    <span className="compact-pill">{tenureNum * 12} Months</span>
                  )}
                </div>
                <div className="input-with-symbol">
                  <input
                    type="number"
                    id="recovery-tenure"
                    placeholder="0"
                    value={form.loanTenureYears}
                    onChange={(e) => handleInputChange('loanTenureYears', e.target.value)}
                    min={1}
                    max={30}
                    step={1}
                    className="num-input"
                  />
                  <span className="unit-suffix" aria-hidden="true">Yrs</span>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={Number.isFinite(tenureNum) && tenureNum >= 1 && tenureNum <= 30 ? tenureNum : 1}
                onChange={(e) => handleInputChange('loanTenureYears', e.target.value)}
                className="range-slider"
                aria-label="Loan tenure slider"
              />
              <div className="range-ends">
                <span>1 Year</span>
                <span>30 Years</span>
              </div>
            </div>

            {/* 4. Parallel SIP Mode */}
            <div className="range-field">
              <div className="field-head" style={{ marginBottom: '8px' }}>
                <span className="field-label">Parallel Monthly SIP Mode</span>
              </div>
              <div className="mode-pill-group" role="radiogroup" aria-label="Parallel SIP calculation mode">
                <button
                  type="button"
                  role="radio"
                  data-testid="mode-pct"
                  aria-checked={form.sipMode === 'PERCENTAGE_OF_EMI'}
                  onClick={() => handleInputChange('sipMode', 'PERCENTAGE_OF_EMI')}
                  className={`mode-pill ${form.sipMode === 'PERCENTAGE_OF_EMI' ? 'active-pill' : ''}`}
                >
                  % of Monthly EMI
                </button>
                <button
                  type="button"
                  role="radio"
                  data-testid="mode-fixed"
                  aria-checked={form.sipMode === 'FIXED_AMOUNT'}
                  onClick={() => handleInputChange('sipMode', 'FIXED_AMOUNT')}
                  className={`mode-pill ${form.sipMode === 'FIXED_AMOUNT' ? 'active-pill' : ''}`}
                >
                  Fixed Rupee Amount
                </button>
              </div>
            </div>

            {/* 5. SIP Parameter */}
            {form.sipMode === 'PERCENTAGE_OF_EMI' ? (
              <div className="range-field">
                <div className="field-head">
                  <div>
                    <label htmlFor="recovery-sip-pct" className="field-label">
                      SIP as % of Monthly EMI
                    </label>
                    {result && (
                      <span className="compact-pill">{formatINR(result.effectiveMonthlySip)}/mo</span>
                    )}
                  </div>
                  <div className="input-with-symbol">
                    <input
                      type="number"
                      id="recovery-sip-pct"
                      placeholder="0"
                      value={form.sipPercentageOfEmi}
                      onChange={(e) => handleInputChange('sipPercentageOfEmi', e.target.value)}
                      min={1}
                      max={100}
                      step={1}
                      className="num-input"
                    />
                    <span className="percent-suffix" aria-hidden="true">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={1}
                  value={Number.isFinite(sipPctNum) && sipPctNum >= 5 && sipPctNum <= 50 ? sipPctNum : 5}
                  onChange={(e) => handleInputChange('sipPercentageOfEmi', e.target.value)}
                  className="range-slider"
                  aria-label="SIP percentage of EMI slider"
                />
                <div className="range-ends">
                  <span>5% of EMI</span>
                  <span>50% of EMI</span>
                </div>
              </div>
            ) : (
              <div className="range-field">
                <div className="field-head">
                  <label htmlFor="recovery-sip-amount" className="field-label">
                    Monthly SIP Amount
                  </label>
                  <div className="input-with-symbol">
                    <span className="currency-prefix" aria-hidden="true">₹</span>
                    <input
                      type="number"
                      id="recovery-sip-amount"
                      placeholder="0"
                      value={form.fixedMonthlySipAmount}
                      onChange={(e) => handleInputChange('fixedMonthlySipAmount', e.target.value)}
                      min={500}
                      max={1000000}
                      step={500}
                      className="num-input"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={50000}
                  step={500}
                  value={Number.isFinite(fixedSipNum) && fixedSipNum >= 1000 && fixedSipNum <= 50000 ? fixedSipNum : 1000}
                  onChange={(e) => handleInputChange('fixedMonthlySipAmount', e.target.value)}
                  className="range-slider"
                  aria-label="Custom monthly SIP amount slider"
                />
                <div className="range-ends">
                  <span>₹1,000/mo</span>
                  <span>₹50,000/mo</span>
                </div>
              </div>
            )}

            {/* 6. Expected Equity Return */}
            <div className="range-field">
              <div className="field-head">
                <label htmlFor="recovery-return-rate" className="field-label">
                  Assumed Annual Return
                </label>
                <div className="input-with-symbol">
                  <input
                    type="number"
                    id="recovery-return-rate"
                    placeholder="0"
                    value={form.annualInvestmentReturnRatePercent}
                    onChange={(e) => handleInputChange('annualInvestmentReturnRatePercent', e.target.value)}
                    min={0.0}
                    max={30.0}
                    step={0.5}
                    className="num-input"
                  />
                  <span className="percent-suffix" aria-hidden="true">%</span>
                </div>
              </div>
              <input
                type="range"
                min={8.0}
                max={16.0}
                step={0.5}
                value={Number.isFinite(returnRateNum) && returnRateNum >= 8 && returnRateNum <= 16 ? returnRateNum : 8.0}
                onChange={(e) => handleInputChange('annualInvestmentReturnRatePercent', e.target.value)}
                className="range-slider"
                aria-label="Assumed equity return rate slider"
              />
              <div className="range-ends">
                <span>8.0% p.a.</span>
                <span>16.0% p.a.</span>
              </div>
            </div>
          </div>

          {!isValid && !isBlank && (
            <div className="validation-alert" role="alert">
              <strong>Please review the following inputs:</strong>
              <ul>
                {validationIssues.map((issue, idx) => (
                  <li key={idx}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Right Column: Concept C Deep Atlantic Navy Results Panel */}
        <aside className="workbench-card result-panel" id="recovery-results-dashboard" aria-labelledby="recovery-results-heading">
          {result ? (
            <>
              <div className="result-hero-box">
                <span id="recovery-results-heading" className="result-label">
                  Interest Offset Analysis
                </span>
                <div className="result-number">
                  {result.interestGainOffsetPercent}% Offset
                </div>
                <div className="result-compact">
                  Monthly Outflow: {formatINR(result.monthlyEMI + result.effectiveMonthlySip)}/mo (EMI + SIP)
                </div>
                <p className="result-explainer">
                  Your parallel SIP investment gains ({formatIndianCompact(result.estimatedSipGain)}) are estimated to offset {result.interestGainOffsetPercent}% of your total loan interest ({formatIndianCompact(result.totalLoanInterestPaid)}).
                </p>
              </div>

              {/* 2-Card Metrics Grid: EMI + SIP */}
              <div className="metric-grid">
                <div className="metric">
                  <small className="metric-label">Home Loan EMI</small>
                  <b className="metric-value" data-testid="summary-emi">{formatINR(result.monthlyEMI)}</b>
                  <span className="metric-sub">
                    Total Interest: <strong data-testid="summary-loan-interest">{formatINR(result.totalLoanInterestPaid)}</strong>
                  </span>
                </div>

                <div className="metric">
                  <small className="metric-label">Parallel SIP ({result.sipPercentageOfEmiActual}%)</small>
                  <b className="metric-value highlight-val">{formatINR(result.effectiveMonthlySip)}</b>
                  <span className="metric-sub">
                    Invested: <strong data-testid="summary-sip-invested">{formatINR(result.totalSipInvested)}</strong>
                  </span>
                </div>
              </div>

              {/* Corpus vs Interest Comparison Card */}
              <div className="comparison-box">
                <div className="comp-row">
                  <span>Estimated SIP Maturity Corpus</span>
                  <strong className="highlight-val" data-testid="summary-sip-corpus">{formatINR(result.estimatedSipCorpus)}</strong>
                </div>
                <div className="comp-row">
                  <span>Estimated SIP Compounding Gain</span>
                  <strong className="gold-val">+{formatINR(result.estimatedSipGain)}</strong>
                </div>
              </div>

              {/* Net Financial Position Callout */}
              <div
                className="net-position-box"
                data-testid="net-gain-callout"
              >
                <span className="net-badge">
                  {result.netGainVsInterestDiff >= 0 ? 'Net Offset Surplus' : 'Interest Subsidy'}
                </span>
                <p className="net-text">
                  {result.netGainVsInterestDiff >= 0 ? (
                    <>
                      At an assumed {result.annualInvestmentReturnRatePercent}% return, your parallel SIP gains exceed total loan interest by <strong>{formatINR(result.netGainVsInterestDiff)}</strong>.
                    </>
                  ) : (
                    <>
                      Your parallel SIP gains offset <strong>{result.interestGainOffsetPercent}%</strong> of the interest paid, reducing net uncovered interest to <strong>{formatINR(Math.abs(result.netGainVsInterestDiff))}</strong>.
                    </>
                  )}
                </p>
                {result.breakevenMonthlySip && (
                  <p className="breakeven-note">
                    <strong>100% Breakeven SIP:</strong> {formatINR(result.breakevenMonthlySip)}/mo ({result.breakevenSipPercentOfEmi}% of EMI).
                  </p>
                )}
              </div>

              {/* Standard Full-Width Schedule Toggle Button */}
              <div className="schedule-toggle-wrapper">
                <button
                  type="button"
                  onClick={() => setShowMilestones(!showMilestones)}
                  className="btn-toggle-schedule"
                  aria-expanded={showMilestones}
                  aria-controls="milestones-table"
                >
                  {showMilestones ? '▲ Hide Year-by-Year Growth Schedule' : '▼ View Year-by-Year Growth Schedule'}
                </button>
              </div>

              <p className="result-foot">
                Home loan EMIs are fixed contractual obligations, whereas mutual fund SIP returns fluctuate with market cycles and are not guaranteed.
              </p>
            </>
          ) : (
            <div className="invalid-state-box">
              <span className="invalid-icon" aria-hidden="true">📊</span>
              <p className="invalid-msg">
                {isBlank
                  ? 'Enter your loan and parallel SIP details on the left or click "Sample Data" to preview a scenario.'
                  : 'Please enter valid positive loan and SIP parameters to view the interest recovery analysis.'}
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Full-Width Collapsible Schedule Section Below Grid */}
      {result && showMilestones && (
        <section className="surface schedule-section" id="milestones-table" aria-labelledby="recovery-schedule-heading">
          <div className="schedule-header">
            <h3 id="recovery-schedule-heading" className="schedule-title">Year-by-Year Loan &amp; SIP Progression</h3>
            <span className="schedule-subtitle">Annual reducing loan balance alongside parallel SIP compounding</span>
          </div>

          <div className="table-responsive">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th scope="col">Year</th>
                  <th scope="col">Loan Balance</th>
                  <th scope="col">Cumulative Interest</th>
                  <th scope="col">SIP Invested</th>
                  <th scope="col">Estimated SIP Corpus</th>
                  <th scope="col">SIP Gain</th>
                </tr>
              </thead>
              <tbody>
                {result.milestones.map((m) => (
                  <tr key={m.year}>
                    <td className="col-year">Year {m.year}</td>
                    <td>{formatINR(m.loanRemainingBalance)}</td>
                    <td className="col-interest">{formatINR(m.cumulativeLoanInterestPaid)}</td>
                    <td>{formatINR(m.cumulativeSipInvested)}</td>
                    <td className="col-corpus">{formatINR(m.estimatedSipCorpus)}</td>
                    <td className="col-gain">+{formatINR(m.estimatedSipGain)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <style>{`
        .recovery-workbench {
          margin: var(--space-4) 0 var(--space-12);
        }

        .workbench-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (min-width: 960px) {
          .workbench-grid {
            grid-template-columns: 1.06fr 0.94fr;
          }
        }

        .workbench-card.surface {
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: var(--radius-xl);
          padding: 28px;
          box-shadow: var(--shadow-card);
        }

        .controls-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 22px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--awc-line);
        }

        .calc-title {
          font-size: 20px;
          font-weight: 850;
          letter-spacing: -0.03em;
          margin: 0 0 4px;
          color: var(--awc-navy);
        }

        .calc-description {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .sample-btn {
          background: var(--awc-jade-soft);
          border: 1px solid #B7DDD3;
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-brand);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .sample-btn:hover {
          background: var(--awc-mint);
          border-color: var(--color-border-interactive);
        }

        .reset-btn {
          background: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-muted);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .reset-btn:hover {
          background: var(--awc-paper);
          color: var(--awc-navy);
          border-color: var(--color-border-interactive);
        }

        .recovery-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .range-field {
          padding-bottom: 16px;
          border-bottom: 1px solid #EDF3F1;
        }

        .range-field:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .field-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 800;
          color: var(--awc-navy);
          display: block;
        }

        .compact-pill {
          display: inline-block;
          margin-top: 3px;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-brand);
          background: var(--awc-jade-soft);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .input-with-symbol {
          display: inline-flex;
          align-items: center;
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 12px;
          padding: 6px 12px;
          min-width: 140px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .input-with-symbol:focus-within {
          border-color: var(--color-border-interactive);
          box-shadow: 0 0 0 3px rgba(22, 135, 126, 0.12);
          background-color: #ffffff;
        }

        .currency-prefix,
        .percent-suffix,
        .unit-suffix {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-muted);
          user-select: none;
        }

        .currency-prefix {
          margin-right: 4px;
        }

        .percent-suffix,
        .unit-suffix {
          margin-left: 4px;
        }

        .num-input {
          width: 100%;
          border: none;
          background: transparent;
          font-family: var(--font-family-body);
          font-size: 16px;
          font-weight: 800;
          color: var(--awc-navy);
          text-align: right;
          outline: none;
          font-variant-numeric: tabular-nums;
        }

        .num-input::placeholder {
          color: rgba(19, 42, 64, 0.28);
          font-weight: 600;
        }

        .range-slider {
          width: 100%;
          height: 6px;
          accent-color: var(--color-text-brand);
          cursor: pointer;
          margin: 4px 0;
        }

        .range-ends {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 4px;
        }

        .mode-pill-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          background: var(--awc-paper);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid var(--awc-line);
        }

        .mode-pill {
          border: none;
          background: transparent;
          padding: 8px 12px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 750;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mode-pill.active-pill {
          background: var(--color-brand-primary, #0f5338);
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(15, 83, 56, 0.18);
        }

        .validation-alert {
          margin-top: 16px;
          padding: 12px 16px;
          background: #FEF3F2;
          border: 1px solid #FECDCA;
          border-radius: 12px;
          font-size: 12px;
          color: #B42318;
        }

        .validation-alert ul {
          margin: 6px 0 0;
          padding-left: 18px;
        }

        .result-panel {
          background-color: var(--awc-navy);
          color: #ffffff;
          border-radius: var(--radius-xl);
          padding: 28px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 18px 40px rgba(19, 42, 64, 0.18);
        }

        .result-hero-box {
          position: relative;
          z-index: 1;
          margin-bottom: 20px;
        }

        .result-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 800;
          color: #C5D7D2;
        }

        .result-number {
          font-size: clamp(28px, 3.8vw, 38px);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin: 8px 0 6px;
          color: var(--awc-gold);
          font-variant-numeric: tabular-nums;
        }

        .result-compact {
          font-size: 13px;
          color: #DDEBE7;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .result-explainer {
          font-size: 12px;
          color: #C5D7D2;
          line-height: 1.6;
          margin: 8px 0 0;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .metric {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 14px;
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #BDCEC9;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 18px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
          margin-bottom: 2px;
        }

        .highlight-val {
          color: #5EEAD4;
        }

        .gold-val {
          color: var(--awc-gold);
        }

        .metric-sub {
          font-size: 10.5px;
          color: #A3BFB8;
        }

        .comparison-box {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 12px 16px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .comp-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
          color: #DDEBE7;
        }

        .net-position-box {
          background: rgba(22, 135, 126, 0.15);
          border: 1px solid rgba(22, 135, 126, 0.35);
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 18px;
        }

        .net-badge {
          display: inline-block;
          background: var(--awc-gold);
          color: var(--awc-navy);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 2px 7px;
          border-radius: 6px;
          margin-bottom: 6px;
        }

        .net-text {
          font-size: 12px;
          color: #DDEBE7;
          line-height: 1.5;
          margin: 0 0 6px;
        }

        .breakeven-note {
          font-size: 11px;
          color: var(--awc-gold);
          margin: 0;
        }

        .schedule-toggle-wrapper {
          margin-bottom: 16px;
        }

        .btn-toggle-schedule {
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 12px;
          color: #ffffff;
          padding: 12px 14px;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
        }

        .btn-toggle-schedule:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.35);
        }

        .result-foot {
          font-size: 10px;
          color: #A7BEB8;
          line-height: 1.6;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          margin: 0;
        }

        .invalid-state-box {
          padding: 36px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          text-align: center;
        }

        .invalid-icon {
          font-size: 28px;
          display: block;
          margin-bottom: 8px;
        }

        .invalid-msg {
          font-size: 13px;
          color: #BDCEC9;
          margin: 0;
          line-height: 1.5;
        }

        .schedule-section {
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: var(--radius-xl);
          padding: 28px;
          margin-top: 28px;
          box-shadow: var(--shadow-card);
        }

        .schedule-header {
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--awc-line);
        }

        .schedule-title {
          font-size: 20px;
          font-weight: 850;
          letter-spacing: -0.03em;
          color: var(--awc-navy);
          margin: 0 0 4px;
        }

        .schedule-subtitle {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .table-responsive {
          overflow-x: auto;
        }

        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: right;
        }

        .schedule-table th,
        .schedule-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #EDF3F1;
          white-space: nowrap;
        }

        .schedule-table th {
          background-color: var(--awc-paper);
          color: var(--awc-navy);
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .schedule-table th:first-child,
        .schedule-table td:first-child {
          text-align: left;
        }

        .col-year {
          font-weight: 800;
          color: var(--awc-navy);
        }

        .col-interest {
          color: #B42318;
          font-weight: 600;
        }

        .col-corpus {
          color: var(--awc-navy);
          font-weight: 800;
        }

        .col-gain {
          color: var(--color-text-brand);
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
