import React, { useState, useId, useMemo } from 'react';
import {
  calculateLoanSipRecovery,
  validateLoanSipRecoveryInputs,
  ILLUSTRATIVE_LOAN_SIP_RECOVERY_EXAMPLE,
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
  const [form, setForm] = useState<FormState>(DEFAULT_FORM_STATE);
  const [isExample, setIsExample] = useState<boolean>(true);
  const [showMilestones, setShowMilestones] = useState<boolean>(false);
  const baseId = useId();

  // Parsing values
  const principalNum = Number(form.loanPrincipal);
  const loanRateNum = Number(form.annualLoanInterestRatePercent);
  const tenureNum = Number(form.loanTenureYears);
  const sipPctNum = Number(form.sipPercentageOfEmi);
  const fixedSipNum = Number(form.fixedMonthlySipAmount);
  const returnRateNum = Number(form.annualInvestmentReturnRatePercent);

  // Validate inputs
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

  // Calculation result
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
    setIsExample(false);
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM_STATE);
    setIsExample(true);
    setShowMilestones(false);
  };

  const handleLoadExample = () => {
    setForm({
      loanPrincipal: String(ILLUSTRATIVE_LOAN_SIP_RECOVERY_EXAMPLE.loanPrincipal),
      annualLoanInterestRatePercent: String(ILLUSTRATIVE_LOAN_SIP_RECOVERY_EXAMPLE.annualLoanInterestRatePercent),
      loanTenureYears: String(ILLUSTRATIVE_LOAN_SIP_RECOVERY_EXAMPLE.loanTenureYears),
      sipMode: ILLUSTRATIVE_LOAN_SIP_RECOVERY_EXAMPLE.sipMode,
      sipPercentageOfEmi: String(ILLUSTRATIVE_LOAN_SIP_RECOVERY_EXAMPLE.sipPercentageOfEmi),
      fixedMonthlySipAmount: '6500',
      annualInvestmentReturnRatePercent: String(ILLUSTRATIVE_LOAN_SIP_RECOVERY_EXAMPLE.annualInvestmentReturnRatePercent),
    });
    setIsExample(true);
  };

  return (
    <div className="recovery-workbench" id="loan-sip-recovery-calculator" data-testid="recovery-workbench">
      {/* Example Status Banner */}
      {isExample && (
        <div className="example-banner example-active" role="status" data-testid="illustrative-banner">
          <span className="banner-icon" aria-hidden="true">💡</span>
          <div className="banner-text">
            <strong>Illustrative Benchmark Scenario:</strong> A ₹50 Lakhs home loan at 8.5% over 20 years paired with a 15% parallel SIP earning an assumed 12.0% p.a. Adjust any slider below to model your family scenario.
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="btn-banner-action"
            id="recovery-banner-reset-btn"
          >
            Reset to Defaults
          </button>
        </div>
      )}

      {/* Mobile Top Summary Card (<760px first-fold metric visibility) */}
      {result && (
        <div className="mobile-recovery-summary" id="loan-sip-mobile-summary" aria-label="Quick Recovery Summary">
          <div className="mobile-summary-row">
            <div>
              <span className="mobile-summary-label">Monthly EMI</span>
              <span className="mobile-summary-val">{formatINR(result.monthlyEMI)}</span>
            </div>
            <div>
              <span className="mobile-summary-label">Parallel SIP ({result.sipPercentageOfEmiActual}%)</span>
              <span className="mobile-summary-val highlight-val">{formatINR(result.effectiveMonthlySip)}</span>
            </div>
          </div>
          <div className="mobile-summary-row border-top">
            <div>
              <span className="mobile-summary-label">Total Loan Interest</span>
              <span className="mobile-summary-val text-muted">{formatIndianCompact(result.totalLoanInterestPaid)}</span>
            </div>
            <div>
              <span className="mobile-summary-label">Estimated SIP Gain</span>
              <span className="mobile-summary-val text-brand">{formatIndianCompact(result.estimatedSipGain)}</span>
            </div>
            <div>
              <span className="mobile-summary-label">Interest Offset</span>
              <span className="mobile-summary-badge">{result.interestGainOffsetPercent}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Connected Workbench */}
      <div className="workbench-grid">
        {/* Controls Column */}
        <div className="controls-panel card-surface">
          <div className="panel-header">
            <h2 className="panel-title">1. Home Loan &amp; Parallel SIP Parameters</h2>
            <button
              type="button"
              onClick={handleReset}
              className="btn-reset-link"
              id="recovery-reset-btn"
              data-testid="recovery-reset-btn"
              aria-label="Reset all inputs to default"
            >
              Reset
            </button>
          </div>

          <div className="inputs-group">
            {/* Loan Principal */}
            <div className="input-control">
              <div className="control-label-row">
                <label htmlFor="recovery-loan-amount" className="control-label">
                  Home Loan Principal
                </label>
                <span className="control-compact-badge">{formatIndianCompact(principalNum || 0)}</span>
              </div>
              <div className="input-with-adornment">
                <span className="input-prefix" aria-hidden="true">₹</span>
                <input
                  type="number"
                  id="recovery-loan-amount"
                  value={form.loanPrincipal}
                  onChange={(e) => handleInputChange('loanPrincipal', e.target.value)}
                  min={100000}
                  max={100000000}
                  step={50000}
                  className="form-input text-right"
                  aria-describedby="recovery-principal-hint"
                />
              </div>
              <input
                type="range"
                min={500000}
                max={20000000}
                step={100000}
                value={Number.isFinite(principalNum) && principalNum >= 500000 && principalNum <= 20000000 ? principalNum : 5000000}
                onChange={(e) => handleInputChange('loanPrincipal', e.target.value)}
                className="range-slider"
                aria-label="Home Loan Principal slider"
              />
              <span id="recovery-principal-hint" className="input-hint">
                Standard range: ₹5 Lakhs to ₹2 Crores
              </span>
            </div>

            {/* Loan Interest Rate */}
            <div className="input-control">
              <div className="control-label-row">
                <label htmlFor="recovery-interest-rate" className="control-label">
                  Annual Loan Interest Rate
                </label>
                <span className="control-compact-badge">{form.annualLoanInterestRatePercent}% p.a.</span>
              </div>
              <div className="input-with-adornment">
                <input
                  type="number"
                  id="recovery-interest-rate"
                  value={form.annualLoanInterestRatePercent}
                  onChange={(e) => handleInputChange('annualLoanInterestRatePercent', e.target.value)}
                  min={0.1}
                  max={25.0}
                  step={0.1}
                  className="form-input text-right"
                  aria-describedby="recovery-loan-rate-hint"
                />
                <span className="input-suffix" aria-hidden="true">%</span>
              </div>
              <input
                type="range"
                min={6.0}
                max={15.0}
                step={0.1}
                value={Number.isFinite(loanRateNum) && loanRateNum >= 6 && loanRateNum <= 15 ? loanRateNum : 8.5}
                onChange={(e) => handleInputChange('annualLoanInterestRatePercent', e.target.value)}
                className="range-slider"
                aria-label="Annual loan interest rate slider"
              />
              <span id="recovery-loan-rate-hint" className="input-hint">
                Typical Indian home loans: 8.0% to 9.5% p.a.
              </span>
            </div>

            {/* Loan Tenure */}
            <div className="input-control">
              <div className="control-label-row">
                <label htmlFor="recovery-tenure" className="control-label">
                  Loan Tenure
                </label>
                <span className="control-compact-badge">{form.loanTenureYears} Years ({tenureNum * 12} Months)</span>
              </div>
              <div className="input-with-adornment">
                <input
                  type="number"
                  id="recovery-tenure"
                  value={form.loanTenureYears}
                  onChange={(e) => handleInputChange('loanTenureYears', e.target.value)}
                  min={1}
                  max={30}
                  step={1}
                  className="form-input text-right"
                  aria-describedby="recovery-tenure-hint"
                />
                <span className="input-suffix" aria-hidden="true">Yrs</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={Number.isFinite(tenureNum) && tenureNum >= 1 && tenureNum <= 30 ? tenureNum : 20}
                onChange={(e) => handleInputChange('loanTenureYears', e.target.value)}
                className="range-slider"
                aria-label="Loan tenure slider"
              />
              <span id="recovery-tenure-hint" className="input-hint">
                Mortgage durations typically span 10 to 30 years
              </span>
            </div>

            {/* Parallel SIP Mode Selector */}
            <div className="input-control">
              <span className="control-label">Parallel Monthly SIP Mode</span>
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

            {/* SIP Parameter (dynamic depending on mode) */}
            {form.sipMode === 'PERCENTAGE_OF_EMI' ? (
              <div className="input-control">
                <div className="control-label-row">
                  <label htmlFor="recovery-sip-pct" className="control-label">
                    SIP as % of Monthly EMI
                  </label>
                  <span className="control-compact-badge">
                    {result ? formatINR(result.effectiveMonthlySip) : '—'}/mo ({form.sipPercentageOfEmi}%)
                  </span>
                </div>
                <div className="input-with-adornment">
                  <input
                    type="number"
                    id="recovery-sip-pct"
                    value={form.sipPercentageOfEmi}
                    onChange={(e) => handleInputChange('sipPercentageOfEmi', e.target.value)}
                    min={1}
                    max={100}
                    step={1}
                    className="form-input text-right"
                    aria-describedby="recovery-sip-percent-hint"
                  />
                  <span className="input-suffix" aria-hidden="true">%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={1}
                  value={Number.isFinite(sipPctNum) && sipPctNum >= 5 && sipPctNum <= 50 ? sipPctNum : 15}
                  onChange={(e) => handleInputChange('sipPercentageOfEmi', e.target.value)}
                  className="range-slider"
                  aria-label="SIP percentage of EMI slider"
                />
                <span id="recovery-sip-percent-hint" className="input-hint">
                  A common rule of thumb is 10% to 20% of your EMI
                </span>
              </div>
            ) : (
              <div className="input-control">
                <div className="control-label-row">
                  <label htmlFor="recovery-sip-amount" className="control-label">
                    Custom Monthly SIP Amount
                  </label>
                  <span className="control-compact-badge">{formatINR(fixedSipNum || 0)}/mo</span>
                </div>
                <div className="input-with-adornment">
                  <span className="input-prefix" aria-hidden="true">₹</span>
                  <input
                    type="number"
                    id="recovery-sip-amount"
                    value={form.fixedMonthlySipAmount}
                    onChange={(e) => handleInputChange('fixedMonthlySipAmount', e.target.value)}
                    min={500}
                    max={1000000}
                    step={500}
                    className="form-input text-right"
                    aria-describedby="recovery-sip-amount-hint"
                  />
                </div>
                <input
                  type="range"
                  min={1000}
                  max={50000}
                  step={500}
                  value={Number.isFinite(fixedSipNum) && fixedSipNum >= 1000 && fixedSipNum <= 50000 ? fixedSipNum : 6500}
                  onChange={(e) => handleInputChange('fixedMonthlySipAmount', e.target.value)}
                  className="range-slider"
                  aria-label="Custom monthly SIP amount slider"
                />
                <span id="recovery-sip-amount-hint" className="input-hint">
                  Choose any comfortable monthly allocation
                </span>
              </div>
            )}

            {/* Expected Equity Mutual Fund Return */}
            <div className="input-control">
              <div className="control-label-row">
                <label htmlFor="recovery-return-rate" className="control-label">
                  Assumed Annual Equity Return
                </label>
                <span className="control-compact-badge">{form.annualInvestmentReturnRatePercent}% p.a.</span>
              </div>
              <div className="input-with-adornment">
                <input
                  type="number"
                  id="recovery-return-rate"
                  value={form.annualInvestmentReturnRatePercent}
                  onChange={(e) => handleInputChange('annualInvestmentReturnRatePercent', e.target.value)}
                  min={0.0}
                  max={30.0}
                  step={0.5}
                  className="form-input text-right"
                  aria-describedby="recovery-return-hint"
                />
                <span className="input-suffix" aria-hidden="true">%</span>
              </div>
              <input
                type="range"
                min={8.0}
                max={16.0}
                step={0.5}
                value={Number.isFinite(returnRateNum) && returnRateNum >= 8 && returnRateNum <= 16 ? returnRateNum : 12.0}
                onChange={(e) => handleInputChange('annualInvestmentReturnRatePercent', e.target.value)}
                className="range-slider"
                aria-label="Assumed equity return rate slider"
              />
              <span id="recovery-return-hint" className="input-hint">
                Illustrative multi-year equity benchmark: 11% to 13% p.a. (Not guaranteed)
              </span>
            </div>
          </div>

          {/* Validation Errors */}
          {!isValid && (
            <div className="validation-alert" role="alert">
              <strong>Please correct the following inputs:</strong>
              <ul>
                {validationIssues.map((issue, idx) => (
                  <li key={idx}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Results Column */}
        <div className="results-panel">
          {result ? (
            <div className="results-card card-surface" id="recovery-results-dashboard">
              <div className="results-header">
                <span className="results-eyebrow">Parallel Compounding Outcome</span>
                <h3 className="results-headline">Interest Offset Analysis</h3>
              </div>

              {/* Top Metric Cards Grid */}
              <div className="metrics-grid">
                <div className="metric-box box-emi">
                  <span className="metric-tag">Monthly Commitment</span>
                  <div className="metric-split-row">
                    <div>
                      <span className="sub-label">Home Loan EMI</span>
                      <div className="metric-number" data-testid="summary-emi">{formatINR(result.monthlyEMI)}</div>
                    </div>
                    <div className="plus-sign" aria-hidden="true">+</div>
                    <div>
                      <span className="sub-label">Parallel SIP ({result.sipPercentageOfEmiActual}%)</span>
                      <div className="metric-number text-brand">{formatINR(result.effectiveMonthlySip)}</div>
                    </div>
                  </div>
                  <span className="metric-caption">
                    Total combined outflow: <strong>{formatINR(result.monthlyEMI + result.effectiveMonthlySip)}/month</strong>
                  </span>
                </div>

                <div className="metric-box box-offset">
                  <span className="metric-tag">Interest Neutralization</span>
                  <div className="metric-number-big">
                    {result.interestGainOffsetPercent}%
                  </div>
                  <span className="metric-caption">
                    of your total loan interest (<strong>{formatIndianCompact(result.totalLoanInterestPaid)}</strong>) is estimated to be offset by SIP investment growth!
                  </span>
                </div>
              </div>

              {/* Visual Balance Comparison */}
              <div className="comparison-visual-section">
                <h4 className="sub-heading">Borrowing Cost vs. Wealth Creation</h4>

                <div className="bar-comparison-row">
                  <div className="bar-col">
                    <div className="bar-label-line">
                      <span>Total Loan Interest Paid</span>
                      <strong className="text-rose" data-testid="summary-loan-interest">{formatINR(result.totalLoanInterestPaid)}</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill fill-rose" style={{ width: '100%' }} />
                    </div>
                    <span className="bar-sub-info">
                      Total repayment: {formatIndianCompact(result.totalLoanRepayment)} (incl. {formatIndianCompact(result.loanPrincipal)} Principal)
                    </span>
                  </div>

                  <div className="bar-col">
                    <div className="bar-label-line">
                      <span>Estimated SIP Maturity Corpus</span>
                      <strong className="text-brand" data-testid="summary-sip-corpus">{formatINR(result.estimatedSipCorpus)}</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill fill-jade"
                        style={{
                          width: `${Math.min(100, (result.estimatedSipCorpus / (result.totalLoanInterestPaid || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="bar-sub-info">
                      Includes <strong data-testid="summary-sip-invested">{formatINR(result.totalSipInvested)}</strong> Invested + <strong className="text-brand">{formatIndianCompact(result.estimatedSipGain)}</strong> Investment Growth
                    </span>
                  </div>
                </div>

                {/* Net Financial Position Callout */}
                <div
                  className={`net-position-box ${result.netGainVsInterestDiff >= 0 ? 'position-positive' : 'position-neutral'}`}
                  data-testid="net-gain-callout"
                >
                  <span className="position-icon" aria-hidden="true">{result.netGainVsInterestDiff >= 0 ? '🏆' : '⚖️'}</span>
                  <div className="position-content">
                    {result.netGainVsInterestDiff >= 0 ? (
                      <>
                        <strong>Potential Net Offset Surplus:</strong> At an assumed {result.annualInvestmentReturnRatePercent}% return, your parallel SIP gains (<strong>{formatIndianCompact(result.estimatedSipGain)}</strong>) exceed the entire loan interest by <strong>{formatINR(result.netGainVsInterestDiff)}</strong>. You effectively neutralize your borrowing cost!
                      </>
                    ) : (
                      <>
                        <strong>Substantial Interest Subsidy:</strong> Your parallel SIP gains offset <strong>{result.interestGainOffsetPercent}%</strong> of the interest paid. Your net uncovered borrowing cost is reduced to <strong>{formatINR(Math.abs(result.netGainVsInterestDiff))}</strong>.
                      </>
                    )}
                  </div>
                </div>

                {/* Breakeven Solver Callout */}
                {result.breakevenMonthlySip && (
                  <div className="breakeven-banner">
                    <span className="breakeven-tag">Target Breakeven SIP</span>
                    <p className="breakeven-text">
                      To offset exactly <strong>100%</strong> of the total loan interest ({formatIndianCompact(result.totalLoanInterestPaid)}) purely through investment growth at {result.annualInvestmentReturnRatePercent}% p.a., you would need a monthly SIP of <strong>{formatINR(result.breakevenMonthlySip)}</strong> (approx. <strong>{result.breakevenSipPercentOfEmi}%</strong> of your EMI).
                    </p>
                  </div>
                )}
              </div>

              {/* Milestone Schedule Toggle */}
              <div className="milestones-toggle-section">
                <button
                  type="button"
                  onClick={() => setShowMilestones(!showMilestones)}
                  className="btn-toggle-milestones"
                  aria-expanded={showMilestones}
                  aria-controls="milestones-table"
                >
                  {showMilestones ? 'Hide Annual Milestone Progress ▲' : 'View Annual Milestone Progress ▼'}
                </button>

                {showMilestones && (
                  <div className="table-responsive" id="milestones-table">
                    <table className="milestone-table">
                      <thead>
                        <tr>
                          <th>Year</th>
                          <th>Loan Balance</th>
                          <th>Total Interest Paid</th>
                          <th>Total SIP Invested</th>
                          <th>Estimated SIP Corpus</th>
                          <th>SIP Gain</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.milestones.map((m) => (
                          <tr key={m.year}>
                            <td className="year-cell">Year {m.year}</td>
                            <td>{formatINR(m.loanRemainingBalance)}</td>
                            <td className="text-rose">{formatINR(m.cumulativeLoanInterestPaid)}</td>
                            <td>{formatINR(m.cumulativeSipInvested)}</td>
                            <td className="text-brand font-bold">{formatINR(m.estimatedSipCorpus)}</td>
                            <td className="text-brand">{formatINR(m.estimatedSipGain)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Mandatory Honest Disclaimers */}
              <div className="disclaimer-callout">
                <strong>Mandatory Regulatory &amp; Risk Notice:</strong>
                <p>
                  Mutual fund investments are subject to market risks; read all scheme related documents carefully. The parallel SIP calculation uses an illustrative compounded annual growth rate (CAGR). Equities do not deliver linear or guaranteed returns. Home loan EMIs and interest are legal contractual obligations that must be paid regardless of equity market cycles. This tool models a disciplined mathematical scenario and does not guarantee that your actual mutual fund returns will offset all interest.
                </p>
              </div>
            </div>
          ) : (
            <div className="results-card card-surface empty-results">
              <span className="empty-icon" aria-hidden="true">📊</span>
              <h3>Calculation Unavailable</h3>
              <p>Please enter valid positive loan and investment parameters to view the interest recovery analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
