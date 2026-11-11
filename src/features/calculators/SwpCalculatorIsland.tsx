import React, { useState, useId, useMemo } from 'react';
import {
  calculateSWPPlan,
  type SWPInputs,
  type SWPResult,
  type SWPLumpSumWithdrawal
} from '../../domain/finance/swp';
import { formatINR, formatIndianCompact } from '../../lib/formatters';

interface FormState {
  initialCorpus: string;
  monthlySWP: string;
  annualReturnRate: string;
  stepUpRate: string;
  currentAge: string;
}

const EMPTY_STATE: FormState = {
  initialCorpus: '',
  monthlySWP: '',
  annualReturnRate: '',
  stepUpRate: '',
  currentAge: ''
};

const SAMPLE_STATE: FormState = {
  initialCorpus: '10000000', // ₹1 Crore
  monthlySWP: '50000',       // ₹50,000/mo (6% annual withdrawal rate)
  annualReturnRate: '8.5',   // 8.5% p.a.
  stepUpRate: '5.0',         // 5% annual step-up
  currentAge: '60'
};

export default function SwpCalculatorIsland(): React.JSX.Element {
  const [form, setForm] = useState<FormState>(EMPTY_STATE);
  const [lumpSums, setLumpSums] = useState<SWPLumpSumWithdrawal[]>([]);
  const [showTable, setShowTable] = useState<boolean>(false);
  const baseId = useId();

  const isBlank =
    form.initialCorpus.trim() === '' &&
    form.monthlySWP.trim() === '' &&
    form.annualReturnRate.trim() === '' &&
    form.stepUpRate.trim() === '';

  const isValid =
    Number(form.initialCorpus) > 0 &&
    Number(form.monthlySWP) > 0 &&
    form.annualReturnRate.trim() !== '' &&
    Number(form.annualReturnRate) >= 0;

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoadSample = () => {
    setForm(SAMPLE_STATE);
    setLumpSums([]);
    setShowTable(false);
  };

  const handleClear = () => {
    setForm(EMPTY_STATE);
    setLumpSums([]);
    setShowTable(false);
  };

  const inputs: SWPInputs = useMemo(() => ({
    initialCorpus: Math.max(0, Number(form.initialCorpus) || 0),
    monthlySWP: Math.max(0, Number(form.monthlySWP) || 0),
    annualReturnRate: Math.max(0, Number(form.annualReturnRate) || 0),
    stepUpRate: Math.max(0, Number(form.stepUpRate) || 0),
    currentAge: Math.max(18, Math.min(100, Number(form.currentAge) || 60)),
    lumpSums
  }), [form, lumpSums]);

  const result: SWPResult | null = useMemo(() => {
    if (!isValid) return null;
    return calculateSWPPlan(inputs);
  }, [inputs, isValid]);

  const initialAnnualWithdrawal = (Number(form.monthlySWP) || 0) * 12;
  const initialCorpusNum = Number(form.initialCorpus) || 1;
  const initialWithdrawalRatePercent = isValid ? Math.round((initialAnnualWithdrawal / initialCorpusNum) * 1000) / 10 : 0;

  const sliderCorpus = Number.isFinite(Number(form.initialCorpus)) && form.initialCorpus.trim() !== ''
    ? Math.min(50000000, Math.max(500000, Number(form.initialCorpus)))
    : 500000;
  const sliderMonthly = Number.isFinite(Number(form.monthlySWP)) && form.monthlySWP.trim() !== ''
    ? Math.min(200000, Math.max(5000, Number(form.monthlySWP)))
    : 5000;
  const sliderReturn = Number.isFinite(Number(form.annualReturnRate)) && form.annualReturnRate.trim() !== ''
    ? Math.min(16, Math.max(4, Number(form.annualReturnRate)))
    : 4;
  const sliderStepUp = Number.isFinite(Number(form.stepUpRate)) && form.stepUpRate.trim() !== ''
    ? Math.min(12, Math.max(0, Number(form.stepUpRate)))
    : 0;

  return (
    <div className="swp-simulator-workbench" id="swp-longevity-simulator">
      <div className="workbench-grid">
        {/* Left Column: Standard Assumptions Card */}
        <section className="workbench-card surface controls-card" aria-labelledby="swp-controls-heading">
          <div className="controls-header">
            <div>
              <h2 id="swp-controls-heading" className="calc-title">SWP Details</h2>
              <p className="calc-description">Enter your withdrawal plan or load sample data.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                id="load-sample-swp-btn"
                onClick={handleLoadSample}
                className="sample-btn"
              >
                Sample Data
              </button>
              {!isBlank && (
                <button
                  type="button"
                  id="reset-swp-btn"
                  onClick={handleClear}
                  className="reset-btn"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="swp-form">
            {/* 1. Initial Corpus */}
            <div className="range-field form-group">
              <div className="field-head label-row">
                <label htmlFor={`${baseId}-corpus`} className="field-label form-label">
                  Initial Investment Corpus
                </label>
                <div className="input-with-symbol">
                  <span className="currency-prefix">₹</span>
                  <input
                    id={`${baseId}-corpus`}
                    type="number"
                    placeholder="0"
                    min="500000"
                    max="500000000"
                    step="100000"
                    value={form.initialCorpus}
                    onChange={(e) => handleInputChange('initialCorpus', e.target.value)}
                    className="num-input"
                  />
                </div>
              </div>
              <input
                type="range"
                min="500000"
                max="50000000"
                step="500000"
                value={sliderCorpus}
                onChange={(e) => handleInputChange('initialCorpus', e.target.value)}
                className="range-slider"
                aria-label="Initial corpus slider"
              />
              <div className="range-ends slider-ticks">
                <span>₹5 Lakh</span>
                <span>₹5 Crore</span>
              </div>
            </div>

            {/* 2. Monthly Withdrawal */}
            <div className="range-field form-group">
              <div className="field-head label-row">
                <div>
                  <label htmlFor={`${baseId}-monthly`} className="field-label form-label">
                    Monthly Withdrawal
                  </label>
                  {isValid && (
                    <span className="rate-pill">
                      {initialWithdrawalRatePercent}% p.a. withdrawal rate
                    </span>
                  )}
                </div>
                <div className="input-with-symbol">
                  <span className="currency-prefix">₹</span>
                  <input
                    id={`${baseId}-monthly`}
                    type="number"
                    placeholder="0"
                    min="5000"
                    max="2000000"
                    step="5000"
                    value={form.monthlySWP}
                    onChange={(e) => handleInputChange('monthlySWP', e.target.value)}
                    className="num-input"
                  />
                </div>
              </div>
              <input
                type="range"
                min="5000"
                max="200000"
                step="5000"
                value={sliderMonthly}
                onChange={(e) => handleInputChange('monthlySWP', e.target.value)}
                className="range-slider"
                aria-label="Monthly withdrawal slider"
              />
              <div className="range-ends slider-ticks">
                <span>₹5,000/mo</span>
                <span>₹2,00,000/mo</span>
              </div>
            </div>

            {/* 3. Expected Return */}
            <div className="range-field form-group">
              <div className="field-head label-row">
                <label htmlFor={`${baseId}-ret`} className="field-label form-label">
                  Assumed Annual Return
                </label>
                <div className="input-with-symbol">
                  <input
                    id={`${baseId}-ret`}
                    type="number"
                    placeholder="0"
                    min="0"
                    max="25"
                    step="0.5"
                    value={form.annualReturnRate}
                    onChange={(e) => handleInputChange('annualReturnRate', e.target.value)}
                    className="num-input"
                  />
                  <span className="percent-suffix">%</span>
                </div>
              </div>
              <input
                type="range"
                min="4"
                max="16"
                step="0.5"
                value={sliderReturn}
                onChange={(e) => handleInputChange('annualReturnRate', e.target.value)}
                className="range-slider"
                aria-label="Expected annual return slider"
              />
              <div className="range-ends slider-ticks">
                <span>4%</span>
                <span>16%</span>
              </div>
            </div>

            {/* 4. Annual Step-Up */}
            <div className="range-field form-group">
              <div className="field-head label-row">
                <label htmlFor={`${baseId}-stepUp`} className="field-label form-label">
                  Annual Withdrawal Step-Up (Optional)
                </label>
                <div className="input-with-symbol">
                  <input
                    id={`${baseId}-stepUp`}
                    type="number"
                    placeholder="0"
                    min="0"
                    max="15"
                    step="0.5"
                    value={form.stepUpRate}
                    onChange={(e) => handleInputChange('stepUpRate', e.target.value)}
                    className="num-input"
                  />
                  <span className="percent-suffix">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={sliderStepUp}
                onChange={(e) => handleInputChange('stepUpRate', e.target.value)}
                className="range-slider"
                aria-label="Annual step-up slider"
              />
              <div className="range-ends slider-ticks">
                <span>0% (Fixed SWP)</span>
                <span>12%</span>
              </div>
            </div>
          </form>
        </section>

        {/* Right Column: Concept C Deep Atlantic Navy Results Panel */}
        <aside className="workbench-card result-panel swp-results-col" id="workbench-results" aria-labelledby="swp-results-heading">
          {result ? (
            <>
              <div className="result-hero-box">
                <span id="swp-results-heading" className="result-label">
                  Portfolio Longevity Status
                </span>
                <div className="result-number" data-testid="swp-duration-text">
                  {result.corpusDepleted ? `Depletes in ${result.swpDurationYears} Years` : 'Sustains 50+ Years'}
                </div>
                <div className="result-compact">
                  Initial Withdrawal Rate: {initialWithdrawalRatePercent}% p.a.
                </div>
                <p className="result-explainer">
                  {result.corpusDepleted
                    ? `With a ${Number(form.stepUpRate) || 0}% annual step-up, the corpus exhausts around ${result.depletionDate || `Year ${Math.round(result.swpDurationYears)}`}.`
                    : `Portfolio sustains withdrawals across 50 years with an estimated ${formatIndianCompact(result.finalCorpus)} closing balance.`}
                </p>
              </div>

              <div className="metric-grid">
                <div className="metric">
                  <small className="metric-label">Total Withdrawn</small>
                  <b className="metric-value highlight-val">{formatINR(result.totalWithdrawals)}</b>
                  <span className="metric-sub">
                    {(result.totalWithdrawals / (Number(form.initialCorpus) || 1)).toFixed(1)}x initial capital
                  </span>
                </div>

                <div className="metric">
                  <small className="metric-label">Ending Corpus</small>
                  <b className="metric-value">{formatINR(result.finalCorpus)}</b>
                  <span className="metric-sub">After 50 years or depletion</span>
                </div>
              </div>

              <div className="insight-card">
                <span className="insight-badge">Longevity Insight</span>
                <p className="insight-text">{result.keyInsight}</p>
              </div>

              <div className="schedule-toggle-wrapper">
                <button
                  type="button"
                  id="toggle-swp-schedule-btn"
                  className="btn-toggle-schedule"
                  onClick={() => setShowTable(!showTable)}
                  aria-expanded={showTable}
                >
                  {showTable ? '▲ Hide Year-by-Year Growth Schedule' : '▼ View Year-by-Year Growth Schedule'}
                </button>
              </div>

              <p className="result-foot">
                Simulates monthly withdrawals with geometric return compounding. Excludes capital gains tax, exit loads, and market sequence-of-returns volatility.
              </p>
            </>
          ) : (
            <div className="invalid-state-box">
              <span className="invalid-icon">{isBlank ? '📊' : '⚠️'}</span>
              <p className="invalid-msg">
                {isBlank
                  ? 'Enter your SWP details on the left or click "Sample Data" to preview a scenario.'
                  : 'Please enter valid positive corpus, monthly withdrawal, and return rate.'}
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Full-Width Collapsible Schedule Section Below Grid */}
      {isValid && result && showTable && (
        <section className="surface schedule-section" aria-labelledby="swp-schedule-heading">
          <div className="schedule-header">
            <h3 id="swp-schedule-heading" className="schedule-title">Year-by-Year Decumulation Schedule</h3>
            <span className="schedule-subtitle">Showing first 30 years of monthly SWP progression</span>
          </div>

          <div className="table-responsive">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th scope="col">Year</th>
                  <th scope="col">Opening Corpus</th>
                  <th scope="col">Monthly SWP</th>
                  <th scope="col">Annual Withdrawal</th>
                  <th scope="col">Closing Corpus</th>
                </tr>
              </thead>
              <tbody>
                {result.yearlySummary.slice(0, 30).map((row) => (
                  <tr key={row.yearNumber}>
                    <td className="col-year">Year {row.yearNumber}</td>
                    <td>{formatINR(row.startingCorpus)}</td>
                    <td className="col-growth">{formatINR(row.monthlySWPAtYearStart)}</td>
                    <td className="col-withdrawal">{formatINR(row.totalWithdrawals)}</td>
                    <td className="col-balance">{formatINR(row.endingCorpus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <style>{`
        .swp-simulator-workbench {
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

        .swp-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .range-field {
          padding-bottom: 18px;
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

        .rate-pill {
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
        .percent-suffix {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-muted);
          user-select: none;
        }

        .currency-prefix {
          margin-right: 4px;
        }

        .percent-suffix {
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
          margin-bottom: 22px;
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
          font-size: clamp(26px, 3.6vw, 36px);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin: 10px 0 6px;
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
          position: relative;
          z-index: 1;
          margin-bottom: 18px;
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

        .metric-value.highlight-val {
          color: #5EEAD4;
        }

        .metric-sub {
          font-size: 10px;
          color: #A3BFB8;
        }

        .insight-card {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 18px;
        }

        .insight-badge {
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

        .insight-text {
          font-size: 11.5px;
          color: #DDEBE7;
          line-height: 1.5;
          margin: 0;
        }

        .schedule-toggle-wrapper {
          position: relative;
          z-index: 1;
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

        .col-growth {
          color: var(--color-text-brand);
          font-weight: 700;
        }

        .col-withdrawal {
          color: #B42318;
          font-weight: 600;
        }

        .col-balance {
          font-weight: 800;
          color: var(--awc-navy);
        }
      `}</style>
    </div>
  );
}
