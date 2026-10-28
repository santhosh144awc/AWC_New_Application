import { describe, it, expect } from 'vitest';
import { getAllRegisteredRoutes } from '../../src/config/routes';
import { TOOL_DIRECTORY, getResolvedTools } from '../../src/config/toolDirectory';
import { JOURNEY_STAGES } from '../../src/config/journey';
import { filterTools, matchesIntent, matchesQuery, normalizeQuery } from '../../src/lib/toolFilter';
import { BUSINESS_PROFILE } from '../../src/config/businessProfile';

describe('Concept C Phase 1 — Data & Filter Invariants', () => {
  const registeredRoutes = getAllRegisteredRoutes();
  const registeredPaths = new Set(registeredRoutes.map((r) => r.path));

  describe('1. Tool Directory Resolution & Integrity', () => {
    it('every tool directory entry points to an existing registered route', () => {
      const resolved = getResolvedTools();
      expect(resolved.length).toBe(TOOL_DIRECTORY.length);

      for (const tool of resolved) {
        expect(tool.id).toBeTruthy();
        expect(tool.title.trim().length).toBeGreaterThan(0);
        expect(tool.href.startsWith('/')).toBe(true);
        expect(registeredPaths.has(tool.href), `Route ${tool.href} must exist in registry`).toBe(true);
        expect(tool.summary.trim().length).toBeGreaterThan(10);
        expect(tool.question.trim().length).toBeGreaterThan(10);
        expect(tool.statusLabel.trim().length).toBeGreaterThan(0);
        expect(tool.actionLabel.trim().length).toBeGreaterThan(0);
        expect(tool.icon.trim().length).toBeGreaterThan(0);
        expect(['mint', 'mist', 'sand']).toContain(tool.tint);
        expect(tool.intents.length).toBeGreaterThan(0);

        // Disallow undefined or [object Object] artifacts in text
        expect(tool.title).not.toContain('undefined');
        expect(tool.summary).not.toContain('undefined');
        expect(tool.question).not.toContain('undefined');
        expect(tool.statusLabel).not.toContain('undefined');
        expect(tool.title).not.toContain('[object Object]');
        expect(tool.summary).not.toContain('[object Object]');
      }
    });

    it('truthfully tags enabled routes as active', () => {
      const resolved = getResolvedTools();
      const swp = resolved.find((t) => t.id === 'tool-swp');
      const retirement = resolved.find((t) => t.id === 'goal-retirement');
      const retirementIncome = resolved.find((t) => t.id === 'goal-retirement-income');
      const loanVsInvest = resolved.find((t) => t.id === 'tool-loan-vs-invest');

      expect(swp?.status).toBe('active');
      expect(swp?.statusLabel).toContain('Live calculator');
      expect(retirement?.status).toBe('active');
      expect(retirement?.statusLabel).toContain('Live planner');
      expect(retirementIncome?.status).toBe('active');
      expect(retirementIncome?.statusLabel).toContain('Live planner');
      expect(loanVsInvest?.status).toBe('active');
      expect(loanVsInvest?.statusLabel).toContain('Live calculator');
    });

    it('active tools are correctly marked as active', () => {
      const resolved = getResolvedTools();
      const activeIds = [
        'diag-health-check',
        'tool-net-worth',
        'tool-personal-finance-statement',
        'tool-sip',
        'tool-lumpsum',
        'tool-sip-growth',
        'goal-children',
        'goal-home',
        'tool-life-insurance',
        'tool-home-foreclosure',
      ];
      for (const id of activeIds) {
        const item = resolved.find((t) => t.id === id);
        expect(item, `Tool ${id} should be present in directory`).toBeDefined();
        expect(item?.status).toBe('active');
      }
    });
  });

  describe('2. Tool Filter & Search Logic', () => {
    const tools = getResolvedTools();

    it('normalizes queries by trimming punctuation and lowering case', () => {
      expect(normalizeQuery('   SIP, compounding! ')).toBe('sip compounding');
      expect(normalizeQuery('Children’s Education')).toBe('children s education');
    });

    it('matches query across words in any order', () => {
      expect(matchesQuery('Explore mutual fund SIP compounding growth', 'sip mutual')).toBe(true);
      expect(matchesQuery('Explore mutual fund SIP compounding growth', 'compounding sip')).toBe(true);
      expect(matchesQuery('Explore mutual fund SIP compounding growth', 'retirement')).toBe(false);
    });

    it('matches intents or allows "all"', () => {
      expect(matchesIntent(['grow', 'goal'], 'all')).toBe(true);
      expect(matchesIntent(['grow', 'goal'], 'grow')).toBe(true);
      expect(matchesIntent(['grow', 'goal'], 'loan')).toBe(false);
    });

    it('filters accurately when combined with search query', () => {
      const allGrow = filterTools(tools, 'grow', '');
      expect(allGrow.length).toBeGreaterThanOrEqual(3);
      for (const t of allGrow) {
        expect(t.intents).toContain('grow');
      }

      const sipFiltered = filterTools(tools, 'all', 'SIP');
      expect(sipFiltered.length).toBeGreaterThanOrEqual(3);

      const noMatch = filterTools(tools, 'all', 'xyznonexistent123');
      expect(noMatch.length).toBe(0);
    });
  });

  describe('3. Financial Journey Stages Integrity', () => {
    it('has 6 explorable stages with valid structure and canonical links', () => {
      expect(JOURNEY_STAGES.length).toBe(6);

      JOURNEY_STAGES.forEach((stage, idx) => {
        expect(stage.id).toBeTruthy();
        expect(stage.label.trim().length).toBeGreaterThan(0);
        expect(stage.title.trim().length).toBeGreaterThan(0);
        expect(stage.purpose.trim().length).toBeGreaterThan(10);
        expect(stage.explanation.trim().length).toBeGreaterThan(20);
        expect(stage.actions.length).toBeGreaterThanOrEqual(3);
        expect(stage.links.length).toBeGreaterThanOrEqual(1);

        for (const link of stage.links) {
          expect(link.label.trim().length).toBeGreaterThan(0);
          expect(link.href.startsWith('/')).toBe(true);
          expect(registeredPaths.has(link.href), `Journey link target ${link.href} on stage ${idx + 1} must exist`).toBe(true);
        }
      });
    });

    it('retirement stage links are active and unblocked', () => {
      const stage4 = JOURNEY_STAGES[3]; // Family goals
      const retireLink = stage4.links.find((l) => l.href === '/plan/retirement/');
      expect(retireLink).toBeDefined();
      expect(retireLink?.preview).toBeUndefined();

      const stage6 = JOURNEY_STAGES[5]; // Review & adjust
      const swpLink = stage6.links.find((l) => l.href === '/plan/retirement-income/');
      expect(swpLink).toBeDefined();
      expect(swpLink?.preview).toBeUndefined();
    });
  });

  describe('4. Compliance and Profile Invariants', () => {
    it('retains strictly verified credentials and confirmed ARN state based on AMFI registry evidence', () => {
      expect(BUSINESS_PROFILE.founder.fullName).toBe('C. Santhosh Sathriyan, B.E.');
      expect(BUSINESS_PROFILE.firm.experienceSince).toBe('2012');
      expect(BUSINESS_PROFILE.regulatory.category).toBe('MUTUAL_FUND_DISTRIBUTION');
      expect(BUSINESS_PROFILE.regulatory.arnStatus).toBe('CONFIRMED');
      expect(BUSINESS_PROFILE.regulatory.arn).toBe('ARN-266896');
    });
  });
});
