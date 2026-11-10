/**
 * Ant Wealth Creation — Personal Finance Statement Interactive Application
 *
 * Fully functional 6-Stage Household Financial Statement & Solvency Diagnostic.
 * Implements:
 * 1. Metadata setup (Client name, Spouse, Children, Statement date, Preparer)
 * 2. Sticky/Top live summary banner (Annual Inflow, Annual Expenses, Annual Savings, Total Assets, Total Liabilities, Actual Net Worth, Notional Net Worth)
 * 3. 6 Stages:
 *    - Stage 1: Income (Salary, Bonus, Business, Rental, Investments, Deductions, Net, Add Rows)
 *    - Stage 2: Expenses (Mode A Total Monthly vs Mode B Detailed Breakdown, Lifestyle, Dependents, Insurance, EMIs, Frequencies)
 *    - Stage 3: Savings & Ongoing Investments (Savings, SIPs/RDs/EPF, Surplus, 5-20 yr compounding projection)
 *    - Stage 4: Assets (6 classes: Liquid, Debt, Equity, Gold, Real Estate, Personal with Self/Spouse/Children ownership & Purpose)
 *    - Stage 5: Liabilities (Home, Vehicle, Personal, Education, Other, Credit Cards with ownership & Purpose)
 *    - Stage 6: Net Worth & Final Review (Solvency metrics, Dual Net Worth, Ratios, Notes, PDF Generation)
 * 4. 100% Client-side privacy & PDF Generation via generatePersonalFinanceStatementPdf
 */

import React, { useState, useId, useRef } from 'react';
import {
  calculateComprehensivePersonalFinanceStatement,
  createBlankPredefinedStatement,
  createSamplePredefinedStatement,
  type ComprehensiveStatementInputs,
  type PersonalFinanceStatementResult,
  type ExpenseFrequency,
  type ExpenseEntryMode,
  type AssetClass,
  type LiabilityType,
  type IncomeLineItem,
  type ExpenseLineItem,
  type OngoingInvestmentItem,
  type AssetLineItem,
  type LiabilityLineItem,
} from '../../domain/finance/personalFinanceStatement';
import { generatePersonalFinanceStatementPdf } from './PersonalFinanceStatementPdfGenerator';
import { formatINR, formatPercentage } from '../../lib/formatters';
import { formatIndianDate, getTodayLocalDateString } from '../../lib/dateUtils';

const STAGES = [
  { step: 1, label: 'Income', icon: '₹' },
  { step: 2, label: 'Expenses', icon: '↗' },
  { step: 3, label: 'Savings & Surplus', icon: '↻' },
  { step: 4, label: 'Assets', icon: '▤' },
  { step: 5, label: 'Liabilities', icon: '▥' },
  { step: 6, label: 'Net Worth & Review', icon: '★' },
] as const;

