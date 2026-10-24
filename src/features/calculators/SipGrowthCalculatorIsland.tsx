import React, { useState, useMemo } from 'react';
import {
  calculateSIPGrowth,
  type SipGrowthResult,
  type SipGrowthLumpSumEntry,
} from '../../domain/finance/sipGrowth';
import { formatINR, formatIndianCompact, formatPercentage } from '../../lib/formatters';

interface LumpSumUIItem {
  id: string;
  year: string;
  amount: string;
  label: string;
}

interface FormInputs {
  monthlySIP: string;
  sipDurationYears: string;
  annualReturnPercent: string;
  stepUpPercent: string;
  stepUpDurationYears: string;
  postSipYears: string;
}

const DEFAULT_INPUTS: FormInputs = {
  monthlySIP: '10000',
  sipDurationYears: '10',
  annualReturnPercent: '12',
  stepUpPercent: '10',
  stepUpDurationYears: '5',
  postSipYears: '5',
};

const DEFAULT_LUMP_SUMS: LumpSumUIItem[] = [
  { id: 'ls-default-1', year: '3', amount: '100000', label: 'Bonus / Incentive' },
];

export default function SipGrowthCalculatorIsland(): React.JSX.Element {
  const [inputs, setInputs] = useState<FormInputs>(DEFAULT_INPUTS);
  const [lumpSums, setLumpSums] = useState<LumpSumUIItem[]>(DEFAULT_LUMP_SUMS);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Parsing & validation
  const monthlyTrimmed = inputs.monthlySIP.trim();
  const sipYearsTrimmed = inputs.sipDurationYears.trim();
  const returnTrimmed = inputs.annualReturnPercent.trim();
  const stepUpTrimmed = inputs.stepUpPercent.trim();
  const stepUpDurationTrimmed = inputs.stepUpDurationYears.trim();
  const postSipTrimmed = inputs.postSipYears.trim();

  const monthlyNum = monthlyTrimmed === '' ? NaN : Number(monthlyTrimmed);
  const sipYearsNum = sipYearsTrimmed === '' ? NaN : Number(sipYearsTrimmed);
  const returnNum = returnTrimmed === '' ? NaN : Number(returnTrimmed);
  const stepUpNum = stepUpTrimmed === '' ? NaN : Number(stepUpTrimmed);
  const stepUpDurationNum = stepUpDurationTrimmed === '' ? NaN : Number(stepUpDurationTrimmed);
  const postSipNum = postSipTrimmed === '' ? NaN : Number(postSipTrimmed);

  // Bounds checking
  const isMonthlyValid =
    monthlyTrimmed !== '' &&
    Number.isFinite(monthlyNum) &&
    monthlyNum >= 0 &&
    monthlyNum <= 1000000;

  const isSipYearsValid =
    sipYearsTrimmed !== '' &&
    Number.isFinite(sipYearsNum) &&
    Number.isInteger(sipYearsNum) &&
    sipYearsNum >= 1 &&
    sipYearsNum <= 40;

  const isReturnValid =
    returnTrimmed !== '' &&
    Number.isFinite(returnNum) &&
    returnNum >= 0 &&
    returnNum <= 50;

  const isStepUpValid =
    stepUpTrimmed !== '' &&
    Number.isFinite(stepUpNum) &&
    stepUpNum >= 0 &&
    stepUpNum <= 50;

  const maxStepUpDuration = isSipYearsValid ? sipYearsNum : 40;
  const isStepUpDurationValid =
    stepUpDurationTrimmed !== '' &&
    Number.isFinite(stepUpDurationNum) &&
    Number.isInteger(stepUpDurationNum) &&
    stepUpDurationNum >= 1 &&
    stepUpDurationNum <= maxStepUpDuration;

  const isPostSipValid =
    postSipTrimmed !== '' &&
    Number.isFinite(postSipNum) &&
    Number.isInteger(postSipNum) &&
    postSipNum >= 0 &&
    postSipNum <= 30;

  const totalProjectionYears =
    (Number.isFinite(sipYearsNum) && sipYearsNum >= 1 ? sipYearsNum : 10) +
    (Number.isFinite(postSipNum) && postSipNum >= 0 ? postSipNum : 0);

  // Validate lump sum rows
  let areLumpSumsValid = true;
  const parsedLumpSums: SipGrowthLumpSumEntry[] = [];
  let totalLumpSumAmount = 0;

  for (const ls of lumpSums) {
    const amtTrimmed = ls.amount.trim();
    const yrTrimmed = ls.year.trim();
    const amtNum = amtTrimmed === '' ? NaN : Number(amtTrimmed);
    const yrNum = yrTrimmed === '' ? NaN : Number(yrTrimmed);

    if (
      amtTrimmed === '' ||
      !Number.isFinite(amtNum) ||
      amtNum <= 0 ||
      yrTrimmed === '' ||
      !Number.isFinite(yrNum) ||
      !Number.isInteger(yrNum) ||
      yrNum < 1 ||
      yrNum > totalProjectionYears
    ) {
      areLumpSumsValid = false;
      break;
    }

    parsedLumpSums.push({
      id: ls.id,
      year: yrNum,
      amount: amtNum,
      label: ls.label.trim() || undefined,
    });
    totalLumpSumAmount += amtNum;
  }

  const hasContribution = (Number.isFinite(monthlyNum) && monthlyNum > 0) || totalLumpSumAmount > 0;

  const isValid =
    isMonthlyValid &&
    isSipYearsValid &&
    isReturnValid &&
    isStepUpValid &&
    isStepUpDurationValid &&
    isPostSipValid &&
    areLumpSumsValid &&
    hasContribution;

  // Primary calculation using authoritative domain engine
  const result: SipGrowthResult | null = useMemo(() => {
    if (!isValid) return null;
    try {
      return calculateSIPGrowth({
        monthlySIP: monthlyNum,
        sipDurationYears: sipYearsNum,
        stepUpPercent: stepUpNum,
        stepUpDurationYears: stepUpDurationNum,
        annualReturnPercent: returnNum,
        postSipYears: postSipNum,
        lumpSums: parsedLumpSums,
      });
    } catch {
      return null;
    }
  }, [
    isValid,
    monthlyNum,
    sipYearsNum,
    stepUpNum,
    stepUpDurationNum,
    returnNum,
    postSipNum,
    parsedLumpSums,
  ]);

  // Baseline scenario comparison without step-up
  const baselineResult: SipGrowthResult | null = useMemo(() => {
    if (!isValid || stepUpNum <= 0) return null;
    try {
      return calculateSIPGrowth({
        monthlySIP: monthlyNum,
        sipDurationYears: sipYearsNum,
        stepUpPercent: 0,
        stepUpDurationYears: sipYearsNum,
        annualReturnPercent: returnNum,
        postSipYears: postSipNum,
        lumpSums: parsedLumpSums,
      });
    } catch {
      return null;
    }
  }, [
    isValid,
    stepUpNum,
    monthlyNum,
    sipYearsNum,
    returnNum,
    postSipNum,
    parsedLumpSums,
  ]);

  // Handlers
  const handleInputChange = (field: keyof FormInputs, val: string): void => {
    setIsCustom(true);
    setInputs((prev) => {
      const next = { ...prev, [field]: val };
      // If SIP duration shrinks, ensure stepUpDuration doesn't exceed it
      if (field === 'sipDurationYears') {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed >= 1) {
          const curCap = parseInt(prev.stepUpDurationYears, 10);
          if (!isNaN(curCap) && curCap > parsed) {
            next.stepUpDurationYears = String(parsed);
          }
        }
      }
      return next;
    });
  };

  const handleReset = (): void => {
    setInputs(DEFAULT_INPUTS);
    setLumpSums(DEFAULT_LUMP_SUMS);
    setShowAdvanced(false);
    setShowSchedule(false);
    setIsCustom(false);
  };

  const handleAddLumpSum = (): void => {
    setIsCustom(true);
    const nextYear = Math.min(totalProjectionYears, Math.max(1, (lumpSums.length + 1) * 2));
    const newItem: LumpSumUIItem = {
      id: `ls-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      year: String(nextYear),
      amount: '50000',
      label: 'One-Time Addition',
    };
    setLumpSums([...lumpSums, newItem]);
  };

  const handleRemoveLumpSum = (id: string): void => {
    setIsCustom(true);
    setLumpSums(lumpSums.filter((item) => item.id !== id));
  };

  const handleLumpSumChange = (id: string, field: keyof LumpSumUIItem, value: string): void => {
    setIsCustom(true);
    setLumpSums(
      lumpSums.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const investedPercent =
    result && result.finalCorpus > 0
      ? Math.min(100, Math.max(0, (result.totalInvested / result.finalCorpus) * 100))
      : 0;
  const growthPercent =
    result && result.finalCorpus > 0
      ? Math.max(0, 100 - investedPercent)
      : 0;

  // Sliders bounded values
  const sliderMonthlyValue = Number.isFinite(monthlyNum)
    ? Math.min(1000000, Math.max(0, monthlyNum))
    : 0;
  const sliderSipYearsValue =
    Number.isFinite(sipYearsNum) && Number.isInteger(sipYearsNum)
      ? Math.min(40, Math.max(1, sipYearsNum))
      : 1;
  const sliderReturnValue = Number.isFinite(returnNum)
    ? Math.min(50, Math.max(0, returnNum))
    : 0;
  const sliderStepUpValue = Number.isFinite(stepUpNum)
    ? Math.min(50, Math.max(0, stepUpNum))
    : 0;
  const sliderStepUpDurationValue =
    Number.isFinite(stepUpDurationNum) && Number.isInteger(stepUpDurationNum)
      ? Math.min(maxStepUpDuration, Math.max(1, stepUpDurationNum))
      : 1;
  const sliderPostSipValue =
    Number.isFinite(postSipNum) && Number.isInteger(postSipNum)
      ? Math.min(30, Math.max(0, postSipNum))
      : 0;

  const scrollToSection = (id: string, focusId?: string): void => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (focusId) {
      const target = document.getElementById(focusId);
      if (target) {
        target.focus();
      }
    }
  };

  return (
    <div className="sip-growth-workbench-wrapper" id="sip-growth-calculator-app">
      {/* Mobile Live Result Summary (< 850px) */}
      <div className="mobile-result-summary" id="sip-growth-mobile-summary" aria-label="Quick Investment Result">
        <div className="mobile-summary-header">
          <span className="mobile-summary-tag">
            {isCustom ? 'Custom scenario active' : 'Illustrative example'}
          </span>
          <span className="mobile-summary-subtitle">Estimated Future Value</span>
        </div>

        <div className="mobile-summary-main">
          {isValid && result ? (
            <>
              <div className="mobile-summary-value" id="sip-growth-mobile-headline-val">
                {formatINR(result.finalCorpus)}
              </div>
              <div className="mobile-summary-compact">
                approx. {formatIndianCompact(result.finalCorpus)} across {result.totalProjectionYears} Total Years
              </div>
              <div className="mobile-summary-pills">
                <span className="mobile-pill">
                  Invested: {formatIndianCompact(result.totalInvested)}
                </span>
                <span className="mobile-pill highlight">
                  Growth: {formatIndianCompact(result.totalGrowth)}
                </span>
              </div>
            </>
          ) : (
            <div className="mobile-summary-unavailable">
              <span>Simulation inputs need review</span>
            </div>
          )}
        </div>

        <div className="mobile-summary-actions">
          <button
            type="button"
            className="mobile-action-btn primary"
            onClick={() => scrollToSection('growth-monthly-num', 'growth-monthly-num')}
          >
            Adjust assumptions ↓
          </button>
          <button
            type="button"
            className="mobile-action-btn secondary"
            onClick={() => scrollToSection('sip-growth-desktop-results')}
          >
            View full breakdown ↓
          </button>
        </div>
      </div>

      {/* Illustrative Notice Banner */}
      <div className={`workbench-notice-banner ${isCustom ? 'state-custom' : 'state-example'}`}>
        <div className="notice-content">
          <span className="notice-icon" aria-hidden="true">{isCustom ? '⚡' : 'ℹ️'}</span>
          <div className="notice-text-block">
            <span className="notice-title">
              {isCustom ? 'Custom scenario active' : 'Illustrative example — not your figures'}
            </span>
            <p className="notice-desc">
              {isCustom
                ? 'Calculations update live with your inputs. These projections illustrate compounding mathematics and are not performance guarantees.'
                : 'Showing a starting scenario with ₹10,000/mo, 10% annual step-up for 5 years, one ₹1 Lakh top-up in Year 3, and 5-year post-SIP compounding at an assumed 12% return.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          id="reset-sip-growth-btn"
          onClick={handleReset}
          className="reset-scenario-btn"
          title="Restore standard illustrative values"
        >
          Reset example
        </button>
      </div>

      {/* Connected Two-Column Workbench Layout */}
      <div className="workbench-grid">
        {/* Left Column: Form Controls (1.08fr) */}
        <div className="controls-column">
          <form onSubmit={(e) => e.preventDefault()} className="calculator-form">
            <h2 className="controls-section-heading">Core Investment Assumptions</h2>
            <p className="controls-section-sub">Start with your core recurring commitment. Reveal advanced options when ready.</p>

            {/* 1. Monthly SIP Amount */}
            <div className="input-group">
              <div className="input-header-row">
                <label htmlFor="growth-monthly-num" className="field-label">
                  Starting Monthly SIP
                </label>
                <div className="currency-field">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    id="growth-monthly-num"
                    value={inputs.monthlySIP}
                    min={0}
                    max={1000000}
                    step={500}
                    onChange={(e) => handleInputChange('monthlySIP', e.target.value)}
                    className={`number-input ${!isMonthlyValid ? 'input-error' : ''}`}
                    aria-describedby="growth-monthly-error"
                  />
                </div>
              </div>
              <input
                type="range"
                id="growth-monthly-slider"
                value={sliderMonthlyValue}
                min={0}
                max={1000000}
                step={500}
                onChange={(e) => handleInputChange('monthlySIP', e.target.value)}
                className="range-slider"
                aria-label="Starting Monthly SIP Amount Slider"
              />
              <div className="slider-bounds">
                <span>₹0 (Lump Sums Only)</span>
                <span>₹10,00,000</span>
              </div>
              {!isMonthlyValid && (
                <span id="growth-monthly-error" className="inline-error" role="alert">
                  {monthlyTrimmed === ''
                    ? 'Enter a starting monthly installment (or 0 if investing via lump sums only).'
                    : 'Monthly amount must be between ₹0 and ₹10,00,000.'}
                </span>
              )}
            </div>

            {/* 2. SIP Duration */}
            <div className="input-group">
              <div className="input-header-row">
                <label htmlFor="growth-sipyears-num" className="field-label">
                  SIP Contribution Duration
                </label>
                <div className="unit-field">
                  <input
                    type="number"
                    id="growth-sipyears-num"
                    value={inputs.sipDurationYears}
                    min={1}
                    max={40}
                    step={1}
                    onChange={(e) => handleInputChange('sipDurationYears', e.target.value)}
                    className={`number-input ${!isSipYearsValid ? 'input-error' : ''}`}
                    aria-describedby="growth-sipyears-error"
                  />
                  <span className="unit-suffix">Yrs</span>
                </div>
              </div>
              <input
                type="range"
                id="growth-sipyears-slider"
                value={sliderSipYearsValue}
                min={1}
                max={40}
                step={1}
                onChange={(e) => handleInputChange('sipDurationYears', e.target.value)}
                className="range-slider"
                aria-label="SIP Contribution Duration Slider"
              />
              <div className="slider-bounds">
                <span>1 Year</span>
                <span>40 Years</span>
              </div>
              {!isSipYearsValid && (
                <span id="growth-sipyears-error" className="inline-error" role="alert">
                  {sipYearsTrimmed === ''
                    ? 'Please enter SIP contribution duration in whole years.'
                    : 'Duration must be between 1 and 40 whole years.'}
                </span>
              )}
            </div>

            {/* 3. Assumed Annual Return */}
            <div className="input-group">
              <div className="input-header-row">
                <label htmlFor="growth-return-num" className="field-label">
                  Assumed Annual Return
                </label>
                <div className="unit-field">
                  <input
                    type="number"
                    id="growth-return-num"
                    value={inputs.annualReturnPercent}
                    min={0}
                    max={50}
                    step={0.5}
                    onChange={(e) => handleInputChange('annualReturnPercent', e.target.value)}
                    className={`number-input ${!isReturnValid ? 'input-error' : ''}`}
                    aria-describedby="growth-return-hint"
                  />
                  <span className="unit-suffix">%</span>
                </div>
              </div>
              <input
                type="range"
                id="growth-return-slider"
                value={sliderReturnValue}
                min={0}
                max={50}
                step={0.5}
                onChange={(e) => handleInputChange('annualReturnPercent', e.target.value)}
                className="range-slider"
                aria-label="Assumed Annual Return Rate Slider"
              />
              <div className="slider-bounds">
                <span>0% (No Growth)</span>
                <span>50%</span>
              </div>
              <span id="growth-return-hint" className="field-helper-text">
                {returnNum === 0
                  ? 'At 0% return, your final corpus equals your exact total contributions.'
                  : 'Effective Annual Rate (EAR) converted geometrically to monthly compounding. Hypothetical illustration, not a forecast.'}
              </span>
              {!isReturnValid && (
                <span className="inline-error" role="alert">
                  {returnTrimmed === ''
                    ? 'Please enter an assumed annual return.'
                    : 'Enter an assumed return between 0% and 50%.'}
                </span>
              )}
            </div>

            {/* Progressive Disclosure: Advanced Options */}
            <div className="advanced-options-wrapper">
              <button
                type="button"
                id="toggle-advanced-options-btn"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="btn-toggle-advanced"
                aria-expanded={showAdvanced}
                aria-controls="advanced-options-container"
              >
                <span>{showAdvanced ? '▲ Hide advanced options' : '▼ Add advanced options (Annual step-up, one-time top-ups, holding period)'}</span>
                <span className="toggle-pill">{showAdvanced ? 'Collapse' : 'Expand'}</span>
              </button>

              {showAdvanced && (
                <div className="advanced-options-panel" id="advanced-options-container">
                  <div className="advanced-intro">
                    <h3 className="advanced-title">Multi-Stage Compounding Features</h3>
                    <p className="advanced-sub">
                      Model real-life salary increments, bonuses, and allowing your money to compound after contributions stop.
                    </p>
                  </div>

                  {/* 4. Annual Step-Up & Cap Duration Grid */}
                  <div className="stepup-grid">
                    {/* Step-Up % */}
                    <div className="input-group">
                      <div className="input-header-row">
                        <label htmlFor="growth-stepup-num" className="field-label-sm">
                          Annual Step-Up
                        </label>
                        <div className="unit-field-sm">
                          <input
                            type="number"
                            id="growth-stepup-num"
                            value={inputs.stepUpPercent}
                            min={0}
                            max={50}
                            step={1}
                            onChange={(e) => handleInputChange('stepUpPercent', e.target.value)}
                            className={`number-input-sm ${!isStepUpValid ? 'input-error' : ''}`}
                            aria-describedby="growth-stepup-help"
                          />
                          <span className="unit-suffix">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        id="growth-stepup-slider"
                        value={sliderStepUpValue}
                        min={0}
                        max={50}
                        step={1}
                        onChange={(e) => handleInputChange('stepUpPercent', e.target.value)}
                        className="range-slider"
                        aria-label="Annual Step-Up Percentage Slider"
                      />
                      <div className="slider-bounds">
                        <span>0%</span>
                        <span>50%</span>
                      </div>
                    </div>

                    {/* Step-Up Cap Duration */}
                    <div className="input-group">
                      <div className="input-header-row">
                        <label htmlFor="growth-stepupdur-num" className="field-label-sm">
                          Step-Up Limit (Cap Year)
                        </label>
                        <div className="unit-field-sm">
                          <input
                            type="number"
                            id="growth-stepupdur-num"
                            value={inputs.stepUpDurationYears}
                            min={1}
                            max={maxStepUpDuration}
                            step={1}
                            onChange={(e) => handleInputChange('stepUpDurationYears', e.target.value)}
                            className={`number-input-sm ${!isStepUpDurationValid ? 'input-error' : ''}`}
                            aria-describedby="growth-stepup-help"
                          />
                          <span className="unit-suffix">Yrs</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        id="growth-stepupdur-slider"
                        value={sliderStepUpDurationValue}
                        min={1}
                        max={maxStepUpDuration}
                        step={1}
                        onChange={(e) => handleInputChange('stepUpDurationYears', e.target.value)}
                        className="range-slider"
                        aria-label="Step-Up Cap Duration Slider"
                      />
                      <div className="slider-bounds">
                        <span>1 Year</span>
                        <span>{maxStepUpDuration} Yrs (Full SIP)</span>
                      </div>
                    </div>
                  </div>

                  <span id="growth-stepup-help" className="field-helper-text">
                    {stepUpNum > 0
                      ? `First increase applies in Year 2 (Month 13). Annual increases stop after Year ${stepUpDurationNum}; installments remain at that capped amount for the remaining ${Math.max(0, sipYearsNum - stepUpDurationNum)} SIP years.`
                      : 'Fixed contributions throughout the SIP duration with no annual increases.'}
                  </span>
                  {!isStepUpDurationValid && (
                    <span className="inline-error" role="alert">
                      Step-up cap duration cannot exceed SIP duration ({sipYearsNum} yrs).
                    </span>
                  )}

                  {/* 5. One-Time Additions Section */}
                  <div className="lumpsum-manager-card">
                    <div className="lumpsum-manager-header">
                      <div>
                        <h4 className="lumpsum-manager-title">One-Time Capital Top-Ups</h4>
                        <p className="lumpsum-manager-sub">
                          Incorporate annual incentives, matured deposits, or occasional surpluses at the start of specific projection years (Years 1 to {totalProjectionYears}).
                        </p>
                      </div>
                      <button
                        type="button"
                        id="add-lumpsum-row-btn"
                        onClick={handleAddLumpSum}
                        className="btn-add-lump"
                      >
                        + Add One-Time Investment
                      </button>
                    </div>

                    {lumpSums.length === 0 ? (
                      <div className="empty-lumpsums-box">
                        <span className="empty-icon" aria-hidden="true">💡</span>
                        <p className="empty-text">
                          No one-time capital additions scheduled. Click <strong>+ Add One-Time Investment</strong> to schedule occasional milestone top-ups alongside your recurring SIP.
                        </p>
                      </div>
                    ) : (
                      <div className="lumpsums-list">
                        {lumpSums.map((ls, idx) => {
                          const amtNum = Number(ls.amount);
                          const yrNum = Number(ls.year);
                          const isAmtValid = ls.amount.trim() !== '' && Number.isFinite(amtNum) && amtNum > 0;
                          const isYrValid =
                            ls.year.trim() !== '' &&
                            Number.isFinite(yrNum) &&
                            Number.isInteger(yrNum) &&
                            yrNum >= 1 &&
                            yrNum <= totalProjectionYears;

                          return (
                            <div key={ls.id} className="lumpsum-row-card">
                              <div className="row-fields">
                                <div className="field-year">
                                  <label htmlFor={`ls-year-${ls.id}`} className="mini-label">
                                    Projection Year
                                  </label>
                                  <select
                                    id={`ls-year-${ls.id}`}
                                    value={ls.year}
                                    onChange={(e) => handleLumpSumChange(ls.id, 'year', e.target.value)}
                                    className={`select-input ${!isYrValid ? 'input-error' : ''}`}
                                  >
                                    {Array.from({ length: totalProjectionYears }, (_, i) => i + 1).map((y) => (
                                      <option key={y} value={String(y)}>
                                        Year {y} {y > sipYearsNum ? '(Holding Period)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="field-amount">
                                  <label htmlFor={`ls-amount-${ls.id}`} className="mini-label">
                                    Amount (₹)
                                  </label>
                                  <input
                                    type="number"
                                    id={`ls-amount-${ls.id}`}
                                    value={ls.amount}
                                    min={1000}
                                    step={5000}
                                    placeholder="50,000"
                                    onChange={(e) => handleLumpSumChange(ls.id, 'amount', e.target.value)}
                                    className={`num-input-row ${!isAmtValid ? 'input-error' : ''}`}
                                  />
                                </div>

                                <div className="field-purpose">
                                  <label htmlFor={`ls-label-${ls.id}`} className="mini-label">
                                    Purpose (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    id={`ls-label-${ls.id}`}
                                    value={ls.label}
                                    placeholder="e.g. Annual Bonus"
                                    onChange={(e) => handleLumpSumChange(ls.id, 'label', e.target.value)}
                                    className="text-input-row"
                                  />
                                </div>

                                <div className="field-remove">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLumpSum(ls.id)}
                                    className="btn-remove-row"
                                    title="Remove this addition"
                                    aria-label={`Remove one-time investment ${idx + 1}`}
                                  >
                                    × Remove
                                  </button>
                                </div>
                              </div>

                              {(!isAmtValid || !isYrValid) && (
                                <span className="inline-error row-error">
                                  {!isAmtValid
                                    ? 'Enter a positive top-up amount (> ₹0).'
                                    : `Year must be within 1 and total projection horizon (${totalProjectionYears} yrs).`}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <p className="timing-notice">
                      <strong>Timing Convention:</strong> Each one-time investment is assumed to be added at the <em>beginning</em> of the selected projection year (Month <code>(y - 1) × 12 + 1</code>). Lump sums scheduled in post-SIP holding years continue compounding even though recurring monthly contributions have stopped.
                    </p>
                  </div>

                  {/* 6. Post-SIP Holding Period */}
                  <div className="input-group">
                    <div className="input-header-row">
                      <label htmlFor="growth-postsip-num" className="field-label-sm">
                        Post-SIP Holding Period
                      </label>
                      <div className="unit-field-sm">
                        <input
                          type="number"
                          id="growth-postsip-num"
                          value={inputs.postSipYears}
                          min={0}
                          max={30}
                          step={1}
                          onChange={(e) => handleInputChange('postSipYears', e.target.value)}
                          className={`number-input-sm ${!isPostSipValid ? 'input-error' : ''}`}
                          aria-describedby="growth-postsip-hint"
                        />
                        <span className="unit-suffix">Yrs</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      id="growth-postsip-slider"
                      value={sliderPostSipValue}
                      min={0}
                      max={30}
                      step={1}
                      onChange={(e) => handleInputChange('postSipYears', e.target.value)}
                      className="range-slider"
                      aria-label="Post-SIP Holding Period Slider"
                    />
                    <div className="slider-bounds">
                      <span>0 Yrs (Withdraw at SIP end)</span>
                      <span>30 Years</span>
                    </div>
                    <span id="growth-postsip-hint" className="field-helper-text">
                      {postSipNum > 0
                        ? `During these ${postSipNum} years, no new monthly SIP contributions are added; the existing accumulated corpus continues monthly compounding under the assumed ${returnNum}% return.`
                        : 'Corpus evaluated immediately when monthly contributions finish.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: High-Contrast Results Panel (0.92fr) */}
        <div className="results-column" id="sip-growth-desktop-results">
          <div className="sr-only" aria-live="polite" aria-atomic="true" id="sip-growth-live-announcement">
            {isValid && result
              ? `Advanced SIP growth calculation updated. Estimated final corpus: ${formatINR(result.finalCorpus)}. Total invested: ${formatINR(result.totalInvested)}. Estimated wealth growth: ${formatINR(result.totalGrowth)} across ${result.totalProjectionYears} years.`
              : 'Please enter valid simulation parameters.'}
          </div>

          <div className="result-card">
            {isValid && result ? (
              <>
                <div className="result-header">
                  <span className="result-category-badge">Projection Result</span>
                  <h3 className="result-primary-title">Estimated Future Value</h3>
                  <div className="result-headline-number" id="growth-final-corpus">
                    {formatINR(result.finalCorpus)}
                  </div>
                  <div className="result-compact-subtitle">
                    approx. {formatIndianCompact(result.finalCorpus)} under selected assumptions
                  </div>
                  <div className="horizon-pill">
                    {result.sipDurationYears}y Active SIP + {result.postSipYears}y Post-SIP Holding ({result.totalProjectionYears}y Total)
                  </div>
                </div>

                {/* 3-Card Metrics Grid */}
                <div className="metrics-grid">
                  <div className="metric-cell">
                    <span className="metric-label">Total Capital Contributed</span>
                    <div className="metric-figure" id="growth-total-invested">
                      {formatINR(result.totalInvested)}
                    </div>
                    <span className="metric-sub">
                      {formatIndianCompact(result.totalSIPInvested)} SIP + {formatIndianCompact(result.totalLumpSumsInvested)} Lump Sum
                    </span>
                  </div>

                  <div className="metric-cell highlight-cell">
                    <span className="metric-label">Illustrative Growth</span>
                    <div className="metric-figure highlight-text" id="growth-total-gain">
                      {formatINR(result.totalGrowth)}
                    </div>
                    <span className="metric-sub">
                      approx. {formatIndianCompact(result.totalGrowth)} via compounding
                    </span>
                  </div>

                  <div className="metric-cell">
                    <span className="metric-label">Wealth Multiplier</span>
                    <div className="metric-figure" id="growth-multiplier">
                      {(result.finalCorpus / Math.max(1, result.totalInvested)).toFixed(2)}x
                    </div>
                    <span className="metric-sub">
                      final value vs principal
                    </span>
                  </div>
                </div>

                {/* Visual Proportion Bar */}
                <div className="proportion-section" aria-label="Ratio of Contributed Capital to Compounded Growth">
                  <div className="distribution-bar">
                    <div
                      className="bar-invested"
                      style={{ width: `${investedPercent}%` }}
                      title={`Contributed Principal: ${formatPercentage(investedPercent, 1)}`}
                    />
                    <div
                      className="bar-gain"
                      style={{ width: `${growthPercent}%` }}
                      title={`Compounded Growth: ${formatPercentage(growthPercent, 1)}`}
                    />
                  </div>
                  <div className="proportion-legend">
                    <div className="legend-chip">
                      <span className="legend-swatch invested-swatch" />
                      <span>Contributed Principal ({formatPercentage(investedPercent, 0)})</span>
                    </div>
                    <div className="legend-chip">
                      <span className="legend-swatch gain-swatch" />
                      <span>Compounded Growth ({formatPercentage(growthPercent, 0)})</span>
                    </div>
                  </div>
                </div>

                {/* Step-Up Scenario Comparison Card */}
                {stepUpNum > 0 && baselineResult && (
                  <div className="scenario-comparison-card">
                    <div className="comparison-header">
                      <span className="comparison-tag">Step-Up Acceleration</span>
                      <h4 className="comparison-title">Comparison vs Fixed Monthly SIP</h4>
                    </div>
                    <p className="comparison-desc">
                      Keeping starting installment (₹{formatINR(monthlyNum)}), duration ({sipYearsNum}y), return ({returnNum}%), and lump sums identical:
                    </p>
                    <div className="comparison-metrics">
                      <div className="comp-item">
                        <span className="comp-label">Fixed SIP Corpus</span>
                        <span className="comp-val">{formatINR(baselineResult.finalCorpus)}</span>
                      </div>
                      <div className="comp-item highlight">
                        <span className="comp-label">Step-Up Advantage</span>
                        <span className="comp-val">+{formatINR(result.finalCorpus - baselineResult.finalCorpus)}</span>
                      </div>
                    </div>
                    <span className="comparison-footnote">
                      Annual step-ups of {stepUpNum}% up to Year {stepUpDurationNum} added {formatINR(result.totalInvested - baselineResult.totalInvested)} in contributions, generating {formatINR((result.finalCorpus - baselineResult.finalCorpus) - (result.totalInvested - baselineResult.totalInvested))} in extra compounding growth.
                    </span>
                  </div>
                )}

                {/* Scenario Dynamics Summary */}
                <div className="dynamics-summary-card">
                  <span className="dynamics-title">How Your Scenario Multiplies</span>
                  <ul className="dynamics-list">
                    {monthlyNum > 0 && (
                      <li>
                        <strong>Recurring Monthly SIP:</strong> Disciplined contributions across {result.sipDurationYears} years.
                        {stepUpNum > 0
                          ? ` Stepping up by ${stepUpNum}% annually through Year ${result.stepUpDurationYears}, then capped for the remaining ${Math.max(0, sipYearsNum - stepUpDurationNum)} SIP years.`
                          : ' Fixed monthly installment without annual increases.'}
                      </li>
                    )}
                    {result.totalLumpSumsInvested > 0 && (
                      <li>
                        <strong>One-Time Capital:</strong> A total of {formatINR(result.totalLumpSumsInvested)} injected across {parsedLumpSums.length} scheduled addition(s), compounding from the start of their respective projection years.
                      </li>
                    )}
                    {result.postSipYears > 0 && (
                      <li>
                        <strong>Holding Period Momentum:</strong> No new installments added during the final {result.postSipYears} post-SIP years, allowing the accumulated portfolio to compound purely on its own base.
                      </li>
                    )}
                  </ul>
                </div>

                {/* Toggle Year-by-Year Schedule */}
                <div className="schedule-toggle-row">
                  <button
                    type="button"
                    id="toggle-sip-growth-schedule-btn"
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="btn-toggle-schedule"
                    aria-expanded={showSchedule}
                  >
                    {showSchedule ? '▲ Hide Year-by-Year Growth Schedule' : '▼ View Year-by-Year Growth Schedule'}
                  </button>
                </div>
              </>
            ) : (
              <div className="unavailable-card">
                <span className="unavailable-icon" aria-hidden="true">⚠️</span>
                <h4 className="unavailable-title">Simulation Unavailable</h4>
                <p className="unavailable-desc">
                  {!hasContribution
                    ? 'Please specify at least one recurring monthly SIP installment or one positive lump-sum addition.'
                    : 'Check your inputs above for valid simulation parameters.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Year-by-Year Schedule Table */}
      {isValid && result && showSchedule && (
        <div className="schedule-section" id="growth-schedule-table">
          <div className="schedule-card-header">
            <div>
              <span className="schedule-badge">Annual Progression</span>
              <h3 className="schedule-card-title">Year-by-Year Growth & Balance Schedule</h3>
              <p className="schedule-card-subtitle">
                Modeled using Beginning-of-Month Annuity-Due Timing & Effective Annual Rate (EAR) Compounding
              </p>
            </div>
          </div>

          <div className="schedule-table-container">
            <table className="growth-schedule-table">
              <thead>
                <tr>
                  <th scope="col">Year</th>
                  <th scope="col">Phase</th>
                  <th scope="col">Opening Balance</th>
                  <th scope="col">SIP Added</th>
                  <th scope="col">Lump Sum Added</th>
                  <th scope="col">Annual Growth</th>
                  <th scope="col">Closing Balance</th>
                  <th scope="col">Cumulative Invested</th>
                </tr>
              </thead>
              <tbody>
                {result.yearlySchedule.map((row) => (
                  <tr key={row.year} className={!row.isSipActive ? 'holding-row' : ''}>
                    <td className="cell-year">Year {row.year}</td>
                    <td className="cell-phase">
                      <span className={`phase-tag ${row.isSipActive ? 'tag-active' : 'tag-holding'}`}>
                        {row.isSipActive ? 'SIP Active' : 'Holding'}
                      </span>
                    </td>
                    <td className="cell-num">{formatINR(row.openingBalance)}</td>
                    <td className="cell-num sip-num">{row.sipContributions > 0 ? `+${formatINR(row.sipContributions)}` : '—'}</td>
                    <td className="cell-num lump-num">{row.lumpSumContributions > 0 ? `+${formatINR(row.lumpSumContributions)}` : '—'}</td>
                    <td className="cell-num growth-num">+{formatINR(row.growthAmount)}</td>
                    <td className="cell-num closing-num font-bold">{formatINR(row.closingBalance)}</td>
                    <td className="cell-num">{formatINR(row.cumulativeContributions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mathematical Methodology Details */}
          <details className="methodology-disclosure">
            <summary className="methodology-summary">
              <span>View Calculation Engine Methodology & Compounding Formulas</span>
            </summary>
            <div className="methodology-body">
              <p>
                <strong>Effective Annual Rate (EAR) Convention:</strong> The annual return rate <code>r</code> is converted geometrically to an equivalent monthly effective rate <code>i = (1 + r)^(1/12) - 1</code>, ensuring that twelve months of compounding yields the precise annual rate without nominal distortion.
              </p>
              <p>
                <strong>Annuity-Due Monthly Timing:</strong> Monthly SIP contributions occur at the <em>beginning of each month</em>, compounding for the entire month: <code>FV_month = (balance + installment) × (1 + i)</code>.
              </p>
              <p>
                <strong>One-Time Investment Timing:</strong> Milestone additions occur at the <em>beginning</em> of their designated projection year (Month <code>(y - 1) × 12 + 1</code>).
              </p>
              <p>
                <strong>Holding Period Compounding:</strong> During the post-SIP holding horizon, no recurring monthly installments are added (<code>installment = 0</code>). The accumulated portfolio continues to compound monthly: <code>balance × (1 + i)</code>.
              </p>
              <p>
                <strong>Zero-Return Baseline:</strong> Under 0% return (<code>r = 0</code>), monthly rate <code>i = 0</code>. Growth amount equals exactly ₹0, and the closing balance reconciles identically with cumulative contributions.
              </p>
            </div>
          </details>
        </div>
      )}

      <style>{`
        .sip-growth-workbench-wrapper {
          margin: var(--space-6, 24px) 0;
          font-family: var(--font-family-body, inherit);
        }

        /* Notice Banner */
        .workbench-notice-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 16px;
          margin-bottom: 24px;
          border: 1px solid var(--awc-line);
          background-color: #ffffff;
        }

        .workbench-notice-banner.state-example {
          border-left: 4px solid var(--color-border-interactive);
          background-color: var(--awc-jade-soft);
        }

        .workbench-notice-banner.state-custom {
          border-left: 4px solid var(--awc-gold);
          background-color: #FBF7EE;
        }

        .notice-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .notice-icon {
          font-size: 20px;
          line-height: 1.2;
        }

        .notice-text-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .notice-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--awc-navy);
        }

        .notice-desc {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1.5;
        }

        .reset-scenario-btn {
          font-size: 12px;
          font-weight: 750;
          color: var(--color-text-brand);
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: 20px;
          padding: 6px 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .reset-scenario-btn:hover {
          background-color: var(--awc-jade-soft);
          border-color: var(--color-border-interactive);
        }

        /* Mobile Live Result Summary (< 850px) */
        .mobile-result-summary {
          display: none;
        }

        @media (max-width: 850px) {
          .mobile-result-summary {
            display: block;
            background-color: var(--awc-navy);
            color: #ffffff;
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 10px 28px rgba(23,48,71,.18);
          }

          .mobile-summary-header {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            margin-bottom: 12px;
          }

          @media (min-width: 380px) {
            .mobile-summary-header {
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              gap: 10px;
            }
          }

          .mobile-summary-tag {
            display: inline-block;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background-color: rgba(242, 198, 93, 0.18);
            color: var(--awc-gold);
            padding: 3px 10px;
            border-radius: 12px;
            white-space: nowrap;
            line-height: 1.2;
          }

          .mobile-summary-subtitle {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.75);
            white-space: nowrap;
          }

          .mobile-summary-value {
            font-size: clamp(24px, 7vw, 32px);
            font-weight: 900;
            color: var(--awc-gold);
            letter-spacing: -0.03em;
            line-height: 1.15;
            margin-bottom: 4px;
          }

          .mobile-summary-compact {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.85);
            margin-bottom: 12px;
          }

          .mobile-summary-pills {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }

          .mobile-pill {
            font-size: 11px;
            font-weight: 650;
            background-color: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 8px;
          }

          .mobile-pill.highlight {
            background-color: rgba(207, 239, 227, 0.18);
            color: var(--awc-mint);
          }

          .mobile-summary-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .mobile-action-btn {
            min-height: 44px;
            font-size: 12px;
            font-weight: 750;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 8px 12px;
            text-align: center;
            transition: all 0.15s ease;
          }

          .mobile-action-btn.primary {
            background-color: var(--color-text-brand);
            color: #ffffff;
          }

          .mobile-action-btn.primary:hover {
            background-color: #126e67;
          }

          .mobile-action-btn.secondary {
            background-color: rgba(255, 255, 255, 0.12);
            color: #ffffff;
          }

          .mobile-action-btn.secondary:hover {
            background-color: rgba(255, 255, 255, 0.2);
          }

          .mobile-summary-unavailable {
            padding: 12px 0;
            color: var(--awc-gold);
            font-size: 14px;
            font-weight: 600;
          }
        }

        /* Workbench Grid */
        .workbench-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 851px) {
          .workbench-grid {
            grid-template-columns: 1.08fr 0.92fr;
            gap: 32px;
            align-items: start;
          }
        }

        /* Controls Column */
        .controls-column {
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: 20px;
          padding: 24px;
        }

        .controls-section-heading {
          font-size: 18px;
          font-weight: 850;
          color: var(--awc-navy);
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        .controls-section-sub {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0 0 20px;
        }

        .input-group {
          margin-bottom: 22px;
        }

        .input-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .field-label {
          font-size: 14px;
          font-weight: 750;
          color: var(--awc-navy);
        }

        .field-label-sm {
          font-size: 13px;
          font-weight: 750;
          color: var(--awc-navy);
        }

        .currency-field, .unit-field {
          display: inline-flex;
          align-items: center;
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 10px;
          padding: 2px 10px;
        }

        .unit-field-sm {
          display: inline-flex;
          align-items: center;
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 8px;
          padding: 1px 8px;
        }

        .currency-prefix, .unit-suffix {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-muted);
        }

        .number-input {
          width: 120px;
          border: none;
          background: transparent;
          font-size: 15px;
          font-weight: 800;
          color: var(--awc-navy);
          text-align: right;
          outline: none;
          padding: 4px;
        }

        .number-input-sm {
          width: 70px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 800;
          color: var(--awc-navy);
          text-align: right;
          outline: none;
          padding: 3px;
        }

        .input-error {
          border-color: #E05252 !important;
          color: #E05252 !important;
        }

        .range-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #E5EBE9;
          outline: none;
          accent-color: var(--color-text-brand);
          cursor: pointer;
        }

        .slider-bounds {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 4px;
        }

        .field-helper-text {
          display: block;
          font-size: 11.5px;
          color: var(--color-text-muted);
          margin-top: 4px;
          line-height: 1.45;
        }

        .inline-error {
          display: block;
          font-size: 11.5px;
          font-weight: 650;
          color: #E05252;
          margin-top: 4px;
        }

        /* Advanced Options Disclosure */
        .advanced-options-wrapper {
          margin-top: 24px;
          border-top: 1px solid var(--awc-line);
          padding-top: 16px;
        }

        .btn-toggle-advanced {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 750;
          color: var(--awc-navy);
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .btn-toggle-advanced:hover {
          background-color: var(--awc-jade-soft);
          border-color: var(--color-border-interactive);
        }

        .toggle-pill {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          color: var(--color-text-brand);
          padding: 3px 8px;
          border-radius: 10px;
        }

        .advanced-options-panel {
          margin-top: 16px;
          padding: 16px;
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 16px;
        }

        .advanced-intro {
          margin-bottom: 16px;
        }

        .advanced-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--awc-navy);
          margin: 0 0 2px;
        }

        .advanced-sub {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1.4;
        }

        .stepup-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 8px;
        }

        @media (min-width: 550px) {
          .stepup-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* Lump Sums Manager */
        .lumpsum-manager-card {
          margin-top: 20px;
          margin-bottom: 20px;
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: 14px;
          padding: 16px;
        }

        .lumpsum-manager-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }

        .lumpsum-manager-title {
          font-size: 13px;
          font-weight: 800;
          color: var(--awc-navy);
          margin: 0 0 2px;
        }

        .lumpsum-manager-sub {
          font-size: 11.5px;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1.4;
        }

        .btn-add-lump {
          font-size: 11.5px;
          font-weight: 750;
          color: var(--color-text-brand);
          background-color: var(--awc-jade-soft);
          border: 1px solid var(--color-border-interactive);
          border-radius: 12px;
          padding: 6px 12px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .btn-add-lump:hover {
          background-color: #16877E;
          color: #ffffff;
        }

        .empty-lumpsums-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: var(--awc-paper);
          border: 1px dashed var(--awc-line);
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 12px;
        }

        .empty-text {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .lumpsums-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 12px;
        }

        .lumpsum-row-card {
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 10px;
          padding: 10px;
        }

        .row-fields {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        @media (min-width: 500px) {
          .row-fields {
            grid-template-columns: 1.1fr 1fr 1.2fr auto;
            align-items: flex-end;
          }
        }

        .mini-label {
          display: block;
          font-size: 10.5px;
          font-weight: 750;
          color: var(--color-text-muted);
          margin-bottom: 2px;
        }

        .select-input, .num-input-row, .text-input-row {
          width: 100%;
          font-size: 12px;
          padding: 5px 8px;
          border-radius: 6px;
          border: 1px solid var(--awc-line);
          background-color: #ffffff;
          color: var(--awc-navy);
        }

        .btn-remove-row {
          font-size: 11px;
          font-weight: 750;
          color: #E05252;
          background: #ffffff;
          border: 1px solid #E05252;
          border-radius: 6px;
          padding: 5px 10px;
          cursor: pointer;
          white-space: nowrap;
          height: 28px;
        }

        .btn-remove-row:hover {
          background: #E05252;
          color: #ffffff;
        }

        .timing-notice {
          font-size: 11px;
          color: var(--color-text-muted);
          line-height: 1.45;
          margin: 10px 0 0;
        }

        /* Results Column (Desktop Sticky 0.92fr) */
        .results-column {
          position: sticky;
          top: 96px;
        }

        .result-card {
          background-color: var(--awc-navy);
          color: #ffffff;
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 16px 40px rgba(23,48,71,.22);
        }

        .result-header {
          margin-bottom: 20px;
        }

        .result-category-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background-color: rgba(242, 198, 93, 0.18);
          color: var(--awc-gold);
          padding: 3px 10px;
          border-radius: 12px;
          margin-bottom: 8px;
        }

        .result-primary-title {
          font-size: 13px;
          font-weight: 650;
          color: rgba(255, 255, 255, 0.75);
          margin: 0 0 4px;
        }

        .result-headline-number {
          font-size: clamp(30px, 3.5vw, 40px);
          font-weight: 900;
          color: var(--awc-gold);
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 4px;
        }

        .result-compact-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 10px;
        }

        .horizon-pill {
          display: inline-block;
          font-size: 11.5px;
          font-weight: 700;
          background-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 4px 12px;
          border-radius: 20px;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }

        @media (min-width: 450px) {
          .metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .metric-cell {
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 12px;
        }

        .metric-cell.highlight-cell {
          background-color: rgba(207, 239, 227, 0.12);
          border-color: rgba(207, 239, 227, 0.2);
        }

        .metric-label {
          display: block;
          font-size: 10.5px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.65);
          margin-bottom: 4px;
        }

        .metric-figure {
          font-size: 16px;
          font-weight: 850;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .metric-figure.highlight-text {
          color: var(--awc-mint);
        }

        .metric-sub {
          display: block;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.55);
        }

        /* Distribution Bar */
        .proportion-section {
          margin-bottom: 20px;
        }

        .distribution-bar {
          width: 100%;
          height: 10px;
          border-radius: 5px;
          overflow: hidden;
          display: flex;
          background: rgba(255, 255, 255, 0.1);
          margin-bottom: 8px;
        }

        .bar-invested {
          background-color: var(--awc-mint);
          transition: width 0.3s ease;
        }

        .bar-gain {
          background-color: var(--awc-gold);
          transition: width 0.3s ease;
        }

        .proportion-legend {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.75);
        }

        .legend-chip {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-swatch {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .invested-swatch {
          background-color: var(--awc-mint);
        }

        .gain-swatch {
          background-color: var(--awc-gold);
        }

        /* Scenario Comparison Card */
        .scenario-comparison-card {
          background-color: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 18px;
        }

        .comparison-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .comparison-tag {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          background: var(--awc-gold);
          color: var(--awc-navy);
          padding: 2px 6px;
          border-radius: 6px;
        }

        .comparison-title {
          font-size: 12.5px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
        }

        .comparison-desc {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 10px;
          line-height: 1.4;
        }

        .comparison-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 8px;
        }

        .comp-item {
          background-color: rgba(0, 0, 0, 0.2);
          padding: 8px;
          border-radius: 8px;
        }

        .comp-item.highlight {
          border-left: 3px solid var(--awc-gold);
        }

        .comp-label {
          display: block;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
        }

        .comp-val {
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
        }

        .comparison-footnote {
          display: block;
          font-size: 10.5px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.35;
        }

        /* Dynamics Summary */
        .dynamics-summary-card {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 18px;
        }

        .dynamics-title {
          display: block;
          font-size: 12px;
          font-weight: 800;
          color: var(--awc-gold);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .dynamics-list {
          margin: 0;
          padding-left: 18px;
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
        }

        .dynamics-list li {
          margin-bottom: 4px;
        }

        /* Schedule Toggle */
        .schedule-toggle-row {
          text-align: center;
        }

        .btn-toggle-schedule {
          width: 100%;
          font-size: 12.5px;
          font-weight: 750;
          color: var(--awc-gold);
          background-color: rgba(242, 198, 93, 0.12);
          border: 1px solid rgba(242, 198, 93, 0.3);
          border-radius: 12px;
          padding: 10px 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-toggle-schedule:hover {
          background-color: rgba(242, 198, 93, 0.22);
        }

        /* Unavailable State Card */
        .unavailable-card {
          padding: 24px;
          text-align: center;
        }

        .unavailable-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 8px;
        }

        .unavailable-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--awc-gold);
          margin: 0 0 6px;
        }

        .unavailable-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }

        /* Schedule Section (Expanded Table) */
        .schedule-section {
          margin-top: 36px;
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: 20px;
          padding: 24px;
        }

        .schedule-card-header {
          margin-bottom: 18px;
        }

        .schedule-badge {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--color-text-brand);
          letter-spacing: 0.05em;
        }

        .schedule-card-title {
          font-size: 18px;
          font-weight: 850;
          color: var(--awc-navy);
          margin: 2px 0 4px;
        }

        .schedule-card-subtitle {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .schedule-table-container {
          overflow-x: auto;
          margin-bottom: 20px;
        }

        .growth-schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          min-width: 680px;
        }

        .growth-schedule-table th {
          background-color: var(--awc-paper);
          color: var(--awc-navy);
          font-weight: 750;
          text-align: right;
          padding: 10px 12px;
          border-bottom: 2px solid var(--awc-line);
        }

        .growth-schedule-table th:first-child,
        .growth-schedule-table th:nth-child(2) {
          text-align: left;
        }

        .growth-schedule-table td {
          padding: 9px 12px;
          border-bottom: 1px solid var(--awc-line);
          color: var(--awc-navy);
        }

        .cell-year {
          font-weight: 750;
        }

        .cell-num {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .sip-num {
          color: var(--color-text-brand);
        }

        .lump-num {
          color: #B45309;
        }

        .growth-num {
          color: #15803D;
        }

        .closing-num {
          color: var(--awc-navy);
          font-weight: 800;
        }

        .phase-tag {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 8px;
          text-transform: uppercase;
        }

        .tag-active {
          background-color: var(--awc-jade-soft);
          color: var(--color-text-brand);
        }

        .tag-holding {
          background-color: var(--awc-sand);
          color: #B45309;
        }

        .holding-row {
          background-color: #FDFAF6;
        }

        /* Methodology Disclosure */
        .methodology-disclosure {
          border-top: 1px solid var(--awc-line);
          padding-top: 14px;
        }

        .methodology-summary {
          font-size: 12.5px;
          font-weight: 750;
          color: var(--color-text-brand);
          cursor: pointer;
          outline: none;
        }

        .methodology-body {
          margin-top: 12px;
          padding: 14px;
          background-color: var(--awc-paper);
          border-radius: 12px;
          font-size: 11.5px;
          color: var(--color-text-muted);
          line-height: 1.55;
        }

        .methodology-body p {
          margin: 0 0 8px;
        }

        .methodology-body p:last-child {
          margin-bottom: 0;
        }

        .methodology-body code {
          background-color: rgba(23, 48, 71, 0.06);
          padding: 1px 4px;
          border-radius: 4px;
          color: var(--awc-navy);
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}
