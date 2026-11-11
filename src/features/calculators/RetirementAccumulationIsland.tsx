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

const EMPTY_STATE: FormState = {
  householdExpenses: '',
  lifestyleExpenses: '',
  otherExpenses: '',
  currentAge: '',
  retirementAge: '',
  inflationPreRetirement: '',
  expenseReductionPercent: '',
  lifeExpectancyAge: '',
  inflationPostRetirement: '',
  corpusReturnPreTax: '',
  taxRateOnCorpusReturn: '',
  childrenOrCharityCorpus: '',
  epfNps: '',
  gratuity: '',
  superannuationOther: '',
  fixedDeposits: '',
  insuranceMaturity: '',
  mutualFundsInvestments: '',
  startInvestingDelay: '',
  expectedNewInvestmentReturn: '',
  annualStepUpRate: ''
};

const SAMPLE_STATE: FormState = {
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
  const [form, setForm] = useState<FormState>(EMPTY_STATE);
  const [activeTab, setActiveTab] = useState<'expenses' | 'timeline' | 'assets' | 'funding'>('expenses');
  const baseId = useId();

  const isBlank =
    form.householdExpenses.trim() === '' &&
    form.currentAge.trim() === '' &&
    form.retirementAge.trim() === '';

  const isValid =
    (Number(form.householdExpenses) > 0 || Number(form.lifestyleExpenses) > 0) &&
    Number(form.currentAge) >= 18 &&
    Number(form.retirementAge) > Number(form.currentAge);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoadSample = () => {
    setForm(SAMPLE_STATE);
  };

  const handleClear = () => {
    setForm(EMPTY_STATE);
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

  const result: RetirementPlannerResult | null = useMemo(() => {
    if (!isValid) return null;
    return calculateRetirementAccumulationPlan(input);
  }, [input, isValid]);

  return (
    <div className="retirement-accumulator-workbench" id="retirement-accumulation-calculator">
      {/* Main Grid */}
      <div className="calc-layout-grid">
        {/* Input Navigation & Controls Panel */}
        <div className="calc-input-column card-surface">
          <div className="controls-header">
            <div>
              <h2 className="panel-title">Retirement Corpus Details</h2>
              <p className="panel-subtitle">Enter your expenses, timeline, and existing assets across the 4 steps.</p>
            </div>
            <div className="header-actions-group">
              <button
                type="button"
                id="load-sample-ret-accum-btn"
                onClick={handleLoadSample}
                className="btn-sample-pill"
              >
                Sample Data
              </button>
              {!isBlank && (
                <button
                  type="button"
                  id="reset-ret-accum-btn"
                  onClick={handleClear}
                  className="btn-clear-pill"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="input-tabs-header" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'expenses'}
              className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              1. Expenses
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'timeline'}
              className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              2. Timeline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'assets'}
              className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
              onClick={() => setActiveTab('assets')}
            >
              3. Existing Assets
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'funding'}
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
                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-household`} className="field-label">
                      Household Living Expenses (Annual)
                    </label>
                    <div className="input-with-symbol">
                      <span className="symbol-prefix">₹</span>
                      <input
                        id={`${baseId}-household`}
                        type="number"
                        placeholder="0"
                        min="100000"
                        max="10000000"
                        step="50000"
                        value={form.householdExpenses}
                        onChange={(e) => handleInputChange('householdExpenses', e.target.value)}
                        className="num-input"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="200000"
                    max="5000000"
                    step="50000"
                    value={Number(form.householdExpenses) || 200000}
                    onChange={(e) => handleInputChange('householdExpenses', e.target.value)}
                    className="range-slider"
                    aria-label="Household expenses slider"
                  />
                  <div className="slider-limits">
                    <span>₹2 Lakh</span>
                    <span>₹50 Lakh</span>
                  </div>
                </div>

                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-lifestyle`} className="field-label">
                      Discretionary / Travel Expenses (Annual)
                    </label>
                    <div className="input-with-symbol">
                      <span className="symbol-prefix">₹</span>
                      <input
                        id={`${baseId}-lifestyle`}
                        type="number"
                        placeholder="0"
                        min="0"
                        max="5000000"
                        step="25000"
                        value={form.lifestyleExpenses}
                        onChange={(e) => handleInputChange('lifestyleExpenses', e.target.value)}
                        className="num-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Timeline & Inflation */}
            {activeTab === 'timeline' && (
              <div className="tab-pane">
                <h3 className="tab-title">Retirement Timeline &amp; Longevity</h3>
                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-currentAge`} className="field-label">Current Age</label>
                    <div className="input-with-symbol">
                      <input
                        id={`${baseId}-currentAge`}
                        type="number"
                        placeholder="0"
                        min="18"
                        max="75"
                        value={form.currentAge}
                        onChange={(e) => handleInputChange('currentAge', e.target.value)}
                        className="num-input"
                      />
                      <span className="symbol-suffix">Yrs</span>
                    </div>
                  </div>
                </div>

                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-retirementAge`} className="field-label">Retirement Age</label>
                    <div className="input-with-symbol">
                      <input
                        id={`${baseId}-retirementAge`}
                        type="number"
                        placeholder="0"
                        min="40"
                        max="80"
                        value={form.retirementAge}
                        onChange={(e) => handleInputChange('retirementAge', e.target.value)}
                        className="num-input"
                      />
                      <span className="symbol-suffix">Yrs</span>
                    </div>
                  </div>
                </div>

                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-lifeExp`} className="field-label">Life Expectancy Age</label>
                    <div className="input-with-symbol">
                      <input
                        id={`${baseId}-lifeExp`}
                        type="number"
                        placeholder="0"
                        min="65"
                        max="105"
                        value={form.lifeExpectancyAge}
                        onChange={(e) => handleInputChange('lifeExpectancyAge', e.target.value)}
                        className="num-input"
                      />
                      <span className="symbol-suffix">Yrs</span>
                    </div>
                  </div>
                </div>

                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-infPre`} className="field-label">Pre-Retirement Inflation</label>
                    <div className="input-with-symbol">
                      <input
                        id={`${baseId}-infPre`}
                        type="number"
                        placeholder="0"
                        min="3"
                        max="12"
                        step="0.5"
                        value={form.inflationPreRetirement}
                        onChange={(e) => handleInputChange('inflationPreRetirement', e.target.value)}
                        className="num-input"
                      />
                      <span className="symbol-suffix">%</span>
                    </div>
                  </div>
                </div>

                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-reduction`} className="field-label">
                      Expense Reduction at Retirement
                    </label>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--awc-navy)' }}>
                      {form.expenseReductionPercent || 0}%
                    </span>
                  </div>
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
                    <span>50%</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Existing Assets */}
            {activeTab === 'assets' && (
              <div className="tab-pane">
                <h3 className="tab-title">Retirement Assets Expected at Age {form.retirementAge || 60}</h3>
                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-epf`} className="field-label">EPF / NPS Expected Balance</label>
                    <div className="input-with-symbol">
                      <span className="symbol-prefix">₹</span>
                      <input
                        id={`${baseId}-epf`}
                        type="number"
                        placeholder="0"
                        min="0"
                        step="100000"
                        value={form.epfNps}
                        onChange={(e) => handleInputChange('epfNps', e.target.value)}
                        className="num-input"
                      />
                    </div>
                  </div>
                </div>
                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-gratuity`} className="field-label">Gratuity Expected</label>
                    <div className="input-with-symbol">
                      <span className="symbol-prefix">₹</span>
                      <input
                        id={`${baseId}-gratuity`}
                        type="number"
                        placeholder="0"
                        min="0"
                        step="50000"
                        value={form.gratuity}
                        onChange={(e) => handleInputChange('gratuity', e.target.value)}
                        className="num-input"
                      />
                    </div>
                  </div>
                </div>
                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-mf`} className="field-label">Existing Mutual Funds &amp; Equity</label>
                    <div className="input-with-symbol">
                      <span className="symbol-prefix">₹</span>
                      <input
                        id={`${baseId}-mf`}
                        type="number"
                        placeholder="0"
                        min="0"
                        step="100000"
                        value={form.mutualFundsInvestments}
                        onChange={(e) => handleInputChange('mutualFundsInvestments', e.target.value)}
                        className="num-input"
                      />
                    </div>
                  </div>
                </div>
                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-fd`} className="field-label">Fixed Deposits &amp; PPF</label>
                    <div className="input-with-symbol">
                      <span className="symbol-prefix">₹</span>
                      <input
                        id={`${baseId}-fd`}
                        type="number"
                        placeholder="0"
                        min="0"
                        step="50000"
                        value={form.fixedDeposits}
                        onChange={(e) => handleInputChange('fixedDeposits', e.target.value)}
                        className="num-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SIP Strategy */}
            {activeTab === 'funding' && (
              <div className="tab-pane">
                <h3 className="tab-title">Fresh Investment Accumulation Assumptions</h3>
                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-retRate`} className="field-label">
                      Expected Equity Investment Return
                    </label>
                    <div className="input-with-symbol">
                      <input
                        id={`${baseId}-retRate`}
                        type="number"
                        placeholder="0"
                        min="6"
                        max="18"
                        step="0.5"
                        value={form.expectedNewInvestmentReturn}
                        onChange={(e) => handleInputChange('expectedNewInvestmentReturn', e.target.value)}
                        className="num-input"
                      />
                      <span className="symbol-suffix">%</span>
                    </div>
                  </div>
                  <span className="input-hint">Long-term diversified equity benchmark: 11%–13%</span>
                </div>

                <div className="field-group">
                  <div className="field-header">
                    <label htmlFor={`${baseId}-stepUp`} className="field-label">
                      Annual SIP Step-Up
                    </label>
                    <div className="input-with-symbol">
                      <input
                        id={`${baseId}-stepUp`}
                        type="number"
                        placeholder="0"
                        min="0"
                        max="25"
                        step="1"
                        value={form.annualStepUpRate}
                        onChange={(e) => handleInputChange('annualStepUpRate', e.target.value)}
                        className="num-input"
                      />
                      <span className="symbol-suffix">%</span>
                    </div>
                  </div>
                  <span className="input-hint">Increasing your SIP with annual salary hikes dramatically reduces starting commitment</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="calc-results-column">
          <div className="result-panel">
            {result ? (
              <>
                <span className="result-eyebrow">Total Retirement Corpus Required</span>
                <div className="result-headline-value" data-testid="target-corpus-val">
                  {formatINR(result.totalRetirementCorpusRequired)}
                </div>
                <p className="result-subline">
                  Supports {result.yearsPostRetirement} years of living expenses ({formatINR(result.futureMonthlyExpenses)}/month inflated at age {form.retirementAge || 60}).
                </p>

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
                  <h4 className="options-title">Disciplined Strategies to Bridge the Gap</h4>

                  <div className="solutions-grid">
                    <div className="solution-card featured-stepup">
                      <span className="solution-badge">Recommended</span>
                      <span className="solution-name">Step-Up Monthly SIP</span>
                      <div className="solution-value">{formatINR(result.requiredStepUpSIP)}/mo</div>
                      <span className="solution-note">Starts at {formatINR(result.requiredStepUpSIP)}, increasing {form.annualStepUpRate || 10}% annually</span>
                    </div>

                    <div className="solution-card">
                      <span className="solution-name">Fixed Monthly SIP</span>
                      <div className="solution-value">{formatINR(result.requiredFixedSIP)}/mo</div>
                      <span className="solution-note">Constant investment without step-up for {result.yearsUntilRetirement} years</span>
                    </div>

                    <div className="solution-card">
                      <span className="solution-name">One-Time Lump Sum</span>
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
              </>
            ) : (
              <div className="result-empty-state">
                <div className="empty-state-icon" aria-hidden="true">🏖️</div>
                <h3 className="empty-state-title">Enter retirement details</h3>
                <p className="empty-state-desc">
                  Fill in your living expenses and timeline on the left—or click <strong>Sample Data</strong> to preview a scenario.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .retirement-accumulator-workbench {
          width: 100%;
          font-family: var(--font-family-body);
        }

        .calc-layout-grid {
          display: grid;
          grid-template-columns: 1.06fr 0.94fr;
          gap: 24px;
          align-items: start;
        }

        .calc-layout-grid > div {
          min-width: 0;
        }

        .card-surface {
          background: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 12px 30px rgba(23, 48, 71, 0.05);
        }

        .controls-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--awc-line);
        }

        .panel-title {
          font-family: var(--font-family-heading);
          font-size: 20px;
          font-weight: 800;
          color: var(--awc-navy);
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }

        .panel-subtitle {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .header-actions-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-sample-pill {
          background: var(--awc-jade-soft);
          border: 1px solid #B7DDD3;
          color: var(--color-text-brand);
          font-size: 12px;
          font-weight: 700;
          padding: 7px 13px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .btn-sample-pill:hover {
          border-color: var(--color-border-interactive);
          background: var(--awc-mint);
        }

        .btn-clear-pill {
          background: #ffffff;
          border: 1px solid var(--awc-line);
          color: var(--color-text-muted);
          font-size: 12px;
          font-weight: 700;
          padding: 7px 13px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .btn-clear-pill:hover {
          border-color: var(--color-border-interactive);
          color: var(--awc-navy);
        }

        .input-tabs-header {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          background: var(--awc-paper);
          padding: 6px;
          border-radius: 14px;
          border: 1px solid var(--awc-line);
          margin-bottom: 22px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          padding: 9px 8px;
          font-size: 12px;
          font-weight: 750;
          color: var(--color-text-muted);
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.15s ease;
          text-align: center;
          white-space: nowrap;
        }

        .tab-btn.active {
          background: #ffffff;
          color: var(--color-text-brand);
          box-shadow: 0 2px 6px rgba(19, 42, 64, 0.08);
        }

        .tab-title {
          font-size: 15px;
          font-weight: 800;
          margin: 0 0 16px;
          color: var(--awc-navy);
        }

        .field-group {
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid rgba(214, 228, 224, 0.65);
        }

        .field-group:last-of-type {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .field-label {
          font-size: 13.5px;
          font-weight: 750;
          color: var(--awc-navy);
        }

        .input-with-symbol {
          display: flex;
          align-items: center;
          background: var(--awc-paper);
          border: 1.5px solid var(--awc-line);
          border-radius: 12px;
          padding: 6px 12px;
          min-width: 140px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .input-with-symbol:focus-within {
          border-color: var(--color-border-interactive);
          box-shadow: 0 0 0 3px rgba(22, 135, 126, 0.12);
          background: #ffffff;
        }

        .symbol-prefix,
        .symbol-suffix {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-muted);
          user-select: none;
        }

        .symbol-prefix {
          margin-right: 6px;
        }

        .symbol-suffix {
          margin-left: 6px;
        }

        .num-input {
          width: 100%;
          border: none;
          background: transparent;
          font-family: var(--font-family-body);
          font-size: 15px;
          font-weight: 800;
          color: var(--awc-navy);
          text-align: right;
          outline: none;
        }

        .num-input::placeholder {
          color: rgba(19, 42, 64, 0.28);
          font-weight: 600;
        }

        .range-slider {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: var(--awc-line);
          outline: none;
          accent-color: var(--color-border-interactive);
          cursor: pointer;
          margin-bottom: 8px;
        }

        .slider-limits {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-muted);
        }

        .input-hint {
          display: block;
          font-size: 11.5px;
          color: var(--color-text-muted);
          margin-top: 6px;
        }

        /* Right Result Panel — Concept C Deep Atlantic Navy */
        .result-panel {
          background: var(--awc-navy);
          color: #ffffff;
          border-radius: 24px;
          padding: 30px;
          box-shadow: 0 22px 46px rgba(19, 42, 64, 0.2);
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: relative;
          overflow: hidden;
        }

        .result-eyebrow {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
        }

        .result-headline-value {
          font-family: var(--font-family-heading);
          font-size: clamp(30px, 4.2vw, 44px);
          font-weight: 900;
          line-height: 1.04;
          letter-spacing: -0.03em;
          color: var(--awc-gold);
          margin-top: -6px;
        }

        .result-subline {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.78);
          line-height: 1.5;
          margin: 0;
        }

        .progress-section {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 16px;
        }

        .progress-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.85);
        }

        .progress-track {
          background: rgba(255, 255, 255, 0.12);
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          background: var(--awc-mint);
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .progress-details-row {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 8px;
        }

        .options-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 12px;
          color: rgba(255, 255, 255, 0.75);
        }

        .solutions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .solution-card {
          position: relative;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .solution-card.featured-stepup {
          background: rgba(93, 217, 193, 0.12);
          border-color: rgba(93, 217, 193, 0.4);
        }

        .solution-badge {
          align-self: flex-start;
          background: var(--awc-mint);
          color: var(--awc-navy);
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 6px;
          margin-bottom: 2px;
        }

        .solution-name {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.72);
          text-transform: uppercase;
        }

        .solution-value {
          font-size: 16px;
          font-weight: 850;
          color: #ffffff;
          margin: 2px 0;
        }

        .solution-card.featured-stepup .solution-value {
          color: #5DD9C1;
        }

        .solution-note {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.35;
          margin-top: auto;
        }

        .insight-callout {
          display: flex;
          gap: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 14px;
          border-radius: 14px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
        }

        .result-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 48px 20px;
          min-height: 280px;
        }

        .empty-state-icon {
          font-size: 36px;
          margin-bottom: 12px;
          opacity: 0.9;
        }

        .empty-state-title {
          font-family: var(--font-family-heading);
          font-size: 18px;
          font-weight: 800;
          color: var(--awc-gold);
          margin: 0 0 8px;
        }

        .empty-state-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.78);
          line-height: 1.55;
          max-width: 320px;
          margin: 0;
        }

        @media (max-width: 960px) {
          .calc-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .card-surface,
          .result-panel {
            padding: 20px;
          }

          .input-tabs-header {
            grid-template-columns: repeat(2, 1fr);
          }

          .solutions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