export default function PersonalFinanceStatementApp(): React.JSX.Element {
  const baseId = useId();

  // Helper to get fresh blank predefined rows
  const getInitialBlankState = () => createBlankPredefinedStatement();
  const initialBlank = getInitialBlankState();

  // Active Stage
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Metadata State — Initialized blank by default
  const [clientName, setClientName] = useState<string>('');
  const [spouseName, setSpouseName] = useState<string>('');
  const [childrenNames, setChildrenNames] = useState<string>('');
  const [statementDate, setStatementDate] = useState<string>(getTodayLocalDateString());
  const [preparedBy, setPreparedBy] = useState<string>('C. Santhosh Sathriyan');
  const [discussionNotes, setDiscussionNotes] = useState<string>('');

  // Stage 1 State: Income — Initialized with all 7 predefined rows (amounts = 0)
  const [incomes, setIncomes] = useState<IncomeLineItem[]>(initialBlank.incomes);

  // Stage 2 State: Expenses — Initialized with all 29 predefined rows (amounts = 0)
  const [expenseEntryMode, setExpenseEntryMode] = useState<ExpenseEntryMode>('CATEGORY_BREAKDOWN');
  const [singleMonthlyExpense, setSingleMonthlyExpense] = useState<string>('0');
  const [expenses, setExpenses] = useState<ExpenseLineItem[]>(initialBlank.expenses);

  // Stage 3 State: Savings & Ongoing Investments — Initialized with all 3 predefined rows
  const [ongoingInvestments, setOngoingInvestments] = useState<OngoingInvestmentItem[]>(initialBlank.ongoingInvestments);
  const [assumedReturnRatePercent, setAssumedReturnRatePercent] = useState<string>('10');

  // Stage 4 State: Assets — Initialized with all 23 predefined rows across 6 classes
  const [assets, setAssets] = useState<AssetLineItem[]>(initialBlank.assets);

  // Stage 5 State: Liabilities — Initialized with all 6 predefined rows
  const [liabilities, setLiabilities] = useState<LiabilityLineItem[]>(initialBlank.liabilities);

  // UI Flow States
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Helper parse numeric — guarantees non-negative finite numbers (prevents unhandled domain errors during intermediate typing)
  const parseNum = (val: string | number): number => {
    if (typeof val === 'number') return isNaN(val) || !isFinite(val) ? 0 : Math.max(0, val);
    const clean = String(val).replace(/,/g, '').trim();
    if (!clean) return 0;
    const n = parseFloat(clean);
    return isNaN(n) || !isFinite(n) ? 0 : Math.max(0, n);
  };

  // Compile statement input for reactive domain computation
  const parsedChildrenList = childrenNames
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const statementInputs: ComprehensiveStatementInputs = {
    metadata: {
      clientName: clientName.trim() || 'Valued Client',
      spouseName: spouseName.trim() || undefined,
      childrenNames: parsedChildrenList.length > 0 ? parsedChildrenList : undefined,
      statementDate,
      preparedBy: preparedBy.trim() || 'C. Santhosh Sathriyan',
      discussionNotes,
    },
    incomeItems: incomes,
    expenseInputs: {
      expenseEntryMode,
      singleMonthlyExpense: parseNum(singleMonthlyExpense),
      itemizedExpenses: expenses,
    },
    ongoingInvestments,
    assumedSurplusReturnPercent: parseNum(assumedReturnRatePercent),
    assetItems: assets,
    liabilityItems: liabilities,
  };

  // Immediate reactive recalculation with safe fallback (guarantees UI never unmounts on unexpected computation error)
  const result: PersonalFinanceStatementResult = React.useMemo(() => {
    try {
      return calculateComprehensivePersonalFinanceStatement(statementInputs);
    } catch (err) {
      console.error('[PersonalFinanceStatementApp] Calculation fallback triggered:', err);
      // Return safe baseline with current inputs
      return calculateComprehensivePersonalFinanceStatement({
        ...statementInputs,
        expenseInputs: {
          ...statementInputs.expenseInputs,
          singleMonthlyExpense: Math.max(0, statementInputs.expenseInputs.singleMonthlyExpense || 0),
          itemizedExpenses: (statementInputs.expenseInputs.itemizedExpenses || []).map((exp) => ({
            ...exp,
            enteredAmount: Math.max(0, exp.enteredAmount || 0),
          })),
        },
      });
    }
  }, [statementInputs]);

  // Owner Column Labels
  const selfLabel = clientName.trim() ? `${clientName.trim().split(' ')[0]} (Self)` : 'Self';
  const spouseLabel = spouseName.trim() ? `${spouseName.trim()} (Spouse)` : 'Spouse';
  const childrenLabel = parsedChildrenList.length > 0 ? parsedChildrenList.join(' & ') : 'Children';

  // Stable ref for stage navigation ribbon to scroll to destination workspace view reliably
  const stageCanvasRef = useRef<HTMLDivElement | null>(null);
  const stageNavRef = useRef<HTMLElement | null>(null);

  // Track whether initial mount has occurred to avoid scrolling on first render
  const isInitialMount = useRef<boolean>(true);

  // Automatically scroll to destination stage navigation ribbon whenever stage changes
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const performScroll = () => {
      // Prioritize the six-stage progress ribbon container so the user gets the clear overview:
      // Ribbon -> Live Financial Summary -> Selected Stage Heading -> Input Section
      const ribbonEl = stageNavRef.current || (document.querySelector('.pfs-nav-stepper') as HTMLElement | null);
      const targetEl = ribbonEl || (stageCanvasRef.current as HTMLElement | null);
      if (targetEl) {
        const headerEl = document.querySelector('.site-header') as HTMLElement | null;
        const headerH = headerEl ? headerEl.offsetHeight : 72;
        // Total top offset: only the fixed/sticky site header + 16px buffer
        // Note: the stage navigation ribbon is in normal document flow and NOT sticky
        const totalTopOffset = headerH + 16;

        // Calculate absolute top position in the document
        const elementTop = targetEl.getBoundingClientRect().top + window.pageYOffset;
        const targetY = elementTop - totalTopOffset;

        // Temporarily override html smooth scrolling to jump instantly and deterministically without smooth scroll lag
        const originalScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, Math.max(0, targetY));
        document.documentElement.style.scrollBehavior = originalScrollBehavior;
      }
    };

    // Staged timeout: fires at 50ms, 150ms, and 300ms to ensure scroll position is applied once the layout and animations have settled
    const timer1 = setTimeout(performScroll, 50);
    const timer2 = setTimeout(performScroll, 150);
    const timer3 = setTimeout(performScroll, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [currentStage]);

  // Navigation handlers
  const goToStage = (step: 1 | 2 | 3 | 4 | 5 | 6) => {
    setCurrentStage(step);
  };

  const handleNextStage = () => {
    if (currentStage < 6) {
      goToStage((currentStage + 1) as any);
    }
  };

  const handlePrevStage = () => {
    if (currentStage > 1) {
      goToStage((currentStage - 1) as any);
    }
  };

  // Complete and verifiable Reset Statement handler
  const handleConfirmReset = () => {
    const blank = createBlankPredefinedStatement();
    setClientName('');
    setSpouseName('');
    setChildrenNames('');
    setStatementDate(getTodayLocalDateString());
    setPreparedBy('C. Santhosh Sathriyan');
    setDiscussionNotes('');
    setIncomes(blank.incomes);
    setExpenses(blank.expenses);
    setOngoingInvestments(blank.ongoingInvestments);
    setAssets(blank.assets);
    setLiabilities(blank.liabilities);
    setExpenseEntryMode('CATEGORY_BREAKDOWN');
    setSingleMonthlyExpense('0');
    setAssumedReturnRatePercent('10');
    setPdfError(null);
    setShowResetModal(false);
    setShowPreviewModal(false);
    setCurrentStage(1);
  };

  // Load Sample Data on demand
  const handleLoadSampleData = () => {
    const sample = createSamplePredefinedStatement();
    setClientName('Ramesh & Priya Sundaram');
    setSpouseName('Priya');
    setChildrenNames('Ananya, Aarav');
    setStatementDate(getTodayLocalDateString());
    setPreparedBy('C. Santhosh Sathriyan');
    setDiscussionNotes('');
    setIncomes(sample.incomes);
    setExpenses(sample.expenses);
    setOngoingInvestments(sample.ongoingInvestments);
    setAssets(sample.assets);
    setLiabilities(sample.liabilities);
    setExpenseEntryMode('CATEGORY_BREAKDOWN');
    setSingleMonthlyExpense('0');
    setAssumedReturnRatePercent('10');
    setPdfError(null);
  };

  // Income row mutations with live bidirectional Monthly/Annual synchronization
  const updateIncomeField = (id: string, field: 'label' | 'monthly' | 'annual' | 'deductions', val: string | number) => {
    setIncomes((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === 'label') {
          return { ...item, label: String(val) };
        }
        if (field === 'monthly') {
          const monthly = parseNum(val);
          const annual = monthly * 12;
          return {
            ...item,
            grossMonthlyAmount: monthly,
            grossAnnualAmount: annual,
            enteredGrossAmount: annual,
          };
        }
        if (field === 'annual') {
          const annual = parseNum(val);
          const monthly = Math.round(annual / 12);
          return {
            ...item,
            grossMonthlyAmount: monthly,
            grossAnnualAmount: annual,
            enteredGrossAmount: annual,
          };
        }
        if (field === 'deductions') {
          const deductions = parseNum(val);
          return {
            ...item,
            annualDeductions: deductions,
          };
        }
        return item;
      })
    );
  };

  const addIncomeRow = () => {
    const newId = `inc-custom-${Date.now()}`;
    setIncomes((prev) => [
      ...prev,
      {
        id: newId,
        label: 'Additional Income Source',
        category: 'OTHER',
        grossMonthlyAmount: 0,
        grossAnnualAmount: 0,
        enteredGrossAmount: 0,
        annualDeductions: 0,
      },
    ]);
  };
  const removeIncomeRow = (id: string) => {
    setIncomes((prev) => prev.filter((item) => item.id !== id));
  };

  // Expense row mutations
  const updateExpenseRow = (id: string, field: keyof ExpenseLineItem, val: any) => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };
  const addExpenseRow = (category: ExpenseLineItem['category']) => {
    const newId = `exp-custom-${Date.now()}`;
    setExpenses((prev) => [
      ...prev,
      {
        id: newId,
        label: 'Additional Expense Item',
        category,
        frequency: 'MONTHLY',
        enteredAmount: 0,
      },
    ]);
  };
  const removeExpenseRow = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  // Ongoing Investment mutations
  const updateInvestmentRow = (id: string, field: keyof OngoingInvestmentItem, val: any) => {
    setOngoingInvestments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };
  const addInvestmentRow = () => {
    const newId = `inv-custom-${Date.now()}`;
    setOngoingInvestments((prev) => [
      ...prev,
      {
        id: newId,
        label: 'Additional Systematic Investment',
        frequency: 'MONTHLY',
        enteredAmount: 0,
      },
    ]);
  };
  const removeInvestmentRow = (id: string) => {
    setOngoingInvestments((prev) => prev.filter((item) => item.id !== id));
  };

  // Asset mutations
  const updateAssetRow = (id: string, field: keyof AssetLineItem, val: any) => {
    setAssets((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };
  const addAssetRow = (assetClass: AssetClass) => {
    const newId = `ast-custom-${Date.now()}`;
    setAssets((prev) => [
      ...prev,
      {
        id: newId,
        label: 'Additional Holding',
        assetClass,
        selfAmount: 0,
        spouseAmount: 0,
        childrenAmount: 0,
        purposeGoal: '',
      },
    ]);
  };
  const removeAssetRow = (id: string) => {
    setAssets((prev) => prev.filter((item) => item.id !== id));
  };

  // Liability mutations
  const updateLiabilityRow = (id: string, field: keyof LiabilityLineItem, val: any) => {
    setLiabilities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };
  const addLiabilityRow = (type: LiabilityType) => {
    const newId = `lia-custom-${Date.now()}`;
    setLiabilities((prev) => [
      ...prev,
      {
        id: newId,
        label: 'Additional Loan / Obligation',
        type,
        selfAmount: 0,
        spouseAmount: 0,
        childrenAmount: 0,
        purposeGoal: '',
      },
    ]);
  };
  const removeLiabilityRow = (id: string) => {
    setLiabilities((prev) => prev.filter((item) => item.id !== id));
  };

  // PDF Generation Trigger
  const handleDownloadPdf = () => {
    setPdfError(null);
    if (!clientName.trim()) {
      setPdfError('Please enter a Client / Family name before generating the PDF statement.');
      return;
    }

    try {
      setPdfGenerating(true);
      // Ensure the statement date is refreshed to the latest local calendar date at PDF generation time
      const freshLocalDate = getTodayLocalDateString();
      const statementWithFreshDate: PersonalFinanceStatementResult = {
        ...result,
        metadata: {
          ...result.metadata,
          statementDate: freshLocalDate,
        },
      };
      const { blob, filename } = generatePersonalFinanceStatementPdf(statementWithFreshDate);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setPdfError(err?.message || 'Failed to generate PDF document.');
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="pfs-app-wrapper" id="personal-finance-statement-app">
      {/* ------------------------------------------------------------- */}
      {/* 1. CLIENT METADATA & STATEMENT SETTINGS BAR                   */}
      {/* ------------------------------------------------------------- */}
      <section className="pfs-meta-section" aria-label="Statement Header Details">
        <div className="pfs-meta-header">
          <div className="pfs-meta-title-box">
            <h2 className="pfs-meta-title">Client &amp; Family Details</h2>
            <p className="pfs-meta-subtitle">
              Add family names to personalize ownership columns and your PDF report.
            </p>
          </div>
          <div className="pfs-meta-actions">
            <button
              type="button"
              className="pfs-btn-sample"
              onClick={handleLoadSampleData}
              id="btn-load-sample"
              title="Populate sample household data"
            >
              Sample Data
            </button>
            <button
              type="button"
              className="pfs-btn-outline-danger"
              onClick={() => setShowResetModal(true)}
              id="btn-start-over"
              title="Reset all fields to a blank statement"
            >
              Reset Statement
            </button>
          </div>
        </div>

        <div className="pfs-meta-grid">
          <div className="pfs-field-group">
            <label htmlFor={`${baseId}-clientName`} className="pfs-label">
              Client / Family Name <span className="pfs-required">*</span>
            </label>
            <input
              id={`${baseId}-clientName`}
              type="text"
              className="pfs-input"
              value={clientName}
              placeholder="e.g. Ramesh & Priya Sundaram"
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div className="pfs-field-group">
            <label htmlFor={`${baseId}-spouseName`} className="pfs-label">
              Spouse Name <span className="pfs-optional">(Optional)</span>
            </label>
            <input
              id={`${baseId}-spouseName`}
              type="text"
              className="pfs-input"
              value={spouseName}
              placeholder="e.g. Priya"
              onChange={(e) => setSpouseName(e.target.value)}
            />
          </div>

          <div className="pfs-field-group">
            <label htmlFor={`${baseId}-childrenNames`} className="pfs-label">
              Children&apos;s Names <span className="pfs-optional">(Comma separated)</span>
            </label>
            <input
              id={`${baseId}-childrenNames`}
              type="text"
              className="pfs-input"
              value={childrenNames}
              placeholder="e.g. Ananya, Aarav"
              onChange={(e) => setChildrenNames(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. 6-STAGE WORKFLOW STEPPER NAVIGATION (NORMAL DOCUMENT FLOW) */}
      {/* ------------------------------------------------------------- */}
      <nav
        className="pfs-nav-stepper"
        ref={stageNavRef}
        aria-label="Statement Stage Navigation"
      >
        <ol className="pfs-stepper-list">
          {STAGES.map((s) => {
            const isActive = currentStage === s.step;
            const isCompleted = currentStage > s.step;
            return (
              <li key={s.step} className="pfs-stepper-item">
                <button
                  type="button"
                  className={`pfs-step-btn ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => goToStage(s.step as any)}
                  id={`btn-nav-stage-${s.step}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="pfs-step-badge">
                    {isCompleted ? '✓' : s.step}
                  </span>
                  <span className="pfs-step-text">
                    <span className="pfs-step-num">Stage {s.step}</span>
                    <span className="pfs-step-title">{s.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* 3. LIVE FINANCIAL SUMMARY CARDS                              */}
      {/* ------------------------------------------------------------- */}
      <section className="pfs-live-bar" aria-label="Live Statement Summary">
        <div className="pfs-live-grid">
          <div className="pfs-metric-card" id="metric-income">
            <span className="pfs-metric-label">Annual Income</span>
            <span className="pfs-metric-value">{formatINR(result.incomeStage.totalNetAnnualIncome)}</span>
            <span className="pfs-metric-sub">Monthly: {formatINR(result.incomeStage.totalNetMonthlyIncome)}</span>
          </div>

          <div className="pfs-metric-card" id="metric-expenses">
            <span className="pfs-metric-label">Annual Expenses</span>
            <span className="pfs-metric-value">{formatINR(result.expenseStage.totalAnnualExpenses)}</span>
            <span className="pfs-metric-sub">Monthly: {formatINR(result.expenseStage.totalMonthlyExpenses)}</span>
          </div>

          <div className="pfs-metric-card" id="metric-savings">
            <span className="pfs-metric-label">Annual Savings</span>
            <span className={`pfs-metric-value ${result.savingsStage.annualSavings < 0 ? 'text-negative' : 'text-teal'}`}>
              {formatINR(result.savingsStage.annualSavings)}
            </span>
            <span className="pfs-metric-sub">
              Savings Rate: {result.savingsRatePercent !== null ? formatPercentage(result.savingsRatePercent) : 'N/A'}
            </span>
          </div>

          <div className="pfs-metric-card" id="metric-assets">
            <span className="pfs-metric-label">Total Assets</span>
            <span className="pfs-metric-value">{formatINR(result.totalAssets)}</span>
            <span className="pfs-metric-sub">Personal: {formatINR(result.totalPersonalAssets)}</span>
          </div>

          <div className="pfs-metric-card" id="metric-liabilities">
            <span className="pfs-metric-label">Total Liabilities</span>
            <span className="pfs-metric-value">{formatINR(result.totalLiabilities)}</span>
            <span className="pfs-metric-sub">
              Debt/Asset: {result.debtToAssetRatioPercent !== null ? formatPercentage(result.debtToAssetRatioPercent) : 'N/A'}
            </span>
          </div>

          <div className="pfs-metric-card highlight-card" id="metric-networth">
            <span className="pfs-metric-label">Actual Net Worth</span>
            <span className="pfs-metric-value highlight-value">{formatINR(result.netWorthExcludingPersonalAssets)}</span>
            <span className="pfs-metric-sub">Notional: {formatINR(result.netWorthIncludingPersonalAssets)}</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* STAGE CONTAINER                                               */}
      {/* ------------------------------------------------------------- */}
      <div className="pfs-stage-canvas" ref={stageCanvasRef}>
        {/* =========================================================== */}
        {/* STAGE 1: INCOME                                             */}
        {/* =========================================================== */}
        {currentStage === 1 && (
          <section className="pfs-stage-pane" id="pane-stage-1" aria-labelledby="stage-1-heading">
            <div className="pfs-pane-header">
              <div>
                <span className="pfs-pane-kicker">Stage 1 of 6</span>
                <h3 id="stage-1-heading" className="pfs-pane-title">Household Income</h3>
                <p className="pfs-pane-desc">
                  Enter your monthly or annual take-home income.
                </p>
              </div>
              <button
                type="button"
                className="pfs-btn-secondary"
                onClick={addIncomeRow}
                id="btn-add-income"
              >
                + Add Income Source
              </button>
            </div>

            <div className="pfs-table-responsive">
              <table className="pfs-table" id="table-income">
                <thead>
                  <tr>
                    <th style={{ width: '44%' }}>Income Source</th>
                    <th style={{ width: '26%' }} className="text-right">Monthly (₹)</th>
                    <th style={{ width: '26%' }} className="text-right">Annual (₹)</th>
                    <th style={{ width: '4%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((row) => {
                    const grossAnnual = row.grossAnnualAmount ?? (row.grossMonthlyAmount ? row.grossMonthlyAmount * 12 : (row.enteredGrossAmount || 0));
                    const grossMonthly = row.grossMonthlyAmount ?? Math.round(grossAnnual / 12);

                    return (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="text"
                            className="pfs-table-input"
                            value={row.label}
                            onChange={(e) => updateIncomeField(row.id, 'label', e.target.value)}
                            placeholder="Income source name"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="pfs-table-input text-right pfs-input-monthly-gross"
                            data-field="monthly-gross"
                            value={grossMonthly || ''}
                            placeholder="0"
                            onChange={(e) => updateIncomeField(row.id, 'monthly', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="pfs-table-input text-right pfs-input-annual-gross"
                            data-field="annual-gross"
                            value={grossAnnual || ''}
                            placeholder="0"
                            onChange={(e) => updateIncomeField(row.id, 'annual', e.target.value)}
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="pfs-btn-row-del"
                            title="Remove row"
                            onClick={() => removeIncomeRow(row.id)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="pfs-table-total-row">
                    <td>
                      <strong>Total Household Income</strong>
                    </td>
                    <td className="text-right font-bold tabular-nums">
                      {formatINR(result.incomeStage.totalNetMonthlyIncome)}
                    </td>
                    <td className="text-right font-bold highlight-cell tabular-nums">
                      {formatINR(result.incomeStage.totalNetAnnualIncome)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="pfs-stage-footer-actions">
              <span></span>
              <button
                type="button"
                className="pfs-btn-primary"
                onClick={handleNextStage}
                id="btn-stage-1-next"
              >
                Continue to Stage 2: Expenses →
              </button>
            </div>
          </section>
        )}

        {/* =========================================================== */}
        {/* STAGE 2: EXPENSES                                           */}
        {/* =========================================================== */}
        {currentStage === 2 && (
          <section className="pfs-stage-pane" id="pane-stage-2" aria-labelledby="stage-2-heading">
            <div className="pfs-pane-header">
              <div>
                <span className="pfs-pane-kicker">Stage 2 of 6</span>
                <h3 id="stage-2-heading" className="pfs-pane-title">Household Expenses</h3>
                <p className="pfs-pane-desc">
                  Enter one combined monthly total or list expenses by category.
                </p>
              </div>
            </div>

            {/* Unified Expense-Entry Choice Selector */}
            <div className="pfs-mode-selector-card" id="expense-entry-selector">
              <div className="pfs-expense-choice-grid">
                <button
                  type="button"
                  className={`pfs-expense-choice-card ${expenseEntryMode === 'CONSOLIDATED_TOTAL' ? 'active' : ''}`}
                  onClick={() => setExpenseEntryMode('CONSOLIDATED_TOTAL')}
                  id="btn-consolidated-expenses"
                >
                  <div className="pfs-choice-radio-indicator">
                    <span className="pfs-radio-circle"></span>
                  </div>
                  <div className="pfs-choice-content">
                    <span className="pfs-choice-title">Enter total monthly expenses</span>
                    <span className="pfs-choice-desc">One combined monthly amount.</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`pfs-expense-choice-card ${expenseEntryMode === 'CATEGORY_BREAKDOWN' ? 'active' : ''}`}
                  onClick={() => setExpenseEntryMode('CATEGORY_BREAKDOWN')}
                  id="btn-category-expenses"
                >
                  <div className="pfs-choice-radio-indicator">
                    <span className="pfs-radio-circle"></span>
                  </div>
                  <div className="pfs-choice-content">
                    <span className="pfs-choice-title">Break down by category</span>
                    <span className="pfs-choice-desc">Itemize household, lifestyle, insurance &amp; EMIs.</span>
                  </div>
                </button>
              </div>

              {/* Option 1: Consolidated Total Panel */}
              {expenseEntryMode === 'CONSOLIDATED_TOTAL' && (
                <div className="pfs-mode-body" id="consolidated-expenses-container">
                  <div className="pfs-mode-input-row">
                    <div className="pfs-field-group">
                      <label htmlFor={`${baseId}-consolidated-expense-amount`} className="pfs-label font-bold">
                        Total Monthly Family Expenses (₹/month)
                      </label>
                      <input
                        id="input-consolidated-monthly-expense"
                        type="number"
                        className="pfs-input text-lg font-bold"
                        value={singleMonthlyExpense}
                        placeholder="0"
                        onChange={(e) => setSingleMonthlyExpense(e.target.value)}
                      />
                      <span className="pfs-input-hint">
                        Annual equivalent: <strong>{formatINR(parseNum(singleMonthlyExpense) * 12)} / year</strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* EXPENSE CATEGORIES — Only rendered when in CATEGORY_BREAKDOWN mode */}
            {expenseEntryMode === 'CATEGORY_BREAKDOWN' &&
              (['HOUSEHOLD', 'LIFESTYLE', 'DEPENDENT', 'INSURANCE', 'LOAN_EMI'] as const).map((cat) => {
                const catRows = expenses.filter((e) => e.category === cat);

                const catTitles: Record<string, { title: string; subtitle: string }> = {
                  HOUSEHOLD: {
                    title: '1. Household Essentials',
                    subtitle: 'Rent, groceries, utilities, domestic help, medicals.',
                  },
                  LIFESTYLE: {
                    title: '2. Lifestyle & Discretionary',
                    subtitle: 'Dining, travel, shopping, subscriptions.',
                  },
                  DEPENDENT: {
                    title: '3. Family & Education',
                    subtitle: 'School fees, coaching, parent support.',
                  },
                  INSURANCE: {
                    title: '4. Insurance Premiums',
                    subtitle: 'Term life, health, and motor insurance.',
                  },
                  LOAN_EMI: {
                    title: '5. Loan EMIs',
                    subtitle: 'Home, car, personal, and education loan EMIs.',
                  },
                };

                const catSubtotalAnnual = catRows.reduce((sum, r) => {
                  const mult =
                    r.frequency === 'MONTHLY'
                      ? 12
                      : r.frequency === 'QUARTERLY'
                        ? 4
                        : r.frequency === 'HALF_YEARLY'
                          ? 2
                          : 1;
                  return sum + r.enteredAmount * mult;
                }, 0);

                return (
                  <div key={cat} className="pfs-category-section" id={`cat-section-${cat.toLowerCase()}`}>
                    <div className="pfs-cat-header">
                      <div>
                        <h4 className="pfs-cat-title">{catTitles[cat].title}</h4>
                        <p className="pfs-cat-desc">{catTitles[cat].subtitle}</p>
                      </div>
                      <div className="pfs-cat-right">
                        <span className="pfs-cat-subtotal">
                          Subtotal: <strong>{formatINR(catSubtotalAnnual)}/yr</strong>
                        </span>
                        <button
                          type="button"
                          className="pfs-btn-secondary-sm"
                          onClick={() => addExpenseRow(cat)}
                        >
                          + Add Item
                        </button>
                      </div>
                    </div>

                    <div className="pfs-table-responsive">
                      <table className="pfs-table">
                        <thead>
                          <tr>
                            <th style={{ width: '40%' }}>Particulars</th>
                            <th style={{ width: '18%' }}>Frequency</th>
                            <th style={{ width: '20%' }}>Entered Amount (₹)</th>
                            <th style={{ width: '18%' }} className="text-right">Annual Equivalent (₹)</th>
                            <th style={{ width: '4%' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {catRows.map((row) => {
                            const mult =
                              row.frequency === 'MONTHLY'
                                ? 12
                                : row.frequency === 'QUARTERLY'
                                  ? 4
                                  : row.frequency === 'HALF_YEARLY'
                                    ? 2
                                    : 1;
                            const rowAnnual = row.enteredAmount * mult;

                            return (
                              <tr key={row.id}>
                                <td>
                                  <input
                                    type="text"
                                    className="pfs-table-input"
                                    value={row.label}
                                    onChange={(e) => updateExpenseRow(row.id, 'label', e.target.value)}
                                  />
                                </td>
                                <td>
                                  <select
                                    className="pfs-table-select"
                                    value={row.frequency}
                                    onChange={(e) => updateExpenseRow(row.id, 'frequency', e.target.value as ExpenseFrequency)}
                                  >
                                    <option value="MONTHLY">Monthly (12x)</option>
                                    <option value="QUARTERLY">Quarterly (4x)</option>
                                    <option value="HALF_YEARLY">Half-Yearly (2x)</option>
                                    <option value="ANNUAL">Annual (1x)</option>
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="pfs-table-input text-right"
                                    value={row.enteredAmount || ''}
                                    placeholder="0"
                                    onChange={(e) => updateExpenseRow(row.id, 'enteredAmount', parseNum(e.target.value))}
                                  />
                                </td>
                                <td className="text-right font-bold tabular-nums">
                                  {formatINR(rowAnnual)}
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="pfs-btn-row-del"
                                    title="Remove item"
                                    onClick={() => removeExpenseRow(row.id)}
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

            {/* Total Expenses Summary Row */}
            <div className="pfs-total-summary-card">
              <div className="pfs-summary-line">
                <span>Total Annual Expenses:</span>
                <strong className="text-xl text-navy">{formatINR(result.expenseStage.totalAnnualExpenses)}</strong>
              </div>
              <div className="pfs-summary-line">
                <span>Monthly Living Cost Equivalent:</span>
                <strong>{formatINR(result.expenseStage.totalMonthlyExpenses)} / month</strong>
              </div>
            </div>

            <div className="pfs-stage-footer-actions">
              <button type="button" className="pfs-btn-secondary" onClick={handlePrevStage}>
                ← Back to Income
              </button>
              <button type="button" className="pfs-btn-primary" onClick={handleNextStage} id="btn-stage-2-next">
                Continue to Stage 3: Savings &amp; Ongoing Investments →
              </button>
            </div>
          </section>
        )}

        {/* =========================================================== */}
        {/* STAGE 3: SAVINGS & ONGOING INVESTMENTS                      */}
        {/* =========================================================== */}
        {currentStage === 3 && (
          <section className="pfs-stage-pane" id="pane-stage-3" aria-labelledby="stage-3-heading">
            <div className="pfs-pane-header">
              <div>
                <span className="pfs-pane-kicker">Stage 3 of 6</span>
                <h3 id="stage-3-heading" className="pfs-pane-title">Savings &amp; Ongoing Investments</h3>
                <p className="pfs-pane-desc">
                  Review your annual savings and ongoing SIP or recurring commitments.
                </p>
              </div>
            </div>

            {/* Cash Flow Bridge Equation */}
            <div className="pfs-bridge-card">
              <div className="pfs-bridge-step">
                <span className="pfs-bridge-label">Annual Inflows</span>
                <span className="pfs-bridge-val text-navy">{formatINR(result.incomeStage.totalNetAnnualIncome)}</span>
              </div>
              <span className="pfs-bridge-op">−</span>
              <div className="pfs-bridge-step">
                <span className="pfs-bridge-label">Annual Outflows</span>
                <span className="pfs-bridge-val text-navy">{formatINR(result.expenseStage.totalAnnualExpenses)}</span>
              </div>
              <span className="pfs-bridge-op">=</span>
              <div className="pfs-bridge-step highlight">
                <span className="pfs-bridge-label">Gross Annual Savings</span>
                <span className={`pfs-bridge-val ${result.savingsStage.annualSavings < 0 ? 'text-negative' : 'text-teal'}`}>
                  {formatINR(result.savingsStage.annualSavings)}
                </span>
                <span className="pfs-bridge-sub">
                  ({result.savingsRatePercent !== null ? formatPercentage(result.savingsRatePercent) : '0%'} rate)
                </span>
              </div>
            </div>

            {/* Ongoing Investments Table */}
            <div className="pfs-category-section">
              <div className="pfs-cat-header">
                <div>
                  <h4 className="pfs-cat-title">Committed Ongoing Investments</h4>
                  <p className="pfs-cat-desc">
                    Regular SIPs, PPF/EPF contributions, and recurring deposits.
                  </p>
                </div>
                <div className="pfs-cat-right">
                  <span className="pfs-cat-subtotal">
                    Committed Total: <strong>{formatINR(result.savingsStage.totalOngoingInvestmentsAnnual)}/yr</strong>
                  </span>
                  <button type="button" className="pfs-btn-secondary-sm" onClick={addInvestmentRow} id="btn-add-investment">
                    + Add Ongoing Investment
                  </button>
                </div>
              </div>

              <div className="pfs-table-responsive">
                <table className="pfs-table" id="table-investments">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Particulars</th>
                      <th style={{ width: '20%' }}>Frequency</th>
                      <th style={{ width: '20%' }}>Entered Amount (₹)</th>
                      <th style={{ width: '16%' }} className="text-right">Annualized (₹)</th>
                      <th style={{ width: '4%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ongoingInvestments.map((row) => {
                      const mult = row.frequency === 'MONTHLY' ? 12 : row.frequency === 'QUARTERLY' ? 4 : row.frequency === 'HALF_YEARLY' ? 2 : 1;
                      const ann = row.enteredAmount * mult;

                      return (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="text"
                              className="pfs-table-input"
                              value={row.label}
                              onChange={(e) => updateInvestmentRow(row.id, 'label', e.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              className="pfs-table-select"
                              value={row.frequency}
                              onChange={(e) => updateInvestmentRow(row.id, 'frequency', e.target.value as ExpenseFrequency)}
                            >
                              <option value="MONTHLY">Monthly (12x)</option>
                              <option value="QUARTERLY">Quarterly (4x)</option>
                              <option value="HALF_YEARLY">Half-Yearly (2x)</option>
                              <option value="ANNUAL">Annual (1x)</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="pfs-table-input text-right"
                              value={row.enteredAmount || ''}
                              placeholder="0"
                              onChange={(e) => updateInvestmentRow(row.id, 'enteredAmount', parseNum(e.target.value))}
                            />
                          </td>
                          <td className="text-right font-bold tabular-nums">
                            {formatINR(ann)}
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="pfs-btn-row-del"
                              title="Remove item"
                              onClick={() => removeInvestmentRow(row.id)}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Surplus for Fresh Investments Card */}
            <div
              className={`pfs-surplus-card ${result.savingsStage.annualSurplusForFreshInvestments < 0 ? 'surplus-deficit' : ''}`}
              id="surplus-card"
            >
              <div className="pfs-surplus-header">
                <div>
                  <span className="pfs-surplus-kicker">Net Deployable Capital</span>
                  <h4 className="pfs-surplus-title">Surplus for Fresh Investments</h4>
                </div>
                <div className="text-right">
                  <span
                    className={`pfs-surplus-amount ${result.savingsStage.annualSurplusForFreshInvestments < 0 ? 'text-negative' : 'text-teal'
                      }`}
                  >
                    {formatINR(result.savingsStage.annualSurplusForFreshInvestments)} / year
                  </span>
                  <span className="pfs-surplus-monthly">
                    (~{formatINR(result.savingsStage.monthlySurplusForFreshInvestments)} / month)
                  </span>
                </div>
              </div>

              {result.savingsStage.annualSurplusForFreshInvestments < 0 ? (
                <div className="pfs-alert-warning">
                  <strong>Cash Flow Deficit:</strong> Expenses and ongoing investments exceed your annual income by {formatINR(Math.abs(result.savingsStage.annualSurplusForFreshInvestments))}.
                </div>
              ) : (
                <p className="pfs-surplus-desc">
                  Unallocated monthly savings available for new financial goals.
                </p>
              )}
            </div>

            {/* Illustrative Compounding Projections */}
            {result.savingsStage.annualSurplusForFreshInvestments > 0 && result.savingsStage.surplusProjections.length > 0 && (
              <div className="pfs-projections-card" id="projections-container">
                <div className="pfs-proj-header">
                  <div>
                    <h4 className="pfs-proj-title">Illustrative Surplus Growth</h4>
                    <p className="pfs-proj-desc">
                      Projected value if ~{formatINR(result.savingsStage.monthlySurplusForFreshInvestments)}/mo is invested regularly.
                    </p>
                  </div>
                  <div className="pfs-proj-rate-box">
                    <label htmlFor={`${baseId}-return-rate`} className="pfs-label font-bold">
                      Assumed Return (% p.a.)
                    </label>
                    <input
                      id={`${baseId}-return-rate`}
                      type="number"
                      step="0.5"
                      min="1"
                      max="20"
                      className="pfs-input-sm text-right"
                      value={assumedReturnRatePercent}
                      onChange={(e) => setAssumedReturnRatePercent(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pfs-proj-grid">
                  {result.savingsStage.surplusProjections.map((p) => (
                    <div key={p.year} className="pfs-proj-box">
                      <span className="pfs-proj-years">{p.year} Years</span>
                      <span className="pfs-proj-future-val">{formatINR(p.projectedCorpus)}</span>
                      <span className="pfs-proj-invested">Invested: {formatINR(p.cumulativeContributed)}</span>
                      <span className="pfs-proj-gain">Gain: +{formatINR(p.compoundGain)}</span>
                    </div>
                  ))}
                </div>
                <span className="pfs-disclaimer-sub">
                  *Illustrative mathematical projection at {result.savingsStage.assumedReturnPercent}% p.a. Mutual fund investments are subject to market risks.
                </span>
              </div>
            )}

            <div className="pfs-stage-footer-actions">
              <button type="button" className="pfs-btn-secondary" onClick={handlePrevStage}>
                ← Back to Expenses
              </button>
              <button type="button" className="pfs-btn-primary" onClick={handleNextStage} id="btn-stage-3-next">
                Continue to Stage 4: Assets →
              </button>
            </div>
          </section>
        )}

        {/* =========================================================== */}
        {/* STAGE 4: ASSETS                                             */}
        {/* =========================================================== */}
        {currentStage === 4 && (
          <section className="pfs-stage-pane" id="pane-stage-4" aria-labelledby="stage-4-heading">
            <div className="pfs-pane-header">
              <div>
                <span className="pfs-pane-kicker">Stage 4 of 6</span>
                <h3 id="stage-4-heading" className="pfs-pane-title">Family Assets &amp; Portfolio</h3>
                <p className="pfs-pane-desc">
                  Enter current values across {selfLabel}, {spouseLabel}, and {childrenLabel}.
                </p>
              </div>
            </div>

            {/* 6 Asset Classes */}
            {(['LIQUID', 'DEBT', 'EQUITY', 'GOLD', 'REAL_ESTATE', 'PERSONAL'] as const).map((ac) => {
              const classRows = assets.filter((a) => a.assetClass === ac);
              const summaryItem = result.assetStage.classSubtotals.find((s) => s.assetClass === ac);
              const totalVal = summaryItem ? summaryItem.totalValue : 0;
              const sharePct = summaryItem && summaryItem.percentOfTotalAssets !== null ? summaryItem.percentOfTotalAssets : 0;

              const classInfo: Record<AssetClass, { title: string; subtitle: string; isPersonal?: boolean }> = {
                LIQUID: {
                  title: '1. Liquid Reserves',
                  subtitle: 'Savings accounts, liquid funds, and cash.',
                },
                DEBT: {
                  title: '2. Fixed Income & Debt',
                  subtitle: 'FDs, PPF, EPF, bonds, and debt funds.',
                },
                EQUITY: {
                  title: '3. Equity & Growth',
                  subtitle: 'Equity mutual funds, stocks, and NPS equity.',
                },
                GOLD: {
                  title: '4. Gold & Precious Metals',
                  subtitle: 'Gold ETFs, SGBs, and gold coins/bars.',
                },
                REAL_ESTATE: {
                  title: '5. Investment Real Estate',
                  subtitle: 'Rental property, land, and REITs.',
                },
                PERSONAL: {
                  title: '6. Personal Use Assets',
                  subtitle: 'Primary home, vehicles, and personal jewellery.',
                  isPersonal: true,
                },
              };

              return (
                <div key={ac} className={`pfs-category-section ${classInfo[ac].isPersonal ? 'personal-asset-section' : ''}`}>
                  <div className="pfs-cat-header">
                    <div>
                      <div className="pfs-cat-title-row">
                        <h4 className="pfs-cat-title">{classInfo[ac].title}</h4>
                        {classInfo[ac].isPersonal && (
                          <span className="pfs-badge-warning">Personal Consumption</span>
                        )}
                      </div>
                      <p className="pfs-cat-desc">{classInfo[ac].subtitle}</p>
                    </div>
                    <div className="pfs-cat-right">
                      <span className="pfs-cat-subtotal">
                        Total: <strong>{formatINR(totalVal)}</strong> ({formatPercentage(sharePct)})
                      </span>
                      <button
                        type="button"
                        className="pfs-btn-secondary-sm"
                        onClick={() => addAssetRow(ac)}
                      >
                        + Add Asset
                      </button>
                    </div>
                  </div>

                  <div className="pfs-table-responsive">
                    <table className="pfs-table">
                      <thead>
                        <tr>
                          <th style={{ width: '21%' }}>Holding Particulars</th>
                          <th style={{ width: '13%' }}>{selfLabel} (₹)</th>
                          <th style={{ width: '13%' }}>{spouseLabel} (₹)</th>
                          <th style={{ width: '13%' }}>{childrenLabel} (₹)</th>
                          <th style={{ width: '14%' }} className="text-right">Total Value (₹)</th>
                          <th style={{ width: '22%' }}>
                            <span>Purpose / Goal</span>
                            <span className="pfs-th-sub" title="Optional: note the intended purpose of this holding, such as an emergency fund, education or retirement.">
                              Optional
                            </span>
                          </th>
                          <th style={{ width: '4%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {classRows.map((row) => {
                          const itemTotal = row.selfAmount + row.spouseAmount + row.childrenAmount;

                          const purposePlaceholders: Record<AssetClass, string> = {
                            LIQUID: 'e.g. Emergency fund',
                            DEBT: "e.g. Child's education",
                            EQUITY: 'e.g. Retirement',
                            GOLD: 'e.g. Long-term goal',
                            REAL_ESTATE: 'e.g. Home purchase',
                            PERSONAL: 'e.g. Family use',
                          };

                          return (
                            <tr key={row.id}>
                              <td>
                                <input
                                  type="text"
                                  className="pfs-table-input"
                                  value={row.label}
                                  onChange={(e) => updateAssetRow(row.id, 'label', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="pfs-table-input text-right"
                                  value={row.selfAmount || ''}
                                  placeholder="0"
                                  onChange={(e) => updateAssetRow(row.id, 'selfAmount', parseNum(e.target.value))}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="pfs-table-input text-right"
                                  value={row.spouseAmount || ''}
                                  placeholder="0"
                                  onChange={(e) => updateAssetRow(row.id, 'spouseAmount', parseNum(e.target.value))}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="pfs-table-input text-right"
                                  value={row.childrenAmount || ''}
                                  placeholder="0"
                                  onChange={(e) => updateAssetRow(row.id, 'childrenAmount', parseNum(e.target.value))}
                                />
                              </td>
                              <td className="text-right font-bold tabular-nums">
                                {formatINR(itemTotal)}
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="pfs-table-input pfs-table-input-purpose"
                                  value={row.purposeGoal || ''}
                                  placeholder={purposePlaceholders[row.assetClass] || 'e.g. Financial goal'}
                                  onChange={(e) => updateAssetRow(row.id, 'purposeGoal', e.target.value)}
                                />
                              </td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="pfs-btn-row-del"
                                  title="Remove item"
                                  onClick={() => removeAssetRow(row.id)}
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Total Assets Summary */}
            <div className="pfs-total-summary-card">
              <div className="pfs-summary-line">
                <span>Total Assets:</span>
                <strong className="text-xl text-navy">{formatINR(result.totalAssets)}</strong>
              </div>
              <div className="pfs-summary-line">
                <span>Productive Wealth Assets (Financial &amp; Yielding):</span>
                <strong className="text-teal">{formatINR(result.assetStage.totalProductiveAssets)}</strong>
              </div>
              <div className="pfs-summary-line">
                <span>Personal Consumption Assets (Residence &amp; Utility):</span>
                <strong>{formatINR(result.totalPersonalAssets)}</strong>
              </div>
            </div>

            <div className="pfs-stage-footer-actions">
              <button type="button" className="pfs-btn-secondary" onClick={handlePrevStage}>
                ← Back to Savings
              </button>
              <button type="button" className="pfs-btn-primary" onClick={handleNextStage} id="btn-stage-4-next">
                Continue to Stage 5: Liabilities →
              </button>
            </div>
          </section>
        )}

        {/* =========================================================== */}
        {/* STAGE 5: LIABILITIES                                       */}
        {/* =========================================================== */}
        {currentStage === 5 && (
          <section className="pfs-stage-pane" id="pane-stage-5" aria-labelledby="stage-5-heading">
            <div className="pfs-pane-header">
              <div>
                <span className="pfs-pane-kicker">Stage 5 of 6</span>
                <h3 id="stage-5-heading" className="pfs-pane-title">Loans &amp; Liabilities</h3>
                <p className="pfs-pane-desc">
                  Enter outstanding loan balances and credit card dues.
                </p>
              </div>
              <button
                type="button"
                className="pfs-btn-secondary"
                onClick={() => addLiabilityRow('OTHER_LOAN')}
                id="btn-add-liability"
              >
                + Add Debt Obligation
              </button>
            </div>

            <div className="pfs-table-responsive">
              <table className="pfs-table" id="table-liabilities">
                <thead>
                  <tr>
                    <th style={{ width: '26%' }}>Obligation Particulars</th>
                    <th style={{ width: '15%' }}>Category</th>
                    <th style={{ width: '13%' }}>{selfLabel} (₹)</th>
                    <th style={{ width: '13%' }}>{spouseLabel} (₹)</th>
                    <th style={{ width: '13%' }}>{childrenLabel} (₹)</th>
                    <th style={{ width: '16%' }} className="text-right">Outstanding (₹)</th>
                    <th style={{ width: '4%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {liabilities.map((row) => {
                    const rowTotal = row.selfAmount + row.spouseAmount + row.childrenAmount;

                    return (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="text"
                            className="pfs-table-input"
                            value={row.label}
                            onChange={(e) => updateLiabilityRow(row.id, 'label', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="pfs-table-select"
                            value={row.type}
                            onChange={(e) => updateLiabilityRow(row.id, 'type', e.target.value as LiabilityType)}
                          >
                            <option value="HOME_LOAN">Home Loan</option>
                            <option value="VEHICLE_LOAN">Vehicle Loan</option>
                            <option value="PERSONAL_LOAN">Personal Loan</option>
                            <option value="EDUCATION_LOAN">Education Loan</option>
                            <option value="OTHER_LOAN">Other Loan</option>
                            <option value="CREDIT_CARD">Credit Card Balance</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="pfs-table-input text-right"
                            value={row.selfAmount || ''}
                            placeholder="0"
                            onChange={(e) => updateLiabilityRow(row.id, 'selfAmount', parseNum(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="pfs-table-input text-right"
                            value={row.spouseAmount || ''}
                            placeholder="0"
                            onChange={(e) => updateLiabilityRow(row.id, 'spouseAmount', parseNum(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="pfs-table-input text-right"
                            value={row.childrenAmount || ''}
                            placeholder="0"
                            onChange={(e) => updateLiabilityRow(row.id, 'childrenAmount', parseNum(e.target.value))}
                          />
                        </td>
                        <td className="text-right font-bold tabular-nums">
                          {formatINR(rowTotal)}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="pfs-btn-row-del"
                            title="Remove obligation"
                            onClick={() => removeLiabilityRow(row.id)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="pfs-table-total-row">
                    <td colSpan={5}>
                      <strong>Total Outstanding Liabilities</strong>
                    </td>
                    <td className="text-right font-bold highlight-cell">
                      {formatINR(result.totalLiabilities)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Debt Health Metric */}
            <div className="pfs-debt-metric-card">
              <div className="pfs-metric-box">
                <span className="pfs-metric-lbl">Debt-to-Asset Solvency Ratio</span>
                <span className={`pfs-metric-big ${result.debtToAssetRatioPercent !== null && result.debtToAssetRatioPercent > 40 ? 'text-negative' : 'text-navy'}`}>
                  {result.debtToAssetRatioPercent !== null ? formatPercentage(result.debtToAssetRatioPercent) : '0%'}
                </span>
                <span className="pfs-metric-hint">Benchmark: Keep debt below 35% of total assets.</span>
              </div>
            </div>

            <div className="pfs-stage-footer-actions">
              <button type="button" className="pfs-btn-secondary" onClick={handlePrevStage}>
                ← Back to Assets
              </button>
              <button type="button" className="pfs-btn-primary" onClick={handleNextStage} id="btn-stage-5-next">
                Continue to Stage 6: Net Worth &amp; Review →
              </button>
            </div>
          </section>
        )}

        {/* =========================================================== */}
        {/* STAGE 6: NET WORTH & FINAL REVIEW                           */}
        {/* =========================================================== */}
        {currentStage === 6 && (
          <section className="pfs-stage-pane" id="pane-stage-6" aria-labelledby="stage-6-heading">
            <div className="pfs-pane-header">
              <div>
                <span className="pfs-pane-kicker">Stage 6 of 6</span>
                <h3 id="stage-6-heading" className="pfs-pane-title">Net Worth &amp; Statement Review</h3>
                <p className="pfs-pane-desc">
                  Review your net worth, key ratios, and download your statement PDF.
                </p>
              </div>
            </div>

            {/* DUAL NET WORTH PRESENTATION */}
            <div className="pfs-networth-dashboard" id="networth-dashboard">
              {/* Measure 1: Accounting Net Worth */}
              <div className="pfs-nw-card accounting-card">
                <span className="pfs-nw-kicker">Total Balance Sheet</span>
                <h4 className="pfs-nw-title">Net Worth (Including Personal Assets)</h4>
                <div className="pfs-nw-equation">
                  <span>Total Assets ({formatINR(result.totalAssets)})</span>
                  <span> − Liabilities ({formatINR(result.totalLiabilities)})</span>
                </div>
                <div className="pfs-nw-result-val text-navy">
                  {formatINR(result.netWorthIncludingPersonalAssets)}
                </div>
                <p className="pfs-nw-desc">
                  Includes your primary home, vehicles, and personal jewellery.
                </p>
              </div>

              {/* Measure 2: Actual / Productive Net Worth */}
              <div className="pfs-nw-card productive-card">
                <span className="pfs-nw-kicker highlight-kicker">Goal-Funding Capital</span>
                <h4 className="pfs-nw-title">Actual Net Worth (Excluding Personal Assets)</h4>
                <div className="pfs-nw-equation">
                  <span>Total Assets − Liabilities − Personal Assets ({formatINR(result.totalPersonalAssets)})</span>
                </div>
                <div className="pfs-nw-result-val text-gold">
                  {formatINR(result.netWorthExcludingPersonalAssets)}
                </div>
                <p className="pfs-nw-desc">
                  Productive investments available to fund retirement and future goals.
                </p>
              </div>
            </div>

            {/* DIAGNOSTIC SOLVENCY RATIOS */}
            <div className="pfs-ratios-grid">
              <div className="pfs-ratio-card">
                <span className="pfs-ratio-lbl">Emergency Reserve Runway</span>
                <span className="pfs-ratio-val">
                  {result.liquidAssetsRunwayMonths !== null ? `${result.liquidAssetsRunwayMonths.toFixed(1)} Months` : 'N/A'}
                </span>
                <span className="pfs-ratio-guide">Target: 3–6 months of expenses.</span>
              </div>

              <div className="pfs-ratio-card">
                <span className="pfs-ratio-lbl">Family Savings Rate</span>
                <span className="pfs-ratio-val">
                  {result.savingsRatePercent !== null ? formatPercentage(result.savingsRatePercent) : 'N/A'}
                </span>
                <span className="pfs-ratio-guide">Target: &gt; 25% of annual income.</span>
              </div>

              <div className="pfs-ratio-card">
                <span className="pfs-ratio-lbl">Debt-to-Asset Ratio</span>
                <span className="pfs-ratio-val">
                  {result.debtToAssetRatioPercent !== null ? formatPercentage(result.debtToAssetRatioPercent) : 'N/A'}
                </span>
                <span className="pfs-ratio-guide">Target: &lt; 35% of total assets.</span>
              </div>

              <div className="pfs-ratio-card">
                <span className="pfs-ratio-lbl">Productive Asset Share</span>
                <span className="pfs-ratio-val">
                  {result.productiveAssetsRatioPercent !== null ? formatPercentage(result.productiveAssetsRatioPercent) : 'N/A'}
                </span>
                <span className="pfs-ratio-guide">Target: &gt; 50% in financial assets.</span>
              </div>
            </div>

            {/* PREPARER DISCUSSION NOTES */}
            <div className="pfs-notes-section">
              <label htmlFor={`${baseId}-discussionNotes`} className="pfs-label font-bold">
                Discussion Notes <span className="pfs-optional">(Included on PDF report)</span>
              </label>
              <textarea
                id={`${baseId}-discussionNotes`}
                className="pfs-textarea"
                rows={3}
                value={discussionNotes}
                placeholder="Optional notes or action items for the PDF report..."
                onChange={(e) => setDiscussionNotes(e.target.value)}
              />
            </div>

            {/* PDF GENERATION & ERROR DISPLAY */}
            {pdfError && (
              <div className="pfs-alert-danger" id="pdf-error-banner">
                <strong>Notice:</strong> {pdfError}
              </div>
            )}

            <div className="pfs-pdf-action-card">
              <div className="pfs-pdf-action-left">
                <h4 className="pfs-pdf-title">Download Statement PDF</h4>
                <p className="pfs-pdf-desc">
                  Generates a 5-page PDF statement locally in your browser.
                </p>
              </div>
              <div className="pfs-pdf-action-right">
                <button
                  type="button"
                  className="pfs-btn-preview-action"
                  onClick={() => setShowPreviewModal(true)}
                  id="btn-preview-statement"
                  title="Inspect statement breakdown before downloading PDF"
                >
                  Preview Statement
                </button>
                <button
                  type="button"
                  className="pfs-btn-download-pdf"
                  onClick={handleDownloadPdf}
                  disabled={pdfGenerating}
                  id="btn-download-pdf"
                >
                  {pdfGenerating ? 'Preparing Document...' : 'Download Personal Finance Statement PDF'}
                </button>
              </div>
            </div>

            <div className="pfs-stage-footer-actions">
              <button type="button" className="pfs-btn-secondary" onClick={handlePrevStage}>
                ← Back to Liabilities
              </button>
            </div>
          </section>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STATEMENT PREVIEW MODAL                                        */}
      {/* ------------------------------------------------------------- */}
      {showPreviewModal && (
        <div className="pfs-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="preview-modal-title">
          <div className="pfs-modal-box pfs-preview-modal-box">
            <div className="pfs-preview-modal-header">
              <div>
                <span className="pfs-pane-kicker">Statement Summary Preview</span>
                <h3 id="preview-modal-title" className="pfs-modal-title">
                  {clientName.trim() || 'Untitled Statement'}
                </h3>
                <p className="pfs-preview-meta-line">
                  Prepared by {preparedBy} • Date: {formatIndianDate(statementDate)}
                </p>
              </div>
              <button
                type="button"
                className="pfs-btn-close-modal"
                onClick={() => setShowPreviewModal(false)}
                aria-label="Close Preview"
              >
                ✕
              </button>
            </div>

            <div className="pfs-preview-modal-body">
              <div className="pfs-preview-table-container">
                <table className="pfs-table pfs-preview-table">
                  <thead>
                    <tr>
                      <th>Schedule / Metric</th>
                      <th className="text-right">Annual Value</th>
                      <th className="text-right">Monthly Equiv.</th>
                      <th>Notes &amp; Ratios</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>1. Total Household Income</strong></td>
                      <td className="text-right font-bold text-teal">{formatINR(result.incomeStage.totalNetAnnualIncome)}</td>
                      <td className="text-right tabular-nums">{formatINR(result.incomeStage.totalNetMonthlyIncome)}</td>
                      <td>All household income sources</td>
                    </tr>
                    <tr>
                      <td><strong>2. Annual Living Costs</strong></td>
                      <td className="text-right font-bold">{formatINR(result.expenseStage.totalAnnualExpenses)}</td>
                      <td className="text-right tabular-nums">{formatINR(result.expenseStage.totalMonthlyExpenses)}</td>
                      <td>Mode: {expenseEntryMode === 'CONSOLIDATED_TOTAL' ? 'Consolidated Total' : 'Category Breakdown'}</td>
                    </tr>
                    <tr>
                      <td><strong>3. Annual Household Savings</strong></td>
                      <td className={`text-right font-bold ${result.savingsStage.annualSavings < 0 ? 'text-negative' : 'text-teal'}`}>
                        {formatINR(result.savingsStage.annualSavings)}
                      </td>
                      <td className="text-right tabular-nums">{formatINR(result.savingsStage.monthlySavings)}</td>
                      <td>Savings Rate: {result.savingsRatePercent !== null ? formatPercentage(result.savingsRatePercent) : 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>4. Committed Ongoing Investments</strong></td>
                      <td className="text-right font-bold">{formatINR(result.savingsStage.totalOngoingInvestmentsAnnual)}</td>
                      <td className="text-right tabular-nums">{formatINR(result.savingsStage.totalOngoingInvestmentsMonthly)}</td>
                      <td>MF SIPs, RDs, PPF</td>
                    </tr>
                    <tr>
                      <td><strong>5. Surplus for Fresh Investment</strong></td>
                      <td className={`text-right font-bold ${result.savingsStage.annualSurplusForFreshInvestments < 0 ? 'text-negative' : 'text-teal'}`}>
                        {formatINR(result.savingsStage.annualSurplusForFreshInvestments)}
                      </td>
                      <td className="text-right tabular-nums">{formatINR(result.savingsStage.monthlySurplusForFreshInvestments)}</td>
                      <td>{result.savingsStage.annualSurplusForFreshInvestments >= 0 ? 'Surplus Available' : 'Cash Flow Deficit'}</td>
                    </tr>
                    <tr>
                      <td><strong>6. Total Household Assets</strong></td>
                      <td className="text-right font-bold">{formatINR(result.totalAssets)}</td>
                      <td className="text-right tabular-nums">-</td>
                      <td>Productive: {formatINR(result.assetStage.totalProductiveAssets)} ({formatPercentage(result.productiveAssetsRatioPercent || 0)})</td>
                    </tr>
                    <tr>
                      <td><strong>7. Personal Consumption Assets</strong></td>
                      <td className="text-right font-bold">{formatINR(result.totalPersonalAssets)}</td>
                      <td className="text-right tabular-nums">-</td>
                      <td>Primary House, Car, Jewellery</td>
                    </tr>
                    <tr>
                      <td><strong>8. Total Liabilities</strong></td>
                      <td className="text-right font-bold">{formatINR(result.totalLiabilities)}</td>
                      <td className="text-right tabular-nums">-</td>
                      <td>Debt/Asset: {result.debtToAssetRatioPercent !== null ? formatPercentage(result.debtToAssetRatioPercent) : '0%'}</td>
                    </tr>
                    <tr className="highlight-preview-row">
                      <td><strong>Actual Net Worth (Excl. Personal)</strong></td>
                      <td className="text-right font-bold text-gold">{formatINR(result.netWorthExcludingPersonalAssets)}</td>
                      <td className="text-right tabular-nums">-</td>
                      <td><strong>Productive Wealth Capital</strong></td>
                    </tr>
                    <tr>
                      <td><strong>Notional Net Worth (Incl. Personal)</strong></td>
                      <td className="text-right font-bold text-navy">{formatINR(result.netWorthIncludingPersonalAssets)}</td>
                      <td className="text-right tabular-nums">-</td>
                      <td>Accounting Balance Sheet Net Worth</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {discussionNotes && discussionNotes.trim() !== '' && (
                <div className="pfs-preview-notes">
                  <strong>Discussion Notes:</strong> {discussionNotes}
                </div>
              )}
            </div>

            <div className="pfs-modal-actions pfs-preview-actions">
              <button
                type="button"
                className="pfs-btn-secondary"
                onClick={() => setShowPreviewModal(false)}
                id="btn-close-preview"
              >
                Close Preview
              </button>
              <button
                type="button"
                className="pfs-btn-download-pdf"
                onClick={() => {
                  setShowPreviewModal(false);
                  handleDownloadPdf();
                }}
                disabled={pdfGenerating}
                id="btn-preview-download-pdf"
              >
                Download PDF Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RESET CONFIRMATION MODAL                                      */}
      {/* ------------------------------------------------------------- */}
      {showResetModal && (
        <div className="pfs-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
          <div className="pfs-modal-box">
            <h3 id="reset-modal-title" className="pfs-modal-title">Reset Statement?</h3>
            <p className="pfs-modal-desc">
              This will clear all in-memory entries for Income, Expenses, Savings, Assets, and Liabilities.
              Any un-downloaded entries will be permanently discarded.
            </p>
            <div className="pfs-modal-actions">
              <button
                type="button"
                className="pfs-btn-secondary"
                onClick={() => setShowResetModal(false)}
                id="btn-cancel-reset"
              >
                Cancel
              </button>
              <button
                type="button"
                className="pfs-btn-danger"
                onClick={handleConfirmReset}
                id="btn-confirm-reset"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCOPED COMPONENT STYLES (Concept C Warm Sage & Pine Theme)     */}
      {/* ------------------------------------------------------------- */}
      <style>{`
        .pfs-app-wrapper {
          display: flex;
          flex-direction: column;
          gap: var(--space-6, 24px);
          width: 100%;
          box-sizing: border-box;
          color: var(--awc-navy, #132A40);
        }

        /* LIVE SUMMARY BAR */
        .pfs-live-bar {
          background: #FFFFFF;
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 14px;
          padding: var(--space-4, 16px);
          box-shadow: 0 2px 10px rgba(15, 83, 56, 0.04);
        }
        .pfs-live-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3, 12px);
        }
        @media (min-width: 768px) {
          .pfs-live-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .pfs-live-grid {
            grid-template-columns: repeat(6, 1fr);
          }
        }
        .pfs-metric-card {
          display: flex;
          flex-direction: column;
          padding: 10px 12px;
          border-radius: 10px;
          background: var(--awc-paper, #F5F8F6);
          border: 1px solid var(--awc-line, #D6E4E0);
        }
        .pfs-metric-card.highlight-card {
          background: linear-gradient(135deg, var(--color-brand-primary, #0f5338) 0%, var(--awc-jade-deep, #0B6B63) 100%);
          color: #FFFFFF;
          border: 1px solid var(--color-brand-primary, #0f5338);
        }
        .pfs-metric-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #546A7B;
          margin-bottom: 2px;
        }
        .pfs-metric-card.highlight-card .pfs-metric-label {
          color: #D6E4E0;
        }
        .pfs-metric-value {
          font-size: 1.15rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          color: var(--awc-navy, #132A40);
        }
        .pfs-metric-card.highlight-card .highlight-value {
          color: var(--awc-gold, #F2C65D);
        }
        .pfs-metric-sub {
          font-size: 0.72rem;
          color: #546A7B;
          margin-top: 2px;
        }
        .pfs-metric-card.highlight-card .pfs-metric-sub {
          color: #E6F4F1;
        }
        .text-teal { color: var(--awc-jade-deep, #0B6B63) !important; }
        .text-gold { color: var(--awc-gold, #F2C65D) !important; }
        .text-navy { color: var(--awc-navy, #132A40) !important; }
        .text-negative { color: #DC2626 !important; }

        /* METADATA SECTION */
        .pfs-meta-section {
          background: #FFFFFF;
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 14px;
          padding: var(--space-4, 16px);
          box-shadow: 0 2px 10px rgba(15, 83, 56, 0.03);
        }
        .pfs-meta-header {
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 8px);
          margin-bottom: var(--space-4, 16px);
        }
        @media (min-width: 768px) {
          .pfs-meta-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        .pfs-meta-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--awc-navy, #132A40);
          margin: 0;
        }
        .pfs-meta-subtitle {
          font-size: 0.8rem;
          color: #546A7B;
          margin: 2px 0 0 0;
        }
        .pfs-meta-actions {
          display: flex;
          gap: var(--space-2, 8px);
          flex-wrap: wrap;
        }
        .pfs-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3, 12px);
          align-items: flex-end;
        }
        @media (min-width: 640px) {
          .pfs-meta-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .pfs-meta-grid {
            grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr;
          }
        }

        /* STEPPER NAVIGATION (NORMAL DOCUMENT FLOW - NON-STICKY) */
        .pfs-nav-stepper {
          position: static;
          background: #FFFFFF;
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 14px;
          padding: 6px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          box-shadow: 0 2px 8px rgba(15, 83, 56, 0.04);
          margin-bottom: 0;
        }
        .pfs-stepper-list {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: 6px;
          min-width: max-content;
          flex-wrap: nowrap;
        }
        .pfs-stepper-item {
          flex: 1 1 0;
          min-width: 0;
          display: flex;
        }
        .pfs-step-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          min-height: 44px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          width: 100%;
          transition: all 0.2s ease;
          box-sizing: border-box;
          white-space: nowrap;
          color: var(--awc-navy, #132A40);
        }
        .pfs-step-btn:hover {
          background: var(--awc-paper, #F5F8F6);
        }
        .pfs-step-btn.active {
          background: var(--color-brand-primary, #0f5338);
          color: #FFFFFF;
          border-color: var(--color-brand-primary, #0f5338);
        }
        .pfs-step-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          min-width: 22px;
          border-radius: 50%;
          background: var(--awc-jade-soft, #E6F4F1);
          color: var(--color-brand-primary, #0f5338);
          font-size: 0.72rem;
          font-weight: 700;
        }
        .pfs-step-btn.active .pfs-step-badge {
          background: var(--awc-gold, #F2C65D);
          color: var(--awc-navy, #132A40);
        }
        .pfs-step-btn.completed .pfs-step-badge {
          background: var(--awc-jade-soft, #E6F4F1);
          color: var(--awc-jade-deep, #0B6B63);
        }
        .pfs-step-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }
        .pfs-step-num {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          opacity: 0.75;
          line-height: 1.1;
        }
        .pfs-step-title {
          font-size: 0.78rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }
        @media (min-width: 1200px) {
          .pfs-stepper-list {
            min-width: 100%;
            width: 100%;
            display: flex;
            align-items: stretch;
            gap: 6px;
          }
          .pfs-stepper-item {
            flex: 1 1 0;
            min-width: 0;
            display: flex;
            align-items: stretch;
          }
          .pfs-step-btn {
            padding: 8px 10px;
            gap: 8px;
            height: 48px;
            min-height: 48px;
            max-height: 48px;
          }
          .pfs-step-title {
            font-size: 0.8rem;
          }
        }

        /* STAGE CANVAS & PANES */
        .pfs-stage-canvas {
          background: #FFFFFF;
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 16px;
          padding: var(--space-5, 22px);
          box-shadow: 0 4px 16px rgba(15, 83, 56, 0.04);
        }
        .pfs-pane-header {
          display: flex;
          flex-direction: column;
          gap: var(--space-3, 12px);
          margin-bottom: var(--space-5, 20px);
          border-bottom: 1px solid var(--awc-line, #D6E4E0);
          padding-bottom: var(--space-4, 16px);
        }
        @media (min-width: 768px) {
          .pfs-pane-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
          }
        }
        .pfs-pane-kicker {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--awc-jade-deep, #0B6B63);
        }
        .pfs-pane-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--awc-navy, #132A40);
          margin: 2px 0 4px 0;
        }
        .pfs-pane-desc {
          font-size: 0.88rem;
          color: #546A7B;
          max-width: 780px;
          line-height: 1.5;
          margin: 0;
        }

        /* FORM CONTROLS — WARM SAGE & PINE THEME */
        .pfs-field-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .pfs-preparer-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 8px 12px;
          background: var(--awc-paper, #F5F8F6);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 10px;
          box-sizing: border-box;
          color: var(--awc-navy, #132A40);
          font-size: 0.82rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pfs-preparer-icon {
          font-size: 0.9rem;
          opacity: 0.7;
          flex-shrink: 0;
        }
        .pfs-preparer-text {
          color: #546A7B;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pfs-preparer-text strong {
          color: var(--awc-navy, #132A40);
          font-weight: 700;
        }
        .pfs-date-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pfs-date-badge-indian {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--color-brand-primary, #0f5338);
          background: var(--awc-jade-soft, #E6F4F1);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 6px;
          padding: 1px 8px;
          letter-spacing: 0.02em;
        }
        .pfs-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--awc-navy, #132A40);
        }
        .pfs-required { color: #DC2626; }
        .pfs-optional { font-size: 0.72rem; color: #7C909D; font-weight: normal; }
        .pfs-input {
          padding: 9px 12px;
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 10px;
          font-size: 0.9rem;
          font-family: inherit;
          font-weight: 600;
          color: var(--awc-navy, #132A40);
          background: var(--awc-paper, #F5F8F6);
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .pfs-input:focus, .pfs-table-input:focus, .pfs-table-select:focus, .pfs-textarea:focus, .pfs-input-sm:focus {
          outline: none;
          border-color: var(--color-border-interactive, #0f5338);
          box-shadow: 0 0 0 3px rgba(15, 83, 56, 0.14);
          background: #FFFFFF;
        }
        .pfs-input-sm {
          padding: 6px 10px;
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--awc-navy, #132A40);
          background: var(--awc-paper, #F5F8F6);
          width: 84px;
        }
        .pfs-input-hint {
          font-size: 0.75rem;
          color: #546A7B;
        }
        .pfs-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 10px;
          font-size: 0.88rem;
          font-family: inherit;
          color: var(--awc-navy, #132A40);
          background: var(--awc-paper, #F5F8F6);
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }

        /* TABLES */
        .pfs-table-responsive {
          width: 100%;
          overflow-x: auto;
          margin-bottom: var(--space-4, 16px);
        }
        .pfs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .pfs-table th {
          background: var(--awc-paper, #F5F8F6);
          color: var(--awc-navy, #132A40);
          font-weight: 700;
          padding: 10px 12px;
          border-bottom: 2px solid var(--awc-line, #D6E4E0);
          text-align: left;
        }
        .pfs-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #EBF1EE;
          vertical-align: middle;
        }
        .pfs-table-input {
          width: 100%;
          height: 38px;
          padding: 6px 10px;
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 10px;
          font-size: 0.86rem;
          font-weight: 600;
          line-height: 1.4;
          font-family: inherit;
          color: var(--awc-navy, #132A40);
          background: var(--awc-paper, #F5F8F6);
          box-sizing: border-box;
          display: block;
          margin: 0;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .pfs-table-input::placeholder {
          color: #8CA099;
          font-weight: 500;
        }
        .pfs-table-input-purpose {
          min-width: 165px;
          font-size: 0.82rem;
        }
        .pfs-table-input-purpose::placeholder {
          font-size: 11.5px;
          color: #8CA099;
        }
        .pfs-table-select {
          width: 100%;
          height: 38px;
          padding: 6px 10px;
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.4;
          color: var(--awc-navy, #132A40);
          background: var(--awc-paper, #F5F8F6);
          box-sizing: border-box;
          display: block;
          margin: 0;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .pfs-table-total-row td {
          background: var(--awc-jade-soft, #E6F4F1);
          border-top: 2px solid var(--color-brand-primary, #0f5338);
          border-bottom: 2px solid var(--color-brand-primary, #0f5338);
          color: var(--awc-navy, #132A40);
          font-weight: 700;
          padding: 12px 10px;
        }
        .highlight-cell {
          color: var(--color-brand-primary, #0f5338);
          font-size: 1.05rem;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .tabular-nums { font-variant-numeric: tabular-nums; }

        /* BUTTONS */
        .pfs-btn-primary {
          background: var(--color-brand-primary, #0f5338);
          color: #FFFFFF;
          padding: 10px 22px;
          border-radius: 10px;
          border: none;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.1s ease;
          box-shadow: 0 2px 6px rgba(15, 83, 56, 0.18);
        }
        .pfs-btn-primary:hover {
          background: var(--awc-jade-deep, #0B6B63);
        }
        .pfs-btn-sample {
          background: var(--awc-jade-soft, #E6F4F1);
          color: var(--color-brand-primary, #0f5338);
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid var(--awc-line, #D6E4E0);
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .pfs-btn-sample:hover {
          background: #D3ECE6;
          border-color: var(--color-brand-primary, #0f5338);
        }
        .pfs-btn-secondary {
          background: var(--awc-paper, #F5F8F6);
          color: var(--awc-navy, #132A40);
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid var(--awc-line, #D6E4E0);
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .pfs-btn-secondary:hover {
          background: var(--awc-jade-soft, #E6F4F1);
          border-color: var(--awc-jade-deep, #0B6B63);
        }
        .pfs-btn-secondary-sm {
          background: var(--awc-paper, #F5F8F6);
          color: var(--color-brand-primary, #0f5338);
          padding: 5px 12px;
          border-radius: 8px;
          border: 1px solid var(--awc-line, #D6E4E0);
          font-weight: 700;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pfs-btn-secondary-sm:hover {
          background: var(--awc-jade-soft, #E6F4F1);
          border-color: var(--color-brand-primary, #0f5338);
        }
        .pfs-btn-outline-danger {
          background: transparent;
          color: #DC2626;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #FCA5A5;
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
        }
        .pfs-btn-outline-danger:hover {
          background: #FEF2F2;
        }
        .pfs-btn-danger {
          background: #DC2626;
          color: #FFFFFF;
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          font-weight: 700;
          cursor: pointer;
        }
        .pfs-btn-row-del {
          background: transparent;
          color: #8CA099;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }
        .pfs-btn-row-del:hover {
          color: #DC2626;
        }
        .pfs-btn-download-pdf {
          background: var(--color-brand-primary, #0f5338);
          color: #FFFFFF;
          padding: 12px 24px;
          border-radius: 10px;
          border: none;
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          transition: background 0.2s ease, transform 0.1s ease;
          box-shadow: 0 4px 12px rgba(15, 83, 56, 0.22);
        }
        .pfs-btn-download-pdf:hover {
          background: var(--awc-jade-deep, #0B6B63);
        }
        .pfs-btn-download-pdf:active {
          transform: translateY(1px);
        }

        /* SEGMENTED CONTROL */
        .pfs-segmented-control {
          display: inline-flex;
          background: var(--awc-paper, #F5F8F6);
          padding: 3px;
          border-radius: 10px;
          border: 1px solid var(--awc-line, #D6E4E0);
        }
        .pfs-segmented-control button {
          background: transparent;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #546A7B;
          cursor: pointer;
        }
        .pfs-segmented-control button.active {
          background: #FFFFFF;
          color: var(--color-brand-primary, #0f5338);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          font-weight: 700;
        }
        .pfs-segmented-control-sm {
          display: inline-flex;
          background: var(--awc-paper, #F5F8F6);
          padding: 2px;
          border-radius: 6px;
        }
        .pfs-segmented-control-sm button {
          background: transparent;
          border: none;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
          color: #546A7B;
          cursor: pointer;
        }
        .pfs-segmented-control-sm button.active {
          background: #FFFFFF;
          color: var(--color-brand-primary, #0f5338);
          font-weight: 700;
        }

        /* CATEGORY SECTION */
        .pfs-category-section {
          margin-bottom: var(--space-5, 20px);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 12px;
          padding: var(--space-4, 16px);
          background: #FFFFFF;
        }
        .pfs-category-section.personal-asset-section {
          border-color: #FDE68A;
          background: #FFFDF7;
        }
        .pfs-category-section.category-bypassed {
          opacity: 0.6;
          pointer-events: none;
        }
        .pfs-cat-header {
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 8px);
          margin-bottom: var(--space-3, 12px);
        }
        @media (min-width: 640px) {
          .pfs-cat-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        .pfs-cat-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-2, 8px);
        }
        .pfs-cat-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--awc-navy, #132A40);
          margin: 0;
        }
        .pfs-cat-desc {
          font-size: 0.78rem;
          color: #546A7B;
          margin: 2px 0 0 0;
        }
        .pfs-cat-right {
          display: flex;
          align-items: center;
          gap: var(--space-3, 12px);
        }
        .pfs-cat-subtotal {
          font-size: 0.85rem;
          color: #546A7B;
        }
        .pfs-badge-warning {
          background: #FEF3C7;
          color: #92400E;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }

        /* EXPENSE ENTRY CHOICE SELECTOR CARD */
        .pfs-mode-selector-card {
          background: var(--awc-paper, #F5F8F6);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 12px;
          padding: var(--space-4, 16px);
          margin-bottom: var(--space-5, 20px);
        }
        .pfs-expense-choice-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3, 12px);
        }
        @media (min-width: 768px) {
          .pfs-expense-choice-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .pfs-expense-choice-card {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3, 12px);
          padding: var(--space-4, 16px);
          background: #FFFFFF;
          border: 2px solid var(--awc-line, #D6E4E0);
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease-in-out;
        }
        .pfs-expense-choice-card:hover {
          border-color: var(--awc-jade-deep, #0B6B63);
          background: var(--awc-paper, #F5F8F6);
        }
        .pfs-expense-choice-card.active {
          border-color: var(--color-brand-primary, #0f5338);
          background: var(--awc-jade-soft, #E6F4F1);
          box-shadow: 0 2px 8px rgba(15, 83, 56, 0.08);
        }
        .pfs-choice-radio-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .pfs-radio-circle {
          display: block;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #8CA099;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .pfs-expense-choice-card.active .pfs-radio-circle {
          border-color: var(--color-brand-primary, #0f5338);
          border-width: 5px;
          background: #FFFFFF;
        }
        .pfs-choice-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .pfs-choice-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--awc-navy, #132A40);
        }
        .pfs-choice-desc {
          font-size: 0.8rem;
          color: #546A7B;
          line-height: 1.4;
        }
        .pfs-mode-body {
          margin-top: var(--space-4, 16px);
          padding-top: var(--space-4, 16px);
          border-top: 1px solid var(--awc-line, #D6E4E0);
        }

        /* ASSET PURPOSE GUIDANCE */
        .pfs-th-sub {
          display: block;
          font-size: 0.65rem;
          font-weight: normal;
          color: #7C909D;
          text-transform: none;
        }

        /* BRIDGE CARD */
        .pfs-bridge-card {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-around;
          background: var(--awc-paper, #F5F8F6);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 12px;
          padding: var(--space-4, 16px);
          margin-bottom: var(--space-5, 20px);
          gap: var(--space-3, 12px);
        }
        .pfs-bridge-step {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .pfs-bridge-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          font-weight: 700;
          color: #546A7B;
        }
        .pfs-bridge-val {
          font-size: 1.35rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .pfs-bridge-sub {
          font-size: 0.75rem;
          color: #546A7B;
        }
        .pfs-bridge-op {
          font-size: 1.5rem;
          font-weight: 700;
          color: #8CA099;
        }

        /* SURPLUS CARD */
        .pfs-surplus-card {
          background: var(--awc-jade-soft, #E6F4F1);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 12px;
          padding: var(--space-4, 16px);
          margin-bottom: var(--space-5, 20px);
        }
        .pfs-surplus-card.surplus-deficit {
          background: #FEF2F2;
          border-color: #FECACA;
        }
        .pfs-surplus-header {
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 8px);
        }
        @media (min-width: 640px) {
          .pfs-surplus-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        .pfs-surplus-kicker {
          font-size: 0.72rem;
          text-transform: uppercase;
          font-weight: 800;
          color: var(--awc-jade-deep, #0B6B63);
        }
        .pfs-surplus-card.surplus-deficit .pfs-surplus-kicker {
          color: #DC2626;
        }
        .pfs-surplus-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--awc-navy, #132A40);
          margin: 0;
        }
        .pfs-surplus-amount {
          font-size: 1.5rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          display: block;
        }
        .pfs-surplus-monthly {
          font-size: 0.8rem;
          color: #546A7B;
        }
        .pfs-surplus-desc {
          font-size: 0.85rem;
          color: var(--awc-navy, #132A40);
          margin: var(--space-2, 8px) 0 0 0;
        }

        /* PROJECTIONS */
        .pfs-projections-card {
          background: #FFFFFF;
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 12px;
          padding: var(--space-4, 16px);
          margin-bottom: var(--space-5, 20px);
        }
        .pfs-proj-header {
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 8px);
          margin-bottom: var(--space-4, 16px);
        }
        @media (min-width: 640px) {
          .pfs-proj-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        .pfs-proj-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--awc-navy, #132A40);
          margin: 0;
        }
        .pfs-proj-desc {
          font-size: 0.8rem;
          color: #546A7B;
          margin: 2px 0 0 0;
        }
        .pfs-proj-rate-box {
          display: flex;
          align-items: center;
          gap: var(--space-2, 8px);
        }
        .pfs-proj-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3, 12px);
        }
        @media (min-width: 768px) {
          .pfs-proj-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .pfs-proj-box {
          background: var(--awc-paper, #F5F8F6);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .pfs-proj-years {
          font-size: 0.8rem;
          font-weight: 700;
          color: #546A7B;
          margin-bottom: 4px;
        }
        .pfs-proj-future-val {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-brand-primary, #0f5338);
          font-variant-numeric: tabular-nums;
        }
        .pfs-proj-invested {
          font-size: 0.72rem;
          color: #546A7B;
          margin-top: 4px;
        }
        .pfs-proj-gain {
          font-size: 0.72rem;
          color: var(--awc-jade-deep, #0B6B63);
          font-weight: 600;
        }
        .pfs-disclaimer-sub {
          display: block;
          font-size: 0.7rem;
          color: #7C909D;
          margin-top: var(--space-3, 12px);
          font-style: italic;
        }

        /* TOTAL SUMMARY CARD */
        .pfs-total-summary-card {
          background: var(--awc-paper, #F5F8F6);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 10px;
          padding: var(--space-4, 16px);
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 8px);
          margin-bottom: var(--space-5, 20px);
        }
        .pfs-summary-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }
        .text-xl { font-size: 1.25rem !important; }

        /* DEBT METRIC CARD */
        .pfs-debt-metric-card {
          background: var(--awc-paper, #F5F8F6);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 10px;
          padding: var(--space-4, 16px);
          margin-bottom: var(--space-5, 20px);
        }
        .pfs-metric-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .pfs-metric-lbl {
          font-size: 0.8rem;
          font-weight: 700;
          color: #546A7B;
          text-transform: uppercase;
        }
        .pfs-metric-big {
          font-size: 1.8rem;
          font-weight: 800;
          margin: 4px 0;
          font-variant-numeric: tabular-nums;
        }
        .pfs-metric-hint {
          font-size: 0.75rem;
          color: #546A7B;
        }

        /* NET WORTH DASHBOARD */
        .pfs-networth-dashboard {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4, 16px);
          margin-bottom: var(--space-5, 20px);
        }
        @media (min-width: 768px) {
          .pfs-networth-dashboard {
            grid-template-columns: 1fr 1fr;
          }
        }
        .pfs-nw-card {
          border-radius: 14px;
          padding: var(--space-5, 20px);
          display: flex;
          flex-direction: column;
        }
        .accounting-card {
          background: var(--awc-paper, #F5F8F6);
          border: 1px solid var(--awc-line, #D6E4E0);
        }
        .productive-card {
          background: linear-gradient(135deg, var(--color-brand-primary, #0f5338) 0%, var(--awc-jade-deep, #0B6B63) 100%);
          border: 1px solid var(--color-brand-primary, #0f5338);
          color: #FFFFFF;
        }
        .pfs-nw-kicker {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #546A7B;
        }
        .productive-card .highlight-kicker {
          color: #A7F3D0;
        }
        .pfs-nw-title {
          font-size: 1.15rem;
          font-weight: 800;
          margin: 4px 0 8px 0;
          color: var(--awc-navy, #132A40);
        }
        .productive-card .pfs-nw-title {
          color: #FFFFFF;
        }
        .pfs-nw-equation {
          font-size: 0.78rem;
          color: #546A7B;
          margin-bottom: 12px;
        }
        .productive-card .pfs-nw-equation {
          color: #E6F4F1;
        }
        .pfs-nw-result-val {
          font-size: 2rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          margin-bottom: 10px;
        }
        .pfs-nw-desc {
          font-size: 0.82rem;
          line-height: 1.5;
          margin: 0;
          color: #546A7B;
        }
        .productive-card .pfs-nw-desc {
          color: #E6F4F1;
        }

        /* RATIOS GRID */
        .pfs-ratios-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3, 12px);
          margin-bottom: var(--space-5, 20px);
        }
        @media (min-width: 640px) {
          .pfs-ratios-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .pfs-ratios-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .pfs-ratio-card {
          background: var(--awc-paper, #F5F8F6);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
        }
        .pfs-ratio-lbl {
          font-size: 0.75rem;
          font-weight: 700;
          color: #546A7B;
          text-transform: uppercase;
        }
        .pfs-ratio-val {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--awc-navy, #132A40);
          margin: 4px 0;
          font-variant-numeric: tabular-nums;
        }
        .pfs-ratio-guide {
          font-size: 0.72rem;
          color: #546A7B;
        }

        /* NOTES SECTION */
        .pfs-notes-section {
          margin-bottom: var(--space-5, 20px);
        }

        /* PDF ACTION CARD */
        .pfs-pdf-action-card {
          background: var(--awc-jade-soft, #E6F4F1);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 14px;
          padding: var(--space-5, 20px);
          display: flex;
          flex-direction: column;
          gap: var(--space-4, 16px);
          margin-bottom: var(--space-5, 20px);
        }
        @media (min-width: 1024px) {
          .pfs-pdf-action-card {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        .pfs-pdf-action-left {
          flex: 1 1 auto;
          min-width: 280px;
        }
        .pfs-pdf-action-right {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          flex-wrap: nowrap;
          flex-shrink: 0;
        }
        .pfs-btn-preview-action {
          background: #FFFFFF;
          color: var(--awc-navy, #132A40);
          border: 1px solid var(--awc-line, #D6E4E0);
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          min-height: 48px;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .pfs-btn-preview-action:hover {
          background: var(--awc-paper, #F5F8F6);
          border-color: var(--color-brand-primary, #0f5338);
          color: var(--color-brand-primary, #0f5338);
        }
        .pfs-pdf-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--awc-navy, #132A40);
          margin: 0 0 4px 0;
        }
        .pfs-pdf-desc {
          font-size: 0.85rem;
          color: #546A7B;
          max-width: 580px;
          line-height: 1.5;
          margin: 0;
        }

        /* ALERTS */
        .pfs-alert-info {
          background: var(--awc-jade-soft, #E6F4F1);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.82rem;
          color: var(--color-brand-primary, #0f5338);
        }
        .pfs-alert-warning {
          background: #FEF3C7;
          border: 1px solid #FDE68A;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.85rem;
          color: #92400E;
          margin-top: 10px;
        }
        .pfs-alert-danger {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.85rem;
          color: #DC2626;
          margin-bottom: var(--space-4, 16px);
        }

        /* FOOTER ACTIONS */
        .pfs-stage-footer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--space-5, 20px);
          padding-top: var(--space-4, 16px);
          border-top: 1px solid var(--awc-line, #D6E4E0);
        }

        /* MODAL */
        .pfs-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(19, 42, 64, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
        }
        .pfs-modal-box {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 24px;
          max-width: 440px;
          width: 100%;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        .pfs-modal-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--awc-navy, #132A40);
          margin: 0 0 8px 0;
        }
        .pfs-modal-desc {
          font-size: 0.88rem;
          color: #546A7B;
          line-height: 1.5;
          margin: 0 0 20px 0;
        }
        .pfs-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        /* PREVIEW MODAL SPECIFIC */
        .pfs-preview-modal-box {
          max-width: 840px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          padding: 20px 24px;
        }
        .pfs-preview-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--awc-line, #D6E4E0);
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .pfs-preview-meta-line {
          font-size: 0.8rem;
          color: #546A7B;
          margin: 4px 0 0 0;
        }
        .pfs-btn-close-modal {
          background: transparent;
          border: none;
          font-size: 1.25rem;
          color: #8CA099;
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
        }
        .pfs-btn-close-modal:hover {
          color: var(--awc-navy, #132A40);
        }
        .pfs-preview-modal-body {
          overflow-y: auto;
          flex: 1;
          margin-bottom: 16px;
        }
        .pfs-preview-table-container {
          margin-bottom: 12px;
        }
        .pfs-preview-table th {
          background: var(--color-brand-primary, #0f5338);
          color: #FFFFFF;
          font-size: 0.8rem;
          padding: 8px 10px;
        }
        .pfs-preview-table td {
          padding: 7px 10px;
          font-size: 0.82rem;
        }
        .highlight-preview-row td {
          background: var(--awc-jade-soft, #E6F4F1);
          border-top: 1px solid var(--awc-line, #D6E4E0);
          border-bottom: 1px solid var(--awc-line, #D6E4E0);
        }
        .pfs-preview-notes {
          background: var(--awc-paper, #F5F8F6);
          border: 1px solid var(--awc-line, #D6E4E0);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.82rem;
          color: var(--awc-navy, #132A40);
          line-height: 1.5;
        }
        .pfs-preview-actions {
          border-top: 1px solid var(--awc-line, #D6E4E0);
          padding-top: 12px;
        }

        /* MOBILE RESPONSIVE OPTIMIZATIONS (<= 640px & 390px viewport) */
        @media (max-width: 640px) {
          .pfs-app-wrapper {
            gap: 12px;
          }
          .pfs-live-bar {
            padding: 10px;
          }
          .pfs-live-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .pfs-metric-card {
            padding: 6px 8px;
          }
          .pfs-metric-value {
            font-size: 0.98rem;
          }
          .pfs-meta-section {
            padding: 12px;
          }
          .pfs-meta-header {
            margin-bottom: 10px;
          }
          .pfs-meta-actions {
            width: 100%;
          }
          .pfs-meta-actions button {
            flex: 1;
            text-align: center;
          }
          .pfs-stage-canvas {
            padding: 12px;
          }
          .pfs-pane-title {
            font-size: 1.15rem;
          }
          .pfs-pane-desc {
            font-size: 0.8rem;
          }
          .pfs-table th, .pfs-table td {
            padding: 6px 4px;
            font-size: 0.78rem;
          }
          .pfs-table-input, .pfs-table-select {
            padding: 4px 6px;
            font-size: 0.78rem;
          }
          .pfs-pdf-action-card {
            padding: 12px;
          }
          .pfs-pdf-action-right {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
          }
          .pfs-pdf-action-right button {
            width: 100%;
          }
          .pfs-preview-modal-box {
            padding: 14px;
            max-height: 94vh;
          }
          .pfs-stage-footer-actions {
            flex-direction: column-reverse;
            gap: 12px;
            align-items: stretch;
          }
          .pfs-stage-footer-actions button {
            width: 100%;
            text-align: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
