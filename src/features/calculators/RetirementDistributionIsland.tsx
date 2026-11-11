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

const EMPTY_STATE: FormState = {
  retirementAge: '',
  monthlyRetirementExpense: '',
  lifeExpectancy: '',
  inflationRate: '',
  bucket1Return: '',
  bucket2Return: '',
  bucket3Return: ''
};

const SAMPLE_STATE: FormState = {
  retirementAge: '60',
  monthlyRetirementExpense: '80000',
  lifeExpectancy: '90',
  inflationRate: '6.0',
  bucket1Return: '6.0',
  bucket2Return: '8.0',
  bucket3Return: '10.0'
};

export default function RetirementDistributionIsland(): React.JSX.Element {
  const [form, setForm] = useState<FormState>(EMPTY_STATE);
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);
  const baseId = useId();

  const isBlank =
    form.monthlyRetirementExpense.trim() === '' &&
    form.retirementAge.trim() === '' &&
    form.lifeExpectancy.trim() === '';

  const isValid =
    Number(form.monthlyRetirementExpense) > 0 &&
    Number(form.retirementAge) >= 18 &&
    Number(form.lifeExpectancy) > Number(form.retirementAge);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoadSample = () => {
    setForm(SAMPLE_STATE);
  };

  const handleClear = () => {
    setForm(EMPTY_STATE);
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

  const result: RetirementDistributionResult | null = useMemo(() => {
    if (!isValid) return null;
    return calculateRetirementDistributionPlan(input);
  }, [input, isValid]);

  return (
    <div className="retirement-dist-workbench" id="retirement-distribution-calculator">
      <div className="calc-layout-grid">
        {/* Input Panel */}
        <div className="calc-input-column card-surface">
          <div className="controls-header">
            <div>
              <h2 className="panel-title">Retirement Decumulation Details</h2>
              <p className="panel-subtitle">Enter your desired monthly retirement expense and horizon.</p>
            </div>
            <div className="header-actions-group">
              <button type="button" id="load-sample-ret-dist-btn" onClick={handleLoadSample} className="btn-sample-pill">
                Sample Data
              </button>
              {!isBlank && (
                <button type="button" id="reset-ret-dist-btn" onClick={handleClear} className="btn-clear-pill">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Monthly Living Expense */}
          <div className="field-group">
            <div className="field-header">
              <label htmlFor={`${baseId}-monthlyExp`} className="field-label">
                Desired Monthly Pension / Expenses
              </label>
              <div className="input-with-symbol">
                <span className="symbol-prefix">₹</span>
                <input
                  id={`${baseId}-monthlyExp`}
                  type="number"
                  placeholder="0"
                  min="10000"
                  max="1000000"
                  step="5000"
                  value={form.monthlyRetirementExpense}
                  onChange={(e) => handleInputChange('monthlyRetirementExpense', e.target.value)}
                  className="num-input"
                />
              </div>
            </div>
            <input
              type="range"
              min="20000"
              max="300000"
              step="5000"
              value={Number(form.monthlyRetirementExpense) || 20000}
              onChange={(e) => handleInputChange('monthlyRetirementExpense', e.target.value)}
              className="range-slider"
              aria-label="Monthly retirement expense slider"
            />
            <div className="slider-limits">
              <span>₹20,000/mo</span>
              <span>₹3,00,000/mo</span>
            </div>
          </div>

          {/* Retirement Age */}
          <div className="field-group">
            <div className="field-header">
              <label htmlFor={`${baseId}-retAge`} className="field-label">Retirement Age</label>
              <div className="input-with-symbol">
                <input
                  id={`${baseId}-retAge`}
                  type="number"
                  placeholder="0"
                  min="45"
                  max="75"
                  value={form.retirementAge}
                  onChange={(e) => handleInputChange('retirementAge', e.target.value)}
                  className="num-input"
                />
                <span className="symbol-suffix">Yrs</span>
              </div>
            </div>
            <input
              type="range"
              min="45"
              max="75"
              step="1"
              value={Number(form.retirementAge) || 60}
              onChange={(e) => handleInputChange('retirementAge', e.target.value)}
              className="range-slider"
              aria-label="Retirement age slider"
            />
            <div className="slider-limits">
              <span>45 Years</span>
              <span>75 Years</span>
            </div>
          </div>

          {/* Life Expectancy */}
          <div className="field-group">
            <div className="field-header">
              <label htmlFor={`${baseId}-lifeExp`} className="field-label">Life Expectancy</label>
              <div className="input-with-symbol">
                <input
                  id={`${baseId}-lifeExp`}
                  type="number"
                  placeholder="0"
                  min="65"
                  max="100"
                  value={form.lifeExpectancy}
                  onChange={(e) => handleInputChange('lifeExpectancy', e.target.value)}
                  className="num-input"
                />
                <span className="symbol-suffix">Yrs</span>
              </div>
            </div>
            <input
              type="range"
              min="65"
              max="100"
              step="1"
              value={Number(form.lifeExpectancy) || 90}
              onChange={(e) => handleInputChange('lifeExpectancy', e.target.value)}
              className="range-slider"
              aria-label="Life expectancy slider"
            />
            <div className="slider-limits">
              <span>65 Years</span>
              <span>100 Years</span>
            </div>
          </div>

          {result && (
            <span className="timeline-badge">
              Planning Horizon: <strong>{result.distributionYears} Years</strong> (from age {form.retirementAge} to {form.lifeExpectancy})
            </span>
          )}

          {/* Assumptions Toggle */}
          <div className="assumptions-toggle-wrap">
            <button
              type="button"
              className="btn-toggle-assumptions"
              onClick={() => setShowAssumptions(!showAssumptions)}
              aria-expanded={showAssumptions}
            >
              {showAssumptions ? '▲ Hide Return & Inflation Assumptions' : '▼ Customize Return & Inflation Assumptions'}
            </button>
          </div>

          {showAssumptions && (
            <div className="assumptions-box">
              <div className="field-group">
                <div className="field-header">
                  <label htmlFor={`${baseId}-inf`} className="field-label">Assumed Inflation Rate</label>
                  <div className="input-with-symbol">
                    <input
                      id={`${baseId}-inf`}
                      type="number"
                      placeholder="0"
                      min="4"
                      max="10"
                      step="0.5"
                      value={form.inflationRate}
                      onChange={(e) => handleInputChange('inflationRate', e.target.value)}
                      className="num-input"
                    />
                    <span className="symbol-suffix">%</span>
                  </div>
                </div>
              </div>

              <div className="field-group">
                <div className="field-header">
                  <label htmlFor={`${baseId}-b1Ret`} className="field-label">Bucket 1 Return (Liquid)</label>
                  <div className="input-with-symbol">
                    <input
                      id={`${baseId}-b1Ret`}
                      type="number"
                      placeholder="0"
                      min="3"
                      max="8"
                      step="0.5"
                      value={form.bucket1Return}
                      onChange={(e) => handleInputChange('bucket1Return', e.target.value)}
                      className="num-input"
                    />
                    <span className="symbol-suffix">%</span>
                  </div>
                </div>
              </div>

              <div className="field-group">
                <div className="field-header">
                  <label htmlFor={`${baseId}-b2Ret`} className="field-label">Bucket 2 Return (Hybrid/Debt)</label>
                  <div className="input-with-symbol">
                    <input
                      id={`${baseId}-b2Ret`}
                      type="number"
                      placeholder="0"
                      min="5"
                      max="11"
                      step="0.5"
                      value={form.bucket2Return}
                      onChange={(e) => handleInputChange('bucket2Return', e.target.value)}
                      className="num-input"
                    />
                    <span className="symbol-suffix">%</span>
                  </div>
                </div>
              </div>

              <div className="field-group">
                <div className="field-header">
                  <label htmlFor={`${baseId}-b3Ret`} className="field-label">Bucket 3 Return (Equity)</label>
                  <div className="input-with-symbol">
                    <input
                      id={`${baseId}-b3Ret`}
                      type="number"
                      placeholder="0"
                      min="8"
                      max="15"
                      step="0.5"
                      value={form.bucket3Return}
                      onChange={(e) => handleInputChange('bucket3Return', e.target.value)}
                      className="num-input"
                    />
                    <span className="symbol-suffix">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="calc-results-column">
          <div className="result-panel">
            {result ? (
              <>
                <span className="result-eyebrow">Total Capital Required at Age {form.retirementAge}</span>
                <div className="result-headline-value" data-testid="total-distribution-corpus">
                  {formatINR(result.totalInvestmentRequiredToday)}
                </div>
                <p className="result-subline">
                  Weighted post-tax return: <strong>{result.weightedAveragePostTaxReturn}% p.a.</strong> · Real Return: <strong>{result.overallRealReturn}% p.a.</strong>
                </p>

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
                    <p className="bucket-desc">Covers immediate 3 years of cash flow in bank sweep and liquid funds.</p>
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
                    <p className="bucket-desc">Invested in conservative hybrid and debt to replenish Bucket 1.</p>
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
                    <p className="bucket-desc">Compounds in diversified equities for 7+ years to beat inflation.</p>
                  </div>
                </div>

                {/* Strategic Insight */}
                <div className="insight-callout">
                  <span className="insight-icon" aria-hidden="true">💡</span>
                  <div className="insight-text">{result.keyInsight}</div>
                </div>
              </>
            ) : (
              <div className="result-empty-state">
                <div className="empty-state-icon" aria-hidden="true">🪣</div>
                <h3 className="empty-state-title">Enter retirement income details</h3>
                <p className="empty-state-desc">
                  Fill in your desired monthly retirement expense and horizon on the left—or click <strong>Sample Data</strong> to preview a scenario.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .retirement-dist-workbench {
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
          margin-bottom: 22px;
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

        .timeline-badge {
          display: inline-block;
          background: var(--awc-jade-soft);
          border: 1px solid #B7DDD3;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 12px;
          color: var(--awc-navy);
          margin-bottom: 14px;
        }

        .assumptions-toggle-wrap {
          margin-top: 8px;
          border-top: 1px dashed var(--awc-line);
          padding-top: 14px;
        }

        .btn-toggle-assumptions {
          background: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 10px;
          color: var(--color-text-brand);
          font-weight: 750;
          font-size: 12.5px;
          cursor: pointer;
          padding: 9px 14px;
          width: 100%;
          text-align: left;
          transition: all 0.15s ease;
        }

        .btn-toggle-assumptions:hover {
          border-color: var(--color-border-interactive);
        }

        .assumptions-box {
          background: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 14px;
          padding: 16px;
          margin-top: 12px;
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

        .allocation-bar-section {
          margin: 4px 0;
        }

        .allocation-bar-track {
          display: flex;
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.1);
        }

        .bar-b1 { background: #60A5FA; }
        .bar-b2 { background: var(--awc-gold); }
        .bar-b3 { background: #5DD9C1; }

        .allocation-legend {
          display: flex;
          gap: 14px;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .legend-item { display: flex; align-items: center; gap: 6px; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot-b1 { background: #60A5FA; }
        .dot-b2 { background: var(--awc-gold); }
        .dot-b3 { background: #5DD9C1; }

        .buckets-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .bucket-card {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
        }

        .card-b1 { border-top: 3px solid #60A5FA; }
        .card-b2 { border-top: 3px solid var(--awc-gold); }
        .card-b3 { border-top: 3px solid #5DD9C1; }

        .bucket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .bucket-tag {
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .tag-b1 { color: #93C5FD; }
        .tag-b2 { color: var(--awc-gold); }
        .tag-b3 { color: #5DD9C1; }

        .bucket-years {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.65);
          font-weight: 700;
        }

        .bucket-corpus-amt {
          font-size: 16px;
          font-weight: 850;
          color: #ffffff;
          margin-bottom: 6px;
        }

        .bucket-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.78);
          margin-bottom: 8px;
        }

        .bucket-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.62);
          line-height: 1.35;
          margin: auto 0 0;
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

        @media (max-width: 650px) {
          .card-surface,
          .result-panel {
            padding: 20px;
          }

          .buckets-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
