import { describe, it, expect } from 'vitest';
import {
  calculateChildrenFuturePlan,
  solveRequiredStepUpSIP,
  CANONICAL_CHILDREN_PLANNER_SAMPLE,
  type ChildrenFuturePlannerInputs,
  calculateSIP,
} from '../../src/domain/finance';
import { FinanceValidationError } from '../../src/domain/finance/errors';

describe('Children Future Multi-Milestone Planner Domain Engine', () => {
  describe('Authoritative Test Vectors (from CHILDREN_FUTURE_PLANNER_TEST_VECTORS.csv)', () => {
    it('VEC-KID-01: One goal, zero inflation, zero return, no existing investments', () => {
      const inputs: ChildrenFuturePlannerInputs = {
        children: [{ id: 'k1', name: 'Rohan', currentAge: 8 }],
        existingInvestments: [],
        milestones: [
          {
            id: 'm1',
            childId: 'k1',
            title: 'Undergraduate College Fund',
            category: 'DOMESTIC_HIGHER_EDUCATION',
            targetAge: 18,
            costToday: 1200000,
            annualInflationPercent: 0,
            allocations: [],
          },
        ],
        assumedAnnualReturnPercent: 0,
        annualStepUpPercent: 0,
      };

      const result = calculateChildrenFuturePlan(inputs);

      expect(result.milestonesCount).toBe(1);
      const m = result.milestoneResults[0];
      expect(m.horizonYears).toBe(10);
      expect(m.tenureMonths).toBe(120);
      expect(m.futureGoalCost).toBe(1200000);
      expect(m.inflationImpactCost).toBe(0);
      expect(m.allocatedCurrentAssets).toBe(0);
      expect(m.futureValueOfAllocatedAssets).toBe(0);
      expect(m.fundingShortfall).toBe(1200000);
      expect(m.isFullyCovered).toBe(false);

      // Under zero return, fixed SIP is exactly 1,200,000 / 120 = 10,000/mo
      expect(m.requiredFixedMonthlySIP).toBe(10000);
      expect(m.totalFixedSIPInvested).toBe(1200000);
      expect(m.singleLumpSumEquivalentToday).toBe(1200000);
      expect(m.requiredStepUpMonthlySIP).toBe(10000);
    });

    it('VEC-KID-02: Positive inflation (10%) with zero investment return over 2 years', () => {
      const inputs: ChildrenFuturePlannerInputs = {
        children: [{ id: 'k1', name: 'Pooja', currentAge: 16 }],
        existingInvestments: [],
        milestones: [
          {
            id: 'm1',
            childId: 'k1',
            title: 'Vocational Training Diploma',
            category: 'SCHOOL_COLLEGE',
            targetAge: 18,
            costToday: 1000000,
            annualInflationPercent: 10,
            allocations: [],
          },
        ],
        assumedAnnualReturnPercent: 0,
        annualStepUpPercent: 0,
      };

      const result = calculateChildrenFuturePlan(inputs);
      const m = result.milestoneResults[0];

      expect(m.horizonYears).toBe(2);
      expect(m.tenureMonths).toBe(24);
      // Future cost: 1,000,000 * (1.10)^2 = 1,210,000
      expect(m.futureGoalCost).toBeCloseTo(1210000, 2);
      expect(m.fundingShortfall).toBeCloseTo(1210000, 2);
      // Fixed SIP: 1,210,000 / 24 = 50,416.6667
      expect(m.requiredFixedMonthlySIP).toBeCloseTo(1210000 / 24, 2);
      expect(m.singleLumpSumEquivalentToday).toBeCloseTo(1210000, 2);
    });

    it('VEC-KID-03: Zero return with 10% annual step-up for ₹12,10,000 shortfall over 24 months', () => {
      const inputs: ChildrenFuturePlannerInputs = {
        children: [{ id: 'k1', name: 'Pooja', currentAge: 16 }],
        existingInvestments: [],
        milestones: [
          {
            id: 'm1',
            childId: 'k1',
            title: 'Vocational Training Diploma',
            category: 'SCHOOL_COLLEGE',
            targetAge: 18,
            costToday: 1000000,
            annualInflationPercent: 10,
            allocations: [],
          },
        ],
        assumedAnnualReturnPercent: 0,
        annualStepUpPercent: 10,
      };

      const result = calculateChildrenFuturePlan(inputs);
      const m = result.milestoneResults[0];

      // Step-up formula over 2 years at 0% return:
      // Year 1 (12 months): 12 * M0
      // Year 2 (12 months): 12 * (1.10 * M0) = 13.2 * M0
      // Total = 25.2 * M0 = 1,210,000 => M0 = 1,210,000 / 25.2 = 48,015.873
      expect(m.requiredStepUpMonthlySIP).toBeCloseTo(1210000 / 25.2, 2);
      expect(m.totalStepUpSIPInvested).toBeCloseTo(1210000, 1);
    });

    it('VEC-KID-04: Fully covered milestone produces zero required SIP and zero lump sum equivalent', () => {
      const inputs: ChildrenFuturePlannerInputs = {
        children: [{ id: 'k1', name: 'Vivaan', currentAge: 5 }],
        existingInvestments: [
          { id: 'inv-1', label: 'Dedicated Fixed Deposit', currentValue: 1000000 },
        ],
        milestones: [
          {
            id: 'm1',
            childId: 'k1',
            title: 'School High Schooling',
            category: 'SCHOOL_COLLEGE',
            targetAge: 18,
            costToday: 1500000,
            annualInflationPercent: 6,
            allocations: [{ investmentId: 'inv-1', allocatedAmount: 1000000 }],
          },
        ],
        assumedAnnualReturnPercent: 10,
        annualStepUpPercent: 10,
      };

      const result = calculateChildrenFuturePlan(inputs);
      const m = result.milestoneResults[0];

      expect(m.horizonYears).toBe(13);
      // Future cost: 1,500,000 * (1.06)^13 = 3,199,392.39
      expect(m.futureGoalCost).toBeCloseTo(3199392.39, 1);
      // Future value of asset: 1,000,000 * (1.10)^13 = 3,452,271.21
      expect(m.futureValueOfAllocatedAssets).toBeCloseTo(3452271.21, 1);
      // Fully covered:
      expect(m.fundingShortfall).toBe(0);
      expect(m.isFullyCovered).toBe(true);
      expect(m.requiredFixedMonthlySIP).toBe(0);
      expect(m.requiredStepUpMonthlySIP).toBe(0);
      expect(m.singleLumpSumEquivalentToday).toBe(0);
      expect(m.totalFixedSIPInvested).toBe(0);
      expect(m.totalStepUpSIPInvested).toBe(0);
    });

    it('VEC-KID-05: Partial coverage with 12% return and 10% step-up', () => {
      const inputs: ChildrenFuturePlannerInputs = {
        children: [{ id: 'k1', name: 'Tanvi', currentAge: 3 }],
        existingInvestments: [
          { id: 'inv-1', label: 'Sukanya Samriddhi', currentValue: 500000 },
        ],
        milestones: [
          {
            id: 'm1',
            childId: 'k1',
            title: 'Medical College MBBS',
            category: 'DOMESTIC_HIGHER_EDUCATION',
            targetAge: 18,
            costToday: 2000000,
            annualInflationPercent: 8,
            allocations: [{ investmentId: 'inv-1', allocatedAmount: 300000 }],
          },
        ],
        assumedAnnualReturnPercent: 12,
        annualStepUpPercent: 10,
      };

      const result = calculateChildrenFuturePlan(inputs);
      const m = result.milestoneResults[0];

      expect(m.horizonYears).toBe(15);
      expect(m.tenureMonths).toBe(180);
      // Future cost: 2,000,000 * (1.08)^15 = 6,344,338.23
      expect(m.futureGoalCost).toBeCloseTo(6344338.23, 1);
      // Future asset value: 300,000 * (1.12)^15 = 1,642,069.73
      expect(m.futureValueOfAllocatedAssets).toBeCloseTo(1642069.73, 1);
      // Net funding shortfall: 6,344,338.23 - 1,642,069.73 = 4,702,268.50
      expect(m.fundingShortfall).toBeCloseTo(4702268.5, 1);
      expect(m.isFullyCovered).toBe(false);

      // Single lump-sum equivalent today: 4,702,268.50 / (1.12)^15 = 859,086.87
      expect(m.singleLumpSumEquivalentToday).toBeCloseTo(859086.87, 0);

      // Fixed Monthly SIP: ~9,880.14
      expect(m.requiredFixedMonthlySIP).toBeCloseTo(9880.14, 1);

      // Step-Up Monthly SIP: ~5,682.69
      expect(m.requiredStepUpMonthlySIP).toBeCloseTo(5682.69, 1);

      // Verify step-up SIP with calculateSIP yields exactly the shortfall
      const sim = calculateSIP({
        monthlyInvestment: m.requiredStepUpMonthlySIP,
        tenureMonths: 180,
        annualReturnPercent: 12,
        annualStepUpPercent: 10,
      });
      expect(sim.futureValue).toBeCloseTo(m.fundingShortfall, 1);
    });

    it('VEC-KID-06: Authoritative Canonical Urban Family Sample matches test register exactly', () => {
      const result = calculateChildrenFuturePlan(CANONICAL_CHILDREN_PLANNER_SAMPLE);

      expect(result.childrenCount).toBe(2);
      expect(result.milestonesCount).toBe(2);
      expect(result.assumedAnnualReturnPercent).toBe(10);
      expect(result.annualStepUpPercent).toBe(10);

      // Milestone 1: Aarav B.Tech (12y horizon)
      const m1 = result.milestoneResults[0];
      expect(m1.childName).toBe('Aarav');
      expect(m1.horizonYears).toBe(12);
      expect(m1.costToday).toBe(2000000);
      expect(m1.futureGoalCost).toBeCloseTo(5036340.23, 1);
      expect(m1.allocatedCurrentAssets).toBe(300000);
      expect(m1.futureValueOfAllocatedAssets).toBeCloseTo(941528.51, 1);
      expect(m1.fundingShortfall).toBeCloseTo(4094811.72, 1);
      expect(m1.requiredFixedMonthlySIP).toBeCloseTo(15148.64, 1);
      expect(m1.requiredStepUpMonthlySIP).toBeCloseTo(9461.67, 1);
      expect(m1.singleLumpSumEquivalentToday).toBeCloseTo(1304733.21, 0);

      // Milestone 2: Ananya Masters (18y horizon)
      const m2 = result.milestoneResults[1];
      expect(m2.childName).toBe('Ananya');
      expect(m2.horizonYears).toBe(18);
      expect(m2.costToday).toBe(3500000);
      expect(m2.futureGoalCost).toBeCloseTo(16509921.46, 1);
      expect(m2.allocatedCurrentAssets).toBe(200000);
      expect(m2.futureValueOfAllocatedAssets).toBeCloseTo(1111983.46, 1);
      expect(m2.fundingShortfall).toBeCloseTo(15397938.0, 1);
      expect(m2.requiredFixedMonthlySIP).toBeCloseTo(26714.07, 1);
      expect(m2.requiredStepUpMonthlySIP).toBeCloseTo(13389.02, 1);
      expect(m2.singleLumpSumEquivalentToday).toBeCloseTo(2769454.5, 0);

      // Combined Totals
      expect(result.totalCostToday).toBe(5500000);
      expect(result.totalFutureMilestoneCosts).toBeCloseTo(21546261.69, 1);
      expect(result.totalAllocatedCurrentAssets).toBe(500000);
      expect(result.totalFutureValueOfAllocatedAssets).toBeCloseTo(2053511.98, 1);
      expect(result.totalFundingShortfall).toBeCloseTo(19492749.72, 1);
      expect(result.totalStartingFixedMonthlySIP).toBeCloseTo(41862.71, 1);
      expect(result.totalStartingStepUpMonthlySIP).toBeCloseTo(22850.69, 1);
      expect(result.totalLumpSumEquivalentToday).toBeCloseTo(4074187.7, 0);

      // Investment Reconciliations (non-double-counting)
      const inv1 = result.investmentReconciliations.find((r) => r.investmentId === 'inv-1')!;
      expect(inv1.currentValue).toBe(500000);
      expect(inv1.totalAllocatedAmount).toBe(400000); // 200k + 200k
      expect(inv1.unallocatedAmount).toBe(100000);
      expect(inv1.allocationPercent).toBe(80);

      const inv2 = result.investmentReconciliations.find((r) => r.investmentId === 'inv-2')!;
      expect(inv2.currentValue).toBe(300000);
      expect(inv2.totalAllocatedAmount).toBe(100000);
      expect(inv2.unallocatedAmount).toBe(200000);
      expect(inv2.allocationPercent).toBeCloseTo(33.33, 1);

      // Year-by-year schedule reconciliation:
      // In Years 1–12, both M1 and M2 are active (active count = 2)
      expect(result.yearlySchedule.length).toBe(18);
      for (let y = 1; y <= 12; y++) {
        expect(result.yearlySchedule[y - 1].activeMilestonesCount).toBe(2);
      }
      // In Years 13–18, only M2 is active (active count = 1)
      for (let y = 13; y <= 18; y++) {
        expect(result.yearlySchedule[y - 1].activeMilestonesCount).toBe(1);
      }
      // Fixed monthly outlay in Year 1 equals sum of both
      expect(result.yearlySchedule[0].fixedMonthlyOutlay).toBeCloseTo(41862.71, 1);
      // Fixed monthly outlay in Year 13 drops to M2's SIP only
      expect(result.yearlySchedule[12].fixedMonthlyOutlay).toBeCloseTo(26714.07, 1);
    });
  });

  describe('Non-Double-Counting Asset Invariants', () => {
    it('rejects aggregate allocations that exceed the source asset current value', () => {
      const inputs: ChildrenFuturePlannerInputs = {
        children: [{ id: 'k1', name: 'Child 1', currentAge: 5 }],
        existingInvestments: [
          { id: 'inv-1', label: 'Mutual Fund', currentValue: 300000 },
        ],
        milestones: [
          {
            id: 'm1',
            childId: 'k1',
            title: 'School Fees',
            category: 'SCHOOL_COLLEGE',
            targetAge: 10,
            costToday: 200000,
            annualInflationPercent: 6,
            allocations: [{ investmentId: 'inv-1', allocatedAmount: 200000 }],
          },
          {
            id: 'm2',
            childId: 'k1',
            title: 'College Fund',
            category: 'DOMESTIC_HIGHER_EDUCATION',
            targetAge: 18,
            costToday: 1000000,
            annualInflationPercent: 8,
            allocations: [{ investmentId: 'inv-1', allocatedAmount: 150000 }], // 200k + 150k = 350k > 300k!
          },
        ],
        assumedAnnualReturnPercent: 10,
      };

      expect(() => calculateChildrenFuturePlan(inputs)).toThrow(FinanceValidationError);
    });

    it('allows valid partial allocations across multiple milestones matching asset balance', () => {
      const inputs: ChildrenFuturePlannerInputs = {
        children: [{ id: 'k1', name: 'Child 1', currentAge: 5 }],
        existingInvestments: [
          { id: 'inv-1', label: 'Mutual Fund', currentValue: 300000 },
        ],
        milestones: [
          {
            id: 'm1',
            childId: 'k1',
            title: 'Goal A',
            category: 'SCHOOL_COLLEGE',
            targetAge: 10,
            costToday: 200000,
            annualInflationPercent: 6,
            allocations: [{ investmentId: 'inv-1', allocatedAmount: 100000 }],
          },
          {
            id: 'm2',
            childId: 'k1',
            title: 'Goal B',
            category: 'DOMESTIC_HIGHER_EDUCATION',
            targetAge: 18,
            costToday: 1000000,
            annualInflationPercent: 8,
            allocations: [{ investmentId: 'inv-1', allocatedAmount: 200000 }], // 100k + 200k = 300k == 300k
          },
        ],
        assumedAnnualReturnPercent: 10,
      };

      const result = calculateChildrenFuturePlan(inputs);
      expect(result.investmentReconciliations[0].unallocatedAmount).toBe(0);
      expect(result.investmentReconciliations[0].allocationPercent).toBe(100);
    });
  });

  describe('Validation & Domain Boundaries', () => {
    it('rejects target age less than or equal to child current age', () => {
      const inputs: ChildrenFuturePlannerInputs = {
        children: [{ id: 'k1', name: 'Child 1', currentAge: 12 }],
        existingInvestments: [],
        milestones: [
          {
            id: 'm1',
            childId: 'k1',
            title: 'Past Goal',
            category: 'SCHOOL_COLLEGE',
            targetAge: 12, // Same as current age
            costToday: 500000,
            annualInflationPercent: 6,
            allocations: [],
          },
        ],
        assumedAnnualReturnPercent: 10,
      };

      expect(() => calculateChildrenFuturePlan(inputs)).toThrow(FinanceValidationError);
    });

    it('rejects planning horizon greater than 35 years', () => {
      const inputs: ChildrenFuturePlannerInputs = {
        children: [{ id: 'k1', name: 'Newborn', currentAge: 0 }],
        existingInvestments: [],
        milestones: [
          {
            id: 'm1',
            childId: 'k1',
            title: 'Distant Goal',
            category: 'MARRIAGE_LIFE_EVENT',
            targetAge: 36, // 36 - 0 = 36 years > 35
            costToday: 1000000,
            annualInflationPercent: 6,
            allocations: [],
          },
        ],
        assumedAnnualReturnPercent: 10,
      };

      expect(() => calculateChildrenFuturePlan(inputs)).toThrow(FinanceValidationError);
    });

    it('rejects milestone referencing non-existent child ID', () => {
      const inputs: ChildrenFuturePlannerInputs = {
        children: [{ id: 'k1', name: 'Child 1', currentAge: 5 }],
        existingInvestments: [],
        milestones: [
          {
            id: 'm1',
            childId: 'k999', // Unknown
            title: 'Goal',
            category: 'SCHOOL_COLLEGE',
            targetAge: 18,
            costToday: 500000,
            annualInflationPercent: 6,
            allocations: [],
          },
        ],
        assumedAnnualReturnPercent: 10,
      };

      expect(() => calculateChildrenFuturePlan(inputs)).toThrow(FinanceValidationError);
    });

    it('rejects allocation referencing non-existent investment ID', () => {
      const inputs: ChildrenFuturePlannerInputs = {
        children: [{ id: 'k1', name: 'Child 1', currentAge: 5 }],
        existingInvestments: [],
        milestones: [
          {
            id: 'm1',
            childId: 'k1',
            title: 'Goal',
            category: 'SCHOOL_COLLEGE',
            targetAge: 18,
            costToday: 500000,
            annualInflationPercent: 6,
            allocations: [{ investmentId: 'inv-unknown', allocatedAmount: 100000 }],
          },
        ],
        assumedAnnualReturnPercent: 10,
      };

      expect(() => calculateChildrenFuturePlan(inputs)).toThrow(FinanceValidationError);
    });

    it('rejects excessive or negative returns and inflation rates', () => {
      const baseInputs: ChildrenFuturePlannerInputs = {
        children: [{ id: 'k1', name: 'Child 1', currentAge: 5 }],
        existingInvestments: [],
        milestones: [
          {
            id: 'm1',
            childId: 'k1',
            title: 'Goal',
            category: 'SCHOOL_COLLEGE',
            targetAge: 18,
            costToday: 500000,
            annualInflationPercent: 6,
            allocations: [],
          },
        ],
        assumedAnnualReturnPercent: 10,
      };

      // Return > 50%
      expect(() =>
        calculateChildrenFuturePlan({ ...baseInputs, assumedAnnualReturnPercent: 55 })
      ).toThrow(FinanceValidationError);

      // Return < 0%
      expect(() =>
        calculateChildrenFuturePlan({ ...baseInputs, assumedAnnualReturnPercent: -5 })
      ).toThrow(FinanceValidationError);

      // Inflation > 25%
      expect(() =>
        calculateChildrenFuturePlan({
          ...baseInputs,
          milestones: [{ ...baseInputs.milestones[0], annualInflationPercent: 30 }],
        })
      ).toThrow(FinanceValidationError);
    });
  });

  describe('Step-Up Solver (solveRequiredStepUpSIP)', () => {
    it('returns zero for zero or negative shortfall', () => {
      expect(solveRequiredStepUpSIP(0, 120, 10, 10)).toBe(0);
      expect(solveRequiredStepUpSIP(-50000, 120, 10, 10)).toBe(0);
    });

    it('converges to exact shortfall within 0.01 tolerance across multiple tenures and rates', () => {
      const testCases = [
        { shortfall: 500000, tenureMonths: 60, r: 8, s: 5 },
        { shortfall: 2500000, tenureMonths: 144, r: 10, s: 10 },
        { shortfall: 10000000, tenureMonths: 240, r: 12, s: 15 },
      ];

      for (const tc of testCases) {
        const solved = solveRequiredStepUpSIP(tc.shortfall, tc.tenureMonths, tc.r, tc.s);
        const sim = calculateSIP({
          monthlyInvestment: solved,
          tenureMonths: tc.tenureMonths,
          annualReturnPercent: tc.r,
          annualStepUpPercent: tc.s,
        });
        expect(sim.futureValue).toBeCloseTo(tc.shortfall, 1);
      }
    });
  });
});
