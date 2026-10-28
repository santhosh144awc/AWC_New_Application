import React, { useState, useId } from 'react';
import { calculateGoalPlan, type GoalPlannerResult } from '../../domain/finance/goalPlanner';
import { formatINR, formatIndianCompact } from '../../lib/formatters';

interface GoalFormInputs {
  costToday: string;
  yearsHorizon: string;
  annualInflationPercent: string;
  assumedAnnualReturnPercent: string;
  existingSavings: string;
}

const EMPTY_INPUTS: GoalFormInputs = {
  costToday: '',
  yearsHorizon: '',
  annualInflationPercent: '',
  assumedAnnualReturnPercent: '',
  existingSavings: '',
};

const ILLUSTRATIVE_EXAMPLE: GoalFormInputs = {
  costToday: '2500000',
  yearsHorizon: '10',
  annualInflationPercent: '8',
  assumedAnnualReturnPercent: '12',
  existingSavings: '200000',
};

export default function GoalPlannerIsland(): React.JSX.Element {
  const [inputs, setInputs] = useState<GoalFormInputs>(EMPTY_INPUTS);
  const [isExampleLoaded, setIsExampleLoaded] = useState<boolean>(false);
  const baseId = useId();

  const hasAnyEntered =
    inputs.costToday.trim() !== '' ||
    inputs.yearsHorizon.trim() !== '' ||
    inputs.annualInflationPercent.trim() !== '' ||
    inputs.assumedAnnualReturnPercent.trim() !== '' ||
    inputs.existingSavings.trim() !== '';

  // Parse numeric values (handling empty string gracefully during typing)
  const costTrimmed = inputs.costToday.trim();
  const yearsTrimmed = inputs.yearsHorizon.trim();
  const inflationTrimmed = inputs.annualInflationPercent.trim();
  const returnTrimmed = inputs.assumedAnnualReturnPercent.trim();
  const savingsTrimmed = inputs.existingSavings.trim();

  const costNum = costTrimmed === '' ? NaN : Number(costTrimmed);
  const yearsNum = yearsTrimmed === '' ? NaN : Number(yearsTrimmed);
  const inflationNum = inflationTrimmed === '' ? NaN : Number(inflationTrimmed);
  const returnNum = returnTrimmed === '' ? NaN : Number(returnTrimmed);
  const savingsNum = savingsTrimmed === '' ? NaN : Number(savingsTrimmed);

  // Defensible Consumer Validation Bounds
  const isCostValid =
    costTrimmed !== '' && Number.isFinite(costNum) && costNum >= 50000 && costNum <= 50000000;
  const isYearsValid =
    yearsTrimmed !== '' && Number.isFinite(yearsNum) && Number.isInteger(yearsNum) && yearsNum >= 1 && yearsNum <= 35;
  const isInflationValid =
    inflationTrimmed !== '' && Number.isFinite(inflationNum) && inflationNum >= 0 && inflationNum <= 25;
  const isReturnValid =
    returnTrimmed !== '' && Number.isFinite(returnNum) && returnNum >= 0 && returnNum <= 50;
  const isSavingsValid =
    savingsTrimmed !== '' && Number.isFinite(savingsNum) && savingsNum >= 0 && savingsNum <= 50000000;

  const isValid = isCostValid && isYearsValid && isInflationValid && isReturnValid && isSavingsValid;

  const showCostError = hasAnyEntered && !isCostValid;
  const showYearsError = hasAnyEntered && !isYearsValid;
  const showInflationError = hasAnyEntered && !isInflationValid;
  const showReturnError = hasAnyEntered && !isReturnValid;
  const showSavingsError = hasAnyEntered && !isSavingsValid;

  // Authoritative domain calculation results
  let result: GoalPlannerResult | null = null;

  if (isValid) {
    try {
      result = calculateGoalPlan({
        costToday: costNum,
        yearsHorizon: yearsNum,
        annualInflationPercent: inflationNum,
        assumedAnnualReturnPercent: returnNum,
        existingSavings: savingsNum,
      });
    } catch {
      result = null;
    }
  }

  const handleInputChange = (field: keyof GoalFormInputs, val: string): void => {
    setIsExampleLoaded(false);
    setInputs((prev) => ({ ...prev, [field]: val }));
  };

  const handleLoadExample = (): void => {
    setInputs(ILLUSTRATIVE_EXAMPLE);
    setIsExampleLoaded(true);
  };

  const handleClearAll = (): void => {
    setInputs(EMPTY_INPUTS);
    setIsExampleLoaded(false);
  };

  // Slider bounded values (for synchronized visual representation)
  const sliderCostValue = Number.isFinite(costNum)
    ? Math.min(50000000, Math.max(50000, costNum))
    : 50000;
  const sliderYearsValue =
    Number.isFinite(yearsNum) && Number.isInteger(yearsNum)
      ? Math.min(35, Math.max(1, yearsNum))
      : 1;
  const sliderInflationValue = Number.isFinite(inflationNum)
    ? Math.min(25, Math.max(0, inflationNum))
    : 0;
  const sliderReturnValue = Number.isFinite(returnNum)
    ? Math.min(50, Math.max(0, returnNum))
    : 0;
  const sliderSavingsValue = Number.isFinite(savingsNum)
    ? Math.min(50000000, Math.max(0, savingsNum))
    : 0;

  const isFullyFunded = result !== null && result.netFundingDeficit <= 0;

  return (
    <div className="goal-workbench-wrapper" id="goal-planner-app">
      {/* Mobile Live Overview (<850px viewport) — Provides immediate first-fold visibility */}
      {isValid && result && (
        <section
          className="mobile-result-summary"
          id="goal-mobile-summary"
          aria-label="Mobile result overview"
        >
          <div className="mrs-header">
            <div className="mrs-pill-row">
              <span className={`mrs-tag ${isExampleLoaded ? 'tag-example' : 'tag-custom'}`}>
                {isExampleLoaded ? 'Illustrative example' : 'Custom household scenario'}
              </span>
              <span className="mrs-timing">Beginning-of-Month SIP · Geometric EAR</span>
            </div>

            <div className="mrs-headline-block">
              <span className="mrs-headline-label">
                {isFullyFunded ? 'Goal Status' : 'Estimated Monthly SIP Needed'}
              </span>
              <div className="mrs-amount-row">
                <span className="mrs-amount" id="goal-mobile-headline-val">
                  {isFullyFunded ? 'Fully Funded' : formatINR(result.requiredMonthlySIP)}
                </span>
                {!isFullyFunded && (
                  <span className="mrs-compact">
                    approx. {formatIndianCompact(result.requiredMonthlySIP)} / mo
                  </span>
                )}
              </div>
            </div>

            <p className="mrs-scenario-caption">
              {isFullyFunded
                ? `Existing savings are sufficient to cover the estimated ${formatINR(result.futureGoalCost)} future milestone under these assumptions.`
                : `Targeting a net funding gap of ${formatINR(result.netFundingDeficit)} over ${yearsNum} years (${result.tenureMonths} monthly contributions).`}
            </p>
          </div>

          <div className="mrs-nav-actions">
            <button
              type="button"
              className="mrs-action-btn mrs-btn-adjust"
              onClick={() => {
                const inputEl = document.getElementById(`${baseId}-cost-num`);
                if (inputEl) {
                  inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  inputEl.focus();
                }
              }}
            >
              Adjust inputs &amp; assumptions ↓
            </button>
            <button
              type="button"
              className="mrs-action-btn mrs-btn-breakdown"
              onClick={() => {
                const resultsEl = document.getElementById('goal-summary-results');
                if (resultsEl) {
                  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              View full breakdown ↓
            </button>
          </div>
        </section>
      )}

      {/* Main Two-Column Connected Workbench Card */}
      <div className="goal-workbench-card">
        {/* Controls Column */}
        <div className="goal-controls-col">
          <div className="workbench-top-bar">
            <div>
              <span className="workbench-eyebrow">Milestone Workbench</span>
              <h3 className="workbench-title">Target Your Future Milestone</h3>
            </div>
            <div className="header-actions">
              <button
                type="button"
                id="load-goal-example-btn"
                onClick={handleLoadExample}
                className="btn-example-pill"
                title="Load illustrative 10-year milestone example"
              >
                Load illustrative example
              </button>
              {hasAnyEntered && (
                <button
                  type="button"
                  id="reset-goal-btn"
                  onClick={handleClearAll}
                  className="btn-reset-clean"
                  title="Clear all fields and start over"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <p className="workbench-intro">
            Estimate the future cost of one milestone and the monthly amount that could help fund the remaining gap.
          </p>

          {isExampleLoaded && (
            <div className="example-banner" role="status" id="goal-example-banner">
              <span className="banner-icon" aria-hidden="true">ℹ️</span>
              <span>Illustrative example loaded — these are not your figures.</span>
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()} className="goal-workbench-form">
            {/* Group 1: Goal Details */}
            <fieldset className="input-group-card">
              <legend className="group-legend">
                <span className="legend-num">1</span>
                <span>Goal Details</span>
              </legend>

              {/* Input 1: Goal Cost Today */}
              <div className="form-field-row">
                <div className="field-info">
                  <label htmlFor={`${baseId}-cost-num`} className="field-label">
                    Goal Cost in Today’s Rupees
                  </label>
                  <span className="field-hint">
                    Estimated cost in today’s money. It will be compounded for inflation over your timeline.
                  </span>
                </div>
                <div className="field-control">
                  <div className="input-with-symbol">
                    <span className="currency-prefix">₹</span>
                    <input
                      type="number"
                      id={`${baseId}-cost-num`}
                      value={inputs.costToday}
                      min={50000}
                      max={50000000}
                      step={25000}
                      placeholder="e.g. 2500000"
                      onChange={(e) => handleInputChange('costToday', e.target.value)}
                      className={`num-input ${showCostError ? 'input-error' : ''}`}
                      aria-describedby={`${baseId}-cost-help`}
                    />
                  </div>
                </div>
              </div>
              <div className="slider-wrapper">
                <input
                  type="range"
                  id={`${baseId}-cost-slider`}
                  value={sliderCostValue}
                  min={50000}
                  max={50000000}
                  step={25000}
                  onChange={(e) => handleInputChange('costToday', e.target.value)}
                  className="range-slider"
                  aria-label="Goal Cost Today Slider"
                />
                <div className="slider-ticks">
                  <span>₹50K</span>
                  <span>₹25 Lakh</span>
                  <span>₹1 Crore</span>
                  <span>₹5 Crore</span>
                </div>
              </div>
              {showCostError && (
                <p id={`${baseId}-cost-help`} className="field-error-msg" role="alert">
                  {costTrimmed === ''
                    ? 'Please enter the goal cost in today’s rupees.'
                    : 'Enter an amount between ₹50,000 and ₹5,00,00,000.'}
                </p>
              )}

              {/* Input 2: Years Horizon */}
              <div className="form-field-row">
                <div className="field-info">
                  <label htmlFor={`${baseId}-years-num`} className="field-label">
                    Years Until Milestone
                  </label>
                  <span className="field-hint">
                    Number of years until the money is needed (whole years from 1 to 35).
                  </span>
                </div>
                <div className="field-control">
                  <div className="input-with-symbol">
                    <input
                      type="number"
                      id={`${baseId}-years-num`}
                      value={inputs.yearsHorizon}
                      min={1}
                      max={35}
                      step={1}
                      placeholder="e.g. 10"
                      onChange={(e) => handleInputChange('yearsHorizon', e.target.value)}
                      className={`num-input ${showYearsError ? 'input-error' : ''}`}
                      aria-describedby={`${baseId}-years-help`}
                    />
                    <span className="unit-suffix">Yrs</span>
                  </div>
                </div>
              </div>
              <div className="slider-wrapper">
                <input
                  type="range"
                  id={`${baseId}-years-slider`}
                  value={sliderYearsValue}
                  min={1}
                  max={35}
                  step={1}
                  onChange={(e) => handleInputChange('yearsHorizon', e.target.value)}
                  className="range-slider"
                  aria-label="Time Horizon in Years Slider"
                />
                <div className="slider-ticks">
                  <span>1 Year</span>
                  <span>10 Years</span>
                  <span>20 Years</span>
                  <span>35 Years</span>
                </div>
              </div>
              {showYearsError && (
                <p id={`${baseId}-years-help`} className="field-error-msg" role="alert">
                  {yearsTrimmed === ''
                    ? 'Please enter years until the goal.'
                    : !Number.isInteger(yearsNum)
                    ? 'Time horizon must be a whole number of years (1 to 35).'
                    : 'Enter a duration between 1 and 35 years.'}
                </p>
              )}

              {/* Input 3: Existing Earmarked Savings */}
              <div className="form-field-row">
                <div className="field-info">
                  <label htmlFor={`${baseId}-savings-num`} className="field-label">
                    Existing Investments Earmarked for this Goal
                  </label>
                  <span className="field-hint">
                    Capital dedicated to this milestone. Assumed to remain invested and grow at your return rate.
                  </span>
                </div>
                <div className="field-control">
                  <div className="input-with-symbol">
                    <span className="currency-prefix">₹</span>
                    <input
                      type="number"
                      id={`${baseId}-savings-num`}
                      value={inputs.existingSavings}
                      min={0}
                      max={50000000}
                      step={25000}
                      placeholder="e.g. 200000"
                      onChange={(e) => handleInputChange('existingSavings', e.target.value)}
                      className={`num-input ${showSavingsError ? 'input-error' : ''}`}
                      aria-describedby={`${baseId}-savings-help`}
                    />
                  </div>
                </div>
              </div>
              <div className="slider-wrapper">
                <input
                  type="range"
                  id={`${baseId}-savings-slider`}
                  value={sliderSavingsValue}
                  min={0}
                  max={50000000}
                  step={25000}
                  onChange={(e) => handleInputChange('existingSavings', e.target.value)}
                  className="range-slider"
                  aria-label="Existing investments earmarked for this goal slider"
                />
                <div className="slider-ticks">
                  <span>₹0 (Start Fresh)</span>
                  <span>₹5 Lakh</span>
                  <span>₹25 Lakh</span>
                  <span>₹1 Crore</span>
                  <span>₹5 Crore</span>
                </div>
              </div>
              {showSavingsError && (
                <p id={`${baseId}-savings-help`} className="field-error-msg" role="alert">
                  {savingsTrimmed === ''
                    ? 'Please enter existing investments or 0.'
                    : 'Enter an amount between ₹0 and ₹5,00,00,000.'}
                </p>
              )}
            </fieldset>

            {/* Group 2: Planning Assumptions */}
            <fieldset className="input-group-card assumptions-card">
              <legend className="group-legend">
                <span className="legend-num">2</span>
                <span>Planning Assumptions</span>
              </legend>
              <p className="group-subtext">
                Cost inflation and investment return are independent user assumptions, not forecasts, promises, or recommendations.
              </p>

              {/* Input 4: Goal Inflation */}
              <div className="form-field-row">
                <div className="field-info">
                  <label htmlFor={`${baseId}-inflation-num`} className="field-label">
                    Assumed Annual Goal Inflation
                  </label>
                  <span className="field-hint">
                    Compounding rate of cost increase for this specific goal category.
                  </span>
                </div>
                <div className="field-control">
                  <div className="input-with-symbol">
                    <input
                      type="number"
                      id={`${baseId}-inflation-num`}
                      value={inputs.annualInflationPercent}
                      min={0}
                      max={25}
                      step={0.5}
                      placeholder="e.g. 8"
                      onChange={(e) => handleInputChange('annualInflationPercent', e.target.value)}
                      className={`num-input ${showInflationError ? 'input-error' : ''}`}
                      aria-describedby={`${baseId}-inflation-help`}
                    />
                    <span className="percent-suffix">%</span>
                  </div>
                </div>
              </div>
              <div className="slider-wrapper">
                <input
                  type="range"
                  id={`${baseId}-inflation-slider`}
                  value={sliderInflationValue}
                  min={0}
                  max={25}
                  step={0.5}
                  onChange={(e) => handleInputChange('annualInflationPercent', e.target.value)}
                  className="range-slider"
                  aria-label="Assumed Goal Inflation Slider"
                />
                <div className="slider-ticks">
                  <span>0%</span>
                  <span>6% (Illustrative)</span>
                  <span>8% (Illustrative)</span>
                  <span>15%</span>
                  <span>25%</span>
                </div>
              </div>
              {showInflationError && (
                <p id={`${baseId}-inflation-help`} className="field-error-msg" role="alert">
                  {inflationTrimmed === ''
                    ? 'Please enter an assumed inflation rate.'
                    : 'Enter an annual inflation rate between 0% and 25%.'}
                </p>
              )}

              {/* Input 5: Assumed Investment Return */}
              <div className="form-field-row">
                <div className="field-info">
                  <label htmlFor={`${baseId}-return-num`} className="field-label">
                    Assumed Investment Return (EAR)
                  </label>
                  <span className="field-hint">
                    Effective annual rate converted geometrically to beginning-of-month compounding.
                  </span>
                </div>
                <div className="field-control">
                  <div className="input-with-symbol">
                    <input
                      type="number"
                      id={`${baseId}-return-num`}
                      value={inputs.assumedAnnualReturnPercent}
                      min={0}
                      max={50}
                      step={0.5}
                      placeholder="e.g. 12"
                      onChange={(e) => handleInputChange('assumedAnnualReturnPercent', e.target.value)}
                      className={`num-input ${showReturnError ? 'input-error' : ''}`}
                      aria-describedby={`${baseId}-return-help`}
                    />
                    <span className="percent-suffix">%</span>
                  </div>
                </div>
              </div>
              <div className="slider-wrapper">
                <input
                  type="range"
                  id={`${baseId}-return-slider`}
                  value={sliderReturnValue}
                  min={0}
                  max={50}
                  step={0.5}
                  onChange={(e) => handleInputChange('assumedAnnualReturnPercent', e.target.value)}
                  className="range-slider"
                  aria-label="Assumed Investment Return Slider"
                />
                <div className="slider-ticks">
                  <span>0%</span>
                  <span>8% (Illustrative)</span>
                  <span>12% (Illustrative)</span>
                  <span>20%</span>
                  <span>50%</span>
                </div>
              </div>
              {showReturnError && (
                <p id={`${baseId}-return-help`} className="field-error-msg" role="alert">
                  {returnTrimmed === ''
                    ? 'Please enter an assumed investment return.'
                    : 'Enter an effective annual return between 0% and 50%.'}
                </p>
              )}
            </fieldset>
          </form>
        </div>

        {/* Results Column */}
        <div className="goal-results-col" id="goal-summary-results">
          <div className="results-top-row">
            <div>
              <span className="results-eyebrow">Funding Plan Summary</span>
              <h4 className="results-headline">Funding Plan Summary</h4>
            </div>
            {result && (
              <span className="results-status-badge">
                {isExampleLoaded ? 'Illustrative Result' : 'Live Calculation'}
              </span>
            )}
          </div>

          <div className="sr-only" aria-live="polite" aria-atomic="true" id="goal-live-announcement">
            {isValid && result
              ? isFullyFunded
                ? `Existing savings are sufficient to cover the estimated ${formatINR(result.futureGoalCost)} future milestone under these assumptions. Required monthly SIP is ₹0.`
                : `Goal plan updated. Estimated monthly SIP needed: ${formatINR(result.requiredMonthlySIP)}. Future goal cost: ${formatINR(result.futureGoalCost)}. Net funding gap: ${formatINR(result.netFundingDeficit)}.`
              : hasAnyEntered
              ? 'Please enter valid calculation inputs.'
              : 'Goal estimator ready. Enter figures or load illustrative example.'}
          </div>

          {isValid && result ? (
            <div className="results-active-container">
              {/* Hero Result Box */}
              <div className={`result-hero-box ${isFullyFunded ? 'hero-funded' : ''}`}>
                <span className="hero-eyebrow">
                  {isFullyFunded ? 'Goal Status' : 'Estimated Monthly SIP Needed'}
                </span>
                <div className="hero-val-row">
                  <span className="hero-val" id="goal-required-sip">
                    {isFullyFunded ? 'Fully Funded' : formatINR(result.requiredMonthlySIP)}
                  </span>
                  {!isFullyFunded && (
                    <span className="hero-compact">
                      approx. {formatIndianCompact(result.requiredMonthlySIP)} / mo
                    </span>
                  )}
                </div>
                <p className="hero-caption">
                  {isFullyFunded
                    ? `Existing earmarked savings are sufficient to cover the estimated ${formatINR(result.futureGoalCost)} future cost under these assumptions.`
                    : `Calculated estimate under the selected assumptions. Assumes monthly deposits for ${yearsNum} years (${result.tenureMonths} payments). Not a return guarantee or product recommendation.`}
                </p>
              </div>

              {/* 4-Card Milestone Breakdown Grid */}
              <div className="breakdown-grid">
                <div className="breakdown-card">
                  <span className="bc-label">Estimated Future Goal Cost</span>
                  <span className="bc-val text-brand" id="goal-future-cost">
                    {formatINR(result.futureGoalCost)}
                  </span>
                  <span className="bc-sub">
                    Includes +{formatINR(result.inflationImpactCost)} from {inflationNum}% assumed inflation
                  </span>
                </div>

                <div className="breakdown-card">
                  <span className="bc-label">Future Value of Savings</span>
                  <span className="bc-val text-brand" id="goal-savings-fv">
                    {formatINR(result.existingSavingsFutureValue)}
                  </span>
                  <span className="bc-sub">
                    From {formatINR(savingsNum)} capital at {returnNum}% assumed return
                  </span>
                </div>

                <div className="breakdown-card">
                  <span className="bc-label">Net Funding Gap (Deficit)</span>
                  <span className="bc-val text-highlight" id="goal-net-deficit">
                    {formatINR(result.netFundingDeficit)}
                  </span>
                  <span className="bc-sub">
                    {isFullyFunded
                      ? 'No additional capital needed under assumptions'
                      : 'Remaining target to accumulate via monthly SIPs'}
                  </span>
                </div>

                <div className="breakdown-card">
                  <span className="bc-label">Out-of-Pocket SIP Capital</span>
                  <span className="bc-val" id="goal-sip-contributions">
                    {formatINR(result.totalFreshSIPInvested)}
                  </span>
                  <span className="bc-sub">
                    +{formatINR(result.growthFromSIP)} growth from compounding
                  </span>
                </div>
              </div>

              {/* Structured Progressive Disclosures */}
              <details className="planner-disclosure">
                <summary className="disclosure-summary">
                  <span className="summary-icon">💡</span>
                  <span className="summary-text">How this estimate works</span>
                  <span className="toggle-indicator">▼</span>
                </summary>
                <div className="disclosure-body">
                  <ol className="step-list">
                    <li>
                      <strong>Inflation Adjustment:</strong> Today’s cost ({formatINR(costNum)}) is compounded over {yearsNum} years at your chosen {inflationNum}% annual inflation assumption: <code>Future Cost = Today Cost × (1 + r_inf)^t</code> = <strong>{formatINR(result.futureGoalCost)}</strong>.
                    </li>
                    {savingsNum > 0 && (
                      <li>
                        <strong>Existing Savings Growth:</strong> Current earmarked savings ({formatINR(savingsNum)}) grow at the assumed {returnNum}% annual return to <strong>{formatINR(result.existingSavingsFutureValue)}</strong>, directly reducing your funding requirement.
                      </li>
                    )}
                    <li>
                      <strong>Net Funding Gap:</strong> The remaining target to accumulate is <strong>{formatINR(result.netFundingDeficit)}</strong>.
                    </li>
                    {!isFullyFunded && (
                      <li>
                        <strong>Required Monthly SIP:</strong> Solved using geometric monthly rate conversion <code>(1 + r)^(1/12) - 1</code> with beginning-of-month timing. Out of {formatINR(result.netFundingDeficit)} needed, your deposits equal {formatINR(result.totalFreshSIPInvested)} and compounding growth provides {formatINR(result.growthFromSIP)}.
                      </li>
                    )}
                  </ol>
                </div>
              </details>

              <details className="planner-disclosure">
                <summary className="disclosure-summary">
                  <span className="summary-icon">⚠️</span>
                  <span className="summary-text">What this estimate does not include</span>
                  <span className="toggle-indicator">▼</span>
                </summary>
                <div className="disclosure-body">
                  <p className="disclosure-p">
                    This simulation is an educational mathematical scenario and does not account for income tax liabilities, capital gains tax, scheme expense ratios, exit loads, contribution interruptions, or market volatility.
                  </p>
                  <p className="disclosure-p">
                    Inflation and investment returns are independent user inputs and must not be interpreted as guaranteed outcomes, market forecasts, or financial advice.
                  </p>
                </div>
              </details>
            </div>
          ) : !hasAnyEntered ? (
            <div className="goal-empty-workbench" id="goal-empty-state">
              <div className="empty-icon-box" aria-hidden="true">🎯</div>
              <h5 className="empty-headline">Ready to Estimate Your Goal</h5>
              <p className="empty-explanation">
                Enter your target milestone cost, timeline, and earmarked savings on the left to calculate future expenses and your required monthly SIP.
              </p>
              <button
                type="button"
                onClick={handleLoadExample}
                className="btn-empty-load"
                id="cta-load-example"
              >
                Load illustrative example (₹25L in 10 Yrs) →
              </button>
            </div>
          ) : (
            <div className="goal-invalid-workbench">
              <span className="invalid-icon">⚠️</span>
              <p className="invalid-msg">Please provide valid calculation parameters to display milestone funding simulation.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .goal-workbench-wrapper {
          margin: var(--space-6) 0 var(--space-10) 0;
          font-family: var(--font-family-body, inherit);
        }

        /* Mobile Live Result Overview (<850px) */
        .mobile-result-summary {
          display: none;
          background: linear-gradient(135deg, var(--color-brand-primary, #173047) 0%, #102436 100%);
          color: #ffffff;
          border-radius: var(--radius-xl, 16px);
          padding: var(--space-5, 20px);
          margin-bottom: var(--space-6, 24px);
          box-shadow: 0 4px 12px rgba(23, 48, 71, 0.12);
        }

        @media (max-width: 899px) {
          .mobile-result-summary {
            display: block;
          }
        }

        .mrs-pill-row {
          display: flex;
          align-items: center;
          gap: var(--space-2, 8px);
          flex-wrap: wrap;
          margin-bottom: var(--space-3, 12px);
        }

        .mrs-tag {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: var(--radius-pill, 9999px);
        }

        .mrs-tag.tag-example {
          background-color: rgba(224, 159, 62, 0.25);
          color: var(--primitive-gold-400, #FBBF24);
          border: 1px solid rgba(224, 159, 62, 0.4);
        }

        .mrs-tag.tag-custom {
          background-color: rgba(207, 239, 227, 0.2);
          color: var(--primitive-teal-200, #A7F3D0);
          border: 1px solid rgba(207, 239, 227, 0.35);
        }

        .mrs-timing {
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.75);
        }

        .mrs-headline-block {
          margin-bottom: var(--space-2, 8px);
        }

        .mrs-headline-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 2px;
        }

        .mrs-amount-row {
          display: flex;
          align-items: baseline;
          gap: var(--space-3, 12px);
          flex-wrap: wrap;
        }

        .mrs-amount {
          font-size: 2rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }

        .mrs-compact {
          font-size: 0.95rem;
          color: var(--primitive-gold-400, #FBBF24);
          font-weight: 600;
        }

        .mrs-scenario-caption {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.82);
          line-height: 1.45;
          margin: 0 0 var(--space-4, 16px) 0;
        }

        .mrs-nav-actions {
          display: flex;
          gap: var(--space-2, 8px);
          flex-wrap: wrap;
        }

        .mrs-action-btn {
          flex: 1 1 140px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          font-size: 0.82rem;
          font-weight: 600;
          border-radius: var(--radius-md, 8px);
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          transition: background-color 0.15s ease;
          border: none;
        }

        .mrs-btn-adjust {
          background-color: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .mrs-btn-adjust:hover {
          background-color: rgba(255, 255, 255, 0.25);
        }

        .mrs-btn-breakdown {
          background-color: var(--primitive-gold-500, #e09f3e);
          color: #173047;
          font-weight: 700;
        }

        .mrs-btn-breakdown:hover {
          background-color: #d18f30;
        }

        /* Two-Column Connected Workbench */
        .goal-workbench-card {
          background-color: var(--color-bg-surface, #ffffff);
          border: 1px solid var(--color-border-subtle, #e2e8f0);
          border-radius: var(--radius-xl, 16px);
          box-shadow: var(--shadow-card, 0 4px 6px -1px rgba(0,0,0,0.05));
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6, 24px);
          padding: var(--space-5, 20px);
        }

        @media (min-width: 960px) {
          .goal-workbench-card {
            grid-template-columns: 1.15fr 1fr;
            padding: var(--space-8, 32px);
            gap: var(--space-8, 32px);
          }
        }

        /* Workbench Header */
        .workbench-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: var(--space-3, 12px);
          margin-bottom: var(--space-2, 8px);
        }

        .workbench-eyebrow {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-brand-accent, #0f766e);
          margin-bottom: 2px;
        }

        .workbench-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          margin: 0;
          letter-spacing: -0.02em;
        }

        .workbench-intro {
          font-size: 0.9rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.5;
          margin: 0 0 var(--space-4, 16px) 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-2, 8px);
        }

        .btn-example-pill {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--primitive-teal-700, #0f766e);
          background-color: var(--primitive-teal-50, #f0fdfa);
          border: 1px solid var(--primitive-teal-200, #99f6e4);
          border-radius: var(--radius-pill, 9999px);
          padding: 6px 12px;
          cursor: pointer;
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          transition: background-color 0.15s ease;
        }

        .btn-example-pill:hover {
          background-color: var(--primitive-teal-100, #ccfbf1);
        }

        .btn-reset-clean {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--color-text-muted, #64748b);
          background: none;
          border: none;
          padding: 6px 8px;
          cursor: pointer;
          text-decoration: underline;
          min-height: 36px;
        }

        .btn-reset-clean:hover {
          color: var(--color-brand-primary, #173047);
        }

        .example-banner {
          display: flex;
          align-items: center;
          gap: var(--space-2, 8px);
          background-color: var(--primitive-gold-50, #fef8ee);
          border: 1px solid var(--primitive-gold-100);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-2, 8px) var(--space-3, 12px);
          font-size: 0.82rem;
          color: var(--color-text-accent);
          margin-bottom: var(--space-4, 16px);
        }

        /* Input Groups */
        .input-group-card {
          border: 1px solid var(--color-border-subtle, #e2e8f0);
          border-radius: var(--radius-lg, 12px);
          padding: var(--space-4, 16px);
          margin-bottom: var(--space-5, 20px);
          background-color: #fafbfc;
        }

        .group-legend {
          display: flex;
          align-items: center;
          gap: var(--space-2, 8px);
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          padding: 0 var(--space-2, 8px);
        }

        .legend-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          background-color: var(--color-brand-accent, #0f766e);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: var(--radius-pill, 9999px);
        }

        .group-subtext {
          font-size: 0.8rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.45;
          margin: var(--space-2, 8px) 0 var(--space-4, 16px) 0;
        }

        .form-field-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: var(--space-3, 12px);
          margin-top: var(--space-3, 12px);
          margin-bottom: var(--space-2, 8px);
        }

        .field-info {
          flex: 1 1 200px;
        }

        .field-label {
          display: block;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 2px;
        }

        .field-hint {
          display: block;
          font-size: 0.78rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.4;
        }

        .field-control {
          flex: 0 0 auto;
        }

        .input-with-symbol {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .currency-prefix {
          position: absolute;
          left: 10px;
          font-weight: 600;
          color: var(--color-text-muted, #64748b);
          pointer-events: none;
        }

        .unit-suffix,
        .percent-suffix {
          position: absolute;
          right: 10px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--color-text-muted, #64748b);
          pointer-events: none;
        }

        .num-input {
          width: 140px;
          height: 40px;
          padding: 6px 12px;
          border: 1px solid var(--color-border-subtle, #cbd5e1);
          border-radius: var(--radius-md, 8px);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--color-text-primary);
          background-color: #ffffff;
          text-align: right;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .currency-prefix + .num-input {
          padding-left: 24px;
        }

        .num-input:has(+ .unit-suffix),
        .num-input:has(+ .percent-suffix) {
          padding-right: 30px;
        }

        .num-input:focus {
          outline: none;
          border-color: var(--color-brand-accent, #0f766e);
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
        }

        .num-input.input-error {
          border-color: #ef4444;
          background-color: #fef2f2;
        }

        .slider-wrapper {
          margin-bottom: var(--space-4, 16px);
        }

        .range-slider {
          width: 100%;
          height: 6px;
          border-radius: var(--radius-pill, 9999px);
          background: #e2e8f0;
          outline: none;
          cursor: pointer;
          margin: 8px 0;
          accent-color: var(--color-brand-accent, #0f766e);
        }

        .slider-ticks {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: var(--color-text-muted, #64748b);
        }

        .field-error-msg {
          font-size: 0.78rem;
          color: #dc2626;
          margin: -8px 0 var(--space-3, 12px) 0;
          font-weight: 500;
        }

        /* Results Column */
        .goal-results-col {
          display: flex;
          flex-direction: column;
          gap: var(--space-4, 16px);
        }

        .results-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: var(--space-2, 8px);
        }

        .results-eyebrow {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-brand-accent, #0f766e);
          margin-bottom: 2px;
        }

        .results-headline {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          margin: 0;
        }

        .results-status-badge {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--primitive-teal-700, #0f766e);
          background-color: var(--primitive-teal-50, #f0fdfa);
          border: 1px solid var(--primitive-teal-200, #99f6e4);
          border-radius: var(--radius-pill, 9999px);
          padding: 2px 8px;
        }

        /* Hero Result Box */
        .result-hero-box {
          background: linear-gradient(135deg, #173047 0%, #0d4646 100%);
          color: #ffffff;
          border-radius: var(--radius-xl, 16px);
          padding: var(--space-5, 20px);
          box-shadow: 0 4px 10px rgba(23, 48, 71, 0.1);
        }

        .result-hero-box.hero-funded {
          background: linear-gradient(135deg, #065f46 0%, #047857 100%);
        }

        .hero-eyebrow {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 4px;
        }

        .hero-val-row {
          display: flex;
          align-items: baseline;
          gap: var(--space-3, 12px);
          flex-wrap: wrap;
          margin-bottom: var(--space-2, 8px);
        }

        .hero-val {
          font-size: 2.2rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .hero-compact {
          font-size: 1rem;
          font-weight: 600;
          color: var(--primitive-gold-400, #FBBF24);
        }

        .hero-caption {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.82);
          line-height: 1.45;
          margin: 0;
        }

        /* 4-Card Breakdown Grid */
        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3, 12px);
        }

        @media (max-width: 599px) {
          .breakdown-grid {
            grid-template-columns: 1fr;
          }
        }

        .breakdown-card {
          background-color: var(--color-bg-canvas, #f8fafc);
          border: 1px solid var(--color-border-subtle, #e2e8f0);
          border-radius: var(--radius-lg, 12px);
          padding: var(--space-3, 12px) var(--space-4, 16px);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .bc-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-muted, #64748b);
        }

        .bc-val {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
        }

        .bc-val.text-highlight {
          color: var(--primitive-gold-600, #d97706);
        }

        .bc-sub {
          font-size: 0.72rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.35;
        }

        /* Progressive Disclosures */
        .planner-disclosure {
          background-color: #ffffff;
          border: 1px solid var(--color-border-subtle, #e2e8f0);
          border-radius: var(--radius-md, 8px);
          overflow: hidden;
        }

        .disclosure-summary {
          display: flex;
          align-items: center;
          gap: var(--space-2, 8px);
          padding: var(--space-3, 12px) var(--space-4, 16px);
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-brand-primary, #173047);
          user-select: none;
          list-style: none;
        }

        .disclosure-summary::-webkit-details-marker {
          display: none;
        }

        .summary-icon {
          font-size: 0.95rem;
        }

        .summary-text {
          flex: 1;
        }

        .toggle-indicator {
          font-size: 0.65rem;
          color: var(--color-text-muted, #64748b);
          transition: transform 0.2s ease;
        }

        .planner-disclosure[open] .toggle-indicator {
          transform: rotate(180deg);
        }

        .disclosure-body {
          padding: var(--space-3, 12px) var(--space-4, 16px) var(--space-4, 16px) var(--space-4, 16px);
          border-top: 1px solid var(--color-border-subtle, #f1f5f9);
          font-size: 0.8rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.5;
        }

        .step-list {
          padding-left: var(--space-4, 16px);
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 8px);
        }

        .step-list code {
          background-color: #f1f5f9;
          padding: 1px 4px;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .disclosure-p {
          margin: 0 0 var(--space-2, 8px) 0;
        }

        .disclosure-p:last-child {
          margin-bottom: 0;
        }

        /* Empty & Invalid States */
        .goal-empty-workbench {
          background-color: var(--color-bg-canvas, #f8fafc);
          border: 1px dashed var(--color-border-subtle, #cbd5e1);
          border-radius: var(--radius-xl, 16px);
          padding: var(--space-8, 32px) var(--space-5, 20px);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3, 12px);
        }

        .empty-icon-box {
          font-size: 2.2rem;
        }

        .empty-headline {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          margin: 0;
        }

        .empty-explanation {
          font-size: 0.85rem;
          color: var(--color-text-muted, #64748b);
          max-width: 320px;
          line-height: 1.5;
          margin: 0;
        }

        .btn-empty-load {
          margin-top: var(--space-2, 8px);
          background-color: var(--color-brand-accent, #0f766e);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-md, 8px);
          padding: 10px 18px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease;
        }

        .btn-empty-load:hover {
          background-color: #0d655f;
        }

        .goal-invalid-workbench {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: var(--radius-lg, 12px);
          padding: var(--space-4, 16px);
          display: flex;
          align-items: center;
          gap: var(--space-3, 12px);
          color: #991b1b;
          font-size: 0.85rem;
        }

        .invalid-msg {
          margin: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .mrs-action-btn,
          .btn-example-pill,
          .btn-empty-load,
          .toggle-indicator {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
