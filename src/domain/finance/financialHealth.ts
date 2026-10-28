/**
 * Ant Wealth Creation — 7-Pillar Family Financial Health Check Engine
 *
 * ARCHITECTURAL CONTRACT:
 * 1. 100% PURE TypeScript calculation logic only.
 * 2. Absolutely NO React, Astro, DOM, window, network, or storage dependencies.
 * 3. Evaluates personal and family financial wellness across 7 weighted foundational pillars totaling 100%.
 * 4. Strictly product-neutral: does not recommend specific funds, insurers, or lenders.
 * 5. Respects project boundaries: GATE-A (Retirement distribution) and GATE-C (Tax) remain blocked.
 */

import { FinanceValidationError } from './errors';

export type HealthPillar =
  | 'cashFlow'
  | 'emergencyFund'
  | 'debt'
  | 'protection'
  | 'investments'
  | 'goals'
  | 'retirement';

export type PillarStatus = 'strong' | 'building' | 'attention';

export interface HealthCheckOption {
  id: string;
  label: string;
  score: number; // 20 to 100
}

export interface HealthPillarConfig {
  id: HealthPillar;
  title: string;
  shortTitle: string;
  question: string;
  helperText: string;
  weight: number; // Decimal (sums to 1.00)
  weightPercent: number; // Percentage (e.g. 15)
  options: HealthCheckOption[];
}

export interface PillarScoreResult {
  pillar: HealthPillar;
  title: string;
  shortTitle: string;
  score: number;
  weight: number;
  weightPercent: number;
  weightedScore: number;
  status: PillarStatus;
  statusLabel: string;
  statusColor: string;
  icon: string;
  selectedOptionId: string;
  selectedOptionLabel: string;
}

export interface HealthRecommendation {
  pillar: HealthPillar;
  priority: number;
  title: string;
  description: string;
  action: string;
  route?: string;
  routeLabel?: string;
}

export interface PillarInsight {
  pillar: HealthPillar;
  title: string;
  score: number;
  text: string;
}

export interface HealthScoreBand {
  min: number;
  max: number;
  title: string;
  badgeColor: string;
  shortExplanation: string;
}

export interface HealthAnswersValidation {
  isValid: boolean;
  errors: string[];
  missingPillars: HealthPillar[];
  invalidPillars: string[];
  invalidOptions: Array<{ pillar: string; optionId: string }>;
}

export interface HealthCheckResult {
  overallScore: number; // 0 to 100 rounded to nearest whole number for presentation
  unroundedOverallScore: number; // Exact internal unrounded score
  band: HealthScoreBand;
  ratingTitle: string;
  ratingDescription: string;
  pillarScores: PillarScoreResult[];
  strengths: PillarInsight[]; // Top qualifying strengths (capped at 2)
  allStrengths: PillarInsight[]; // All pillars scoring >= 80
  areasNeedingAttention: PillarInsight[]; // Top vulnerabilities (capped at 2)
  areasToStrengthen: PillarInsight[]; // Pillars scoring 50-79
  priorityAreas: PillarInsight[]; // Pillars scoring < 50
  recommendations: HealthRecommendation[]; // Max 3 prioritized actionable steps
  nextSteps: string[]; // Convenience string actions
}

