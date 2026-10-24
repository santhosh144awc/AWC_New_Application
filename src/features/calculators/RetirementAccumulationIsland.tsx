import React, { useState, useId, useMemo } from 'react';
import {
  calculateRetirementAccumulationPlan,
  type RetirementPlannerInput,
  type RetirementPlannerResult
} from '../../domain/finance/retirementAccumulation';
import { formatINR, formatIndianCompact } from '../../lib/formatters';

interface FormState {
  // Step 1: Expenses
  householdExpenses: string;
  lifestyleExpenses: string;
  otherExpenses: string;
  // Step 2: Timeline
  currentAge: string;
  retirementAge: string;
  inflationPreRetirement: string;
  expenseReductionPercent: string;
  // Step 3: Corpus
  lifeExpectancyAge: string;
  inflationPostRetirement: string;
  corpusReturnPreTax: string;
  taxRateOnCorpusReturn: string;
  childrenOrCharityCorpus: string;
  // Step 4: Existing Assets
  epfNps: string;
  gratuity: string;
  superannuationOther: string;
  fixedDeposits: string;
  insuranceMaturity: string;
  mutualFundsInvestments: string;
  // Step 5: Fresh Investment
  startInvestingDelay: string;
  expectedNewInvestmentReturn: string;
  annualStepUpRate: string;
}

const DEFAULT_STATE: FormState = {
  householdExpenses: '1200000',
  lifestyleExpenses: '0',
  otherExpenses: '0',
  currentAge: '45',
  retirementAge: '60',
  inflationPreRetirement: '6',
  expenseReductionPercent: '20',
  lifeExpectancyAge: '85',
  inflationPostRetirement: '6',
  corpusReturnPreTax: '10.5',
  taxRateOnCorpusReturn: '12.5',
  childrenOrCharityCorpus: '0',
  epfNps: '5000000',
  gratuity: '2000000',
  superannuationOther: '0',
  fixedDeposits: '1500000',
  insuranceMaturity: '1000000',
  mutualFundsInvestments: '2500000',
  startInvestingDelay: '0',
  expectedNewInvestmentReturn: '12',
  annualStepUpRate: '10'
};

