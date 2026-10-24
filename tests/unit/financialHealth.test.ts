import { describe, it, expect } from 'vitest';
import {
  HEALTH_PILLARS,
  SCORE_BANDS,
  calculateFinancialHealth,
  validateHealthCheckAnswers,
  getPillarStatus,
  getPillarStatusLabel,
  getPillarStatusColor,
  getPillarStatusIcon,
  getOverallScoreBand,
  getStrengths,
  getAreasToStrengthen,
  getPriorityAreas,
  type HealthPillar,
} from '../../src/domain/finance/financialHealth';
import { FinanceValidationError } from '../../src/domain/finance/errors';

describe('7-Pillar Family Financial Health Domain Engine', () => {
  // ----------------------------------------------------
  // 1. Structure, Weights, and Options Auditing
  // ----------------------------------------------------
  describe('1. Structure, Weights, and Options Integrity', () => {
    it('defines exactly 7 distinct financial health pillars', () => {
      expect(HEALTH_PILLARS.length).toBe(7);
      const pillarIds = HEALTH_PILLARS.map((p) => p.id);
      const uniqueIds = new Set(pillarIds);
      expect(uniqueIds.size).toBe(7);
    });

    it('asserts weights sum to exactly 100% within float tolerance', () => {
      const totalWeight = HEALTH_PILLARS.reduce((sum, p) => sum + p.weight, 0);
      expect(Math.abs(totalWeight - 1.0)).toBeLessThan(1e-6);

      const totalWeightPercent = HEALTH_PILLARS.reduce((sum, p) => sum + p.weightPercent, 0);
      expect(totalWeightPercent).toBe(100);
    });

    it('each pillar weight matches the canonical specification', () => {
      const weightMap: Record<HealthPillar, number> = {
        cashFlow: 15,
        emergencyFund: 15,
        debt: 15,
        protection: 15,
        investments: 15,
        goals: 10,
        retirement: 15,
      };

      for (const pillar of HEALTH_PILLARS) {
        expect(pillar.weightPercent).toBe(weightMap[pillar.id]);
        expect(pillar.weight).toBe(weightMap[pillar.id] / 100);
      }
    });

    it('every pillar has exactly 4 options with scores between 20 and 100', () => {
      for (const pillar of HEALTH_PILLARS) {
        expect(pillar.options.length).toBe(4);
        for (const opt of pillar.options) {
          expect(opt.id).toBeTruthy();
          expect(opt.label).toBeTruthy();
          expect(opt.score).toBeGreaterThanOrEqual(20);
          expect(opt.score).toBeLessThanOrEqual(100);
        }
      }
    });

    it('audits all 28 option scores against the verified canonical rubric', () => {
      const expectedScores: Record<string, number> = {
        // Cash Flow (15%)
        cf_1: 20,
        cf_2: 45,
        cf_3: 80,
        cf_4: 100,
        // Emergency Fund (15%)
        ef_1: 20,
        ef_2: 50,
        ef_3: 85,
        ef_4: 100,
        // Debt Management (15%)
        db_1: 20,
        db_2: 50,
        db_3: 85,
        db_4: 100,
        // Protection (15%)
        pr_1: 20,
        pr_2: 50,
        pr_3: 80,
        pr_4: 100,
        // Investments (15%)
        inv_1: 30,
        inv_2: 55,
        inv_3: 85,
        inv_4: 100,
        // Goals (10%)
        gl_1: 25,
        gl_2: 55,
        gl_3: 85,
        gl_4: 100,
        // Retirement (15%)
        rt_1: 20,
        rt_2: 50,
        rt_3: 85,
        rt_4: 100,
      };

      for (const pillar of HEALTH_PILLARS) {
        for (const opt of pillar.options) {
          expect(opt.score).toBe(expectedScores[opt.id]);
        }
      }
    });
  });

  // ----------------------------------------------------
  // 2. Score Bands and Boundaries
  // ----------------------------------------------------
  describe('2. Score Bands and Boundaries', () => {
    it('defines exactly 4 canonical non-overlapping score bands', () => {
      expect(SCORE_BANDS.length).toBe(4);
      expect(SCORE_BANDS[0].title).toBe('Strong Foundation');
      expect(SCORE_BANDS[1].title).toBe('Generally Healthy');
      expect(SCORE_BANDS[2].title).toBe('Needs Strengthening');
      expect(SCORE_BANDS[3].title).toBe('Priority Areas Identified');
    });

    it('classifies cutoff boundary values accurately', () => {
      // 0 - 49: Priority Areas Identified
      expect(getOverallScoreBand(0).title).toBe('Priority Areas Identified');
      expect(getOverallScoreBand(22).title).toBe('Priority Areas Identified');
      expect(getOverallScoreBand(49).title).toBe('Priority Areas Identified');
      expect(getOverallScoreBand(49.4).title).toBe('Priority Areas Identified');

      // 50 - 64: Needs Strengthening
      expect(getOverallScoreBand(49.5).title).toBe('Needs Strengthening'); // rounds to 50
      expect(getOverallScoreBand(50).title).toBe('Needs Strengthening');
      expect(getOverallScoreBand(64).title).toBe('Needs Strengthening');
      expect(getOverallScoreBand(64.4).title).toBe('Needs Strengthening');

      // 65 - 79: Generally Healthy
      expect(getOverallScoreBand(64.6).title).toBe('Generally Healthy'); // rounds to 65
      expect(getOverallScoreBand(65).title).toBe('Generally Healthy');
      expect(getOverallScoreBand(79).title).toBe('Generally Healthy');
      expect(getOverallScoreBand(79.4).title).toBe('Generally Healthy');

      // 80 - 100: Strong Foundation
      expect(getOverallScoreBand(79.5).title).toBe('Strong Foundation'); // rounds to 80
      expect(getOverallScoreBand(80).title).toBe('Strong Foundation');
      expect(getOverallScoreBand(100).title).toBe('Strong Foundation');
    });

    it('evaluates individual pillar statuses at boundaries (49, 50, 79, 80)', () => {
      expect(getPillarStatus(49)).toBe('attention');
      expect(getPillarStatusLabel('attention')).toBe('Needs Attention');
      expect(getPillarStatusColor('attention')).toBe('#E11D48');
      expect(getPillarStatusIcon('attention')).toBe('!');

      expect(getPillarStatus(50)).toBe('building');
      expect(getPillarStatusLabel('building')).toBe('Building');
      expect(getPillarStatusColor('building')).toBe('#2563EB');
      expect(getPillarStatusIcon('building')).toBe('↗');

      expect(getPillarStatus(79)).toBe('building');

      expect(getPillarStatus(80)).toBe('strong');
      expect(getPillarStatusLabel('strong')).toBe('Strong');
      expect(getPillarStatusColor('strong')).toBe('#00AB96');
      expect(getPillarStatusIcon('strong')).toBe('✓');
    });

    it('ensures each score from 20 to 100 maps to mutually exclusive status buckets', () => {
      for (let s = 20; s <= 100; s += 5) {
        const dummy = [
          {
            pillar: 'cashFlow' as HealthPillar,
            title: 'Cash Flow',
            shortTitle: 'Cash Flow',
            score: s,
            weight: 0.15,
            weightPercent: 15,
            weightedScore: s * 0.15,
            status: getPillarStatus(s),
            statusLabel: getPillarStatusLabel(getPillarStatus(s)),
            statusColor: getPillarStatusColor(getPillarStatus(s)),
            icon: getPillarStatusIcon(getPillarStatus(s)),
            selectedOptionId: 'cf_1',
            selectedOptionLabel: 'label',
          },
        ];

        const isStrength = getStrengths(dummy).length > 0;
        const isBuilding = getAreasToStrengthen(dummy).length > 0;
        const isPriority = getPriorityAreas(dummy).length > 0;

        const count = [isStrength, isBuilding, isPriority].filter(Boolean).length;
        expect(count).toBe(1);
      }
    });
  });

  // ----------------------------------------------------
  // 3. Complete Answer Calculations (Test Vectors)
  // ----------------------------------------------------
  describe('3. Complete Calculation Profiles & Test Vectors', () => {
    it('VEC-HEALTH-01: all-minimum answer set produces score 22 (Priority Areas Identified)', () => {
      const allLowest = {
        cashFlow: 'cf_1', // 20 * 0.15 = 3.0
        emergencyFund: 'ef_1', // 20 * 0.15 = 3.0
        debt: 'db_1', // 20 * 0.15 = 3.0
        protection: 'pr_1', // 20 * 0.15 = 3.0
        investments: 'inv_1', // 30 * 0.15 = 4.5
        goals: 'gl_1', // 25 * 0.10 = 2.5
        retirement: 'rt_1', // 20 * 0.15 = 3.0
      };

      const result = calculateFinancialHealth(allLowest);
      // Sum = 3 + 3 + 3 + 3 + 4.5 + 2.5 + 3 = 22.0
      expect(result.unroundedOverallScore).toBe(22.0);
      expect(result.overallScore).toBe(22);
      expect(result.band.title).toBe('Priority Areas Identified');
      expect(result.strengths.length).toBe(0);
      expect(result.allStrengths.length).toBe(0);
      expect(result.priorityAreas.length).toBe(7);
      expect(result.areasNeedingAttention.length).toBe(2);
      expect(result.recommendations.length).toBe(3);
    });

    it('VEC-HEALTH-02: all-maximum answer set produces score 100 (Strong Foundation)', () => {
      const allHighest = {
        cashFlow: 'cf_4', // 100 * 0.15 = 15
        emergencyFund: 'ef_4', // 100 * 0.15 = 15
        debt: 'db_4', // 100 * 0.15 = 15
        protection: 'pr_4', // 100 * 0.15 = 15
        investments: 'inv_4', // 100 * 0.15 = 15
        goals: 'gl_4', // 100 * 0.10 = 10
        retirement: 'rt_4', // 100 * 0.15 = 15
      };

      const result = calculateFinancialHealth(allHighest);
      expect(result.unroundedOverallScore).toBe(100.0);
      expect(result.overallScore).toBe(100);
      expect(result.band.title).toBe('Strong Foundation');
      expect(result.allStrengths.length).toBe(7);
      expect(result.strengths.length).toBe(2); // Capped at top 2
      expect(result.priorityAreas.length).toBe(0);
      expect(result.areasNeedingAttention.length).toBe(0);
      expect(result.recommendations.length).toBe(2); // 2 maintenance steps
    });

    it('VEC-HEALTH-03: all-option-3 answer set yields score 84 (Strong Foundation)', () => {
      const allOption3 = {
        cashFlow: 'cf_3', // 80 * 0.15 = 12.0
        emergencyFund: 'ef_3', // 85 * 0.15 = 12.75
        debt: 'db_3', // 85 * 0.15 = 12.75
        protection: 'pr_3', // 80 * 0.15 = 12.0
        investments: 'inv_3', // 85 * 0.15 = 12.75
        goals: 'gl_3', // 85 * 0.10 = 8.5
        retirement: 'rt_3', // 85 * 0.15 = 12.75
      };

      // Sum = 12 + 12.75 + 12.75 + 12 + 12.75 + 8.5 + 12.75 = 83.5
      // Rounded = 84
      const result = calculateFinancialHealth(allOption3);
      expect(result.unroundedOverallScore).toBe(83.5);
      expect(result.overallScore).toBe(84);
      expect(result.band.title).toBe('Strong Foundation');
      expect(result.allStrengths.length).toBe(7);
      expect(result.strengths.length).toBe(2);
    });

    it('VEC-HEALTH-04: realistic mixed Indian household yields score 66 (Generally Healthy)', () => {
      const profile = {
        cashFlow: 'cf_3', // 80 * 0.15 = 12.0
        emergencyFund: 'ef_2', // 50 * 0.15 = 7.5
        debt: 'db_3', // 85 * 0.15 = 12.75
        protection: 'pr_2', // 50 * 0.15 = 7.5
        investments: 'inv_3', // 85 * 0.15 = 12.75
        goals: 'gl_2', // 55 * 0.10 = 5.5
        retirement: 'rt_2', // 50 * 0.15 = 7.5
      };

      // Sum = 12 + 7.5 + 12.75 + 7.5 + 12.75 + 5.5 + 7.5 = 65.5 => 66
      const result = calculateFinancialHealth(profile);
      expect(result.unroundedOverallScore).toBe(65.5);
      expect(result.overallScore).toBe(66);
      expect(result.band.title).toBe('Generally Healthy');
      expect(result.strengths.length).toBe(2);
      expect(result.areasNeedingAttention.length).toBe(2);
      expect(result.recommendations.length).toBe(3);
    });

    it('is stable and deterministic regardless of input object key order', () => {
      const answersA = {
        cashFlow: 'cf_3',
        emergencyFund: 'ef_2',
        debt: 'db_3',
        protection: 'pr_2',
        investments: 'inv_3',
        goals: 'gl_2',
        retirement: 'rt_2',
      };

      const answersB = {
        retirement: 'rt_2',
        goals: 'gl_2',
        protection: 'pr_2',
        cashFlow: 'cf_3',
        investments: 'inv_3',
        emergencyFund: 'ef_2',
        debt: 'db_3',
      };

      const resA = calculateFinancialHealth(answersA);
      const resB = calculateFinancialHealth(answersB);

      expect(resA.overallScore).toBe(resB.overallScore);
      expect(resA.unroundedOverallScore).toBe(resB.unroundedOverallScore);
      expect(resA.band.title).toBe(resB.band.title);
      expect(resA.recommendations.map((r) => r.pillar)).toEqual(
        resB.recommendations.map((r) => r.pillar)
      );
    });
  });

  // ----------------------------------------------------
  // 4. Recommendation Hierarchy and Capping
  // ----------------------------------------------------
  describe('4. Recommendation Hierarchy and Product Neutrality', () => {
    it('prioritizes high-cost debt (< 50) as step 1 over weak investments (< 50)', () => {
      const profile = {
        debt: 'db_1', // 20 (attention)
        investments: 'inv_1', // 30 (attention)
        cashFlow: 'cf_3', // 80
        emergencyFund: 'ef_3', // 85
        protection: 'pr_3', // 80
        goals: 'gl_3', // 85
        retirement: 'rt_3', // 85
      };

      const result = calculateFinancialHealth(profile);
      expect(result.recommendations[0].pillar).toBe('debt');
      expect(result.recommendations.length).toBeLessThanOrEqual(3);
    });

    it('prioritizes emergency reserve (< 50) when debt is healthy', () => {
      const profile = {
        debt: 'db_3', // 85
        emergencyFund: 'ef_1', // 20
        investments: 'inv_1', // 30
        cashFlow: 'cf_3', // 80
        protection: 'pr_3', // 80
        goals: 'gl_3', // 85
        retirement: 'rt_3', // 85
      };

      const result = calculateFinancialHealth(profile);
      expect(result.recommendations[0].pillar).toBe('emergencyFund');
    });

    it('prioritizes protection (< 50) before long-term planning and investments', () => {
      const profile = {
        debt: 'db_3', // 85
        emergencyFund: 'ef_3', // 85
        protection: 'pr_1', // 20
        investments: 'inv_1', // 30
        cashFlow: 'cf_3', // 80
        goals: 'gl_2', // 55
        retirement: 'rt_2', // 50
      };

      const result = calculateFinancialHealth(profile);
      expect(result.recommendations[0].pillar).toBe('protection');
    });

    it('strictly caps recommendations at maximum 3 items with zero duplicate pillars', () => {
      const allLowest = {
        cashFlow: 'cf_1',
        emergencyFund: 'ef_1',
        debt: 'db_1',
        protection: 'pr_1',
        investments: 'inv_1',
        goals: 'gl_1',
        retirement: 'rt_1',
      };

      const result = calculateFinancialHealth(allLowest);
      expect(result.recommendations.length).toBe(3);
      const pillars = result.recommendations.map((r) => r.pillar);
      const unique = new Set(pillars);
      expect(unique.size).toBe(3);
      // Top 3 for all lowest should be debt, emergencyFund, protection
      expect(pillars).toEqual(['debt', 'emergencyFund', 'protection']);
    });

    it('strictly enforces product neutrality across all recommendations', () => {
      const allLowest = {
        cashFlow: 'cf_1',
        emergencyFund: 'ef_1',
        debt: 'db_1',
        protection: 'pr_1',
        investments: 'inv_1',
        goals: 'gl_1',
        retirement: 'rt_1',
      };

      const result = calculateFinancialHealth(allLowest);
      for (const rec of result.recommendations) {
        const full = `${rec.title} ${rec.description} ${rec.action}`.toLowerCase();
        expect(full).not.toContain('start a sip');
        expect(full).not.toContain('buy term insurance from');
        expect(full).not.toContain('hdfc');
        expect(full).not.toContain('lic');
        expect(full).not.toContain('sbi');
        expect(full).not.toContain('icici');
      }
    });

    it('does not calculate or recommend retirement corpus, SWP or tax haircut (GATE-A/GATE-C)', () => {
      const profile = {
        cashFlow: 'cf_3',
        emergencyFund: 'ef_3',
        debt: 'db_3',
        protection: 'pr_3',
        investments: 'inv_3',
        goals: 'gl_3',
        retirement: 'rt_1', // Weak retirement awareness
      };

      const result = calculateFinancialHealth(profile);
      const retRec = result.recommendations.find((r) => r.pillar === 'retirement');
      expect(retRec).toBeDefined();
      expect(retRec?.route).toBe('/plan/retirement/');
      // Must not contain corpus figures, SWP or tax guarantees
      const recText = `${retRec?.title} ${retRec?.description} ${retRec?.action}`.toLowerCase();
      expect(recText).not.toContain('corpus required');
      expect(recText).not.toContain('swp');
      expect(recText).not.toContain('tax relief');
    });
  });

  // ----------------------------------------------------
  // 5. Validation Contract & Error Handling
  // ----------------------------------------------------
  describe('5. Input Validation Contract & Error Handling', () => {
    it('rejects empty input object', () => {
      const validation = validateHealthCheckAnswers({});
      expect(validation.isValid).toBe(false);
      expect(validation.missingPillars.length).toBe(7);

      expect(() => calculateFinancialHealth({})).toThrow(FinanceValidationError);
    });

    it('rejects partial / incomplete answer sets without treating unanswered as zero', () => {
      const partial = {
        cashFlow: 'cf_3',
        emergencyFund: 'ef_4',
        debt: 'db_3',
      };

      const validation = validateHealthCheckAnswers(partial);
      expect(validation.isValid).toBe(false);
      expect(validation.missingPillars).toEqual([
        'protection',
        'investments',
        'goals',
        'retirement',
      ]);

      expect(() => calculateFinancialHealth(partial)).toThrow(FinanceValidationError);
    });

    it('rejects unknown pillar IDs explicitly', () => {
      const withUnknown = {
        cashFlow: 'cf_4',
        emergencyFund: 'ef_4',
        debt: 'db_4',
        protection: 'pr_4',
        investments: 'inv_4',
        goals: 'gl_4',
        retirement: 'rt_4',
        cryptoTrading: 'cr_1', // Unknown
      };

      const validation = validateHealthCheckAnswers(withUnknown);
      expect(validation.isValid).toBe(false);
      expect(validation.invalidPillars).toContain('cryptoTrading');

      expect(() => calculateFinancialHealth(withUnknown)).toThrow(FinanceValidationError);
    });

    it('rejects unknown option IDs explicitly', () => {
      const withInvalidOpt = {
        cashFlow: 'cf_4',
        emergencyFund: 'ef_99', // Invalid
        debt: 'db_4',
        protection: 'pr_4',
        investments: 'inv_4',
        goals: 'gl_4',
        retirement: 'rt_4',
      };

      const validation = validateHealthCheckAnswers(withInvalidOpt);
      expect(validation.isValid).toBe(false);
      expect(validation.invalidOptions).toEqual([
        { pillar: 'emergencyFund', optionId: 'ef_99' },
      ]);

      expect(() => calculateFinancialHealth(withInvalidOpt)).toThrow(FinanceValidationError);
    });
  });
});