// ----------------------------------------------------
// 7 Pillars Configuration & Auditable Scoring Rubric
// ----------------------------------------------------
export const HEALTH_PILLARS: readonly HealthPillarConfig[] = [
  {
    id: 'cashFlow',
    title: 'Cash Flow & Saving',
    shortTitle: 'Cash Flow',
    question: 'After your regular household expenses, how consistently do you have money left to save or invest?',
    helperText: 'Your ideal saving level depends on your income, responsibilities, and financial goals. The foundational first step is maintaining a sustainable monthly surplus.',
    weight: 0.15,
    weightPercent: 15,
    options: [
      { id: 'cf_1', label: 'Little or nothing is left most months.', score: 20 },
      { id: 'cf_2', label: 'Usually less than 10% of my income is left.', score: 45 },
      { id: 'cf_3', label: 'Usually around 10–20% is left.', score: 80 },
      { id: 'cf_4', label: 'More than 20% is consistently left.', score: 100 },
    ],
  },
  {
    id: 'emergencyFund',
    title: 'Emergency Reserve',
    shortTitle: 'Emergency Reserve',
    question: 'If your income stopped unexpectedly, how long could your readily available emergency savings cover essential living expenses?',
    helperText: 'The right emergency reserve depends on income stability, dependants, health needs, debt, and household responsibilities.',
    weight: 0.15,
    weightPercent: 15,
    options: [
      { id: 'ef_1', label: 'Less than 1 month', score: 20 },
      { id: 'ef_2', label: '1–3 months', score: 50 },
      { id: 'ef_3', label: '3–6 months', score: 85 },
      { id: 'ef_4', label: 'More than 6 months', score: 100 },
    ],
  },
  {
    id: 'debt',
    title: 'Debt Management',
    shortTitle: 'Debt Management',
    question: 'How comfortable are your current loan and debt repayments?',
    helperText: 'Debt health depends on both the size and cost of borrowing. High-cost revolving debt deserves attention even when the EMI appears manageable.',
    weight: 0.15,
    weightPercent: 15,
    options: [
      { id: 'db_1', label: 'High-cost debt or repayments regularly put pressure on my budget.', score: 20 },
      { id: 'db_2', label: 'I have significant EMIs, but they are currently manageable.', score: 50 },
      { id: 'db_3', label: 'My repayments are manageable and I have no high-cost revolving debt.', score: 85 },
      { id: 'db_4', label: 'I have very little manageable debt and strong repayment flexibility.', score: 100 },
    ],
  },
  {
    id: 'protection',
    title: 'Health & Life Protection',
    shortTitle: 'Protection',
    question: 'How well is your family protected against major health costs and loss of breadwinner income?',
    helperText: 'Protection needs vary with dependants, income, liabilities, existing assets, and family responsibilities. A simple income multiple cannot determine the right cover for everyone.',
    weight: 0.15,
    weightPercent: 15,
    options: [
      { id: 'pr_1', label: 'I mainly depend on employer cover or have little personal protection.', score: 20 },
      { id: 'pr_2', label: 'I have some protection, but I am unsure whether it is enough.', score: 50 },
      { id: 'pr_3', label: 'I have personal health protection and life protection where my family depends on my income.', score: 80 },
      { id: 'pr_4', label: "I have reviewed my health and life protection against my family's needs, liabilities and important goals.", score: 100 },
    ],
  },
  {
    id: 'investments',
    title: 'Investing & Time Horizons',
    shortTitle: 'Investing',
    question: 'How well do your savings and investments match your goals, time horizons, and risk tolerance?',
    helperText: 'Prudent investing is not about choosing one specific product. It is about matching money to your goals, time horizon, liquidity needs, and ability to handle volatility.',
    weight: 0.15,
    weightPercent: 15,
    options: [
      { id: 'inv_1', label: 'Most of my money is saved without a clear long-term plan.', score: 30 },
      { id: 'inv_2', label: 'I invest or save irregularly, but it is not clearly linked to my goals.', score: 55 },
      { id: 'inv_3', label: 'I invest regularly and broadly match my investments to my goals and time horizons.', score: 85 },
      { id: 'inv_4', label: 'I have a diversified approach that is reviewed as my goals, time horizons or circumstances change.', score: 100 },
    ],
  },
  {
    id: 'goals',
    title: 'Goal Clarity',
    shortTitle: 'Goal Clarity',
    question: 'How clearly have you identified your important financial goals and what they may require?',
    helperText: 'Clear milestone goals help you decide how much to save, when you need the capital, and how much investment risk may be appropriate.',
    weight: 0.10,
    weightPercent: 10,
    options: [
      { id: 'gl_1', label: 'My important goals are mostly informal or unplanned.', score: 25 },
      { id: 'gl_2', label: 'I know my major goals and have approximate timelines.', score: 55 },
      { id: 'gl_3', label: 'I have estimated costs, timelines and a savings or investment approach for my important goals.', score: 85 },
      { id: 'gl_4', label: 'I regularly review my goal progress and adjust my plan when circumstances change.', score: 100 },
    ],
  },
  {
    id: 'retirement',
    title: 'Retirement Awareness',
    shortTitle: 'Retirement',
    question: 'How clearly have you planned for the income and expenses you may need after you stop working?',
    helperText: 'Retirement planning should consider future living costs, inflation, expected income, longevity, and the time available to accumulate resources.',
    weight: 0.15,
    weightPercent: 15,
    options: [
      { id: 'rt_1', label: 'I have not estimated what I may need for retirement.', score: 20 },
      { id: 'rt_2', label: 'I save for retirement, but I have not estimated my future needs clearly.', score: 50 },
      { id: 'rt_3', label: 'I have estimated my future needs and regularly save towards them.', score: 85 },
      { id: 'rt_4', label: 'My retirement plan considers inflation, future income needs and is reviewed as circumstances change.', score: 100 },
    ],
  },
] as const;

