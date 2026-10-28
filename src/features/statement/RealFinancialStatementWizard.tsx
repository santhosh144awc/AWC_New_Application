import React, { useState, useId } from 'react';
import {
  calculateRealFinancialStatement,
  CANONICAL_URBAN_FAMILY_SAMPLE,
  type IncomeItem,
  type OutflowItem,
  type StatementAssetItem,
  type StatementLiabilityItem,
  type RealFinancialStatementResult,
  type IncomeCategory,
  type OutflowCategory,
  type AssetGroup,
  type AssetPurpose,
  type StatementLiabilityCategory,
} from '../../domain/finance/realFinancialStatement';
import { formatINR, formatPercentage } from '../../lib/formatters';

interface IncomeRowState {
  id: string;
  label: string;
  amount: string;
  category: IncomeCategory;
}

interface OutflowRowState {
  id: string;
  label: string;
  amount: string;
  category: OutflowCategory;
  isEssential: boolean;
}

interface AssetRowState {
  id: string;
  label: string;
  value: string;
  group: AssetGroup;
  isAccessibleSafetyReserve: boolean;
  purpose: AssetPurpose;
  stage: 2 | 3; // 2 = Liquid/Safety, 3 = Growth/Property
}

interface LiabilityRowState {
  id: string;
  label: string;
  balance: string;
  category: StatementLiabilityCategory;
  monthlyEmi: string;
}

/**
 * Canonical Urban Family Example Fixture (Reconciled with VEC-REAL-01)
 * Single source of truth mapped directly from CANONICAL_URBAN_FAMILY_SAMPLE
 */
const CANONICAL_INITIAL_INCOMES: IncomeRowState[] = CANONICAL_URBAN_FAMILY_SAMPLE.incomes.map((inc) => ({
  id: inc.id,
  label: inc.label,
  amount: String(inc.monthlyAmount),
  category: inc.category,
}));

const CANONICAL_INITIAL_OUTFLOWS: OutflowRowState[] = CANONICAL_URBAN_FAMILY_SAMPLE.outflows.map((out) => ({
  id: out.id,
  label: out.label,
  amount: String(out.monthlyAmount),
  category: out.category,
  isEssential: out.isEssential,
}));

const CANONICAL_INITIAL_ASSETS: AssetRowState[] = CANONICAL_URBAN_FAMILY_SAMPLE.assets.map((ast) => ({
  id: ast.id,
  label: ast.label,
  value: String(ast.estimatedValue),
  group: ast.group,
  isAccessibleSafetyReserve: ast.isAccessibleSafetyReserve,
  purpose: ast.purpose,
  stage: ast.group === 'CASH_RESERVES' ? 2 : 3,
}));

const CANONICAL_INITIAL_LIABILITIES: LiabilityRowState[] = CANONICAL_URBAN_FAMILY_SAMPLE.liabilities.map((lia) => ({
  id: lia.id,
  label: lia.label,
  balance: String(lia.outstandingBalance),
  category: lia.category,
  monthlyEmi: lia.monthlyEmi !== undefined ? String(lia.monthlyEmi) : '',
}));

