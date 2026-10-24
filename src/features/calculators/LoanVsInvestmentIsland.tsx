import React, { useState, useId, useMemo } from 'react';
import {
  calculateLoanVsInvestment,
  type LoanVsInvestmentInput,
  type LoanVsInvestmentResult
} from '../../domain/finance/loanVsInvest';
import { formatINR } from '../../lib/formatters';

interface FormState {
  loanAmount: string;
  loanInterestRate: string;
  loanTenureYears: string;
  lumpsumAvailable: string;
  expectedInvestmentReturn: string;
  investmentPeriodYears: string;
}

const DEFAULT_STATE: FormState = {
  loanAmount: '3000000',          // ₹30 Lakhs
  loanInterestRate: '8.5',        // 8.5% p.a.
  loanTenureYears: '15',          // 15 years
  lumpsumAvailable: '500000',     // ₹5 Lakhs
  expectedInvestmentReturn: '12.0',// 12% p.a.
  investmentPeriodYears: '15'     // 15 years
};

export default function LoanVsInvestmentIsland(): React.JSX.Element {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [isSampleData, setIsSampleData] = useState<boolean>(true);
  const baseId = useId();

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsSampleData(false);
  };

  const handleReset = () => {
    setForm(DEFAULT_STATE);
    setIsSampleData(true);
  };

  const input: LoanVsInvestmentInput = useMemo(() => ({
    loanAmount: Math.max(0, Number(form.loanAmount) || 0),
    loanInterestRate: Math.max(0, Number(form.loanInterestRate) || 0),
    loanTenureYears: Math.max(1, Number(form.loanTenureYears) || 1),
    lumpsumAvailable: Math.max(0, Number(form.lumpsumAvailable) || 0),
    expectedInvestmentReturn: Math.max(0, Number(form.expectedInvestmentReturn) || 0),
    investmentPeriodYears: Math.max(1, Number(form.investmentPeriodYears) || 1)
  }), [form]);

  const result: LoanVsInvestmentResult = useMemo(() => {
    return calculateLoanVsInvestment(input);
  }, [input]);

  const isInvestBetter = result.betterOption === 'Invest';
  const isPrepayBetter = result.betterOption === 'Prepay';

  return (
    <div className="loan-vs-invest-workbench" id="loan-vs-invest-calculator">
      {/* Sample Data Banner */}
      {isSampleData && (
        <div className="sample-banner" role="status">
          <span className="banner-icon" aria-hidden="true">💡</span>
          <div className="banner-text">
            <strong>Sample Comparison Scenario:</strong> ₹30 Lakhs home loan at 8.5% with ₹5 Lakhs surplus capital evaluated against a 12% equity investment alternative over 15 years.
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
            <h3 className="panel-heading">Decision Parameters</h3>
            <button type="button" onClick={handleReset} className="btn-reset-text">↺ Reset</button>
          </div>

          {/* Outstanding Loan Principal */}
          <div className="form-group">
            <label htmlFor={`${baseId}-loanAmt`} className="field-label">Outstanding Loan Principal (₹)</label>
            <div className="input-currency-wrapper">
              <span className="currency-prefix">₹</span>
              <input
                id={`${baseId}-loanAmt`}
                type="number"
                min="100000"
                max="50000000"
                step="50000"
                value={form.loanAmount}
                onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                className="number-input"
              />
            </div>
            <input
              type="range"
              min="200000"
              max="10000000"
              step="50000"
              value={Number(form.loanAmount) || 3000000}
              onChange={(e) => handleInputChange('loanAmount', e.target.value)}
              className="range-slider"
              aria-label="Loan principal slider"
            />
            <div className="slider-limits">
              <span>₹2 Lakh</span>
              <span>₹1 Crore</span>
            </div>
          </div>

          {/* Lumpsum Surplus Available */}
          <div className="form-group">
            <label htmlFor={`${baseId}-lump`} className="field-label">Surplus Lumpsum Available (₹)</label>
            <div className="input-currency-wrapper">
              <span className="currency-prefix">₹</span>
              <input
                id={`${baseId}-lump`}
                type="number"
                min="25000"
                max={Number(form.loanAmount) || 5000000}
                step="25000"
                value={form.lumpsumAvailable}
                onChange={(e) => handleInputChange('lumpsumAvailable', e.target.value)}
                className="number-input"
              />
            </div>
            <input
              type="range"
              min="50000"
              max="3000000"
              step="25000"
              value={Number(form.lumpsumAvailable) || 500000}
              onChange={(e) => handleInputChange('lumpsumAvailable', e.target.value)}
              className="range-slider"
              aria-label="Surplus lumpsum slider"
            />
            <div className="slider-limits">
              <span>₹50,000</span>
              <span>₹30 Lakh</span>
            </div>
          </div>

          {/* Loan Interest & Tenure */}
          <div className="grid-2col">
            <div className="form-group">
              <label htmlFor={`${baseId}-rate`} className="field-label">Loan Interest (% p.a.)</label>
              <input
                id={`${baseId}-rate`}
                type="number"
                min="4"
                max="18"
                step="0.25"
                value={form.loanInterestRate}
                onChange={(e) => handleInputChange('loanInterestRate', e.target.value)}
                className="number-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor={`${baseId}-tenure`} className="field-label">Remaining Tenure (Years)</label>
              <input
                id={`${baseId}-tenure`}
                type="number"
                min="1"
                max="30"
                value={form.loanTenureYears}
                onChange={(e) => {
                  handleInputChange('loanTenureYears', e.target.value);
                  handleInputChange('investmentPeriodYears', e.target.value);
                }}
                className="number-input"
              />
            </div>
          </div>

          {/* Expected Return */}
          <div className="form-group">
            <label htmlFor={`${baseId}-invRate`} className="field-label">Expected Investment Return (% p.a.)</label>
            <input
              id={`${baseId}-invRate`}
              type="number"
              min="5"
              max="18"
              step="0.5"
              value={form.expectedInvestmentReturn}
              onChange={(e) => handleInputChange('expectedInvestmentReturn', e.target.value)}
              className="number-input"
            />
            <span className="input-hint">Equity mutual funds historical benchmark: 11%–13%</span>
          </div>
        </div>

        {/* Results Panel */}
        <div className="calc-results-column">
          <div className="results-card card-surface">
            <div className="results-header">
              <span className="results-eyebrow">Strategic Evaluation</span>
              <h3 className="results-headline">Trade-Off Analysis</h3>
            </div>

            {/* Verdict Hero Box */}
            <div className={`hero-metric-box ${isInvestBetter ? 'invest-box' : isPrepayBetter ? 'prepay-box' : 'balanced-box'}`}>
              <span className="hero-label">Recommended Orientation</span>
              <div className="hero-value" data-testid="arbitrage-verdict">
                {isInvestBetter ? 'Option B: Invest Surplus' : isPrepayBetter ? 'Option A: Prepay Loan' : 'Balanced Approach'}
              </div>
              <span className="hero-sub">
                {isInvestBetter
                  ? `Compounding surplus in equity generates an estimated ₹${Math.abs(result.netFinancialDifference).toLocaleString('en-IN')} higher net financial value than interest saved.`
                  : isPrepayBetter
                  ? `Loan interest rate exceeds investment return. Prepaying saves ₹${result.interestSavedByPrepayment.toLocaleString('en-IN')} in guaranteed interest.`
                  : 'Return rate differential is narrow. Consider a 50/50 split between debt prepayment and wealth creation.'}
              </span>
            </div>

            {/* Side-by-Side Comparison Grid */}
            <div className="options-comparison-grid">
              {/* Option A Card */}
              <div className={`option-card ${isPrepayBetter ? 'highlighted-option' : ''}`}>
                <div className="option-badge badge-prepay">Option A · Prepay</div>
                <h4 className="option-title">Guaranteed Debt Reduction</h4>
                <div className="option-metric-row">
                  <span className="opt-label">Prepayment Applied:</span>
                  <strong>{formatINR(result.prepaymentAmount)}</strong>
                </div>
                <div className="option-metric-row">
                  <span className="opt-label">Interest Saved:</span>
                  <strong className="text-emerald">{formatINR(result.interestSavedByPrepayment)}</strong>
                </div>
                <div className="option-metric-row">
                  <span className="opt-label">New Reduced EMI:</span>
                  <strong>{formatINR(result.newMonthlyEMI)}</strong>
                </div>
                <span className="option-note">Guaranteed peace of mind, but capital is locked in real estate equity.</span>
              </div>

              {/* Option B Card */}
              <div className={`option-card ${isInvestBetter ? 'highlighted-option' : ''}`}>
                <div className="option-badge badge-invest">Option B · Invest</div>
                <h4 className="option-title">Equity Compounding</h4>
                <div className="option-metric-row">
                  <span className="opt-label">Capital Invested:</span>
                  <strong>{formatINR(result.prepaymentAmount)}</strong>
                </div>
                <div className="option-metric-row">
                  <span className="opt-label">Estimated Wealth:</span>
                  <strong className="text-brand">{formatINR(result.investmentFutureValue)}</strong>
                </div>
                <div className="option-metric-row">
                  <span className="opt-label">Estimated Gain:</span>
                  <strong className="text-brand">{formatINR(result.investmentGain)}</strong>
                </div>
                <span className="option-note">Retains 100% emergency liquidity, subject to market risk and volatility.</span>
              </div>
            </div>

            {/* Summary Callout */}
            <div className="insight-callout">
              <span className="insight-icon" aria-hidden="true">⚖️</span>
              <div className="insight-text">{result.summaryInsight}</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .loan-vs-invest-workbench {
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
          .options-comparison-grid {
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
        .invest-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }
        .prepay-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        }
        .balanced-box {
          background: #fefce8;
          border: 1px solid #fef08a;
          color: #854d0e;
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
        .options-comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        @media (max-width: 650px) {
          .options-comparison-grid {
            grid-template-columns: 1fr;
          }
        }
        .option-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }
        .highlighted-option {
          background: #f0fdfa;
          border-color: #99f6e4;
        }
        .option-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          margin-bottom: 0.4rem;
          align-self: flex-start;
        }
        .badge-prepay { background: #dbeafe; color: #1e40af; }
        .badge-invest { background: #ccfbf1; color: #0f766e; }
        .option-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.75rem;
        }
        .option-metric-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 0.35rem;
          color: #334155;
        }
        .text-emerald { color: #059669; }
        .option-note {
          font-size: 0.7rem;
          color: #64748b;
          margin-top: auto;
          padding-top: 0.5rem;
          line-height: 1.35;
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
        }
      `}</style>
    </div>
  );
}