// ----------------------------------------------------
// Canonical Score Communication Bands
// Verified from legacy implementation and tests
// ----------------------------------------------------
export const SCORE_BANDS: readonly HealthScoreBand[] = [
  {
    min: 80,
    max: 100,
    title: 'Strong Foundation',
    badgeColor: '#00AB96', // Growth Teal
    shortExplanation: 'Your answers show a strong financial foundation across core areas, with disciplined habits supporting your long-term plans.',
  },
  {
    min: 65,
    max: 79,
    title: 'Generally Healthy',
    badgeColor: '#2563EB', // Royal Blue
    shortExplanation: 'Your answers show a reasonable financial foundation, with a few areas that could be strengthened.',
  },
  {
    min: 50,
    max: 64,
    title: 'Needs Strengthening',
    badgeColor: '#D97706', // Warm Amber
    shortExplanation: 'You have initiated several positive financial steps, but key areas would benefit from clearer planning and resilience.',
  },
  {
    min: 0,
    max: 49,
    title: 'Priority Areas Identified',
    badgeColor: '#E11D48', // Coral Red
    shortExplanation: 'Your current setup has important vulnerabilities. Addressing key foundational areas first will significantly improve your financial stability.',
  },
] as const;

// ----------------------------------------------------
// Pure Helper Functions
// ----------------------------------------------------

export function getPillarStatus(score: number): PillarStatus {
  if (score >= 80) return 'strong';
  if (score >= 50) return 'building';
  return 'attention';
}

export function getPillarStatusLabel(status: PillarStatus): string {
  switch (status) {
    case 'strong':
      return 'Strong';
    case 'building':
      return 'Building';
    case 'attention':
      return 'Needs Attention';
  }
}

export function getPillarStatusColor(status: PillarStatus): string {
  switch (status) {
    case 'strong':
      return '#00AB96'; // Growth Teal
    case 'building':
      return '#2563EB'; // Royal Blue
    case 'attention':
      return '#E11D48'; // Coral Red
  }
}

export function getPillarStatusIcon(status: PillarStatus): string {
  switch (status) {
    case 'strong':
      return '✓';
    case 'building':
      return '↗';
    case 'attention':
      return '!';
  }
}

export function getOverallScoreBand(score: number): HealthScoreBand {
  const rounded = Math.round(score);
  for (const band of SCORE_BANDS) {
    if (rounded >= band.min && rounded <= band.max) {
      return band;
    }
  }
  return SCORE_BANDS[SCORE_BANDS.length - 1];
}

// Educational Insights
const STRENGTH_TEXTS: Record<HealthPillar, string> = {
  cashFlow: 'Consistent monthly surplus supporting your financial goals and long-term security.',
  emergencyFund: 'Good emergency reserve covering 3 or more months of essential living expenses.',
  debt: 'Manageable debt with no high-cost revolving borrowing constraining cash flow.',
  protection: 'Personal health and life protection aligned with family responsibilities and dependants.',
  investments: 'Disciplined investment approach matched to time horizons and risk tolerance.',
  goals: 'Clear milestone timelines and estimated costs guiding your planning and resource allocation.',
  retirement: 'Proactive retirement strategy factoring in future living costs and inflation.',
};

const STRENGTHEN_TEXTS: Record<HealthPillar, string> = {
  cashFlow: 'Your monthly surplus is modest; tracking discretionary spending can help build a more consistent saving buffer.',
  emergencyFund: 'Your emergency savings cover 1–3 months; expanding this buffer will enhance resilience against unexpected shocks.',
  debt: 'Your loan repayments are currently manageable, but reviewing repayment structures can free up cash flow.',
  protection: "You have some coverage, but reviewing health and term protection against your family's liabilities can prevent gaps.",
  investments: 'Your investing approach may benefit from clearer links to goals and time horizons.',
  goals: 'You have identified major goals, but estimating future costs and timelines will improve clarity.',
  retirement: 'Your retirement planning could benefit from a clearer estimate of future needs.',
};

