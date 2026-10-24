import { describe, it, expect } from 'vitest';
import { calculateSIPGrowth, type SipGrowthInput } from '../../src/domain/finance/sipGrowth';
import { calculateSIP } from '../../src/domain/finance/sip';
import { FinanceValidationError } from '../../src/domain/finance/errors';

describe('Advanced SIP Growth Engine (calculateSIPGrowth)', () => {
  describe('1. Authoritative Registered Vectors (VEC-GROWTH-1 to VEC-GROWTH-4)', () => {
    it('VEC-GROWTH-1: verifies cross-engine equivalence with basic step-up SIP', () => {
      // Inputs: P = 10,000/mo, 2 years SIP, 10% step-up, cap = 2y, 12% EAR, 0 post-SIP years, no lump sums
      // Recurrence: Months 1–12 at 10,000; Months 13–24 at 11,000
      // Independent closed form: Sum_{m=1..24} [P_m * (1+i)^(25-m)], where i = (1.12)^(1/12) - 1
      const result = calculateSIPGrowth({
        monthlySIP: 10000,
        sipDurationYears: 2,
        stepUpPercent: 10,
        stepUpDurationYears: 2,
        annualReturnPercent: 12,
        postSipYears: 0,
        lumpSums: [],
      });

      expect(result.totalSIPInvested).toBe(252000);
      expect(result.totalLumpSumsInvested).toBe(0);
      expect(result.totalInvested).toBe(252000);
      expect(result.finalCorpus).toBeCloseTo(283416.2536, 2);
      expect(result.totalGrowth).toBeCloseTo(31416.2536, 2);
      expect(result.yearlySchedule[0].sipContributions).toBe(120000);
      expect(result.yearlySchedule[1].sipContributions).toBe(132000);
    });

    it('VEC-GROWTH-2: verifies zero-return principal conservation with capped step-up and post-SIP lump sums', () => {
      // Inputs:
      // monthlySIP = 10,000, sipYears = 5, stepUp = 10%, stepUpYears = 3, return = 0%, postSipYears = 3
      // lumpSums: [Year 1: 50,000, Year 6: 100,000]
      //
      // Independent derivation:
      // Year 1 (Months 1–12):  12 * 10,000 = 120,000
      // Year 2 (Months 13–24): 12 * 11,000 = 132,000 (10% step-up)
      // Year 3 (Months 25–36): 12 * 12,100 = 145,200 (10% step-up)
      // Year 4 (Months 37–48): 12 * 12,100 = 145,200 (capped at Year 3 installment)
      // Year 5 (Months 49–60): 12 * 12,100 = 145,200 (capped at Year 3 installment)
      // Total SIP contributions = 120,000 + 132,000 + 145,200 + 145,200 + 145,200 = 687,600
      //
      // Post-SIP Years 6, 7, 8: SIP contributions = 0
      // Lump Sums: Year 1 = 50,000; Year 6 = 100,000; Total Lump Sums = 150,000
      // Total Invested = 687,600 + 150,000 = 837,600
      // At 0% return: Final Corpus = 837,600, Total Growth = 0
      const result = calculateSIPGrowth({
        monthlySIP: 10000,
        sipDurationYears: 5,
        stepUpPercent: 10,
        stepUpDurationYears: 3,
        annualReturnPercent: 0,
        postSipYears: 3,
        lumpSums: [
          { year: 1, amount: 50000 },
          { year: 6, amount: 100000 },
        ],
      });

      expect(result.totalSIPInvested).toBeCloseTo(687600, 4);
      expect(result.totalLumpSumsInvested).toBe(150000);
      expect(result.totalInvested).toBeCloseTo(837600, 4);
      expect(result.finalCorpus).toBeCloseTo(837600, 4);
      expect(result.totalGrowth).toBe(0);

      // Verify exact schedule row by row
      expect(result.yearlySchedule).toHaveLength(8);

      // Year 1
      expect(result.yearlySchedule[0].sipContributions).toBe(120000);
      expect(result.yearlySchedule[0].lumpSumContributions).toBe(50000);
      expect(result.yearlySchedule[0].closingBalance).toBe(170000);

      // Year 2
      expect(result.yearlySchedule[1].sipContributions).toBe(132000);
      expect(result.yearlySchedule[1].lumpSumContributions).toBe(0);
      expect(result.yearlySchedule[1].closingBalance).toBe(302000);

      // Year 3
      expect(result.yearlySchedule[2].sipContributions).toBeCloseTo(145200, 4);
      expect(result.yearlySchedule[2].lumpSumContributions).toBe(0);
      expect(result.yearlySchedule[2].closingBalance).toBeCloseTo(447200, 4);

      // Year 4 (Capped at Year 3)
      expect(result.yearlySchedule[3].sipContributions).toBeCloseTo(145200, 4);
      expect(result.yearlySchedule[3].lumpSumContributions).toBe(0);
      expect(result.yearlySchedule[3].closingBalance).toBeCloseTo(592400, 4);

      // Year 5 (Capped at Year 3)
      expect(result.yearlySchedule[4].sipContributions).toBeCloseTo(145200, 4);
      expect(result.yearlySchedule[4].lumpSumContributions).toBe(0);
      expect(result.yearlySchedule[4].closingBalance).toBeCloseTo(737600, 4);

      // Year 6 (Post-SIP with Lump Sum)
      expect(result.yearlySchedule[5].isSipActive).toBe(false);
      expect(result.yearlySchedule[5].sipContributions).toBe(0);
      expect(result.yearlySchedule[5].lumpSumContributions).toBe(100000);
      expect(result.yearlySchedule[5].closingBalance).toBeCloseTo(837600, 4);

      // Year 7 (Post-SIP Holding)
      expect(result.yearlySchedule[6].isSipActive).toBe(false);
      expect(result.yearlySchedule[6].sipContributions).toBe(0);
      expect(result.yearlySchedule[6].lumpSumContributions).toBe(0);
      expect(result.yearlySchedule[6].closingBalance).toBeCloseTo(837600, 4);

      // Year 8 (Post-SIP Holding)
      expect(result.yearlySchedule[7].isSipActive).toBe(false);
      expect(result.yearlySchedule[7].sipContributions).toBe(0);
      expect(result.yearlySchedule[7].lumpSumContributions).toBe(0);
      expect(result.yearlySchedule[7].closingBalance).toBeCloseTo(837600, 4);
    });

    it('VEC-GROWTH-3: verifies lump-sum only compounding through multi-year holding horizon', () => {
      // Inputs: monthlySIP = 0, sipYears = 1, stepUp = 0%, cap = 1, return = 12% EAR, postSipYears = 4
      // lumpSums: [Year 1: 100,000]
      // Independent formula: FV = 100,000 * (1.12)^5 = 1,76,234.16832
      const result = calculateSIPGrowth({
        monthlySIP: 0,
        sipDurationYears: 1,
        stepUpPercent: 0,
        stepUpDurationYears: 1,
        annualReturnPercent: 12,
        postSipYears: 4,
        lumpSums: [{ year: 1, amount: 100000 }],
      });

      expect(result.totalSIPInvested).toBe(0);
      expect(result.totalLumpSumsInvested).toBe(100000);
      expect(result.totalInvested).toBe(100000);
      expect(result.finalCorpus).toBeCloseTo(176234.1683, 2);
      expect(result.totalGrowth).toBeCloseTo(76234.1683, 2);
    });

    it('VEC-GROWTH-4: verifies 2-year step-up cap and 2-year post-SIP holding horizon compounding', () => {
      // Inputs:
      // monthlySIP = 10,000, sipYears = 5, stepUp = 10%, stepUpYears = 2, return = 12% EAR, postSipYears = 2, lumpSums = []
      //
      // Independent derivation:
      // Year 1 (Months 1–12):  12 * 10,000 = 120,000
      // Year 2 (Months 13–24): 12 * 11,000 = 132,000 (10% step-up applied at Month 13)
      // Year 3 (Months 25–36): 12 * 11,000 = 132,000 (CAPPED at Year 2 installment)
      // Year 4 (Months 37–48): 12 * 11,000 = 132,000 (CAPPED at Year 2 installment)
      // Year 5 (Months 49–60): 12 * 11,000 = 132,000 (CAPPED at Year 2 installment)
      // Total SIP contributions = 120,000 + 4 * 132,000 = 648,000
      //
      // Post-SIP Years 6 & 7 (Months 61–84): SIP contributions = 0
      // Total Invested = 648,000
      //
      // Monthly EAR rate: i = (1.12)^(1/12) - 1 ≈ 0.009488792934583046
      // Under beginning-of-month deposits for m = 1..60 (10k for 1..12, 11k for 13..60)
      // and monthly compounding for 84 total months:
      // Final Corpus ≈ 10,93,901.2840
      // Estimated Gain ≈ 4,45,901.2840
      const result = calculateSIPGrowth({
        monthlySIP: 10000,
        sipDurationYears: 5,
        stepUpPercent: 10,
        stepUpDurationYears: 2,
        annualReturnPercent: 12,
        postSipYears: 2,
        lumpSums: [],
      });

      expect(result.totalSIPInvested).toBe(648000);
      expect(result.totalLumpSumsInvested).toBe(0);
      expect(result.totalInvested).toBe(648000);
      expect(result.finalCorpus).toBeCloseTo(1093901.284, 2);
      expect(result.totalGrowth).toBeCloseTo(445901.284, 2);

      // Verify yearly schedule contributions
      expect(result.yearlySchedule).toHaveLength(7);
      expect(result.yearlySchedule[0].sipContributions).toBe(120000); // Y1: 10k/mo
      expect(result.yearlySchedule[1].sipContributions).toBe(132000); // Y2: 11k/mo
      expect(result.yearlySchedule[2].sipContributions).toBe(132000); // Y3: capped at 11k/mo
      expect(result.yearlySchedule[3].sipContributions).toBe(132000); // Y4: capped at 11k/mo
      expect(result.yearlySchedule[4].sipContributions).toBe(132000); // Y5: capped at 11k/mo
      expect(result.yearlySchedule[5].sipContributions).toBe(0);      // Y6: post-SIP
      expect(result.yearlySchedule[6].sipContributions).toBe(0);      // Y7: post-SIP

      // Fails if cap was accidentally 3 years (which would make Y3 contributions 145,200)
      expect(result.yearlySchedule[2].sipContributions).not.toBe(145200);

      // Fails if contributions continued into Year 6
      expect(result.yearlySchedule[5].sipContributions).toBe(0);
    });
  });

  describe('2. Cross-Engine Equivalence with Pure SIP', () => {
    it('produces identical results to calculateSIP for fixed SIP (no step-up, no lump sums, no post-SIP)', () => {
      const growthResult = calculateSIPGrowth({
        monthlySIP: 10000,
        sipDurationYears: 10,
        stepUpPercent: 0,
        annualReturnPercent: 12,
        postSipYears: 0,
        lumpSums: [],
      });

      const pureResult = calculateSIP({
        monthlyInvestment: 10000,
        tenureMonths: 120,
        annualReturnPercent: 12,
        annualStepUpPercent: 0,
        generateSchedule: true,
      });

      expect(growthResult.totalSIPInvested).toBe(pureResult.totalInvested);
      expect(growthResult.totalInvested).toBe(pureResult.totalInvested);
      expect(growthResult.finalCorpus).toBeCloseTo(pureResult.futureValue, 6);
      expect(growthResult.totalGrowth).toBeCloseTo(pureResult.totalGain, 6);
    });

    it('produces identical results to calculateSIP for fully stepped-up SIP across tenure', () => {
      const growthResult = calculateSIPGrowth({
        monthlySIP: 10000,
        sipDurationYears: 5,
        stepUpPercent: 10,
        stepUpDurationYears: 5,
        annualReturnPercent: 12,
        postSipYears: 0,
        lumpSums: [],
      });

      const pureResult = calculateSIP({
        monthlyInvestment: 10000,
        tenureMonths: 60,
        annualReturnPercent: 12,
        annualStepUpPercent: 10,
        generateSchedule: true,
      });

      expect(growthResult.totalSIPInvested).toBe(pureResult.totalInvested);
      expect(growthResult.finalCorpus).toBeCloseTo(pureResult.futureValue, 6);
      expect(growthResult.totalGrowth).toBeCloseTo(pureResult.totalGain, 6);
    });
  });

  describe('3. Annual Step-Up Timing & Capping Boundaries', () => {
    it('maintains constant installment throughout Year 1 (Months 1–12) and steps up at Month 13', () => {
      const result = calculateSIPGrowth({
        monthlySIP: 10000,
        sipDurationYears: 2,
        stepUpPercent: 10,
        annualReturnPercent: 0,
      });

      expect(result.yearlySchedule[0].sipContributions).toBe(120000); // 12 * 10,000
      expect(result.yearlySchedule[1].sipContributions).toBe(132000); // 12 * 11,000
      expect(result.totalSIPInvested).toBe(252000);
    });

    it('freezes monthly contribution after stepUpDurationYears cap is reached', () => {
      const result = calculateSIPGrowth({
        monthlySIP: 10000,
        sipDurationYears: 5,
        stepUpPercent: 10,
        stepUpDurationYears: 3, // Capped at Year 3
        annualReturnPercent: 0,
      });

      expect(result.yearlySchedule[0].sipContributions).toBe(120000); // Y1: 10k/mo
      expect(result.yearlySchedule[1].sipContributions).toBe(132000); // Y2: 11k/mo
      expect(result.yearlySchedule[2].sipContributions).toBeCloseTo(145200, 4); // Y3: 12.1k/mo
      expect(result.yearlySchedule[3].sipContributions).toBeCloseTo(145200, 4); // Y4: 12.1k/mo (Capped)
      expect(result.yearlySchedule[4].sipContributions).toBeCloseTo(145200, 4); // Y5: 12.1k/mo (Capped)
      expect(result.totalSIPInvested).toBeCloseTo(687600, 4);
    });
  });

  describe('4. One-Time Investment Timing & Aggregation', () => {
    it('invests lump sum at the beginning of the specified year and compounds for remaining horizon', () => {
      // 5-year projection, ₹1,00,000 added in Year 3 at 10% EAR (compounds for 3 full years: Y3, Y4, Y5)
      // Independent formula: 100000 * (1.10)^3 = 1,33,100
      const result = calculateSIPGrowth({
        monthlySIP: 0,
        sipDurationYears: 5,
        annualReturnPercent: 10,
        lumpSums: [{ year: 3, amount: 100000 }],
      });

      expect(result.yearlySchedule[0].openingBalance).toBe(0);
      expect(result.yearlySchedule[1].closingBalance).toBe(0);
      expect(result.yearlySchedule[2].lumpSumContributions).toBe(100000);
      expect(result.yearlySchedule[2].closingBalance).toBeCloseTo(110000, 4); // 100k * 1.10
      expect(result.yearlySchedule[3].closingBalance).toBeCloseTo(121000, 4); // 110k * 1.10
      expect(result.yearlySchedule[4].closingBalance).toBeCloseTo(133100, 4); // 121k * 1.10
      expect(result.finalCorpus).toBeCloseTo(133100, 4);
    });

    it('correctly aggregates multiple lump sums in different years and within the same year', () => {
      const result = calculateSIPGrowth({
        monthlySIP: 0,
        sipDurationYears: 3,
        annualReturnPercent: 0,
        lumpSums: [
          { year: 1, amount: 25000 },
          { year: 1, amount: 75000 },
          { year: 2, amount: 50000 },
        ],
      });

      expect(result.yearlySchedule[0].lumpSumContributions).toBe(100000);
      expect(result.yearlySchedule[1].lumpSumContributions).toBe(50000);
      expect(result.yearlySchedule[2].lumpSumContributions).toBe(0);
      expect(result.totalLumpSumsInvested).toBe(150000);
      expect(result.finalCorpus).toBe(150000);
    });
  });

  describe('5. Post-SIP Holding Period Dynamics', () => {
    it('stops SIP contributions at end of sipDurationYears while accumulated corpus continues monthly compounding', () => {
      // 5-year SIP at 12% EAR, followed by 3-year post-SIP holding
      const sipOnlyResult = calculateSIPGrowth({
        monthlySIP: 10000,
        sipDurationYears: 5,
        stepUpPercent: 0,
        annualReturnPercent: 12,
        postSipYears: 0,
      });

      const holdingResult = calculateSIPGrowth({
        monthlySIP: 10000,
        sipDurationYears: 5,
        stepUpPercent: 0,
        annualReturnPercent: 12,
        postSipYears: 3,
      });

      expect(holdingResult.totalSIPInvested).toBe(sipOnlyResult.totalSIPInvested);
      expect(holdingResult.totalProjectionYears).toBe(8);

      // Verify that SIP was inactive during holding years (Years 6, 7, 8)
      expect(holdingResult.yearlySchedule[5].isSipActive).toBe(false);
      expect(holdingResult.yearlySchedule[5].sipContributions).toBe(0);
      expect(holdingResult.yearlySchedule[6].isSipActive).toBe(false);
      expect(holdingResult.yearlySchedule[6].sipContributions).toBe(0);
      expect(holdingResult.yearlySchedule[7].isSipActive).toBe(false);
      expect(holdingResult.yearlySchedule[7].sipContributions).toBe(0);

      // Balance at Year 8 = Balance at Year 5 * (1 + 0.12)^3
      const expectedFV8 = sipOnlyResult.finalCorpus * Math.pow(1.12, 3);
      expect(holdingResult.finalCorpus).toBeCloseTo(expectedFV8, 4);
    });

    it('permits scheduling a one-time investment during the post-SIP holding period', () => {
      const result = calculateSIPGrowth({
        monthlySIP: 10000,
        sipDurationYears: 5,
        annualReturnPercent: 10,
        postSipYears: 3,
        lumpSums: [{ year: 7, amount: 200000 }], // Injected in Year 7 (during post-SIP)
      });

      expect(result.yearlySchedule[6].lumpSumContributions).toBe(200000);
      expect(result.yearlySchedule[6].isSipActive).toBe(false);
      expect(result.yearlySchedule[6].sipContributions).toBe(0);
    });
  });

  describe('6. Input Invariants & Schedule Integrity', () => {
    it('guarantees totalInvested + totalGrowth === finalCorpus across all schedules', () => {
      const result = calculateSIPGrowth({
        monthlySIP: 8000,
        sipDurationYears: 7,
        stepUpPercent: 5,
        stepUpDurationYears: 4,
        annualReturnPercent: 11.5,
        postSipYears: 3,
        lumpSums: [
          { year: 2, amount: 50000 },
          { year: 6, amount: 100000 },
        ],
      });

      expect(result.totalInvested + result.totalGrowth).toBeCloseTo(result.finalCorpus, 6);

      const lastRow = result.yearlySchedule[result.yearlySchedule.length - 1];
      expect(lastRow.closingBalance).toBeCloseTo(result.finalCorpus, 6);
      expect(lastRow.cumulativeContributions).toBe(result.totalInvested);
      expect(lastRow.cumulativeGrowth).toBeCloseTo(result.totalGrowth, 6);
    });

    it('does not mutate input parameters or arrays', () => {
      const inputLumpSums = [{ year: 2, amount: 50000 }];
      const inputObj: SipGrowthInput = {
        monthlySIP: 10000,
        sipDurationYears: 5,
        annualReturnPercent: 12,
        lumpSums: inputLumpSums,
      };

      const originalJson = JSON.stringify(inputObj);
      calculateSIPGrowth(inputObj);
      expect(JSON.stringify(inputObj)).toBe(originalJson);
    });
  });

  describe('7. Parameter Boundaries & Duration Limits (Section 5)', () => {
    const validBase: SipGrowthInput = {
      monthlySIP: 10000,
      sipDurationYears: 10,
      annualReturnPercent: 12,
    };

    it('permits valid boundary values: 1 to 40 SIP years, 0 to 30 post-SIP years, up to 70 total years', () => {
      // 1 year minimum SIP duration
      const res1 = calculateSIPGrowth({ ...validBase, sipDurationYears: 1, postSipYears: 0 });
      expect(res1.sipDurationYears).toBe(1);
      expect(res1.totalProjectionYears).toBe(1);

      // 40 years maximum SIP duration with 0 post-SIP years
      const res40 = calculateSIPGrowth({ ...validBase, sipDurationYears: 40, postSipYears: 0 });
      expect(res40.sipDurationYears).toBe(40);
      expect(res40.totalProjectionYears).toBe(40);

      // Maximum combined horizon: 40-year SIP + 30-year post-SIP holding = 70 years
      const res70 = calculateSIPGrowth({ ...validBase, sipDurationYears: 40, postSipYears: 30 });
      expect(res70.sipDurationYears).toBe(40);
      expect(res70.postSipYears).toBe(30);
      expect(res70.totalProjectionYears).toBe(70);
      expect(res70.yearlySchedule).toHaveLength(70);
    });

    it('rejects sipDurationYears outside 1 to 40 years', () => {
      expect(() => calculateSIPGrowth({ ...validBase, sipDurationYears: 0 })).toThrow(FinanceValidationError);
      expect(() => calculateSIPGrowth({ ...validBase, sipDurationYears: -1 })).toThrow(FinanceValidationError);
      expect(() => calculateSIPGrowth({ ...validBase, sipDurationYears: 41 })).toThrow(FinanceValidationError);
      expect(() => calculateSIPGrowth({ ...validBase, sipDurationYears: 10.5 })).toThrow(FinanceValidationError);
      expect(() => calculateSIPGrowth({ ...validBase, sipDurationYears: NaN })).toThrow(FinanceValidationError);
      expect(() => calculateSIPGrowth({ ...validBase, sipDurationYears: Infinity })).toThrow(FinanceValidationError);
    });

    it('rejects postSipYears outside 0 to 30 years', () => {
      expect(() => calculateSIPGrowth({ ...validBase, postSipYears: -1 })).toThrow(FinanceValidationError);
      expect(() => calculateSIPGrowth({ ...validBase, postSipYears: 31 })).toThrow(FinanceValidationError);
      expect(() => calculateSIPGrowth({ ...validBase, postSipYears: 2.5 })).toThrow(FinanceValidationError);
      expect(() => calculateSIPGrowth({ ...validBase, postSipYears: NaN })).toThrow(FinanceValidationError);
    });

    it('rejects stepUpDurationYears outside 1 to sipDurationYears', () => {
      expect(() => calculateSIPGrowth({ ...validBase, sipDurationYears: 10, stepUpDurationYears: 0 })).toThrow(
        FinanceValidationError
      );
      expect(() => calculateSIPGrowth({ ...validBase, sipDurationYears: 10, stepUpDurationYears: 11 })).toThrow(
        FinanceValidationError
      );
      expect(() => calculateSIPGrowth({ ...validBase, sipDurationYears: 10, stepUpDurationYears: 3.5 })).toThrow(
        FinanceValidationError
      );
    });

    it('rejects lump sums with year outside total projection horizon', () => {
      // Horizon is 10 years (10y SIP + 0y post-SIP)
      expect(() =>
        calculateSIPGrowth({ ...validBase, sipDurationYears: 10, postSipYears: 0, lumpSums: [{ year: 11, amount: 50000 }] })
      ).toThrow(FinanceValidationError);

      // Lump sum year < 1
      expect(() =>
        calculateSIPGrowth({ ...validBase, lumpSums: [{ year: 0, amount: 50000 }] })
      ).toThrow(FinanceValidationError);

      // Non-integer lump sum year
      expect(() =>
        calculateSIPGrowth({ ...validBase, lumpSums: [{ year: 2.5, amount: 50000 }] })
      ).toThrow(FinanceValidationError);
    });

    it('rejects negative or non-finite monthlySIP', () => {
      expect(() => calculateSIPGrowth({ ...validBase, monthlySIP: -500 })).toThrow(FinanceValidationError);
      expect(() => calculateSIPGrowth({ ...validBase, monthlySIP: NaN })).toThrow(FinanceValidationError);
      expect(() => calculateSIPGrowth({ ...validBase, monthlySIP: Infinity })).toThrow(FinanceValidationError);
    });

    it('rejects return rates outside 0%–100% EAR contract', () => {
      expect(() => calculateSIPGrowth({ ...validBase, annualReturnPercent: -0.1 })).toThrow(FinanceValidationError);
      expect(() => calculateSIPGrowth({ ...validBase, annualReturnPercent: 101 })).toThrow(FinanceValidationError);
      expect(() => calculateSIPGrowth({ ...validBase, annualReturnPercent: NaN })).toThrow(FinanceValidationError);
    });

    it('rejects scenario when both monthlySIP is 0 and no lump sums are provided', () => {
      expect(() =>
        calculateSIPGrowth({ ...validBase, monthlySIP: 0, lumpSums: [] })
      ).toThrow(FinanceValidationError);
    });
  });
});
