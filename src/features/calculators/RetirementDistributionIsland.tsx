import React, { useState, useId, useMemo } from 'react';
import {
  calculateRetirementDistributionPlan,
  type RetirementDistributionInput,
  type RetirementDistributionResult
} from '../../domain/finance/retirementDistribution';
import { formatINR } from '../../lib/formatters';

interface FormState {
  retirementAge: string;
  monthlyRetirementExpense: string;
  lifeExpectancy: string;
  inflationRate: string;
  bucket1Return: string;
  bucket2Return: string;
  bucket3Return: string;
}

const DEFAULT_STATE: FormState = {
  retirementAge: '60',
  monthlyRetirementExpense: '80000',
  lifeExpectancy: '90',
  inflationRate: '6.0',
  bucket1Return: '6.0',
  bucket2Return: '8.0',
  bucket3Return: '10.0'
};

export default function RetirementDistributionIsland(): React.JSX.Element {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);
  const [isSampleData, setIsSampleData] = useState<boolean>(true);
  const baseId = useId();

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsSampleData(false);
  };

  const handleReset = () => {
    setForm(DEFAULT_STATE);
    setIsSampleData(true);
    setShowAssumptions(false);
  };

  const input: RetirementDistributionInput = useMemo(() => {
    const retAge = Math.max(18, Math.min(100, Number(form.retirementAge) || 60));
    const lifeExp = Math.max(retAge + 1, Math.min(120, Number(form.lifeExpectancy) || 90));
    const monthlyExp = Math.max(0, Number(form.monthlyRetirementExpense) || 0);

    return {
      retirementAge: retAge,
      monthlyRetirementExpense: monthlyExp,
      lifeExpectancy: lifeExp,
      assumptions: {
        inflationRate: Number(form.inflationRate) || 6.0,
        bucket1Return: Number(form.bucket1Return) || 6.0,
        bucket2Return: Number(form.bucket2Return) || 8.0,
        bucket3Return: Number(form.bucket3Return) || 10.0
      }
    };
  }, [form]);

  const result: RetirementDistributionResult = useMemo(() => {
    return calculateRetirementDistributionPlan(input);
  }, [input]);

  return (
    <div className="retirement-dist-workbench" id="retirement-distribution-calculator">
      {/* Sample Data Banner */}
      {isSampleData && (
        <div className="sample-banner" role="status">
          <span className="banner-icon" aria-hidden="true">💡</span>
          <div className="banner-text">
            <strong>Sample Retirement Cash-Flow Plan:</strong> Retiring at age 60 living through age 90 with ₹80,000/month living expense under a 3-bucket decumulation framework. Adjust parameters below to model your requirements.
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
            <h3 className="panel-heading">Retirement Decumulation Inputs</h3>
            <button type="button" onClick={handleReset} className="btn-reset-text">↺ Reset</button>
          </div>

          {/* Monthly Living Expense */}
          <div className="form-group">
            <label htmlFor={`${baseId}-monthlyExp`} className="field-label">
              Desired Starting Monthly Pension / Expenses (₹)
            </label>
            <div className="input-currency-wrapper">
              <span className="currency-prefix">₹</span>
              <input
                id={`${baseId}-monthlyExp`}
                type="number"
                min="10000"
                max="1000000"
                step="5000"
                value={form.monthlyRetirementExpense}
                onChange={(e) => handleInputChange('monthlyRetirementExpense', e.target.value)}
                className="number-input"
              />
            </div>
            <input
              type="range"
              min="20000"
              max="300000"
              step="5000"
              value={Number(form.monthlyRetirementExpense) || 80000}
              onChange={(e) => handleInputChange('monthlyRetirementExpense', e.target.value)}
              className="range-slider"
              aria-label="Monthly retirement expense slider"
            />
            <div className="slider-limits">
              <span>₹20,000/mo</span>
              <span>₹3,00,000/mo</span>
            </div>
          </div>

          {/* Retirement Age & Life Expectancy */}
          <div className="grid-2col">
            <div className="form-group">
              <label htmlFor={`${baseId}-retAge`} className="field-label">Retirement Age</label>
              <input
                id={`${baseId}-retAge`}
                type="number"
                min="45"
                max="75"
                value={form.retirementAge}
                onChange={(e) => handleInputChange('retirementAge', e.target.value)}
                className="number-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor={`${baseId}-lifeExp`} className="field-label">Life Expectancy</label>
              <input
                id={`${baseId}-lifeExp`}
                type="number"
                min="65"
                max="100"
                value={form.lifeExpectancy}
                onChange={(e) => handleInputChange('lifeExpectancy', e.target.value)}
                className="number-input"
              />
            </div>
          </div>

          <span className="timeline-badge">
            Planning Horizon: <strong>{result.distributionYears} Years</strong> (from age {form.retirementAge} to {form.lifeExpectancy})
          </span>

          {/* Assumptions Toggle */}
          <div className="assumptions-toggle-wrap">
            <button
              type="button"
              className="btn-toggle-assumptions"
              onClick={() => setShowAssumptions(!showAssumptions)}
              aria-expanded={showAssumptions}
            >
              {showAssumptions ? 'Hide Return & Inflation Assumptions ▲' : 'Customize Return & Inflation Assumptions ▼'}
            </button>
          </div>

          {showAssumptions && (
            <div className="assumptions-box">
              <div className="form-group">
                <label htmlFor={`${baseId}-inf`} className="field-label">Assumed Inflation Rate (% p.a.)</label>
                <input
                  id={`${baseId}-inf`}
                  type="number"
                  min="4"
                  max="10"
                  step="0.5"
                  value={form.inflationRate}
                  onChange={(e) => handleInputChange('inflationRate', e.target.value)}
                  className="number-input"
                />
              </div>

              <div className="grid-3col">
                <div className="form-group">
                  <label htmlFor={`${baseId}-b1Ret`} className="field-label">B1 Return (%)</label>
                  <input
                    id={`${baseId}-b1Ret`}
                    type="number"
                    min="3"
                    max="8"
                    step="0.5"
                    value={form.bucket1Return}
                    onChange={(e) => handleInputChange('bucket1Return', e.target.value)}
                    className="number-input"
                  />
                  <span className="input-hint">Liquid</span>
                </div>
                <div className="form-group">
                  <label htmlFor={`${baseId}-b2Ret`} className="field-label">B2 Return (%)</label>
                  <input
                    id={`${baseId}-b2Ret`}
                    type="number"
                    min="5"
                    max="11"
                    step="0.5"
                    value={form.bucket2Return}
                    onChange={(e) => handleInputChange('bucket2Return', e.target.value)}
                    className="number-input"
                  />
                  <span className="input-hint">Hybrid/Debt</span>
                </div>
                <div className="form-group">
                  <label htmlFor={`${baseId}-b3Ret`} className="field-label">B3 Return (%)</label>
                  <input
                    id={`${baseId}-b3Ret`}
                    type="number"
                    min="8"
                    max="15"
                    step="0.5"
                    value={form.bucket3Return}
                    onChange={(e) => handleInputChange('bucket3Return', e.target.value)}
                    className="number-input"
                  />
                  <span className="input-hint">Equity</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="calc-results-column">
          <div className="results-card card-surface">
            <div className="results-header">
              <span className="results-eyebrow">Strategy Results</span>
              <h3 className="results-headline">Three-Bucket Allocation Architecture</h3>
            </div>

            {/* Total Required Investment Hero Metric */}
            <div className="hero-metric-box">
              <span className="hero-label">Total Capital Required at Age {form.retirementAge}</span>
              <div className="hero-value text-brand" data-testid="total-distribution-corpus">
                {formatINR(result.totalInvestmentRequiredToday)}
              </div>
              <span className="hero-sub">
                Weighted post-tax return: <strong>{result.weightedAveragePostTaxReturn}% p.a.</strong> · Real Return: <strong>{result.overallRealReturn}% p.a.</strong>
              </span>
            </div>

            {/* Allocation Visual Bar */}
            <div className="allocation-bar-section">
              <div className="allocation-bar-track">
                <div
                  className="bar-b1"
                  style={{ width: `${result.bucket1.allocationPercent}%` }}
                  title={`Bucket 1: ${result.bucket1.allocationPercent}%`}
                />
                <div
                  className="bar-b2"
                  style={{ width: `${result.bucket2.allocationPercent}%` }}
                  title={`Bucket 2: ${result.bucket2.allocationPercent}%`}
                />
                <div
                  className="bar-b3"
                  style={{ width: `${result.bucket3.allocationPercent}%` }}
                  title={`Bucket 3: ${result.bucket3.allocationPercent}%`}
                />
              </div>
              <div className="allocation-legend">
                <span className="legend-item"><span className="legend-dot dot-b1" /> B1 Liquidity ({result.bucket1.allocationPercent}%)</span>
                <span className="legend-item"><span className="legend-dot dot-b2" /> B2 Safety ({result.bucket2.allocationPercent}%)</span>
                <span className="legend-item"><span className="legend-dot dot-b3" /> B3 Growth ({result.bucket3.allocationPercent}%)</span>
              </div>
            </div>

            {/* 3 Bucket Cards */}
            <div className="buckets-grid">
              {/* Bucket 1 */}
              <div className="bucket-card card-b1">
                <div className="bucket-header">
                  <span className="bucket-tag tag-b1">Bucket 1 · Liquidity</span>
                  <span className="bucket-years">{result.bucket1.yearsRange}</span>
                </div>
                <div className="bucket-corpus-amt">{formatINR(result.bucket1.investmentRequiredToday)}</div>
                <div className="bucket-meta">
                  <span>Allocation: <strong>{result.bucket1.allocationPercent}%</strong></span>
                  <span>Post-Tax Return: <strong>{result.bucket1.postTaxReturn}%</strong></span>
                </div>
                <p className="bucket-desc">Covers immediate 3 years of cash flow in bank sweep and liquid funds, immunizing your family against sequence-of-returns risk.</p>
              </div>

              {/* Bucket 2 */}
              <div className="bucket-card card-b2">
                <div className="bucket-header">
                  <span className="bucket-tag tag-b2">Bucket 2 · Safety</span>
                  <span className="bucket-years">{result.bucket2.yearsRange}</span>
                </div>
                <div className="bucket-corpus-amt">{formatINR(result.bucket2.investmentRequiredToday)}</div>
                <div className="bucket-meta">
                  <span>Allocation: <strong>{result.bucket2.allocationPercent}%</strong></span>
                  <span>Post-Tax Return: <strong>{result.bucket2.postTaxReturn}%</strong></span>
                </div>
                <p className="bucket-desc">Invested in conservative hybrid and corporate debt. Periodically rolls over to replenish Bucket 1 liquidity.</p>
              </div>

              {/* Bucket 3 */}
              <div className="bucket-card card-b3">
                <div className="bucket-header">
                  <span className="bucket-tag tag-b3">Bucket 3 · Growth</span>
                  <span className="bucket-years">{result.bucket3.yearsRange}</span>
                </div>
                <div className="bucket-corpus-amt">{formatINR(result.bucket3.investmentRequiredToday)}</div>
                <div className="bucket-meta">
                  <span>Allocation: <strong>{result.bucket3.allocationPercent}%</strong></span>
                  <span>Post-Tax Return: <strong>{result.bucket3.postTaxReturn}%</strong></span>
                </div>
                <p className="bucket-desc">Compounds undisturbed in diversified equities for 7+ years to beat healthcare and lifestyle inflation across the final 23 years.</p>
              </div>
            </div>

            {/* Strategic Insight */}
            <div className="insight-callout">
              <span className="insight-icon" aria-hidden="true">💡</span>
              <div className="insight-text">{result.keyInsight}</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .retirement-dist-workbench {
          margin: 2rem 0;
          font-family: var(--font-family-body);
        }
        .sample-banner {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 0.85rem 1.25rem;
          border-radius: var(--radius-md, 8px);
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          color: #166534;
        }
        .btn-banner-reset {
          margin-left: auto;
          background: #16a34a;
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
          grid-template-columns: 1fr 1.25fr;
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
          .grid-3col {
            grid-template-columns: 1fr !important;
          }
          .buckets-grid {
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
        .grid-3col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }
        .timeline-badge {
          display: inline-block;
          background: #f1f5f9;
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          color: #475569;
          margin-bottom: 1.25rem;
        }
        .assumptions-toggle-wrap {
          margin-top: 0.5rem;
          border-top: 1px dashed #cbd5e1;
          padding-top: 1rem;
        }
        .btn-toggle-assumptions {
          background: none;
          border: none;
          color: #0f766e;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0;
        }
        .assumptions-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 0.75rem;
        }
        .input-hint {
          display: block;
          font-size: 0.7rem;
          color: #64748b;
          margin-top: 0.2rem;
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
        .allocation-bar-section {
          margin-bottom: 1.5rem;
        }
        .allocation-bar-track {
          display: flex;
          height: 12px;
          border-radius: 6px;
          overflow: hidden;
        }
        .bar-b1 { background: #3b82f6; }
        .bar-b2 { background: #f59e0b; }
        .bar-b3 { background: #10b981; }
        .allocation-legend {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #475569;
          margin-top: 0.4rem;
          flex-wrap: wrap;
        }
        .legend-item { display: flex; align-items: center; gap: 0.3rem; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot-b1 { background: #3b82f6; }
        .dot-b2 { background: #f59e0b; }
        .dot-b3 { background: #10b981; }
        .buckets-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        @media (max-width: 650px) {
          .buckets-grid {
            grid-template-columns: 1fr;
          }
        }
        .bucket-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
        }
        .card-b1 { background: #eff6ff; border-color: #bfdbfe; }
        .card-b2 { background: #fffbeb; border-color: #fde68a; }
        .card-b3 { background: #ecfdf5; border-color: #a7f3d0; }
        .bucket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.4rem;
        }
        .bucket-tag {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .tag-b1 { color: #1d4ed8; }
        .tag-b2 { color: #b45309; }
        .tag-b3 { color: #047857; }
        .bucket-years {
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 600;
        }
        .bucket-corpus-amt {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.35rem;
        }
        .bucket-meta {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          font-size: 0.75rem;
          color: #475569;
          margin-bottom: 0.5rem;
        }
        .bucket-desc {
          font-size: 0.7rem;
          color: #64748b;
          line-height: 1.35;
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