const PRIORITY_TEXTS: Record<HealthPillar, string> = {
  cashFlow: 'Little or no surplus is left most months, which limits your ability to absorb sudden expenses or build savings.',
  emergencyFund: 'Your current emergency savings may provide limited protection against an unexpected income interruption.',
  debt: 'High-cost debt or repayments regularly put pressure on your monthly budget.',
  protection: 'Limited personal health or life protection leaves your family vulnerable to medical or income emergencies.',
  investments: 'Savings are mostly unlinked to a long-term plan, which may affect real wealth preservation against inflation.',
  goals: 'Goals remain informal or unplanned, which creates risk of withdrawing from long-term funds for short-term needs.',
  retirement: 'Retirement needs remain unestimated, leaving future living costs and income security unaddressed.',
};

const PILLAR_RECOMMENDATIONS: Record<
  HealthPillar,
  { title: string; description: string; action: string; route?: string; routeLabel?: string }
> = {
  debt: {
    title: 'Review & Optimize Debt',
    description: 'High-cost or repayment-heavy debt constrains cash flow and compromises long-term growth.',
    action: 'Review your outstanding loans and identify any high-cost or repayment-heavy debt that should be addressed first.',
    route: '/tools/loan-sip-recovery/',
    routeLabel: 'Explore Loan & Repayment Tools',
  },
  emergencyFund: {
    title: 'Build Emergency Reserve',
    description: 'A dedicated liquid cushion protects long-term assets from sudden life shocks.',
    action: 'Estimate your essential monthly expenses and build an emergency reserve that reflects your income stability and family responsibilities.',
    route: '/tools/personal-finance-statement/',
    routeLabel: 'Map Cash Flow & Reserves',
  },
  protection: {
    title: 'Evaluate Protection Needs',
    description: 'Adequate life and health protection safeguards your family against major income loss or medical costs.',
    action: 'Review your personal health and life protection against dependants, liabilities, income, and important family responsibilities.',
    route: '/tools/life-insurance/',
    routeLabel: 'Explore Protection Analysis Tool',
  },
  cashFlow: {
    title: 'Track Income & Cash Flow',
    description: 'A consistent monthly surplus is the primary foundation for all compounding and goal progress.',
    action: 'Track your income and essential expenses for one month and identify a realistic amount you can consistently save or invest.',
    route: '/tools/personal-finance-statement/',
    routeLabel: 'Create Personal Finance Statement',
  },
  goals: {
    title: 'Define Important Goals',
    description: 'Explicit milestone timelines and costs prevent premature liquidation of investments.',
    action: 'List your three most important financial goals, their target dates and approximate future costs.',
    route: '/plan/',
    routeLabel: 'Explore Goal Planner',
  },
  retirement: {
    title: 'Estimate Retirement Needs',
    description: 'Factoring in inflation and longevity early allows compounding to do the heavy lifting.',
    action: 'Estimate your future retirement spending and income needs, then check whether your current savings plan is keeping pace.',
    route: '/plan/retirement/',
    routeLabel: 'Explore Retirement Specification',
  },
  investments: {
    title: 'Align Investments to Horizons',
    description: 'Structuring assets by time horizon and risk tolerance protects purchasing power against inflation.',
    action: 'Review whether your investments match your goals, time horizons, liquidity needs, and risk level.',
    route: '/tools/',
    routeLabel: 'Explore Planning Calculators',
  },
};

const MAINTENANCE_RECOMMENDATIONS: readonly HealthRecommendation[] = [
  {
    pillar: 'investments',
    priority: 98,
    title: 'Annual Asset Allocation Review',
    description: 'Periodically rebalancing your portfolio maintains risk alignment as life milestones approach.',
    action: 'Review your asset allocation annually to ensure it matches your changing life milestones, liquidity needs, and risk level.',
    route: '/tools/',
    routeLabel: 'Explore Investment Tools',
  },
  {
    pillar: 'goals',
    priority: 99,
    title: 'Periodic Health Checkup',
    description: 'Regular reviews ensure your financial roadmap adapts to changing family circumstances.',
    action: 'Revisit this financial health assessment annually or whenever major life events, responsibilities, or income change.',
    route: '/health-check/',
    routeLabel: 'Retake Health Check',
  },
] as const;

// ----------------------------------------------------
// Validation Logic
// ----------------------------------------------------

