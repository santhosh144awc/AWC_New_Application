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

const DEFAULT_STATE: FormState = {
  initialCorpus: '10000000', // ₹1 Crore
  monthlySWP: '50000',       // ₹50,000/mo (6% annual withdrawal rate)
  annualReturnRate: '8.5',   // 8.5% p.a.
  stepUpRate: '5.0',         // 5% annual step-up
  currentAge: '60'
};

export default function SwpCalculatorIsland(): React.JSX.Element {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [lumpSums, setLumpSums] = useState<SWPLumpSumWithdrawal[]>([]);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [isSampleData, setIsSampleData] = useState<boolean>(true);
  const baseId = useId();

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsSampleData(false);
  };

  const handleReset = () => {
    setForm(DEFAULT_STATE);
    setLumpSums([]);
    setIsSampleData(true);
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

  const result: SWPResult = useMemo(() => {
    return calculateSWPPlan(inputs);
  }, [inputs]);

  // Annual withdrawal rate as % of initial corpus
  const initialAnnualWithdrawal = (Number(form.monthlySWP) || 0) * 12;
  const initialCorpusNum = Number(form.initialCorpus) || 1;
  const initialWithdrawalRatePercent = Math.round((initialAnnualWithdrawal / initialCorpusNum) * 1000) / 10;

  return (
    <div className="swp-simulator-workbench" id="swp-longevity-simulator">
      {/* Sample Data Banner */}
      {isSampleData && (
        <div className="sample-banner" role="status">
          <span className="banner-icon" aria-hidden="true">💡</span>
          <div className="banner-text">
            <strong>Sample SWP Sustainability Plan:</strong> ₹1 Crore invested at 8.5% p.a. providing ₹50,000/month initial cash flow with a 5% annual inflation step-up.
          </div>
          <button type="button" onClick={handleReset} className="btn-banner-reset">
            Reset to Baseline
          </button>
        </div>
      )}

      <div className="calc-layout-grid">
        {/* Input Panel */}
        <div className="calc-input-column card-surface">
          <div className="panel-title-row">
            <h3 className="panel-heading">SWP Parameters</h3>
            <button type="button" onClick={handleReset} className="btn-reset-text">↺ Reset</button>
          </div>

          {/* Initial Corpus */}
          <div className="form-group">
            <label htmlFor={`${baseId}-corpus`} className="field-label">Initial Investment Corpus (₹)</label>
            <div className="input-currency-wrapper">
              <span className="currency-prefix">₹</span>
              <input
                id={`${baseId}-corpus`}
                type="number"
                min="500000"
                max="500000000"
                step="100000"
                value={form.initialCorpus}
                onChange={(e) => handleInputChange('initialCorpus', e.target.value)}
                className="number-input"
              />
            </div>
            <input
              type="range"
              min="1000000"
              max="50000000"
              step="500000"
              value={Number(form.initialCorpus) || 10000000}
              onChange={(e) => handleInputChange('initialCorpus', e.target.value)}
              className="range-slider"
              aria-label="Initial corpus slider"
            />
            <div className="slider-limits">
              <span>₹10 Lakh</span>
              <span>₹5 Crore</span>
            </div>
          </div>

          {/* Monthly SWP Amount */}
          <div className="form-group">
            <div className="label-with-rate">
              <label htmlFor={`${baseId}-monthly`} className="field-label">Initial Monthly Withdrawal (₹)</label>
              <span className="withdrawal-rate-badge">Rate: {initialWithdrawalRatePercent}% p.a.</span>
            </div>
            <div className="input-currency-wrapper">
              <span className="currency-prefix">₹</span>
              <input
                id={`${baseId}-monthly`}
                type="number"
                min="5000"
                max="2000000"
                step="5000"
                value={form.monthlySWP}
                onChange={(e) => handleInputChange('monthlySWP', e.target.value)}
                className="number-input"
              />
            </div>
            <input
              type="range"
              min="10000"
              max="200000"
              step="5000"
              value={Number(form.monthlySWP) || 50000}
              onChange={(e) => handleInputChange('monthlySWP', e.target.value)}
              className="range-slider"
              aria-label="Monthly withdrawal slider"
            />
            <div className="slider-limits">
              <span>₹10,000/mo</span>
              <span>₹2,00,000/mo</span>
            </div>
          </div>

          {/* Expected Return & Step-Up */}
          <div className="grid-2col">
            <div className="form-group">
              <label htmlFor={`${baseId}-ret`} className="field-label">Expected Return (% p.a.)</label>
              <input
                id={`${baseId}-ret`}
                type="number"
                min="4"
                max="16"
                step="0.5"
                value={form.annualReturnRate}
                onChange={(e) => handleInputChange('annualReturnRate', e.target.value)}
                className="number-input"
              />
              <span className="input-hint">Hybrid/Equity benchmark: 8%–10%</span>
            </div>

            <div className="form-group">
              <label htmlFor={`${baseId}-stepUp`} className="field-label">Annual Step-Up (%)</label>
              <input
                id={`${baseId}-stepUp`}
                type="number"
                min="0"
                max="12"
                step="0.5"
                value={form.stepUpRate}
                onChange={(e) => handleInputChange('stepUpRate', e.target.value)}
                className="number-input"
              />
              <span className="input-hint">Inflation hedge for living expenses</span>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="calc-results-column">
          <div className="results-card card-surface">
            <div className="results-header">
              <span className="results-eyebrow">Portfolio Longevity Forecast</span>
              <h3 className="results-headline">Decumulation Sustainability</h3>
            </div>

            {/* Status Hero Box */}
            <div className={`hero-metric-box ${result.corpusDepleted ? 'depleted-box' : 'sustainable-box'}`}>
              <span className="hero-label">Portfolio Longevity Status</span>
              <div className="hero-value" data-testid="swp-duration-text">
                {result.corpusDepleted ? `Depletes in ${result.swpDurationYears} Years` : 'Sustains 50+ Years'}
              </div>
              <span className="hero-sub">
                {result.corpusDepleted
                  ? `At an initial withdrawal rate of ${initialWithdrawalRatePercent}% with a ${form.stepUpRate}% annual step-up, capital exhausts around ${result.depletionDate || `Year ${Math.round(result.swpDurationYears)}`}.`
                  : `Portfolio remains resilient throughout 50 years with an estimated ${formatIndianCompact(result.finalCorpus)} residual balance.`}
              </span>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-tag">Total Withdrawn</span>
                <div className="metric-val text-brand">{formatINR(result.totalWithdrawals)}</div>
                <span className="metric-sub">
                  {(result.totalWithdrawals / (Number(form.initialCorpus) || 1)).toFixed(1)}x initial capital
                </span>
              </div>

              <div className="metric-item">
                <span className="metric-tag">Ending Corpus</span>
                <div className="metric-val">{formatINR(result.finalCorpus)}</div>
                <span className="metric-sub">After 50 years or depletion</span>
              </div>
            </div>

            {/* Key Factual Insight */}
            <div className="insight-callout">
              <span className="insight-icon" aria-hidden="true">📊</span>
              <div className="insight-text">{result.keyInsight}</div>
            </div>

            {/* Table Toggle */}
            <div className="table-toggle-wrap">
              <button
                type="button"
                className="btn-toggle-table"
                onClick={() => setShowTable(!showTable)}
                aria-expanded={showTable}
              >
                {showTable ? 'Hide Annual Decumulation Schedule ▲' : 'View Annual Decumulation Schedule ▼'}
              </button>

              {showTable && (
                <div className="table-responsive">
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Opening Corpus</th>
                        <th>Monthly SWP</th>
                        <th>Annual Withdrawal</th>
                        <th>Closing Corpus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlySummary.slice(0, 30).map((row) => (
                        <tr key={row.yearNumber}>
                          <td className="year-cell">Year {row.yearNumber}</td>
                          <td>{formatINR(row.startingCorpus)}</td>
                          <td className="text-brand">{formatINR(row.monthlySWPAtYearStart)}</td>
                          <td className="text-rose">{formatINR(row.totalWithdrawals)}</td>
                          <td className="font-bold">{formatINR(row.endingCorpus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.yearlySummary.length > 30 && (
                    <p className="table-caption">Showing first 30 years of projection.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .swp-simulator-workbench {
          margin: 2rem 0;
          font-family: var(--font-family-body);
        }
        .sample-banner {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 0.85rem 1.25rem;
          border-radius: var(--radius-md, 8px);
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          color: #1e3a8a;
        }
        .btn-banner-reset {
          margin-left: auto;
          background: #2563eb;
          color: #fff;
          border: none;
          padding: 0.4rem 0.85rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          white-space: nowrap;
        }
        .calc-layout-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 1.5rem;
        }
        .calc-layout-grid > div {
          min-width: 0;
        }
        @media (max-width: 900px) {
          .calc-layout-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .sample-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .btn-banner-reset {
            margin-left: 0;
          }
          .grid-2col {
            grid-template-columns: 1fr !important;
          }
          .metrics-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .card-surface {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-lg, 12px);
          padding: 1.5rem;
        }
        .panel-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .panel-heading {
          font-size: 1.1rem;
          color: #0f172a;
          font-weight: 700;
        }
        .btn-reset-text {
          background: none;
          border: none;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .form-group {
          margin-bottom: 1.15rem;
        }
        .field-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.35rem;
        }
        .label-with-rate {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .withdrawal-rate-badge {
          font-size: 0.75rem;
          font-weight: 700;
          background: #f1f5f9;
          color: #0f766e;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .input-currency-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .currency-prefix {
          position: absolute;
          left: 0.75rem;
          color: #64748b;
          font-weight: 600;
        }
        .number-input {
          width: 100%;
          padding: 0.55rem 0.75rem 0.55rem 1.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
        }
        .range-slider {
          width: 100%;
          margin-top: 0.5rem;
          accent-color: #0f766e;
        }
        .slider-limits {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #64748b;
        }
        .grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .input-hint {
          display: block;
          font-size: 0.7rem;
          color: #64748b;
          margin-top: 0.2rem;
        }
        .hero-metric-box {
          border-radius: 8px;
          padding: 1.25rem;
          text-align: center;
          margin-bottom: 1.25rem;
        }
        .sustainable-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }
        .depleted-box {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #9f1239;
        }
        .hero-label {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .hero-value {
          font-size: 1.85rem;
          font-weight: 800;
          margin: 0.35rem 0;
        }
        .hero-sub {
          font-size: 0.85rem;
          line-height: 1.4;
          display: block;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .metric-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }
        .metric-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }
        .metric-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0.25rem 0;
        }
        .metric-sub {
          font-size: 0.75rem;
          color: #64748b;
        }
        .insight-callout {
          display: flex;
          gap: 0.75rem;
          background: #f1f5f9;
          border-left: 4px solid #0f766e;
          padding: 0.85rem 1rem;
          border-radius: 4px;
          font-size: 0.85rem;
          color: #334155;
          line-height: 1.5;
          margin-bottom: 1.25rem;
        }
        .table-toggle-wrap {
          border-top: 1px solid #e2e8f0;
          padding-top: 1rem;
        }
        .btn-toggle-table {
          background: none;
          border: none;
          color: #0f766e;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0;
        }
        .table-responsive {
          margin-top: 1rem;
          overflow-x: auto;
          max-height: 350px;
        }
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
          text-align: right;
        }
        .schedule-table th, .schedule-table td {
          padding: 0.5rem 0.65rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .schedule-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 700;
          position: sticky;
          top: 0;
        }
        .year-cell {
          text-align: left;
          font-weight: 600;
        }
        .text-rose { color: #e11d48; }
        .font-bold { font-weight: 700; }
        .table-caption {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
