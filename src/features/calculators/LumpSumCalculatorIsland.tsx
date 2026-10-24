import React, { useState, useId } from 'react';
import { calculateLumpsum, type LumpsumResult } from '../../domain/finance/lumpsum';
import { formatINR, formatIndianCompact, formatPercentage } from '../../lib/formatters';

interface FormInputs {
  principal: string;
  annualReturnPercent: string;
  years: string;
}

const DEFAULT_INPUTS: FormInputs = {
  principal: '100000',
  annualReturnPercent: '12',
  years: '10',
};

export default function LumpSumCalculatorIsland(): React.JSX.Element {
  const [inputs, setInputs] = useState<FormInputs>(DEFAULT_INPUTS);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const baseId = useId();

  // Check if inputs have been customized from canonical defaults
  const isCustomized =
    inputs.principal !== DEFAULT_INPUTS.principal ||
    inputs.annualReturnPercent !== DEFAULT_INPUTS.annualReturnPercent ||
    inputs.years !== DEFAULT_INPUTS.years;

  // Parse numeric values (handling empty string gracefully during typing)
  const principalTrimmed = inputs.principal.trim();
  const returnTrimmed = inputs.annualReturnPercent.trim();
  const yearsTrimmed = inputs.years.trim();

  const principalNum = principalTrimmed === '' ? NaN : Number(principalTrimmed);
  const returnNum = returnTrimmed === '' ? NaN : Number(returnTrimmed);
  const yearsNum = yearsTrimmed === '' ? NaN : Number(yearsTrimmed);

  // Defensible Consumer Validation Bounds
  const isPrincipalValid =
    principalTrimmed !== '' && Number.isFinite(principalNum) && principalNum >= 5000 && principalNum <= 10000000;
  const isReturnValid =
    returnTrimmed !== '' && Number.isFinite(returnNum) && returnNum >= 0 && returnNum <= 50;
  const isYearsValid =
    yearsTrimmed !== '' && Number.isFinite(yearsNum) && Number.isInteger(yearsNum) && yearsNum >= 1 && yearsNum <= 40;

  const isValid = isPrincipalValid && isReturnValid && isYearsValid;

  // Authoritative domain calculation results
  let result: LumpsumResult | null = null;

  if (isValid) {
    try {
      result = calculateLumpsum({
        principal: principalNum,
        years: yearsNum,
        annualReturnPercent: returnNum,
        generateSchedule: true,
      });
    } catch {
      result = null;
    }
  }

  const handleReset = (): void => {
    setInputs(DEFAULT_INPUTS);
    setShowSchedule(false);
  };

  const investedPercent =
    result && result.futureValue > 0
      ? Math.min(100, Math.max(0, (result.principal / result.futureValue) * 100))
      : 0;
  const gainPercent =
    result && result.futureValue > 0
      ? Math.max(0, 100 - investedPercent)
      : 0;

  // Slider bounded values (for synchronized visual representation)
  const sliderPrincipalValue = Number.isFinite(principalNum)
    ? Math.min(10000000, Math.max(5000, principalNum))
    : 5000;
  const sliderReturnValue = Number.isFinite(returnNum)
    ? Math.min(50, Math.max(0, returnNum))
    : 0;
  const sliderYearsValue =
    Number.isFinite(yearsNum) && Number.isInteger(yearsNum)
      ? Math.min(40, Math.max(1, yearsNum))
      : 1;

  // Rule of 72 calculation
  const doublingYears =
    isReturnValid && returnNum > 0 ? (72 / returnNum).toFixed(1) : null;

  return (
    <div className="lumpsum-workbench-wrapper" id="lumpsum-calculator-app">
      {/* Mobile Live Result Overview (<850px viewport) — Placed ahead of banner for immediate first-fold visibility */}
      <section
        className="mobile-result-summary mobile-quick-jump"
        id="lumpsum-mobile-summary"
        aria-label="Mobile result overview"
      >
        <div className="mrs-header">
          <div className="mrs-pill-row">
            <span className={`mrs-tag ${isCustomized ? 'tag-custom' : 'tag-example'}`}>
              {isCustomized ? 'Custom inputs active' : 'Illustrative example'}
            </span>
            <span className="mrs-timing">EAR · Annual Compounding</span>
          </div>

          <div className="mrs-headline-block">
            <span className="mrs-headline-label">Current Estimated Future Value</span>
            <div className="mrs-amount-row">
              <span className="mrs-amount" id="lumpsum-mobile-headline-val">
                {isValid && result ? formatINR(result.futureValue) : '—'}
              </span>
              {isValid && result && (
                <span className="mrs-compact">
                  approx. {formatIndianCompact(result.futureValue)}
                </span>
              )}
            </div>
          </div>

          <p className="mrs-scenario-caption">
            {isValid && result ? (
              isCustomized
                ? `Estimate for ₹${Number(principalNum).toLocaleString('en-IN')} over ${yearsNum} yrs @ ${returnNum}% annual return.`
                : 'Scenario based on default inputs: ₹1,00,000 over 10 years at assumed 12% return.'
            ) : (
              'Enter valid inputs in the form below to compute your estimate.'
            )}
          </p>
        </div>

        <div className="mrs-nav-actions">
          <a
            href="#controls-heading"
            className="mrs-action-btn mrs-btn-adjust"
            onClick={(e) => {
              e.preventDefault();
              const inputEl = document.getElementById(`${baseId}-principal-num`);
              if (inputEl) {
                inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                inputEl.focus();
              }
            }}
          >
            Adjust assumptions ↓
          </a>
          <a
            href="#workbench-results"
            className="mrs-action-btn mrs-btn-breakdown"
          >
            View full breakdown ↓
          </a>
        </div>
      </section>

      {/* Illustrative Notice Banner */}
      <aside className={`workbench-notice-banner ${isCustomized ? 'is-customized' : ''}`} aria-label="Scenario notice">
        <div className="notice-icon-box">
          <span className="notice-icon" aria-hidden="true">{isCustomized ? '⚙️' : 'ℹ️'}</span>
        </div>
        <div className="notice-text-col">
          <strong className="notice-title">
            {isCustomized ? 'Custom scenario active' : 'Illustrative example — not your figures'}
          </strong>
          <p className="notice-body">
            {isCustomized
              ? 'Showing mathematical projections based on your entered parameters. This model calculates compounding with a single upfront deposit under the Effective Annual Rate convention.'
              : 'This tool models hypothetical compound growth from a one-time investment under the Effective Annual Rate convention. Adjust any assumption below to test your scenario.'}
          </p>
        </div>
        {isCustomized && (
          <button
            type="button"
            onClick={handleReset}
            className="banner-reset-action"
            title="Reset to default illustrative example"
          >
            Reset example
          </button>
        )}
      </aside>

      {/* Main 2-Column Workbench Grid */}
      <div className="workbench-grid">
        {/* Left Column: Assumptions Controls */}
        <section className="workbench-card surface controls-card" aria-labelledby="controls-heading">
          <div className="controls-header">
            <div>
              <h2 id="controls-heading" className="calc-title">Set your assumptions</h2>
              <p className="calc-description">Change any input and the scenario updates immediately.</p>
            </div>
            <button
              type="button"
              id="reset-lumpsum-btn"
              onClick={handleReset}
              className="reset-btn"
              title="Reset all inputs to the default example"
            >
              Reset Example
            </button>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="lumpsum-form">
            {/* Input 1: Principal Amount */}
            <div className="range-field form-group">
              <div className="field-head label-row">
                <label htmlFor={`${baseId}-principal-num`} className="field-label form-label">
                  Amount invested today
                </label>
                <div className="input-with-symbol">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    id={`${baseId}-principal-num`}
                    value={inputs.principal}
                    min={5000}
                    max={10000000}
                    step={5000}
                    onChange={(e) => setInputs({ ...inputs, principal: e.target.value })}
                    className={`num-input ${!isPrincipalValid ? 'input-error' : ''}`}
                    aria-describedby={`${baseId}-principal-help`}
                  />
                </div>
              </div>
              <input
                type="range"
                id={`${baseId}-principal-slider`}
                value={sliderPrincipalValue}
                min={5000}
                max={10000000}
                step={5000}
                onChange={(e) => setInputs({ ...inputs, principal: e.target.value })}
                className="range-slider"
                aria-label="One-Time Investment Principal Slider"
              />
              <div className="range-ends slider-ticks">
                <span>₹5,000</span>
                <span>₹1,00,00,000</span>
              </div>
              {!isPrincipalValid ? (
                <span id={`${baseId}-principal-help`} className="field-error" role="alert">
                  {principalTrimmed === ''
                    ? 'Please enter an initial investment amount.'
                    : 'Enter an amount between ₹5,000 and ₹1,00,00,000.'}
                </span>
              ) : (
                <span id={`${baseId}-principal-help`} className="field-hint">
                  The one-time capital amount you deposit upfront today.
                </span>
              )}
            </div>

            {/* Input 2: Expected Return Rate */}
            <div className="range-field form-group">
              <div className="field-head label-row">
                <label htmlFor={`${baseId}-return-num`} className="field-label form-label">
                  Assumed annual return
                </label>
                <div className="input-with-symbol">
                  <input
                    type="number"
                    id={`${baseId}-return-num`}
                    value={inputs.annualReturnPercent}
                    min={0}
                    max={50}
                    step={0.5}
                    onChange={(e) => setInputs({ ...inputs, annualReturnPercent: e.target.value })}
                    className={`num-input ${!isReturnValid ? 'input-error' : ''}`}
                    aria-describedby={`${baseId}-return-help`}
                  />
                  <span className="percent-suffix">%</span>
                </div>
              </div>
              <input
                type="range"
                id={`${baseId}-return-slider`}
                value={sliderReturnValue}
                min={0}
                max={50}
                step={0.5}
                onChange={(e) => setInputs({ ...inputs, annualReturnPercent: e.target.value })}
                className="range-slider"
                aria-label="Assumed Annual Return Rate Slider"
              />
              <div className="range-ends slider-ticks">
                <span>0% (No Growth)</span>
                <span>50% (Max Bound)</span>
              </div>
              {!isReturnValid ? (
                <span id={`${baseId}-return-help`} className="field-error" role="alert">
                  {returnTrimmed === ''
                    ? 'Please enter an expected annual return rate.'
                    : 'Enter an effective annual return between 0% and 50%.'}
                </span>
              ) : (
                <span id={`${baseId}-return-help`} className="field-hint">
                  A hypothetical scenario used for illustration, not a forecast or promise.
                </span>
              )}
            </div>

            {/* Input 3: Investment Duration */}
            <div className="range-field form-group">
              <div className="field-head label-row">
                <label htmlFor={`${baseId}-years-num`} className="field-label form-label">
                  Time invested
                </label>
                <div className="input-with-symbol">
                  <input
                    type="number"
                    id={`${baseId}-years-num`}
                    value={inputs.years}
                    min={1}
                    max={40}
                    step={1}
                    onChange={(e) => setInputs({ ...inputs, years: e.target.value })}
                    className={`num-input ${!isYearsValid ? 'input-error' : ''}`}
                    aria-describedby={`${baseId}-years-help`}
                  />
                  <span className="unit-suffix">Yrs</span>
                </div>
              </div>
              <input
                type="range"
                id={`${baseId}-years-slider`}
                value={sliderYearsValue}
                min={1}
                max={40}
                step={1}
                onChange={(e) => setInputs({ ...inputs, years: e.target.value })}
                className="range-slider"
                aria-label="Investment Duration in Years Slider"
              />
              <div className="range-ends slider-ticks">
                <span>1 Year</span>
                <span>40 Years</span>
              </div>
              {!isYearsValid ? (
                <span id={`${baseId}-years-help`} className="field-error" role="alert">
                  {yearsTrimmed === ''
                    ? 'Please enter duration in years.'
                    : !Number.isInteger(yearsNum)
                    ? 'Duration must be a whole number of years (1 to 40).'
                    : 'Enter a duration between 1 and 40 whole years.'}
                </span>
              ) : (
                <span id={`${baseId}-years-help`} className="field-hint">
                  The multi-year horizon over which your lump sum stays invested.
                </span>
              )}
            </div>

            <div className="helper-row">
              <span className="helper-icon">ⓘ</span>
              <span>An assumed return does not capture market volatility. Model conservative, moderate, and ambitious rates before making decisions.</span>
            </div>
          </form>
        </section>

        {/* Right Column: Concept C Atlantic Navy Results Panel */}
        <aside
          className="workbench-card result-panel lumpsum-results-col"
          id="workbench-results"
          aria-labelledby="results-heading"
        >
          {/* Accessible Screen Reader Announcement */}
          <div className="sr-only" aria-live="polite" aria-atomic="true" id="lumpsum-live-announcement">
            {isValid && result
              ? `Lump sum calculation updated. Estimated future value: ${formatINR(result.futureValue)}. Total invested: ${formatINR(result.principal)}. Estimated wealth gain: ${formatINR(result.totalGain)}.`
              : 'Please enter valid calculation inputs.'}
          </div>

          {isValid && result ? (
            <>
              <div className="result-hero-box">
                <span id="results-heading" className="result-label result-hero-label">
                  Estimated Future Value
                </span>
                <div className="result-number result-hero-value" id="lumpsum-future-value">
                  {formatINR(result.futureValue)}
                </div>
                <div className="result-compact result-hero-compact">
                  approx. {formatIndianCompact(result.futureValue)}
                </div>
                <p className="result-explainer">
                  {returnNum === 0
                    ? `At an assumed 0% annual return, your ${formatINR(principalNum)} investment remains ${formatINR(principalNum)} over ${yearsNum} years with no compound growth.`
                    : `Under this assumed annual return, your ${formatINR(principalNum)} investment would mathematically grow to about ${formatINR(result.futureValue)} over ${yearsNum} years.`}
                </p>
              </div>

              {/* 2-Metric Translucent Grid */}
              <div className="metric-grid result-metrics-grid">
                <div className="metric metric-box">
                  <small className="metric-label">Amount Invested</small>
                  <b className="metric-value" id="lumpsum-total-invested">
                    {formatINR(result.principal)}
                  </b>
                  <span className="metric-sub">{formatIndianCompact(result.principal)} principal</span>
                </div>

                <div className="metric metric-box highlight-gain">
                  <small className="metric-label">Illustrative Growth</small>
                  <b className="metric-value" id="lumpsum-total-gain">
                    {formatINR(result.totalGain)}
                  </b>
                  <span className="metric-sub">
                    {returnNum === 0 ? '₹0 gain (0% return)' : `${formatIndianCompact(result.totalGain)} compounding`}
                  </span>
                </div>
              </div>

              {/* Visual Proportion Bar */}
              <div className="distribution-wrapper" aria-label="Ratio of invested principal to illustrative growth">
                <div className="distribution-bar">
                  <div
                    className="bar-invested"
                    style={{ width: `${investedPercent}%` }}
                    title={`Principal: ${formatPercentage(investedPercent, 1)}`}
                  />
                  <div
                    className="bar-gain"
                    style={{ width: `${gainPercent}%` }}
                    title={`Growth: ${formatPercentage(gainPercent, 1)}`}
                  />
                </div>
                <div className="distribution-legend">
                  <div className="legend-item">
                    <span className="legend-dot dot-invested" />
                    <span>Invested Principal ({formatPercentage(investedPercent, 0)})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot dot-gain" />
                    <span>Illustrative Growth ({formatPercentage(gainPercent, 0)})</span>
                  </div>
                </div>
              </div>

              {/* Schedule Toggle Button */}
              <div className="schedule-toggle-wrapper">
                <button
                  type="button"
                  id="toggle-lumpsum-schedule-btn"
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="btn-toggle-schedule"
                  aria-expanded={showSchedule}
                >
                  {showSchedule ? '▲ Hide Year-by-Year Growth' : '▼ View Year-by-Year Growth'}
                </button>
              </div>

              {/* Caveat & Context Actions */}
              <p className="result-foot">
                This simulation models hypothetical compounding and excludes taxes, inflation, exit loads, and fund expense ratios. Actual market returns are never fixed or guaranteed.
              </p>

              <div className="results-cta-row">
                <a
                  href="#controls-heading"
                  className="btn-adjust-assumptions"
                  onClick={() => {
                    const inputEl = document.getElementById(`${baseId}-principal-num`);
                    if (inputEl) {
                      inputEl.focus();
                    }
                  }}
                >
                  ↑ Adjust assumptions
                </a>
                <a href="/tools/sip/" className="button button-lime" style={{ textDecoration: 'none' }}>
                  Compare with SIP →
                </a>
              </div>
            </>
          ) : (
            <div className="invalid-state-box">
              <span className="invalid-icon">⚠️</span>
              <p className="invalid-msg">
                Please provide valid calculation parameters to display simulation results.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Year-by-Year Schedule Table (Collapsible) */}
      {isValid && result && showSchedule && (
        <section className="surface schedule-section" id="lumpsum-schedule-table" aria-labelledby="schedule-heading">
          <div className="schedule-header">
            <h3 id="schedule-heading" className="schedule-title">Year-by-Year Balance Progression ({inputs.years} Years)</h3>
            <span className="schedule-subtitle">Modelled with Effective Annual Compounding Convention</span>
          </div>

          <div className="table-responsive">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th scope="col">Year</th>
                  <th scope="col">Opening Balance</th>
                  <th scope="col">Yearly Growth</th>
                  <th scope="col">Closing Balance</th>
                  <th scope="col">Cumulative Growth</th>
                </tr>
              </thead>
              <tbody>
                {result.yearlySchedule.map((row) => (
                  <tr key={row.year}>
                    <td className="font-bold col-year">Year {row.year}</td>
                    <td>{formatINR(row.openingBalance)}</td>
                    <td className="col-growth">+{formatINR(row.growthAmount)}</td>
                    <td className="font-bold text-accent-gold col-balance">{formatINR(row.closingBalance)}</td>
                    <td className="text-gain col-gain">+{formatINR(row.cumulativeGain)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Explanatory Triad & Rule of 72: What These Numbers Mean */}
      <section className="surface explainer-surface" aria-labelledby="meaning-heading">
        <h3 id="meaning-heading" className="explainer-heading">What these numbers mean</h3>
        <div className="three-col explainer-grid">
          <div className="explainer-card">
            <span className="explainer-bullet">01</span>
            <strong className="explainer-card-title">Upfront Capital</strong>
            <p className="small-muted">
              The single lump-sum outlay deposited on day one ({isValid && result ? formatINR(result.principal) : '₹1,00,000'}). No ongoing monthly contributions are required.
            </p>
          </div>
          <div className="explainer-card">
            <span className="explainer-bullet">02</span>
            <strong className="explainer-card-title">Illustrative Growth</strong>
            <p className="small-muted">
              The hypothetical earnings generated by compounding over {isValid && result ? `${inputs.years} years` : '10 years'}. Compounding expands significantly in later years.
            </p>
          </div>
          <div className="explainer-card">
            <span className="explainer-bullet">03</span>
            <strong className="explainer-card-title">Rule of 72 Shortcut</strong>
            <p className="small-muted">
              {doublingYears
                ? `At your assumed ${returnNum}% return, capital would double approximately every ${doublingYears} years (72 / ${returnNum}).`
                : 'Under an assumed 0% annual return, capital does not double as there is no illustrative growth.'}
            </p>
          </div>
        </div>

        {/* Dynamic Rule of 72 Education Card */}
        <div className="rule72-context-card">
          <div className="rule72-header">
            <span className="rule72-tag">Mental Shortcut</span>
            <strong className="rule72-title">The Rule of 72 in Perspective</strong>
          </div>
          <p className="rule72-body">
            {doublingYears ? (
              <>
                Dividing 72 by your assumed return rate of <strong>{returnNum}%</strong> (72 / {returnNum}) gives approximately{' '}
                <strong>{doublingYears} years</strong> for your capital to double. Over your selected{' '}
                <strong>{yearsNum}-year</strong> horizon, your initial capital would double roughly{' '}
                <strong>{(yearsNum / Number(doublingYears)).toFixed(1)} times</strong>.
              </>
            ) : (
              <>
                Under an assumed <strong>0% annual return</strong>, capital remains constant and does not double.
              </>
            )}
            {' '}Please remember: the Rule of 72 is an approximate mental shortcut, not an exact compounding calculation or a guarantee of investment returns. Real market returns fluctuate from year to year.
          </p>
        </div>

        {/* Accessible Collapsible Details Disclosures */}
        <div className="disclosures-list">
          <details className="disclosure-item">
            <summary>How this estimate is calculated & compounding methodology</summary>
            <div className="disclosure-content">
              <ul className="methodology-list">
                <li>
                  <strong>Compounding Formula:</strong> Evaluated using the standard effective compound interest equation:{' '}
                  <code>Future Value = Principal × (1 + r)^n</code>, where <code>r</code> is the annual return decimal and <code>n</code> is tenure in whole years.
                </li>
                <li>
                  <strong>Effective Annual Rate (EAR) Convention:</strong> The assumed annual percentage return is applied once per complete annual cycle, matching standard Indian mutual fund multi-year CAGR conventions.
                </li>
                <li>
                  <strong>Precision & Rounding:</strong> All intermediate values in the progression schedule maintain full floating-point precision internally and are rounded to whole rupees solely for clear visual display.
                </li>
                <li>
                  <strong>Exclusions & Regulatory Risk Notice:</strong> Mutual fund investments are subject to market risks. Read all scheme-related documents carefully. This simulation excludes taxes, exit loads, and fund management expenses. Calculated projections are purely illustrative scenarios based on assumed parameters and do not constitute financial advice, performance forecasts, or capital guarantees.
                </li>
              </ul>
            </div>
          </details>
        </div>
      </section>

      <style>{`
        /* Concept C Palette & Design System Variables for Lump-Sum Calculator */
        .lumpsum-workbench-wrapper {
          margin: var(--space-4) 0 var(--space-12);
        }

        /* Notice Banner */
        .workbench-notice-banner {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background-color: var(--awc-jade-soft);
          border: 1px solid #C5E3DA;
          border-radius: 18px;
          padding: 16px 20px;
          margin-bottom: 24px;
          color: var(--awc-navy);
        }

        .workbench-notice-banner.is-customized {
          background-color: #E8EEF2;
          border-color: #D3DFE6;
        }

        .notice-icon-box {
          font-size: 20px;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notice-text-col {
          flex: 1;
        }

        .notice-title {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: var(--awc-jade-deep);
          margin-bottom: 4px;
        }

        .workbench-notice-banner.is-customized .notice-title {
          color: var(--awc-navy);
        }

        .notice-body {
          font-size: 12px;
          line-height: 1.6;
          color: var(--color-text-muted);
          margin: 0;
        }

        .banner-reset-action {
          align-self: center;
          background: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          color: var(--awc-jade-deep);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .banner-reset-action:hover {
          background: var(--awc-mint);
          border-color: var(--color-border-interactive);
        }

        /* Mobile Live Result Overview (<850px) */
        .mobile-result-summary {
          display: none;
        }

        @media (max-width: 850px) {
          .mobile-result-summary {
            display: block;
            background: var(--awc-navy);
            border: 1px solid rgba(242, 198, 93, 0.35);
            color: #ffffff;
            border-radius: 18px;
            padding: 18px 20px;
            margin-bottom: 22px;
            box-shadow: 0 4px 20px rgba(19, 42, 64, 0.25);
          }

          .mrs-pill-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 12px;
          }

          .mrs-tag {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 4px 8px;
            border-radius: 6px;
          }

          .mrs-tag.tag-example {
            background: rgba(242, 198, 93, 0.18);
            color: var(--awc-gold);
            border: 1px solid rgba(242, 198, 93, 0.35);
          }

          .mrs-tag.tag-custom {
            background: rgba(22, 135, 126, 0.25);
            color: var(--awc-mint);
            border: 1px solid rgba(22, 135, 126, 0.45);
          }

          .mrs-timing {
            font-size: 11px;
            color: #9AB4B0;
            font-weight: 600;
          }

          .mrs-headline-block {
            margin-bottom: 8px;
          }

          .mrs-headline-label {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-weight: 700;
            color: #C5D7D2;
            margin-bottom: 4px;
          }

          .mrs-amount-row {
            display: flex;
            flex-wrap: wrap;
            align-items: baseline;
            gap: 10px;
          }

          .mrs-amount {
            font-size: clamp(22px, 5.5vw, 28px);
            font-weight: 850;
            letter-spacing: -0.03em;
            color: var(--awc-gold);
            font-variant-numeric: tabular-nums;
          }

          .mrs-compact {
            font-size: 13px;
            font-weight: 700;
            color: var(--awc-mint);
          }

          .mrs-scenario-caption {
            font-size: 12px;
            line-height: 1.5;
            color: #C5D7D2;
            margin: 0 0 14px;
          }

          .mrs-nav-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .mrs-action-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 12px;
            min-height: 44px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 800;
            text-decoration: none;
            text-align: center;
            transition: all 0.15s ease;
          }

          .mrs-btn-adjust {
            background: #ffffff;
            color: var(--awc-navy);
            border: 1px solid var(--awc-line);
          }

          .mrs-btn-adjust:hover, .mrs-btn-adjust:focus-visible {
            background: var(--awc-paper);
            outline: 2px solid var(--awc-gold);
            outline-offset: 2px;
          }

          .mrs-btn-breakdown {
            background: var(--awc-gold);
            color: var(--awc-navy);
            border: 1px solid rgba(23, 48, 71, 0.15);
          }

          .mrs-btn-breakdown:hover, .mrs-btn-breakdown:focus-visible {
            filter: brightness(1.06);
            outline: 2px solid #ffffff;
            outline-offset: 2px;
          }
        }

        /* 2-Column Workbench Grid */
        .workbench-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (min-width: 1024px) {
          .workbench-grid {
            grid-template-columns: 1.08fr 0.92fr;
            gap: 28px;
          }
        }

        .workbench-card {
          border-radius: var(--radius-xl);
        }

        /* Controls Card (White Surface) */
        .controls-card {
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          padding: 28px;
          box-shadow: var(--shadow-card);
        }

        .controls-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 18px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--awc-line);
        }

        .calc-title {
          font-size: 22px;
          font-weight: 850;
          letter-spacing: -0.04em;
          color: var(--awc-navy);
          margin: 0 0 4px;
        }

        .calc-description {
          font-size: 12px;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0;
        }

        .reset-btn {
          background: none;
          border: 1px solid var(--awc-line);
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-muted);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .reset-btn:hover {
          color: var(--color-text-brand);
          border-color: var(--color-border-interactive);
          background-color: var(--awc-jade-soft);
        }

        /* Form Inputs */
        .range-field {
          padding: 16px 0;
          border-bottom: 1px solid #EDF3F1;
        }

        .range-field:last-of-type {
          border-bottom: none;
        }

        .field-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 800;
          color: var(--awc-navy);
        }

        .input-with-symbol {
          display: inline-flex;
          align-items: center;
          background-color: var(--awc-paper);
          border: 1px solid #D6E4E0;
          border-radius: 12px;
          padding: 4px 10px;
          transition: border-color 0.15s ease;
        }

        .input-with-symbol:focus-within {
          border-color: var(--color-border-interactive);
          outline: 2px solid rgba(22, 135, 126, 0.2);
        }

        .currency-prefix, .percent-suffix, .unit-suffix {
          font-size: 13px;
          font-weight: 800;
          color: var(--color-text-muted);
        }

        .num-input {
          border: none;
          background: transparent;
          text-align: right;
          font-weight: 800;
          font-size: 15px;
          color: var(--awc-navy);
          width: 110px;
          padding: 2px 4px;
        }

        .num-input:focus {
          outline: none;
        }

        .num-input.input-error {
          color: #DC2626;
        }

        .range-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #DCE6E3;
          outline: none;
          cursor: pointer;
          accent-color: var(--color-text-brand);
          margin: 8px 0 4px;
        }

        .range-ends {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--color-text-muted);
          font-variant-numeric: tabular-nums;
        }

        .field-error {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: #DC2626;
          font-weight: 600;
        }

        .field-hint {
          display: block;
          margin-top: 6px;
          font-size: 11px;
          color: var(--color-text-muted);
          line-height: 1.4;
        }

        .helper-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: var(--awc-paper);
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 11px;
          color: #587180;
          line-height: 1.6;
          margin-top: 18px;
          border: 1px solid #E5EBE8;
        }

        .helper-icon {
          color: var(--color-text-brand);
          font-weight: 800;
          font-size: 14px;
          line-height: 1;
        }

        /* Results Panel (Concept C Atlantic Navy) */
        .result-panel {
          background-color: var(--awc-navy);
          color: #ffffff;
          padding: 28px;
          position: sticky;
          top: 96px;
          overflow: hidden;
          box-shadow: var(--shadow-elevated);
        }

        .result-panel::after {
          content: "";
          position: absolute;
          right: -95px;
          bottom: -110px;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          border: 32px solid rgba(242, 198, 93, 0.12);
          pointer-events: none;
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
          letter-spacing: 0.12em;
          color: #C5D7D2;
          font-weight: 900;
        }

        .result-number {
          font-size: clamp(32px, 3.8vw, 48px);
          line-height: 1.05;
          letter-spacing: -0.05em;
          font-weight: 900;
          margin: 10px 0 4px;
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

        /* Metric Grid */
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          position: relative;
          z-index: 1;
          margin-bottom: 20px;
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

        .highlight-gain .metric-value {
          color: #5EEAD4;
        }

        .metric-sub {
          font-size: 10px;
          color: #A3BFB8;
        }

        /* Distribution Proportion Bar */
        .distribution-wrapper {
          position: relative;
          z-index: 1;
          margin-bottom: 20px;
        }

        .distribution-bar {
          display: flex;
          height: 10px;
          border-radius: 5px;
          overflow: hidden;
          background-color: rgba(255, 255, 255, 0.15);
        }

        .bar-invested {
          background-color: var(--awc-mint);
          transition: width 0.2s ease;
        }

        .bar-gain {
          background-color: var(--awc-gold);
          transition: width 0.2s ease;
        }

        .distribution-legend {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-top: 8px;
          color: #C5D7D2;
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
          background-color: var(--awc-mint);
        }

        .dot-gain {
          background-color: var(--awc-gold);
        }

        /* Schedule Toggle */
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
          font-size: 12px;
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
          position: relative;
          z-index: 1;
          font-size: 10px !important;
          color: #A7BEB8;
          line-height: 1.6;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          margin: 0 0 16px !important;
        }

        .results-cta-row {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn-adjust-assumptions {
          display: none;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: #ffffff;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          text-align: center;
          transition: all 0.15s ease;
        }

        .btn-adjust-assumptions:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.35);
        }

        @media (max-width: 850px) {
          .btn-adjust-assumptions {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .results-cta-row {
            flex-direction: column;
            align-items: stretch;
          }

          .results-cta-row .button-lime {
            justify-content: center;
          }
        }

        .button-lime {
          background-color: var(--awc-gold);
          color: var(--awc-navy);
          font-weight: 800;
          font-size: 13px;
          padding: 12px 18px;
          border-radius: 12px;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .button-lime:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(242, 198, 93, 0.25);
        }

        /* Invalid State Box */
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

        /* Schedule Section */
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
          -webkit-overflow-scrolling: touch;
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

        .schedule-table tr:hover td {
          background-color: #F8FAF9;
        }

        .col-year {
          font-weight: 800;
          color: var(--awc-navy);
        }

        .col-growth {
          color: var(--color-text-brand);
          font-weight: 700;
        }

        .col-balance {
          color: var(--awc-navy);
          font-weight: 800;
        }

        .text-accent-gold {
          color: #B45309;
        }

        .col-gain {
          color: #047857;
          font-weight: 700;
        }

        /* Explanatory Triad & Rule of 72 Section */
        .explainer-surface {
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: var(--radius-xl);
          padding: 28px;
          margin-top: 28px;
          box-shadow: var(--shadow-card);
        }

        .explainer-heading {
          font-size: 20px;
          font-weight: 850;
          letter-spacing: -0.03em;
          color: var(--awc-navy);
          margin: 0 0 20px;
        }

        .explainer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (min-width: 768px) {
          .explainer-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .explainer-card {
          background: var(--awc-paper);
          border: 1px solid #E5EBE8;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .explainer-bullet {
          font-size: 11px;
          font-weight: 900;
          color: var(--color-text-brand);
          background: rgba(22, 135, 126, 0.1);
          border-radius: 6px;
          padding: 2px 6px;
          align-self: flex-start;
          margin-bottom: 10px;
        }

        .explainer-card-title {
          font-size: 15px;
          font-weight: 850;
          color: var(--awc-navy);
          margin-bottom: 6px;
        }

        .small-muted {
          font-size: 12px;
          color: var(--color-text-muted);
          line-height: 1.6;
          margin: 0;
        }

        /* Rule of 72 Context Card */
        .rule72-context-card {
          background: var(--awc-jade-soft);
          border: 1px solid #C5E3DA;
          border-radius: 18px;
          padding: 20px 22px;
          margin-bottom: 24px;
        }

        .rule72-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .rule72-tag {
          background-color: var(--color-text-brand);
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .rule72-title {
          font-size: 14px;
          font-weight: 850;
          color: var(--awc-jade-deep);
        }

        .rule72-body {
          font-size: 12px;
          line-height: 1.6;
          color: var(--awc-navy);
          margin: 0;
        }

        /* Collapsible Disclosure Details */
        .disclosures-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .disclosure-item {
          background: var(--awc-paper);
          border: 1px solid #E5EBE8;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 13px;
        }

        .disclosure-item summary {
          font-weight: 800;
          color: var(--awc-navy);
          cursor: pointer;
          user-select: none;
        }

        .disclosure-item summary:hover {
          color: var(--color-text-brand);
        }

        .disclosure-content {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #E5EBE8;
          font-size: 12px;
          line-height: 1.6;
          color: var(--color-text-muted);
        }

        .methodology-list {
          padding-left: 18px;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .methodology-list code {
          background: #E8ECEB;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          color: var(--awc-navy);
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}
