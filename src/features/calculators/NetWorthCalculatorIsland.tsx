import React, { useState, useId } from 'react';
import { calculateNetWorth, type NetWorthResult } from '../../domain/finance/netWorth';
import { formatINR, formatPercentage } from '../../lib/formatters';

interface FormInputs {
  liquidAssets: string;
  financialAssets: string;
  physicalAssets: string;
  securedLiabilities: string;
  unsecuredLiabilities: string;
}

const EMPTY_INPUTS: FormInputs = {
  liquidAssets: '',
  financialAssets: '',
  physicalAssets: '',
  securedLiabilities: '',
  unsecuredLiabilities: '',
};

const SAMPLE_INPUTS: FormInputs = {
  liquidAssets: '500000',
  financialAssets: '2500000',
  physicalAssets: '7000000',
  securedLiabilities: '4000000',
  unsecuredLiabilities: '0',
};

export default function NetWorthCalculatorIsland(): React.JSX.Element {
  const [inputs, setInputs] = useState<FormInputs>(EMPTY_INPUTS);
  const [isExampleLoaded, setIsExampleLoaded] = useState<boolean>(false);
  const [isCustomized, setIsCustomized] = useState<boolean>(false);
  const baseId = useId();

  const parseVal = (val: string): number => {
    const trimmed = val.trim();
    if (trimmed === '') return NaN;
    const num = Number(trimmed);
    return Number.isFinite(num) && num >= 0 ? num : NaN;
  };

  const hasAnyEntered =
    inputs.liquidAssets.trim() !== '' ||
    inputs.financialAssets.trim() !== '' ||
    inputs.physicalAssets.trim() !== '' ||
    inputs.securedLiabilities.trim() !== '' ||
    inputs.unsecuredLiabilities.trim() !== '';

  const liquidNum = parseVal(inputs.liquidAssets);
  const financialNum = parseVal(inputs.financialAssets);
  const physicalNum = parseVal(inputs.physicalAssets);
  const securedNum = parseVal(inputs.securedLiabilities);
  const unsecuredNum = parseVal(inputs.unsecuredLiabilities);

  const isLiquidValid = !hasAnyEntered || !isNaN(liquidNum);
  const isFinancialValid = !hasAnyEntered || !isNaN(financialNum);
  const isPhysicalValid = !hasAnyEntered || !isNaN(physicalNum);
  const isSecuredValid = !hasAnyEntered || !isNaN(securedNum);
  const isUnsecuredValid = !hasAnyEntered || !isNaN(unsecuredNum);

  const isValid =
    hasAnyEntered &&
    !isNaN(liquidNum) &&
    !isNaN(financialNum) &&
    !isNaN(physicalNum) &&
    !isNaN(securedNum) &&
    !isNaN(unsecuredNum);

  let result: NetWorthResult | null = null;
  if (isValid) {
    try {
      result = calculateNetWorth({
        categories: {
          liquidAssets: liquidNum,
          financialAssets: financialNum,
          physicalAssets: physicalNum,
          securedLiabilities: securedNum,
          unsecuredLiabilities: unsecuredNum,
        },
      });
    } catch {
      result = null;
    }
  }

  const handleInputChange = (field: keyof FormInputs, val: string): void => {
    if (isExampleLoaded) {
      setIsExampleLoaded(false);
      setIsCustomized(true);
    }
    setInputs((prev) => ({ ...prev, [field]: val }));
  };

  const handleLoadExample = (): void => {
    setInputs(SAMPLE_INPUTS);
    setIsExampleLoaded(true);
    setIsCustomized(false);
  };

  const handleClearAll = (): void => {
    setInputs(EMPTY_INPUTS);
    setIsExampleLoaded(false);
    setIsCustomized(false);
  };

  return (
    <div className="net-worth-island-wrapper" id="net-worth-calculator-app">
      {/* Top Action Toolbar */}
      <div className="nw-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-badge">In-Memory Diagnostic</span>
          <span className="toolbar-privacy-note">🔒 Private session · Never stored or transmitted</span>
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            id="reset-net-worth-example-btn"
            onClick={handleLoadExample}
            className="btn-toolbar-example"
            title="Load illustrative urban family example"
          >
            Load Example
          </button>
          <button
            type="button"
            id="clear-net-worth-btn"
            onClick={handleClearAll}
            className="btn-toolbar-clear"
            title="Clear all entries"
          >
            Clear all entries
          </button>
        </div>
      </div>

      {/* Illustrative Notice Banner */}
      {isExampleLoaded && (
        <aside className="example-notice-banner" role="status" aria-live="polite">
          <span className="example-badge">Illustrative Example</span>
          <p className="example-notice-text">
            <strong>Illustrative example loaded — these are not your figures.</strong> Any adjustments you make will recalculate your net worth in memory.
          </p>
        </aside>
      )}

      {isCustomized && hasAnyEntered && (
        <aside className="custom-notice-banner" role="status" aria-live="polite">
          <span className="custom-badge">Custom Scenario</span>
          <p className="custom-notice-text">
            Figures entered are processed strictly in transient browser memory.
          </p>
        </aside>
      )}

      {/* Two-Column Workbench Layout */}
      <div className="net-worth-card">
        {/* Controls Column */}
        <div className="net-worth-controls-col">
          <div className="card-top-bar">
            <div>
              <span className="card-eyebrow">Household Balance Sheet</span>
              <h2 className="card-title">Assets &amp; Liabilities</h2>
            </div>
          </div>

          <p className="card-intro">
            Add what your household owns and owes to see an instant net worth baseline.
          </p>

          {/* Group 1: Assets */}
          <fieldset className="input-group-fieldset">
            <legend className="fieldset-legend">
              <span className="legend-num">1</span>
              <span>What You Own (Household Assets)</span>
            </legend>

            <div className="field-row">
              <div className="field-info">
                <label htmlFor={`${baseId}-liquid`} className="input-label">
                  Cash &amp; Liquid Reserves
                </label>
                <span className="input-hint">Savings bank balances, liquid mutual funds, short-term FDs</span>
              </div>
              <div className="input-container">
                <span className="currency-prefix">₹</span>
                <input
                  id={`${baseId}-liquid`}
                  type="text"
                  inputMode="numeric"
                  value={inputs.liquidAssets}
                  onChange={(e) => handleInputChange('liquidAssets', e.target.value)}
                  className={`num-input ${!isLiquidValid ? 'input-err' : ''}`}
                  placeholder="500000"
                />
              </div>
            </div>
            {!isLiquidValid && <p className="field-err">Please enter a valid non-negative rupee amount.</p>}

            <div className="field-row">
              <div className="field-info">
                <label htmlFor={`${baseId}-financial`} className="input-label">
                  Financial Market Investments
                </label>
                <span className="input-hint">Equity mutual funds, direct stocks, EPF, PPF, NPS, bonds</span>
              </div>
              <div className="input-container">
                <span className="currency-prefix">₹</span>
                <input
                  id={`${baseId}-financial`}
                  type="text"
                  inputMode="numeric"
                  value={inputs.financialAssets}
                  onChange={(e) => handleInputChange('financialAssets', e.target.value)}
                  className={`num-input ${!isFinancialValid ? 'input-err' : ''}`}
                  placeholder="2500000"
                />
              </div>
            </div>
            {!isFinancialValid && <p className="field-err">Please enter a valid non-negative rupee amount.</p>}

            <div className="field-row">
              <div className="field-info">
                <label htmlFor={`${baseId}-physical`} className="input-label">
                  Property &amp; Physical Assets
                </label>
                <span className="input-hint">Estimated market value of home, land, vehicles, jewellery</span>
              </div>
              <div className="input-container">
                <span className="currency-prefix">₹</span>
                <input
                  id={`${baseId}-physical`}
                  type="text"
                  inputMode="numeric"
                  value={inputs.physicalAssets}
                  onChange={(e) => handleInputChange('physicalAssets', e.target.value)}
                  className={`num-input ${!isPhysicalValid ? 'input-err' : ''}`}
                  placeholder="7000000"
                />
              </div>
            </div>
            {!isPhysicalValid && <p className="field-err">Please enter a valid non-negative rupee amount.</p>}
          </fieldset>

          {/* Group 2: Liabilities */}
          <fieldset className="input-group-fieldset">
            <legend className="fieldset-legend">
              <span className="legend-num">2</span>
              <span>What You Owe (Household Liabilities)</span>
            </legend>

            <div className="field-row">
              <div className="field-info">
                <label htmlFor={`${baseId}-secured`} className="input-label">
                  Secured Debt Principal
                </label>
                <span className="input-hint">Outstanding principal on home loan, vehicle loan, mortgage</span>
              </div>
              <div className="input-container">
                <span className="currency-prefix">₹</span>
                <input
                  id={`${baseId}-secured`}
                  type="text"
                  inputMode="numeric"
                  value={inputs.securedLiabilities}
                  onChange={(e) => handleInputChange('securedLiabilities', e.target.value)}
                  className={`num-input ${!isSecuredValid ? 'input-err' : ''}`}
                  placeholder="4000000"
                />
              </div>
            </div>
            {!isSecuredValid && <p className="field-err">Please enter a valid non-negative rupee amount.</p>}

            <div className="field-row">
              <div className="field-info">
                <label htmlFor={`${baseId}-unsecured`} className="input-label">
                  Unsecured Debt Principal
                </label>
                <span className="input-hint">Personal loans, credit card balances, education loans</span>
              </div>
              <div className="input-container">
                <span className="currency-prefix">₹</span>
                <input
                  id={`${baseId}-unsecured`}
                  type="text"
                  inputMode="numeric"
                  value={inputs.unsecuredLiabilities}
                  onChange={(e) => handleInputChange('unsecuredLiabilities', e.target.value)}
                  className={`num-input ${!isUnsecuredValid ? 'input-err' : ''}`}
                  placeholder="0"
                />
              </div>
            </div>
            {!isUnsecuredValid && <p className="field-err">Please enter a valid non-negative rupee amount.</p>}
          </fieldset>
        </div>

        {/* Results Column */}
        <div className="net-worth-results-col" id="net-worth-summary-results">
          <div className="results-box">
            <div className="results-header-row">
              <div>
                <span className="results-eyebrow">Household Solvency Diagnostic</span>
                <h3 className="results-headline">Accounting Balance Sheet</h3>
              </div>
              {result && (
                <span className="results-status-badge">
                  {isExampleLoaded ? 'Illustrative Result' : 'Live Calculation'}
                </span>
              )}
            </div>

            {result ? (
              <div className="results-content">
                {/* Mobile Headline Callout: Measurable at 360px & 390px */}
                <div className="mobile-headline-card" id="net-worth-mobile-headline-box">
                  <span className="headline-eyebrow">Accounting Net Worth</span>
                  <span className="headline-val" id="net-worth-headline-val" data-testid="net-worth-headline-val">
                    {result.totalNetWorth < 0 ? '-' : ''}
                    {formatINR(Math.abs(result.totalNetWorth))}
                  </span>
                  <span className="headline-sub">
                    Total assets ({formatINR(result.totalAssets)}) minus total liabilities ({formatINR(result.totalLiabilities)})
                  </span>
                </div>

                {/* Primary Equation Strip */}
                <div className="equation-strip">
                  <div className="eq-item">
                    <span className="eq-lbl">Total Assets</span>
                    <span className="eq-val text-brand">{formatINR(result.totalAssets)}</span>
                  </div>
                  <span className="eq-sign" aria-hidden="true">−</span>
                  <div className="eq-item">
                    <span className="eq-lbl">Total Liabilities</span>
                    <span className="eq-val text-danger">{formatINR(result.totalLiabilities)}</span>
                  </div>
                  <span className="eq-sign" aria-hidden="true">=</span>
                  <div className="eq-item highlight">
                    <span className="eq-lbl">Net Worth</span>
                    <span className="eq-val text-primary">
                      {result.totalNetWorth < 0 ? '-' : ''}
                      {formatINR(Math.abs(result.totalNetWorth))}
                    </span>
                  </div>
                </div>

                {/* Cash & Financial Assets After Liabilities Card */}
                <div className="productive-liquid-card">
                  <div className="productive-card-top">
                    <span className="productive-badge">Excludes Physical Assets</span>
                    <span className="productive-num">
                      {result.productiveLiquidNetWorth < 0 ? '-' : ''}
                      {formatINR(Math.abs(result.productiveLiquidNetWorth))}
                    </span>
                  </div>
                  <h4 className="productive-title">Cash &amp; Financial Assets After Liabilities</h4>
                  <p className="productive-desc">
                    Calculated as (Cash &amp; Liquid Reserves + Financial Assets) − Total Liabilities. Isolates liquid and financial resources from physical property and vehicles. Note: this measure is not the same as emergency cash available today; some financial or retirement holdings may have lock-ins, access conditions, exit costs or settlement timelines.
                  </p>
                </div>

                {/* Detailed Breakdown Grid */}
                <div className="breakdown-grid">
                  <div className="breakdown-cell">
                    <span className="cell-lbl">Liquid Cash &amp; Reserves</span>
                    <span className="cell-val">{formatINR(result.liquidAssets)}</span>
                  </div>
                  <div className="breakdown-cell">
                    <span className="cell-lbl">Invested Market Assets</span>
                    <span className="cell-val">{formatINR(result.financialAssets)}</span>
                  </div>
                  <div className="breakdown-cell">
                    <span className="cell-lbl">Physical Property &amp; Gold</span>
                    <span className="cell-val">{formatINR(result.physicalAssets)}</span>
                  </div>
                  <div className="breakdown-cell">
                    <span className="cell-lbl">Debt-to-Asset Ratio</span>
                    <span className="cell-val">
                      {result.debtToAssetRatio !== null
                        ? formatPercentage(result.debtToAssetRatio * 100, 1)
                        : 'Not available'}
                    </span>
                    <span className="cell-sub">
                      {result.debtToAssetRatio !== null
                        ? 'Total debt ÷ Total assets'
                        : 'Requires non-zero assets'}
                    </span>
                  </div>
                </div>

                <p className="results-disclaimer">
                  Estimates are based on user-entered values. Figures do not represent an official audit, credit rating, valuation certificate, or investment advice.
                </p>
              </div>
            ) : !hasAnyEntered ? (
              <div className="results-empty-workbench">
                <div className="workbench-icon" aria-hidden="true">⚖️</div>
                <p className="results-pending">
                  Enter your figures or click <strong>Load Example</strong> to see results.
                </p>
                <button
                  type="button"
                  onClick={handleLoadExample}
                  className="btn-empty-load"
                >
                  Load illustrative example
                </button>
              </div>
            ) : (
              <div className="results-invalid-workbench">
                <p className="results-pending">Please enter valid non-negative rupee figures to view your net worth balance sheet.</p>
              </div>
            )}

            {/* Reciprocal Deep Dive Card */}
            <div className="deep-dive-card">
              <span className="deep-dive-badge">Comprehensive Review</span>
              <h4 className="deep-dive-title">Need a more complete household review?</h4>
              <p className="deep-dive-desc">
                The guided <strong>Personal Finance Statement</strong> reviews monthly cash flow, checks emergency safety runway in months, and maps productive versus consumption assets in depth.
              </p>
              <a href="/tools/personal-finance-statement/" className="btn-deep-dive">
                Open Personal Finance Statement →
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .net-worth-island-wrapper {
          margin: var(--space-6) 0 var(--space-10) 0;
          font-family: var(--font-family-body, inherit);
        }

        .nw-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-3);
          background-color: var(--color-bg-surface, #ffffff);
          border: 1px solid var(--color-border-subtle, #e2e8f0);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-3) var(--space-4);
          margin-bottom: var(--space-4);
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .toolbar-badge {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-brand-primary, #173047);
          background-color: var(--primitive-teal-50, #f0fdfa);
          border: 1px solid var(--primitive-teal-200, #99f6e4);
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-pill, 9999px);
        }

        .toolbar-privacy-note {
          font-size: 0.8rem;
          color: var(--color-text-secondary, #64748b);
        }

        .toolbar-actions {
          display: flex;
          gap: var(--space-2);
        }

        .btn-toolbar-example,
        .btn-toolbar-clear {
          font-family: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.35rem 0.8rem;
          border-radius: var(--radius-sm, 6px);
          cursor: pointer;
          transition: all var(--transition-fast, 150ms ease);
          min-height: 38px;
        }

        .btn-toolbar-example {
          background-color: var(--color-brand-accent, #16877E);
          color: #ffffff;
          border: 1px solid var(--color-brand-accent, #16877E);
        }

        .btn-toolbar-example:hover {
          background-color: var(--primitive-teal-700, #0f766e);
        }

        .btn-toolbar-clear {
          background-color: transparent;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .btn-toolbar-clear:hover {
          background-color: #fef2f2;
          border-color: #f87171;
        }

        .example-notice-banner {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background-color: #fefce8;
          border: 1px solid #fef08a;
          border-left: 4px solid var(--awc-gold);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-2) var(--space-3);
          margin-bottom: var(--space-4);
          box-sizing: border-box;
        }

        .example-badge {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-brand-primary, #173047);
          background-color: #ffffff;
          padding: 0.15rem 0.45rem;
          border: 1px solid var(--color-border-subtle, #e2e8f0);
          border-radius: var(--radius-sm, 4px);
          flex-shrink: 0;
        }

        .example-notice-text {
          font-size: 0.82rem;
          color: var(--color-text-primary, #1e293b);
          margin: 0;
          line-height: 1.4;
        }

        .custom-notice-banner {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 4px solid var(--color-brand-accent, #16877E);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-2) var(--space-3);
          margin-bottom: var(--space-4);
          box-sizing: border-box;
        }

        .custom-badge {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-brand-accent, #16877E);
          background-color: #ffffff;
          padding: 0.15rem 0.45rem;
          border: 1px solid var(--color-border-subtle, #e2e8f0);
          border-radius: var(--radius-sm, 4px);
          flex-shrink: 0;
        }

        .custom-notice-text {
          font-size: 0.82rem;
          color: var(--color-text-secondary, #64748b);
          margin: 0;
        }

        .net-worth-card {
          background-color: var(--color-bg-surface, #ffffff);
          border: 1px solid var(--color-border-subtle, #e2e8f0);
          border-radius: var(--radius-lg, 12px);
          box-shadow: var(--shadow-subtle, 0 2px 8px rgba(0, 0, 0, 0.04));
          display: grid;
          grid-template-columns: 1fr;
          overflow: hidden;
        }

        @media (min-width: 960px) {
          .net-worth-card {
            grid-template-columns: 1.15fr 0.85fr;
          }
        }

        .net-worth-controls-col {
          padding: var(--space-6, 24px);
        }

        .card-top-bar {
          margin-bottom: var(--space-2, 8px);
        }

        .card-eyebrow {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--color-brand-accent, #16877E);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 2px;
        }

        .card-title {
          font-size: var(--text-h3, 1.4rem);
          font-family: var(--font-family-heading, inherit);
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          margin: 0;
        }

        .card-intro {
          font-size: 0.88rem;
          color: var(--color-text-secondary, #64748b);
          margin: var(--space-2, 8px) 0 var(--space-6, 24px) 0;
          line-height: 1.5;
        }

        .input-group-fieldset {
          border: 1px solid var(--color-border-subtle, #e2e8f0);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-4, 16px);
          margin: 0 0 var(--space-5, 20px) 0;
          background-color: var(--awc-paper);
        }

        .fieldset-legend {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          padding: 0 var(--space-2, 8px);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: var(--color-brand-primary, #173047);
          color: #ffffff;
          font-size: 0.68rem;
          font-weight: 800;
        }

        .field-row {
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 8px);
          margin-bottom: var(--space-4, 16px);
        }

        @media (min-width: 600px) {
          .field-row {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .field-row:last-child {
          margin-bottom: 0;
        }

        .field-info {
          flex: 1;
        }

        .input-label {
          display: block;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--color-brand-primary, #173047);
          margin-bottom: 2px;
        }

        .input-hint {
          display: block;
          font-size: 0.76rem;
          color: var(--color-text-secondary, #64748b);
          line-height: 1.35;
        }

        .input-container {
          display: flex;
          align-items: center;
          background-color: #ffffff;
          border: 1px solid var(--color-border-subtle, #cbd5e1);
          border-radius: var(--radius-sm, 6px);
          padding: 0 var(--space-3, 12px);
          min-width: 170px;
          height: 44px;
          box-sizing: border-box;
          transition: border-color var(--transition-fast, 150ms ease);
        }

        .input-container:focus-within {
          border-color: var(--color-brand-accent, #16877E);
          box-shadow: 0 0 0 3px rgba(22, 135, 126, 0.15);
        }

        .currency-prefix {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-text-secondary, #64748b);
          margin-right: 6px;
        }

        .num-input {
          border: none;
          background: transparent;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: inherit;
          color: var(--color-brand-primary, #173047);
          width: 100%;
          outline: none;
        }

        .input-err {
          border-color: #dc2626 !important;
        }

        .field-err {
          font-size: 0.75rem;
          color: #dc2626;
          margin: 4px 0 8px 0;
        }

        /* Results Column */
        .net-worth-results-col {
          background-color: var(--awc-paper);
          border-top: 1px solid var(--color-border-subtle, #e2e8f0);
          padding: var(--space-6, 24px);
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 960px) {
          .net-worth-results-col {
            border-top: none;
            border-left: 1px solid var(--color-border-subtle, #e2e8f0);
          }
        }

        .results-box {
          display: flex;
          flex-direction: column;
          gap: var(--space-4, 16px);
        }

        .results-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .results-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--color-brand-accent, #16877E);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
        }

        .results-headline {
          font-size: var(--text-h3, 1.25rem);
          font-family: var(--font-family-heading, inherit);
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          margin: 2px 0 0 0;
        }

        .results-status-badge {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          background-color: var(--primitive-teal-50, #f0fdfa);
          border: 1px solid var(--primitive-teal-200, #99f6e4);
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-sm, 4px);
        }

        /* Mobile Headline Card (for immediate visibility on 360/390px) */
        .mobile-headline-card {
          background: linear-gradient(135deg, #173047 0%, #132A40 100%);
          color: #ffffff;
          padding: var(--space-4, 16px);
          border-radius: var(--radius-md, 8px);
          box-shadow: 0 4px 12px rgba(23, 48, 71, 0.12);
        }

        .headline-eyebrow {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--awc-gold);
          font-weight: 700;
          display: block;
          margin-bottom: 4px;
        }

        .headline-val {
          font-size: 1.75rem;
          font-family: var(--font-family-heading, inherit);
          font-weight: 800;
          display: block;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .headline-sub {
          font-size: 0.76rem;
          color: #cbd5e1;
          display: block;
          margin-top: 4px;
        }

        .equation-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #ffffff;
          border: 1px solid var(--color-border-subtle, #e2e8f0);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-3, 12px);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .eq-item {
          display: flex;
          flex-direction: column;
          flex: 1;
          text-align: center;
        }

        .eq-lbl {
          font-size: 0.72rem;
          color: var(--color-text-secondary, #64748b);
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .eq-val {
          font-size: 0.95rem;
          font-weight: 700;
        }

        .eq-sign {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--color-text-secondary, #94a3b8);
          padding: 0 4px;
        }

        .eq-item.highlight .eq-val {
          color: var(--color-brand-accent, #16877E);
          font-size: 1.05rem;
        }

        .text-brand {
          color: var(--color-brand-primary, #173047);
        }

        .text-danger {
          color: #dc2626;
        }

        .text-primary {
          color: var(--color-brand-accent, #16877E);
        }

        /* Productive Liquid Card */
        .productive-liquid-card {
          background-color: var(--primitive-teal-50, #f0fdfa);
          border: 1px solid var(--primitive-teal-200, #99f6e4);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-4, 16px);
        }

        .productive-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .productive-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-brand-accent, #16877E);
          background-color: #ffffff;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-pill, 9999px);
        }

        .productive-num {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--color-brand-primary, #173047);
        }

        .productive-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          margin: 0 0 6px 0;
        }

        .productive-desc {
          font-size: 0.78rem;
          color: var(--color-text-secondary, #475569);
          margin: 0;
          line-height: 1.45;
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3, 12px);
        }

        .breakdown-cell {
          background-color: #ffffff;
          border: 1px solid var(--color-border-subtle, #e2e8f0);
          border-radius: var(--radius-sm, 6px);
          padding: var(--space-3, 12px);
          display: flex;
          flex-direction: column;
        }

        .cell-lbl {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--color-text-secondary, #64748b);
          margin-bottom: 2px;
        }

        .cell-val {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
        }

        .cell-sub {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: 2px;
        }

        .results-disclaimer {
          font-size: 0.72rem;
          color: #94a3b8;
          margin: var(--space-2, 8px) 0 0 0;
          line-height: 1.4;
        }

        .results-empty-workbench,
        .results-invalid-workbench {
          background-color: #ffffff;
          border: 1px dashed var(--color-border-subtle, #cbd5e1);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-6, 24px);
          text-align: center;
        }

        .workbench-icon {
          font-size: 2rem;
          margin-bottom: var(--space-2, 8px);
        }

        .results-pending {
          font-size: 0.88rem;
          color: var(--color-text-secondary, #64748b);
          margin: 0 0 var(--space-3, 12px) 0;
          line-height: 1.5;
        }

        .btn-empty-load {
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--color-brand-accent, #16877E);
          background-color: var(--primitive-teal-50, #f0fdfa);
          border: 1px solid var(--color-brand-accent, #16877E);
          padding: 0.4rem 0.9rem;
          border-radius: var(--radius-sm, 6px);
          cursor: pointer;
          min-height: 40px;
        }

        .btn-empty-load:hover {
          background-color: var(--primitive-teal-100, #ccfbf1);
        }

        /* Deep Dive Box */
        .deep-dive-card {
          background-color: #ffffff;
          border: 1px solid var(--color-border-subtle, #e2e8f0);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-4, 16px);
          margin-top: var(--space-2, 8px);
        }

        .deep-dive-badge {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-brand-accent, #16877E);
          background-color: var(--primitive-teal-50, #f0fdfa);
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-pill, 9999px);
          display: inline-block;
          margin-bottom: 6px;
        }

        .deep-dive-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          margin: 0 0 6px 0;
        }

        .deep-dive-desc {
          font-size: 0.8rem;
          color: var(--color-text-secondary, #64748b);
          line-height: 1.45;
          margin: 0 0 var(--space-3, 12px) 0;
        }

        .btn-deep-dive {
          display: inline-flex;
          align-items: center;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--color-brand-accent, #16877E);
          text-decoration: none;
          min-height: 40px;
        }

        .btn-deep-dive:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
