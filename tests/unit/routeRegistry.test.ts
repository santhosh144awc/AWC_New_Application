import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  TOP_NAV_ROUTES,
  GOAL_ROUTES,
  TOOL_ROUTES,
  DIAGNOSTIC_ROUTES,
  getAllRegisteredRoutes,
} from '../../src/config/routes';

describe('Phase 18.2 — Route Registry, Status Badge & Truthfulness Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const canonicalCrosswalkPath = path.join(rootDir, 'product-docs/finance/CURRENT_INCOME_TAX_LAW_CROSSWALK.csv');

  it('1. All canonical routes maintain stable IDs and valid trailing-slash paths', () => {
    expect(TOP_NAV_ROUTES.length).toBe(6);
    const allRoutes = getAllRegisteredRoutes();
    expect(allRoutes.length).toBe(25);

    for (const route of allRoutes) {
      expect(route.id).toBeTruthy();
      expect(route.path.startsWith('/')).toBe(true);
      expect(route.path.endsWith('/')).toBe(true);
      expect(route.label.trim().length).toBeGreaterThan(0);
      expect(route.description.trim().length).toBeGreaterThan(0);
    }
  });

  describe('2. Truthful Status Badges for Interactive Planners & Calculators', () => {
    const activeRouteIds = [
      'goal-children',
      'goal-home',
      'tool-sip',
      'tool-lumpsum',
      'tool-sip-growth',
      'tool-home-foreclosure',
      'tool-life-insurance',
      'tool-net-worth',
      'diag-real-statement',
    ];

    it('active routes are never labeled as development shells or pending review', () => {
      const allRoutes = getAllRegisteredRoutes();
      for (const id of activeRouteIds) {
        const route = allRoutes.find(r => r.id === id);
        expect(route, `Route ${id} must exist`).toBeDefined();
        const badge = route?.statusBadge || '';
        expect(badge).not.toMatch(/Shell Active/i);
        expect(badge).not.toMatch(/Math In Development/i);
        expect(badge).not.toMatch(/HLV Engine Review/i);
        expect(badge).not.toMatch(/Zero Storage in Shell/i);
      }
    });

    it('life insurance planner is documented as a 4-step wizard, not 5-step', () => {
      const lifeTool = TOOL_ROUTES.find(r => r.id === 'tool-life-insurance');
      expect(lifeTool).toBeDefined();
      expect(lifeTool?.description).toContain('4-step');
      expect(lifeTool?.description).not.toContain('5-step');
      expect(lifeTool?.statusBadge).toContain('Interactive Planner Active');
    });

    it('home-purchase planner explicitly qualifies that tax relief is excluded and avoids safe EMI / fixed buffer claims', () => {
      const homeGoal = GOAL_ROUTES.find(r => r.id === 'goal-home');
      expect(homeGoal).toBeDefined();
      expect(homeGoal?.statusBadge).toContain('Interactive Planner Active');
      expect(homeGoal?.statusBadge).toContain('Tax Relief Excluded');
      expect(homeGoal?.description).not.toMatch(/safe EMI/i);
      expect(homeGoal?.description).not.toMatch(/10% acquisition buffer/i);
      expect(homeGoal?.description).toContain('Estimate upfront purchase funds');
    });

    it('children future planner is identified as an active multi-goal interactive planner', () => {
      const childrenGoal = GOAL_ROUTES.find(r => r.id === 'goal-children');
      expect(childrenGoal).toBeDefined();
      expect(childrenGoal?.statusBadge).toContain('Interactive Planner Active');
    });

    it('net worth and REAL statement are identified as active interactive diagnostics', () => {
      const netWorthTool = TOOL_ROUTES.find(r => r.id === 'tool-net-worth');
      const realStmtDiag = DIAGNOSTIC_ROUTES.find(r => r.id === 'diag-real-statement');

      expect(netWorthTool?.statusBadge).toContain('Interactive');
      expect(realStmtDiag?.statusBadge).toContain('Interactive');
    });
  });

  describe('3. Active Retirement and SWP Routes Truthfulness', () => {
    it('retirement accumulation, income, and SWP are visibly marked as active interactive tools', () => {
      const retireAccum = GOAL_ROUTES.find(r => r.id === 'goal-retirement');
      const retireIncome = GOAL_ROUTES.find(r => r.id === 'goal-retirement-income');
      const swpTool = TOOL_ROUTES.find(r => r.id === 'tool-swp');

      expect(retireAccum?.statusBadge).toContain('Interactive Planner Active');
      expect(retireIncome?.statusBadge).toContain('Interactive Planner Active');
      expect(swpTool?.statusBadge).toContain('Interactive Calculator Active');
    });
  });

  describe('4. Non-Guaranteed Copy & Scenario-Based Language for Loan Tools', () => {
    it('loan interest recovery SIP contains zero guarantee of 100% interest recovery', () => {
      const loanRecovery = TOOL_ROUTES.find(r => r.id === 'tool-loan-recovery');
      expect(loanRecovery).toBeDefined();
      expect(loanRecovery?.description).not.toMatch(/recover 100%/i);
      expect(loanRecovery?.description).not.toMatch(/guarantee/i);
      expect(loanRecovery?.description).toMatch(/illustrative|scenarios|assumed/i);
      expect(loanRecovery?.statusBadge).toContain('Interactive Calculator Active');
    });

    it('loan vs invest trade-off is marked as an active interactive calculator', () => {
      const loanVsInvest = TOOL_ROUTES.find(r => r.id === 'tool-loan-vs-invest');
      expect(loanVsInvest).toBeDefined();
      expect(loanVsInvest?.statusBadge).toContain('Interactive Calculator Active');
    });
  });

  describe('5. Canonical Tax-Law Crosswalk File Resolution', () => {
    it('canonical tax crosswalk exists at product-docs/finance/CURRENT_INCOME_TAX_LAW_CROSSWALK.csv', () => {
      expect(fs.existsSync(canonicalCrosswalkPath)).toBe(true);
      const content = fs.readFileSync(canonicalCrosswalkPath, 'utf8');
      expect(content).toContain('Income-tax Act, 2025');
      expect(content).toContain('In Force');
    });

    it('no broken references to non-existent tax or compliance directories remain in product-docs', () => {
      const docsDir = path.join(rootDir, 'product-docs');
      const filesToCheck = [
        path.join(docsDir, 'finance/LIFE_INSURANCE_PLANNER_QA.md'),
        path.join(docsDir, 'finance/PHASE_18_1_ACCURACY_AUDIT_QA.md'),
        path.join(docsDir, 'finance/RETIREMENT_GATE_A_REVIEW_PACK.md'),
        path.join(docsDir, 'finance/RETIREMENT_ACCUMULATION_DRAFT_SPEC.md'),
        path.join(docsDir, 'finance/RETIREMENT_DRAWDOWN_AND_SWP_DRAFT_SPEC.md'),
      ];

      for (const filePath of filesToCheck) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          expect(content).not.toContain('product-docs/tax/CURRENT_INCOME_TAX_LAW_CROSSWALK.csv');
        }
      }
    });
  });

  describe('6. Central Business Profile & Regulatory Compliance Governance', () => {
    it('regulatory status is CONFIRMED and public texts reflect AMFI registration evidence', async () => {
      const { BUSINESS_PROFILE } = await import('../../src/config/businessProfile');
      expect(BUSINESS_PROFILE.regulatory.arnStatus).toBe('CONFIRMED');
      expect(BUSINESS_PROFILE.regulatory.arn).toBe('ARN-266896');
      expect(BUSINESS_PROFILE.regulatory.registrationStatusText).toContain('ARN-266896');
      expect(BUSINESS_PROFILE.regulatory.amfiRegistrationText).toContain('ARN-266896');
      expect(BUSINESS_PROFILE.regulatory.distributorRoleText).toContain('ARN-266896');
      expect(BUSINESS_PROFILE.disclosures.intermediaryStatement).toContain('ARN-266896');
    });
  });
});