export default function RealFinancialStatementWizard(): React.JSX.Element {
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4>(1);
  const [isExampleLoaded, setIsExampleLoaded] = useState<boolean>(false);
  const [isCustomScenario, setIsCustomScenario] = useState<boolean>(false);
  const [incomes, setIncomes] = useState<IncomeRowState[]>([]);
  const [outflows, setOutflows] = useState<OutflowRowState[]>([]);
  const [assets, setAssets] = useState<AssetRowState[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityRowState[]>([]);

  const baseId = useId();

  // Helper validation for string numeric inputs
  const parseAmount = (val: string): number => {
    const trimmed = val.trim();
    if (trimmed === '') return NaN;
    const num = Number(trimmed);
    return Number.isFinite(num) && num >= 0 ? num : NaN;
  };

  // Check whether user has entered any records
  const hasDataEntered =
    incomes.length > 0 || outflows.length > 0 || assets.length > 0 || liabilities.length > 0;

  // Check validity across all tables
  const incomeErrors = incomes.map((row) => isNaN(parseAmount(row.amount)) || row.label.trim() === '');
  const outflowErrors = outflows.map((row) => isNaN(parseAmount(row.amount)) || row.label.trim() === '');
  const assetErrors = assets.map((row) => isNaN(parseAmount(row.value)) || row.label.trim() === '');
  const liabilityErrors = liabilities.map((row) => isNaN(parseAmount(row.balance)) || row.label.trim() === '');

  const hasErrors =
    incomeErrors.some(Boolean) ||
    outflowErrors.some(Boolean) ||
    assetErrors.some(Boolean) ||
    liabilityErrors.some(Boolean);

  // Compute domain results only when user has entered data and inputs are valid
  let statementResult: RealFinancialStatementResult | null = null;
  if (hasDataEntered && !hasErrors) {
    try {
      const domainIncomes: IncomeItem[] = incomes.map((i) => ({
        id: i.id,
        label: i.label.trim(),
        monthlyAmount: parseAmount(i.amount),
        category: i.category,
      }));

      const domainOutflows: OutflowItem[] = outflows.map((o) => ({
        id: o.id,
        label: o.label.trim(),
        monthlyAmount: parseAmount(o.amount),
        category: o.category,
        isEssential: o.isEssential,
      }));

      const domainAssets: StatementAssetItem[] = assets.map((a) => ({
        id: a.id,
        label: a.label.trim(),
        estimatedValue: parseAmount(a.value),
        group: a.group,
        isAccessibleSafetyReserve: a.isAccessibleSafetyReserve,
        purpose: a.purpose,
      }));

      const domainLiabilities: StatementLiabilityItem[] = liabilities.map((l) => ({
        id: l.id,
        label: l.label.trim(),
        outstandingBalance: parseAmount(l.balance),
        category: l.category,
        monthlyEmi: l.monthlyEmi.trim() !== '' ? parseAmount(l.monthlyEmi) : undefined,
      }));

      statementResult = calculateRealFinancialStatement({
        incomes: domainIncomes,
        outflows: domainOutflows,
        assets: domainAssets,
        liabilities: domainLiabilities,
      });
    } catch {
      statementResult = null;
    }
  }

  // Reset all state (In-memory start over)
  const handleStartOver = (): void => {
    setIncomes([]);
    setOutflows([]);
    setAssets([]);
    setLiabilities([]);
    setIsExampleLoaded(false);
    setIsCustomScenario(false);
    setCurrentStage(1);
  };

  const handleLoadSample = (): void => {
    setIncomes(CANONICAL_INITIAL_INCOMES);
    setOutflows(CANONICAL_INITIAL_OUTFLOWS);
    setAssets(CANONICAL_INITIAL_ASSETS);
    setLiabilities(CANONICAL_INITIAL_LIABILITIES);
    setIsExampleLoaded(true);
    setIsCustomScenario(false);
    setCurrentStage(1);
  };

  // Handlers for Incomes
  const handleAddIncome = (): void => {
    setIsExampleLoaded(false);
    setIsCustomScenario(true);
    const newId = `inc-${Date.now()}`;
    setIncomes([...incomes, { id: newId, label: 'New Income Source', amount: '0', category: 'OTHER_INCOME' }]);
  };
  const handleRemoveIncome = (id: string): void => {
    setIsExampleLoaded(false);
    setIsCustomScenario(true);
    setIncomes(incomes.filter((i) => i.id !== id));
  };
  const handleUpdateIncome = (id: string, field: keyof IncomeRowState, val: string): void => {
    setIsExampleLoaded(false);
    setIsCustomScenario(true);
    setIncomes(incomes.map((i) => (i.id === id ? { ...i, [field]: val } : i)));
  };

  // Handlers for Outflows
  const handleAddOutflow = (isEssential: boolean): void => {
    setIsExampleLoaded(false);
    setIsCustomScenario(true);
    const newId = `out-${Date.now()}`;
    setOutflows([
      ...outflows,
      {
        id: newId,
        label: isEssential ? 'New Essential Expense' : 'New Discretionary Expense',
        amount: '0',
        category: isEssential ? 'ESSENTIAL_LIVING' : 'DISCRETIONARY_LIFESTYLE',
        isEssential,
      },
    ]);
  };
  const handleRemoveOutflow = (id: string): void => {
    setIsExampleLoaded(false);
    setIsCustomScenario(true);
    setOutflows(outflows.filter((o) => o.id !== id));
  };
  const handleUpdateOutflow = (id: string, field: string, val: unknown): void => {
    setIsExampleLoaded(false);
    setIsCustomScenario(true);
    setOutflows(outflows.map((o) => (o.id === id ? { ...o, [field]: val } : o)));
  };

  // Handlers for Assets
  const handleAddAsset = (stage: 2 | 3): void => {
    setIsExampleLoaded(false);
    setIsCustomScenario(true);
    const newId = `ast-${Date.now()}`;
    if (stage === 2) {
      setAssets([
        ...assets,
        {
          id: newId,
          label: 'New Liquid / Reserve Holding',
          value: '0',
          group: 'CASH_RESERVES',
          isAccessibleSafetyReserve: true,
          purpose: 'PRODUCTIVE',
          stage: 2,
        },
      ]);
    } else {
      setAssets([
        ...assets,
        {
          id: newId,
          label: 'New Investment / Property',
          value: '0',
          group: 'FINANCIAL_INVESTMENT',
          isAccessibleSafetyReserve: false,
          purpose: 'PRODUCTIVE',
          stage: 3,
        },
      ]);
    }
  };
  const handleRemoveAsset = (id: string): void => {
    setIsExampleLoaded(false);
    setIsCustomScenario(true);
    setAssets(assets.filter((a) => a.id !== id));
  };
  const handleUpdateAsset = (id: string, field: string, val: unknown): void => {
    setIsExampleLoaded(false);
    setIsCustomScenario(true);
    setAssets(
      assets.map((a) => {
        if (a.id !== id) return a;
        const updated = { ...a, [field]: val };
        // Automatic constraint rules:
        if (
          updated.group === 'RETIREMENT_RESTRICTED' ||
          updated.group === 'PERSONAL_PHYSICAL' ||
          updated.group === 'PRODUCTIVE_PROPERTY'
        ) {
          updated.isAccessibleSafetyReserve = false;
        }
        // Strict group to purpose invariant:
        // PERSONAL_PHYSICAL -> PERSONAL_USE; all other groups -> PRODUCTIVE
        if (updated.group === 'PERSONAL_PHYSICAL') {
          updated.purpose = 'PERSONAL_USE';
        } else {
          updated.purpose = 'PRODUCTIVE';
        }
        return updated;
      })
    );
  };

  // Handlers for Liabilities
  const handleAddLiability = (): void => {
    setIsExampleLoaded(false);
    setIsCustomScenario(true);
    const newId = `lia-${Date.now()}`;
    setLiabilities([
      ...liabilities,
      { id: newId, label: 'New Loan / Credit Balance', balance: '0', category: 'SECURED', monthlyEmi: '0' },
    ]);
  };
  const handleRemoveLiability = (id: string): void => {
    setIsExampleLoaded(false);
    setIsCustomScenario(true);
    setLiabilities(liabilities.filter((l) => l.id !== id));
  };
  const handleUpdateLiability = (id: string, field: keyof LiabilityRowState, val: string): void => {
    setIsExampleLoaded(false);
    setIsCustomScenario(true);
    setLiabilities(liabilities.map((l) => (l.id === id ? { ...l, [field]: val } : l)));
  };

  return (
    <div className="real-statement-wrapper" id="real-statement-app">
      {/* Step Navigation Bar */}
      <nav aria-label="Statement Stages" className="stage-nav-strip">
        <div className="stage-steps-list">
          {[
            { num: 1, label: 'Monthly Cash Flow' },
            { num: 2, label: 'Liquid & Safety Assets' },
            { num: 3, label: 'Growth & Property' },
            { num: 4, label: 'Liabilities & Review' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              id={`stage-nav-btn-${s.num}`}
              onClick={() => setCurrentStage(s.num as 1 | 2 | 3 | 4)}
              className={`stage-step-btn ${currentStage === s.num ? 'active' : ''} ${currentStage > s.num ? 'completed' : ''}`}
              aria-current={currentStage === s.num ? 'step' : undefined}
            >
              <span className="step-num">{s.num}</span>
              <span className="step-label">{s.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Global In-Memory Privacy Notice */}
      <aside className="privacy-banner" aria-label="Privacy and Session Notice">
        <div className="privacy-badge">🔒 100% In-Memory Session</div>
        <p className="privacy-text">
          Your figures are processed in browser memory only. No data is stored in cookies, localStorage, or sent to any server.
        </p>
        <div className="privacy-actions">
          <button type="button" id="load-sample-btn" onClick={handleLoadSample} className="btn-secondary-sm">
            Load Urban Family Example
          </button>
          <button type="button" id="clear-all-btn" onClick={handleStartOver} className="btn-danger-sm">
            Clear all entries / Start over
          </button>
        </div>
      </aside>

      {/* Conspicuous Illustrative Example Notice */}
      {isExampleLoaded && (
        <aside className="example-loaded-banner" role="status" aria-live="polite">
          <span className="example-banner-badge">Illustrative Example</span>
          <p className="example-banner-text">
            <strong>Illustrative example loaded — these are not your figures.</strong> Any edits you make will instantly customize your household balance sheet in transient memory.
          </p>
        </aside>
      )}

      {isCustomScenario && hasDataEntered && (
        <aside className="custom-loaded-banner" role="status" aria-live="polite">
          <span className="custom-banner-badge">Custom Scenario</span>
          <p className="custom-banner-text">
            Figures entered are processed strictly in transient browser memory and are never saved or transmitted.
          </p>
        </aside>
      )}

      {/* STAGE 1: MONTHLY HOUSEHOLD CASH FLOW */}
      {currentStage === 1 && (
        <section className="stage-section" aria-labelledby="stage-1-title">
          <header className="stage-header">
            <span className="stage-eyebrow">Stage 1 of 4</span>
            <h2 id="stage-1-title" className="stage-title">Monthly Household Cash Flow</h2>
            <p className="stage-description">
              This section compares money coming into your household with money going out each month.
              Enter <strong>monthly take-home income amounts</strong> (after income tax deduction) to ensure an accurate baseline of actual spendable cash.
            </p>
            <div className="why-we-ask-callout">
              <span className="why-badge">Why we ask</span>
              <p className="why-text">
                Comparing take-home earnings with monthly outflows reveals your true discretionary surplus and family savings rate—the financial engine behind all milestone funding.
              </p>
            </div>
          </header>

          <div className="stage-content-grid">
            {/* Inflows Section */}
            <div className="table-block">
              <div className="table-header-row">
                <h3 className="table-heading">1. Monthly Take-Home Income Streams</h3>
                <button type="button" id="add-income-btn" onClick={handleAddIncome} className="btn-add">
                  + Add Income Stream
                </button>
              </div>

              {incomes.length === 0 ? (
                <div className="empty-state">No income streams added yet. Click &ldquo;+ Add Income Stream&rdquo; above.</div>
              ) : (
                <div className="rows-container">
                  {incomes.map((inc, idx) => (
                    <div key={inc.id} className="item-row">
                      <div className="row-fields">
                        <div className="field-group flex-2">
                          <label htmlFor={`${baseId}-inc-label-${inc.id}`} className="field-label">
                            Income Source
                          </label>
                          <input
                            id={`${baseId}-inc-label-${inc.id}`}
                            type="text"
                            value={inc.label}
                            onChange={(e) => handleUpdateIncome(inc.id, 'label', e.target.value)}
                            className="input-text"
                            placeholder="e.g. Salary, Consulting, Rental"
                          />
                        </div>

                        <div className="field-group flex-1">
                          <label htmlFor={`${baseId}-inc-cat-${inc.id}`} className="field-label">
                            Category
                          </label>
                          <select
                            id={`${baseId}-inc-cat-${inc.id}`}
                            value={inc.category}
                            onChange={(e) => handleUpdateIncome(inc.id, 'category', e.target.value as IncomeCategory)}
                            className="input-select"
                          >
                            <option value="SALARY">Salary / Bonus</option>
                            <option value="BUSINESS_PROFESSIONAL">Business / Practice</option>
                            <option value="RENTAL">Rental Income</option>
                            <option value="PENSION">Pension</option>
                            <option value="OTHER_INCOME">Other Income</option>
                          </select>
                        </div>

                        <div className="field-group flex-1">
                          <label htmlFor={`${baseId}-inc-amt-${inc.id}`} className="field-label">
                            Monthly Take-Home (₹)
                          </label>
                          <input
                            id={`${baseId}-inc-amt-${inc.id}`}
                            type="text"
                            inputMode="numeric"
                            value={inc.amount}
                            onChange={(e) => handleUpdateIncome(inc.id, 'amount', e.target.value)}
                            className={`input-num ${incomeErrors[idx] ? 'input-error' : ''}`}
                            placeholder="e.g. 150000"
                          />
                        </div>

                        <button
                          type="button"
                          id={`remove-inc-${inc.id}`}
                          onClick={() => handleRemoveIncome(inc.id)}
                          className="btn-remove"
                          title="Remove this income row"
                          aria-label={`Remove income ${inc.label}`}
                        >
                          ✕
                        </button>
                      </div>
                      {incomeErrors[idx] && (
                        <p className="row-error">Please enter a valid non-negative rupee amount and a label.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outflows Section */}
            <div className="table-block">
              <div className="table-header-row">
                <h3 className="table-heading">2. Monthly Household Outflows</h3>
                <div className="btn-group-tight">
                  <button type="button" id="add-essential-outflow-btn" onClick={() => handleAddOutflow(true)} className="btn-add">
                    + Add Essential
                  </button>
                  <button type="button" id="add-discretionary-outflow-btn" onClick={() => handleAddOutflow(false)} className="btn-add-secondary">
                    + Add Discretionary
                  </button>
                </div>
              </div>

              {outflows.length === 0 ? (
                <div className="empty-state">No outflows recorded yet. Add essential living costs and discretionary lifestyle expenses.</div>
              ) : (
                <div className="rows-container">
                  {outflows.map((out, idx) => (
                    <div key={out.id} className="item-row">
                      <div className="row-fields">
                        <div className="field-group flex-2">
                          <label htmlFor={`${baseId}-out-label-${out.id}`} className="field-label">
                            Expense Description
                          </label>
                          <input
                            id={`${baseId}-out-label-${out.id}`}
                            type="text"
                            value={out.label}
                            onChange={(e) => handleUpdateOutflow(out.id, 'label', e.target.value)}
                            className="input-text"
                            placeholder="e.g. Groceries, School fees, EMI"
                          />
                        </div>

                        <div className="field-group flex-1">
                          <label htmlFor={`${baseId}-out-cat-${out.id}`} className="field-label">
                            Nature
                          </label>
                          <select
                            id={`${baseId}-out-cat-${out.id}`}
                            value={out.isEssential ? 'essential' : 'discretionary'}
                            onChange={(e) => handleUpdateOutflow(out.id, 'isEssential', e.target.value === 'essential')}
                            className="input-select"
                          >
                            <option value="essential">Essential (Mandatory)</option>
                            <option value="discretionary">Discretionary (Lifestyle)</option>
                          </select>
                        </div>

                        <div className="field-group flex-1">
                          <label htmlFor={`${baseId}-out-amt-${out.id}`} className="field-label">
                            Monthly Outflow (₹)
                          </label>
                          <input
                            id={`${baseId}-out-amt-${out.id}`}
                            type="text"
                            inputMode="numeric"
                            value={out.amount}
                            onChange={(e) => handleUpdateOutflow(out.id, 'amount', e.target.value)}
                            className={`input-num ${outflowErrors[idx] ? 'input-error' : ''}`}
                            placeholder="e.g. 40000"
                          />
                        </div>

                        <button
                          type="button"
                          id={`remove-out-${out.id}`}
                          onClick={() => handleRemoveOutflow(out.id)}
                          className="btn-remove"
                          title="Remove this outflow row"
                          aria-label={`Remove outflow ${out.label}`}
                        >
                          ✕
                        </button>
                      </div>
                      {outflowErrors[idx] && (
                        <p className="row-error">Please enter a valid non-negative rupee amount and a label.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Stage 1 Summary Card */}
          <div className="stage-live-summary">
            <h4 className="summary-title">Stage 1 Live Cash Flow Subtotals</h4>
            {statementResult ? (
              <div className="summary-cards-grid">
                <div className="metric-pill">
                  <span className="metric-label">Monthly Take-Home Income</span>
                  <span className="metric-val text-brand">{formatINR(statementResult.cashFlow.totalMonthlyTakeHomeIncome)}</span>
                </div>
                <div className="metric-pill">
                  <span className="metric-label">Total Outflows (Essential + Discretionary)</span>
                  <span className="metric-val">{formatINR(statementResult.cashFlow.totalMonthlyOutflows)}</span>
                  <span className="metric-subtext">
                    Essential: {formatINR(statementResult.cashFlow.essentialMonthlyOutflows)} | Lifestyle: {formatINR(statementResult.cashFlow.discretionaryMonthlyOutflows)}
                  </span>
                </div>
                <div className="metric-pill">
                  <span className="metric-label">Monthly Cash Flow Surplus / Deficit</span>
                  <span className={`metric-val ${statementResult.cashFlow.monthlySurplus >= 0 ? 'text-success' : 'text-danger'}`}>
                    {statementResult.cashFlow.monthlySurplus < 0 ? '-' : ''}
                    {formatINR(Math.abs(statementResult.cashFlow.monthlySurplus))}
                  </span>
                  <span className="metric-subtext">
                    {statementResult.cashFlow.monthlySurplus >= 0 ? 'Net positive monthly cash' : 'Household operating in monthly deficit'}
                  </span>
                </div>
                <div className="metric-pill">
                  <span className="metric-label">Family Savings Rate</span>
                  <span className="metric-val text-accent">
                    {statementResult.cashFlow.savingsRate !== null
                      ? formatPercentage(statementResult.cashFlow.savingsRate * 100, 1)
                      : 'Not available'}
                  </span>
                  <span className="metric-subtext">
                    {statementResult.cashFlow.savingsRate !== null
                      ? 'Surplus as % of take-home income'
                      : 'Zero income recorded'}
                  </span>
                </div>
              </div>
            ) : !hasDataEntered ? (
              <p className="summary-pending">Enter your monthly figures or click <strong>Load Urban Family Example</strong> to view cash flow results.</p>
            ) : (
              <p className="summary-pending">Please correct invalid input amounts above to compute cash flow totals.</p>
            )}
          </div>

          <div className="wizard-actions">
            <button
              type="button"
              id="continue-to-stage-2-btn"
              onClick={() => setCurrentStage(2)}
              className="btn-primary"
            >
              Continue to Stage 2: Liquid & Safety Assets →
            </button>
          </div>
        </section>
      )}

      {/* STAGE 2: LIQUID & SAFETY ASSETS */}
      {currentStage === 2 && (
        <section className="stage-section" aria-labelledby="stage-2-title">
          <header className="stage-header">
            <span className="stage-eyebrow">Stage 2 of 4</span>
            <h2 id="stage-2-title" className="stage-title">Liquid & Safety Assets</h2>
            <p className="stage-description">
              Emergency reserves protect your household against unforeseen job disruption, medical emergencies, or critical repairs.
              Only count holdings you can access <strong>immediately without exit penalties, market collapse, or regulatory lock-in</strong>.
            </p>
            <div className="why-we-ask-callout">
              <span className="why-badge">Why we ask</span>
              <p className="why-text">
                Liquid emergency reserves must be readily accessible in a crisis without regulatory penalties or selling primary assets, determining your true safety runway in months.
              </p>
            </div>
          </header>

          <div className="notice-box">
            <h4 className="notice-title">Accessibility Rule for Emergency Safety Reserves</h4>
            <p className="notice-text">
              Fixed deposits and debt instruments carry lock-in periods or premature withdrawal penalties depending on bank terms.
              Instruments like <strong>EPF, PPF, NPS, lock-in funds, primary residence, and jewellery are strictly excluded</strong> from emergency cash.
              Check the &ldquo;Accessible for immediate emergencies&rdquo; box only for funds available within 24–48 hours.
            </p>
          </div>

          <div className="table-block">
            <div className="table-header-row">
              <h3 className="table-heading">Liquid Holdings & Emergency Bank Reserves</h3>
              <button type="button" id="add-stage-2-asset-btn" onClick={() => handleAddAsset(2)} className="btn-add">
                + Add Liquid / Reserve Holding
              </button>
            </div>

            <div className="rows-container">
              {assets
                .filter((a) => a.stage === 2)
                .map((ast) => {
                  const idx = assets.findIndex((x) => x.id === ast.id);
                  return (
                    <div key={ast.id} className="item-row">
                      <div className="row-fields">
                        <div className="field-group flex-2">
                          <label htmlFor={`${baseId}-ast-label-${ast.id}`} className="field-label">
                            Asset / Holding Name
                          </label>
                          <input
                            id={`${baseId}-ast-label-${ast.id}`}
                            type="text"
                            value={ast.label}
                            onChange={(e) => handleUpdateAsset(ast.id, 'label', e.target.value)}
                            className="input-text"
                            placeholder="e.g. HDFC Savings Bank, ICICI Liquid Fund"
                          />
                        </div>

                        <div className="field-group flex-1">
                          <label htmlFor={`${baseId}-ast-grp-${ast.id}`} className="field-label">
                            Asset Type
                          </label>
                          <select
                            id={`${baseId}-ast-grp-${ast.id}`}
                            value={ast.group}
                            onChange={(e) => handleUpdateAsset(ast.id, 'group', e.target.value as AssetGroup)}
                            className="input-select"
                          >
                            <option value="CASH_RESERVES">Cash / Bank Savings</option>
                            <option value="FINANCIAL_INVESTMENT">Fixed Deposit / Liquid Fund</option>
                          </select>
                        </div>

                        <div className="field-group flex-1">
                          <label htmlFor={`${baseId}-ast-val-${ast.id}`} className="field-label">
                            Estimated Value (₹)
                          </label>
                          <input
                            id={`${baseId}-ast-val-${ast.id}`}
                            type="text"
                            inputMode="numeric"
                            value={ast.value}
                            onChange={(e) => handleUpdateAsset(ast.id, 'value', e.target.value)}
                            className={`input-num ${assetErrors[idx] ? 'input-error' : ''}`}
                            placeholder="e.g. 250000"
                          />
                        </div>

                        <button
                          type="button"
                          id={`remove-ast-${ast.id}`}
                          onClick={() => handleRemoveAsset(ast.id)}
                          className="btn-remove"
                          title="Remove this asset"
                          aria-label={`Remove asset ${ast.label}`}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Explicit Accessibility Selector */}
                      {ast.group === 'CASH_RESERVES' || ast.group === 'FINANCIAL_INVESTMENT' ? (
                        <div className="checkbox-row">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={ast.isAccessibleSafetyReserve}
                              onChange={(e) => handleUpdateAsset(ast.id, 'isAccessibleSafetyReserve', e.target.checked)}
                              className="input-checkbox"
                            />
                            <span>Count as readily accessible for family emergencies (available within 24–48 hours)</span>
                          </label>
                        </div>
                      ) : (
                        <div className="checkbox-row disabled-notice">
                          <span className="text-muted text-sm">
                            {ast.group === 'PRODUCTIVE_PROPERTY'
                              ? 'Productive property / real estate cannot be counted as an immediate emergency safety reserve due to liquidation friction.'
                              : ast.group === 'RETIREMENT_RESTRICTED'
                              ? 'Restricted retirement holdings (EPF, PPF, NPS) cannot be counted as immediate emergency safety reserves.'
                              : 'Personal-use physical assets cannot be counted as immediate emergency safety reserves.'}
                          </span>
                        </div>
                      )}

                      {assetErrors[idx] && (
                        <p className="row-error">Please enter a valid non-negative estimated value and a label.</p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Live Stage 2 Summary Card */}
          <div className="stage-live-summary">
            <h4 className="summary-title">Stage 2 Live Safety Reserve Metrics</h4>
            {statementResult ? (
              <div className="summary-cards-grid">
                <div className="metric-pill">
                  <span className="metric-label">Accessible Safety Reserves</span>
                  <span className="metric-val text-brand">{formatINR(statementResult.assetConsolidation.accessibleSafetyReserves)}</span>
                  <span className="metric-subtext">Sum of holdings marked as readily accessible</span>
                </div>
                <div className="metric-pill">
                  <span className="metric-label">Essential Monthly Outflows</span>
                  <span className="metric-val">{formatINR(statementResult.cashFlow.essentialMonthlyOutflows)}</span>
                  <span className="metric-subtext">Derived from Stage 1 mandatory living costs</span>
                </div>
                <div className="metric-pill">
                  <span className="metric-label">Emergency Runway</span>
                  <span className="metric-val text-accent">
                    {statementResult.assetConsolidation.emergencyRunwayMonths !== null
                      ? `${statementResult.assetConsolidation.emergencyRunwayMonths.toFixed(1)} Months`
                      : 'Not available'}
                  </span>
                  <span className="metric-subtext">
                    {statementResult.assetConsolidation.emergencyRunwayMonths !== null
                      ? 'Accessible reserves ÷ essential monthly outflows'
                      : 'Zero essential outflows recorded'}
                  </span>
                </div>
              </div>
            ) : !hasDataEntered ? (
              <p className="summary-pending">Enter your liquid asset holdings or click <strong>Load Urban Family Example</strong> to view reserve runway.</p>
            ) : (
              <p className="summary-pending">Please correct invalid input amounts to calculate runway.</p>
            )}
          </div>

          <div className="wizard-actions-split">
            <button
              type="button"
              id="back-to-stage-1-btn"
              onClick={() => setCurrentStage(1)}
              className="btn-secondary"
            >
              ← Back to Stage 1: Cash Flow
            </button>
            <button
              type="button"
              id="continue-to-stage-3-btn"
              onClick={() => setCurrentStage(3)}
              className="btn-primary"
            >
              Continue to Stage 3: Growth Capital & Property →
            </button>
          </div>
        </section>
      )}

      {/* STAGE 3: GROWTH CAPITAL & PROPERTY */}
      {currentStage === 3 && (
        <section className="stage-section" aria-labelledby="stage-3-title">
          <header className="stage-header">
            <span className="stage-eyebrow">Stage 3 of 4</span>
            <h2 id="stage-3-title" className="stage-title">Growth Capital & Property</h2>
            <p className="stage-description">
              Distinguish your <strong>productive investments</strong> (equity funds, stocks, PF, rental real estate) from
              <strong> personal consumption assets</strong> (your primary home, private vehicle, jewellery).
              All figures are user-entered estimates.
            </p>
            <div className="why-we-ask-callout">
              <span className="why-badge">Why we ask</span>
              <p className="why-text">
                Separating income-generating investments from personal consumption property clarifies what capital is actively compounding for future milestones versus what provides day-to-day shelter and utility.
              </p>
            </div>
          </header>

          <div className="table-block">
            <div className="table-header-row">
              <h3 className="table-heading">Investments, Retirement Holdings & Property</h3>
              <button type="button" id="add-stage-3-asset-btn" onClick={() => handleAddAsset(3)} className="btn-add">
                + Add Investment / Property
              </button>
            </div>

            <div className="rows-container">
              {assets
                .filter((a) => a.stage === 3)
                .map((ast) => {
                  const idx = assets.findIndex((x) => x.id === ast.id);
                  return (
                    <div key={ast.id} className="item-row">
                      <div className="row-fields">
                        <div className="field-group flex-2">
                          <label htmlFor={`${baseId}-ast-label-${ast.id}`} className="field-label">
                            Asset / Holding Description
                          </label>
                          <input
                            id={`${baseId}-ast-label-${ast.id}`}
                            type="text"
                            value={ast.label}
                            onChange={(e) => handleUpdateAsset(ast.id, 'label', e.target.value)}
                            className="input-text"
                            placeholder="e.g. Parag Parikh Flexi Cap, Bangalore Apartment"
                          />
                        </div>

                        <div className="field-group flex-1">
                          <label htmlFor={`${baseId}-ast-grp-${ast.id}`} className="field-label">
                            Asset Category
                          </label>
                          <select
                            id={`${baseId}-ast-grp-${ast.id}`}
                            value={ast.group}
                            onChange={(e) => handleUpdateAsset(ast.id, 'group', e.target.value as AssetGroup)}
                            className="input-select"
                          >
                            <option value="FINANCIAL_INVESTMENT">Mutual Funds & Shares</option>
                            <option value="RETIREMENT_RESTRICTED">EPF / PPF / NPS (Retirement)</option>
                            <option value="PERSONAL_PHYSICAL">Primary Residence / Vehicle / Jewellery</option>
                            <option value="PRODUCTIVE_PROPERTY">Rental / Commercial Property</option>
                          </select>
                        </div>

                        <div className="field-group flex-1">
                          <label htmlFor={`${baseId}-ast-purp-${ast.id}`} className="field-label">
                            Asset Purpose
                          </label>
                          <select
                            id={`${baseId}-ast-purp-${ast.id}`}
                            value={ast.purpose}
                            disabled={ast.group === 'PERSONAL_PHYSICAL' || ast.group === 'PRODUCTIVE_PROPERTY'}
                            onChange={(e) => handleUpdateAsset(ast.id, 'purpose', e.target.value as AssetPurpose)}
                            className="input-select"
                          >
                            <option value="PRODUCTIVE">Productive (Generates Wealth/Income)</option>
                            <option value="PERSONAL_USE">Personal Use (Consumption / Utility)</option>
                          </select>
                        </div>

                        <div className="field-group flex-1">
                          <label htmlFor={`${baseId}-ast-val-${ast.id}`} className="field-label">
                            Estimated Value (₹)
                          </label>
                          <input
                            id={`${baseId}-ast-val-${ast.id}`}
                            type="text"
                            inputMode="numeric"
                            value={ast.value}
                            onChange={(e) => handleUpdateAsset(ast.id, 'value', e.target.value)}
                            className={`input-num ${assetErrors[idx] ? 'input-error' : ''}`}
                            placeholder="e.g. 1500000"
                          />
                        </div>

                        <button
                          type="button"
                          id={`remove-ast-${ast.id}`}
                          onClick={() => handleRemoveAsset(ast.id)}
                          className="btn-remove"
                          title="Remove this asset"
                          aria-label={`Remove asset ${ast.label}`}
                        >
                          ✕
                        </button>
                      </div>
                      {assetErrors[idx] && (
                        <p className="row-error">Please enter a valid non-negative estimated value and a label.</p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Live Stage 3 Summary Card */}
          <div className="stage-live-summary">
            <h4 className="summary-title">Stage 3 Live Assets Subtotals</h4>
            {statementResult ? (
              <div className="summary-cards-grid">
                <div className="metric-pill">
                  <span className="metric-label">Total Household Assets</span>
                  <span className="metric-val text-brand">{formatINR(statementResult.assetConsolidation.totalAssets)}</span>
                  <span className="metric-subtext">Sum of all entered liquid, invested, and physical holdings</span>
                </div>
                <div className="metric-pill">
                  <span className="metric-label">Productive Wealth (Investable / Yielding)</span>
                  <span className="metric-val text-success">{formatINR(statementResult.assetConsolidation.productiveAssets)}</span>
                  <span className="metric-subtext">Cash, mutual funds, stocks, PF, and rental properties</span>
                </div>
                <div className="metric-pill">
                  <span className="metric-label">Personal Consumption Assets</span>
                  <span className="metric-val text-muted">{formatINR(statementResult.assetConsolidation.personalConsumptionAssets)}</span>
                  <span className="metric-subtext">Primary residence, personal cars, and jewellery</span>
                </div>
              </div>
            ) : !hasDataEntered ? (
              <p className="summary-pending">Enter your investment and property holdings or click <strong>Load Urban Family Example</strong> to view asset totals.</p>
            ) : (
              <p className="summary-pending">Please correct invalid input amounts to calculate asset totals.</p>
            )}
          </div>

          <div className="wizard-actions-split">
            <button
              type="button"
              id="back-to-stage-2-btn"
              onClick={() => setCurrentStage(2)}
              className="btn-secondary"
            >
              ← Back to Stage 2: Liquid Assets
            </button>
            <button
              type="button"
              id="continue-to-stage-4-btn"
              onClick={() => setCurrentStage(4)}
              className="btn-primary"
            >
              Continue to Stage 4: Liabilities & Final Review →
            </button>
          </div>
        </section>
      )}

      {/* STAGE 4: LIABILITIES & NET WORTH REVIEW */}
      {currentStage === 4 && (
        <section className="stage-section" aria-labelledby="stage-4-title">
          <header className="stage-header">
            <span className="stage-eyebrow">Stage 4 of 4</span>
            <h2 id="stage-4-title" className="stage-title">Liabilities & Net Worth Review</h2>
            <p className="stage-description">
              Record current outstanding loan balances and review your consolidated household balance sheet.
              Enter <strong>current outstanding principal</strong>, not original sanctioned loan amounts.
            </p>
            <div className="why-we-ask-callout">
              <span className="why-badge">Why we ask</span>
              <p className="why-text">
                Consolidating outstanding debts against total and productive assets reveals your household's solvency ratio, debt-to-asset balance, and true productive net worth.
              </p>
            </div>
          </header>

          <div className="table-block">
            <div className="table-header-row">
              <h3 className="table-heading">Household Debts & Outstanding Liabilities</h3>
              <button type="button" id="add-liability-btn" onClick={handleAddLiability} className="btn-add">
                + Add Liability
              </button>
            </div>

            {liabilities.length === 0 ? (
              <div className="empty-state">No liabilities recorded. If you are 100% debt-free, proceed directly to the balance sheet review below.</div>
            ) : (
              <div className="rows-container">
                {liabilities.map((lia, idx) => (
                  <div key={lia.id} className="item-row">
                    <div className="row-fields">
                      <div className="field-group flex-2">
                        <label htmlFor={`${baseId}-lia-label-${lia.id}`} className="field-label">
                          Loan / Liability Description
                        </label>
                        <input
                          id={`${baseId}-lia-label-${lia.id}`}
                          type="text"
                          value={lia.label}
                          onChange={(e) => handleUpdateLiability(lia.id, 'label', e.target.value)}
                          className="input-text"
                          placeholder="e.g. SBI Home Loan, Auto Loan, Credit Card"
                        />
                      </div>

                      <div className="field-group flex-1">
                        <label htmlFor={`${baseId}-lia-cat-${lia.id}`} className="field-label">
                          Debt Type
                        </label>
                        <select
                          id={`${baseId}-lia-cat-${lia.id}`}
                          value={lia.category}
                          onChange={(e) => handleUpdateLiability(lia.id, 'category', e.target.value as StatementLiabilityCategory)}
                          className="input-select"
                        >
                          <option value="SECURED">Secured (Home / Auto Mortgage)</option>
                          <option value="UNSECURED">Unsecured (Personal / Card / Education)</option>
                        </select>
                      </div>

                      <div className="field-group flex-1">
                        <label htmlFor={`${baseId}-lia-bal-${lia.id}`} className="field-label">
                          Outstanding Balance (₹)
                        </label>
                        <input
                          id={`${baseId}-lia-bal-${lia.id}`}
                          type="text"
                          inputMode="numeric"
                          value={lia.balance}
                          onChange={(e) => handleUpdateLiability(lia.id, 'balance', e.target.value)}
                          className={`input-num ${liabilityErrors[idx] ? 'input-error' : ''}`}
                          placeholder="e.g. 4200000"
                        />
                      </div>

                      <div className="field-group flex-1">
                        <label htmlFor={`${baseId}-lia-emi-${lia.id}`} className="field-label">
                          Monthly EMI (₹, ref)
                        </label>
                        <input
                          id={`${baseId}-lia-emi-${lia.id}`}
                          type="text"
                          inputMode="numeric"
                          value={lia.monthlyEmi}
                          onChange={(e) => handleUpdateLiability(lia.id, 'monthlyEmi', e.target.value)}
                          className="input-num"
                          placeholder="e.g. 50000"
                        />
                      </div>

                      <button
                        type="button"
                        id={`remove-lia-${lia.id}`}
                        onClick={() => handleRemoveLiability(lia.id)}
                        className="btn-remove"
                        title="Remove this liability"
                        aria-label={`Remove liability ${lia.label}`}
                      >
                        ✕
                      </button>
                    </div>
                    {liabilityErrors[idx] && (
                      <p className="row-error">Please enter a valid non-negative outstanding balance and a label.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FINAL REVIEW DASHBOARD */}
          {statementResult ? (
            <div className="final-review-dashboard" id="final-statement-results">
              {/* Mobile Headline Callout: Measurable at 360px & 390px */}
              <div className="mobile-headline-card" id="real-statement-mobile-headline-box">
                <span className="headline-eyebrow">Accounting Net Worth</span>
                <span className="headline-val" id="real-statement-headline-val" data-testid="real-statement-headline-val">
                  {statementResult.accountingNetWorth < 0 ? '-' : ''}
                  {formatINR(Math.abs(statementResult.accountingNetWorth))}
                </span>
                <span className="headline-sub">
                  Total assets ({formatINR(statementResult.assetConsolidation.totalAssets)}) minus total liabilities ({formatINR(statementResult.liabilityConsolidation.totalLiabilities)})
                </span>
              </div>

              {isExampleLoaded && (
                <div className="example-callout-banner" role="status" aria-live="polite">
                  <span className="example-callout-badge">Illustrative Example</span>
                  <p className="example-callout-text">
                    <strong>Illustrative example loaded — these are not your figures.</strong> Any adjustments you make will recalculate the balance sheet in memory.
                  </p>
                </div>
              )}
              <div className="results-header">
                <div className="results-header-title-row">
                  <h3 className="results-title">Consolidated Household Balance Sheet</h3>
                  {isExampleLoaded && (
                    <span className="dataset-source-tag">Illustrative Sample</span>
                  )}
                </div>
                <p className="results-subtext">
                  Direct mathematical consolidation of assets and liabilities. Figures reflect user-entered estimates.
                </p>
              </div>

              {/* Primary Balance Sheet Formula Card */}
              <div className="balance-sheet-equation-card">
                <div className="eq-column">
                  <span className="eq-label">Total Household Assets</span>
                  <span className="eq-value text-brand">{formatINR(statementResult.assetConsolidation.totalAssets)}</span>
                </div>
                <div className="eq-operator">−</div>
                <div className="eq-column">
                  <span className="eq-label">Total Liabilities</span>
                  <span className="eq-value text-danger">{formatINR(statementResult.liabilityConsolidation.totalLiabilities)}</span>
                </div>
                <div className="eq-operator">=</div>
                <div className="eq-column highlight">
                  <span className="eq-label">Accounting Net Worth</span>
                  <span className="eq-value text-primary">{formatINR(statementResult.accountingNetWorth)}</span>
                </div>
              </div>

              {/* Productive-Asset-Adjusted Net Worth Deep Dive Card */}
              <div className="productive-nw-card">
                <div className="card-badge">Supplementary Diagnostic View</div>
                <h4 className="card-headline">Productive-Asset-Adjusted Net Worth</h4>
                <div className="card-metrics-row">
                  <div className="sub-metric">
                    <span className="label">Productive Assets</span>
                    <span className="val">{formatINR(statementResult.assetConsolidation.productiveAssets)}</span>
                  </div>
                  <div className="sub-metric">
                    <span className="label">Less All Liabilities</span>
                    <span className="val text-danger">−{formatINR(statementResult.liabilityConsolidation.totalLiabilities)}</span>
                  </div>
                  <div className="sub-metric total">
                    <span className="label">Productive Net Worth</span>
                    <span className={`val ${statementResult.productiveAssetAdjustedNetWorth >= 0 ? 'text-success' : 'text-danger'}`}>
                      {statementResult.productiveAssetAdjustedNetWorth < 0 ? '-' : ''}
                      {formatINR(Math.abs(statementResult.productiveAssetAdjustedNetWorth))}
                    </span>
                  </div>
                </div>
                <p className="card-explanation">
                  <strong>Why this matters:</strong> Standard accounting net worth includes your self-occupied primary home and private vehicles (₹{formatINR(statementResult.assetConsolidation.personalConsumptionAssets)}).
                  However, you cannot draw an income from your home without selling it. Productive net worth represents wealth actively compounding in financial markets, deposits, and income-producing real estate minus all family debt.
                </p>
              </div>

              {/* Summary Solvency & Cash Flow Grid */}
              <div className="review-metrics-grid">
                <div className="review-metric-box">
                  <span className="box-label">Debt-to-Asset Ratio</span>
                  <span className="box-val">
                    {statementResult.debtToAssetRatio !== null
                      ? formatPercentage(statementResult.debtToAssetRatio * 100, 1)
                      : 'Not available'}
                  </span>
                  <span className="box-note">
                    {statementResult.debtToAssetRatio !== null
                      ? `Liabilities form ${(statementResult.debtToAssetRatio * 100).toFixed(1)}% of total assets`
                      : 'Zero assets recorded'}
                  </span>
                </div>

                <div className="review-metric-box">
                  <span className="box-label">Emergency Safety Runway</span>
                  <span className="box-val text-accent">
                    {statementResult.assetConsolidation.emergencyRunwayMonths !== null
                      ? `${statementResult.assetConsolidation.emergencyRunwayMonths.toFixed(1)} Months`
                      : 'Not available'}
                  </span>
                  <span className="box-note">
                    ₹{formatINR(statementResult.assetConsolidation.accessibleSafetyReserves)} reserves vs ₹{formatINR(statementResult.cashFlow.essentialMonthlyOutflows)}/mo essentials
                  </span>
                </div>

                <div className="review-metric-box">
                  <span className="box-label">Monthly Surplus / Deficit</span>
                  <span className={`box-val ${statementResult.cashFlow.monthlySurplus >= 0 ? 'text-success' : 'text-danger'}`}>
                    {statementResult.cashFlow.monthlySurplus < 0 ? '-' : ''}
                    {formatINR(Math.abs(statementResult.cashFlow.monthlySurplus))}
                  </span>
                  <span className="box-note">
                    Savings rate: {statementResult.cashFlow.savingsRate !== null ? formatPercentage(statementResult.cashFlow.savingsRate * 100, 1) : 'Not available'}
                  </span>
                </div>
              </div>

              {/* Stage Jump Links (Preserves all in-memory inputs) */}
              <div className="stage-jump-strip">
                <span className="jump-title">Need to adjust figures?</span>
                <div className="jump-buttons">
                  <button type="button" onClick={() => setCurrentStage(1)} className="btn-jump">
                    ✏️ Edit Cash Flow (Stage 1)
                  </button>
                  <button type="button" onClick={() => setCurrentStage(2)} className="btn-jump">
                    ✏️ Edit Liquid Reserves (Stage 2)
                  </button>
                  <button type="button" onClick={() => setCurrentStage(3)} className="btn-jump">
                    ✏️ Edit Growth Capital (Stage 3)
                  </button>
                </div>
              </div>

              {/* Reciprocal Quick Net Worth Link */}
              <div className="reciprocal-quick-card">
                <div className="reciprocal-card-top">
                  <span className="reciprocal-badge">Alternative Tool</span>
                  <span className="reciprocal-time">2-Min Diagnostic</span>
                </div>
                <h4 className="reciprocal-title">Want a shorter asset-and-debt snapshot?</h4>
                <p className="reciprocal-desc">
                  Open Quick Net Worth to calculate your accounting and productive liquid net worth in two minutes without itemizing cash flows.
                </p>
                <a href="/tools/net-worth/" className="btn-reciprocal-link">
                  Open Quick Net Worth →
                </a>
              </div>

              {/* Statutory Disclosure Notice */}
              <footer className="disclosure-box">
                <h5 className="disclosure-title">Statutory &amp; Methodological Disclosure</h5>
                <p className="disclosure-text">
                  This Personal Finance Statement is generated solely from values and classifications provided by the user.
                  It is not an audit, credit assessment, formal net worth certification, or personal financial recommendation.
                  Asset valuations are user estimates and may not reflect current liquidation value after transaction costs, capital gains taxes, or market fluctuations.
                  Mutual fund investments are subject to market risks; read all scheme-related documents carefully.
                </p>
              </footer>
            </div>
          ) : (
            <div className="stage-live-summary" id="final-statement-results">
              <p className="summary-pending">
                {!hasDataEntered
                  ? 'No financial figures entered yet. Enter your income, assets, and liabilities across Stages 1–4, or click Load Urban Family Example to view an illustrative household balance sheet.'
                  : 'Please correct invalid input amounts in earlier stages to view the final statement.'}
              </p>
            </div>
          )}

          <div className="wizard-actions-split">
            <button
              type="button"
              id="back-to-stage-3-btn"
              onClick={() => setCurrentStage(3)}
              className="btn-secondary"
            >
              ← Back to Stage 3: Growth Capital
            </button>
            <button
              type="button"
              id="final-clear-all-btn"
              onClick={handleStartOver}
              className="btn-danger-outline"
            >
              Clear all entries / Start over
            </button>
          </div>
        </section>
      )}

      {/* Embedded CSS conforming to design tokens */}
      <style>{`
        .real-statement-wrapper {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          max-width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .stage-nav-strip {
          background-color: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-3);
          box-shadow: var(--shadow-subtle);
          box-sizing: border-box;
          max-width: 100%;
        }

        .stage-steps-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-2);
        }

        @media (min-width: 540px) {
          .stage-steps-list {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 900px) {
          .stage-steps-list {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stage-step-btn {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          font-family: inherit;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          box-sizing: border-box;
          min-width: 0;
        }

        .stage-step-btn:hover {
          background-color: var(--primitive-slate-100);
        }

        .stage-step-btn.active {
          background-color: var(--color-brand-primary);
          color: var(--primitive-white);
          font-weight: 700;
        }

        .stage-step-btn.completed:not(.active) {
          background-color: var(--primitive-teal-50);
          color: var(--color-text-brand);
          border-color: var(--primitive-teal-100);
        }

        .step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 0.8rem;
          font-weight: 800;
          background-color: rgba(0, 0, 0, 0.08);
          flex-shrink: 0;
        }

        .stage-step-btn.active .step-num {
          background-color: var(--primitive-white);
          color: var(--color-brand-primary);
        }

        .step-label {
          font-size: var(--text-body-sm);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: normal;
          word-break: break-word;
          line-height: 1.25;
        }

        .privacy-banner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          background-color: var(--primitive-slate-50);
          border: 1px dashed var(--color-border-medium);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          box-sizing: border-box;
          max-width: 100%;
        }

        .privacy-badge {
          font-size: var(--text-caption);
          font-weight: 700;
          color: var(--color-brand-primary);
          background-color: var(--primitive-white);
          padding: 0.2rem 0.5rem;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }

        .privacy-text {
          font-size: var(--text-caption);
          color: var(--color-text-secondary);
          margin: 0;
          flex: 1 1 200px;
        }

        .privacy-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          width: 100%;
        }

        @media (min-width: 600px) {
          .privacy-actions {
            width: auto;
          }
        }

        .example-loaded-banner {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background-color: #fefce8;
          border: 1px solid #fef08a;
          border-left: 4px solid var(--color-brand-accent);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          margin-top: var(--space-2);
          box-sizing: border-box;
        }

        .example-banner-badge {
          font-size: var(--text-caption);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-brand-primary);
          background-color: var(--primitive-white);
          padding: 0.2rem 0.5rem;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }

        .example-banner-text {
          font-size: var(--text-body-sm);
          color: var(--color-text-primary);
          margin: 0;
          line-height: 1.4;
        }

        .example-callout-banner {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background-color: #fefce8;
          border: 1px solid #fef08a;
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          margin-bottom: var(--space-4);
        }

        .example-callout-badge {
          font-size: var(--text-caption);
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-brand-primary);
          background-color: var(--primitive-white);
          padding: 0.2rem 0.5rem;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }

        .example-callout-text {
          font-size: var(--text-body-sm);
          color: var(--color-text-primary);
          margin: 0;
        }

        .why-we-ask-callout {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          background-color: var(--primitive-teal-50, #f0fdfa);
          border: 1px solid var(--primitive-teal-200, #99f6e4);
          border-left: 3px solid var(--color-brand-accent, #16877E);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-2) var(--space-3);
          margin-top: var(--space-3);
        }

        .why-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-brand-accent, #16877E);
          background-color: #ffffff;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-sm, 4px);
          border: 1px solid var(--primitive-teal-200, #99f6e4);
          flex-shrink: 0;
        }

        .why-text {
          font-size: 0.8rem;
          color: var(--color-text-secondary, #334155);
          margin: 0;
          line-height: 1.45;
        }

        .custom-loaded-banner {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 4px solid var(--color-brand-accent, #16877E);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-2) var(--space-3);
          margin-top: var(--space-2);
          box-sizing: border-box;
        }

        .custom-banner-badge {
          font-size: var(--text-caption);
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-brand-accent, #16877E);
          background-color: #ffffff;
          padding: 0.15rem 0.45rem;
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }

        .custom-banner-text {
          font-size: var(--text-body-sm);
          color: var(--color-text-secondary);
          margin: 0;
        }

        .mobile-headline-card {
          background: linear-gradient(135deg, #173047 0%, #132A40 100%);
          color: #ffffff;
          padding: var(--space-4);
          border-radius: var(--radius-md);
          box-shadow: 0 4px 12px rgba(23, 48, 71, 0.12);
          margin-bottom: var(--space-4);
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

        .reciprocal-quick-card {
          background-color: var(--primitive-teal-50, #f0fdfa);
          border: 1px solid var(--primitive-teal-200, #99f6e4);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-4);
          margin-top: var(--space-4);
        }

        .reciprocal-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .reciprocal-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-brand-accent, #16877E);
          background-color: #ffffff;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-pill, 9999px);
        }

        .reciprocal-time {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--color-brand-primary, #173047);
        }

        .reciprocal-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          margin: 0 0 4px 0;
        }

        .reciprocal-desc {
          font-size: 0.8rem;
          color: var(--color-text-secondary, #475569);
          margin: 0 0 var(--space-3) 0;
          line-height: 1.45;
        }

        .btn-reciprocal-link {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--color-brand-accent, #16877E);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          min-height: 40px;
        }

        .btn-reciprocal-link:hover {
          text-decoration: underline;
        }

        .results-header-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .dataset-source-tag {
          font-size: var(--text-caption);
          font-weight: 700;
          background-color: #fef9c3;
          color: var(--color-text-brand);
          border: 1px solid #fde047;
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
        }

        .stage-section {
          background-color: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          box-shadow: var(--shadow-subtle);
          box-sizing: border-box;
          max-width: 100%;
        }

        @media (min-width: 640px) {
          .stage-section {
            padding: var(--space-6);
          }
        }

        .stage-header {
          margin-bottom: var(--space-6);
          border-bottom: 1px solid var(--color-border-subtle);
          padding-bottom: var(--space-4);
        }

        .stage-eyebrow {
          font-size: var(--text-caption);
          font-weight: 800;
          color: var(--color-text-brand);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: block;
          margin-bottom: var(--space-1);
        }

        .stage-title {
          font-size: var(--text-h3);
          font-family: var(--font-family-heading);
          font-weight: 700;
          color: var(--color-brand-primary);
          margin-bottom: var(--space-2);
        }

        .stage-description {
          font-size: var(--text-body-sm);
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin: 0;
          max-width: 800px;
        }

        .notice-box {
          background-color: var(--primitive-gold-50);
          border-left: 4px solid var(--primitive-gold-500);
          padding: var(--space-4);
          border-radius: var(--radius-sm);
          margin-bottom: var(--space-6);
          box-sizing: border-box;
        }

        .notice-title {
          font-size: var(--text-body-sm);
          font-weight: 700;
          color: var(--primitive-gold-700);
          margin-bottom: var(--space-1);
        }

        .notice-text {
          font-size: 0.85rem;
          color: var(--primitive-slate-700);
          line-height: 1.5;
          margin: 0;
        }

        .table-block {
          margin-bottom: var(--space-8);
          max-width: 100%;
        }

        .table-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .table-heading {
          font-size: var(--text-h4);
          font-weight: 700;
          color: var(--color-brand-primary);
          margin: 0;
        }

        .btn-group-tight {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .btn-add, .btn-add-secondary {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-pill);
          cursor: pointer;
          font-family: inherit;
          transition: all var(--transition-fast);
        }

        .btn-add {
          background-color: var(--primitive-teal-50);
          color: var(--color-text-brand);
          border: 1px solid var(--primitive-teal-100);
        }

        .btn-add:hover {
          background-color: var(--primitive-teal-100);
        }

        .btn-add-secondary {
          background-color: var(--primitive-slate-100);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border-subtle);
        }

        .btn-add-secondary:hover {
          background-color: var(--primitive-slate-200);
        }

        .rows-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-width: 100%;
        }

        .item-row {
          background-color: var(--primitive-slate-50);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          box-sizing: border-box;
          max-width: 100%;
        }

        .row-fields {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          box-sizing: border-box;
          max-width: 100%;
        }

        @media (min-width: 640px) {
          .row-fields {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: flex-end;
          }
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          width: 100%;
          box-sizing: border-box;
        }

        @media (min-width: 640px) {
          .flex-1 { flex: 1 1 140px; width: auto; }
          .flex-2 { flex: 2 1 200px; width: auto; }
        }

        .field-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .input-text, .input-select, .input-num {
          padding: 0.5rem 0.75rem;
          font-size: var(--text-body-sm);
          font-family: inherit;
          border: 1px solid var(--color-border-medium);
          border-radius: var(--radius-sm);
          background-color: var(--primitive-white);
          color: var(--color-brand-primary);
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
        }

        .input-num {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }

        .input-error {
          border-color: var(--primitive-rose-600, #E11D48);
          background-color: #FFF1F2;
        }

        .btn-remove {
          background: transparent;
          border: 1px solid var(--color-border-subtle);
          color: var(--color-text-secondary);
          border-radius: var(--radius-sm);
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all var(--transition-fast);
          align-self: flex-end;
        }

        .btn-remove:hover {
          background-color: #FEE2E2;
          color: #DC2626;
          border-color: #FCA5A5;
        }

        .checkbox-row {
          margin-top: var(--space-2);
          padding-top: var(--space-2);
          border-top: 1px dashed var(--color-border-subtle);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          cursor: pointer;
        }

        .input-checkbox {
          width: 16px;
          height: 16px;
          accent-color: var(--color-brand-primary);
        }

        .row-error {
          font-size: 0.75rem;
          color: #DC2626;
          margin: 0.35rem 0 0 0;
        }

        .empty-state {
          padding: var(--space-6);
          text-align: center;
          font-size: var(--text-body-sm);
          color: var(--color-text-secondary);
          background-color: var(--primitive-slate-50);
          border: 1px dashed var(--color-border-medium);
          border-radius: var(--radius-md);
        }

        .stage-live-summary {
          background-color: var(--primitive-slate-100);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          margin-top: var(--space-6);
        }

        .summary-title {
          font-size: var(--text-caption);
          font-weight: 700;
          color: var(--color-brand-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-3);
        }

        .summary-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3);
        }

        @media (min-width: 640px) {
          .summary-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .summary-cards-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .metric-pill {
          background-color: var(--primitive-white);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-sm);
          padding: var(--space-3);
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: 2px;
        }

        .metric-val {
          font-size: 1.15rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          line-height: 1.2;
        }

        .metric-subtext {
          font-size: 0.7rem;
          color: var(--color-text-secondary);
          margin-top: 4px;
        }

        .text-brand { color: var(--color-text-brand); }
        .text-success { color: var(--primitive-emerald-700); }
        .text-danger { color: #DC2626; }
        .text-accent { color: var(--color-text-accent); }
        .text-muted { color: var(--primitive-slate-600); }
        .text-primary { color: var(--color-brand-primary); }

        .summary-pending {
          font-size: var(--text-body-sm);
          color: var(--color-text-secondary);
          margin: 0;
        }

        .wizard-actions, .wizard-actions-split {
          display: flex;
          margin-top: var(--space-8);
          padding-top: var(--space-6);
          border-top: 1px solid var(--color-border-subtle);
        }

        .wizard-actions {
          justify-content: flex-end;
        }

        .wizard-actions-split {
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-3);
        }

        .btn-primary, .btn-secondary, .btn-danger-outline, .btn-secondary-sm, .btn-danger-sm {
          font-family: inherit;
          font-weight: 600;
          border-radius: var(--radius-pill);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-decoration: none;
        }

        .btn-primary {
          background-color: var(--color-brand-primary);
          color: var(--primitive-white);
          border: none;
          padding: 0.75rem 1.5rem;
          font-size: var(--text-body);
        }

        .btn-primary:hover {
          background-color: var(--primitive-navy-800);
        }

        .btn-secondary {
          background-color: transparent;
          color: var(--color-brand-primary);
          border: 1px solid var(--color-border-medium);
          padding: 0.75rem 1.5rem;
          font-size: var(--text-body);
        }

        .btn-secondary:hover {
          background-color: var(--primitive-slate-100);
        }

        .btn-danger-outline {
          background-color: transparent;
          color: #DC2626;
          border: 1px solid #FCA5A5;
          padding: 0.75rem 1.25rem;
          font-size: var(--text-body-sm);
        }

        .btn-danger-outline:hover {
          background-color: #FEE2E2;
        }

        .btn-secondary-sm {
          background-color: var(--primitive-white);
          color: var(--color-text-brand);
          border: 1px solid var(--color-border-medium);
          padding: 0.25rem 0.65rem;
          font-size: var(--text-caption);
        }

        .btn-danger-sm {
          background-color: transparent;
          color: #DC2626;
          border: 1px solid #FCA5A5;
          padding: 0.25rem 0.65rem;
          font-size: var(--text-caption);
        }

        /* FINAL REVIEW STYLING */
        .final-review-dashboard {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          margin-top: var(--space-8);
          border-top: 2px solid var(--color-border-subtle);
          padding-top: var(--space-8);
        }

        .results-header {
          text-align: center;
          max-width: 650px;
          margin: 0 auto;
        }

        .results-title {
          font-size: var(--text-h2);
          font-family: var(--font-family-heading);
          font-weight: 700;
          color: var(--color-brand-primary);
          margin-bottom: var(--space-2);
        }

        .results-subtext {
          font-size: var(--text-body-sm);
          color: var(--color-text-secondary);
          margin: 0;
        }

        .balance-sheet-equation-card {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-around;
          background: linear-gradient(135deg, var(--primitive-navy-950) 0%, var(--primitive-navy-900) 100%);
          color: var(--primitive-white);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          gap: var(--space-4);
          text-align: center;
          box-shadow: var(--shadow-card);
        }

        .eq-column {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .eq-label {
          font-size: var(--text-caption);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.8;
        }

        .eq-value {
          font-size: 1.6rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }

        .eq-column.highlight .eq-value {
          color: var(--primitive-gold-400);
          font-size: 1.85rem;
        }

        .eq-operator {
          font-size: 2rem;
          font-weight: 700;
          opacity: 0.6;
        }

        .productive-nw-card {
          background-color: var(--primitive-teal-50);
          border: 1px solid var(--primitive-teal-100);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
        }

        .card-badge {
          font-size: var(--text-caption);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-brand);
          margin-bottom: var(--space-1);
        }

        .card-headline {
          font-size: var(--text-h3);
          font-family: var(--font-family-heading);
          font-weight: 700;
          color: var(--color-brand-primary);
          margin-bottom: var(--space-4);
        }

        .card-metrics-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3);
          background-color: var(--primitive-white);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          margin-bottom: var(--space-4);
        }

        @media (min-width: 640px) {
          .card-metrics-row {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .sub-metric {
          display: flex;
          flex-direction: column;
        }

        .sub-metric .label {
          font-size: var(--text-caption);
          color: var(--color-text-secondary);
        }

        .sub-metric .val {
          font-size: 1.25rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }

        .card-explanation {
          font-size: var(--text-body-sm);
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin: 0;
        }

        .review-metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        @media (min-width: 768px) {
          .review-metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .review-metric-box {
          background-color: var(--color-bg-surface);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
        }

        .box-label {
          font-size: var(--text-caption);
          font-weight: 700;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-1);
        }

        .box-val {
          font-size: 1.5rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          color: var(--color-brand-primary);
          margin-bottom: var(--space-1);
        }

        .box-note {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }

        .stage-jump-strip {
          background-color: var(--primitive-slate-50);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          align-items: center;
        }

        .jump-title {
          font-size: var(--text-body-sm);
          font-weight: 700;
          color: var(--color-brand-primary);
        }

        .jump-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          justify-content: center;
        }

        .btn-jump {
          font-size: var(--text-body-sm);
          font-weight: 600;
          background-color: var(--primitive-white);
          border: 1px solid var(--color-border-medium);
          border-radius: var(--radius-pill);
          padding: 0.4rem 0.9rem;
          cursor: pointer;
          font-family: inherit;
          transition: all var(--transition-fast);
        }

        .btn-jump:hover {
          background-color: var(--primitive-teal-50);
          border-color: var(--primitive-teal-100);
          color: var(--color-text-brand);
        }

        .disclosure-box {
          background-color: var(--primitive-slate-50);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }

        .disclosure-title {
          font-size: var(--text-caption);
          font-weight: 700;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-1);
        }

        .disclosure-text {
          font-size: 0.75rem;
          color: var(--primitive-slate-600);
          line-height: 1.5;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
