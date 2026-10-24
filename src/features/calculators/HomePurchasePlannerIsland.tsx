import React, { useState, useMemo } from 'react';
import {
  calculateHomePurchasePlan,
  ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE,
  type EarmarkedAsset,
  type HomePurchaseInput,
  type HomePurchaseResult,
} from '../../domain/finance';
import { formatINR, formatIndianCompact, formatPercentage } from '../../lib/formatters';

export const HomePurchasePlannerIsland: React.FC = () => {
  // Goal & Property State
  const [currentPropertyValue, setCurrentPropertyValue] = useState<number | ''>('');
  const [yearsToPurchase, setYearsToPurchase] = useState<number | ''>('');
  const [annualPropertyGrowthPercent, setAnnualPropertyGrowthPercent] = useState<number>(6);

  // Cash & Acquisition Costs
  const [additionalCostPercent, setAdditionalCostPercent] = useState<number>(10);
  const [earmarkedAssets, setEarmarkedAssets] = useState<EarmarkedAsset[]>([]);
  const [newAssetName, setNewAssetName] = useState<string>('');
  const [newAssetAmount, setNewAssetAmount] = useState<number | ''>('');

  // Loan & Affordability
  const [homeLoanFundingPercent, setHomeLoanFundingPercent] = useState<number>(80);
  const [homeLoanInterestRatePercent, setHomeLoanInterestRatePercent] = useState<number>(8.5);
  const [loanTenureYears, setLoanTenureYears] = useState<number>(20);
  const [currentMonthlyIncome, setCurrentMonthlyIncome] = useState<number | ''>('');
  const [annualIncomeGrowthPercent, setAnnualIncomeGrowthPercent] = useState<number>(8);
  const [affordabilityThresholdPercent, setAffordabilityThresholdPercent] = useState<number>(35);

  // Funding Plan Parameters
  const [expectedInvestmentReturnPercent, setExpectedInvestmentReturnPercent] = useState<number>(12);
  const [startInvestingDelayYears, setStartInvestingDelayYears] = useState<number>(0);
  const [annualStepUpPercent, setAnnualStepUpPercent] = useState<number>(10);

  // UI state
  const [isExampleLoaded, setIsExampleLoaded] = useState<boolean>(false);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [activeScheduleMode, setActiveScheduleMode] = useState<'STEP_UP' | 'FIXED'>('STEP_UP');

  // Load Illustrative Example
  const handleLoadExample = () => {
    setCurrentPropertyValue(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.currentPropertyValue);
    setYearsToPurchase(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.yearsToPurchase);
    setAnnualPropertyGrowthPercent(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.annualPropertyGrowthPercent ?? 6);
    setAdditionalCostPercent(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.additionalCostPercent ?? 10);
    setHomeLoanFundingPercent(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.homeLoanFundingPercent ?? 80);
    setHomeLoanInterestRatePercent(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.homeLoanInterestRatePercent ?? 8.5);
    setLoanTenureYears(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.loanTenureYears ?? 20);
    setCurrentMonthlyIncome(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.currentMonthlyIncome);
    setAnnualIncomeGrowthPercent(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.annualIncomeGrowthPercent ?? 8);
    setAffordabilityThresholdPercent(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.affordabilityThresholdPercent ?? 35);
    setEarmarkedAssets(
      ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.earmarkedAssets
        ? ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.earmarkedAssets.map((a) => ({ ...a }))
        : []
    );
    setExpectedInvestmentReturnPercent(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.expectedInvestmentReturnPercent ?? 12);
    setStartInvestingDelayYears(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.startInvestingDelayYears ?? 0);
    setAnnualStepUpPercent(ILLUSTRATIVE_HOME_PURCHASE_EXAMPLE.annualStepUpPercent ?? 10);
    setIsExampleLoaded(true);
  };

  // Clear All / Neutral Empty State
  const handleClearAll = () => {
    setCurrentPropertyValue('');
    setYearsToPurchase('');
    setAnnualPropertyGrowthPercent(6);
    setAdditionalCostPercent(10);
    setEarmarkedAssets([]);
    setNewAssetName('');
    setNewAssetAmount('');
    setHomeLoanFundingPercent(80);
    setHomeLoanInterestRatePercent(8.5);
    setLoanTenureYears(20);
    setCurrentMonthlyIncome('');
    setAnnualIncomeGrowthPercent(8);
    setAffordabilityThresholdPercent(35);
    setExpectedInvestmentReturnPercent(12);
    setStartInvestingDelayYears(0);
    setAnnualStepUpPercent(10);
    setIsExampleLoaded(false);
    setShowSchedule(false);
  };

  // User input modifier wraps state setting to dismiss example banner
  const markUserEdited = () => {
    if (isExampleLoaded) {
      setIsExampleLoaded(false);
    }
  };

  // Asset handlers
  const handleAddAsset = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    markUserEdited();
    if (!newAssetName.trim() || newAssetAmount === '' || newAssetAmount <= 0) return;
    setEarmarkedAssets((prev) => [
      ...prev,
      {
        id: 'asset-' + Date.now(),
        name: newAssetName.trim(),
        amount: Number(newAssetAmount),
      },
    ]);
    setNewAssetName('');
    setNewAssetAmount('');
  };

  const handleRemoveAsset = (id: string) => {
    markUserEdited();
    setEarmarkedAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const handleEditAsset = (id: string, updatedAmount: number) => {
    markUserEdited();
    if (isNaN(updatedAmount) || updatedAmount < 0) return;
    setEarmarkedAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, amount: updatedAmount } : a))
    );
  };

  // Calculation memo
  const calculationResult: { result: HomePurchaseResult | null; error: string | null } = useMemo(() => {
    if (currentPropertyValue === '' || currentPropertyValue <= 0 || yearsToPurchase === '') {
      return { result: null, error: null };
    }

    try {
      const input: HomePurchaseInput = {
        currentPropertyValue: Number(currentPropertyValue),
        yearsToPurchase: Number(yearsToPurchase),
        annualPropertyGrowthPercent,
        additionalCostPercent,
        homeLoanFundingPercent,
        homeLoanInterestRatePercent,
        loanTenureYears,
        currentMonthlyIncome: currentMonthlyIncome === '' ? 0 : Number(currentMonthlyIncome),
        annualIncomeGrowthPercent,
        affordabilityThresholdPercent,
        earmarkedAssets,
        expectedInvestmentReturnPercent,
        startInvestingDelayYears:
          Number(yearsToPurchase) > 0 && startInvestingDelayYears >= Number(yearsToPurchase)
            ? 0
            : startInvestingDelayYears,
        annualStepUpPercent,
      };

      const res = calculateHomePurchasePlan(input);
      return { result: res, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Calculation error occurred.';
      return { result: null, error: msg };
    }
  }, [
    currentPropertyValue,
    yearsToPurchase,
    annualPropertyGrowthPercent,
    additionalCostPercent,
    homeLoanFundingPercent,
    homeLoanInterestRatePercent,
    loanTenureYears,
    currentMonthlyIncome,
    annualIncomeGrowthPercent,
    affordabilityThresholdPercent,
    earmarkedAssets,
    expectedInvestmentReturnPercent,
    startInvestingDelayYears,
    annualStepUpPercent,
  ]);

  const { result, error } = calculationResult;

  // Mobile scroll helper handlers
  const scrollToAssumptions = () => {
    const el = document.getElementById('current-property-value');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  const scrollToBreakdown = () => {
    const el = document.getElementById('results-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const maxDelay = yearsToPurchase !== '' && Number(yearsToPurchase) > 0 ? Number(yearsToPurchase) - 1 : 0;

  return (
    <div className="home-planner-island" data-testid="home-purchase-planner-island">
      {/* 1. Mobile Live Result Summary (< 850px) - Renders when result is active */}
      {result && (
        <div className="mobile-result-summary" id="home-purchase-mobile-summary" aria-label="Quick Home Purchase Summary">
          <div className="mobile-summary-header">
            <span className="mobile-summary-tag" data-testid="mobile-summary-tag">
              {isExampleLoaded ? 'Illustrative example' : 'Custom scenario'}
            </span>
            <span className="mobile-summary-subtitle">Estimated Upfront Cash</span>
          </div>

          <div className="mobile-summary-main">
            <div className="mobile-summary-value" id="home-purchase-mobile-headline-val" data-testid="val-mobile-upfront-cash">
              {formatINR(result.totalUpfrontCashRequired)}
            </div>
            <div className="mobile-summary-compact">
              Estimated EMI: {formatINR(result.loanEMI)}/mo • Price: {formatIndianCompact(result.futurePropertyValue)}
            </div>
            <div className="mobile-summary-pills">
              <span className="mobile-pill">
                Outlay: {formatIndianCompact(result.totalFutureCost)}
              </span>
              <span className="mobile-pill">
                Loan ({result.homeLoanFundingPercent}%): {formatIndianCompact(result.loanPrincipal)}
              </span>
              <span className="mobile-pill highlight">
                Funding Gap: {formatIndianCompact(result.fundingGap)}
              </span>
            </div>
          </div>

          <div className="mobile-summary-actions">
            <button
              type="button"
              className="mobile-action-btn primary"
              id="mobile-adjust-assumptions-btn"
              onClick={scrollToAssumptions}
            >
              Adjust assumptions ↓
            </button>
            <button
              type="button"
              className="mobile-action-btn secondary"
              id="mobile-view-breakdown-btn"
              onClick={scrollToBreakdown}
            >
              View full breakdown ↓
            </button>
          </div>
        </div>
      )}

      {/* Banner for Illustrative Example */}
      {isExampleLoaded && (
        <div
          className="illustrative-banner"
          data-testid="illustrative-example-banner"
          role="status"
          aria-live="polite"
        >
          <div className="banner-content">
            <span className="banner-icon" aria-hidden="true">💡</span>
            <div>
              <strong>Illustrative example loaded — these are not your figures.</strong>
              <p className="banner-subtext">
                Fictional sample for an urban 3 BHK home goal. Modify any field below to tailor this plan to your family&apos;s personal finances.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-clear-sample"
            onClick={handleClearAll}
            data-testid="banner-clear-btn"
          >
            Clear Sample
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="planner-action-bar">
        <div className="action-bar-left">
          <span className="action-tag">Interactive Planner</span>
          <span className="privacy-badge" title="Zero tracking. All calculations stay in memory.">
            🔒 Private & In-Memory
          </span>
        </div>
        <div className="action-bar-right">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleLoadExample}
            data-testid="load-example-btn"
          >
            Load illustrative home-purchase example
          </button>
          <button
            type="button"
            className="btn-outline-danger"
            onClick={handleClearAll}
            data-testid="clear-all-btn"
          >
            Clear all / Start over
          </button>
        </div>
      </div>

      <div className="planner-layout">
        {/* LEFT COLUMN: GUIDED INPUT WORKBENCH */}
        <div className="planner-inputs-column">
          {/* SECTION A: THE HOME YOU ARE PLANNING FOR */}
          <section className="form-section card" aria-labelledby="section-a-heading">
            <div className="section-header">
              <span className="step-indicator">Group A</span>
              <h2 id="section-a-heading" className="section-heading">
                The Home You Are Planning For
              </h2>
            </div>
            <p className="section-instruction">
              Enter today&apos;s estimated price of the home you plan to buy, along with your planned purchase timeline.
            </p>

            <div className="input-group">
              <div className="input-label-row">
                <label htmlFor="current-property-value">
                  Property Price Today (₹)
                  <span className="required-star">*</span>
                </label>
                {currentPropertyValue !== '' && Number(currentPropertyValue) > 0 && (
                  <span className="field-hint-accent">{formatIndianCompact(Number(currentPropertyValue))}</span>
                )}
              </div>
              <div className="input-with-affix">
                <span className="input-prefix">₹</span>
                <input
                  id="current-property-value"
                  data-testid="input-property-value"
                  type="number"
                  min="0"
                  step="50000"
                  placeholder="e.g. 7500000"
                  value={currentPropertyValue}
                  onChange={(e) => {
                    markUserEdited();
                    setCurrentPropertyValue(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)));
                  }}
                />
              </div>
              <input
                id="current-property-value-slider"
                type="range"
                className="input-range-slider"
                min="500000"
                max="50000000"
                step="100000"
                value={typeof currentPropertyValue === 'number' ? Math.min(50000000, Math.max(500000, currentPropertyValue)) : 500000}
                onChange={(e) => {
                  markUserEdited();
                  setCurrentPropertyValue(Number(e.target.value));
                }}
                aria-label="Property Price Today Slider"
              />
              <div className="slider-ticks" aria-hidden="true">
                <span>₹5 Lakhs</span>
                <span>₹5 Crore</span>
              </div>
            </div>

            <div className="input-grid-2col">
              <div className="input-group">
                <div className="input-label-row">
                  <label htmlFor="years-to-purchase">
                    When Purchase Happens
                    <span className="required-star">*</span>
                  </label>
                  <span className="field-hint-accent">
                    {yearsToPurchase === 0 ? 'Immediate' : yearsToPurchase !== '' ? `${yearsToPurchase} yrs` : ''}
                  </span>
                </div>
                <div className="input-with-affix">
                  <input
                    id="years-to-purchase"
                    data-testid="input-years-to-purchase"
                    type="number"
                    min="0"
                    max="35"
                    step="1"
                    placeholder="e.g. 5"
                    value={yearsToPurchase}
                    onChange={(e) => {
                      markUserEdited();
                      const val = e.target.value === '' ? '' : Math.max(0, Math.min(35, Math.floor(Number(e.target.value))));
                      setYearsToPurchase(val);
                    }}
                  />
                  <span className="input-suffix">years</span>
                </div>
                <input
                  id="years-to-purchase-slider"
                  type="range"
                  className="input-range-slider"
                  min="0"
                  max="25"
                  step="1"
                  value={typeof yearsToPurchase === 'number' ? yearsToPurchase : 0}
                  onChange={(e) => {
                    markUserEdited();
                    setYearsToPurchase(Number(e.target.value));
                  }}
                  aria-label="Purchase Horizon Slider"
                />
                <span className="field-hint">Use 0 for an immediate purchase</span>
              </div>

              <div className="input-group">
                <div className="input-label-row">
                  <label htmlFor="annual-property-growth">
                    Annual Price Change
                  </label>
                  <span className="field-hint-accent">{annualPropertyGrowthPercent}%</span>
                </div>
                <div className="input-with-affix">
                  <input
                    id="annual-property-growth"
                    data-testid="input-property-growth"
                    type="number"
                    min="0"
                    max="25"
                    step="0.5"
                    value={annualPropertyGrowthPercent}
                    onChange={(e) => {
                      markUserEdited();
                      setAnnualPropertyGrowthPercent(Math.max(0, Math.min(25, Number(e.target.value))));
                    }}
                  />
                  <span className="input-suffix">% p.a.</span>
                </div>
                <input
                  id="annual-property-growth-slider"
                  type="range"
                  className="input-range-slider"
                  min="0"
                  max="15"
                  step="0.5"
                  value={annualPropertyGrowthPercent}
                  onChange={(e) => {
                    markUserEdited();
                    setAnnualPropertyGrowthPercent(Number(e.target.value));
                  }}
                  aria-label="Annual Property Growth Slider"
                />
                <span className="field-hint">Illustrative benchmark: typically 5%–7% p.a.</span>
              </div>
            </div>

            <div className="input-group">
              <div className="input-label-row">
                <label htmlFor="additional-cost-percent">
                  Acquisition & Setup Costs (% of Future Property Value)
                </label>
                <span className="field-hint-accent">{additionalCostPercent}%</span>
              </div>
              <div className="input-with-affix">
                <input
                  id="additional-cost-percent"
                  data-testid="input-additional-cost-percent"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={additionalCostPercent}
                  onChange={(e) => {
                    markUserEdited();
                    setAdditionalCostPercent(Math.max(0, Math.min(50, Number(e.target.value))));
                  }}
                />
                <span className="input-suffix">%</span>
              </div>
              <input
                id="additional-cost-percent-slider"
                type="range"
                className="input-range-slider"
                min="0"
                max="25"
                step="0.5"
                value={additionalCostPercent}
                onChange={(e) => {
                  markUserEdited();
                  setAdditionalCostPercent(Number(e.target.value));
                }}
                aria-label="Acquisition Cost Percentage Slider"
              />
              <span className="field-hint">
                Illustrative editable assumption (~10% default). Actual charges depend heavily on your state, municipality, property type (under-construction vs ready/resale), and which specific fees apply.
              </span>
            </div>
          </section>

          {/* SECTION B: HOW THE PURCHASE MAY BE FUNDED */}
          <section className="form-section card" aria-labelledby="section-b-heading">
            <div className="section-header">
              <span className="step-indicator">Group B</span>
              <h2 id="section-b-heading" className="section-heading">
                How the Purchase May Be Funded
              </h2>
            </div>
            <p className="section-instruction">
              Size your loan terms and allocate existing capital expected to be available on the planned purchase date.
            </p>

            <div className="input-grid-3col">
              <div className="input-group">
                <div className="input-label-row">
                  <label htmlFor="home-loan-funding-percent">Loan Share (LTV %)</label>
                  <span className="field-hint-accent">{homeLoanFundingPercent}%</span>
                </div>
                <div className="input-with-affix">
                  <input
                    id="home-loan-funding-percent"
                    data-testid="input-loan-funding-percent"
                    type="number"
                    min="0"
                    max="95"
                    step="1"
                    value={homeLoanFundingPercent}
                    onChange={(e) => {
                      markUserEdited();
                      setHomeLoanFundingPercent(Math.max(0, Math.min(95, Number(e.target.value))));
                    }}
                  />
                  <span className="input-suffix">%</span>
                </div>
                <input
                  id="home-loan-funding-percent-slider"
                  type="range"
                  className="input-range-slider"
                  min="0"
                  max="90"
                  step="5"
                  value={homeLoanFundingPercent}
                  onChange={(e) => {
                    markUserEdited();
                    setHomeLoanFundingPercent(Number(e.target.value));
                  }}
                  aria-label="Loan Funding Share Slider"
                />
                <span className="field-hint">Typically up to 75%–80% for most lenders</span>
              </div>

              <div className="input-group">
                <div className="input-label-row">
                  <label htmlFor="home-loan-interest-rate">Interest Rate</label>
                  <span className="field-hint-accent">{homeLoanInterestRatePercent}%</span>
                </div>
                <div className="input-with-affix">
                  <input
                    id="home-loan-interest-rate"
                    data-testid="input-loan-interest-rate"
                    type="number"
                    min="0"
                    max="25"
                    step="0.1"
                    value={homeLoanInterestRatePercent}
                    onChange={(e) => {
                      markUserEdited();
                      setHomeLoanInterestRatePercent(Math.max(0, Math.min(25, Number(e.target.value))));
                    }}
                  />
                  <span className="input-suffix">% p.a.</span>
                </div>
                <input
                  id="home-loan-interest-rate-slider"
                  type="range"
                  className="input-range-slider"
                  min="5"
                  max="15"
                  step="0.25"
                  value={homeLoanInterestRatePercent}
                  onChange={(e) => {
                    markUserEdited();
                    setHomeLoanInterestRatePercent(Number(e.target.value));
                  }}
                  aria-label="Home Loan Interest Rate Slider"
                />
                <span className="field-hint">Nominal annual reducing</span>
              </div>

              <div className="input-group">
                <div className="input-label-row">
                  <label htmlFor="loan-tenure-years">Loan Tenure</label>
                  <span className="field-hint-accent">{loanTenureYears} yrs</span>
                </div>
                <div className="input-with-affix">
                  <input
                    id="loan-tenure-years"
                    data-testid="input-loan-tenure-years"
                    type="number"
                    min="1"
                    max="35"
                    step="1"
                    value={loanTenureYears}
                    onChange={(e) => {
                      markUserEdited();
                      setLoanTenureYears(Math.max(1, Math.min(35, Math.floor(Number(e.target.value)))));
                    }}
                  />
                  <span className="input-suffix">yrs</span>
                </div>
                <input
                  id="loan-tenure-years-slider"
                  type="range"
                  className="input-range-slider"
                  min="5"
                  max="30"
                  step="1"
                  value={loanTenureYears}
                  onChange={(e) => {
                    markUserEdited();
                    setLoanTenureYears(Number(e.target.value));
                  }}
                  aria-label="Loan Tenure Slider"
                />
                <span className="field-hint">Typically 15–25 years</span>
              </div>
            </div>

            {/* Earmarked Assets Manager */}
            <div className="earmarked-assets-box">
              <div className="box-title-row">
                <h3 className="box-title">Funds Earmarked for Down Payment & Costs</h3>
                <span className="box-counter">{earmarkedAssets.length} asset{earmarkedAssets.length !== 1 ? 's' : ''}</span>
              </div>
              <p className="box-desc">
                Add savings, mutual funds, or FDs dedicated to this purchase. Enter the nominal amount you expect to have available on the purchase date. This planner does not project growth on these earmarked balances; account for any expected growth before entering the amount. Do not include your household emergency fund.
              </p>

              {earmarkedAssets.length > 0 ? (
                <ul className="asset-list" data-testid="earmarked-asset-list">
                  {earmarkedAssets.map((asset) => (
                    <li key={asset.id} className="asset-row" data-testid={`asset-row-${asset.id}`}>
                      <span className="asset-name">{asset.name}</span>
                      <div className="asset-edit-group">
                        <span className="asset-currency">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="10000"
                          value={asset.amount}
                          onChange={(e) => handleEditAsset(asset.id, Number(e.target.value))}
                          aria-label={`Expected value on purchase date for ${asset.name}`}
                          className="asset-amount-input"
                        />
                        <button
                          type="button"
                          className="btn-remove-asset"
                          onClick={() => handleRemoveAsset(asset.id)}
                          aria-label={`Remove ${asset.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-assets-state">
                  No dedicated assets earmarked yet. Add one below to reduce your cash funding deficit.
                </div>
              )}

              {/* Add Asset Form */}
              <form onSubmit={handleAddAsset} className="add-asset-form">
                <div className="add-asset-fields">
                  <input
                    type="text"
                    placeholder="Asset name (e.g. Equity MF, Debt FD)"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    aria-label="New asset name"
                    className="asset-name-field"
                    data-testid="input-new-asset-name"
                  />
                  <div className="input-with-affix asset-amount-field">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      placeholder="Expected value available on purchase date (₹)"
                      value={newAssetAmount}
                      onChange={(e) => setNewAssetAmount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      aria-label="Expected value available on purchase date (₹)"
                      data-testid="input-new-asset-amount"
                    />
                  </div>
                </div>
                <p className="asset-helper-note">
                  Enter the amount you expect to have available at the purchase date. This planner does not project growth on these earmarked balances; account for any expected growth before entering the amount.
                </p>
                <button
                  type="submit"
                  className="btn-add-asset"
                  disabled={!newAssetName.trim() || newAssetAmount === '' || newAssetAmount <= 0}
                  data-testid="btn-add-asset"
                >
                  + Add Asset
                </button>
              </form>

              <div className="emergency-note">
                <span className="note-badge" aria-hidden="true">💡</span>
                <span>
                  <strong>Emergency reserve consideration:</strong> Money used toward a home purchase reduces the readily accessible funds left for other needs. Consider how much liquid money would remain after purchase; this planner does not assess whether that amount is adequate for your household.
                </span>
              </div>
            </div>
          </section>

          {/* SECTION C: CAN THE MONTHLY PAYMENT FIT THE HOUSEHOLD BUDGET? */}
          <section className="form-section card" aria-labelledby="section-c-heading">
            <div className="section-header">
              <span className="step-indicator">Group C</span>
              <h2 id="section-c-heading" className="section-heading">
                Can the Monthly Payment Fit the Household Budget?
              </h2>
            </div>
            <p className="section-instruction">
              Test whether the estimated monthly EMI stays comfortably within your projected family income.
            </p>

            <div className="input-grid-3col">
              <div className="input-group">
                <div className="input-label-row">
                  <label htmlFor="current-monthly-income">Current Monthly Income (₹)</label>
                  {currentMonthlyIncome !== '' && Number(currentMonthlyIncome) > 0 && (
                    <span className="field-hint-accent">{formatIndianCompact(Number(currentMonthlyIncome))}</span>
                  )}
                </div>
                <div className="input-with-affix">
                  <span className="input-prefix">₹</span>
                  <input
                    id="current-monthly-income"
                    data-testid="input-current-income"
                    type="number"
                    min="0"
                    step="5000"
                    placeholder="e.g. 150000"
                    value={currentMonthlyIncome}
                    onChange={(e) => {
                      markUserEdited();
                      setCurrentMonthlyIncome(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)));
                    }}
                  />
                </div>
                <span className="field-hint">Household take-home</span>
              </div>

              <div className="input-group">
                <div className="input-label-row">
                  <label htmlFor="annual-income-growth">Annual Salary Growth</label>
                  <span className="field-hint-accent">{annualIncomeGrowthPercent}%</span>
                </div>
                <div className="input-with-affix">
                  <input
                    id="annual-income-growth"
                    data-testid="input-income-growth"
                    type="number"
                    min="0"
                    max="25"
                    step="0.5"
                    value={annualIncomeGrowthPercent}
                    onChange={(e) => {
                      markUserEdited();
                      setAnnualIncomeGrowthPercent(Math.max(0, Math.min(25, Number(e.target.value))));
                    }}
                  />
                  <span className="input-suffix">% p.a.</span>
                </div>
                <input
                  id="annual-income-growth-slider"
                  type="range"
                  className="input-range-slider"
                  min="0"
                  max="15"
                  step="0.5"
                  value={annualIncomeGrowthPercent}
                  onChange={(e) => {
                    markUserEdited();
                    setAnnualIncomeGrowthPercent(Number(e.target.value));
                  }}
                  aria-label="Annual Income Growth Slider"
                />
                <span className="field-hint">Projected to purchase date</span>
              </div>

              <div className="input-group">
                <div className="input-label-row">
                  <label htmlFor="affordability-benchmark">Affordability Benchmark</label>
                  <span className="field-hint-accent">{affordabilityThresholdPercent}%</span>
                </div>
                <div className="input-with-affix">
                  <input
                    id="affordability-benchmark"
                    data-testid="input-affordability-threshold"
                    type="number"
                    min="10"
                    max="60"
                    step="1"
                    value={affordabilityThresholdPercent}
                    onChange={(e) => {
                      markUserEdited();
                      setAffordabilityThresholdPercent(Math.max(10, Math.min(60, Number(e.target.value))));
                    }}
                  />
                  <span className="input-suffix">%</span>
                </div>
                <input
                  id="affordability-benchmark-slider"
                  type="range"
                  className="input-range-slider"
                  min="15"
                  max="50"
                  step="1"
                  value={affordabilityThresholdPercent}
                  onChange={(e) => {
                    markUserEdited();
                    setAffordabilityThresholdPercent(Number(e.target.value));
                  }}
                  aria-label="Affordability Benchmark Slider"
                />
                <span className="field-hint">Default 35% (40% reference)</span>
              </div>
            </div>
          </section>

          {/* SECTION D: HOW TO ACCUMULATE THE FUNDING GAP */}
          <section className="form-section card" aria-labelledby="section-d-heading">
            <div className="section-header">
              <span className="step-indicator">Group D</span>
              <h2 id="section-d-heading" className="section-heading">
                How to Accumulate the Funding Gap
              </h2>
            </div>
            <p className="section-instruction">
              Parameters used to project monthly SIP wealth creation to bridge any upfront cash deficit.
            </p>

            <div className="input-grid-3col">
              <div className="input-group">
                <div className="input-label-row">
                  <label htmlFor="expected-investment-return">Expected SIP Return</label>
                  <span className="field-hint-accent">{expectedInvestmentReturnPercent}%</span>
                </div>
                <div className="input-with-affix">
                  <input
                    id="expected-investment-return"
                    data-testid="input-investment-return"
                    type="number"
                    min="0"
                    max="30"
                    step="0.5"
                    value={expectedInvestmentReturnPercent}
                    onChange={(e) => {
                      markUserEdited();
                      setExpectedInvestmentReturnPercent(Math.max(0, Math.min(30, Number(e.target.value))));
                    }}
                  />
                  <span className="input-suffix">% p.a.</span>
                </div>
                <input
                  id="expected-investment-return-slider"
                  type="range"
                  className="input-range-slider"
                  min="4"
                  max="18"
                  step="0.5"
                  value={expectedInvestmentReturnPercent}
                  onChange={(e) => {
                    markUserEdited();
                    setExpectedInvestmentReturnPercent(Number(e.target.value));
                  }}
                  aria-label="Expected Investment Return Slider"
                />
                <span className="field-hint">Effective annual geometric</span>
              </div>

              <div className="input-group">
                <div className="input-label-row">
                  <label htmlFor="start-investing-delay">Investment Start Delay</label>
                  <span className="field-hint-accent">{startInvestingDelayYears} yrs</span>
                </div>
                <div className="input-with-affix">
                  <input
                    id="start-investing-delay"
                    data-testid="input-investment-delay"
                    type="number"
                    min="0"
                    max={maxDelay}
                    step="1"
                    value={startInvestingDelayYears}
                    onChange={(e) => {
                      markUserEdited();
                      setStartInvestingDelayYears(Math.max(0, Math.min(maxDelay, Math.floor(Number(e.target.value)))));
                    }}
                  />
                  <span className="input-suffix">yrs</span>
                </div>
                <input
                  id="start-investing-delay-slider"
                  type="range"
                  className="input-range-slider"
                  min="0"
                  max={Math.max(1, maxDelay)}
                  step="1"
                  value={startInvestingDelayYears}
                  disabled={maxDelay <= 0}
                  onChange={(e) => {
                    markUserEdited();
                    setStartInvestingDelayYears(Number(e.target.value));
                  }}
                  aria-label="Investment Start Delay Slider"
                />
                <span className="field-hint">Postpones start of monthly SIP</span>
              </div>

              <div className="input-group">
                <div className="input-label-row">
                  <label htmlFor="annual-step-up-percent">Annual SIP Step-Up</label>
                  <span className="field-hint-accent">{annualStepUpPercent}%</span>
                </div>
                <div className="input-with-affix">
                  <input
                    id="annual-step-up-percent"
                    data-testid="input-step-up-percent"
                    type="number"
                    min="0"
                    max="30"
                    step="1"
                    value={annualStepUpPercent}
                    onChange={(e) => {
                      markUserEdited();
                      setAnnualStepUpPercent(Math.max(0, Math.min(30, Number(e.target.value))));
                    }}
                  />
                  <span className="input-suffix">% p.a.</span>
                </div>
                <input
                  id="annual-step-up-percent-slider"
                  type="range"
                  className="input-range-slider"
                  min="0"
                  max="20"
                  step="1"
                  value={annualStepUpPercent}
                  onChange={(e) => {
                    markUserEdited();
                    setAnnualStepUpPercent(Number(e.target.value));
                  }}
                  aria-label="Annual SIP Step-Up Slider"
                />
                <span className="field-hint">Increases starting month 13</span>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: CALCULATION RESULTS WORKBENCH */}
        <div className="planner-results-column" id="results-column-container">
          {error && (
            <div className="error-alert" role="alert" data-testid="error-alert">
              <strong>Calculation Error:</strong> {error}
            </div>
          )}

          {!result ? (
            /* EMPTY / WELCOME STATE */
            <div className="welcome-placeholder card" data-testid="welcome-placeholder">
              <div className="placeholder-icon" aria-hidden="true">🏡</div>
              <h3 className="placeholder-title">Ready to Plan Your Home Purchase</h3>
              <p className="placeholder-desc">
                Enter your target property price and horizon on the left to see your comprehensive acquisition budget, loan eligibility burden, and upfront cash roadmap.
              </p>
              <div className="placeholder-cta">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleLoadExample}
                  data-testid="placeholder-example-btn"
                >
                  Load illustrative 3 BHK example
                </button>
              </div>
              <div className="placeholder-feature-pills">
                <span className="feature-pill">✓ Upfront Cash & Setup Budgeting</span>
                <span className="feature-pill">✓ Sensitivity Benchmark (35% / 40%)</span>
                <span className="feature-pill">✓ Step-Up SIP Solutions</span>
              </div>
            </div>
          ) : (
            /* POPULATED RESULTS VIEW (ATLANTIC NAVY WORKBENCH) */
            <div className="results-container" id="results-container" data-testid="results-container">
              {/* RESULT CARD 1: PROPERTY & CASH ACQUISITION SUMMARY */}
              <div className="result-card primary-summary" data-testid="card-property-summary">
                <div className="card-top-row">
                  <span className="card-eyebrow">Future Property Cost</span>
                  <span className="card-tenure-badge">
                    {result.yearsToPurchase === 0
                      ? 'Immediate Purchase'
                      : `In ${result.yearsToPurchase} Year${result.yearsToPurchase > 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="hero-metric">
                  <span className="hero-value" data-testid="val-future-cost">
                    {formatINR(result.totalFutureCost)}
                  </span>
                  <span className="hero-subtitle">
                    Total acquisition outlay (base property + setup/stamp costs)
                  </span>
                </div>

                <div className="metrics-grid-3">
                  <div className="mini-metric">
                    <span className="mini-label">Base Property Price</span>
                    <span className="mini-val" data-testid="val-future-property-value">
                      {formatINR(result.futurePropertyValue)}
                    </span>
                    <span className="mini-sub">
                      Today: {formatIndianCompact(result.currentPropertyValue)}
                    </span>
                  </div>
                  <div className="mini-metric">
                    <span className="mini-label">Acquisition & Setup</span>
                    <span className="mini-val" data-testid="val-additional-costs">
                      {formatINR(result.additionalPurchaseCosts)}
                    </span>
                    <span className="mini-sub">{result.additionalCostPercent}% of property</span>
                  </div>
                  <div className="mini-metric highlight-accent">
                    <span className="mini-label">Total Upfront Cash</span>
                    <span className="mini-val" data-testid="val-upfront-cash-required">
                      {formatINR(result.totalUpfrontCashRequired)}
                    </span>
                    <span className="mini-sub">Down payment + setup</span>
                  </div>
                </div>

                {/* Capital Breakdown Bar */}
                <div className="capital-progress-box">
                  <div className="progress-labels">
                    <span>
                      Proposed Loan ({result.homeLoanFundingPercent}%):{' '}
                      <strong>{formatIndianCompact(result.loanPrincipal)}</strong>
                    </span>
                    <span>
                      Upfront Cash Required:{' '}
                      <strong>{formatIndianCompact(result.totalUpfrontCashRequired)}</strong>
                    </span>
                  </div>
                  <div className="progress-bar-track" aria-hidden="true">
                    <div
                      className="progress-fill loan-fill"
                      style={{
                        width: `${result.totalFutureCost > 0 ? (result.loanPrincipal / result.totalFutureCost) * 100 : 0}%`,
                      }}
                      title={`Loan: ${formatIndianCompact(result.loanPrincipal)}`}
                    />
                    <div
                      className="progress-fill upfront-fill"
                      style={{
                        width: `${result.totalFutureCost > 0 ? (result.totalUpfrontCashRequired / result.totalFutureCost) * 100 : 0}%`,
                      }}
                      title={`Upfront: ${formatIndianCompact(result.totalUpfrontCashRequired)}`}
                    />
                  </div>
                </div>
              </div>

              {/* RESULT CARD 2: LOAN DETAILS & INCOME AFFORDABILITY */}
              <div className="result-card" data-testid="card-loan-affordability">
                <div className="card-top-row">
                  <span className="card-eyebrow">Monthly Affordability</span>
                  <span
                    className={`status-badge status-${result.affordabilityStatus.toLowerCase()}`}
                    data-testid="badge-affordability-status"
                  >
                    {result.affordabilityStatus === 'WITHIN_BENCHMARK' && '✓ Within Benchmark'}
                    {result.affordabilityStatus === 'ABOVE_BENCHMARK_BELOW_40' && '⚡ Above Selected Benchmark'}
                    {result.affordabilityStatus === 'HIGHER_BURDEN' && '⚠️ Higher Income Burden (>40%)'}
                    {result.affordabilityStatus === 'INCOME_UNAVAILABLE' && 'Income Missing'}
                  </span>
                </div>

                <div className="loan-metrics-strip">
                  <div className="loan-metric-item">
                    <span className="loan-label">Estimated Monthly EMI</span>
                    <span className="loan-val text-brand" data-testid="val-loan-emi">
                      {formatINR(result.loanEMI)}
                    </span>
                    <span className="loan-sub">
                      {result.loanPrincipal > 0
                        ? `@ ${result.homeLoanInterestRatePercent}% for ${result.loanTenureYears} yrs`
                        : 'No home loan modeled'}
                    </span>
                  </div>

                  <div className="loan-metric-item">
                    <span className="loan-label">Projected Take-Home Income</span>
                    <span className="loan-val" data-testid="val-projected-income">
                      {result.projectedMonthlyIncome > 0
                        ? `${formatINR(result.projectedMonthlyIncome)}/mo`
                        : 'Not provided'}
                    </span>
                    <span className="loan-sub">
                      {result.currentMonthlyIncome > 0 && result.yearsToPurchase > 0
                        ? `Grown at ${result.annualIncomeGrowthPercent}% p.a.`
                        : 'At purchase time'}
                    </span>
                  </div>

                  <div className="loan-metric-item">
                    <span className="loan-label">EMI-to-Income Ratio</span>
                    <span className="loan-val" data-testid="val-emi-income-ratio">
                      {result.emiToIncomeRatioPercent !== null
                        ? formatPercentage(result.emiToIncomeRatioPercent, 1)
                        : 'N/A'}
                    </span>
                    <span className="loan-sub">
                      Benchmark: {result.affordabilityThresholdPercent}% (40% ref)
                    </span>
                  </div>
                </div>

                <p className="affordability-insight-text" data-testid="text-affordability-insight">
                  {result.affordabilityInsight}
                </p>
                <p className="tax-exclusion-note">
                  * Note: Tax treatment is not included in this estimate. This planner does not calculate tax deductions, tax-regime effects, or tax savings. Actual loan eligibility and sanction limits depend on individual bank credit underwriting and existing liabilities.
                </p>
              </div>

              {/* RESULT CARD 3: HOW TO FUND THE UPFRONT CASH GAP */}
              <div className="result-card" data-testid="card-funding-solutions">
                <div className="card-top-row">
                  <span className="card-eyebrow">Upfront Cash Funding Plan</span>
                  <span className="funding-progress-badge">
                    {result.isFullyFunded ? '100% Funded' : `${result.fundingProgressPercent}% Earmarked`}
                  </span>
                </div>

                {result.isFullyFunded ? (
                  <div className="fully-funded-banner" data-testid="banner-fully-funded">
                    <span className="banner-check" aria-hidden="true">🎉</span>
                    <div>
                      <strong>Your upfront cash requirement is fully funded!</strong>
                      <p>
                        Your existing earmarked assets of {formatINR(result.totalEarmarkedAssets)} cover 100% of the required down payment and setup expenses ({formatINR(result.totalUpfrontCashRequired)}).
                      </p>
                    </div>
                  </div>
                ) : result.isImmediatePurchase ? (
                  <div className="immediate-purchase-box" data-testid="box-immediate-gap">
                    <div className="gap-alert-row">
                      <span className="gap-label">Immediate Cash Shortfall:</span>
                      <span className="gap-value text-danger" data-testid="val-funding-gap">
                        {formatINR(result.fundingGap)}
                      </span>
                    </div>
                    <p className="immediate-desc">
                      For an immediate purchase, future SIP accumulation cannot fund this deficit. You must arrange {formatINR(result.fundingGap)} from liquid family capital or review your property budget.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="gap-summary-strip">
                      <div>
                        <span className="summary-strip-label">Upfront Cash Required</span>
                        <span className="summary-strip-val">{formatINR(result.totalUpfrontCashRequired)}</span>
                      </div>
                      <span className="strip-minus" aria-hidden="true">−</span>
                      <div>
                        <span className="summary-strip-label">Earmarked Assets</span>
                        <span className="summary-strip-val text-brand">{formatINR(result.totalEarmarkedAssets)}</span>
                      </div>
                      <span className="strip-equals" aria-hidden="true">=</span>
                      <div>
                        <span className="summary-strip-label">Funding Gap to Build</span>
                        <span className="summary-strip-val text-danger" data-testid="val-funding-gap">
                          {formatINR(result.fundingGap)}
                        </span>
                      </div>
                    </div>

                    {result.startInvestingDelayYears > 0 && (
                      <div className="delay-alert-pill">
                        ⏳ {result.startInvestingDelayYears}-year delay active: accumulation horizon is {result.remainingAccumulationYears} years ({result.remainingAccumulationMonths} months).
                      </div>
                    )}

                    {/* Three Funding Solutions */}
                    <div className="solutions-grid">
                      {/* Solution 1: Step-Up SIP (Recommended) */}
                      <div className="solution-card featured-solution" data-testid="solution-stepup-sip">
                        <span className="solution-badge">Recommended</span>
                        <h4 className="solution-title">Annual Step-Up SIP</h4>
                        <div className="solution-amount" data-testid="val-stepup-sip">
                          {formatINR(result.requiredStartingStepUpSIP)}
                          <span className="solution-freq">/month</span>
                        </div>
                        <p className="solution-desc">
                          Starts lower today and increases by {result.annualStepUpPercent}% annually as your family income grows over {result.remainingAccumulationYears} years.
                        </p>
                      </div>

                      {/* Solution 2: Fixed Monthly SIP */}
                      <div className="solution-card" data-testid="solution-fixed-sip">
                        <span className="solution-badge badge-neutral">Constant</span>
                        <h4 className="solution-title">Fixed Monthly SIP</h4>
                        <div className="solution-amount" data-testid="val-fixed-sip">
                          {formatINR(result.requiredFixedMonthlySIP)}
                          <span className="solution-freq">/month</span>
                        </div>
                        <p className="solution-desc">
                          Requires a flat monthly investment of {formatINR(result.requiredFixedMonthlySIP)} continuously for {result.remainingAccumulationMonths} months @ {result.expectedInvestmentReturnPercent}% return.
                        </p>
                      </div>

                      {/* Solution 3: Lump Sum Today */}
                      <div className="solution-card" data-testid="solution-lumpsum">
                        <span className="solution-badge badge-neutral">One-Time</span>
                        <h4 className="solution-title">Lump Sum Today</h4>
                        <div className="solution-amount" data-testid="val-lumpsum-today">
                          {formatINR(result.requiredLumpSumToday)}
                        </div>
                        <p className="solution-desc">
                          One-time capital deployed today compounding at {result.expectedInvestmentReturnPercent}% p.a. to reach the {formatIndianCompact(result.fundingGap)} gap at purchase time.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* RESULT CARD 4: YEAR-BY-YEAR ACCUMULATION SCHEDULE */}
              {result.yearlyFundingSchedule.length > 0 && (
                <div className="result-card" data-testid="card-yearly-schedule">
                  <div className="card-top-row">
                    <span className="card-eyebrow">Progression Schedule</span>
                    <button
                      type="button"
                      className="btn-toggle-schedule"
                      onClick={() => setShowSchedule((prev) => !prev)}
                      data-testid="toggle-schedule-btn"
                    >
                      {showSchedule ? '▲ Hide Year-by-Year Schedule' : '▼ View Year-by-Year Schedule'}
                    </button>
                  </div>

                  {showSchedule && (
                    <div className="schedule-drawer" data-testid="schedule-drawer">
                      <div className="schedule-tabs">
                        <button
                          type="button"
                          className={`tab-btn ${activeScheduleMode === 'STEP_UP' ? 'active' : ''}`}
                          onClick={() => setActiveScheduleMode('STEP_UP')}
                        >
                          Step-Up SIP Plan
                        </button>
                        <button
                          type="button"
                          className={`tab-btn ${activeScheduleMode === 'FIXED' ? 'active' : ''}`}
                          onClick={() => setActiveScheduleMode('FIXED')}
                        >
                          Fixed Monthly SIP Plan
                        </button>
                      </div>

                      <div className="table-responsive">
                        <table className="schedule-table" data-testid="schedule-table">
                          <thead>
                            <tr>
                              <th scope="col">Year</th>
                              <th scope="col">Status</th>
                              <th scope="col">Monthly Contribution</th>
                              <th scope="col">Annual Invested</th>
                              <th scope="col">Accumulated Corpus</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.yearlyFundingSchedule.map((row) => (
                              <tr key={row.year} className={row.isDelayed ? 'row-delayed' : ''}>
                                <td>Year {row.year}</td>
                                <td>{row.isDelayed ? 'Delayed' : 'Active SIP'}</td>
                                <td>
                                  {row.isDelayed
                                    ? '₹0'
                                    : formatINR(
                                        activeScheduleMode === 'STEP_UP'
                                          ? row.stepUpMonthlySIP
                                          : row.fixedMonthlySIP
                                      )}
                                </td>
                                <td>
                                  {row.isDelayed
                                    ? '₹0'
                                    : formatINR(
                                        activeScheduleMode === 'STEP_UP'
                                          ? row.stepUpAnnualContribution
                                          : row.fixedAnnualContribution
                                      )}
                                </td>
                                <td className="font-semibold text-brand">
                                  {formatINR(
                                    activeScheduleMode === 'STEP_UP'
                                      ? row.stepUpAccumulatedCorpus
                                      : row.fixedAccumulatedCorpus
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Factual Context Narrative */}
              <div className="narrative-box" data-testid="narrative-box">
                <span className="narrative-tag">Planning Summary</span>
                <p className="narrative-text">{result.summaryNarrative}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .home-planner-island {
          margin: var(--space-6) 0;
          font-family: var(--font-family-body);
          max-width: 100%;
          overflow-x: clip;
        }

        @media (max-width: 640px) {
          .card {
            padding: var(--space-4) !important;
          }
          .earmarked-assets-box {
            padding: var(--space-3) !important;
          }
          .result-card {
            padding: var(--space-4) !important;
          }
          .asset-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .asset-edit-group {
            width: 100%;
            justify-content: space-between;
          }
        }

        /* 1. Mobile Live Result Summary (< 850px) */
        .mobile-result-summary {
          display: none;
          background: linear-gradient(135deg, #173047 0%, #102436 100%);
          border: 1px solid rgba(22, 135, 126, 0.4);
          border-radius: var(--radius-xl, 20px);
          padding: 16px;
          margin-bottom: 24px;
          box-shadow: 0 8px 24px rgba(23, 48, 71, 0.16);
          color: #ffffff;
        }

        @media (max-width: 850px) {
          .mobile-result-summary {
            display: block;
          }
        }

        .mobile-summary-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          margin-bottom: 10px;
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
          color: #F2C65D;
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
          font-size: clamp(24px, 6vw, 30px);
          font-weight: 900;
          color: #F2C65D;
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
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 14px;
        }

        .mobile-pill {
          font-size: 11px;
          font-weight: 700;
          background-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 8px;
        }

        .mobile-pill.highlight {
          background-color: rgba(207, 239, 227, 0.2);
          color: #CFEFE3;
        }

        .mobile-summary-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .mobile-action-btn {
          min-height: 44px;
          padding: 10px 12px;
          border-radius: var(--radius-pill, 9999px);
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 1px solid transparent;
          transition: all var(--transition-fast, 0.15s ease);
        }

        .mobile-action-btn.primary {
          background-color: #16877E;
          color: #ffffff;
          border-color: #16877E;
        }

        .mobile-action-btn.primary:hover {
          background-color: #0e655e;
        }

        .mobile-action-btn.secondary {
          background-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .mobile-action-btn.secondary:hover {
          background-color: rgba(255, 255, 255, 0.18);
        }

        /* Illustrative Example Banner */
        .illustrative-banner {
          background-color: #fffbeb;
          border: 1px solid #fcd34d;
          border-left: 4px solid #f59e0b;
          border-radius: var(--radius-lg, 16px);
          padding: var(--space-4);
          margin-bottom: var(--space-6);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-4);
        }

        .banner-content {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .banner-icon {
          font-size: 1.25rem;
          line-height: 1;
        }

        .banner-subtext {
          font-size: var(--text-body-sm);
          color: var(--color-text-secondary);
          margin: var(--space-1) 0 0 0;
        }

        .btn-clear-sample {
          font-size: var(--text-caption);
          font-weight: 600;
          background: transparent;
          color: #78350f;
          border: 1px solid #fbbf24;
          border-radius: var(--radius-pill);
          padding: var(--space-1) var(--space-3);
          cursor: pointer;
          white-space: nowrap;
        }

        .btn-clear-sample:hover {
          background-color: #fef3c7;
        }

        /* Top Action Bar */
        .planner-action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .action-bar-left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .action-tag {
          font-size: var(--text-caption);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #16877E;
        }

        .privacy-badge {
          font-size: var(--text-caption);
          font-weight: 600;
          color: #15803d;
          background-color: #f0fdf4;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          border: 1px solid #bbf7d0;
        }

        .action-bar-right {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .btn-secondary {
          background-color: #E1F3EE;
          color: #16877E;
          border: 1px solid #CFEFE3;
          font-size: var(--text-body-sm);
          font-weight: 600;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-pill);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-secondary:hover {
          background-color: #CFEFE3;
        }

        .btn-outline-danger {
          background: transparent;
          color: #dc2626;
          border: 1px solid var(--color-border-subtle);
          font-size: var(--text-body-sm);
          font-weight: 600;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-pill);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-outline-danger:hover {
          border-color: #dc2626;
          background-color: #fef2f2;
        }

        /* 2-Column Responsive Layout */
        .planner-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-8);
          align-items: start;
        }

        @media (min-width: 1024px) {
          .planner-layout {
            grid-template-columns: 1.08fr 0.92fr;
          }
        }

        /* Form Card Styles */
        .card {
          background-color: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-xl, 20px);
          padding: var(--space-6);
          box-shadow: 0 4px 16px rgba(23, 48, 71, 0.04);
          margin-bottom: var(--space-6);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-2);
        }

        .step-indicator {
          font-size: var(--text-caption);
          font-weight: 800;
          text-transform: uppercase;
          background-color: #CFEFE3;
          color: #16877E;
          padding: 3px 10px;
          border-radius: var(--radius-pill);
        }

        .section-heading {
          font-size: var(--text-h4);
          font-family: var(--font-family-heading);
          font-weight: 800;
          color: #173047;
          margin: 0;
        }

        .section-instruction {
          font-size: var(--text-body-sm);
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin: 0 0 var(--space-4) 0;
        }

        /* Input Controls */
        .input-group {
          margin-bottom: var(--space-5);
          display: flex;
          flex-direction: column;
        }

        .input-label-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: var(--space-1);
        }

        .input-group label {
          font-size: var(--text-body-sm);
          font-weight: 700;
          color: #173047;
        }

        .field-hint-accent {
          font-size: 12px;
          font-weight: 750;
          color: #16877E;
        }

        .required-star {
          color: #dc2626;
          margin-left: 2px;
        }

        .input-with-affix {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-prefix {
          position: absolute;
          left: 12px;
          color: var(--color-text-muted);
          font-weight: 600;
          pointer-events: none;
        }

        .input-suffix {
          position: absolute;
          right: 12px;
          color: var(--color-text-muted);
          font-size: var(--text-caption);
          font-weight: 600;
          pointer-events: none;
        }

        .input-with-affix input {
          width: 100%;
          height: 44px;
          padding: 0 12px;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md, 10px);
          font-size: var(--text-body);
          font-family: var(--font-family-body);
          color: #173047;
          background-color: #ffffff;
          box-sizing: border-box;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .input-with-affix input:focus {
          outline: none;
          border-color: #16877E;
          box-shadow: 0 0 0 3px rgba(22, 135, 126, 0.15);
        }

        .input-prefix ~ input {
          padding-left: 32px;
        }

        .input-suffix ~ input {
          padding-right: 58px;
        }

        .input-range-slider {
          margin-top: 8px;
          width: 100%;
          accent-color: #16877E;
          cursor: pointer;
        }

        .slider-ticks {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .field-hint {
          font-size: var(--text-caption);
          color: var(--color-text-secondary);
          margin-top: 4px;
          line-height: 1.4;
        }

        .input-grid-2col {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        @media (min-width: 640px) {
          .input-grid-2col {
            grid-template-columns: 1fr 1fr;
          }
        }

        .input-grid-3col {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        @media (min-width: 640px) {
          .input-grid-3col {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Earmarked Assets Box */
        .earmarked-assets-box {
          background-color: #F6F8F5;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-lg, 16px);
          padding: var(--space-5);
          margin-top: var(--space-4);
        }

        .box-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .box-title {
          font-size: var(--text-body);
          font-family: var(--font-family-heading);
          font-weight: 750;
          color: #173047;
          margin: 0;
        }

        .box-counter {
          font-size: var(--text-caption);
          font-weight: 700;
          background-color: #CFEFE3;
          color: #16877E;
          padding: 2px 8px;
          border-radius: var(--radius-pill);
        }

        .box-desc {
          font-size: var(--text-caption);
          color: var(--color-text-secondary);
          line-height: 1.45;
          margin: 0 0 var(--space-4) 0;
        }

        .asset-list {
          list-style: none;
          padding: 0;
          margin: 0 0 var(--space-4) 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .asset-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #ffffff;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md, 10px);
          padding: var(--space-2) var(--space-3);
          gap: var(--space-3);
        }

        .asset-name {
          font-size: var(--text-body-sm);
          font-weight: 600;
          color: #173047;
        }

        .asset-edit-group {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .asset-currency {
          font-size: var(--text-body-sm);
          font-weight: 600;
          color: var(--color-text-muted);
        }

        .asset-amount-input {
          width: 120px;
          height: 34px;
          padding: 0 8px;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          font-size: var(--text-body-sm);
          text-align: right;
        }

        .btn-remove-asset {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          font-size: 1rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
        }

        .btn-remove-asset:hover {
          color: #dc2626;
          background-color: #fef2f2;
        }

        .empty-assets-state {
          font-size: var(--text-caption);
          color: var(--color-text-secondary);
          text-align: center;
          padding: var(--space-4);
          background-color: #ffffff;
          border: 1px dashed var(--color-border-subtle);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-4);
        }

        .add-asset-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .add-asset-fields {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-2);
        }

        @media (min-width: 480px) {
          .add-asset-fields {
            grid-template-columns: 1fr 1fr;
          }
        }

        .asset-name-field {
          height: 40px;
          padding: 0 12px;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          font-size: var(--text-body-sm);
        }

        .asset-amount-field input {
          height: 40px;
          font-size: var(--text-body-sm);
        }

        .asset-helper-note {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          margin: 4px 0 8px 0;
          line-height: 1.4;
        }

        .btn-add-asset {
          background-color: #16877E;
          color: #ffffff;
          border: none;
          border-radius: var(--radius-md);
          padding: var(--space-2) var(--space-4);
          font-size: var(--text-body-sm);
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          align-self: flex-start;
          transition: background-color var(--transition-fast);
        }

        .btn-add-asset:hover:not(:disabled) {
          background-color: #0e655e;
        }

        .btn-add-asset:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .emergency-note {
          display: flex;
          align-items: flex-start;
          gap: var(--space-2);
          margin-top: var(--space-3);
          font-size: var(--text-caption);
          color: #78350f;
          background-color: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: var(--radius-md);
          padding: var(--space-2) var(--space-3);
          line-height: 1.45;
        }

        .note-badge {
          font-size: 0.9rem;
          line-height: 1;
        }

        /* Results Column (Sticky Atlantic Navy Container) */
        .planner-results-column {
          position: sticky;
          top: 96px;
        }

        .error-alert {
          background-color: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          color: #b91c1c;
          font-size: var(--text-body-sm);
          margin-bottom: var(--space-4);
        }

        .welcome-placeholder {
          text-align: center;
          padding: var(--space-10) var(--space-6);
          background: #ffffff;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-xl, 20px);
          box-shadow: 0 4px 16px rgba(23, 48, 71, 0.04);
        }

        .placeholder-icon {
          font-size: 2.5rem;
          margin-bottom: var(--space-3);
        }

        .placeholder-title {
          font-size: var(--text-h3);
          font-family: var(--font-family-heading);
          font-weight: 800;
          color: #173047;
          margin: 0 0 var(--space-2) 0;
        }

        .placeholder-desc {
          font-size: var(--text-body-sm);
          color: var(--color-text-secondary);
          max-width: 440px;
          margin: 0 auto var(--space-6) auto;
          line-height: 1.55;
        }

        .placeholder-cta {
          margin-bottom: var(--space-6);
        }

        .btn-primary {
          background-color: #16877E;
          color: #ffffff;
          border: none;
          font-size: var(--text-body-sm);
          font-weight: 700;
          padding: var(--space-3) var(--space-6);
          border-radius: var(--radius-pill);
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .btn-primary:hover {
          background-color: #0e655e;
        }

        .placeholder-feature-pills {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .feature-pill {
          font-size: 11.5px;
          font-weight: 700;
          color: #16877E;
          background-color: #E1F3EE;
          padding: 4px 10px;
          border-radius: var(--radius-pill);
        }

        /* Results Container & Atlantic Navy Cards */
        .results-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .result-card {
          background-color: #173047;
          color: #ffffff;
          border: 1px solid rgba(22, 135, 126, 0.3);
          border-radius: var(--radius-xl, 20px);
          padding: var(--space-6);
          box-shadow: 0 10px 30px rgba(23, 48, 71, 0.16);
        }

        .primary-summary {
          border-top: 4px solid #F2C65D;
          background: linear-gradient(180deg, #1d3b56 0%, #173047 100%);
        }

        .card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
        }

        .card-eyebrow {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #F2C65D;
        }

        .card-tenure-badge {
          font-size: var(--text-caption);
          font-weight: 700;
          background-color: rgba(207, 239, 227, 0.2);
          color: #CFEFE3;
          padding: 3px 10px;
          border-radius: var(--radius-pill);
        }

        .hero-metric {
          margin-bottom: var(--space-6);
        }

        .hero-value {
          display: block;
          font-size: clamp(28px, 4vw, 38px);
          font-family: var(--font-family-heading);
          font-weight: 900;
          color: #F2C65D;
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .hero-subtitle {
          font-size: var(--text-body-sm);
          color: rgba(255, 255, 255, 0.75);
          margin-top: var(--space-1);
          display: block;
        }

        .metrics-grid-3 {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
        }

        @media (min-width: 640px) {
          .metrics-grid-3 {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .mini-metric {
          background-color: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-lg, 14px);
          padding: var(--space-3) var(--space-4);
          display: flex;
          flex-direction: column;
        }

        .mini-metric.highlight-accent {
          background-color: rgba(22, 135, 126, 0.2);
          border-color: rgba(207, 239, 227, 0.35);
        }

        .mini-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2px;
        }

        .mini-val {
          font-size: var(--text-h4);
          font-weight: 800;
          color: #ffffff;
        }

        .mini-metric.highlight-accent .mini-val {
          color: #F2C65D;
        }

        .mini-sub {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.65);
          margin-top: 2px;
        }

        /* Progress Bar */
        .capital-progress-box {
          margin-top: var(--space-2);
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: var(--text-caption);
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: var(--space-2);
        }

        .progress-bar-track {
          display: flex;
          height: 10px;
          border-radius: var(--radius-pill);
          overflow: hidden;
          background-color: rgba(255, 255, 255, 0.15);
        }

        .progress-fill.loan-fill {
          background-color: #16877E;
        }

        .progress-fill.upfront-fill {
          background-color: #F2C65D;
        }

        /* Affordability Strip */
        .status-badge {
          font-size: var(--text-caption);
          font-weight: 700;
          padding: 3px 10px;
          border-radius: var(--radius-pill);
        }

        .status-within_benchmark {
          background-color: rgba(207, 239, 227, 0.25);
          color: #CFEFE3;
          border: 1px solid rgba(207, 239, 227, 0.4);
        }

        .status-above_benchmark_below_40 {
          background-color: rgba(242, 198, 93, 0.2);
          color: #F2C65D;
          border: 1px solid rgba(242, 198, 93, 0.4);
        }

        .status-higher_burden {
          background-color: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .status-income_unavailable {
          background-color: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .loan-metrics-strip {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }

        @media (min-width: 640px) {
          .loan-metrics-strip {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .loan-metric-item {
          display: flex;
          flex-direction: column;
        }

        .loan-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
        }

        .loan-val {
          font-size: var(--text-h4);
          font-weight: 800;
          color: #ffffff;
          margin: 2px 0;
        }

        .loan-sub {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.65);
        }

        .text-brand {
          color: #F2C65D;
        }

        .text-danger {
          color: #fca5a5;
        }

        .affordability-insight-text {
          font-size: var(--text-body-sm);
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.5;
          margin: 0 0 var(--space-2) 0;
        }

        .tax-exclusion-note {
          font-size: var(--text-caption);
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.4;
          margin: 0;
          font-style: italic;
        }

        /* Funding Solutions */
        .funding-progress-badge {
          font-size: var(--text-caption);
          font-weight: 700;
          background-color: rgba(207, 239, 227, 0.2);
          color: #CFEFE3;
          padding: 2px 8px;
          border-radius: var(--radius-pill);
        }

        .fully-funded-banner {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          background-color: rgba(207, 239, 227, 0.15);
          border: 1px solid rgba(207, 239, 227, 0.35);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }

        .fully-funded-banner p {
          margin: var(--space-1) 0 0 0;
          font-size: var(--text-body-sm);
          color: rgba(255, 255, 255, 0.85);
        }

        .immediate-purchase-box {
          background-color: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }

        .gap-alert-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-2);
        }

        .gap-label {
          font-weight: 700;
          font-size: var(--text-body);
        }

        .gap-value {
          font-size: var(--text-h4);
          font-weight: 800;
        }

        .immediate-desc {
          font-size: var(--text-body-sm);
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          line-height: 1.5;
        }

        .gap-summary-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          margin-bottom: var(--space-4);
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .summary-strip-label {
          display: block;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
        }

        .summary-strip-val {
          font-size: var(--text-body);
          font-weight: 800;
        }

        .strip-minus, .strip-equals {
          font-weight: 800;
          color: rgba(255, 255, 255, 0.5);
        }

        .delay-alert-pill {
          font-size: var(--text-caption);
          font-weight: 600;
          background-color: rgba(242, 198, 93, 0.18);
          color: #F2C65D;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-4);
        }

        .solutions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3);
        }

        @media (min-width: 640px) {
          .solutions-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .solution-card {
          background-color: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
        }

        .solution-card.featured-solution {
          background: linear-gradient(135deg, rgba(22, 135, 126, 0.3) 0%, rgba(23, 48, 71, 0.4) 100%);
          border-color: rgba(207, 239, 227, 0.4);
        }

        .solution-badge {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background-color: #F2C65D;
          color: #173047;
          padding: 2px 6px;
          border-radius: var(--radius-pill);
          align-self: flex-start;
          margin-bottom: var(--space-2);
        }

        .solution-badge.badge-neutral {
          background-color: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .solution-title {
          font-size: var(--text-body-sm);
          font-weight: 750;
          color: #ffffff;
          margin: 0 0 var(--space-1) 0;
        }

        .solution-amount {
          font-size: var(--text-h4);
          font-weight: 900;
          color: #F2C65D;
          margin-bottom: var(--space-2);
        }

        .solution-freq {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
        }

        .solution-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.45;
          margin: 0;
          flex-grow: 1;
        }

        /* Schedule Drawer */
        .btn-toggle-schedule {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--radius-pill);
          cursor: pointer;
        }

        .btn-toggle-schedule:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .schedule-drawer {
          margin-top: var(--space-4);
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: var(--space-4);
        }

        .schedule-tabs {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }

        .tab-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.8);
          font-size: var(--text-caption);
          font-weight: 700;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-pill);
          cursor: pointer;
        }

        .tab-btn.active {
          background-color: #16877E;
          color: #ffffff;
          border-color: #16877E;
        }

        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--text-caption);
          color: rgba(255, 255, 255, 0.85);
        }

        .schedule-table th, .schedule-table td {
          padding: 8px 10px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          white-space: nowrap;
        }

        .schedule-table th {
          color: #CFEFE3;
          font-weight: 700;
        }

        .row-delayed td {
          color: rgba(255, 255, 255, 0.45);
        }

        /* Narrative Box */
        .narrative-box {
          background-color: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }

        .narrative-tag {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #F2C65D;
          display: block;
          margin-bottom: var(--space-1);
        }

        .narrative-text {
          font-size: var(--text-body-sm);
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.5;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default HomePurchasePlannerIsland;
