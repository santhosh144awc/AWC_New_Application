import React, { useState, useId } from 'react';
import { calculateSIP, type SIPResult } from '../../domain/finance/sip';
import { formatINR, formatIndianCompact, formatPercentage } from '../../lib/formatters';

interface FormInputs {
  monthlyInvestment: string;
  annualReturnPercent: string;
  years: string;
  annualStepUpPercent: string;
}

const DEFAULT_INPUTS: FormInputs = {
  monthlyInvestment: '10000',
  annualReturnPercent: '12',
  years: '10',
  annualStepUpPercent: '0',
};

export default function SipCalculatorIsland(): React.JSX.Element {
  const [inputs, setInputs] = useState<FormInputs>(DEFAULT_INPUTS);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const baseId = useId();

  // Check if inputs have been customized from defaults
  const isCustomized =
    inputs.monthlyInvestment !== DEFAULT_INPUTS.monthlyInvestment ||
    inputs.annualReturnPercent !== DEFAULT_INPUTS.annualReturnPercent ||
    inputs.years !== DEFAULT_INPUTS.years ||
    inputs.annualStepUpPercent !== DEFAULT_INPUTS.annualStepUpPercent;

  // Parse numeric values (handling empty string gracefully during typing)
  const amountTrimmed = inputs.monthlyInvestment.trim();
  const returnTrimmed = inputs.annualReturnPercent.trim();
  const yearsTrimmed = inputs.years.trim();
  const stepUpTrimmed = inputs.annualStepUpPercent.trim();

  const amountNum = amountTrimmed === '' ? NaN : Number(amountTrimmed);
  const returnNum = returnTrimmed === '' ? NaN : Number(returnTrimmed);
  const yearsNum = yearsTrimmed === '' ? NaN : Number(yearsTrimmed);
  const stepUpNum = stepUpTrimmed === '' ? NaN : Number(stepUpTrimmed);

  // Defensible Consumer Validation Bounds
  const isAmountValid = amountTrimmed !== '' && Number.isFinite(amountNum) && amountNum >= 500 && amountNum <= 1000000;
  const isReturnValid = returnTrimmed !== '' && Number.isFinite(returnNum) && returnNum >= 0 && returnNum <= 50;
  const isYearsValid = yearsTrimmed !== '' && Number.isFinite(yearsNum) && Number.isInteger(yearsNum) && yearsNum >= 1 && yearsNum <= 40;
  const isStepUpValid = stepUpTrimmed !== '' && Number.isFinite(stepUpNum) && stepUpNum >= 0 && stepUpNum <= 50;

  const isValid = isAmountValid && isReturnValid && isYearsValid && isStepUpValid;

  // Authoritative domain calculation results
  let result: SIPResult | null = null;
  let fixedCounterpartResult: SIPResult | null = null;

  if (isValid) {
    try {
      result = calculateSIP({
        monthlyInvestment: amountNum,
        tenureMonths: yearsNum * 12,
        annualReturnPercent: returnNum,
        annualStepUpPercent: stepUpNum,
        generateSchedule: true,
      });

      if (stepUpNum > 0) {
        fixedCounterpartResult = calculateSIP({
          monthlyInvestment: amountNum,
          tenureMonths: yearsNum * 12,
          annualReturnPercent: returnNum,
          annualStepUpPercent: 0,
        });
      }
    } catch {
      result = null;
    }
  }

  const handleReset = (): void => {
    setInputs(DEFAULT_INPUTS);
    setShowSchedule(false);
  };

  const investedPercent = result && result.futureValue > 0
    ? Math.min(100, Math.max(0, (result.totalInvested / result.futureValue) * 100))
    : 0;
  const gainPercent = result && result.futureValue > 0
    ? Math.max(0, 100 - investedPercent)
    : 0;

  // Step-up scenario differences
  const extraContributions = result && fixedCounterpartResult
    ? result.totalInvested - fixedCounterpartResult.totalInvested
    : 0;
  const corpusDifference = result && fixedCounterpartResult
    ? result.futureValue - fixedCounterpartResult.futureValue
    : 0;
  const gainDifference = result && fixedCounterpartResult
    ? result.totalGain - fixedCounterpartResult.totalGain
    : 0;

  // Slider bounded values (for synchronized visual representation)
  const sliderAmountValue = Number.isFinite(amountNum) ? Math.min(1000000, Math.max(500, amountNum)) : 500;
  const sliderReturnValue = Number.isFinite(returnNum) ? Math.min(50, Math.max(0, returnNum)) : 0;
  const sliderYearsValue = Number.isFinite(yearsNum) && Number.isInteger(yearsNum) ? Math.min(40, Math.max(1, yearsNum)) : 1;
  const sliderStepUpValue = Number.isFinite(stepUpNum) ? Math.min(50, Math.max(0, stepUpNum)) : 0;

  return (
    <div className="sip-workbench-wrapper" id="sip-calculator-app">
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
              ? 'Showing mathematical projections based on your entered parameters. This model calculates compounding with contributions invested at the beginning of each month under the Effective Annual Rate convention.'
              : 'This tool models monthly compounding with contributions at the beginning of each month under the Effective Annual Rate convention. Adjust any assumption below to test your scenario.'}
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

      {/* Mobile Live Result Overview (<850px viewport) */}
      <section
        className="mobile-result-summary mobile-quick-jump"
        id="sip-mobile-summary"
        aria-label="Mobile result overview"
      >
        <div className="mrs-header">
          <div className="mrs-pill-row">
            <span className={`mrs-tag ${isCustomized ? 'tag-custom' : 'tag-example'}`}>
              {isCustomized ? 'Custom inputs active' : 'Illustrative example'}
            </span>
            <span className="mrs-timing">EAR · Annuity-due</span>
          </div>

          <div className="mrs-headline-block">
            <span className="mrs-headline-label">Current Estimated Future Value</span>
            <div className="mrs-amount-row">
              <span className="mrs-amount" id="sip-mobile-headline-val">
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
                ? `Estimate for ₹${Number(amountNum).toLocaleString('en-IN')}/mo over ${yearsNum} yrs @ ${returnNum}% annual return.`
                : 'Scenario based on default inputs: ₹10,000/mo over 10 years at assumed 12% return.'
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
              const inputEl = document.getElementById(`${baseId}-amount-num`);
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
            <div className="range-field form-group">
              <div className="field-head label-row">
                <label htmlFor={`${baseId}-amount-num`} className="field-label form-label">
                  Monthly Investment
                </label>
                <div className="input-with-symbol">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    id={`${baseId}-amount-num`}
                    value={inputs.monthlyInvestment}
                    min={500}
                    max={1000000}
                    step={500}
                    onChange={(e) => setInputs({ ...inputs, monthlyInvestment: e.target.value })}
                    className={`num-input ${!isAmountValid ? 'input-error' : ''}`}
                    aria-describedby={`${baseId}-amount-help`}
                  />
                </div>
              </div>
              <input
                type="range"
                id={`${baseId}-amount-slider`}
                value={sliderAmountValue}
                min={500}
                max={1000000}
                step={500}
                onChange={(e) => setInputs({ ...inputs, monthlyInvestment: e.target.value })}
                className="range-slider"
                aria-label="Monthly Investment Amount Slider"
              />
              <div className="range-ends slider-ticks">
                <span>₹500</span>
                <span>₹10,00,000</span>
              </div>
              {!isAmountValid ? (
                <span id={`${baseId}-amount-help`} className="field-error" role="alert">
                  {amountTrimmed === ''
                    ? 'Please enter an installment amount.'
                    : 'Enter an amount between ₹500 and ₹10,00,000.'}
                </span>
              ) : (
                <span id={`${baseId}-amount-help`} className="field-hint">
                  The amount you plan to invest each month.
                </span>
              )}
            </div>

            {/* Input 2: Expected Return Rate */}
            <div className="range-field form-group">
              <div className="field-head label-row">
                <label htmlFor={`${baseId}-return-num`} className="field-label form-label">
                  Assumed Annual Return
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
                  A scenario used for illustration, not a prediction or promise.
                </span>
              )}
            </div>

            {/* Input 3: Investment Duration */}
            <div className="range-field form-group">
              <div className="field-head label-row">
                <label htmlFor={`${baseId}-years-num`} className="field-label form-label">
                  Investment Duration
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
                aria-label="Investment Tenure in Years Slider"
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
                    : 'Enter a duration between 1 and 40 years.'}
                </span>
              ) : (
                <span id={`${baseId}-years-help`} className="field-hint">
                  How long you expect to keep investing.
                </span>
              )}
            </div>

            {/* Input 4: Annual Step-Up */}
            <div className="range-field form-group">
              <div className="field-head label-row">
                <label htmlFor={`${baseId}-stepup-num`} className="field-label form-label">
                  Annual Step-Up (Optional)
                </label>
                <div className="input-with-symbol">
                  <input
                    type="number"
                    id={`${baseId}-stepup-num`}
                    value={inputs.annualStepUpPercent}
                    min={0}
                    max={50}
                    step={1}
                    onChange={(e) => setInputs({ ...inputs, annualStepUpPercent: e.target.value })}
                    className={`num-input ${!isStepUpValid ? 'input-error' : ''}`}
                    aria-describedby={`${baseId}-stepup-help`}
                  />
                  <span className="percent-suffix">%</span>
                </div>
              </div>
              <input
                type="range"
                id={`${baseId}-stepup-slider`}
                value={sliderStepUpValue}
                min={0}
                max={50}
                step={1}
                onChange={(e) => setInputs({ ...inputs, annualStepUpPercent: e.target.value })}
                className="range-slider"
                aria-label="Annual Step-Up Percentage Slider"
              />
              <div className="range-ends slider-ticks">
                <span>0% (Fixed SIP)</span>
                <span>50%</span>
              </div>
              {!isStepUpValid ? (
                <span id={`${baseId}-stepup-help`} className="field-error" role="alert">
                  {stepUpTrimmed === ''
                    ? 'Please enter a step-up percentage.'
                    : 'Enter an annual step-up between 0% and 50%.'}
                </span>
              ) : (
                <span id={`${baseId}-stepup-help`} className="field-hint">
                  {stepUpNum > 0
                    ? `Increases monthly contribution by ${stepUpNum}% starting from Month 13.`
                    : 'An optional annual increase to your monthly investment (Fixed SIP).'}
                </span>
              )}
            </div>

            <div className="helper-row">
              <span className="helper-icon">ⓘ</span>
              <span>An assumed return does not show the range of real market outcomes. Test a lower and higher scenario before drawing conclusions.</span>
            </div>
          </form>
        </section>

        {/* Right Column: Concept C Atlantic Navy Results Panel */}
        <aside
          className="workbench-card result-panel sip-results-col"
          id="workbench-results"
          aria-labelledby="results-heading"
        >
          {/* Accessible Screen Reader Announcement */}
          <div className="sr-only" aria-live="polite" aria-atomic="true" id="sip-live-announcement">
            {isValid && result
              ? `SIP calculation updated. Estimated future corpus: ${formatINR(result.futureValue)}. Total invested: ${formatINR(result.totalInvested)}. Estimated wealth gain: ${formatINR(result.totalGain)}.`
              : 'Please enter valid calculation inputs.'}
          </div>

          {isValid && result ? (
            <>
              <div className="result-hero-box">
                <span id="results-heading" className="result-label result-hero-label">
                  Estimated Future Value
                </span>
                <div className="result-number result-hero-value" id="sip-future-value">
                  {formatINR(result.futureValue)}
                </div>
                <div className="result-compact result-hero-compact">
                  approx. {formatIndianCompact(result.futureValue)}
                </div>
                <p className="result-explainer">
                  The estimate combines your contributions with hypothetical growth under the return assumption you selected.
                </p>
              </div>

              {/* 2-Metric Translucent Grid */}
              <div className="metric-grid result-metrics-grid">
                <div className="metric metric-box">
                  <small className="metric-label">Total Contributions</small>
                  <b className="metric-value" id="sip-total-invested">
                    {formatINR(result.totalInvested)}
                  </b>
                  <span className="metric-sub">{formatIndianCompact(result.totalInvested)} invested</span>
                </div>

                <div className="metric metric-box highlight-gain">
                  <small className="metric-label">Illustrative Growth</small>
                  <b className="metric-value" id="sip-total-gain">
                    {formatINR(result.totalGain)}
                  </b>
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
              {stepUpNum > 0 && fixedCounterpartResult && (
                <div className="stepup-advantage-card" id="sip-stepup-comparison">
                  <div className="advantage-header">
                    <span className="advantage-badge">Scenario Comparison</span>
                    <span className="advantage-title">Step-Up SIP vs Fixed Monthly SIP</span>
                  </div>
                  <p className="advantage-intro">
                    Comparing a <strong>{stepUpNum}% annual step-up</strong> against maintaining a constant{' '}
                    <strong>{formatINR(amountNum)}/month</strong> fixed contribution across {yearsNum} years at an assumed{' '}
                    {returnNum}% annual return:
                  </p>

                  <div className="advantage-comparison-grid">
                    <div className="adv-grid-row">
                      <span className="adv-col-label">Total Invested:</span>
                      <span className="adv-col-val" id="adv-fixed-invested">
                        Fixed: {formatINR(fixedCounterpartResult.totalInvested)}
                      </span>
                      <span className="adv-col-val" id="adv-stepup-invested">
                        Step-Up: {formatINR(result.totalInvested)}
                      </span>
                      <span className="adv-col-diff text-primary" id="adv-diff-invested">
                        +{formatINR(extraContributions)} additional contributions invested
                      </span>
                    </div>

                    <div className="adv-grid-row">
                      <span className="adv-col-label">Estimated Corpus:</span>
                      <span className="adv-col-val" id="adv-fixed-corpus">
                        Fixed: {formatINR(fixedCounterpartResult.futureValue)}
                      </span>
                      <span className="adv-col-val font-bold text-success" id="adv-stepup-corpus">
                        Step-Up: {formatINR(result.futureValue)}
                      </span>
                      <span className="adv-col-diff text-success" id="adv-diff-corpus">
                        +{formatINR(corpusDifference)} more wealth
                      </span>
                    </div>

                    <div className="adv-grid-row">
                      <span className="adv-col-label">Estimated Gains:</span>
                      <span className="adv-col-val" id="adv-fixed-gain">
                        Fixed: {formatINR(fixedCounterpartResult.totalGain)}
                      </span>
                      <span className="adv-col-val font-bold" id="adv-stepup-gain">
                        Step-Up: {formatINR(result.totalGain)}
                      </span>
                      <span className="adv-col-diff text-gain" id="adv-diff-gain">
                        +{formatINR(gainDifference)} extra earnings
                      </span>
                    </div>
                  </div>

                  <p className="advantage-disclaimer">
                    <strong>Mathematical Note:</strong> This is a scenario comparison between two different savings rates,
                    not proof of superior investment performance or a return guarantee. The +{formatINR(corpusDifference)} difference
                    in eventual corpus reflects both your additional contributions (+{formatINR(extraContributions)}) and the
                    compounded growth generated on those extra contributions (+{formatINR(gainDifference)}).
                  </p>
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

              {/* Caveat & Context Actions */}
              <p className="result-foot">
                This model excludes taxes, fees, fund selection and volatility. The final value is sensitive to the assumed return and contribution timing.
              </p>

              <div className="results-cta-row">
                <a
                  href="#controls-heading"
                  className="btn-adjust-assumptions"
                  onClick={() => {
                    const inputEl = document.getElementById(`${baseId}-amount-num`);
                    if (inputEl) {
                      inputEl.focus();
                    }
                  }}
                >
                  ↑ Adjust assumptions
                </a>
                <a href="/tools/" className="button button-lime" style={{ textDecoration: 'none' }}>
                  Explore another tool →
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
        <section className="surface schedule-section" aria-labelledby="schedule-heading">
          <div className="schedule-header">
            <h3 id="schedule-heading" className="schedule-title">Annual Accumulation Schedule ({inputs.years} Years)</h3>
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
                    <td className="font-bold text-accent-gold">{formatINR(row.yearEndBalance)}</td>
                    <td className="text-gain">{formatINR(row.cumulativeGain)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Explanatory Triad: What These Numbers Mean */}
      <section className="surface explainer-surface" aria-labelledby="meaning-heading">
        <h3 id="meaning-heading" className="explainer-heading">What these numbers mean</h3>
        <div className="three-col explainer-grid">
          <div className="explainer-card">
            <span className="explainer-bullet">01</span>
            <strong className="explainer-card-title">Contributions</strong>
            <p className="small-muted">
              The cumulative capital you deposit over {isValid && result ? `${inputs.years} years` : 'time'}. This is your principal outlay.
            </p>
          </div>
          <div className="explainer-card">
            <span className="explainer-bullet">02</span>
            <strong className="explainer-card-title">Illustrative growth</strong>
            <p className="small-muted">
              The hypothetical earnings generated by compounding under your assumed return. Growth is back-loaded into later years.
            </p>
          </div>
          <div className="explainer-card">
            <span className="explainer-bullet">03</span>
            <strong className="explainer-card-title">Step-up difference</strong>
            <p className="small-muted">
              Increasing your monthly deposit annually expands your principal base before lifestyle inflation absorbs career salary growth.
            </p>
          </div>
        </div>

        {/* Accessible Collapsible Details Disclosures */}
        <div className="disclosures-list">
          <details className="disclosure-item">
            <summary>Calculation assumptions & compounding methodology</summary>
            <div className="disclosure-content">
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
          </details>
        </div>
      </section>

      <style>{`
        /* Concept C Palette & Design System Variables for SIP Calculator */
        .sip-workbench-wrapper {
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
          width: 105px;
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

        /* Step-Up Advantage Card */
        .stepup-advantage-card {
          position: relative;
          z-index: 1;
          background: rgba(22, 135, 126, 0.15);
          border: 1px solid rgba(22, 135, 126, 0.35);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 18px;
        }

        .advantage-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .advantage-badge {
          background-color: var(--awc-gold);
          color: var(--awc-navy);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .advantage-title {
          font-size: 12px;
          font-weight: 800;
          color: #ffffff;
        }

        .advantage-intro {
          font-size: 11px;
          color: #DDEBE7;
          line-height: 1.5;
          margin: 0 0 10px;
        }

        .advantage-comparison-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px 0;
          border-top: 1px dashed rgba(255, 255, 255, 0.15);
          border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
          margin-bottom: 10px;
        }

        .adv-grid-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2px;
          font-size: 11px;
          background: rgba(255, 255, 255, 0.06);
          padding: 8px 10px;
          border-radius: 8px;
          color: #E2ECE9;
        }

        @media (min-width: 640px) {
          .adv-grid-row {
            grid-template-columns: 1.2fr 1.3fr 1.3fr 1.7fr;
            align-items: center;
          }
        }

        .adv-col-label {
          font-weight: 800;
          color: #C5D7D2;
        }

        .adv-col-val {
          font-variant-numeric: tabular-nums;
        }

        .adv-col-diff {
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }

        .text-primary {
          color: var(--awc-mint);
        }

        .text-success {
          color: #5EEAD4;
        }

        .text-gain {
          color: var(--awc-gold);
        }

        .advantage-disclaimer {
          font-size: 10px;
          color: #BDCEC9;
          line-height: 1.5;
          margin: 0;
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
          color: #DDEBE7;
          margin: 0;
        }

        /* Explanatory Triad Section */
        .explainer-surface {
          margin-top: 28px;
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: var(--radius-xl);
          padding: 28px;
          box-shadow: var(--shadow-card);
        }

        .explainer-heading {
          font-size: 19px;
          font-weight: 850;
          letter-spacing: -0.04em;
          color: var(--awc-navy);
          margin: 0 0 18px;
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
          background-color: var(--awc-paper);
          border: 1px solid #E5ECE9;
          border-radius: 16px;
          padding: 16px;
        }

        .explainer-bullet {
          display: block;
          font-size: 11px;
          font-weight: 900;
          color: var(--color-text-brand);
          margin-bottom: 6px;
        }

        .explainer-card-title {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: var(--awc-navy);
          margin-bottom: 4px;
        }

        .small-muted {
          font-size: 12px;
          color: var(--color-text-muted);
          line-height: 1.6;
          margin: 0;
        }

        /* Disclosures */
        .disclosures-list {
          display: grid;
          gap: 14px;
        }

        .disclosure-item {
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 16px;
          padding: 16px 20px;
          transition: background-color 0.15s ease;
        }

        .disclosure-item summary {
          cursor: pointer;
          font-weight: 800;
          font-size: 13px;
          color: var(--awc-navy);
          outline: none;
        }

        .disclosure-item summary:hover {
          color: var(--color-text-brand);
        }

        .disclosure-content {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--awc-line);
        }

        .methodology-list {
          margin: 0;
          padding-left: 20px;
          font-size: 12px;
          color: var(--color-text-muted);
          line-height: 1.7;
        }

        .methodology-list li {
          margin-bottom: 8px;
        }

        .methodology-list code {
          background-color: #E7ECEA;
          padding: 2px 5px;
          border-radius: 4px;
          font-family: monospace;
          color: var(--awc-navy);
        }

        /* Schedule Table */
        .schedule-header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
        }

        .schedule-subtitle {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .btn-toggle-schedule {
          background: none;
          border: 1px solid var(--awc-line);
          border-radius: 8px;
          padding: 4px 10px;
          color: var(--color-text-brand);
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-toggle-schedule:hover {
          background-color: #ffffff;
        }

        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          font-variant-numeric: tabular-nums;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
        }

        .schedule-table th, .schedule-table td {
          padding: 10px 14px;
          text-align: right;
          border-bottom: 1px solid #EDF3F1;
        }

        .schedule-table th:first-child, .schedule-table td:first-child {
          text-align: left;
        }

        .schedule-table th {
          background-color: #EAF1EF;
          font-weight: 800;
          color: var(--awc-navy);
        }

        .text-accent-gold {
          color: #B45309;
          font-weight: 800;
        }

        .font-bold {
          font-weight: 800;
        }
      `}</style>
    </div>
  );
}
