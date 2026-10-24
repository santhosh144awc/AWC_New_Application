import React, { useState, useMemo } from 'react';
import {
  calculateLifeInsurancePlan,
  calculateMilestonePV,
  validateLifeInsuranceInput,
  ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE,
  type FutureMilestone,
  type LifeInsuranceInput,
} from '../../domain/finance/lifeInsurance';
import { formatINR, formatIndianCompact, formatPercentage } from '../../lib/formatters';

export const LifeInsurancePlannerIsland: React.FC = () => {
  // Step navigation (1: Family Support, 2: Liabilities & Buffer, 3: Goals & Assets, 4: Protection Review)
  const [activeStep, setActiveStep] = useState<number>(1);

  // Step 1: Routine Family Support State
  const [annualTakeHomeIncome, setAnnualTakeHomeIncome] = useState<number | ''>('');
  const [annualFamilyLivingExpenses, setAnnualFamilyLivingExpenses] = useState<number | ''>('');
  const [supportDurationYears, setSupportDurationYears] = useState<number>(20);
  const [supportExpenseGrowthPct, setSupportExpenseGrowthPct] = useState<number>(6.0);
  const [investmentReturnPct, setInvestmentReturnPct] = useState<number>(7.5);

  // Step 2: Liabilities & Immediate Buffer State
  const [homeLoanOutstanding, setHomeLoanOutstanding] = useState<number | ''>('');
  const [otherLoansOutstanding, setOtherLoansOutstanding] = useState<number | ''>('');
  const [otherLiabilities, setOtherLiabilities] = useState<number | ''>('');
  const [immediateTransitionBuffer, setImmediateTransitionBuffer] = useState<number | ''>('');

  // Step 3: Future Milestones & Earmarked Assets State
  const [futureMilestones, setFutureMilestones] = useState<FutureMilestone[]>([]);
  const [newMilestoneName, setNewMilestoneName] = useState<string>('');
  const [newMilestoneCost, setNewMilestoneCost] = useState<number | ''>('');
  const [newMilestoneYears, setNewMilestoneYears] = useState<number | ''>('');
  const [newMilestoneInflation, setNewMilestoneInflation] = useState<number>(7.0);

  const [eligibleEarmarkedFunds, setEligibleEarmarkedFunds] = useState<number | ''>('');
  const [existingPersonalLifeCover, setExistingPersonalLifeCover] = useState<number | ''>('');
  const [employerGroupLifeCover, setEmployerGroupLifeCover] = useState<number | ''>('');
  const [includeEmployerGroupCover, setIncludeEmployerGroupCover] = useState<boolean>(false);

  // Example Banner State
  const [isExampleLoaded, setIsExampleLoaded] = useState<boolean>(false);

  // Dismiss example banner whenever user edits any field
  const handleUserEdit = () => {
    if (isExampleLoaded) {
      setIsExampleLoaded(false);
    }
  };

  // Load Illustrative Example (VEC-LIFE-09)
  const handleLoadExample = () => {
    setAnnualTakeHomeIncome(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.annualTakeHomeIncome ?? '');
    setAnnualFamilyLivingExpenses(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.annualFamilyLivingExpenses);
    setSupportDurationYears(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.supportDurationYears);
    setSupportExpenseGrowthPct(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.supportExpenseGrowthPct);
    setInvestmentReturnPct(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.investmentReturnPct);

    setHomeLoanOutstanding(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.homeLoanOutstanding);
    setOtherLoansOutstanding(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.otherLoansOutstanding);
    setOtherLiabilities(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.otherLiabilities);
    setImmediateTransitionBuffer(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.immediateTransitionBuffer);

    setFutureMilestones(
      ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.futureMilestones.map((m) => ({ ...m }))
    );
    setEligibleEarmarkedFunds(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.eligibleEarmarkedFunds);
    setExistingPersonalLifeCover(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.existingPersonalLifeCover);
    setEmployerGroupLifeCover(ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.employerGroupLifeCover);
    setIncludeEmployerGroupCover(true);

    setIsExampleLoaded(true);
    setActiveStep(1);
  };

  // Clear All / Neutral Initial State
  const handleClearAll = () => {
    setAnnualTakeHomeIncome('');
    setAnnualFamilyLivingExpenses('');
    setSupportDurationYears(20);
    setSupportExpenseGrowthPct(6.0);
    setInvestmentReturnPct(7.5);

    setHomeLoanOutstanding('');
    setOtherLoansOutstanding('');
    setOtherLiabilities('');
    setImmediateTransitionBuffer('');

    setFutureMilestones([]);
    setNewMilestoneName('');
    setNewMilestoneCost('');
    setNewMilestoneYears('');
    setNewMilestoneInflation(7.0);

    setEligibleEarmarkedFunds('');
    setExistingPersonalLifeCover('');
    setEmployerGroupLifeCover('');
    setIncludeEmployerGroupCover(false);

    setIsExampleLoaded(false);
    setActiveStep(1);
  };

  // Milestone Actions
  const handleAddMilestone = () => {
    if (!newMilestoneName.trim()) return;
    const cost = typeof newMilestoneCost === 'number' ? Math.max(0, newMilestoneCost) : 0;
    const years = typeof newMilestoneYears === 'number' ? Math.max(0, Math.min(50, newMilestoneYears)) : 5;
    const inflation = Math.max(0, Math.min(15, newMilestoneInflation));

    const newMilestone: FutureMilestone = {
      id: `milestone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newMilestoneName.trim(),
      costToday: cost,
      yearsUntilGoal: years,
      inflationRatePct: inflation,
    };

    setFutureMilestones((prev) => [...prev, newMilestone]);
    setNewMilestoneName('');
    setNewMilestoneCost('');
    setNewMilestoneYears('');
    setNewMilestoneInflation(7.0);
    handleUserEdit();
  };

  const handleRemoveMilestone = (id: string) => {
    setFutureMilestones((prev) => prev.filter((m) => m.id !== id));
    handleUserEdit();
  };

  // Check if minimum inputs exist to render meaningful results
  const hasMinimumInputs = useMemo(() => {
    return (
      (typeof annualFamilyLivingExpenses === 'number' && annualFamilyLivingExpenses > 0) ||
      (typeof homeLoanOutstanding === 'number' && homeLoanOutstanding > 0) ||
      (typeof otherLoansOutstanding === 'number' && otherLoansOutstanding > 0) ||
      (typeof immediateTransitionBuffer === 'number' && immediateTransitionBuffer > 0) ||
      futureMilestones.length > 0
    );
  }, [
    annualFamilyLivingExpenses,
    homeLoanOutstanding,
    otherLoansOutstanding,
    immediateTransitionBuffer,
    futureMilestones,
  ]);

  // Construct Domain Input Object
  const currentDomainInput: LifeInsuranceInput = useMemo(() => {
    return {
      annualTakeHomeIncome:
        typeof annualTakeHomeIncome === 'number' ? annualTakeHomeIncome : undefined,
      annualFamilyLivingExpenses:
        typeof annualFamilyLivingExpenses === 'number' ? annualFamilyLivingExpenses : 0,
      supportDurationYears,
      supportExpenseGrowthPct,
      investmentReturnPct,
      homeLoanOutstanding:
        typeof homeLoanOutstanding === 'number' ? homeLoanOutstanding : 0,
      otherLoansOutstanding:
        typeof otherLoansOutstanding === 'number' ? otherLoansOutstanding : 0,
      otherLiabilities: typeof otherLiabilities === 'number' ? otherLiabilities : 0,
      immediateTransitionBuffer:
        typeof immediateTransitionBuffer === 'number' ? immediateTransitionBuffer : 0,
      futureMilestones,
      eligibleEarmarkedFunds:
        typeof eligibleEarmarkedFunds === 'number' ? eligibleEarmarkedFunds : 0,
      existingPersonalLifeCover:
        typeof existingPersonalLifeCover === 'number' ? existingPersonalLifeCover : 0,
      employerGroupLifeCover:
        typeof employerGroupLifeCover === 'number' ? employerGroupLifeCover : 0,
      includeEmployerGroupCover,
    };
  }, [
    annualTakeHomeIncome,
    annualFamilyLivingExpenses,
    supportDurationYears,
    supportExpenseGrowthPct,
    investmentReturnPct,
    homeLoanOutstanding,
    otherLoansOutstanding,
    otherLiabilities,
    immediateTransitionBuffer,
    futureMilestones,
    eligibleEarmarkedFunds,
    existingPersonalLifeCover,
    employerGroupLifeCover,
    includeEmployerGroupCover,
  ]);

  // Validate Input
  const validation = useMemo(() => {
    return validateLifeInsuranceInput(currentDomainInput);
  }, [currentDomainInput]);

  // Compute Calculation Plan (only when valid, avoiding silent plausible estimates from malformed input)
  const planResult = useMemo(() => {
    if (!validation.isValid) return null;
    return calculateLifeInsurancePlan(currentDomainInput);
  }, [currentDomainInput, validation.isValid]);

  const exampleTotalDebt =
    (ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.homeLoanOutstanding || 0) +
    (ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.otherLoansOutstanding || 0) +
    (ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.otherLiabilities || 0);

  const exampleMilestonesToday = (ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.futureMilestones || []).reduce(
    (sum, m) => sum + m.costToday,
    0
  );

  return (
    <div
      className="planner-container"
      data-testid="life-insurance-planner-island"
      id="life-insurance-planner-island"
    >
      {/* Top Controls: Example Loader & Clear All */}
      <div className="planner-top-actions">
        <button
          type="button"
          onClick={handleLoadExample}
          className="btn-example"
          data-testid="load-example-btn"
          id="load-example-btn"
        >
          <span className="btn-icon" aria-hidden="true">💡</span>
          Load Illustrative Family Example
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          className="btn-clear"
          data-testid="clear-all-btn"
          id="clear-all-btn"
        >
          <span className="btn-icon" aria-hidden="true">↺</span>
          Clear All
        </button>
      </div>

      {/* Illustrative Example Banner */}
      {isExampleLoaded && (
        <div
          className="example-banner"
          role="status"
          aria-live="polite"
          data-testid="illustrative-example-banner"
        >
          <div className="example-banner-content">
            <span className="example-badge">Illustrative Benchmark Scenario</span>
            <p className="example-text">
              <strong>Illustrative family example loaded — sample values appear across the fields below.</strong> Benchmark scenario with ₹{((ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.annualTakeHomeIncome ?? 0) / 100000).toFixed(0)}L income, ₹{((ILLUSTRATIVE_LIFE_INSURANCE_EXAMPLE.annualFamilyLivingExpenses ?? 0) / 100000).toFixed(1)}L family living expenses, ₹{(exampleTotalDebt / 100000).toFixed(0)}L debt liabilities, and ₹{(exampleMilestonesToday / 100000).toFixed(0)}L milestone costs in today&apos;s rupees. <em>Editing any value dismisses this banner.</em>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsExampleLoaded(false)}
            className="btn-dismiss"
            aria-label="Dismiss example banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* Validation Warning (Income vs Family Living Contribution) */}
      {validation.warnings.annualFamilyLivingExpenses && (
        <div
          className="warning-banner"
          role="alert"
          data-testid="income-warning-alert"
        >
          <span className="warning-icon" aria-hidden="true">⚠️</span>
          <div>
            <strong>Routine living expenses exceed take-home income:</strong> {validation.warnings.annualFamilyLivingExpenses}
          </div>
        </div>
      )}

      {/* Guided 4-Step Progress Navigation */}
      <nav className="step-progress-nav" aria-label="Planner Steps">
        <ol className="step-progress-list">
          {[
            { step: 1, title: '1. Family Support', desc: 'Routine living needs' },
            { step: 2, title: '2. Liabilities & Buffer', desc: 'Outstanding obligations' },
            { step: 3, title: '3. Goals & Assets', desc: 'Milestones & funds' },
            { step: 4, title: '4. Protection Gap', desc: 'Summary & review' },
          ].map((item) => (
            <li
              key={item.step}
              className={`step-item ${activeStep === item.step ? 'active' : ''} ${
                activeStep > item.step ? 'completed' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveStep(item.step)}
                className="step-button"
                aria-current={activeStep === item.step ? 'step' : undefined}
                data-testid={`step-tab-${item.step}`}
              >
                <span className="step-number">{item.step}</span>
                <span className="step-text-container">
                  <span className="step-title">{item.title}</span>
                  <span className="step-desc">{item.desc}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Panels */}
      <div className="step-panel-container">
        {/* STEP 1: ROUTINE FAMILY SUPPORT */}
        {activeStep === 1 && (
          <section className="planner-step-card" aria-labelledby="step-1-heading">
            <div className="step-header">
              <span className="step-tag">Step 1 of 4</span>
              <h2 id="step-1-heading" className="step-heading">
                Family Routine Living Support
              </h2>
              <p className="step-subheading">
                Estimate the ongoing cash flow needed for your family&apos;s routine living expenses if the primary income earner is no longer around.
              </p>
            </div>

            <div className="input-grid">
              {/* Annual Take-Home Income */}
              <div className="form-group">
                <label htmlFor="annual-income" className="field-label">
                  Annual Take-Home Income of Earner (₹/year)
                </label>
                <div className="input-with-affix">
                  <span className="affix" aria-hidden="true">₹</span>
                  <input
                    id="annual-income"
                    data-testid="input-annual-income"
                    type="number"
                    min="0"
                    step="50000"
                    placeholder="e.g. 18,00,000"
                    value={annualTakeHomeIncome}
                    aria-invalid={Boolean(validation.errors.annualTakeHomeIncome)}
                    aria-describedby={
                      validation.errors.annualTakeHomeIncome
                        ? 'err-annual-income'
                        : undefined
                    }
                    onChange={(e) => {
                      const v = e.target.value === '' ? '' : Number(e.target.value);
                      setAnnualTakeHomeIncome(v);
                      handleUserEdit();
                    }}
                    className="text-input"
                  />
                </div>
                {validation.errors.annualTakeHomeIncome && (
                  <span id="err-annual-income" className="field-error-text" role="alert">
                    {validation.errors.annualTakeHomeIncome}
                  </span>
                )}
                <span className="helper-text">
                  Net in-hand annual earnings of the income earner after tax and statutory deductions.
                </span>
              </div>

              {/* Annual Family Living Support */}
              <div className="form-group">
                <label htmlFor="family-living-expenses" className="field-label">
                  Annual Routine Family Living Support (₹/year)
                </label>
                <div className="input-with-affix">
                  <span className="affix" aria-hidden="true">₹</span>
                  <input
                    id="family-living-expenses"
                    data-testid="input-family-living-expenses"
                    type="number"
                    min="0"
                    step="25000"
                    placeholder="e.g. 7,20,000 (₹60k/mo)"
                    value={annualFamilyLivingExpenses}
                    aria-invalid={Boolean(validation.errors.annualFamilyLivingExpenses)}
                    aria-describedby={
                      validation.errors.annualFamilyLivingExpenses
                        ? 'err-family-expenses'
                        : undefined
                    }
                    onChange={(e) => {
                      const v = e.target.value === '' ? '' : Number(e.target.value);
                      setAnnualFamilyLivingExpenses(v);
                      handleUserEdit();
                    }}
                    className="text-input"
                  />
                </div>
                {validation.errors.annualFamilyLivingExpenses && (
                  <span id="err-family-expenses" className="field-error-text" role="alert">
                    {validation.errors.annualFamilyLivingExpenses}
                  </span>
                )}
                <span className="helper-text">
                  Routine family expenses only (food, utilities, rent, healthcare). <strong>Must exclude loan EMIs and separately entered milestone amounts</strong> to avoid double counting.
                </span>
              </div>

              {/* Dependency Support Years */}
              <div className="form-group">
                <label htmlFor="support-duration" className="field-label">
                  Dependency Horizon: <strong>{supportDurationYears} Years</strong>
                </label>
                <input
                  id="support-duration"
                  data-testid="input-years-needed"
                  type="range"
                  min="1"
                  max="45"
                  step="1"
                  value={supportDurationYears}
                  aria-invalid={Boolean(validation.errors.supportDurationYears)}
                  aria-describedby={
                    validation.errors.supportDurationYears
                      ? 'err-support-duration'
                      : undefined
                  }
                  onChange={(e) => {
                    setSupportDurationYears(Number(e.target.value));
                    handleUserEdit();
                  }}
                  className="range-input"
                />
                {validation.errors.supportDurationYears && (
                  <span id="err-support-duration" className="field-error-text" role="alert">
                    {validation.errors.supportDurationYears}
                  </span>
                )}
                <span className="helper-text">
                  How long the family may need financial support under this scenario (e.g. until youngest dependent becomes financially self-sufficient, 1–45 years).
                </span>
              </div>

              {/* Expense Growth / Inflation Rate */}
              <div className="form-group">
                <label htmlFor="support-growth" className="field-label">
                  Assumed Living Expense Inflation: <strong>{formatPercentage(supportExpenseGrowthPct)}</strong>
                </label>
                <input
                  id="support-growth"
                  data-testid="input-support-growth"
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={supportExpenseGrowthPct}
                  aria-invalid={Boolean(validation.errors.supportExpenseGrowthPct)}
                  aria-describedby={
                    validation.errors.supportExpenseGrowthPct
                      ? 'err-support-growth'
                      : undefined
                  }
                  onChange={(e) => {
                    setSupportExpenseGrowthPct(Number(e.target.value));
                    handleUserEdit();
                  }}
                  className="range-input"
                />
                {validation.errors.supportExpenseGrowthPct && (
                  <span id="err-support-growth" className="field-error-text" role="alert">
                    {validation.errors.supportExpenseGrowthPct}
                  </span>
                )}
                <span className="helper-text">
                  Hypothetical illustrative assumption for annual cost escalation on routine household expenses.
                </span>
              </div>

              {/* Corpus Return Rate */}
              <div className="form-group">
                <label htmlFor="corpus-return" className="field-label">
                  Assumed Support Corpus Deployment Return: <strong>{formatPercentage(investmentReturnPct)}</strong>
                </label>
                <input
                  id="corpus-return"
                  data-testid="input-corpus-return"
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={investmentReturnPct}
                  aria-invalid={Boolean(validation.errors.investmentReturnPct)}
                  aria-describedby={
                    validation.errors.investmentReturnPct
                      ? 'err-investment-return'
                      : undefined
                  }
                  onChange={(e) => {
                    setInvestmentReturnPct(Number(e.target.value));
                    handleUserEdit();
                  }}
                  className="range-input"
                />
                {validation.errors.investmentReturnPct && (
                  <span id="err-investment-return" className="field-error-text" role="alert">
                    {validation.errors.investmentReturnPct}
                  </span>
                )}
                <span className="helper-text">
                  Hypothetical effective annual return assumption earned on a deployed support corpus. Returns are uncertain and not guaranteed.
                </span>
              </div>
            </div>

            <div className="step-actions">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="btn-primary"
                data-testid="next-step-btn"
              >
                Continue to Liabilities & Buffer →
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: OUTSTANDING LIABILITIES & TRANSITION BUFFER */}
        {activeStep === 2 && (
          <section className="planner-step-card" aria-labelledby="step-2-heading">
            <div className="step-header">
              <span className="step-tag">Step 2 of 4</span>
              <h2 id="step-2-heading" className="step-heading">
                Outstanding Liabilities & Transition Buffer
              </h2>
              <p className="step-subheading">
                Enter debt obligations and liquid transition funds you choose to include in the modeled scenario.
              </p>
            </div>

            <div className="input-grid">
              {/* Home Loan Balance */}
              <div className="form-group">
                <label htmlFor="loan-home" className="field-label">
                  Outstanding Home Loan Principal (₹)
                </label>
                <div className="input-with-affix">
                  <span className="affix" aria-hidden="true">₹</span>
                  <input
                    id="loan-home"
                    data-testid="input-loan-home"
                    type="number"
                    min="0"
                    step="50000"
                    placeholder="e.g. 45,00,000"
                    value={homeLoanOutstanding}
                    aria-invalid={Boolean(validation.errors.homeLoanOutstanding)}
                    aria-describedby={
                      validation.errors.homeLoanOutstanding
                        ? 'err-loan-home'
                        : undefined
                    }
                    onChange={(e) => {
                      const v = e.target.value === '' ? '' : Number(e.target.value);
                      setHomeLoanOutstanding(v);
                      handleUserEdit();
                    }}
                    className="text-input"
                  />
                </div>
                {validation.errors.homeLoanOutstanding && (
                  <span id="err-loan-home" className="field-error-text" role="alert">
                    {validation.errors.homeLoanOutstanding}
                  </span>
                )}
                <span className="helper-text">
                  Outstanding home loan principal today, if you choose to cover this liability in the modeled scenario.
                </span>
              </div>

              {/* Other Loans */}
              <div className="form-group">
                <label htmlFor="loan-other" className="field-label">
                  Vehicle, Personal & Education Loans (₹)
                </label>
                <div className="input-with-affix">
                  <span className="affix" aria-hidden="true">₹</span>
                  <input
                    id="loan-other"
                    data-testid="input-loan-other"
                    type="number"
                    min="0"
                    step="25000"
                    placeholder="e.g. 5,00,000"
                    value={otherLoansOutstanding}
                    aria-invalid={Boolean(validation.errors.otherLoansOutstanding)}
                    aria-describedby={
                      validation.errors.otherLoansOutstanding
                        ? 'err-loan-other'
                        : undefined
                    }
                    onChange={(e) => {
                      const v = e.target.value === '' ? '' : Number(e.target.value);
                      setOtherLoansOutstanding(v);
                      handleUserEdit();
                    }}
                    className="text-input"
                  />
                </div>
                {validation.errors.otherLoansOutstanding && (
                  <span id="err-loan-other" className="field-error-text" role="alert">
                    {validation.errors.otherLoansOutstanding}
                  </span>
                )}
                <span className="helper-text">
                  Outstanding principal across car, vehicle, education, or personal credit obligations.
                </span>
              </div>

              {/* Other Liabilities */}
              <div className="form-group">
                <label htmlFor="other-liabilities" className="field-label">
                  Other Liabilities or Family Commitments (₹)
                </label>
                <div className="input-with-affix">
                  <span className="affix" aria-hidden="true">₹</span>
                  <input
                    id="other-liabilities"
                    data-testid="input-other-liabilities"
                    type="number"
                    min="0"
                    step="25000"
                    placeholder="e.g. 0"
                    value={otherLiabilities}
                    aria-invalid={Boolean(validation.errors.otherLiabilities)}
                    aria-describedby={
                      validation.errors.otherLiabilities
                        ? 'err-other-liabilities'
                        : undefined
                    }
                    onChange={(e) => {
                      const v = e.target.value === '' ? '' : Number(e.target.value);
                      setOtherLiabilities(v);
                      handleUserEdit();
                    }}
                    className="text-input"
                  />
                </div>
                {validation.errors.otherLiabilities && (
                  <span id="err-other-liabilities" className="field-error-text" role="alert">
                    {validation.errors.otherLiabilities}
                  </span>
                )}
                <span className="helper-text">
                  Informal family borrowings, business commitments, or other obligations you choose to clear.
                </span>
              </div>

              {/* Immediate Transition & Emergency Reserve */}
              <div className="form-group">
                <label htmlFor="immediate-obligations" className="field-label">
                  Immediate Emergency & Transition Buffer (₹)
                </label>
                <div className="input-with-affix">
                  <span className="affix" aria-hidden="true">₹</span>
                  <input
                    id="immediate-obligations"
                    data-testid="input-immediate-obligations"
                    type="number"
                    min="0"
                    step="25000"
                    placeholder="e.g. 5,00,000"
                    value={immediateTransitionBuffer}
                    aria-invalid={Boolean(validation.errors.immediateTransitionBuffer)}
                    aria-describedby={
                      validation.errors.immediateTransitionBuffer
                        ? 'err-immediate-obligations'
                        : undefined
                    }
                    onChange={(e) => {
                      const v = e.target.value === '' ? '' : Number(e.target.value);
                      setImmediateTransitionBuffer(v);
                      handleUserEdit();
                    }}
                    className="text-input"
                  />
                </div>
                {validation.errors.immediateTransitionBuffer && (
                  <span id="err-immediate-obligations" className="field-error-text" role="alert">
                    {validation.errors.immediateTransitionBuffer}
                  </span>
                )}
                <span className="helper-text">
                  Immediate transition reserve for medical/estate transition costs and 3–6 months of family runway.
                </span>
              </div>
            </div>

            <div className="step-actions">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="btn-secondary"
                data-testid="prev-step-btn"
              >
                ← Back to Family Support
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="btn-primary"
                data-testid="next-step-btn"
              >
                Continue to Goals & Assets →
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: FUTURE GOALS & EXISTING RESOURCES */}
        {activeStep === 3 && (
          <section className="planner-step-card" aria-labelledby="step-3-heading">
            <div className="step-header">
              <span className="step-tag">Step 3 of 4</span>
              <h2 id="step-3-heading" className="step-heading">
                Future Milestones & Available Resources
              </h2>
              <p className="step-subheading">
                Protect crucial family milestones (such as children&apos;s higher education), and account for financial assets and insurance you choose to earmark.
              </p>
            </div>

            {/* Milestones Subsection */}
            <div className="milestones-section">
              <h3 className="sub-heading">A. Crucial Future Milestones</h3>
              <p className="sub-desc">
                Add milestones that cannot be compromised. Costs are entered in today&apos;s rupees and compounded forward to the goal date.
              </p>

              {futureMilestones.length > 0 ? (
                <div className="milestones-list" data-testid="milestones-list">
                  {futureMilestones.map((m) => {
                    const calc = calculateMilestonePV(
                      m.costToday,
                      m.inflationRatePct,
                      investmentReturnPct,
                      m.yearsUntilGoal
                    );
                    return (
                      <div key={m.id} className="milestone-row" data-testid={`milestone-item-${m.id}`}>
                        <div className="milestone-details">
                          <span className="milestone-name">{m.name}</span>
                          <span className="milestone-meta">
                            Today: {formatINR(m.costToday)} • In {m.yearsUntilGoal} yrs (@{m.inflationRatePct}% infl) = <strong>{formatINR(calc.futureCost)}</strong>
                          </span>
                          <span className="milestone-pv">
                            Present Value to reserve today: <strong>{formatINR(calc.presentValue)}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(m.id)}
                          className="btn-remove-milestone"
                          data-testid={`btn-remove-milestone-${m.id}`}
                          aria-label={`Remove milestone ${m.name}`}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-milestones-state">
                  No separate milestones added yet. Click below to add child education or other family goals.
                </div>
              )}

              {/* Add Milestone Form */}
              <div className="add-milestone-box">
                <h4 className="add-milestone-title">+ Add a Family Milestone</h4>
                <div className="milestone-input-row">
                  <div className="m-field">
                    <label htmlFor="new-milestone-label" className="m-label">Goal Label</label>
                    <input
                      id="new-milestone-label"
                      data-testid="input-new-milestone-label"
                      type="text"
                      placeholder="e.g. Higher Education"
                      value={newMilestoneName}
                      onChange={(e) => setNewMilestoneName(e.target.value)}
                      className="text-input"
                    />
                  </div>
                  <div className="m-field">
                    <label htmlFor="new-milestone-cost" className="m-label">Cost Today (₹)</label>
                    <input
                      id="new-milestone-cost"
                      data-testid="input-new-milestone-cost"
                      type="number"
                      min="0"
                      step="50000"
                      placeholder="e.g. 25,00,000"
                      value={newMilestoneCost}
                      onChange={(e) => setNewMilestoneCost(e.target.value === '' ? '' : Number(e.target.value))}
                      className="text-input"
                    />
                  </div>
                  <div className="m-field">
                    <label htmlFor="new-milestone-years" className="m-label">Years Away</label>
                    <input
                      id="new-milestone-years"
                      data-testid="input-new-milestone-years"
                      type="number"
                      min="0"
                      max="50"
                      placeholder="e.g. 10"
                      value={newMilestoneYears}
                      onChange={(e) => setNewMilestoneYears(e.target.value === '' ? '' : Number(e.target.value))}
                      className="text-input"
                    />
                  </div>
                  <div className="m-field">
                    <label htmlFor="new-milestone-inflation" className="m-label">Inflation %</label>
                    <input
                      id="new-milestone-inflation"
                      data-testid="input-new-milestone-inflation"
                      type="number"
                      min="0"
                      max="15"
                      step="0.5"
                      value={newMilestoneInflation}
                      onChange={(e) => setNewMilestoneInflation(Number(e.target.value))}
                      className="text-input"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="btn-add-milestone"
                    data-testid="btn-add-milestone"
                  >
                    Add Milestone
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Resources Subsection */}
            <div className="resources-section">
              <h3 className="sub-heading">B. Earmarked Assets & Existing Life Cover</h3>
              <p className="sub-desc">
                Account for liquid assets you deliberately earmark for family protection, and existing personal term insurance.
              </p>

              <div className="input-grid">
                {/* Eligible Earmarked Funds */}
                <div className="form-group">
                  <label htmlFor="earmarked-funds" className="field-label">
                    Eligible Financial Assets Earmarked for These Needs (₹)
                  </label>
                  <div className="input-with-affix">
                    <span className="affix" aria-hidden="true">₹</span>
                    <input
                      id="earmarked-funds"
                      data-testid="input-earmarked-funds"
                      type="number"
                      min="0"
                      step="50000"
                      placeholder="e.g. 20,00,000"
                      value={eligibleEarmarkedFunds}
                      aria-invalid={Boolean(validation.errors.eligibleEarmarkedFunds)}
                      aria-describedby={
                        validation.errors.eligibleEarmarkedFunds
                          ? 'err-earmarked-funds'
                          : undefined
                      }
                      onChange={(e) => {
                        const v = e.target.value === '' ? '' : Number(e.target.value);
                        setEligibleEarmarkedFunds(v);
                        handleUserEdit();
                      }}
                      className="text-input"
                    />
                  </div>
                  {validation.errors.eligibleEarmarkedFunds && (
                    <span id="err-earmarked-funds" className="field-error-text" role="alert">
                      {validation.errors.eligibleEarmarkedFunds}
                    </span>
                  )}
                  <span className="helper-text">
                    <strong>Funds available for these needs—not all your assets.</strong> Do not include your primary residence, routine emergency reserves, or locked retirement funds.
                  </span>
                </div>

                {/* Existing Personal Life Cover */}
                <div className="form-group">
                  <label htmlFor="personal-cover" className="field-label">
                    Existing Personal Life Insurance Cover (₹)
                  </label>
                  <div className="input-with-affix">
                    <span className="affix" aria-hidden="true">₹</span>
                    <input
                      id="personal-cover"
                      data-testid="input-personal-cover"
                      type="number"
                      min="0"
                      step="100000"
                      placeholder="e.g. 50,00,000"
                      value={existingPersonalLifeCover}
                      aria-invalid={Boolean(validation.errors.existingPersonalLifeCover)}
                      aria-describedby={
                        validation.errors.existingPersonalLifeCover
                          ? 'err-personal-cover'
                          : undefined
                      }
                      onChange={(e) => {
                        const v = e.target.value === '' ? '' : Number(e.target.value);
                        setExistingPersonalLifeCover(v);
                        handleUserEdit();
                      }}
                      className="text-input"
                    />
                  </div>
                  {validation.errors.existingPersonalLifeCover && (
                    <span id="err-personal-cover" className="field-error-text" role="alert">
                      {validation.errors.existingPersonalLifeCover}
                    </span>
                  )}
                  <span className="helper-text">
                    Total sum assured across individual pure term life policies you personally own.
                  </span>
                </div>

                {/* Employer Group Life Cover */}
                <div className="form-group">
                  <label htmlFor="employer-cover" className="field-label">
                    Employer / Group Life Insurance Cover (₹)
                  </label>
                  <div className="input-with-affix">
                    <span className="affix" aria-hidden="true">₹</span>
                    <input
                      id="employer-cover"
                      data-testid="input-employer-cover"
                      type="number"
                      min="0"
                      step="100000"
                      placeholder="e.g. 25,00,000"
                      value={employerGroupLifeCover}
                      aria-invalid={Boolean(validation.errors.employerGroupLifeCover)}
                      aria-describedby={
                        validation.errors.employerGroupLifeCover
                          ? 'err-employer-cover'
                          : undefined
                      }
                      onChange={(e) => {
                        const v = e.target.value === '' ? '' : Number(e.target.value);
                        setEmployerGroupLifeCover(v);
                        handleUserEdit();
                      }}
                      className="text-input"
                    />
                  </div>
                  {validation.errors.employerGroupLifeCover && (
                    <span id="err-employer-cover" className="field-error-text" role="alert">
                      {validation.errors.employerGroupLifeCover}
                    </span>
                  )}
                  <span className="helper-text">
                    Corporate group term cover provided by your current employer. Note: this cover typically ends when changing jobs.
                  </span>
                </div>

                {/* Toggle to include employer group cover in alternate comparison */}
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      id="checkbox-include-employer-cover"
                      data-testid="checkbox-include-employer-cover"
                      type="checkbox"
                      checked={includeEmployerGroupCover}
                      onChange={(e) => {
                        setIncludeEmployerGroupCover(e.target.checked);
                        handleUserEdit();
                      }}
                    />
                    <span>Show alternate protection gap including employer group cover</span>
                  </label>
                  <span className="helper-text">
                    By default, group cover is excluded because it is contingent on your current employer. Enabling this displays both personal and group comparisons.
                  </span>
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="btn-secondary"
                data-testid="prev-step-btn"
              >
                ← Back to Loans & Debts
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="btn-primary"
                data-testid="next-step-btn"
              >
                View Protection Needs & Cover Gap →
              </button>
            </div>
          </section>
        )}

        {/* STEP 4: RESULTS & PROTECTION BREAKDOWN */}
        {activeStep === 4 && (
          <section className="planner-step-card" aria-labelledby="step-4-heading">
            <div className="step-header step-4-header">
              <span className="step-tag">Step 4 of 4</span>
              <h2 id="step-4-heading" className="step-heading">
                Protection Needs & Cover Gap Breakdown
              </h2>
              <p className="step-subheading">
                Here is how your family&apos;s financial protection estimate is assembled from your routine living expenses, liabilities, and milestones, minus available resources.
              </p>
            </div>

            {!validation.isValid ? (
              <div
                className="validation-error-panel"
                role="alert"
                data-testid="validation-error-panel"
              >
                <span className="error-icon" aria-hidden="true">⚠️</span>
                <div>
                  <strong>Input Corrections Required:</strong>
                  <p>
                    One or more fields contain invalid values. Please correct the highlighted errors in earlier steps before reviewing protection estimates:
                  </p>
                  <ul className="error-list">
                    {Object.entries(validation.errors).map(([field, msg]) => (
                      <li key={field}>{msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : hasMinimumInputs && planResult ? (
              <div className="results-container" data-testid="results-container">
                {/* Primary Metric Hero Card */}
                <div className="results-hero-grid">
                  {/* Card 1: Estimated Additional Personal Cover Gap */}
                  <div className="result-metric-card primary-card" id="primary-result-card">
                    <div className="primary-card-top">
                      <span className="metric-eyebrow">Estimated Cover Gap</span>
                      <span className="metric-tag">Needs-Based Model</span>
                    </div>
                    <h3 className="metric-title">Estimated Additional Personal Cover Gap</h3>
                    <div
                      className="metric-value-primary"
                      id="val-additional-personal-gap"
                      data-testid="val-additional-personal-gap"
                    >
                      {formatINR(planResult.additionalPersonalCoverGap)}
                    </div>
                    <span className="metric-compact">
                      ({formatIndianCompact(planResult.additionalPersonalCoverGap)})
                    </span>
                    <p className="metric-explanation">
                      {planResult.isFullyCoveredPersonally ? (
                        <span className="badge-covered">
                          ✓ Entered resources cover the modeled need under these assumptions
                        </span>
                      ) : (
                        `Estimated additional personal cover gap under these assumptions to safeguard your family independently of corporate benefits.`
                      )}
                    </p>
                    <div className="metric-card-actions">
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById('waterfall-breakdown-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="btn-card-action"
                        id="btn-view-waterfall"
                        data-testid="btn-view-waterfall"
                      >
                        View Calculation Waterfall ↓
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Total Gross Protection Need */}
                  <div className="result-metric-card secondary-card">
                    <span className="metric-eyebrow">Total Financial Exposure</span>
                    <h3 className="metric-title">Estimated Total Protection Need</h3>
                    <div
                      className="metric-value-secondary"
                      data-testid="val-gross-protection-need"
                    >
                      {formatINR(planResult.grossProtectionNeed)}
                    </div>
                    <span className="metric-compact">
                      ({formatIndianCompact(planResult.grossProtectionNeed)})
                    </span>
                    <p className="metric-explanation">
                      Total capital required today across routine living support, loans, and milestones before deducting existing assets.
                    </p>
                  </div>

                  {/* Card 3: Alternate Scenario with Group Cover (if applicable) */}
                  {planResult.employerGroupLifeCover > 0 && includeEmployerGroupCover && (
                    <div className="result-metric-card alternate-card">
                      <span className="metric-eyebrow">Corporate Employment Scenario</span>
                      <h3 className="metric-title">Gap if Employer Cover is Counted</h3>
                      <div
                        className="metric-value-tertiary"
                        data-testid="val-group-cover-gap"
                      >
                        {formatINR(planResult.gapIncludingGroupCover)}
                      </div>
                      <span className="metric-compact">
                        ({formatIndianCompact(planResult.gapIncludingGroupCover)})
                      </span>
                      <p className="metric-explanation">
                        Temporary gap while you remain with your current employer providing ₹
                        {formatIndianCompact(planResult.employerGroupLifeCover)} group cover.
                      </p>
                    </div>
                  )}
                </div>

                {/* Earmarked Surplus Notice (if applicable) */}
                {planResult.hasEarmarkedSurplus && (
                  <div className="surplus-notice-box" role="status" data-testid="surplus-notice-box">
                    <span className="surplus-icon" aria-hidden="true">🛡️</span>
                    <div>
                      <strong>Asset Self-Funding Surplus:</strong> Under these assumptions, entered eligible financial assets (₹
                      {formatINR(planResult.eligibleEarmarkedFunds)}) equal or exceed your total gross protection need (₹
                      {formatINR(planResult.grossProtectionNeed)}) by <strong>₹{formatINR(planResult.earmarkedSurplusAmount)}</strong>.
                      Please verify liquidity, access restrictions, competing goals, and asset ownership before relying on these reserves.
                    </div>
                  </div>
                )}

                {/* Transparent Waterfall Breakdown Table */}
                <div className="breakdown-table-wrapper" id="waterfall-breakdown-section">
                  <h3 className="breakdown-table-title">Transparent Protection Calculation Waterfall</h3>
                  <table className="breakdown-table">
                    <thead>
                      <tr>
                        <th scope="col">Protection Need Component</th>
                        <th scope="col">Calculation Methodology / Timing</th>
                        <th scope="col" className="text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>1. Routine Family Living Support</strong>
                        </td>
                        <td>
                          Growing annuity PV over {supportDurationYears} years (@{supportExpenseGrowthPct}% infl, {investmentReturnPct}% return)
                        </td>
                        <td className="text-right" data-testid="val-family-support-pv">{formatINR(planResult.familySupportPV)}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>2. Outstanding Loan Liabilities</strong>
                        </td>
                        <td>
                          Home loan ({formatINR(planResult.homeLoanOutstanding)}) + Other debts ({formatINR(planResult.otherLoansOutstanding + planResult.otherLiabilities)})
                        </td>
                        <td className="text-right" data-testid="val-liabilities-subtotal">{formatINR(planResult.totalOutstandingLiabilities)}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>3. Immediate Transition Reserve</strong>
                        </td>
                        <td>
                          Emergency buffer & final estate/medical transition costs
                        </td>
                        <td className="text-right">{formatINR(planResult.immediateObligations)}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>4. Future Family Milestones</strong>
                        </td>
                        <td>
                          {planResult.milestoneDetails.length} goal(s) discounted to present value
                        </td>
                        <td className="text-right" data-testid="val-milestones-pv">{formatINR(planResult.milestonesTotalPV)}</td>
                      </tr>
                      <tr className="table-highlight-row">
                        <td>
                          <strong>Estimated Gross Protection Need</strong>
                        </td>
                        <td>
                          Sum of living support, liabilities, reserve & milestones
                        </td>
                        <td className="text-right font-bold">{formatINR(planResult.grossProtectionNeed)}</td>
                      </tr>
                      <tr className="table-subtraction-row">
                        <td>
                          <em>Less: Eligible Earmarked Financial Assets</em>
                        </td>
                        <td>
                          Liquid & financial investments deliberately set aside
                        </td>
                        <td className="text-right text-negative" data-testid="val-earmarked-funds">- {formatINR(planResult.eligibleEarmarkedFunds)}</td>
                      </tr>
                      <tr className="table-highlight-row">
                        <td>
                          <strong>Net Protection Need Before Existing Insurance</strong>
                        </td>
                        <td>
                          Gross need minus earmarked funds (floored at ₹0)
                        </td>
                        <td className="text-right font-bold" data-testid="val-need-after-earmarked">{formatINR(planResult.netProtectionNeedAfterEarmarked)}</td>
                      </tr>
                      <tr className="table-subtraction-row">
                        <td>
                          <em>Less: Existing Personal Term Life Cover</em>
                        </td>
                        <td>
                          Individually owned life insurance sum assured
                        </td>
                        <td className="text-right text-negative" data-testid="val-existing-personal-cover">- {formatINR(planResult.existingPersonalLifeCover)}</td>
                      </tr>
                      <tr className="table-total-row">
                        <td>
                          <strong>Estimated Additional Personal Cover Gap</strong>
                        </td>
                        <td>
                          <strong>Remaining pure term cover gap to bridge</strong>
                        </td>
                        <td className="text-right font-bold text-accent">
                          {formatINR(planResult.additionalPersonalCoverGap)}
                        </td>
                      </tr>
                      {planResult.employerGroupLifeCover > 0 && includeEmployerGroupCover && (
                        <tr className="table-alternate-row">
                          <td>
                            <em>Alternate: Gap if Corporate Group Cover Included</em>
                          </td>
                          <td>
                            After accounting for ₹{formatIndianCompact(planResult.employerGroupLifeCover)} employer group policy
                          </td>
                          <td className="text-right text-muted">
                            {formatINR(planResult.gapIncludingGroupCover)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Professional Review Checklist */}
                <div className="professional-checklist-box" data-testid="professional-checklist">
                  <h3 className="checklist-heading">Household Topics to Review With a Licensed Professional</h3>
                  <p className="checklist-subtext">
                    This planner provides an objective educational estimate. Before applying for a term policy, review these critical factors with an IRDAI-registered professional:
                  </p>
                  <ul className="checklist-grid">
                    <li>
                      <strong>Income Earner Stability & Dependants:</strong> Re-evaluate cover if your income structure shifts, dependents gain independence, or new dependents arrive.
                    </li>
                    <li>
                      <strong>Group Cover Portability Risk:</strong> Employer group cover typically terminates when switching employers or during career transitions.
                    </li>
                    <li>
                      <strong>Policy Exclusions & Claim Conditions:</strong> Ensure complete and transparent disclosure of medical history, smoking status, and occupational hazards.
                    </li>
                    <li>
                      <strong>Pure Term vs Investment Mix:</strong> Term insurance gives high coverage for affordable cost without bundling opaque investment returns.
                    </li>
                    <li>
                      <strong>Adequate Policy Term Horizon:</strong> Typically choose a policy term aligning with dependent self-reliance and active debt payoff horizons.
                    </li>
                    <li>
                      <strong>Affordability Across Career Cycles:</strong> Ensure long-term premiums fit comfortably within household routine cash flow.
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="empty-results-prompt" data-testid="welcome-placeholder">
                <span className="empty-icon" aria-hidden="true">📋</span>
                <h3>Add details to estimate your protection need</h3>
                <p>
                  Please complete <strong>Step 1 (Family Support)</strong> or <strong>Step 2 (Liabilities)</strong> to calculate your protection needs. You can enter your family&apos;s routine expenses, or load an illustrative benchmark family scenario below.
                </p>
                <div className="empty-actions">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="btn-primary"
                    data-testid="btn-go-to-step-1"
                  >
                    Go to Step 1: Family Support →
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadExample}
                    className="btn-example"
                    data-testid="btn-load-example-empty"
                  >
                    💡 Load Illustrative Family Example
                  </button>
                </div>
              </div>
            )}

            <div className="step-actions">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="btn-secondary"
                data-testid="prev-step-btn"
              >
                ← Back to Goals & Assets
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="btn-subtle"
              >
                ↺ Edit From Step 1
              </button>
            </div>
          </section>
        )}
      </div>

      <style>{`
        .planner-container {
          margin-top: var(--space-6);
          margin-bottom: var(--space-12);
          max-width: 100%;
          box-sizing: border-box;
        }

        .planner-top-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
          flex-wrap: wrap;
        }

        .btn-example,
        .btn-clear {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-body-sm);
          font-weight: 600;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-pill);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-example {
          background-color: var(--awc-mint);
          color: var(--awc-navy);
          border: 1px solid var(--color-border-interactive);
        }

        .btn-example:hover {
          background-color: #BBE7D7;
          border-color: var(--awc-navy);
        }

        .btn-clear {
          background-color: var(--awc-paper);
          color: var(--color-text-muted);
          border: 1px solid var(--awc-line);
        }

        .btn-clear:hover {
          background-color: #EAEFEA;
          color: var(--awc-navy);
        }

        .example-banner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border: 1px solid #F59E0B;
          border-radius: var(--radius-lg);
          padding: var(--space-4) var(--space-5);
          margin-bottom: var(--space-6);
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.12);
        }

        .example-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #92400E;
          background-color: rgba(255, 255, 255, 0.75);
          padding: 2px 8px;
          border-radius: var(--radius-pill);
          text-transform: uppercase;
          margin-bottom: var(--space-1);
        }

        .example-text {
          font-size: var(--text-body-sm);
          color: #78350F;
          line-height: 1.5;
          margin: 0;
        }

        .btn-dismiss {
          background: transparent;
          border: none;
          color: #92400E;
          font-size: 18px;
          cursor: pointer;
          padding: 0 var(--space-2);
          line-height: 1;
        }

        .warning-banner {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          background-color: #FEF2F2;
          border: 1px solid #F87171;
          color: #991B1B;
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-body-sm);
          margin-bottom: var(--space-6);
        }

        .warning-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .validation-error-panel {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          background-color: #FEF2F2;
          border: 1px solid #DC2626;
          color: #991B1B;
          border-radius: var(--radius-md);
          padding: var(--space-4) var(--space-5);
          font-size: var(--text-body-sm);
          margin-bottom: var(--space-6);
        }

        .validation-error-panel .error-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .validation-error-panel p {
          margin: var(--space-1) 0;
        }

        .validation-error-panel .error-list {
          margin: var(--space-2) 0 0;
          padding-left: var(--space-5);
        }

        .validation-error-panel .error-list li {
          margin-bottom: var(--space-1);
        }

        .field-error-text {
          display: block;
          font-size: var(--text-caption);
          color: #DC2626;
          font-weight: 600;
          margin-top: var(--space-1);
        }

        /* Step Progress Navigation */
        .step-progress-nav {
          margin-bottom: var(--space-6);
          max-width: 100%;
        }

        .step-progress-list {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-2);
          list-style: none;
          padding: 0;
          margin: 0;
        }

        @media (max-width: 640px) {
          .step-progress-nav {
            margin-bottom: 6px;
          }
          .step-progress-list {
            gap: 4px;
          }
          .example-loaded-banner {
            padding: 6px 10px;
            margin-bottom: 8px;
            font-size: 12px;
            line-height: 1.35;
          }
        }

        .step-item {
          display: flex;
          min-width: 0;
        }

        .step-button {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          width: 100%;
          min-width: 0;
          background: #FFFFFF;
          border: 1px solid var(--awc-line);
          border-radius: 14px;
          padding: var(--space-3) var(--space-4);
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-sizing: border-box;
          min-height: 48px;
        }

        .step-item.active .step-button {
          border-color: var(--color-border-interactive);
          background-color: var(--awc-mint);
          box-shadow: 0 0 0 1px var(--color-border-interactive);
        }

        .step-item.completed .step-button {
          border-color: #BBE7D7;
        }

        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: var(--radius-pill);
          background-color: #E2E8F0;
          color: var(--color-text-muted);
          font-size: var(--text-body-sm);
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-item.active .step-number {
          background-color: var(--color-text-brand);
          color: white;
        }

        .step-item.completed .step-number {
          background-color: var(--awc-navy);
          color: white;
        }

        .step-text-container {
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }

        .step-title {
          font-size: var(--text-body-sm);
          font-weight: 700;
          color: var(--awc-navy);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .step-desc {
          font-size: var(--text-caption);
          color: var(--color-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Card Container */
        .planner-step-card {
          background-color: #FFFFFF;
          border: 1px solid var(--awc-line);
          border-radius: 20px;
          padding: 32px 36px;
          box-shadow: 0 4px 16px rgba(23, 48, 71, 0.05);
          box-sizing: border-box;
          max-width: 100%;
          overflow: hidden;
        }

        @media (max-width: 640px) {
          .step-button {
            padding: 6px 4px;
            min-height: 40px;
            justify-content: center;
            border-radius: 10px;
            gap: 4px;
          }
          .step-number {
            width: 22px;
            height: 22px;
            font-size: 11px;
          }
          .step-title {
            font-size: 11px;
          }
          .step-desc {
            display: none;
          }
          .planner-step-card {
            padding: 10px 12px;
            border-radius: 14px;
          }
          .step-header {
            margin-bottom: var(--space-3);
            padding-bottom: var(--space-2);
          }
          .step-header.step-4-header {
            margin-bottom: 6px;
            padding-bottom: 2px;
          }
          .step-header.step-4-header .step-heading {
            font-size: 1.05rem;
            margin-bottom: 2px;
          }
          .step-header.step-4-header .step-subheading {
            font-size: 0.74rem;
            line-height: 1.3;
          }
        }

        .step-tag {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-brand);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: block;
          margin-bottom: var(--space-1);
        }

        .step-heading {
          font-size: clamp(1.3rem, 2.2vw, 1.7rem);
          font-family: var(--font-family-heading);
          font-weight: 700;
          color: var(--awc-navy);
          margin: 0 0 var(--space-2);
          line-height: 1.25;
        }

        .step-subheading {
          font-size: var(--text-body-sm);
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0;
        }

        /* Input Grid */
        .input-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-5);
          margin-bottom: var(--space-6);
        }

        @media (min-width: 768px) {
          .input-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          min-width: 0;
        }

        .field-label {
          font-size: var(--text-body-sm);
          font-weight: 600;
          color: var(--awc-navy);
        }

        .input-with-affix {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          box-sizing: border-box;
        }

        .affix {
          position: absolute;
          left: var(--space-3);
          color: var(--color-text-muted);
          font-weight: 600;
          pointer-events: none;
        }

        .input-with-affix .text-input {
          padding-left: var(--space-8);
        }

        .text-input {
          width: 100%;
          padding: 10px 14px;
          font-size: var(--text-body);
          font-family: inherit;
          border: 1px solid var(--awc-line);
          border-radius: 10px;
          background-color: #FFFFFF;
          color: var(--awc-navy);
          box-sizing: border-box;
          min-height: 44px;
        }

        .text-input:focus {
          outline: none;
          border-color: var(--color-border-interactive);
          box-shadow: 0 0 0 3px rgba(22, 135, 126, 0.15);
        }

        .text-input[aria-invalid="true"] {
          border-color: #EF4444;
          background-color: #FEF2F2;
        }

        .text-input[aria-invalid="true"]:focus {
          border-color: #DC2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
        }

        .range-input {
          width: 100%;
          accent-color: var(--color-text-brand);
          cursor: pointer;
          height: 24px;
        }

        .helper-text {
          font-size: var(--text-caption);
          color: var(--color-text-muted);
          line-height: 1.45;
        }

        .checkbox-group {
          grid-column: 1 / -1;
          background: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 12px;
          padding: var(--space-4);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-size: var(--text-body-sm);
          font-weight: 600;
          color: var(--awc-navy);
          cursor: pointer;
        }

        .checkbox-label input[type='checkbox'] {
          width: 20px;
          height: 20px;
          accent-color: var(--color-text-brand);
          cursor: pointer;
        }

        /* Milestones Section */
        .milestones-section,
        .resources-section {
          margin-bottom: var(--space-8);
          border-bottom: 1px solid var(--awc-line);
          padding-bottom: var(--space-6);
        }

        .sub-heading {
          font-size: 1.25rem;
          font-family: var(--font-family-heading);
          color: var(--awc-navy);
          margin: 0 0 var(--space-1);
        }

        .sub-desc {
          font-size: var(--text-body-sm);
          color: var(--color-text-muted);
          margin: 0 0 var(--space-4);
        }

        .milestones-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
        }

        .milestone-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 14px;
          padding: var(--space-3) var(--space-4);
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .milestone-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .milestone-name {
          font-size: var(--text-body);
          font-weight: 700;
          color: var(--awc-navy);
        }

        .milestone-meta,
        .milestone-pv {
          font-size: var(--text-caption);
          color: var(--color-text-muted);
        }

        .btn-remove-milestone {
          background: transparent;
          border: 1px solid #FCA5A5;
          color: #DC2626;
          font-size: 12px;
          font-weight: 600;
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-pill);
          cursor: pointer;
          min-height: 36px;
          transition: all var(--transition-fast);
        }

        .btn-remove-milestone:hover {
          background-color: #FEE2E2;
        }

        .empty-milestones-state {
          background-color: var(--awc-paper);
          border: 1px dashed var(--awc-line);
          border-radius: 12px;
          padding: var(--space-4);
          font-size: var(--text-body-sm);
          color: var(--color-text-muted);
          text-align: center;
          margin-bottom: var(--space-5);
        }

        .add-milestone-box {
          background: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 14px;
          padding: var(--space-4) var(--space-5);
        }

        .add-milestone-title {
          font-size: var(--text-body-sm);
          font-weight: 700;
          color: var(--awc-navy);
          margin: 0 0 var(--space-3);
        }

        .milestone-input-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3);
          align-items: flex-end;
        }

        @media (min-width: 768px) {
          .milestone-input-row {
            grid-template-columns: 2fr 1.5fr 1fr 1fr auto;
          }
        }

        .m-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .m-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-muted);
        }

        .btn-add-milestone {
          background: var(--color-action);
          color: white;
          border: none;
          padding: var(--space-2) var(--space-4);
          font-size: var(--text-body-sm);
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          white-space: nowrap;
          height: 44px;
          transition: background-color var(--transition-fast);
        }

        .btn-add-milestone:hover {
          background-color: #0E6B64;
        }

        /* Step Actions */
        .step-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-3);
          margin-top: var(--space-6);
          border-top: 1px solid var(--awc-line);
          padding-top: var(--space-4);
          flex-wrap: wrap;
        }

        .btn-primary {
          background: var(--color-action);
          color: white;
          border: none;
          padding: 12px 28px;
          font-size: var(--text-body);
          font-weight: 600;
          border-radius: var(--radius-pill);
          cursor: pointer;
          min-height: 48px;
          transition: background-color var(--transition-fast);
        }

        .btn-primary:hover {
          background-color: #0E6B64;
        }

        .btn-secondary {
          background: var(--awc-paper);
          color: var(--awc-navy);
          border: 1px solid var(--awc-line);
          padding: 12px 24px;
          font-size: var(--text-body);
          font-weight: 600;
          border-radius: var(--radius-pill);
          cursor: pointer;
          min-height: 48px;
          transition: all var(--transition-fast);
        }

        .btn-secondary:hover {
          background-color: #EAEFEA;
        }

        .btn-subtle {
          background: transparent;
          color: var(--color-text-brand);
          border: none;
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-body-sm);
          font-weight: 600;
          cursor: pointer;
          min-height: 44px;
        }

        /* Results Display */
        .results-container {
          margin-top: var(--space-2);
        }

        .results-hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
          margin-bottom: var(--space-8);
        }

        @media (min-width: 768px) {
          .results-hero-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .results-hero-grid:has(.alternate-card) {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .result-metric-card {
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(23, 48, 71, 0.05);
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          min-width: 0;
        }

        @media (max-width: 640px) {
          .result-metric-card {
            padding: 12px 14px;
          }
          .primary-card-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            margin-bottom: 6px;
          }
          .primary-card .metric-eyebrow {
            font-size: 11px;
            line-height: 1.25;
            letter-spacing: 0.05em;
          }
          .metric-tag {
            font-size: 9.5px;
            padding: 2px 7px;
            line-height: 1.35;
          }
          .metric-title {
            font-size: 0.92rem;
            margin: 0 0 3px;
            line-height: 1.25;
          }
          .metric-value-primary {
            font-size: 1.8rem;
            line-height: 1.05;
          }
        }

        .primary-card {
          background: linear-gradient(135deg, #173047 0%, #0F2030 100%);
          color: white;
          border: 1px solid #234563;
        }

        .primary-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-1);
          flex-wrap: wrap;
          gap: 6px;
        }

        .primary-card .metric-eyebrow {
          color: var(--awc-gold);
          margin-bottom: 0;
        }

        .metric-tag {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--awc-navy);
          background-color: var(--awc-gold);
          padding: 2px 8px;
          border-radius: var(--radius-pill);
          display: inline-block;
          line-height: 1.4;
          width: fit-content;
        }

        .primary-card .metric-title {
          color: #FFFFFF;
        }

        .primary-card .metric-compact {
          color: rgba(255, 255, 255, 0.8);
        }

        .secondary-card {
          background: #FFFFFF;
          border: 1px solid var(--awc-line);
        }

        .alternate-card {
          background: var(--awc-paper);
          border: 1px solid var(--awc-mint);
        }

        .metric-eyebrow {
          font-size: var(--text-caption);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-brand);
          margin-bottom: 2px;
        }

        .metric-title {
          font-size: 1.15rem;
          font-family: var(--font-family-heading);
          color: var(--awc-navy);
          margin: 0 0 var(--space-2);
          line-height: 1.3;
        }

        .metric-value-primary {
          font-family: var(--font-family-heading);
          font-size: clamp(1.9rem, 4vw, 2.6rem);
          font-weight: 800;
          color: var(--awc-gold);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .metric-value-secondary {
          font-family: var(--font-family-heading);
          font-size: clamp(1.6rem, 3.5vw, 2.1rem);
          font-weight: 800;
          color: var(--awc-navy);
          line-height: 1.1;
        }

        .metric-value-tertiary {
          font-family: var(--font-family-heading);
          font-size: clamp(1.6rem, 3.5vw, 2.1rem);
          font-weight: 800;
          color: var(--color-text-brand);
          line-height: 1.1;
        }

        .metric-compact {
          font-size: var(--text-body-sm);
          font-weight: 600;
          margin-top: 2px;
          margin-bottom: var(--space-3);
        }

        .metric-explanation {
          font-size: var(--text-caption);
          line-height: 1.45;
          margin: 0;
          opacity: 0.95;
        }

        .metric-card-actions {
          margin-top: var(--space-4);
          padding-top: var(--space-3);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
        }

        .btn-card-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: var(--text-caption);
          font-weight: 600;
          color: var(--awc-gold);
          background: rgba(242, 198, 93, 0.12);
          border: 1px solid rgba(242, 198, 93, 0.35);
          padding: 6px 14px;
          border-radius: var(--radius-pill);
          cursor: pointer;
          min-height: 40px;
          transition: all var(--transition-fast);
        }

        .btn-card-action:hover {
          background: rgba(242, 198, 93, 0.22);
          border-color: var(--awc-gold);
        }

        .badge-covered {
          display: inline-block;
          background-color: #10B981;
          color: white;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: var(--radius-pill);
        }

        .surplus-notice-box {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          background-color: #ECFDF5;
          border: 1px solid #6EE7B7;
          color: #065F46;
          border-radius: 14px;
          padding: var(--space-4) var(--space-5);
          font-size: var(--text-body-sm);
          margin-bottom: var(--space-8);
        }

        .surplus-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        /* Waterfall Table */
        .breakdown-table-wrapper {
          margin-bottom: var(--space-8);
          overflow-x: auto;
          max-width: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .breakdown-table-title {
          font-size: 1.25rem;
          font-family: var(--font-family-heading);
          color: var(--awc-navy);
          margin: 0 0 var(--space-3);
        }

        .breakdown-table {
          width: 100%;
          min-width: 520px;
          border-collapse: collapse;
          font-size: var(--text-body-sm);
        }

        .breakdown-table th,
        .breakdown-table td {
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--awc-line);
          text-align: left;
        }

        .breakdown-table th {
          background-color: var(--awc-paper);
          color: var(--awc-navy);
          font-weight: 700;
        }

        .table-highlight-row {
          background-color: var(--awc-paper);
          font-weight: 600;
        }

        .table-subtraction-row {
          color: var(--color-text-muted);
        }

        .table-total-row {
          background-color: var(--awc-mint);
          border-top: 2px solid var(--color-border-interactive);
          border-bottom: 2px solid var(--color-border-interactive);
        }

        .table-alternate-row {
          background-color: rgba(254, 243, 199, 0.4);
          font-style: italic;
        }

        .text-right {
          text-align: right;
        }

        .text-negative {
          color: #DC2626;
        }

        .text-accent {
          color: var(--color-text-brand);
          font-size: var(--text-body);
        }

        .text-muted {
          color: var(--color-text-muted);
        }

        .font-bold {
          font-weight: 700;
        }

        /* Checklist Box */
        .professional-checklist-box {
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 18px;
          padding: var(--space-6);
          box-sizing: border-box;
          max-width: 100%;
        }

        .checklist-heading {
          font-size: 1.15rem;
          font-family: var(--font-family-heading);
          color: var(--awc-navy);
          margin: 0 0 var(--space-1);
        }

        .checklist-subtext {
          font-size: var(--text-body-sm);
          color: var(--color-text-muted);
          margin: 0 0 var(--space-4);
        }

        .checklist-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3);
          list-style: none;
          padding: 0;
          margin: 0;
        }

        @media (min-width: 768px) {
          .checklist-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .checklist-grid li {
          font-size: var(--text-caption);
          color: var(--color-text-muted);
          line-height: 1.5;
          background: #FFFFFF;
          border: 1px solid var(--awc-line);
          border-radius: 12px;
          padding: var(--space-3) var(--space-4);
        }

        .checklist-grid li strong {
          color: var(--awc-navy);
          display: block;
          margin-bottom: 2px;
        }

        .empty-results-prompt {
          text-align: center;
          padding: var(--space-10) var(--space-4);
          background: var(--awc-paper);
          border: 1px dashed var(--awc-line);
          border-radius: 16px;
          margin: var(--space-4) 0;
        }

        .empty-icon {
          font-size: 36px;
          display: block;
          margin-bottom: var(--space-2);
        }

        .empty-results-prompt h3 {
          font-size: 1.3rem;
          color: var(--awc-navy);
          margin: 0 0 var(--space-2);
        }

        .empty-results-prompt p {
          font-size: var(--text-body-sm);
          color: var(--color-text-muted);
          max-width: 520px;
          margin: 0 auto var(--space-5);
          line-height: 1.55;
        }

        .empty-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
};

export default LifeInsurancePlannerIsland;
