import React, { useState, useId, useEffect } from 'react';
import {
  HEALTH_PILLARS,
  calculateFinancialHealth,
  type HealthCheckResult,
  type HealthPillar,
} from '../../domain/finance/financialHealth';
import HealthIllustration from './HealthIllustration';

// ----------------------------------------------------
// Restrained, Accessible Line SVG Icons (20x20, 1.75 stroke)
// ----------------------------------------------------
function CashFlowIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function EmergencyReserveIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function DebtIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  );
}

function ProtectionIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function InvestmentsIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function GoalsIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function RetirementIcon(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function CheckIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function renderPillarIcon(pillar: HealthPillar): React.JSX.Element {
  switch (pillar) {
    case 'cashFlow': return <CashFlowIcon />;
    case 'emergencyFund': return <EmergencyReserveIcon />;
    case 'debt': return <DebtIcon />;
    case 'protection': return <ProtectionIcon />;
    case 'investments': return <InvestmentsIcon />;
    case 'goals': return <GoalsIcon />;
    case 'retirement': return <RetirementIcon />;
  }
}

export default function HealthQuestionnaire(): React.JSX.Element {
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const baseId = useId();

  const totalSteps = HEALTH_PILLARS.length;
  const currentPillar = HEALTH_PILLARS[currentStep];
  const currentAnswer = currentPillar ? answers[currentPillar.id] : undefined;
  const isLastStep = currentStep === totalSteps - 1;

  const handleStart = (): void => {
    setIsStarted(true);
    setCurrentStep(0);
    setIsCompleted(false);
    setValidationError(null);
  };

  const handleSelectOption = (optionId: string): void => {
    setAnswers((prev) => ({
      ...prev,
      [currentPillar.id]: optionId,
    }));
    setValidationError(null);
  };

  const handleNext = (): void => {
    if (!currentAnswer) {
      setValidationError('Please select an option to continue.');
      return;
    }

    if (isLastStep) {
      const fullAnswers = { ...answers, [currentPillar.id]: currentAnswer };
      try {
        const computed = calculateFinancialHealth(fullAnswers);
        setResult(computed);
        setIsCompleted(true);
      } catch (err) {
        console.error('Calculation error:', err);
      }
    } else {
      setCurrentStep((prev) => prev + 1);
      setValidationError(null);
    }
  };

  const handleBack = (): void => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setValidationError(null);
    }
  };

  const handleEditAnswers = (): void => {
    setIsCompleted(false);
    setValidationError(null);
  };

  const handleRestart = (): void => {
    setAnswers({});
    setCurrentStep(0);
    setIsCompleted(false);
    setIsStarted(false);
    setResult(null);
    setValidationError(null);
  };

  const handlePrint = (): void => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Keyboard navigation for radio choices
  const handleRadioKeyDown = (e: React.KeyboardEvent, optionId: string): void => {
    if (!currentPillar) return;
    const opts = currentPillar.options;
    const currIdx = opts.findIndex((o) => o.id === optionId);
    let targetIdx = -1;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        targetIdx = (currIdx + 1) % opts.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        targetIdx = (currIdx - 1 + opts.length) % opts.length;
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        handleSelectOption(optionId);
        return;
      default:
        return;
    }

    if (targetIdx >= 0) {
      const nextOpt = opts[targetIdx];
      handleSelectOption(nextOpt.id);
      const nextInput = document.getElementById(`${baseId}-opt-${nextOpt.id}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // Scroll to questionnaire top smoothly on step change
  useEffect(() => {
    if (isStarted && !isCompleted) {
      const el = document.getElementById('health-questionnaire-card');
      if (el) {
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [currentStep, isStarted, isCompleted]);

  return (
    <div className="health-app-container" id="health-questionnaire-app">
      {/* Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" id="health-announcement">
        {isCompleted && result
          ? `Assessment complete. Your overall score is ${result.overallScore} out of 100, classified as ${result.band.title}. ${result.recommendations.length} prioritized recommendations generated.`
          : isStarted && currentPillar
          ? `Question ${currentStep + 1} of ${totalSteps}: ${currentPillar.title}. ${currentAnswer ? 'Option selected.' : 'No option selected yet.'}`
          : 'Understand your family financial health. Self-assessment ready.'}
      </div>

      {/* --------------------------------------------------------- */}
      {/* 1. START STAGE: Compact, Premium Opening Experience      */}
      {/* --------------------------------------------------------- */}
      {!isStarted && !isCompleted && (
        <section className="health-start-card" id="health-start-card" aria-labelledby="start-heading">
          <div className="start-layout-grid">
            <div className="start-copy-col">
              <span className="eyebrow-chip">FINANCIAL HEALTH CHECK</span>
              <h1 id="start-heading" className="start-main-title">
                Understand your family's financial health
              </h1>
              <p className="start-lead-text">
                Answer a few practical questions about your household finances to see where things are going well and where you may want to focus next.
              </p>

              <div className="start-action-row">
                <button
                  type="button"
                  id="start-health-check-btn"
                  onClick={handleStart}
                  className="btn-start"
                >
                  Start health check <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
            <div className="start-art-col" aria-hidden="true">
              <HealthIllustration type="landing" />
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------- */}
      {/* 2. QUESTIONNAIRE STAGE: Guided, Two-Column Experience     */}
      {/* --------------------------------------------------------- */}
      {isStarted && !isCompleted && currentPillar && (
        <div className="health-questionnaire-card" id="health-questionnaire-card">
          <div className="question-layout-grid">
            {/* Visual Panel (38% Desktop, Compact Top Stage on Mobile) */}
            <div className="question-visual-col" aria-hidden="true">
              <aside className="illustration-panel question-illustration-box">
                <div className="illustration-meta">
                  <span className="dimension-number">DIMENSION 0{currentStep + 1} OF 0{totalSteps}</span>
                  <div className="dimension-progress" aria-hidden="true">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                      <span key={i} className={i <= currentStep ? 'dimension-pip done' : 'dimension-pip'} />
                    ))}
                  </div>
                </div>

                <div className="illustration-wrap">
                  <HealthIllustration type={currentPillar.id} />
                </div>

                <div className="illustration-caption">
                  <h3 className="caption-title">{currentPillar.title}</h3>
                  <p className="caption-text">
                    {currentPillar.id === 'cashFlow' && 'Income flowing into essentials, debt commitments, and disciplined savings.'}
                    {currentPillar.id === 'emergencyFund' && 'A reliable liquid buffer protecting your family from unexpected financial disruptions.'}
                    {currentPillar.id === 'debt' && 'Balanced loan commitments preserving monthly cash flow flexibility.'}
                    {currentPillar.id === 'protection' && 'Safeguarding family income, health emergencies, and dependents.'}
                    {currentPillar.id === 'investments' && 'Aligning investments with timelines, risk tolerance, and compounding goals.'}
                    {currentPillar.id === 'goals' && 'Giving every milestone a target timeline and systematic plan.'}
                    {currentPillar.id === 'retirement' && 'Building sustainable long-term financial independence for later life.'}
                  </p>
                </div>
              </aside>
            </div>

            {/* Interactive Question Panel (62% Desktop) */}
            <div className="question-interactive-col">
              {/* Progress Header */}
              <div className="question-header">
                <div className="progress-info-row">
                  <button
                    type="button"
                    id="back-step-btn"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="btn-nav-back"
                    aria-label="Previous question"
                  >
                    ← Back
                  </button>

                  <span className="step-counter" id="health-step-indicator">
                    Question {currentStep + 1} of {totalSteps}
                  </span>

                  <button
                    type="button"
                    id="restart-health-btn"
                    onClick={handleRestart}
                    className="btn-clear-all"
                    title="Clear answers and start over"
                  >
                    Clear all
                  </button>
                </div>

                <div
                  className="progress-track"
                  role="progressbar"
                  aria-valuenow={currentStep + 1}
                  aria-valuemin={1}
                  aria-valuemax={totalSteps}
                  aria-label={`Progress: Question ${currentStep + 1} of ${totalSteps}`}
                >
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.round(((currentStep + 1) / totalSteps) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Question Body */}
              <div className="question-body">
                <div className="pillar-label-strip">
                  <span className="pillar-icon-badge" aria-hidden="true">
                    {renderPillarIcon(currentPillar.id)}
                  </span>
                  <span className="pillar-name-tag">{currentPillar.title}</span>
                </div>

                <h2 className="question-title" id={`${baseId}-q-title`}>
                  {currentPillar.question}
                </h2>

                <p className="question-helper">{currentPillar.helperText}</p>

                {validationError && (
                  <div className="validation-alert" role="alert">
                    <span className="alert-icon" aria-hidden="true">!</span>
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Answer Options */}
                <fieldset className="options-fieldset">
                  <legend className="sr-only">{currentPillar.question}</legend>
                  <div className="options-list" role="radiogroup" aria-labelledby={`${baseId}-q-title`}>
                    {currentPillar.options.map((opt) => {
                      const isSelected = currentAnswer === opt.id;
                      const optId = `${baseId}-opt-${opt.id}`;
                      return (
                        <label
                          key={opt.id}
                          htmlFor={optId}
                          className={`option-card ${isSelected ? 'option-selected' : ''}`}
                          id={`opt-card-${opt.id}`}
                        >
                          <input
                            type="radio"
                            id={optId}
                            name={currentPillar.id}
                            value={opt.id}
                            checked={isSelected}
                            onChange={() => handleSelectOption(opt.id)}
                            onKeyDown={(e) => handleRadioKeyDown(e, opt.id)}
                            className="option-radio-input"
                          />
                          <div className="radio-visual" aria-hidden="true">
                            {isSelected ? <CheckIcon /> : <span className="empty-dot" />}
                          </div>
                          <div className="option-label-wrap">
                            <span className="option-label">{opt.label}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              {/* Questionnaire Action Footer */}
              <div className="question-footer">
                <button
                  type="button"
                  id="next-step-btn"
                  onClick={handleNext}
                  disabled={!currentAnswer}
                  className="btn-continue"
                >
                  {isLastStep ? 'View my results →' : 'Continue →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* 3. RESULTS VIEW: Executive Wealth Diagnostic Dashboard   */}
      {/* --------------------------------------------------------- */}
      {isCompleted && result && (
        <div className="health-results-wrapper" id="health-results-dashboard">
          {/* Top Actions Bar (Compact utility controls) */}
          <div className="results-top-actions no-print">
            <button
              type="button"
              onClick={handleEditAnswers}
              className="btn-action-compact btn-action-back"
              id="edit-answers-btn"
            >
              ← Review or change answers
            </button>
            <div className="action-group-right">
              <button
                type="button"
                onClick={handlePrint}
                className="btn-action-compact btn-action-print"
                id="print-health-btn"
              >
                Print summary
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="btn-action-compact btn-action-reset"
                id="retake-health-btn"
              >
                Start over
              </button>
            </div>
          </div>

          {/* 1. Commanding Executive Score Hero Card */}
          <div className="result-hero-card">
            <div className="hero-header-row">
              <div className="hero-badge-strip">
                <span className="results-eyebrow">EXECUTIVE HOUSEHOLD DIAGNOSTIC</span>
                <span className="results-chip-live">7 PILLARS EVALUATED</span>
              </div>
              <h2 className="hero-title">Your Financial Health Diagnostic</h2>
              <p className="hero-subtitle">
                A structured, independent evaluation of your family's financial resilience, liquidity runway, debt discipline, and milestone security.
              </p>
            </div>

            <div className="hero-score-split">
              {/* Radial Dial Score Display */}
              <div
                className="score-gauge-box"
                id="overall-score-display"
                aria-label={`Overall Financial Health Score: ${result.overallScore} out of 100`}
              >
                <div className="gauge-dial-wrap">
                  <svg width="130" height="130" viewBox="0 0 130 130" className="gauge-dial-svg" aria-hidden="true">
                    <circle cx="65" cy="65" r="54" className="gauge-bg-ring" />
                    <circle
                      cx="65"
                      cy="65"
                      r="54"
                      className={`gauge-fill-ring band-${result.overallScore >= 80 ? 'excellent' : result.overallScore >= 65 ? 'good' : result.overallScore >= 50 ? 'moderate' : 'critical'}`}
                      style={{
                        stroke: result.band.badgeColor,
                        strokeDasharray: 339.29,
                        strokeDashoffset: 339.29 - (339.29 * Math.min(Math.max(result.overallScore, 0), 100)) / 100,
                      }}
                    />
                  </svg>
                  <div className="gauge-dial-content">
                    <span className="gauge-number" id="health-overall-score">
                      {result.overallScore}
                    </span>
                    <span className="gauge-denom">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Band & Executive Advisory Narrative */}
              <div className="score-summary-details">
                <div className="band-badge-pill" id="health-band-badge">
                  <span className="badge-beacon" aria-hidden="true" />
                  <span className="badge-text">{result.band.title}</span>
                </div>
                <p className="band-explanation" id="health-band-desc">
                  {result.overallScore >= 75
                    ? result.band.shortExplanation
                    : 'Your answers indicate essential foundational strengths alongside high-priority areas that require targeted attention. Taking one structured move at a time will systematically elevate your household resilience.'}
                </p>
                <div className="hero-metrics-strip">
                  <span className="metric-pill">✓ 100% Client-Side Privacy</span>
                  <span className="metric-pill">✓ Objective Financial Benchmarks</span>
                  <span className="metric-pill">✓ Action Roadmap Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Key Strengths & Priority Focus Areas */}
          <div className="strengths-vulnerabilities-grid">
            {/* What's Going Well */}
            <div className="insight-column-card card-strengths">
              <div className="column-header">
                <span className="col-status-indicator indicator-strong" aria-hidden="true">✓</span>
                <div>
                  <h3 className="col-title">What's going well</h3>
                  <span className="col-sub">Established pillars providing family stability</span>
                </div>
              </div>
              {result.strengths.length > 0 ? (
                <ul className="insight-bullets">
                  {result.strengths.slice(0, 2).map((s) => (
                    <li key={s.pillar} className="insight-item insight-item-strength">
                      <strong className="insight-area-name">{s.title}:</strong> {s.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-items-note">
                  No areas currently meet the high-resilience benchmark. Addressing the priority focus areas will help build your foundation.
                </p>
              )}
            </div>

            {/* Where to Focus First */}
            <div className="insight-column-card card-vulnerabilities">
              <div className="column-header">
                <span className="col-status-indicator indicator-attention" aria-hidden="true">!</span>
                <div>
                  <h3 className="col-title">Where to focus first</h3>
                  <span className="col-sub">Key opportunities to eliminate household vulnerability</span>
                </div>
              </div>
              {result.areasNeedingAttention.length > 0 ? (
                <ul className="insight-bullets">
                  {result.areasNeedingAttention.slice(0, 2).map((v) => (
                    <li key={v.pillar} className="insight-item insight-item-focus">
                      <strong className="insight-area-name">{v.title}:</strong> {v.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-items-note">
                  All evaluated areas show good resilience. Maintain regular reviews and adjust as your family's needs evolve.
                </p>
              )}
            </div>
          </div>

          {/* 3. Seven-Area Breakdown: Visible by Default in 3-Column Grid */}
          {(() => {
            const scores = result.pillarScores.map((p) => p.score);
            const minScore = Math.min(...scores);
            const maxScore = Math.max(...scores);

            const benchmarkHints: Record<string, string> = {
              cashFlow: 'Target: ≥ 20% Net Income Saved',
              emergencyFund: 'Target: 3–6 Months Fixed Expenses',
              debt: 'Target: Total EMIs < 35% Income',
              protection: 'Target: 10–15x Term + Health Top-Up',
              investments: 'Target: 5–15+ Year Compounding',
              goals: 'Target: 3 Horizons Matched to Timeline',
              retirement: 'Target: 25–30x Annual Outflows Corpus',
            };

            return (
              <section className="pillars-breakdown-section" aria-labelledby="breakdown-toggle-heading">
                <div className="breakdown-header-bar">
                  <div className="breakdown-header-info">
                    <span className="breakdown-eyebrow">DETAILED DIMENSION SCORES</span>
                    <h3 id="breakdown-toggle-heading" className="subhead-title">
                      All 7 Financial Areas Evaluated
                    </h3>
                    <p className="subhead-caption">
                      Scores range from {minScore} to {maxScore} / 100 • Expand any dimension to view your recorded response and advisory benchmark context
                    </p>
                  </div>
                </div>

                <div
                  id="seven-areas-grid"
                  className="pillars-grid-container is-expanded"
                >
                  {result.pillarScores.map((p) => {
                    const pillarConfig = HEALTH_PILLARS.find((hp) => hp.id === p.pillar);
                    const hint = benchmarkHints[p.pillar] ?? 'Evaluated on standard benchmarks';

                    return (
                      <div key={p.pillar} className={`pillar-score-row pillar-row-${p.status}`} id={`pillar-row-${p.pillar}`}>
                        <div className="pillar-row-meta">
                          <div className="pillar-title-wrap">
                            <span className="pillar-row-icon" aria-hidden="true">
                              {renderPillarIcon(p.pillar)}
                            </span>
                            <div>
                              <span className="pillar-name">{p.title}</span>
                              <span className="pillar-benchmark-tag">{hint}</span>
                            </div>
                          </div>
                          <div className="pillar-status-wrap">
                            <span className={`status-chip chip-${p.status}`}>
                              {p.statusLabel}
                            </span>
                            <span className="pillar-score-badge">
                              {p.score} <span className="score-denom">/ 100</span>
                            </span>
                          </div>
                        </div>

                        <div className="pillar-score-bar-bg" aria-hidden="true">
                          <div
                            className={`pillar-score-bar-fill bar-${p.status}`}
                            style={{ width: `${p.score}%` }}
                          />
                        </div>

                        <details className="pillar-detail-accordion">
                          <summary className="pillar-detail-summary">
                            <span>View answer &amp; details</span>
                          </summary>
                          <div className="pillar-detail-body">
                            <p className="pillar-answer-summary">
                              <span className="answer-muted">Your answer:</span> {p.selectedOptionLabel}
                            </p>
                            {pillarConfig && (
                              <p className="pillar-explanation-text">{pillarConfig.helperText}</p>
                            )}
                          </div>
                        </details>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {/* 4. Condensed Next Steps */}
          {result.recommendations.length > 0 && (
            <section className="recommendations-section" aria-labelledby="recommendations-heading">
              <div className="section-head">
                <span className="rec-eyebrow">ACTIONABLE ROADMAP</span>
                <h3 id="recommendations-heading" className="subhead-title">Your Prioritized Next Steps</h3>
                <p className="subhead-caption">
                  Targeted, practical moves based on your specific responses, ordered by foundational financial priority.
                </p>
              </div>

              <div className="recommendations-condensed-list">
                {result.recommendations.slice(0, 3).map((rec, idx) => (
                  <div key={rec.pillar} className="rec-card rec-condensed-row" id={`rec-card-${rec.pillar}`}>
                    <span className="rec-step-index" aria-label={`Step ${idx + 1}`}>
                      {idx + 1}
                    </span>
                    <div className="rec-content-wrap">
                      <div className="rec-title-row">
                        <h4 className="rec-item-title">{rec.title}</h4>
                      </div>
                      <p className="rec-action-text">{rec.action}</p>
                      {rec.route && (
                        <div className="rec-link-wrap no-print">
                          <a href={rec.route} className="btn-tool-link">
                            {rec.routeLabel ?? 'Open calculator →'}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. Restrained Secondary Actions: REAL Statement & Contact */}
          <section className="secondary-actions-section no-print" aria-label="Next options">
            <div className="secondary-actions-grid">
              <div className="secondary-action-card">
                <div className="secondary-action-text">
                  <span className="secondary-action-tag">COMPREHENSIVE AUDIT</span>
                  <h4 className="secondary-action-title">Create a detailed financial statement</h4>
                  <p className="secondary-action-desc">
                    Map your monthly income, living expenses, emergency reserves, debt obligations, and investments for a full household audit.
                  </p>
                </div>
                <div className="secondary-action-btn-wrap">
                  <a href="/health-check/real-statement/" className="btn-secondary-choice" id="link-real-statement">
                    Start REAL Statement →
                  </a>
                </div>
              </div>

              <div className="secondary-action-card">
                <div className="secondary-action-text">
                  <span className="secondary-action-tag">EXECUTIVE CONSULTATION</span>
                  <h4 className="secondary-action-title">Contact Ant Wealth Creation</h4>
                  <p className="secondary-action-desc">
                    Have questions about your assessment result or looking for independent financial guidance? Connect with our team.
                  </p>
                </div>
                <div className="secondary-action-btn-wrap">
                  <a href="/contact/" className="btn-secondary-choice" id="link-contact">
                    Connect with an advisor →
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* SCOPED COMPONENT STYLES (Concept C Token Architecture)    */}
      {/* --------------------------------------------------------- */}
      <style>{`
        .health-app-container {
          font-family: var(--font-family-body, system-ui, sans-serif);
          color: var(--color-brand-primary, #173047);
          width: 100%;
          margin: 0 auto;
        }

        /* ------------------------------------------------------- */
        /* START EXPERIENCE                                        */
        /* ------------------------------------------------------- */
        .health-start-card {
          background-color: var(--color-bg-surface, #FFFFFF);
          border: 1px solid var(--color-border-subtle, #E2E8F0);
          border-radius: var(--radius-xl, 1rem);
          padding: 2.75rem 2.25rem;
          box-shadow: 0 4px 20px rgba(23, 48, 71, 0.05);
          margin: 1rem auto 0 auto;
          max-width: 1200px;
        }

        .start-layout-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 2.5rem;
          align-items: center;
        }

        .start-copy-col {
          display: flex;
          flex-direction: column;
        }

        .start-art-col {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          border-radius: 20px;
          background: linear-gradient(135deg, #E6F6EF 0%, #F3FAF7 55%, #F8EFD7 100%);
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          min-height: 320px;
          border: 1px solid #D8E9E1;
        }

        .start-art-col:before {
          content: "";
          position: absolute;
          width: 320px;
          height: 320px;
          border: 1px solid rgba(19, 122, 113, 0.12);
          border-radius: 50%;
          right: -40px;
          top: -60px;
          box-shadow: 0 0 0 24px rgba(255, 255, 255, 0.22), 0 0 0 52px rgba(255, 255, 255, 0.16);
          pointer-events: none;
        }

        .start-art-col svg {
          width: 100%;
          max-width: 440px;
          height: auto;
          position: relative;
          z-index: 1;
        }

        .eyebrow-chip {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-brand-secondary, #137A71);
          background-color: #F0FDFA;
          border: 1px solid #CCFBF1;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          margin-bottom: 1rem;
          align-self: flex-start;
        }

        .start-main-title {
          font-family: var(--font-family-heading, system-ui, sans-serif);
          font-size: clamp(1.65rem, 3.5vw, 2.35rem);
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          line-height: 1.25;
          margin: 0 0 1rem 0;
        }

        .start-lead-text {
          font-size: 1.05rem;
          color: var(--color-text-secondary, #475569);
          line-height: 1.6;
          margin: 0 0 2rem 0;
        }

        .start-action-row {
          display: flex;
          align-items: center;
        }

        .btn-start {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--color-action, #137A71);
          color: #FFFFFF;
          font-size: 1rem;
          font-weight: 600;
          padding: 0.85rem 1.75rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          min-height: 48px;
          box-shadow: 0 4px 12px rgba(19, 122, 113, 0.2);
          transition: background-color 0.15s ease, transform 0.15s ease;
        }

        .btn-start:hover {
          background-color: var(--color-action-hover, #0F6B63);
          transform: translateY(-1px);
        }

        .btn-start:focus-visible {
          outline: 3px solid var(--awc-gold, #F2C65D);
          outline-offset: 3px;
        }

        /* ------------------------------------------------------- */
        /* QUESTIONNAIRE CONTAINER (Two-Column Balanced Layout)    */
        /* ------------------------------------------------------- */
        .health-questionnaire-card {
          background-color: var(--color-bg-surface, #FFFFFF);
          border: 1px solid var(--color-border-subtle, #E2E8F0);
          border-radius: var(--radius-xl, 1.25rem);
          padding: 2.25rem;
          box-shadow: 0 4px 24px rgba(23, 48, 71, 0.06);
          margin: 1rem auto 0 auto;
          max-width: 1240px;
        }

        .question-layout-grid {
          display: grid;
          grid-template-columns: 38% 1fr;
          gap: 2.25rem;
          align-items: stretch;
        }

        .question-visual-col {
          width: 100%;
          display: flex;
        }

        /* Dedicated 3-layer Illustration Stage matching approved prototype */
        .illustration-panel {
          border-radius: 20px;
          border: 1px solid #D8E9E1;
          background: linear-gradient(150deg, #F0FAF6 0%, #F7FAF8 52%, #FFF7DF 100%);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 100%;
          min-height: 480px;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }

        .illustration-panel:after {
          content: "";
          position: absolute;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          border: 1px solid rgba(19, 122, 113, 0.10);
          right: -100px;
          top: 100px;
          box-shadow: 0 0 0 24px rgba(255, 255, 255, 0.18), 0 0 0 48px rgba(255, 255, 255, 0.12);
          pointer-events: none;
        }

        .illustration-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          position: relative;
          z-index: 1;
        }

        .dimension-number {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--color-brand-secondary, #137A71);
          text-transform: uppercase;
        }

        .dimension-progress {
          display: flex;
          gap: 4px;
        }

        .dimension-pip {
          height: 5px;
          width: 14px;
          border-radius: 3px;
          background-color: #D5E5DF;
          transition: background-color 0.2s ease;
        }

        .dimension-pip.done {
          background-color: var(--color-brand-secondary, #137A71);
        }

        .illustration-wrap {
          flex: 1;
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          padding: 1rem 0;
        }

        .illustration-wrap svg {
          width: 100%;
          max-width: 380px;
          height: auto;
          max-height: 250px;
          display: block;
        }

        .illustration-caption {
          border-top: 1px solid rgba(19, 122, 113, 0.15);
          padding-top: 1rem;
          position: relative;
          z-index: 1;
        }

        .caption-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--color-brand-primary, #173047);
          margin: 0 0 0.25rem 0;
          letter-spacing: -0.01em;
        }

        .caption-text {
          font-size: 0.82rem;
          line-height: 1.45;
          color: var(--color-text-secondary, #52677B);
          margin: 0;
        }

        .question-interactive-col {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .question-header {
          margin-bottom: 1.75rem;
        }

        .progress-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .btn-nav-back {
          background: none;
          border: none;
          color: var(--color-text-secondary, #64748B);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.35rem 0.5rem;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }

        .btn-nav-back:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .btn-nav-back:not(:disabled):hover {
          color: var(--color-brand-primary, #173047);
        }

        .step-counter {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
        }

        .btn-clear-all {
          background: none;
          border: none;
          color: #94A3B8;
          font-size: 0.8rem;
          cursor: pointer;
          padding: 0.35rem 0.5rem;
        }

        .btn-clear-all:hover {
          color: #64748B;
        }

        .progress-track {
          width: 100%;
          height: 4px;
          background-color: #E2E8F0;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background-color: var(--color-brand-secondary, #137A71);
          border-radius: 2px;
          transition: width 0.25s ease-out;
        }

        .pillar-label-strip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-brand-secondary, #137A71);
          margin-bottom: 0.75rem;
        }

        .pillar-icon-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background-color: #F0FDFA;
          color: var(--color-brand-secondary, #137A71);
        }

        .pillar-name-tag {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .question-title {
          font-family: var(--font-family-heading, system-ui, sans-serif);
          font-size: clamp(1.25rem, 2.5vw, 1.6rem);
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          line-height: 1.35;
          margin: 0 0 0.5rem 0;
        }

        .question-helper {
          font-size: 0.95rem;
          color: var(--color-text-secondary, #64748B);
          line-height: 1.55;
          margin: 0 0 1.5rem 0;
        }

        .validation-alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #FEF2F2;
          border: 1px solid #FECDD3;
          color: #9F1239;
          padding: 0.65rem 0.85rem;
          border-radius: 6px;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .alert-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: #9F1239;
          color: #FFFFFF;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .options-fieldset {
          border: none;
          padding: 0;
          margin: 0 0 2rem 0;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .option-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background-color: #FFFFFF;
          border: 1.5px solid var(--color-border-subtle, #E2E8F0);
          border-radius: 10px;
          cursor: pointer;
          transition: border-color 0.15s ease, background-color 0.15s ease;
          min-height: 52px;
        }

        .option-card:hover {
          border-color: #94A3B8;
          background-color: #F8FAFC;
        }

        .option-card.option-selected {
          border-color: var(--color-brand-secondary, #137A71);
          background-color: #F0FDFA;
          box-shadow: 0 0 0 1px var(--color-brand-secondary, #137A71);
        }

        .option-radio-input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .radio-visual {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1.5px solid #CBD5E1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background-color: #FFFFFF;
          transition: all 0.15s ease;
        }

        .option-selected .radio-visual {
          border-color: var(--color-brand-secondary, #137A71);
          background-color: var(--color-brand-secondary, #137A71);
          color: #FFFFFF;
        }

        .option-radio-input:focus-visible + .radio-visual {
          outline: 2px solid var(--awc-gold, #F2C65D);
          outline-offset: 2px;
        }

        .option-label {
          font-size: 0.95rem;
          color: var(--color-brand-primary, #173047);
          line-height: 1.45;
          font-weight: 500;
        }

        .option-selected .option-label {
          font-weight: 600;
          color: #0F172A;
        }

        .question-footer {
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid #F1F5F9;
          padding-top: 1.5rem;
        }

        .btn-continue {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--color-action, #137A71);
          color: #FFFFFF;
          font-size: 0.95rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          min-height: 44px;
          transition: background-color 0.15s ease;
        }

        .btn-continue:hover:not(:disabled) {
          background-color: var(--color-action-hover, #0F6B63);
        }

        .btn-continue:disabled {
          background-color: #E2E8F0;
          color: #94A3B8;
          cursor: not-allowed;
        }

        /* ------------------------------------------------------- */
        /* RESULTS DASHBOARD (Wide Responsive Concept C Layout)    */
        /* ------------------------------------------------------- */
        .health-results-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin: 1rem auto 0 auto;
          max-width: 1380px;
          width: 100%;
        }

        /* Compact Top Utilities */
        .results-top-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .action-group-right {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .btn-action-compact {
          border-radius: 6px;
          padding: 0.45rem 0.85rem;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .btn-action-back {
          background: #FFFFFF;
          border: 1px solid var(--color-border-subtle, #CBD5E1);
          color: var(--color-brand-primary, #173047);
        }

        .btn-action-back:hover {
          background-color: #F8FAFC;
          border-color: #94A3B8;
        }

        .btn-action-print {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #334155;
        }

        .btn-action-print:hover {
          background-color: #E2E8F0;
        }

        .btn-action-reset {
          background: none;
          border: 1px solid transparent;
          color: #64748B;
        }

        .btn-action-reset:hover {
          color: #0F172A;
          background-color: #F1F5F9;
        }

        /* Overall Score Executive Hero Card */
        .result-hero-card {
          background: linear-gradient(135deg, #173047 0%, #0F2233 100%);
          border: 1.5px solid rgba(242, 198, 93, 0.35);
          border-radius: var(--radius-xl, 1.25rem);
          padding: 2.5rem;
          box-shadow: 0 16px 40px rgba(15, 34, 51, 0.3);
          color: #FFFFFF;
        }

        .hero-badge-strip {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }

        .results-eyebrow {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #F2C65D;
          background: rgba(242, 198, 93, 0.12);
          border: 1px solid rgba(242, 198, 93, 0.35);
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          display: inline-block;
        }

        .results-chip-live {
          font-size: 0.75rem;
          font-weight: 700;
          color: #CFEFE3;
          letter-spacing: 0.04em;
        }

        .hero-title {
          font-family: var(--font-family-heading, system-ui, sans-serif);
          font-size: clamp(1.65rem, 3.2vw, 2.25rem);
          font-weight: 800;
          color: #FFFFFF;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 1rem;
          color: #CFEFE3;
          line-height: 1.6;
          margin: 0 0 1.75rem 0;
          max-width: 820px;
        }

        .hero-score-split {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 2.5rem;
          align-items: center;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }

        .score-gauge-box {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 18px;
          padding: 1.25rem 1.75rem;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .gauge-dial-wrap {
          position: relative;
          width: 130px;
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gauge-dial-svg {
          transform: rotate(-90deg);
          width: 100%;
          height: 100%;
        }

        .gauge-bg-ring {
          fill: none;
          stroke: rgba(255, 255, 255, 0.12);
          stroke-width: 10;
        }

        .gauge-fill-ring {
          fill: none;
          stroke-width: 10;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.8s ease;
        }

        .gauge-fill-ring.band-excellent,
        .gauge-fill-ring.band-good {
          stroke: #10B981;
        }

        .gauge-fill-ring.band-moderate {
          stroke: #F59E0B;
        }

        .gauge-fill-ring.band-needs_attention,
        .gauge-fill-ring.band-critical {
          stroke: #EF4444;
        }

        .gauge-dial-content {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .gauge-number {
          font-size: 2.75rem;
          font-weight: 900;
          color: #FFFFFF;
          line-height: 1;
        }

        .gauge-denom {
          font-size: 0.85rem;
          color: #F2C65D;
          font-weight: 700;
          margin-top: 2px;
        }

        .score-summary-details {
          max-width: 850px;
        }

        .band-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.88rem;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.16);
          color: #34D399;
          border: 1px solid rgba(16, 185, 129, 0.35);
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          margin-bottom: 0.75rem;
        }

        .badge-beacon {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #10B981;
          box-shadow: 0 0 10px #10B981;
        }

        .band-explanation {
          font-size: 1.05rem;
          color: #E5F0F2;
          line-height: 1.65;
          margin: 0 0 1.25rem 0;
        }

        .hero-metrics-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .metric-pill {
          font-size: 0.78rem;
          font-weight: 600;
          color: #CFEFE3;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.3rem 0.65rem;
          border-radius: 6px;
        }

        /* Two Concise Insight Panels */
        .strengths-vulnerabilities-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .insight-column-card {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border-subtle, #E2E8F0);
          border-radius: 14px;
          padding: 1.75rem;
          box-shadow: 0 4px 18px rgba(23, 48, 71, 0.05);
        }

        .card-strengths {
          border-top: 4px solid #10B981;
        }

        .card-vulnerabilities {
          border-top: 4px solid #F59E0B;
        }

        .column-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #F1F5F9;
        }

        .col-status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 0.85rem;
          font-weight: 800;
          flex-shrink: 0;
        }

        .indicator-strong {
          background-color: #DCFCE7;
          color: #15803D;
        }

        .indicator-attention {
          background-color: #FEF3C7;
          color: #B45309;
        }

        .col-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--color-brand-primary, #173047);
          margin: 0;
        }

        .col-sub {
          font-size: 0.82rem;
          color: #64748B;
        }

        .insight-bullets {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .insight-item {
          padding: 0.75rem 0.95rem;
          border-radius: 8px;
          font-size: 0.92rem;
          line-height: 1.55;
        }

        .insight-item-strength {
          background-color: #F0FDF4;
          border-left: 3.5px solid #10B981;
          color: #166534;
        }

        .insight-item-focus {
          background-color: #FFFBEB;
          border-left: 3.5px solid #F59E0B;
          color: #92400E;
        }

        .insight-area-name {
          font-weight: 800;
          color: var(--color-brand-primary, #173047);
        }

        .no-items-note {
          font-size: 0.88rem;
          color: #64748B;
          margin: 0;
          line-height: 1.5;
        }

        /* ------------------------------------------------------- */
        /* SEVEN-AREA BREAKDOWN: VISIBLE BY DEFAULT IN 3-COL GRID   */
        /* ------------------------------------------------------- */
        .pillars-breakdown-section {
          background-color: var(--color-bg-surface, #FFFFFF);
          border: 1px solid var(--color-border-subtle, #E2E8F0);
          border-radius: 14px;
          padding: 2rem 2.25rem;
          box-shadow: 0 4px 18px rgba(23, 48, 71, 0.05);
        }

        .breakdown-header-bar {
          margin-bottom: 1.5rem;
        }

        .breakdown-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #137A71;
          display: block;
          margin-bottom: 0.35rem;
        }

        .subhead-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-brand-primary, #173047);
          margin: 0 0 0.35rem 0;
          letter-spacing: -0.02em;
        }

        .subhead-caption {
          font-size: 0.9rem;
          color: #64748B;
          margin: 0;
        }

        .pillars-grid-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        .pillar-score-row {
          background-color: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          box-shadow: 0 3px 12px rgba(23, 48, 71, 0.04);
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .pillar-score-row:hover {
          border-color: #137A71;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(19, 122, 113, 0.12);
        }

        .pillar-row-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .pillar-title-wrap {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
        }

        .pillar-row-icon {
          color: #137A71;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #F0FDFA;
          flex-shrink: 0;
        }

        .pillar-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-brand-primary, #173047);
          display: block;
        }

        .pillar-benchmark-tag {
          font-size: 0.72rem;
          color: #64748B;
          font-weight: 600;
          display: block;
          margin-top: 2px;
        }

        .pillar-status-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-chip {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.2rem 0.55rem;
          border-radius: 4px;
        }

        .chip-strong {
          background-color: #DCFCE7;
          color: #15803D;
        }

        .chip-building {
          background-color: #FEF3C7;
          color: #B45309;
        }

        .chip-attention {
          background-color: #FEE2E2;
          color: #B91C1C;
        }

        .pillar-score-badge {
          font-size: 0.9rem;
          font-weight: 800;
          color: #173047;
        }

        .score-denom {
          color: #94A3B8;
          font-weight: 500;
          font-size: 0.78rem;
        }

        .pillar-score-bar-bg {
          width: 100%;
          height: 6px;
          background-color: #E2E8F0;
          border-radius: 3px;
          overflow: hidden;
        }

        .pillar-score-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .bar-strong { background-color: #10B981; }
        .bar-building { background-color: #F59E0B; }
        .bar-attention { background-color: #EF4444; }

        /* Accordion for detail within area */
        .pillar-detail-accordion {
          border-top: 1px solid #F1F5F9;
          padding-top: 0.5rem;
          margin-top: 0.25rem;
        }

        .pillar-detail-summary {
          font-size: 0.8rem;
          font-weight: 700;
          color: #137A71;
          cursor: pointer;
          user-select: none;
          outline: none;
          padding: 0.25rem 0.5rem;
          background: #F0FDFA;
          border-radius: 6px;
          display: inline-block;
          transition: background-color 0.15s ease;
        }

        .pillar-detail-summary:hover {
          background-color: #CCFBF1;
        }

        .pillar-detail-body {
          padding-top: 0.65rem;
          font-size: 0.85rem;
          color: #334155;
          line-height: 1.5;
        }

        .pillar-answer-summary {
          margin: 0 0 0.4rem 0;
          color: #173047;
          background: #F8FAFC;
          padding: 0.45rem 0.65rem;
          border-radius: 6px;
          border-left: 3px solid #137A71;
        }

        .pillar-explanation-text {
          margin: 0;
          color: #64748B;
        }

        .answer-muted {
          color: #64748B;
          font-weight: 700;
        }

        /* ------------------------------------------------------- */
        /* CONDENSED NEXT STEPS                                    */
        /* ------------------------------------------------------- */
        .recommendations-section {
          background-color: var(--color-bg-surface, #FFFFFF);
          border: 1px solid var(--color-border-subtle, #E2E8F0);
          border-radius: 14px;
          padding: 2rem 2.25rem;
          box-shadow: 0 4px 18px rgba(23, 48, 71, 0.05);
        }

        .rec-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #F59E0B;
          display: block;
          margin-bottom: 0.35rem;
        }

        .section-head {
          margin-bottom: 1.5rem;
        }

        .recommendations-condensed-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .rec-condensed-row {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          background-color: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 2px 10px rgba(23, 48, 71, 0.03);
          transition: border-color 0.15s ease, transform 0.15s ease;
        }

        .rec-condensed-row:hover {
          border-color: #137A71;
          transform: translateY(-1px);
        }

        .rec-step-index {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #137A71;
          color: #FFFFFF;
          font-size: 0.9rem;
          font-weight: 800;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .rec-content-wrap {
          flex: 1;
        }

        .rec-title-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
          margin-bottom: 0.35rem;
        }

        .rec-item-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--color-brand-primary, #173047);
          margin: 0;
        }

        .rec-action-text {
          font-size: 0.92rem;
          color: #334155;
          line-height: 1.55;
          margin: 0 0 0.65rem 0;
        }

        .rec-link-wrap {
          margin-top: 0.25rem;
        }

        .btn-tool-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.88rem;
          font-weight: 700;
          color: #0F766E;
          background: #F0FDFA;
          border: 1px solid #CCFBF1;
          padding: 0.4rem 0.85rem;
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .btn-tool-link:hover {
          background: #137A71;
          color: #FFFFFF;
          border-color: #137A71;
        }

        /* ------------------------------------------------------- */
        /* RESTRAINED SECONDARY ACTIONS (2-Card Choice)            */
        /* ------------------------------------------------------- */
        .secondary-actions-section {
          margin-top: 0.5rem;
        }

        .secondary-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .secondary-action-card {
          background-color: var(--color-bg-surface, #FFFFFF);
          border: 1px solid var(--color-border-subtle, #E2E8F0);
          border-radius: 14px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1.25rem;
          box-shadow: 0 4px 16px rgba(23, 48, 71, 0.04);
        }

        .secondary-action-tag {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #137A71;
          display: block;
          margin-bottom: 0.4rem;
        }

        .secondary-action-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--color-brand-primary, #173047);
          margin: 0 0 0.4rem 0;
        }

        .secondary-action-desc {
          font-size: 0.92rem;
          color: var(--color-text-secondary, #64748B);
          line-height: 1.55;
          margin: 0;
        }

        .secondary-action-btn-wrap {
          padding-top: 0.5rem;
        }

        .btn-secondary-choice {
          display: inline-flex;
          align-items: center;
          font-size: 0.92rem;
          font-weight: 700;
          color: #137A71;
          background: #F0FDFA;
          border: 1.5px solid #CCFBF1;
          padding: 0.65rem 1.25rem;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .btn-secondary-choice:hover {
          background: #137A71;
          color: #FFFFFF;
          border-color: #137A71;
        }

        /* ------------------------------------------------------- */
        /* RESPONSIVE MEDIA QUERIES                                */
        /* ------------------------------------------------------- */
        @media (max-width: 1024px) {
          .pillars-grid-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 860px) {
          .start-layout-grid {
            grid-template-columns: 1fr;
            gap: 1.75rem;
          }

          .start-art-col {
            order: -1;
            max-width: 280px;
            margin: 0 auto;
          }

          .question-layout-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }

          .question-visual-col {
            width: 100%;
          }

          .illustration-panel {
            min-height: 0;
            display: grid;
            grid-template-columns: 100px 1fr;
            grid-template-rows: auto 1fr;
            padding: 0.85rem 1rem;
            gap: 0.35rem 0.85rem;
            border-radius: 14px;
          }

          .illustration-meta {
            grid-column: 1 / -1;
            margin-bottom: 0.25rem;
          }

          .illustration-wrap {
            grid-column: 1;
            grid-row: 2;
            min-height: 75px;
            padding: 0;
            justify-content: center;
          }

          .illustration-wrap svg {
            max-height: 75px;
            width: auto;
            max-width: 100px;
          }

          .illustration-caption {
            grid-column: 2;
            grid-row: 2;
            align-self: center;
            border-top: none;
            border-left: 1px solid rgba(19, 122, 113, 0.16);
            padding-top: 0;
            padding-left: 0.85rem;
          }

          .caption-title {
            font-size: 0.95rem;
            margin-bottom: 0.2rem;
          }

          .caption-text {
            font-size: 0.75rem;
            line-height: 1.35;
          }
        }

        @media (max-width: 640px) {
          .health-start-card,
          .health-questionnaire-card,
          .result-hero-card,
          .pillars-breakdown-section,
          .recommendations-section,
          .secondary-action-card {
            padding: 1.25rem;
          }

          .hero-score-split {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }

          .score-gauge-box {
            justify-content: center;
            padding: 1rem;
          }

          .strengths-vulnerabilities-grid,
          .secondary-actions-grid {
            grid-template-columns: 1fr;
          }

          .pillars-grid-container {
            grid-template-columns: 1fr;
          }

          .btn-start,
          .btn-continue {
            width: 100%;
            justify-content: center;
          }

          .results-top-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .action-group-right {
            justify-content: space-between;
          }

          .question-illustration-box {
            padding: 0.5rem 0.75rem;
            gap: 0.85rem;
          }

          .question-illustration-box svg {
            max-height: 70px;
            max-width: 100px;
          }

          .visual-caption-area {
            font-size: 0.88rem;
          }

          .visual-caption-sub {
            font-size: 0.72rem;
          }
        }

        /* ------------------------------------------------------- */
        /* PRINT STYLES                                            */
        /* ------------------------------------------------------- */
        @media print {
          .no-print {
            display: none !important;
          }

          .health-app-container,
          .health-results-wrapper {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .pillars-grid-container {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
          }

          .pillar-detail-accordion {
            display: block !important;
          }

          .pillar-detail-summary {
            display: none !important;
          }

          .pillar-detail-body {
            display: block !important;
          }

          .result-hero-card,
          .insight-column-card,
          .pillar-score-row,
          .rec-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
            border: 1px solid #CBD5E1 !important;
          }
        }
      `}</style>
    </div>
  );
}