export default function RetirementAccumulationIsland(): React.JSX.Element {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState<'expenses' | 'timeline' | 'assets' | 'funding'>('expenses');
  const [isSampleData, setIsSampleData] = useState<boolean>(true);
  const baseId = useId();

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsSampleData(false);
  };

  const handleReset = () => {
    setForm(DEFAULT_STATE);
    setIsSampleData(true);
    setActiveTab('expenses');
  };

  // Convert form strings to numbers
  const input: RetirementPlannerInput = useMemo(() => ({
    expenses: {
      householdExpenses: Math.max(0, Number(form.householdExpenses) || 0),
      lifestyleExpenses: Math.max(0, Number(form.lifestyleExpenses) || 0),
      otherExpenses: Math.max(0, Number(form.otherExpenses) || 0)
    },
    timeline: {
      currentAge: Math.max(18, Math.min(99, Number(form.currentAge) || 45)),
      retirementAge: Math.max(Number(form.currentAge) + 1 || 46, Math.min(100, Number(form.retirementAge) || 60)),
      inflationPreRetirement: Math.max(0, Number(form.inflationPreRetirement) || 6),
      expenseReductionPercent: Math.max(0, Math.min(100, Number(form.expenseReductionPercent) || 20))
    },
    corpus: {
      lifeExpectancyAge: Math.max(Number(form.retirementAge) + 1 || 61, Math.min(120, Number(form.lifeExpectancyAge) || 85)),
      inflationPostRetirement: Math.max(0, Number(form.inflationPostRetirement) || 6),
      corpusReturnPreTax: Math.max(0, Number(form.corpusReturnPreTax) || 10.5),
      taxRateOnCorpusReturn: Math.max(0, Number(form.taxRateOnCorpusReturn) || 12.5),
      childrenOrCharityCorpus: Math.max(0, Number(form.childrenOrCharityCorpus) || 0)
    },
    employmentBenefits: {
      epfNps: Math.max(0, Number(form.epfNps) || 0),
      gratuity: Math.max(0, Number(form.gratuity) || 0),
      superannuationOther: Math.max(0, Number(form.superannuationOther) || 0)
    },
    retirementAssets: {
      fixedDeposits: Math.max(0, Number(form.fixedDeposits) || 0),
      insuranceMaturity: Math.max(0, Number(form.insuranceMaturity) || 0),
      mutualFundsInvestments: Math.max(0, Number(form.mutualFundsInvestments) || 0)
    },
    funding: {
      startInvestingDelay: Math.max(0, Number(form.startInvestingDelay) || 0),
      expectedNewInvestmentReturn: Math.max(0, Number(form.expectedNewInvestmentReturn) || 12),
      annualStepUpRate: Math.max(0, Number(form.annualStepUpRate) || 10)
    }
  }), [form]);

  const result: RetirementPlannerResult = useMemo(() => {
    return calculateRetirementAccumulationPlan(input);
  }, [input]);

  return (
    <div className="retirement-accumulator-workbench" id="retirement-accumulation-calculator">
      {/* Benchmark Banner */}
      {isSampleData && (
        <div className="sample-banner" role="status">
          <span className="banner-icon" aria-hidden="true">💡</span>
          <div className="banner-text">
            <strong>Sample Family Planning Baseline:</strong> Age 45 retiring at 60 with ₹12L current annual living expenses and ₹1.2 Cr accumulated savings. Adjust any tab to personalize.
          </div>
          <button type="button" onClick={handleReset} className="btn-banner-reset">
            Reset to Baseline
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="calc-layout-grid">
        {/* Input Navigation & Controls Panel */}
        <div className="calc-input-column card-surface">
          <div className="input-tabs-header">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              1. Expenses
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              2. Timeline
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
              onClick={() => setActiveTab('assets')}
            >
              3. Existing Assets
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'funding' ? 'active' : ''}`}
              onClick={() => setActiveTab('funding')}
            >
              4. SIP Strategy
            </button>
          </div>

          <div className="tab-content-panel">
            {/* TAB 1: Expenses */}
            {activeTab === 'expenses' && (
              <div className="tab-pane">
                <h3 className="tab-title">Current Family Living Expenses</h3>
                <div className="form-group">
                  <label htmlFor={`${baseId}-household`} className="field-label">
                    Household Living Expenses (₹/year)
                  </label>
                  <div className="input-currency-wrapper">
                    <span className="currency-prefix">₹</span>
                    <input
                      id={`${baseId}-household`}
                      type="number"
                      min="100000"
                      max="10000000"
                      step="50000"
                      value={form.householdExpenses}
                      onChange={(e) => handleInputChange('householdExpenses', e.target.value)}
                      className="number-input"
                    />
                  </div>
                  <input
                    type="range"
                    min="200000"
                    max="5000000"
                    step="50000"
                    value={Number(form.householdExpenses) || 1200000}
                    onChange={(e) => handleInputChange('householdExpenses', e.target.value)}
                    className="range-slider"
                    aria-label="Household expenses slider"
                  />
                  <div className="slider-limits">
                    <span>₹2 Lakh</span>
                    <span>₹50 Lakh</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor={`${baseId}-lifestyle`} className="field-label">
                    Discretionary / Travel Expenses (₹/year)
                  </label>
                  <div className="input-currency-wrapper">
                    <span className="currency-prefix">₹</span>
                    <input
                      id={`${baseId}-lifestyle`}
                      type="number"
                      min="0"
                      max="5000000"
                      step="25000"
                      value={form.lifestyleExpenses}
                      onChange={(e) => handleInputChange('lifestyleExpenses', e.target.value)}
                      className="number-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Timeline & Inflation */}
            {activeTab === 'timeline' && (
              <div className="tab-pane">
                <h3 className="tab-title">Retirement Timeline &amp; Longevity</h3>
                <div className="grid-2col">
                  <div className="form-group">
                    <label htmlFor={`${baseId}-currentAge`} className="field-label">Current Age</label>
                    <input
                      id={`${baseId}-currentAge`}
                      type="number"
                      min="18"
                      max="75"
                      value={form.currentAge}
                      onChange={(e) => handleInputChange('currentAge', e.target.value)}
                      className="number-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`${baseId}-retirementAge`} className="field-label">Retirement Age</label>
                    <input
                      id={`${baseId}-retirementAge`}
                      type="number"
                      min="40"
                      max="80"
                      value={form.retirementAge}
                      onChange={(e) => handleInputChange('retirementAge', e.target.value)}
                      className="number-input"
                    />
                  </div>
                </div>

                <div className="grid-2col">
                  <div className="form-group">
                    <label htmlFor={`${baseId}-lifeExp`} className="field-label">Life Expectancy Age</label>
                    <input
                      id={`${baseId}-lifeExp`}
                      type="number"
                      min="65"
                      max="105"
                      value={form.lifeExpectancyAge}
                      onChange={(e) => handleInputChange('lifeExpectancyAge', e.target.value)}
                      className="number-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`${baseId}-infPre`} className="field-label">Pre-Retirement Inflation (%)</label>
                    <input
                      id={`${baseId}-infPre`}
                      type="number"
                      min="3"
                      max="12"
                      step="0.5"
                      value={form.inflationPreRetirement}
                      onChange={(e) => handleInputChange('inflationPreRetirement', e.target.value)}
                      className="number-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor={`${baseId}-reduction`} className="field-label">
                    Expense Reduction at Retirement (%)
                  </label>
                  <input
                    id={`${baseId}-reduction`}
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={Number(form.expenseReductionPercent) || 20}
                    onChange={(e) => handleInputChange('expenseReductionPercent', e.target.value)}
                    className="range-slider"
                  />
                  <div className="slider-limits">
                    <span>0% (No reduction)</span>
                    <span>Current: {form.expenseReductionPercent}%</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Existing Assets */}
            {activeTab === 'assets' && (
              <div className="tab-pane">
                <h3 className="tab-title">Retirement Assets Expected at Age {form.retirementAge}</h3>
                <div className="form-group">
                  <label htmlFor={`${baseId}-epf`} className="field-label">EPF / NPS Expected Balance (₹)</label>
                  <input
                    id={`${baseId}-epf`}
                    type="number"
                    min="0"
                    step="100000"
                    value={form.epfNps}
                    onChange={(e) => handleInputChange('epfNps', e.target.value)}
                    className="number-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`${baseId}-gratuity`} className="field-label">Gratuity Expected (₹)</label>
                  <input
                    id={`${baseId}-gratuity`}
                    type="number"
                    min="0"
                    step="50000"
                    value={form.gratuity}
                    onChange={(e) => handleInputChange('gratuity', e.target.value)}
                    className="number-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`${baseId}-mf`} className="field-label">Existing Mutual Funds &amp; Equity (₹)</label>
                  <input
                    id={`${baseId}-mf`}
                    type="number"
                    min="0"
                    step="100000"
                    value={form.mutualFundsInvestments}
                    onChange={(e) => handleInputChange('mutualFundsInvestments', e.target.value)}
                    className="number-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`${baseId}-fd`} className="field-label">Fixed Deposits &amp; PPF (₹)</label>
                  <input
                    id={`${baseId}-fd`}
                    type="number"
                    min="0"
                    step="50000"
                    value={form.fixedDeposits}
                    onChange={(e) => handleInputChange('fixedDeposits', e.target.value)}
                    className="number-input"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SIP Strategy */}
            {activeTab === 'funding' && (
              <div className="tab-pane">
                <h3 className="tab-title">Fresh Investment Accumulation Assumptions</h3>
                <div className="form-group">
                  <label htmlFor={`${baseId}-retRate`} className="field-label">
                    Expected Equity Investment Return (% p.a.)
                  </label>
                  <input
                    id={`${baseId}-retRate`}
                    type="number"
                    min="6"
                    max="18"
                    step="0.5"
                    value={form.expectedNewInvestmentReturn}
                    onChange={(e) => handleInputChange('expectedNewInvestmentReturn', e.target.value)}
                    className="number-input"
                  />
                  <span className="input-hint">Long-term diversified equity benchmark: 11%–13%</span>
                </div>

                <div className="form-group">
                  <label htmlFor={`${baseId}-stepUp`} className="field-label">
                    Annual SIP Step-Up (%)
                  </label>
                  <input
                    id={`${baseId}-stepUp`}
                    type="number"
                    min="0"
                    max="25"
                    step="1"
                    value={form.annualStepUpRate}
                    onChange={(e) => handleInputChange('annualStepUpRate', e.target.value)}
                    className="number-input"
                  />
                  <span className="input-hint">Increasing your SIP with annual salary hikes dramatically reduces starting commitment</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="calc-results-column">
          <div className="results-card card-surface">
            <div className="results-header">
              <span className="results-eyebrow">Retirement Financial Blueprint</span>
              <h3 className="results-headline">Accumulation &amp; Deficit Roadmap</h3>
            </div>

            {/* Primary Required Corpus Metric */}
            <div className="hero-metric-box">
              <span className="hero-label">Total Retirement Corpus Required</span>
              <div className="hero-value text-brand" data-testid="target-corpus-val">
                {formatINR(result.totalRetirementCorpusRequired)}
              </div>
              <span className="hero-sub">
                Supports {result.yearsPostRetirement} years of living expenses ({formatINR(result.futureMonthlyExpenses)}/month inflated at age {form.retirementAge})
              </span>
            </div>

            {/* Progress Bar */}
            <div className="progress-section">
              <div className="progress-label-row">
                <span>Existing Assets Coverage</span>
                <strong>{result.goalProgress}% Funded</strong>
              </div>
              <div className="progress-track" role="progressbar" aria-valuenow={result.goalProgress} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-fill" style={{ width: `${Math.min(100, result.goalProgress)}%` }} />
              </div>
              <div className="progress-details-row">
                <span>Existing Assets: {formatIndianCompact(result.totalRetirementAssets)}</span>
                <span>Deficit: {formatIndianCompact(result.fundingDeficit)}</span>
              </div>
            </div>

            {/* 3 Solutions Grid */}
            <div className="funding-options-box">
              <h4 className="options-title">Disciplined Strategies to Bridge the Gap:</h4>

              <div className="solutions-grid">
                <div className="solution-card featured-stepup">
                  <span className="solution-badge">Recommended</span>
                  <span className="solution-name">Step-Up Monthly SIP</span>
                  <div className="solution-value">{formatINR(result.requiredStepUpSIP)}/mo</div>
                  <span className="solution-note">Starts at {formatINR(result.requiredStepUpSIP)}, increasing {form.annualStepUpRate}% annually</span>
                </div>

                <div className="solution-card">
                  <span className="solution-name">Fixed Monthly SIP</span>
                  <div className="solution-value">{formatINR(result.requiredFixedSIP)}/mo</div>
                  <span className="solution-note">Constant investment without step-up for {result.yearsUntilRetirement} years</span>
                </div>

                <div className="solution-card">
                  <span className="solution-name">One-Time Lump Sum Today</span>
                  <div className="solution-value">{formatINR(result.requiredLumpSum)}</div>
                  <span className="solution-note">Single initial investment compounding for {result.yearsUntilRetirement} years</span>
                </div>
              </div>
            </div>

            {/* Factual Observation */}
            <div className="insight-callout">
              <span className="insight-icon" aria-hidden="true">📌</span>
              <div className="insight-text">{result.keyInsight}</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .retirement-accumulator-workbench {
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
          grid-template-columns: 1fr 1.15fr;
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
          .solutions-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .card-surface {
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-lg, 12px);
          padding: 1.5rem;
        }
        .input-tabs-header {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 1.25rem;
          overflow-x: auto;
        }
        .tab-btn {
          background: none;
          border: none;
          padding: 0.6rem 0.9rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          white-space: nowrap;
        }
        .tab-btn.active {
          color: #0f766e;
          border-bottom-color: #0f766e;
        }
        .tab-title {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: #0f172a;
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
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
        }
        .hero-metric-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 1.25rem;
          text-align: center;
          margin-bottom: 1.25rem;
        }
        .hero-label {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #166534;
        }
        .hero-value {
          font-size: 2rem;
          font-weight: 800;
          color: #15803d;
          margin: 0.35rem 0;
        }
        .hero-sub {
          font-size: 0.85rem;
          color: #166534;
        }
        .progress-section {
          margin-bottom: 1.25rem;
        }
        .progress-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 0.35rem;
          color: #334155;
        }
        .progress-track {
          background: #e2e8f0;
          height: 10px;
          border-radius: 5px;
          overflow: hidden;
        }
        .progress-fill {
          background: #0f766e;
          height: 100%;
          border-radius: 5px;
          transition: width 0.3s ease;
        }
        .progress-details-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #64748b;
          margin-top: 0.35rem;
        }
        .funding-options-box {
          margin-bottom: 1.25rem;
        }
        .options-title {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #0f172a;
        }
        .solutions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        @media (max-width: 600px) {
          .solutions-grid {
            grid-template-columns: 1fr;
          }
        }
        .solution-card {
          position: relative;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
        }
        .solution-card.featured-stepup {
          background: #f0fdfa;
          border-color: #99f6e4;
        }
        .solution-badge {
          position: absolute;
          top: -8px;
          right: 8px;
          background: #0f766e;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .solution-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }
        .solution-value {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0.25rem 0;
        }
        .solution-note {
          font-size: 0.7rem;
          color: #64748b;
          line-height: 1.3;
          margin-top: auto;
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