export function validateHealthCheckAnswers(
  answers: Record<string, string>
): HealthAnswersValidation {
  const errors: string[] = [];
  const missingPillars: HealthPillar[] = [];
  const invalidPillars: string[] = [];
  const invalidOptions: Array<{ pillar: string; optionId: string }> = [];

  const pillarMap = new Map<string, HealthPillarConfig>();
  for (const p of HEALTH_PILLARS) {
    pillarMap.set(p.id, p);
  }

  // Unknown pillar IDs
  for (const key of Object.keys(answers)) {
    if (!pillarMap.has(key)) {
      invalidPillars.push(key);
      errors.push(`Unknown pillar ID: "${key}"`);
    }
  }

  // Completeness and valid option IDs
  for (const pillar of HEALTH_PILLARS) {
    const selectedOptionId = answers[pillar.id];
    if (!selectedOptionId || typeof selectedOptionId !== 'string' || selectedOptionId.trim() === '') {
      missingPillars.push(pillar.id);
      errors.push(`Missing answer for required pillar: "${pillar.title}" (${pillar.id})`);
    } else {
      const validOption = pillar.options.some((o) => o.id === selectedOptionId);
      if (!validOption) {
        invalidOptions.push({ pillar: pillar.id, optionId: selectedOptionId });
        errors.push(`Invalid option ID "${selectedOptionId}" for pillar "${pillar.id}"`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingPillars,
    invalidPillars,
    invalidOptions,
  };
}

// ----------------------------------------------------
// Recommendation Ordering (Foundational Hierarchy)
// ----------------------------------------------------

export function getRecommendedNextSteps(
  pillarScores: PillarScoreResult[]
): HealthRecommendation[] {
  const scoreMap = new Map<HealthPillar, number>();
  for (const p of pillarScores) {
    scoreMap.set(p.pillar, p.score);
  }

  type Candidate = { pillar: HealthPillar; rank: number };
  const candidates: Candidate[] = [];

  const debtScore = scoreMap.get('debt') ?? 100;
  const efScore = scoreMap.get('emergencyFund') ?? 100;
  const protScore = scoreMap.get('protection') ?? 100;
  const cfScore = scoreMap.get('cashFlow') ?? 100;
  const goalsScore = scoreMap.get('goals') ?? 100;
  const retScore = scoreMap.get('retirement') ?? 100;
  const invScore = scoreMap.get('investments') ?? 100;

  // Severe Foundation Gaps (Score < 50)
  if (debtScore < 50) candidates.push({ pillar: 'debt', rank: 10 });
  if (efScore < 50) candidates.push({ pillar: 'emergencyFund', rank: 20 });
  if (protScore < 50) candidates.push({ pillar: 'protection', rank: 30 });
  if (cfScore < 50) candidates.push({ pillar: 'cashFlow', rank: 40 });

  // Moderate Cash Flow / Debt / Safety Gaps (50 <= Score < 80)
  if (cfScore >= 50 && cfScore < 80) candidates.push({ pillar: 'cashFlow', rank: 50 });
  if (debtScore >= 50 && debtScore < 80) candidates.push({ pillar: 'debt', rank: 60 });
  if (efScore >= 50 && efScore < 80) candidates.push({ pillar: 'emergencyFund', rank: 70 });
  if (protScore >= 50 && protScore < 80) candidates.push({ pillar: 'protection', rank: 80 });

  // Planning & Growth Gaps (Score < 80)
  if (goalsScore < 80) candidates.push({ pillar: 'goals', rank: 90 });
  if (retScore < 80) candidates.push({ pillar: 'retirement', rank: 100 });
  if (invScore < 80) candidates.push({ pillar: 'investments', rank: 110 });

  // Sort candidates by dependency rank
  candidates.sort((a, b) => a.rank - b.rank);

  const selectedRecommendations: HealthRecommendation[] = [];
  const seenPillars = new Set<HealthPillar>();

  for (const c of candidates) {
    if (selectedRecommendations.length >= 3) break;
    if (!seenPillars.has(c.pillar)) {
      seenPillars.add(c.pillar);
      const rec = PILLAR_RECOMMENDATIONS[c.pillar];
      selectedRecommendations.push({
        pillar: c.pillar,
        priority: selectedRecommendations.length + 1,
        title: rec.title,
        description: rec.description,
        action: rec.action,
        route: rec.route,
        routeLabel: rec.routeLabel,
      });
    }
  }

  // If fewer than 3 gaps, add proactive maintenance recommendations
  if (selectedRecommendations.length < 3) {
    for (const m of MAINTENANCE_RECOMMENDATIONS) {
      if (selectedRecommendations.length >= 3) break;
      if (!seenPillars.has(m.pillar)) {
        seenPillars.add(m.pillar);
        selectedRecommendations.push({
          ...m,
          priority: selectedRecommendations.length + 1,
        });
      }
    }
  }

  return selectedRecommendations.slice(0, 3);
}

// ----------------------------------------------------
// Strengths & Vulnerabilities Sorters
// ----------------------------------------------------

export function getStrengths(pillarScores: PillarScoreResult[]): PillarInsight[] {
  return pillarScores
    .filter((p) => p.score >= 80)
    .sort((a, b) => b.score - a.score)
    .map((p) => ({
      pillar: p.pillar,
      title: p.title,
      score: p.score,
      text: STRENGTH_TEXTS[p.pillar],
    }));
}

export function getAreasToStrengthen(pillarScores: PillarScoreResult[]): PillarInsight[] {
  return pillarScores
    .filter((p) => p.score >= 50 && p.score < 80)
    .map((p) => ({
      pillar: p.pillar,
      title: p.title,
      score: p.score,
      text: STRENGTHEN_TEXTS[p.pillar],
    }));
}

export function getPriorityAreas(pillarScores: PillarScoreResult[]): PillarInsight[] {
  return pillarScores
    .filter((p) => p.score < 50)
    .map((p) => ({
      pillar: p.pillar,
      title: p.title,
      score: p.score,
      text: PRIORITY_TEXTS[p.pillar],
    }));
}

export function getAreasNeedingAttention(pillarScores: PillarScoreResult[]): PillarInsight[] {
  return pillarScores
    .filter((p) => p.score < 80)
    .sort((a, b) => a.score - b.score)
    .map((p) => ({
      pillar: p.pillar,
      title: p.title,
      score: p.score,
      text: p.score < 50 ? PRIORITY_TEXTS[p.pillar] : STRENGTHEN_TEXTS[p.pillar],
    }));
}

// ----------------------------------------------------
// Main Pure Financial Domain Engine
// ----------------------------------------------------

export function calculateFinancialHealth(
  answers: Record<string, string>
): HealthCheckResult {
  const validation = validateHealthCheckAnswers(answers);
  if (!validation.isValid) {
    throw new FinanceValidationError('answers', answers, validation.errors.join('; '));
  }

  let unroundedOverallScore = 0;
  const pillarScores: PillarScoreResult[] = [];

  for (const config of HEALTH_PILLARS) {
    const selectedOptionId = answers[config.id];
    const selectedOption = config.options.find((o) => o.id === selectedOptionId)!;
    const score = selectedOption.score;
    const weight = config.weight;
    const weightedScore = score * weight;

    unroundedOverallScore += weightedScore;

    const status = getPillarStatus(score);
    pillarScores.push({
      pillar: config.id,
      title: config.title,
      shortTitle: config.shortTitle,
      score,
      weight,
      weightPercent: config.weightPercent,
      weightedScore,
      status,
      statusLabel: getPillarStatusLabel(status),
      statusColor: getPillarStatusColor(status),
      icon: getPillarStatusIcon(status),
      selectedOptionId,
      selectedOptionLabel: selectedOption.label,
    });
  }

  // Overall score: rounded to nearest whole number for presentation, clamped to [0, 100]
  const overallScore = Math.min(100, Math.max(0, Math.round(unroundedOverallScore)));
  const band = getOverallScoreBand(overallScore);

  const allStrengths = getStrengths(pillarScores);
  const strengths = allStrengths.slice(0, 2); // Max 2 highlighted strengths

  const allAreasNeedingAttention = getAreasNeedingAttention(pillarScores);
  const areasNeedingAttention = allAreasNeedingAttention.slice(0, 2); // Max 2 highlighted vulnerabilities

  const areasToStrengthen = getAreasToStrengthen(pillarScores);
  const priorityAreas = getPriorityAreas(pillarScores);
  const recommendations = getRecommendedNextSteps(pillarScores);

  return {
    overallScore,
    unroundedOverallScore,
    band,
    ratingTitle: band.title,
    ratingDescription: band.shortExplanation,
    pillarScores,
    strengths,
    allStrengths,
    areasNeedingAttention,
    areasToStrengthen,
    priorityAreas,
    recommendations,
    nextSteps: recommendations.map((r) => r.action),
  };
}
