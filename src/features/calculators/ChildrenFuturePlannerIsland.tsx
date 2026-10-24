import React, { useState, useMemo } from 'react';
import {
  calculateChildrenFuturePlan,
  CANONICAL_CHILDREN_PLANNER_SAMPLE,
  type ChildProfile,
  type ExistingInvestmentItem,
  type MilestoneItem,
  type MilestoneCategory,
  type ChildrenFuturePlannerResult,
} from '../../domain/finance';
import { formatINR as formatRupee, formatIndianCompact as formatLakhCrore } from '../../lib/formatters';

const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  SCHOOL_COLLEGE: 'School / Senior Secondary',
  DOMESTIC_HIGHER_EDUCATION: 'Domestic Higher Education (Engineering, Medical, Law, MBA)',
  OVERSEAS_EDUCATION: 'Overseas Higher Education (Global Tuition & Living)',
  POSTGRADUATE: 'Postgraduate & Doctoral Studies',
  MARRIAGE_LIFE_EVENT: 'Marriage & Family Milestones',
  OTHER: 'Other Custom Future Goal',
};

const INFLATION_PRESETS = [
  { rate: 6.0, label: '6% · Lower Assumption', desc: 'A lower illustrative annual cost-increase assumption for mathematical modeling.' },
  { rate: 8.0, label: '8% · Middle Assumption', desc: 'A moderate illustrative annual cost-increase assumption. Not a forecast or recommendation.' },
  { rate: 10.0, label: '10% · Higher Assumption', desc: 'A higher illustrative cost-increase assumption. Currency exchange-rate movements are not modelled.' },
];

