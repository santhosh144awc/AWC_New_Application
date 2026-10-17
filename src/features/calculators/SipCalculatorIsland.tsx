import React, { useState, useId } from 'react';
import { calculateSIP, type SIPResult } from '../../domain/finance/sip';
import { formatINR, formatIndianCompact, formatPercentage } from '../../lib/formatters';

interface FormState {
  monthlyInvestment: number;
  annualReturnPercent: number;
  years: number;
  annualStepUpPercent: number;
}

const DEFAULT_FORM: FormState = {
  monthlyInvestment: 10000,
  annualReturnPercent: 12.0,
  years: 10,
  annualStepUpPercent: 0,
};

export default function SipCalculatorIsland(): React.JSX.Element {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const baseId = useId();

  // Validation checks
  const isAmountValid = Number.isFinite(form.monthlyInvestment) && form.monthlyInvestment >= 500 && form.monthlyInvestment <= 10000000;
  const isReturnValid = Number.isFinite(form.annualReturnPercent) && form.annualReturnPercent >= 0 && form.annualReturnPercent <= 100;
  const isYearsValid = Number.isFinite(form.years) && form.years >= 1 && form.years <= 40;
  const isStepUpValid = Number.isFinite(form.annualStepUpPercent) && form.annualStepUpPercent >= 0 && form.annualStepUpPercent <= 100;

  const isValid = isAmountValid && isReturnValid && isYearsValid && isStepUpValid;

  // Calculation results
  let result: SIPResult | null = null;
  let fixedCounterpartResult: SIPResult | null = null;

  if (isValid) {
    try {
      result = calculateSIP({
        monthlyInvestment: form.monthlyInvestment,
        tenureMonths: Math.round(form.years * 12),
        annualReturnPercent: form.annualReturnPercent,
        annualStepUpPercent: form.annualStepUpPercent,
        generateSchedule: true,
      });

      if (form.annualStepUpPercent > 0) {
        fixedCounterpartResult = calculateSIP({
          monthlyInvestment: form.monthlyInvestment,
          tenureMonths: Math.round(form.years * 12),
          annualReturnPercent: form.annualReturnPercent,
          annualStepUpPercent: 0,
        });
      }
    } catch {
      result = null;
    }
  }

  const handleReset = (): void => {
    setForm(DEFAULT_FORM);
    setShowSchedule(false);
  };

  const investedPercent = result && result.futureValue > 0
    ? Math.min(100, Math.max(0, (result.totalInvested / result.futureValue) * 100))
    : 0;
  const gainPercent = result && result.futureValue > 0
    ? Math.max(0, 100 - investedPercent)
    : 0;

  return (
    <div className="sip-island-wrapper" id="sip-calculator-app">
      <div className="sip-island-card">
        {/* Controls Column */}
        <div className="sip-controls-col">
          <div className="island-header">
            <h2 className="island-title">Calculate Your SIP Wealth</h2>
            <button
              type="button"
              id="reset-sip-btn"
              onClick={handleReset}
              className="reset-btn"
              title="Reset all inputs to the default example"
            >
              Reset Example
            </button>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="sip-form">
            {/* Input 1: Monthly Investment */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor={`${baseId}-amount-num`} className="form-label">
                  Monthly Investment
                </label>
                <div className="input-with-symbol">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    id={`${baseId}-amount-num`}
                    value={form.monthlyInvestment}
                    min={500}
                    max={10000000}
                    step={500}
                    onChange={(e) => setForm({ ...form, monthlyInvestment: Number(e.target.value) })}
                    className={`num-input ${!isAmountValid ? 'input-error' : ''}`}
                    aria-describedby={`${baseId}-amount-help`}
                  />
                </div>
              </div>
              <input
                type="range"
                id={`${baseId}-amount-slider`}
                value={form.monthlyInvestment}
                min={500}
                max={200000}
                step={500}
                onChange={(e) => setForm({ ...form, monthlyInvestment: Number(e.target.value) })}
                className="range-slider"
                aria-label="Monthly Investment Amount Slider"
              />
              <div className="slider-ticks">
                <span>₹500</span>
                <span>₹50,000</span>
                <span>₹1,00,000</span>
                <span>₹2,00,000</span>
              </div>
              {!isAmountValid && (
                <span id={`${baseId}-amount-help`} className="field-error">
                  Enter a valid installment between ₹500 and ₹1,00,00,000
                </span>
              )}
            </div>

            {/* Input 2: Expected Return Rate */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor={`${baseId}-return-num`} className="form-label">
                  Assumed Annual Return
                </label>
                <div className="input-with-symbol">
                  <input
                    type="number"
                    id={`${baseId}-return-num`}
                    value={form.annualReturnPercent}
                    min={0}
                    max={100}
                    step={0.5}
                    onChange={(e) => setForm({ ...form, annualReturnPercent: Number(e.target.value) })}
                    className={`num-input ${!isReturnValid ? 'input-error' : ''}`}
                    aria-describedby={`${baseId}-return-help`}
                  />
                  <span className="percent-suffix">%</span>
                </div>
              </div>
              <input
                type="range"
                id={`${baseId}-return-slider`}
                value={form.annualReturnPercent}
                min={1}
                max={30}
                step={0.5}
                onChange={(e) => setForm({ ...form, annualReturnPercent: Number(e.target.value) })}
                className="range-slider"
                aria-label="Assumed Annual Return Rate Slider"
              />
              <div className="slider-ticks">
                <span>1% (Conservative)</span>
                <span>12% (Illustrative)</span>
                <span>30% (High)</span>
              </div>
              {!isReturnValid && (
                <span id={`${baseId}-return-help`} className="field-error">
                  Enter an effective return between 0% and 100%
                </span>
              )}
            </div>

            {/* Input 3: Investment Tenure */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor={`${baseId}-years-num`} className="form-label">
                  Investment Duration
                </label>
                <div className="input-with-symbol">
                  <input
                    type="number"
                    id={`${baseId}-years-num`}
                    value={form.years}
                    min={1}
                    max={40}
                    step={1}
                    onChange={(e) => setForm({ ...form, years: Number(e.target.value) })}
                    className={`num-input ${!isYearsValid ? 'input-error' : ''}`}
                    aria-describedby={`${baseId}-years-help`}
                  />
                  <span className="unit-suffix">Yrs</span>
                </div>
              </div>
              <input
                type="range"
                id={`${baseId}-years-slider`}
                value={form.years}
                min={1}
                max={35}
                step={1}
                onChange={(e) => setForm({ ...form, years: Number(e.target.value) })}
                className="range-slider"
                aria-label="Investment Tenure in Years Slider"
              />
              <div className="slider-ticks">
                <span>1 Year</span>
                <span>10 Years</span>
                <span>20 Years</span>
                <span>35 Years</span>
              </div>
              {!isYearsValid && (
                <span id={`${baseId}-years-help`} className="field-error">
                  Enter a duration between 1 and 40 years
                </span>
              )}
            </div>

            {/* Input 4: Annual Step-Up */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor={`${baseId}-stepup-num`} className="form-label">
                  Annual Step-Up (Optional)
                </label>
                <div className="input-with-symbol">
                  <input
                    type="number"
                    id={`${baseId}-stepup-num`}
                    value={form.annualStepUpPercent}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(e) => setForm({ ...form, annualStepUpPercent: Number(e.target.value) })}
                    className={`num-input ${!isStepUpValid ? 'input-error' : ''}`}
                    aria-describedby={`${baseId}-stepup-help`}
                  />
                  <span className="percent-suffix">%</span>
                </div>
              </div>
              <input
                type="range"
                id={`${baseId}-stepup-slider`}
                value={form.annualStepUpPercent}
                min={0}
                max={25}
                step={1}
                onChange={(e) => setForm({ ...form, annualStepUpPercent: Number(e.target.value) })}
                className="range-slider"
                aria-label="Annual Step-Up Percentage Slider"
              />
              <div className="slider-ticks">
                <span>0% (Fixed SIP)</span>
                <span>10% (Salary Growth)</span>
                <span>25%</span>
              </div>
              <span id={`${baseId}-stepup-help`} className="field-hint">
                {form.annualStepUpPercent > 0
                  ? `Increases monthly contribution by ${form.annualStepUpPercent}% starting from Month 13.`
                  : 'Keeps contribution fixed at initial amount for all months.'}
              </span>
            </div>
          </form>
        </div>

        {/* Results Column */}
        <div className="sip-results-col" aria-live="polite">
          {isValid && result ? (
            <>
              <div className="result-hero-box">
                <span className="result-hero-label">Estimated Future Corpus</span>
                <div className="result-hero-value" id="sip-future-value">
                  {formatINR(result.futureValue)}
                </div>
                <div className="result-hero-compact">
                  approx. {formatIndianCompact(result.futureValue)}
                </div>
              </div>

              <div className="result-metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">Total Contributed</span>
                  <div className="metric-value" id="sip-total-invested">
                    {formatINR(result.totalInvested)}
                  </div>
                  <span className="metric-sub">{formatIndianCompact(result.totalInvested)} invested</span>
                </div>

                <div className="metric-box highlight-gain">
                  <span className="metric-label">Estimated Wealth Gain</span>
                  <div className="metric-value" id="sip-total-gain">
                    {formatINR(result.totalGain)}
                  </div>
                  <span className="metric-sub">{formatIndianCompact(result.totalGain)} compounding</span>
                </div>
              </div>

              {/* Visual Proportion Bar */}
              <div className="distribution-wrapper" aria-label="Ratio of invested capital to estimated growth">
                <div className="distribution-bar">
                  <div
                    className="bar-invested"
                    style={{ width: `${investedPercent}%` }}
                    title={`Contributed: ${formatPercentage(investedPercent, 1)}`}
                  />
                  <div
                    className="bar-gain"
                    style={{ width: `${gainPercent}%` }}
                    title={`Gain: ${formatPercentage(gainPercent, 1)}`}
                  />
                </div>
                <div className="distribution-legend">
                  <div className="legend-item">
                    <span className="legend-dot dot-invested" />
                    <span>Invested Capital ({formatPercentage(investedPercent, 0)})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot dot-gain" />
                    <span>Compound Earnings ({formatPercentage(gainPercent, 0)})</span>
                  </div>
                </div>
              </div>

              {/* Step-Up Comparative Advantage Box */}
              {form.annualStepUpPercent > 0 && fixedCounterpartResult && (
                <div className="stepup-advantage-card">
                  <div className="advantage-header">
                    <span className="advantage-badge">Step-Up Advantage</span>
                    <span className="advantage-title">vs Fixed Monthly SIP</span>
                  </div>
                  <p className="advantage-text">
                    By stepping up your monthly SIP by {form.annualStepUpPercent}% annually, your final corpus grows by{' '}
                    <strong>{formatINR(result.futureValue - fixedCounterpartResult.futureValue)}</strong> over a fixed SIP.
                  </p>
                  <div className="advantage-metrics">
                    <div>
                      <span className="adv-lbl">Fixed SIP Corpus:</span>
                      <span className="adv-val">{formatIndianCompact(fixedCounterpartResult.futureValue)}</span>
                    </div>
                    <div>
                      <span className="adv-lbl">Step-Up Corpus:</span>
                      <span className="adv-val text-success">{formatIndianCompact(result.futureValue)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Toggle Button */}
              <div className="schedule-toggle-wrapper">
                <button
                  type="button"
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="btn-toggle-schedule"
                  aria-expanded={showSchedule}
                >
                  {showSchedule ? '▲ Hide Year-by-Year Schedule' : '▼ View Year-by-Year Growth Schedule'}
                </button>
              </div>
            </>
          ) : (
            <div className="invalid-state-box">
              <span className="invalid-icon">⚠️</span>
              <p className="invalid-msg">Please provide valid calculation parameters to display simulation results.</p>
            </div>
          )}
        </div>
      </div>

      {/* Year-by-Year Schedule Table (Collapsible) */}
      {isValid && result && showSchedule && (
        <div className="schedule-section">
          <div className="schedule-header">
            <h3 className="schedule-title">Annual Accumulation Schedule</h3>
            <span className="schedule-subtitle">Modelled with Beginning-of-Month Annuity-Due Timing</span>
          </div>

          <div className="table-responsive">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th scope="col">Year</th>
                  <th scope="col">Monthly SIP</th>
                  <th scope="col">Yearly Invested</th>
                  <th scope="col">Cumulative Invested</th>
                  <th scope="col">Year-End Value</th>
                  <th scope="col">Total Gain</th>
                </tr>
              </thead>
              <tbody>
                {result.yearlySchedule.map((row) => (
                  <tr key={row.year}>
                    <td className="font-bold">Year {row.year}</td>
                    <td>{formatINR(row.monthlyInstallment)}</td>
                    <td>{formatINR(row.annualInvested)}</td>
                    <td>{formatINR(row.cumulativeInvested)}</td>
                    <td className="font-bold text-primary">{formatINR(row.yearEndBalance)}</td>
                    <td className="text-gain">{formatINR(row.cumulativeGain)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Methodology & Regulatory Transparency Box */}
      <div className="methodology-card">
        <h3 className="methodology-title">How This Simulation Is Calculated</h3>
        <ul className="methodology-list">
          <li>
            <strong>Effective Annual Rate (EAR):</strong> The assumed return rate is converted to an exact geometric monthly rate using{' '}
            <code>i = (1 + r)^(1/12) - 1</code>, reflecting true annual compounding rather than simple nominal division.
          </li>
          <li>
            <strong>Beginning-of-Month Timing (Annuity-Due):</strong> Cash flows are modelled as invested on the first day of each monthly period, compounding for the entire month.
          </li>
          <li>
            <strong>Step-Up Implementation:</strong> The first 12 monthly installments remain at your base entry amount. The first step-up applies strictly at Month 13, the second at Month 25, and so on.
          </li>
          <li>
            <strong>Important Regulatory Notice:</strong> Mutual fund investments are subject to market risks. Read all scheme-related documents carefully. Calculated figures are purely illustrative mathematical projections based on assumed parameters and do not constitute an investment recommendation, guarantee, or market forecast.
          </li>
        </ul>
      </div>

      <style>{`
        .sip-island-wrapper {
          margin: var(--space-6) 0 var(--space-10);
        }

        .sip-island-card {
          background-color: var(--color-surface-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          box-shadow: var(--shadow-sm);
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-8);
        }

        @media (min-width: 1024px) {
          .sip-island-card {
            grid-template-columns: 1.15fr 0.85fr;
            padding: var(--space-8);
          }
        }

        .island-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-3);
          border-bottom: 1px solid var(--color-border);
        }

        .island-title {
          font-size: var(--font-size-xl);
          font-weight: 800;
          color: var(--color-text-primary);
          margin: 0;
        }

        .reset-btn {
          background: none;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 4px 10px;
          font-size: var(--font-size-xs);
          font-weight: 600;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .reset-btn:hover {
          color: var(--color-primary);
          border-color: var(--color-primary-light);
          background-color: var(--color-surface-sunken);
        }

        .form-group {
          margin-bottom: var(--space-6);
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .form-label {
          font-size: var(--font-size-sm);
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .input-with-symbol {
          display: flex;
          align-items: center;
          background-color: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 2px 8px;
        }

        .currency-prefix, .percent-suffix, .unit-suffix {
          font-size: var(--font-size-sm);
          font-weight: 700;
          color: var(--color-text-secondary);
        }

        .num-input {
          border: none;
          background: transparent;
          text-align: right;
          font-weight: 700;
          font-size: var(--font-size-base);
          color: var(--color-text-primary);
          width: 110px;
          padding: 4px;
        }

        .num-input:focus {
          outline: none;
        }

        .input-error {
          color: #dc2626;
        }

        .range-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #e2e8f0;
          outline: none;
          cursor: pointer;
          accent-color: var(--color-primary);
          margin: var(--space-2) 0;
        }

        .slider-ticks {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--color-text-muted, #94a3b8);
        }

        .field-error {
          display: block;
          margin-top: 4px;
          font-size: var(--font-size-xs);
          color: #dc2626;
          font-weight: 600;
        }

        .field-hint {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          color: var(--color-text-secondary);
        }

        /* Results Styling */
        .sip-results-col {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .result-hero-box {
          background: linear-gradient(135deg, #1a365d 0%, #2a4365 100%);
          color: #ffffff;
          padding: var(--space-6);
          border-radius: var(--radius-lg);
          text-align: center;
          box-shadow: 0 4px 12px rgba(26, 54, 93, 0.15);
        }

        .result-hero-label {
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.85;
          font-weight: 600;
        }

        .result-hero-value {
          font-size: var(--font-size-3xl);
          font-weight: 800;
          margin: var(--space-1) 0;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }

        .result-hero-compact {
          font-size: var(--font-size-sm);
          color: #e2e8f0;
          font-weight: 500;
        }

        .result-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
        }

        .metric-box {
          background-color: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: var(--font-size-xs);
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }

        .metric-value {
          font-size: var(--font-size-lg);
          font-weight: 800;
          color: var(--color-text-primary);
          margin: 4px 0 2px;
          font-variant-numeric: tabular-nums;
        }

        .metric-sub {
          font-size: 11px;
          color: var(--color-text-secondary);
        }

        .highlight-gain .metric-value {
          color: #047857;
        }

        /* Distribution Proportion Bar */
        .distribution-wrapper {
          margin-top: var(--space-2);
        }

        .distribution-bar {
          display: flex;
          height: 12px;
          border-radius: 6px;
          overflow: hidden;
          background-color: #e2e8f0;
        }

        .bar-invested {
          background-color: #3b82f6;
          transition: width 0.2s ease;
        }

        .bar-gain {
          background-color: #10b981;
          transition: width 0.2s ease;
        }

        .distribution-legend {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-top: 6px;
          color: var(--color-text-secondary);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot-invested {
          background-color: #3b82f6;
        }

        .dot-gain {
          background-color: #10b981;
        }

        /* Step-Up Advantage Card */
        .stepup-advantage-card {
          background-color: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }

        .advantage-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: 4px;
        }

        .advantage-badge {
          background-color: #047857;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }

        .advantage-title {
          font-size: var(--font-size-xs);
          font-weight: 700;
          color: #065f46;
        }

        .advantage-text {
          font-size: var(--font-size-xs);
          color: var(--color-text-primary);
          line-height: 1.4;
          margin: 0 0 var(--space-3);
        }

        .advantage-metrics {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-xs);
          padding-top: var(--space-2);
          border-top: 1px dashed rgba(16, 185, 129, 0.3);
        }

        .adv-lbl {
          color: var(--color-text-secondary);
          margin-right: 4px;
        }

        .adv-val {
          font-weight: 700;
        }

        .text-success {
          color: #047857;
        }

        .schedule-toggle-wrapper {
          text-align: center;
          margin-top: var(--space-2);
        }

        .btn-toggle-schedule {
          background: none;
          border: none;
          color: var(--color-primary);
          font-weight: 700;
          font-size: var(--font-size-sm);
          cursor: pointer;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-sm);
          transition: background-color 0.15s ease;
        }

        .btn-toggle-schedule:hover {
          background-color: var(--color-surface-sunken);
          text-decoration: underline;
        }

        /* Schedule Table */
        .schedule-section {
          margin-top: var(--space-6);
          background-color: var(--color-surface-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
        }

        .schedule-header {
          margin-bottom: var(--space-4);
        }

        .schedule-title {
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }

        .schedule-subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .table-responsive {
          overflow-x: auto;
        }

        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--font-size-xs);
          font-variant-numeric: tabular-nums;
        }

        .schedule-table th, .schedule-table td {
          padding: var(--space-3) var(--space-4);
          text-align: right;
          border-bottom: 1px solid var(--color-border);
        }

        .schedule-table th:first-child, .schedule-table td:first-child {
          text-align: left;
        }

        .schedule-table th {
          background-color: var(--color-surface-sunken);
          font-weight: 700;
          color: var(--color-text-secondary);
        }

        .text-primary {
          color: var(--color-primary);
        }

        .text-gain {
          color: #047857;
          font-weight: 600;
        }

        .font-bold {
          font-weight: 700;
        }

        /* Methodology Card */
        .methodology-card {
          margin-top: var(--space-6);
          background-color: var(--color-surface-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
        }

        .methodology-title {
          font-size: var(--font-size-base);
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 var(--space-3);
        }

        .methodology-list {
          margin: 0;
          padding-left: var(--space-5);
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .methodology-list li {
          margin-bottom: var(--space-2);
        }

        .methodology-list code {
          background-color: var(--color-surface-sunken);
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          color: var(--color-text-primary);
        }

        .invalid-state-box {
          padding: var(--space-8);
          background-color: var(--color-surface-sunken);
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-md);
          text-align: center;
        }

        .invalid-icon {
          font-size: var(--font-size-2xl);
          display: block;
          margin-bottom: var(--space-2);
        }

        .invalid-msg {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
