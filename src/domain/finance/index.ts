/**
 * Ant Wealth Creation — Financial Domain Engine (Phase 6 Implementation)
 *
 * ARCHITECTURAL CONTRACT:
 * 1. This folder contains 100% PURE TypeScript calculation logic only.
 * 2. Absolutely NO React, Astro, DOM, window, network, or localStorage imports are allowed here.
 * 3. All modules are tested with independent mathematical verification test vectors.
 * 4. UI presentation formatting (currency formatting, roundings) is strictly isolated from engines.
 *
 * ACTIVE ENGINES:
 * - investmentRates: Effective annual return to monthly compounding conversion
 * - sip: Fixed and annual step-up SIP wealth accumulation (beginning-of-month annuity-due)
 * - lumpsum: Effective annual lump-sum compound growth
 * - targetCorpus: Required monthly SIP solver for target future corpus
 * - goalPlanner: Inflation-adjusted goal planning with existing savings offset
 * - netWorth: REAL statement balance sheet aggregation and solvency metrics
 * - homeLoanAmortization: Reducing-balance loan amortization with prepayment scenarios
 *
 * SCOPE GATES STATUS:
 * - GATE-A (Retirement accumulation / three-bucket distribution): DEFERRED / SCOPE BLOCKED.
 * - GATE-C (Income tax haircuts / deductions / slab logic): DEFERRED / SCOPE BLOCKED.
 * - Loan vs Invest crossover / Tax comparisons: DEFERRED / SCOPE BLOCKED.
 * - Loan + SIP recovery crossover: DEFERRED / SCOPE BLOCKED.
 * - SWP depletion & longevity: DEFERRED / SCOPE BLOCKED.
 * - Life insurance HLV: DEFERRED / SCOPE BLOCKED.
 * - Seven-Pillar scoring / health score: DEFERRED / SCOPE BLOCKED.
 */

export const FINANCE_DOMAIN_VERSION = '1.0.0-phase6';

// Errors & Validation
export * from './errors';

// Pure Financial Engines
export * from './investmentRates';
export * from './sip';
export * from './lumpsum';
export * from './targetCorpus';
export * from './goalPlanner';
export * from './netWorth';
export * from './homeLoanAmortization';