export const ChildrenFuturePlannerIsland: React.FC = () => {
  // Planner State (In-Memory Only, Zero Persistence)
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [existingInvestments, setExistingInvestments] = useState<ExistingInvestmentItem[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);

  // Simulation Parameters
  const [assumedAnnualReturnPercent, setAssumedAnnualReturnPercent] = useState<number>(10.0);
  const [annualStepUpPercent, setAnnualStepUpPercent] = useState<number>(10.0);

  // Example Mode Flag
  const [isExampleLoaded, setIsExampleLoaded] = useState<boolean>(false);

  // UI Drawer State for Milestone Asset Allocations
  const [openAllocDrawerId, setOpenAllocDrawerId] = useState<string | null>(null);

  // Child Deletion Confirmation Dialog
  const [deleteChildConfirmId, setDeleteChildConfirmId] = useState<string | null>(null);

  // Active Tab for Schedule View
  const [activeScheduleMode, setActiveScheduleMode] = useState<'FIXED' | 'STEP_UP'>('STEP_UP');

  // Collapsible Disclosure States
  const [isAssumptionsExpanded, setIsAssumptionsExpanded] = useState<boolean>(true);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState<boolean>(true);

  // Load Authoritative Canonical Example
  const handleLoadExample = () => {
    setChildren(CANONICAL_CHILDREN_PLANNER_SAMPLE.children.map((c) => ({ ...c })));
    setExistingInvestments(CANONICAL_CHILDREN_PLANNER_SAMPLE.existingInvestments.map((i) => ({ ...i })));
    setMilestones(
      CANONICAL_CHILDREN_PLANNER_SAMPLE.milestones.map((m) => ({
        ...m,
        allocations: m.allocations.map((a) => ({ ...a })),
      }))
    );
    setAssumedAnnualReturnPercent(CANONICAL_CHILDREN_PLANNER_SAMPLE.assumedAnnualReturnPercent);
    setAnnualStepUpPercent(CANONICAL_CHILDREN_PLANNER_SAMPLE.annualStepUpPercent ?? 10.0);
    setIsExampleLoaded(true);
    setOpenAllocDrawerId(null);
  };

  // Clear All / Reset to Neutral Empty State
  const handleClearAll = () => {
    setChildren([]);
    setExistingInvestments([]);
    setMilestones([]);
    setAssumedAnnualReturnPercent(10.0);
    setAnnualStepUpPercent(10.0);
    setIsExampleLoaded(false);
    setOpenAllocDrawerId(null);
    setDeleteChildConfirmId(null);
  };

  // Quick Starter: Add First Child & Goal
  const handleStartBlank = () => {
    const newKidId = 'child-' + Date.now();
    const newKid: ChildProfile = { id: newKidId, name: 'Child 1', currentAge: 5 };
    const newMilestone: MilestoneItem = {
      id: 'ms-' + Date.now(),
      childId: newKidId,
      title: 'Undergraduate Higher Education',
      category: 'DOMESTIC_HIGHER_EDUCATION',
      targetAge: 18,
      costToday: 2000000,
      annualInflationPercent: 8.0,
      allocations: [],
    };
    setChildren([newKid]);
    setExistingInvestments([]);
    setMilestones([newMilestone]);
    setIsExampleLoaded(false);
  };

  // Child Profile Handlers
  const handleAddChild = () => {
    setIsExampleLoaded(false);
    const id = 'child-' + Date.now();
    const count = children.length + 1;
    setChildren([...children, { id, name: `Child ${count}`, currentAge: 5 }]);
  };

  const handleUpdateChild = (id: string, field: 'name' | 'currentAge', value: string | number) => {
    setIsExampleLoaded(false);
    setChildren(
      children.map((c) => {
        if (c.id !== id) return c;
        return { ...c, [field]: value };
      })
    );
  };

  const handleRemoveChild = (id: string) => {
    setIsExampleLoaded(false);
    const hasLinkedMilestones = milestones.some((m) => m.childId === id);
    if (hasLinkedMilestones && deleteChildConfirmId !== id) {
      setDeleteChildConfirmId(id);
      return;
    }
    // Delete child and any linked milestones
    setChildren(children.filter((c) => c.id !== id));
    setMilestones(milestones.filter((m) => m.childId !== id));
    setDeleteChildConfirmId(null);
  };

  // Existing Investments Handlers
  const handleAddInvestment = () => {
    setIsExampleLoaded(false);
    const id = 'inv-' + Date.now();
    const count = existingInvestments.length + 1;
    setExistingInvestments([
      ...existingInvestments,
      { id, label: `Investment Asset ${count}`, currentValue: 200000 },
    ]);
  };

  const handleUpdateInvestment = (id: string, field: 'label' | 'currentValue', value: string | number) => {
    setIsExampleLoaded(false);
    setExistingInvestments(
      existingInvestments.map((inv) => {
        if (inv.id !== id) return inv;
        return { ...inv, [field]: value };
      })
    );
  };

  const handleRemoveInvestment = (id: string) => {
    setIsExampleLoaded(false);
    // Remove investment and prune allocations referencing it
    setExistingInvestments(existingInvestments.filter((inv) => inv.id !== id));
    setMilestones(
      milestones.map((m) => ({
        ...m,
        allocations: m.allocations.filter((a) => a.investmentId !== id),
      }))
    );
  };

  // Milestone Handlers
  const handleAddMilestone = (childId?: string) => {
    setIsExampleLoaded(false);
    const targetChildId = childId || (children.length > 0 ? children[0].id : '');
    const child = children.find((c) => c.id === targetChildId);
    const currentAge = child ? child.currentAge : 5;
    const targetAge = Math.min(25, currentAge + 12);

    const newMilestone: MilestoneItem = {
      id: 'ms-' + Date.now(),
      childId: targetChildId,
      title: 'Higher Education / College',
      category: 'DOMESTIC_HIGHER_EDUCATION',
      targetAge: targetAge > currentAge ? targetAge : currentAge + 5,
      costToday: 2000000,
      annualInflationPercent: 8.0,
      allocations: [],
    };
    setMilestones([...milestones, newMilestone]);
  };

  const handleDuplicateMilestone = (id: string) => {
    setIsExampleLoaded(false);
    const existing = milestones.find((m) => m.id === id);
    if (!existing) return;
    const duplicate: MilestoneItem = {
      ...existing,
      id: 'ms-' + Date.now(),
      title: `${existing.title} (Copy)`,
      allocations: [], // Start copy with zero initial allocations to prevent auto over-allocation
    };
    setMilestones([...milestones, duplicate]);
  };

  const handleRemoveMilestone = (id: string) => {
    setIsExampleLoaded(false);
    setMilestones(milestones.filter((m) => m.id !== id));
    if (openAllocDrawerId === id) setOpenAllocDrawerId(null);
  };

  const handleUpdateMilestone = (id: string, field: keyof MilestoneItem, value: unknown) => {
    setIsExampleLoaded(false);
    setMilestones(
      milestones.map((m) => {
        if (m.id !== id) return m;
        return { ...m, [field]: value };
      })
    );
  };

  const handleUpdateAllocation = (milestoneId: string, investmentId: string, amount: number) => {
    setIsExampleLoaded(false);
    setMilestones(
      milestones.map((m) => {
        if (m.id !== milestoneId) return m;
        const remaining = m.allocations.filter((a) => a.investmentId !== investmentId);
        if (amount > 0) {
          remaining.push({ investmentId, allocatedAmount: amount });
        }
        return { ...m, allocations: remaining };
      })
    );
  };

  // Domain Calculation Evaluation
  const calculationResult: { result: ChildrenFuturePlannerResult | null; error: string | null } = useMemo(() => {
    if (milestones.length === 0 || children.length === 0) {
      return { result: null, error: null };
    }

    // Check for target age validation errors
    for (const m of milestones) {
      const child = children.find((c) => c.id === m.childId);
      if (!child) {
        return { result: null, error: `Milestone "${m.title}" is linked to an unassigned child.` };
      }
      if (m.targetAge <= child.currentAge) {
        return {
          result: null,
          error: `Milestone "${m.title}" has target age (${m.targetAge}y) which is not greater than ${child.name || 'Child'}'s current age (${child.currentAge}y).`,
        };
      }
      if (m.targetAge - child.currentAge > 35) {
        return {
          result: null,
          error: `Milestone "${m.title}" has a horizon exceeding the maximum 35-year limit.`,
        };
      }
      if (!Number.isFinite(m.costToday) || m.costToday <= 0) {
        return {
          result: null,
          error: `Milestone "${m.title}" requires a valid positive cost today (> ₹0).`,
        };
      }
    }

    try {
      const res = calculateChildrenFuturePlan({
        children,
        existingInvestments,
        milestones,
        assumedAnnualReturnPercent,
        annualStepUpPercent,
      });
      return { result: res, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid planner input parameters.';
      return { result: null, error: msg };
    }
  }, [children, existingInvestments, milestones, assumedAnnualReturnPercent, annualStepUpPercent]);

  const { result: planResult, error: validationError } = calculationResult;

  // Investment Allocation Overview Helper
  const investmentAllocationStatus = useMemo(() => {
    const map = new Map<string, { totalAllocated: number; exceeds: boolean }>();
    for (const inv of existingInvestments) {
      let total = 0;
      for (const m of milestones) {
        const found = m.allocations.find((a) => a.investmentId === inv.id);
        if (found) total += found.allocatedAmount;
      }
      map.set(inv.id, {
        totalAllocated: total,
        exceeds: total > inv.currentValue + 0.01,
      });
    }
    return map;
  }, [existingInvestments, milestones]);

  const hasAnyOverAllocatedAsset = Array.from(investmentAllocationStatus.values()).some((v) => v.exceeds);

  // Smooth scroll helpers
  const scrollToProfiles = () => {
    const el = document.getElementById('children-profiles-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToRoadmap = () => {
    const el = document.getElementById('family-roadmap-results');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="children-planner-island" id="children-future-planner-app">
      {/* 1. Mobile Live Result Summary (< 850px) - Visible only when plan is active */}
      {planResult && (
        <div className="mobile-result-summary" id="children-mobile-summary" aria-label="Quick Family Goal Result">
          <div className="mobile-summary-header">
            <span className="mobile-summary-tag" data-testid="mobile-summary-tag">
              {isExampleLoaded ? 'Illustrative example' : 'Custom family plan'}
            </span>
            <span className="mobile-summary-subtitle">Starting Monthly SIP</span>
          </div>

          <div className="mobile-summary-main">
            <div className="mobile-summary-value" id="children-mobile-headline-val">
              {formatRupee(planResult.totalStartingStepUpMonthlySIP)}
              <span className="mobile-per-month"> /mo</span>
            </div>
            <div className="mobile-summary-compact">
              Annual Step-Up ({planResult.annualStepUpPercent}%) • or {formatRupee(planResult.totalStartingFixedMonthlySIP)}/mo Fixed
            </div>
            <div className="mobile-summary-pills">
              <span className="mobile-pill">
                Outlay: {formatLakhCrore(planResult.totalFutureMilestoneCosts)}
              </span>
              <span className="mobile-pill">
                Assets FV: {formatLakhCrore(planResult.totalFutureValueOfAllocatedAssets)}
              </span>
              <span className="mobile-pill highlight">
                Shortfall: {formatLakhCrore(planResult.totalFundingShortfall)}
              </span>
            </div>
          </div>

          <div className="mobile-summary-actions">
            <button
              type="button"
              className="mobile-action-btn primary"
              id="mobile-adjust-plan-btn"
              onClick={scrollToProfiles}
            >
              Adjust family plan ↓
            </button>
            <button
              type="button"
              className="mobile-action-btn secondary"
              id="mobile-view-roadmap-btn"
              onClick={scrollToRoadmap}
            >
              View full roadmap ↓
            </button>
          </div>
        </div>
      )}

      {/* 2. Illustrative Example Notice Banner */}
      {isExampleLoaded && (
        <aside
          className="example-banner"
          id="children-notice-banner"
          role="status"
          aria-live="polite"
          data-testid="illustrative-example-banner"
        >
          <div className="banner-content">
            <span className="banner-icon" aria-hidden="true">💡</span>
            <div className="banner-text">
              <strong>Illustrative example loaded — these are not your figures.</strong>
              <p>
                Showing a model scenario for Aarav (age 6) and Ananya (age 3). You can edit any age, milestone, or asset amount below, or clear all entries to plan for your own household.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-clear-example"
            onClick={handleClearAll}
            aria-label="Clear illustrative example and start blank"
          >
            Clear all entries
          </button>
        </aside>
      )}

      {/* 3. Top Header Action Bar */}
      <header className="planner-action-bar">
        <div className="action-bar-left">
          <span className="status-indicator">
            {children.length === 0
              ? 'Fresh Planner (Empty)'
              : `${children.length} Child${children.length > 1 ? 'ren' : ''} • ${milestones.length} Milestone${milestones.length > 1 ? 's' : ''}`}
          </span>
        </div>
        <div className="action-bar-right">
          <button
            type="button"
            className="btn-action-secondary"
            onClick={handleLoadExample}
            data-testid="btn-load-family-example"
          >
            Load Illustrative Family Example
          </button>
          {(children.length > 0 || milestones.length > 0 || existingInvestments.length > 0) && (
            <button
              type="button"
              className="btn-action-outline-danger"
              onClick={handleClearAll}
              data-testid="btn-clear-planner"
            >
              Clear All Entries
            </button>
          )}
        </div>
      </header>

      {/* 4. Empty State Presentation */}
      {children.length === 0 && (
        <section className="empty-planner-hero" data-testid="empty-planner-hero">
          <div className="empty-hero-icon" aria-hidden="true">🎓</div>
          <h2 className="empty-hero-title">Start Planning Your Child's Higher Education & Life Milestones</h2>
          <p className="empty-hero-desc">
            Model domestic professional degrees, overseas education, and life events with transparent compounding math. Compare fixed level contributions against salary-linked annual step-up SIPs.
          </p>
          <div className="empty-hero-actions">
            <button
              type="button"
              className="btn-primary-action"
              onClick={handleStartBlank}
              data-testid="btn-start-blank"
            >
              + Add Your Child's Goal
            </button>
            <button
              type="button"
              className="btn-secondary-action"
              onClick={handleLoadExample}
            >
              Load Illustrative Family Example
            </button>
          </div>
          <div className="empty-hero-features">
            <div className="feature-pill">✓ 100% In-Memory (No login or lead forms)</div>
            <div className="feature-pill">✓ Independent Inflation per Milestone</div>
            <div className="feature-pill">✓ Shared Asset Pool (No double counting)</div>
          </div>
        </section>
      )}

      {/* 5. Active Planner Interface */}
      {children.length > 0 && (
        <div className="planner-workspace">
          {/* Section A: Child Profiles Manager */}
          <section className="planner-section" id="children-profiles-section" aria-labelledby="children-profiles-heading">
            <div className="section-header-row">
              <div>
                <h3 id="children-profiles-heading" className="section-subtitle">
                  1. Child Profiles
                </h3>
                <p className="section-caption">
                  Enter the current age of each child to calculate precise accumulation horizons for their future milestones.
                </p>
              </div>
              <button
                type="button"
                className="btn-add-item"
                onClick={handleAddChild}
                data-testid="btn-add-child"
              >
                + Add Another Child
              </button>
            </div>

            <div className="children-cards-grid">
              {children.map((child, idx) => {
                const childMilestones = milestones.filter((m) => m.childId === child.id);
                const isConfirmingDelete = deleteChildConfirmId === child.id;

                return (
                  <div key={child.id} className="child-card" data-testid={`child-card-${child.id}`}>
                    <div className="child-card-header">
                      <span className="child-badge">Child #{idx + 1}</span>
                      <button
                        type="button"
                        className="btn-icon-delete"
                        onClick={() => handleRemoveChild(child.id)}
                        aria-label={`Remove ${child.name || `Child ${idx + 1}`}`}
                        title="Remove child"
                      >
                        ✕
                      </button>
                    </div>

                    {isConfirmingDelete && (
                      <div className="delete-confirm-box" role="alert">
                        <p className="delete-confirm-text">
                          This child has {childMilestones.length} linked milestone{childMilestones.length > 1 ? 's' : ''}. Removing this child will also remove those milestones. Proceed?
                        </p>
                        <div className="confirm-actions">
                          <button
                            type="button"
                            className="btn-confirm-delete"
                            onClick={() => handleRemoveChild(child.id)}
                          >
                            Yes, remove child and milestones
                          </button>
                          <button
                            type="button"
                            className="btn-cancel-delete"
                            onClick={() => setDeleteChildConfirmId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="input-group">
                      <label htmlFor={`child-name-${child.id}`} className="field-label">
                        Child Name / Nickname <span className="label-opt">(Optional)</span>
                      </label>
                      <input
                        id={`child-name-${child.id}`}
                        type="text"
                        className="text-input child-name-input"
                        value={child.name || ''}
                        placeholder={`Child ${idx + 1}`}
                        onChange={(e) => handleUpdateChild(child.id, 'name', e.target.value)}
                        maxLength={40}
                      />
                    </div>

                    <div className="input-group">
                      <div className="label-split">
                        <label htmlFor={`child-age-${child.id}`} className="field-label">
                          Current Age (Years)
                        </label>
                        <span className="field-val-pill">{child.currentAge} yrs</span>
                      </div>
                      <div className="range-with-number">
                        <input
                          id={`child-age-${child.id}`}
                          type="range"
                          min="0"
                          max="25"
                          step="1"
                          value={child.currentAge}
                          onChange={(e) => handleUpdateChild(child.id, 'currentAge', parseInt(e.target.value, 10))}
                          className="range-slider"
                          aria-label={`Current age of ${child.name || `Child ${idx + 1}`}`}
                        />
                        <input
                          type="number"
                          min="0"
                          max="25"
                          step="1"
                          value={child.currentAge}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleUpdateChild(child.id, 'currentAge', Number.isFinite(val) ? Math.max(0, Math.min(25, val)) : 0);
                          }}
                          className="number-input-compact"
                          aria-label={`Numeric current age of ${child.name || `Child ${idx + 1}`}`}
                        />
                      </div>
                    </div>

                    <div className="child-card-footer">
                      <span className="mapped-count">
                        {childMilestones.length} milestone{childMilestones.length !== 1 ? 's' : ''} mapped
                      </span>
                      <button
                        type="button"
                        className="btn-link-action"
                        onClick={() => handleAddMilestone(child.id)}
                      >
                        + Add Milestone
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section B: Existing Earmarked Investments (Shared Asset Pool) */}
          <section className="planner-section" id="existing-assets-section" aria-labelledby="existing-assets-heading">
            <div className="section-header-row">
              <div>
                <h3 id="existing-assets-heading" className="section-subtitle">
                  2. Existing Earmarked Savings & Investments (Central Pool)
                </h3>
                <p className="section-caption">
                  Register funds already set aside for your children (Sukanya Samriddhi accounts, PPF, mutual funds, education FDs). You can allocate portions of these assets to specific milestones below without double counting.
                </p>
              </div>
              <button
                type="button"
                className="btn-add-item"
                onClick={handleAddInvestment}
                data-testid="btn-add-investment"
              >
                + Add Existing Asset
              </button>
            </div>

            {existingInvestments.length === 0 ? (
              <div className="empty-assets-box">
                <p className="text-muted text-sm">
                  No existing investments registered yet. If you have existing mutual funds, PPF, or fixed deposits set aside for your child, add them here to reduce the required fresh monthly SIP.
                </p>
              </div>
            ) : (
              <div className="investments-table-wrapper">
                <table className="investments-table">
                  <thead>
                    <tr>
                      <th scope="col">Asset Description</th>
                      <th scope="col">Current Value (₹)</th>
                      <th scope="col">Total Allocated</th>
                      <th scope="col">Unallocated Balance</th>
                      <th scope="col" className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingInvestments.map((inv) => {
                      const status = investmentAllocationStatus.get(inv.id);
                      const totalAllocated = status ? status.totalAllocated : 0;
                      const unallocated = Math.max(0, inv.currentValue - totalAllocated);
                      const isOverAllocated = status ? status.exceeds : false;

                      return (
                        <tr key={inv.id} className={isOverAllocated ? 'row-over-allocated' : ''}>
                          <td>
                            <input
                              type="text"
                              className="text-input-table"
                              value={inv.label}
                              onChange={(e) => handleUpdateInvestment(inv.id, 'label', e.target.value)}
                              placeholder="Asset Name (e.g. Education Mutual Fund)"
                              aria-label="Investment asset name"
                            />
                          </td>
                          <td>
                            <div className="rupee-input-wrapper">
                              <span className="rupee-prefix">₹</span>
                              <input
                                type="number"
                                min="0"
                                max="100000000"
                                step="10000"
                                value={inv.currentValue}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  handleUpdateInvestment(inv.id, 'currentValue', Number.isFinite(v) ? Math.max(0, v) : 0);
                                }}
                                className="number-input-table"
                                aria-label={`Current value for ${inv.label}`}
                              />
                            </div>
                            <span className="sub-lakh-hint">{formatLakhCrore(inv.currentValue)}</span>
                          </td>
                          <td>
                            <span className="font-semibold">{formatRupee(totalAllocated)}</span>
                            {isOverAllocated && (
                              <span className="badge-danger-xs" role="alert">
                                Over-allocated by {formatRupee(totalAllocated - inv.currentValue)}!
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={unallocated > 0 ? 'text-teal font-semibold' : 'text-muted'}>
                              {formatRupee(unallocated)}
                            </span>
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              className="btn-icon-delete"
                              onClick={() => handleRemoveInvestment(inv.id)}
                              aria-label={`Remove asset ${inv.label}`}
                              title="Remove asset"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section C: Milestone Cards Stack */}
          <section className="planner-section" id="milestones-stack-section" aria-labelledby="milestones-heading">
            <div className="section-header-row">
              <div>
                <h3 id="milestones-heading" className="section-subtitle">
                  3. Child Future Milestones Stack
                </h3>
                <p className="section-caption">
                  Define college education, overseas degrees, or major life milestones. Each goal uses its own horizon and inflation rate.
                </p>
              </div>
              <button
                type="button"
                className="btn-add-item"
                onClick={() => handleAddMilestone()}
                data-testid="btn-add-milestone"
              >
                + Add Milestone
              </button>
            </div>

            {milestones.length === 0 ? (
              <div className="empty-assets-box">
                <p className="text-muted text-sm">
                  No milestones added yet. Click "+ Add Milestone" above to map your first child milestone.
                </p>
              </div>
            ) : (
              <div className="milestones-stack">
                {milestones.map((m, idx) => {
                  const linkedChild = children.find((c) => c.id === m.childId);
                  const childAge = linkedChild ? linkedChild.currentAge : 0;
                  const horizon = linkedChild ? m.targetAge - childAge : 0;
                  const isHorizonInvalid = horizon <= 0 || horizon > 35;
                  const isAllocDrawerOpen = openAllocDrawerId === m.id;

                  // Find milestone result if available
                  const mResult = planResult?.milestoneResults.find((r) => r.milestoneId === m.id);

                  // Current allocations for this milestone
                  const totalAllocatedToThisMilestone = m.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);

                  return (
                    <article
                      key={m.id}
                      className={`milestone-card ${isHorizonInvalid ? 'milestone-card-invalid' : ''}`}
                      data-testid={`milestone-card-${m.id}`}
                    >
                      {/* Milestone Header */}
                      <div className="milestone-card-header">
                        <div className="milestone-title-block">
                          <span className="milestone-number-tag">Milestone #{idx + 1}</span>
                          <input
                            type="text"
                            className="milestone-title-input"
                            value={m.title}
                            onChange={(e) => handleUpdateMilestone(m.id, 'title', e.target.value)}
                            placeholder="Milestone Title"
                            aria-label="Milestone title"
                          />
                        </div>
                        <div className="milestone-header-actions">
                          <button
                            type="button"
                            className="btn-action-sm-subtle"
                            onClick={() => handleDuplicateMilestone(m.id)}
                            title="Duplicate this milestone"
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            className="btn-icon-delete"
                            onClick={() => handleRemoveMilestone(m.id)}
                            aria-label={`Remove milestone ${m.title}`}
                            title="Remove milestone"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Milestone Configuration Form Grid */}
                      <div className="milestone-form-grid">
                        {/* Child Association Selector */}
                        <div className="input-group">
                          <label htmlFor={`ms-child-${m.id}`} className="field-label">
                            Linked Child Profile
                          </label>
                          <select
                            id={`ms-child-${m.id}`}
                            className="select-input"
                            value={m.childId}
                            onChange={(e) => handleUpdateMilestone(m.id, 'childId', e.target.value)}
                          >
                            {children.map((c, cIdx) => (
                              <option key={c.id} value={c.id}>
                                {c.name || `Child ${cIdx + 1}`} (Age {c.currentAge} yrs)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Milestone Category */}
                        <div className="input-group">
                          <label htmlFor={`ms-cat-${m.id}`} className="field-label">
                            Milestone Category
                          </label>
                          <select
                            id={`ms-cat-${m.id}`}
                            className="select-input"
                            value={m.category}
                            onChange={(e) => handleUpdateMilestone(m.id, 'category', e.target.value as MilestoneCategory)}
                          >
                            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Target Age Slider with Derived Horizon */}
                        <div className="input-group">
                          <div className="label-split">
                            <label htmlFor={`ms-target-age-${m.id}`} className="field-label">
                              Target Age
                            </label>
                            <span className="field-val-pill">Age {m.targetAge}</span>
                          </div>
                          <div className="range-with-number">
                            <input
                              id={`ms-target-age-${m.id}`}
                              type="range"
                              min={Math.max(1, childAge + 1)}
                              max="55"
                              step="1"
                              value={m.targetAge}
                              onChange={(e) => handleUpdateMilestone(m.id, 'targetAge', parseInt(e.target.value, 10))}
                              className="range-slider"
                              aria-label={`Target age for milestone ${m.title}`}
                            />
                            <input
                              type="number"
                              min={childAge + 1}
                              max="55"
                              step="1"
                              value={m.targetAge}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                handleUpdateMilestone(m.id, 'targetAge', Number.isFinite(v) ? v : childAge + 1);
                              }}
                              className="number-input-compact"
                              aria-label={`Numeric target age for milestone ${m.title}`}
                            />
                          </div>
                          <p className={`horizon-hint ${isHorizonInvalid ? 'text-danger font-semibold' : 'text-muted'}`}>
                            {isHorizonInvalid ? (
                              <span>⚠️ Invalid: Target age must be &gt; current age ({childAge}y) and horizon ≤ 35y.</span>
                            ) : (
                              <span>
                                Time horizon: <strong>{horizon} year{horizon !== 1 ? 's' : ''}</strong> ({horizon * 12} months until goal)
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Cost in Today's Money */}
                        <div className="input-group">
                          <label htmlFor={`ms-cost-${m.id}`} className="field-label">
                            Goal Cost in Today's Money (₹)
                          </label>
                          <div className="rupee-input-wrapper">
                            <span className="rupee-prefix">₹</span>
                            <input
                              id={`ms-cost-${m.id}`}
                              type="number"
                              min="50000"
                              max="50000000"
                              step="50000"
                              value={m.costToday}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                handleUpdateMilestone(m.id, 'costToday', Number.isFinite(v) ? Math.max(0, v) : 0);
                              }}
                              className="number-input-full milestone-cost-input"
                              aria-label={`Today's cost for ${m.title}`}
                            />
                          </div>
                          <span className="sub-lakh-hint">{formatLakhCrore(m.costToday)}</span>
                        </div>
                      </div>

                      {/* Milestone Inflation Rate Configuration */}
                      <div className="milestone-inflation-row">
                        <div className="inflation-slider-block">
                          <div className="label-split">
                            <label htmlFor={`ms-inf-${m.id}`} className="field-label">
                              Assumed Annual Education Inflation Rate
                            </label>
                            <span className="field-val-pill">{m.annualInflationPercent}% / yr</span>
                          </div>
                          <input
                            id={`ms-inf-${m.id}`}
                            type="range"
                            min="0"
                            max="20"
                            step="0.5"
                            value={m.annualInflationPercent}
                            onChange={(e) => handleUpdateMilestone(m.id, 'annualInflationPercent', parseFloat(e.target.value))}
                            className="range-slider"
                            aria-label={`Annual inflation percentage for ${m.title}`}
                          />
                        </div>

                        {/* Presets Chips */}
                        <div className="inflation-presets-chips">
                          {INFLATION_PRESETS.map((p) => (
                            <button
                              key={p.rate}
                              type="button"
                              className={`chip-preset ${m.annualInflationPercent === p.rate ? 'chip-active' : ''}`}
                              onClick={() => handleUpdateMilestone(m.id, 'annualInflationPercent', p.rate)}
                              title={p.desc}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Collapsible Earmarked Assets Allocation Drawer */}
                      <div className="milestone-alloc-drawer-toggle">
                        <button
                          type="button"
                          className="btn-drawer-toggle"
                          onClick={() => setOpenAllocDrawerId(isAllocDrawerOpen ? null : m.id)}
                          aria-expanded={isAllocDrawerOpen}
                        >
                          <span className="drawer-icon">{isAllocDrawerOpen ? '▼' : '▶'}</span>
                          <span>
                            Earmarked Existing Investments Allocated to this Goal:{' '}
                            <strong>{formatRupee(totalAllocatedToThisMilestone)}</strong>
                          </span>
                        </button>
                      </div>

                      {isAllocDrawerOpen && (
                        <div className="alloc-drawer-content">
                          {existingInvestments.length === 0 ? (
                            <p className="text-muted text-sm">
                              No existing investments registered in Step 2. Add mutual funds, PPF, or fixed deposits above to allocate them to this milestone.
                            </p>
                          ) : (
                            <div className="alloc-items-list">
                              <p className="text-sm text-muted">
                                Allocate a portion of your registered assets to offset this goal. Over-allocating any single asset will be flagged:
                              </p>
                              {existingInvestments.map((inv) => {
                                const currentAlloc = m.allocations.find((a) => a.investmentId === inv.id)?.allocatedAmount ?? 0;
                                const otherAlloc = milestones
                                  .filter((other) => other.id !== m.id)
                                  .reduce((sum, other) => {
                                    const match = other.allocations.find((a) => a.investmentId === inv.id);
                                    return sum + (match ? match.allocatedAmount : 0);
                                  }, 0);
                                const availableForThis = Math.max(0, inv.currentValue - otherAlloc);

                                return (
                                  <div key={inv.id} className="alloc-item-row">
                                    <div className="alloc-item-info">
                                      <span className="alloc-item-name">{inv.label}</span>
                                      <span className="alloc-item-limits">
                                        Total: {formatRupee(inv.currentValue)} • Used in other goals: {formatRupee(otherAlloc)} • Available: {formatRupee(availableForThis)}
                                      </span>
                                    </div>
                                    <div className="alloc-item-input">
                                      <span className="rupee-prefix">₹</span>
                                      <input
                                        type="number"
                                        min="0"
                                        max={inv.currentValue}
                                        step="10000"
                                        value={currentAlloc}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value);
                                          handleUpdateAllocation(m.id, inv.id, Number.isFinite(val) ? Math.max(0, val) : 0);
                                        }}
                                        className="number-input-alloc"
                                        aria-label={`Allocated amount from ${inv.label} to ${m.title}`}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Milestone Real-Time Calculation Diagnostic Badge */}
                      {mResult && (
                        <div className="milestone-diagnostic-footer">
                          <div className="diag-metric">
                            <span className="diag-label">Future Cost ({horizon}y)</span>
                            <span className="diag-value font-semibold">{formatRupee(mResult.futureGoalCost)}</span>
                          </div>
                          <div className="diag-metric">
                            <span className="diag-label">Allocated Assets Growth</span>
                            <span className="diag-value text-teal font-semibold">
                              {mResult.allocatedCurrentAssets > 0
                                ? `${formatRupee(mResult.allocatedCurrentAssets)} → ${formatRupee(mResult.futureValueOfAllocatedAssets)}`
                                : '₹0'}
                            </span>
                          </div>
                          <div className="diag-metric">
                            <span className="diag-label">Net Funding Shortfall</span>
                            <span className={`diag-value ${mResult.isFullyCovered ? 'text-teal font-bold' : 'text-danger font-bold'}`}>
                              {mResult.isFullyCovered ? 'Covered under assumptions' : formatRupee(mResult.fundingShortfall)}
                            </span>
                          </div>
                          <div className="diag-metric">
                            <span className="diag-label">Required Fixed SIP</span>
                            <span className="diag-value font-bold text-navy">
                              {mResult.isFullyCovered ? '₹0' : `${formatRupee(mResult.requiredFixedMonthlySIP)}/mo`}
                            </span>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section D: Shared Simulation Assumptions */}
          <section className="planner-section" id="assumptions-section" aria-labelledby="assumptions-heading">
            <div className="section-header-row">
              <div>
                <h3 id="assumptions-heading" className="section-subtitle">
                  4. Shared Compounding Assumptions
                </h3>
                <p className="section-caption">
                  Rates apply across the planning model. All calculations assume beginning-of-month (Annuity-Due) monthly debits and geometric effective annual growth.
                </p>
              </div>
              <button
                type="button"
                id="toggle-children-assumptions-btn"
                className="btn-action-sm-subtle"
                onClick={() => setIsAssumptionsExpanded(!isAssumptionsExpanded)}
                aria-expanded={isAssumptionsExpanded}
              >
                {isAssumptionsExpanded ? 'Collapse Assumptions ↑' : 'Expand Assumptions ↓'}
              </button>
            </div>

            {isAssumptionsExpanded && (
              <div className="assumptions-cards-grid">
              {/* Assumed Annual Investment Return */}
              <div className="assumption-card">
                <div className="label-split">
                  <label htmlFor="assumed-return-slider" className="field-label">
                    Assumed Annual Investment Return
                  </label>
                  <span className="field-val-pill">{assumedAnnualReturnPercent}% / yr</span>
                </div>
                <input
                  id="assumed-return-slider"
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={assumedAnnualReturnPercent}
                  onChange={(e) => setAssumedAnnualReturnPercent(parseFloat(e.target.value))}
                  className="range-slider"
                  aria-label="Assumed effective annual investment return percentage"
                />
                <p className="assumption-subtext">
                  Illustrative geometric effective annual rate. Not guaranteed; actual market returns fluctuate.
                </p>
              </div>

              {/* Annual Step-Up Percentage */}
              <div className="assumption-card">
                <div className="label-split">
                  <label htmlFor="annual-stepup-slider" className="field-label">
                    Annual Step-Up Percentage
                  </label>
                  <span className="field-val-pill">{annualStepUpPercent}% / yr</span>
                </div>
                <input
                  id="annual-stepup-slider"
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={annualStepUpPercent}
                  onChange={(e) => setAnnualStepUpPercent(parseFloat(e.target.value))}
                  className="range-slider"
                  aria-label="Annual step-up percentage for step-up SIP option"
                />
                <p className="assumption-subtext">
                  Initial monthly installment increases by this percentage every 12 months in step with household income growth.
                </p>
              </div>
            </div>
            )}
          </section>

          {/* Validation Error Notice if Any */}
          {validationError && (
            <div className="alert-validation-error" role="alert" data-testid="planner-validation-error">
              <span className="alert-icon" aria-hidden="true">⚠️</span>
              <div className="alert-text">
                <strong>Calculation paused due to invalid input:</strong>
                <p>{validationError}</p>
              </div>
            </div>
          )}

          {hasAnyOverAllocatedAsset && (
            <div className="alert-validation-error" role="alert">
              <span className="alert-icon" aria-hidden="true">⚠️</span>
              <div className="alert-text">
                <strong>Asset Over-Allocation Detected:</strong>
                <p>One or more existing investments have been allocated beyond their current balance. Please adjust your allocations in Step 2 or within milestone cards.</p>
              </div>
            </div>
          )}

          {/* Section E: Combined Family Roadmap & Solution Cards */}
          {planResult && (
            <section
              className="results-container"
              id="family-roadmap-results"
              aria-labelledby="family-roadmap-heading"
              data-testid="family-roadmap-results"
            >
              <div className="results-header-block">
                <span className="results-category-badge">Consolidated Family Analysis</span>
                <h3 id="family-roadmap-heading" className="results-main-title">
                  Combined Family Higher Education Roadmap
                </h3>
                <p className="results-main-caption">
                  Consolidated outlook across {planResult.childrenCount} child profile{planResult.childrenCount > 1 ? 's' : ''} and {planResult.milestonesCount} future milestone{planResult.milestonesCount > 1 ? 's' : ''}.
                </p>
              </div>

              {/* Metric Highlights Strip */}
              <div className="results-metric-grid">
                <div className="metric-card">
                  <span className="metric-label">Total Cost in Today's Money</span>
                  <div className="metric-number">{formatRupee(planResult.totalCostToday)}</div>
                  <span className="metric-sub">{formatLakhCrore(planResult.totalCostToday)}</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Sum of Future Milestone Costs</span>
                  <div className="metric-number text-navy">{formatRupee(planResult.totalFutureMilestoneCosts)}</div>
                  <span className="metric-sub">Outlays at respective target dates (not a same-date liability)</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Earmarked Assets (Future Value)</span>
                  <div className="metric-number text-teal">{formatRupee(planResult.totalFutureValueOfAllocatedAssets)}</div>
                  <span className="metric-sub">From {formatRupee(planResult.totalAllocatedCurrentAssets)} allocated</span>
                </div>

                <div className="metric-card highlight-metric">
                  <span className="metric-label">Net Family Funding Shortfall</span>
                  <div className="metric-number text-gold">{formatRupee(planResult.totalFundingShortfall)}</div>
                  <span className="metric-sub">Requires fresh systematic accumulation</span>
                </div>
              </div>

              {/* Dual Solution Cards (Fixed SIP vs Step-Up SIP) */}
              <div className="solutions-grid">
                {/* Solution Card 1: Step-Up SIP */}
                <div className={`solution-card ${activeScheduleMode === 'STEP_UP' ? 'solution-card-active' : ''}`}>
                  <div className="solution-badge">Dynamic Step-Up Pathway</div>
                  <h4 className="solution-title">Annual Step-Up Monthly SIP ({planResult.annualStepUpPercent}%)</h4>
                  <div className="solution-amount">
                    {formatRupee(planResult.totalStartingStepUpMonthlySIP)}
                    <span className="per-month"> / month</span>
                  </div>
                  <p className="solution-desc">
                    Starts lower today and increases by {planResult.annualStepUpPercent}% every 12 months as household income expands. Outlays adjust as each milestone reaches maturity.
                  </p>
                  <button
                    type="button"
                    className={`btn-mode-select ${activeScheduleMode === 'STEP_UP' ? 'btn-mode-active' : ''}`}
                    onClick={() => setActiveScheduleMode('STEP_UP')}
                  >
                    {activeScheduleMode === 'STEP_UP' ? '✓ Showing Step-Up Schedule' : 'View Step-Up Schedule'}
                  </button>
                </div>

                {/* Solution Card 2: Fixed Monthly SIP */}
                <div className={`solution-card ${activeScheduleMode === 'FIXED' ? 'solution-card-active' : ''}`}>
                  <div className="solution-badge-subtle">Constant Level Pathway</div>
                  <h4 className="solution-title">Fixed Level Monthly SIP</h4>
                  <div className="solution-amount">
                    {formatRupee(planResult.totalStartingFixedMonthlySIP)}
                    <span className="per-month"> / month</span>
                  </div>
                  <p className="solution-desc">
                    Constant monthly contribution across each accumulation horizon. Requires higher upfront commitment today but remains stable without salary escalations.
                  </p>
                  <button
                    type="button"
                    className={`btn-mode-select ${activeScheduleMode === 'FIXED' ? 'btn-mode-active' : ''}`}
                    onClick={() => setActiveScheduleMode('FIXED')}
                  >
                    {activeScheduleMode === 'FIXED' ? '✓ Showing Fixed Schedule' : 'View Fixed Schedule'}
                  </button>
                </div>

                {/* Solution Card 3: Single Lump-Sum Equivalent */}
                <div className="solution-card solution-card-neutral">
                  <div className="solution-badge-neutral">Illustrative Equivalent</div>
                  <h4 className="solution-title">Single Lump-Sum Today</h4>
                  <div className="solution-amount">
                    {formatRupee(planResult.totalLumpSumEquivalentToday)}
                  </div>
                  <p className="solution-desc">
                    Present value equivalent required today if invested upfront at {planResult.assumedAnnualReturnPercent}% to cover all milestone shortfalls.
                  </p>
                  <span className="solution-neutral-note">For comparative mathematical modeling only.</span>
                </div>
              </div>

              {/* Year-by-Year Family Contribution Schedule */}
              <div className="schedule-section">
                <div className="schedule-header">
                  <div className="schedule-header-text">
                    <h4 className="schedule-title">
                      Year-by-Year Family Contribution Schedule ({activeScheduleMode === 'STEP_UP' ? `Annual Step-Up at ${planResult.annualStepUpPercent}%` : 'Fixed Level SIP'})
                    </h4>
                    <p className="schedule-caption">
                      Contributions for each milestone stop once that goal's target date is reached. Notice how outlays adjust as earlier milestones are funded:
                    </p>
                  </div>
                  <button
                    type="button"
                    id="toggle-children-schedule-btn"
                    className="btn-action-sm-subtle"
                    onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
                    aria-expanded={isScheduleExpanded}
                  >
                    {isScheduleExpanded ? 'Hide Schedule Table ↑' : 'Show Schedule Table ↓'}
                  </button>
                </div>

                {isScheduleExpanded && (
                  <div className="schedule-table-wrapper">
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th scope="col">Year</th>
                        <th scope="col">Active Milestones</th>
                        <th scope="col">Monthly Outlay (₹)</th>
                        <th scope="col">Annual Contribution (₹)</th>
                        <th scope="col">Cumulative Outlay (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let runningCumulative = 0;
                        return planResult.yearlySchedule.map((row) => {
                          const annualOutlay = activeScheduleMode === 'STEP_UP' ? row.stepUpAnnualOutlay : row.fixedAnnualOutlay;
                          const monthlyOutlay = activeScheduleMode === 'STEP_UP' ? row.stepUpMonthlyOutlay : row.fixedMonthlyOutlay;
                          runningCumulative += annualOutlay;

                          return (
                            <tr key={row.year} className={row.activeMilestonesCount === 0 ? 'row-inactive' : ''}>
                              <td className="font-semibold">Year {row.year}</td>
                              <td>
                                <span className={`badge-active-count ${row.activeMilestonesCount > 0 ? 'badge-count-active' : 'badge-count-done'}`}>
                                  {row.activeMilestonesCount > 0 ? `${row.activeMilestonesCount} Goal${row.activeMilestonesCount > 1 ? 's' : ''}` : 'All Goals Completed'}
                                </span>
                              </td>
                              <td className="font-semibold text-gold">{formatRupee(monthlyOutlay)}</td>
                              <td>{formatRupee(annualOutlay)}</td>
                              <td className="text-muted">{formatRupee(runningCumulative)}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
                )}
              </div>

              {/* Milestone Target Timeline Visualizer */}
              <div className="timeline-section">
                <h4 className="timeline-title">Milestone Disbursement Timeline</h4>
                <div className="timeline-cards-strip">
                  {planResult.milestoneResults
                    .slice()
                    .sort((a, b) => a.horizonYears - b.horizonYears)
                    .map((mr) => (
                      <div key={mr.milestoneId} className="timeline-node-card">
                        <div className="node-horizon-badge">In {mr.horizonYears} Years</div>
                        <h5 className="node-title">{mr.title}</h5>
                        <span className="node-child-tag">{mr.childName} (Age {mr.targetAge})</span>
                        <div className="node-future-cost">{formatRupee(mr.futureGoalCost)}</div>
                        <span className="node-shortfall-tag">
                          {mr.isFullyCovered ? '✓ Covered' : `Shortfall: ${formatRupee(mr.fundingShortfall)}`}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Regulatory & Methodology Transparency Notice */}
              <details className="methodology-details">
                <summary className="methodology-summary">
                  <span>Calculation Methodology, Assumptions & Limitations</span>
                  <span className="disclosure-chevron" aria-hidden="true">▾</span>
                </summary>
                <div className="methodology-content">
                  <p>
                    <strong>Annuity-Due Timing:</strong> Monthly SIP contributions are modeled assuming beginning-of-month deposits, compounding through each milestone's target horizon.
                  </p>
                  <p>
                    <strong>Cost Escalation (Inflation):</strong> Milestone costs grow annually as <code>Cost_future = Cost_today × (1 + r_inflation)^N</code>.
                  </p>
                  <p>
                    <strong>Earmarked Asset Growth:</strong> Existing savings allocated to a goal compound geometrically at the assumed investment return rate over the milestone horizon.
                  </p>
                  <p>
                    <strong>Step-Up Compounding:</strong> Annual step-up installments increase after each 12-month period (starting Month 13) in alignment with household compensation growth.
                  </p>
                  <div className="limitations-box">
                    <strong>Model Invariants:</strong>
                    <ul>
                      <li>Taxes on redemption, capital gains tax, and tax deductions are excluded (GATE-C blocked).</li>
                      <li>Foreign currency exchange rate swings for overseas tuition are excluded.</li>
                      <li>No return guarantee or specific product prescription is made.</li>
                    </ul>
                  </div>
                </div>
              </details>
            </section>
          )}
        </div>
      )}

      <style>{`
        .children-planner-island {
          margin: 16px 0 48px;
          color: var(--awc-navy);
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
            box-shadow: 0 10px 28px rgba(23, 48, 71, 0.18);
          }

          @media (max-width: 600px) {
            .mobile-result-summary {
              padding: 12px 14px;
              margin-bottom: 12px;
              border-radius: 14px;
            }
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
            font-size: clamp(22px, 6vw, 28px);
            font-weight: 900;
            color: var(--awc-gold);
            letter-spacing: -0.03em;
            line-height: 1.2;
            margin-bottom: 4px;
          }

          .mobile-per-month {
            font-size: 14px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.85);
          }

          .mobile-summary-compact {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.85);
            margin-bottom: 12px;
          }

          .mobile-summary-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
          }

          .mobile-pill {
            font-size: 11px;
            font-weight: 700;
            background-color: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 8px;
          }

          .mobile-pill.highlight {
            background-color: rgba(207, 239, 227, 0.2);
            color: var(--awc-mint);
          }

          .mobile-summary-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .mobile-action-btn {
            min-height: 44px;
            padding: 10px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 750;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            transition: all 0.2s ease;
          }

          .mobile-action-btn.primary {
            background-color: var(--color-text-brand);
            color: #ffffff;
          }

          .mobile-action-btn.secondary {
            background-color: rgba(255, 255, 255, 0.12);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
        }

        /* Example Notice Banner */
        .example-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-left: 4px solid #2563EB;
          border-radius: 16px;
          padding: 14px 18px;
          margin-bottom: 20px;
        }

        .banner-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1 1 280px;
        }

        .banner-icon {
          font-size: 20px;
          line-height: 1;
        }

        .banner-text strong {
          display: block;
          color: #1E3A8A;
          font-size: 13.5px;
          font-weight: 750;
          margin-bottom: 3px;
        }

        .banner-text p {
          color: #1E40AF;
          font-size: 12px;
          margin: 0;
          line-height: 1.45;
        }

        .btn-clear-example {
          background: #DBEAFE;
          color: #1E3A8A;
          border: 1px solid #93C5FD;
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-clear-example:hover {
          background: #BFDBFE;
        }

        /* Top Action Bar */
        .planner-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          background: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 16px;
          padding: 12px 20px;
          margin-bottom: 24px;
        }

        .status-indicator {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-brand);
        }

        .action-bar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-action-secondary {
          background: #ffffff;
          color: var(--awc-navy);
          border: 1px solid var(--awc-line);
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-action-secondary:hover {
          background: var(--awc-paper);
          border-color: var(--color-border-interactive);
          color: var(--color-text-brand);
        }

        .btn-action-outline-danger {
          background: transparent;
          color: #DC2626;
          border: 1px solid #FCA5A5;
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-action-outline-danger:hover {
          background: #FEF2F2;
        }

        /* Empty State Hero */
        .empty-planner-hero {
          text-align: center;
          padding: 48px 24px;
          background: linear-gradient(180deg, var(--awc-paper) 0%, #ffffff 100%);
          border: 2px dashed var(--awc-line);
          border-radius: 24px;
          margin-bottom: 32px;
        }

        .empty-hero-icon {
          font-size: 44px;
          margin-bottom: 16px;
        }

        .empty-hero-title {
          font-size: clamp(20px, 3vw, 26px);
          font-weight: 850;
          color: var(--awc-navy);
          margin: 0 0 10px;
          letter-spacing: -0.02em;
        }

        .empty-hero-desc {
          font-size: 14.5px;
          color: var(--color-text-muted);
          max-width: 640px;
          margin: 0 auto 24px;
          line-height: 1.6;
        }

        .empty-hero-actions {
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .btn-primary-action {
          background-color: var(--color-text-brand);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary-action:hover {
          background-color: #126e67;
          transform: translateY(-1px);
        }

        .btn-secondary-action {
          background-color: #ffffff;
          color: var(--awc-navy);
          border: 1px solid var(--awc-line);
          border-radius: 12px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary-action:hover {
          border-color: var(--color-border-interactive);
          color: var(--color-text-brand);
        }

        .empty-hero-features {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .feature-pill {
          font-size: 12px;
          font-weight: 700;
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          color: var(--color-text-muted);
          padding: 6px 14px;
          border-radius: 10px;
        }

        /* Planner Sections */
        .planner-workspace {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .planner-section {
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 16px rgba(23, 48, 71, 0.04);
        }

        @media (max-width: 600px) {
          .planner-section {
            padding: 20px 16px;
          }
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 600px) {
          .section-header-row {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .section-subtitle {
          font-size: 18px;
          font-weight: 850;
          color: var(--awc-navy);
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }

        .section-caption {
          font-size: 13px;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin: 0;
          max-width: 720px;
        }

        .btn-add-item {
          background-color: var(--awc-jade-soft);
          color: var(--color-text-brand);
          border: 1px solid rgba(22, 135, 126, 0.25);
          font-size: 12.5px;
          font-weight: 750;
          padding: 8px 16px;
          border-radius: 10px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .btn-add-item:hover {
          background-color: var(--color-text-brand);
          color: #ffffff;
        }

        /* Child Cards Grid */
        .children-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
        }

        .child-card {
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 16px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .child-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .child-badge {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background-color: rgba(22, 135, 126, 0.12);
          color: var(--color-text-brand);
          padding: 3px 10px;
          border-radius: 8px;
        }

        .btn-icon-delete {
          background: none;
          border: none;
          font-size: 14px;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .btn-icon-delete:hover {
          background-color: #FEE2E2;
          color: #DC2626;
        }

        .delete-confirm-box {
          background-color: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 12px;
          padding: 12px;
        }

        .delete-confirm-text {
          font-size: 12px;
          color: #991B1B;
          margin: 0 0 10px;
          line-height: 1.4;
          font-weight: 600;
        }

        .confirm-actions {
          display: flex;
          gap: 8px;
        }

        .btn-confirm-delete {
          background-color: #DC2626;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
        }

        .btn-cancel-delete {
          background-color: #ffffff;
          border: 1px solid #D1D5DB;
          color: #374151;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .child-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid var(--awc-line);
        }

        .mapped-count {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .btn-link-action {
          background: none;
          border: none;
          color: var(--color-text-brand);
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          padding: 0;
        }

        .btn-link-action:hover {
          text-decoration: underline;
        }

        /* Form Inputs Common */
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .field-label {
          font-size: 12.5px;
          font-weight: 750;
          color: var(--awc-navy);
        }

        .label-opt {
          font-size: 11px;
          font-weight: normal;
          color: var(--color-text-muted);
        }

        .label-split {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .field-val-pill {
          font-size: 11px;
          font-weight: 800;
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          color: var(--color-text-brand);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .text-input,
        .select-input {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          font-size: 14px;
          font-weight: 700;
          color: var(--awc-navy);
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .text-input:focus,
        .select-input:focus {
          outline: none;
          border-color: var(--color-border-interactive);
          box-shadow: 0 0 0 3px rgba(22, 135, 126, 0.15);
        }

        .range-with-number {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .range-slider {
          flex: 1;
          accent-color: var(--color-text-brand);
          cursor: pointer;
        }

        .number-input-compact {
          width: 60px;
          height: 38px;
          text-align: center;
          font-size: 13.5px;
          font-weight: 750;
          color: var(--awc-navy);
          border: 1px solid var(--awc-line);
          border-radius: 8px;
          background-color: #ffffff;
        }

        .rupee-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .rupee-prefix {
          position: absolute;
          left: 12px;
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .number-input-full {
          width: 100%;
          height: 42px;
          padding-left: 28px;
          padding-right: 12px;
          font-size: 14px;
          font-weight: 750;
          color: var(--awc-navy);
          border: 1px solid var(--awc-line);
          border-radius: 10px;
          background-color: #ffffff;
        }

        .sub-lakh-hint {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 3px;
        }

        /* Investments Table */
        .investments-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .investments-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .investments-table th {
          text-align: left;
          padding: 10px 12px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          border-bottom: 2px solid var(--awc-line);
        }

        .investments-table td {
          padding: 12px;
          border-bottom: 1px solid var(--awc-line);
          vertical-align: middle;
        }

        .text-input-table {
          width: 100%;
          min-width: 180px;
          height: 38px;
          padding: 0 10px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid var(--awc-line);
          border-radius: 8px;
        }

        .number-input-table {
          width: 130px;
          height: 38px;
          padding-left: 24px;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid var(--awc-line);
          border-radius: 8px;
        }

        .badge-danger-xs {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: #DC2626;
          margin-top: 3px;
        }

        .row-over-allocated {
          background-color: #FEF2F2;
        }

        .empty-assets-box {
          padding: 24px;
          text-align: center;
          background-color: var(--awc-paper);
          border-radius: 12px;
          border: 1px dashed var(--awc-line);
        }

        /* Milestones Stack */
        .milestones-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .milestone-card {
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          border-radius: 18px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          box-shadow: 0 4px 12px rgba(23, 48, 71, 0.03);
          transition: all 0.2s ease;
        }

        .milestone-card-invalid {
          border-color: #DC2626;
          background-color: #FFFDFD;
        }

        .milestone-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .milestone-title-block {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .milestone-number-tag {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          background-color: var(--awc-jade-soft);
          color: var(--color-text-brand);
          padding: 4px 10px;
          border-radius: 8px;
          white-space: nowrap;
        }

        .milestone-title-input {
          font-size: 16px;
          font-weight: 800;
          color: var(--awc-navy);
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 4px 8px;
          width: 100%;
          max-width: 440px;
          background: transparent;
        }

        .milestone-title-input:focus {
          border-color: var(--color-border-interactive);
          background-color: #ffffff;
        }

        .milestone-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-action-sm-subtle {
          background: none;
          border: 1px solid var(--awc-line);
          font-size: 11.5px;
          font-weight: 700;
          color: var(--color-text-muted);
          padding: 5px 12px;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-action-sm-subtle:hover {
          border-color: var(--color-border-interactive);
          color: var(--color-text-brand);
        }

        .milestone-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .horizon-hint {
          font-size: 11.5px;
          margin: 4px 0 0;
          line-height: 1.4;
        }

        .milestone-inflation-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background-color: var(--awc-paper);
          border-radius: 12px;
          padding: 14px;
        }

        .inflation-slider-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .inflation-presets-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chip-preset {
          font-size: 11px;
          font-weight: 700;
          background-color: #ffffff;
          border: 1px solid var(--awc-line);
          color: var(--color-text-muted);
          padding: 5px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chip-preset:hover {
          border-color: var(--color-border-interactive);
        }

        .chip-preset.chip-active {
          background-color: var(--color-text-brand);
          border-color: var(--color-border-interactive);
          color: #ffffff;
        }

        /* Allocation Drawer */
        .btn-drawer-toggle {
          background: none;
          border: none;
          font-size: 12.5px;
          font-weight: 700;
          color: var(--color-text-brand);
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 0;
        }

        .drawer-icon {
          font-size: 11px;
        }

        .alloc-drawer-content {
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 12px;
          padding: 16px;
        }

        .alloc-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alloc-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 8px 0;
          border-bottom: 1px dashed var(--awc-line);
        }

        .alloc-item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .alloc-item-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--awc-navy);
        }

        .alloc-item-limits {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .alloc-item-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .number-input-alloc {
          width: 140px;
          height: 36px;
          padding-left: 24px;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid var(--awc-line);
          border-radius: 8px;
        }

        /* Milestone Diagnostic Footer */
        .milestone-diagnostic-footer {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          background-color: var(--awc-paper);
          border-radius: 12px;
          padding: 14px;
        }

        .diag-metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .diag-label {
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
        }

        .diag-value {
          font-size: 14px;
        }

        /* Shared Assumptions Grid */
        .assumptions-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }

        .assumption-card {
          background-color: var(--awc-paper);
          border: 1px solid var(--awc-line);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .assumption-subtext {
          font-size: 11.5px;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1.4;
        }

        /* Validation Alerts */
        .alert-validation-error {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background-color: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 14px;
          padding: 16px 20px;
        }

        .alert-icon {
          font-size: 20px;
        }

        .alert-text strong {
          display: block;
          color: #991B1B;
          font-size: 13px;
          margin-bottom: 2px;
        }

        .alert-text p {
          color: #B91C1C;
          font-size: 12.5px;
          margin: 0;
        }

        /* Results Container (Atlantic Navy Concept C) */
        .results-container {
          background-color: var(--awc-navy);
          color: #ffffff;
          border-radius: 24px;
          padding: 36px 32px;
          box-shadow: 0 12px 36px rgba(23, 48, 71, 0.16);
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        @media (max-width: 600px) {
          .results-container {
            padding: 24px 18px;
            border-radius: 18px;
          }
        }

        .results-header-block {
          margin-bottom: -8px;
        }

        .results-category-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--awc-gold);
          background-color: rgba(242, 198, 93, 0.15);
          padding: 4px 10px;
          border-radius: 12px;
          margin-bottom: 8px;
        }

        .results-main-title {
          font-size: clamp(20px, 2.5vw, 26px);
          font-weight: 850;
          color: #ffffff;
          letter-spacing: -0.02em;
          margin: 0 0 6px;
        }

        .results-main-caption {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
        }

        /* Metric Grid */
        .results-metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .metric-card {
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-card.highlight-metric {
          background-color: rgba(242, 198, 93, 0.12);
          border-color: rgba(242, 198, 93, 0.3);
        }

        .metric-label {
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.7);
        }

        .metric-number {
          font-size: 22px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .metric-sub {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.65);
        }

        /* Solutions Grid */
        .solutions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }

        .solution-card {
          background-color: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          transition: all 0.2s ease;
        }

        .solution-card-active {
          border-color: var(--color-border-interactive);
          background-color: rgba(22, 135, 126, 0.15);
        }

        .solution-badge {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--awc-gold);
          background-color: rgba(242, 198, 93, 0.18);
          padding: 3px 10px;
          border-radius: 10px;
          align-self: flex-start;
        }

        .solution-badge-subtle {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--awc-mint);
          background-color: rgba(207, 239, 227, 0.15);
          padding: 3px 10px;
          border-radius: 10px;
          align-self: flex-start;
        }

        .solution-badge-neutral {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.7);
          background-color: rgba(255, 255, 255, 0.1);
          padding: 3px 10px;
          border-radius: 10px;
          align-self: flex-start;
        }

        .solution-title {
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
        }

        .solution-amount {
          font-size: 26px;
          font-weight: 900;
          color: var(--awc-gold);
          letter-spacing: -0.02em;
        }

        .per-month {
          font-size: 14px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
        }

        .solution-desc {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.5;
          margin: 0;
          flex-grow: 1;
        }

        .solution-neutral-note {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.55);
        }

        .btn-mode-select {
          background-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.2s ease;
        }

        .btn-mode-select:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .btn-mode-select.btn-mode-active {
          background-color: var(--color-text-brand);
          border-color: var(--color-border-interactive);
        }

        /* Schedule Section */
        .schedule-section {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 18px;
          padding: 24px;
        }

        .schedule-title {
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 6px;
        }

        .schedule-caption {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 16px;
        }

        .schedule-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .schedule-table th {
          text-align: left;
          padding: 10px 12px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.65);
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }

        .schedule-table td {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .row-inactive {
          opacity: 0.5;
        }

        .badge-active-count {
          font-size: 11px;
          font-weight: 750;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .badge-count-active {
          background-color: rgba(207, 239, 227, 0.15);
          color: var(--awc-mint);
        }

        .badge-count-done {
          background-color: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
        }

        /* Timeline Section */
        .timeline-title {
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 16px;
        }

        .timeline-cards-strip {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px;
        }

        .timeline-node-card {
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .node-horizon-badge {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--awc-gold);
          margin-bottom: 2px;
        }

        .node-title {
          font-size: 14px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
        }

        .node-child-tag {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .node-future-cost {
          font-size: 16px;
          font-weight: 850;
          color: #ffffff;
          margin-top: 4px;
        }

        .node-shortfall-tag {
          font-size: 11.5px;
          color: var(--awc-mint);
        }

        /* Methodology Details */
        .methodology-details {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 16px;
        }

        .methodology-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 750;
          color: rgba(255, 255, 255, 0.75);
          cursor: pointer;
          list-style: none;
        }

        .methodology-summary::-webkit-details-marker {
          display: none;
        }

        .methodology-summary:hover {
          color: #ffffff;
        }

        .disclosure-chevron {
          transition: transform 0.2s ease;
        }

        .methodology-details[open] .disclosure-chevron {
          transform: rotate(180deg);
        }

        .methodology-content {
          padding-top: 14px;
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }

        .methodology-content code {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 2px 5px;
          border-radius: 4px;
          color: var(--awc-mint);
        }

        .limitations-box {
          background-color: rgba(0, 0, 0, 0.2);
          padding: 12px;
          border-radius: 8px;
          margin-top: 10px;
        }

        .limitations-box ul {
          margin: 6px 0 0 16px;
          padding: 0;
        }

        .limitations-box li {
          margin-bottom: 4px;
        }

        /* Utility Color Classes */
        .text-navy {
          color: var(--awc-navy);
        }

        .text-teal {
          color: var(--color-text-brand);
        }

        .text-gold {
          color: var(--awc-gold);
        }

        .text-danger {
          color: #EF4444;
        }

        .text-muted {
          color: var(--color-text-muted);
        }

        .font-semibold {
          font-weight: 700;
        }

        .font-bold {
          font-weight: 800;
        }

        .text-right {
          text-align: right;
        }
      `}</style>
    </div>
  );
};

export default ChildrenFuturePlannerIsland;
