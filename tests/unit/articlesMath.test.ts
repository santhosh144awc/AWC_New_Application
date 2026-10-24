import { describe, it, expect } from 'vitest';

/**
 * Independent financial mathematics verification for editorial article illustrations.
 * 
 * NOTE: As required by Section 3.1 and 3.2, this suite implements pure independent closed-form
 * mathematical formulas directly within the test to verify the editorial claims, WITHOUT importing
 * or relying on the application's domain/finance calculator engines.
 */

describe('Editorial Articles Mathematical Accuracy Verification', () => {
  // Independent geometric monthly rate helper: r = (1 + EAR)^(1/12) - 1
  function independentMonthlyRate(earPercent: number): number {
    return Math.pow(1 + earPercent / 100, 1 / 12) - 1;
  }

  // Independent annuity-due future value: FV = PMT * ((1+r)^N - 1) / r * (1 + r)
  function independentAnnuityDueFV(pmt: number, months: number, earPercent: number): number {
    const r = independentMonthlyRate(earPercent);
    const compoundFactor = Math.pow(1 + earPercent / 100, months / 12);
    return pmt * ((compoundFactor - 1) / r) * (1 + r);
  }

  // Independent annuity-due required installment: PMT = FV * r / (((1+r)^N - 1) * (1 + r))
  function independentRequiredSIP(targetFV: number, months: number, earPercent: number): number {
    const r = independentMonthlyRate(earPercent);
    const compoundFactor = Math.pow(1 + earPercent / 100, months / 12);
    return (targetFV * r) / ((compoundFactor - 1) * (1 + r));
  }

  // Independent lump sum future value: FV = PV * (1 + inflation)^years
  function independentCostInflation(costToday: number, years: number, inflationPercent: number): number {
    return costToday * Math.pow(1 + inflationPercent / 100, years);
  }

  describe('3.1 SIP Article (what-is-sip-and-how-does-it-work.md)', () => {
    it('matches exact ₹10,000/mo for 15y at 12% EAR beginning-of-month convention', () => {
      const pmt = 10000;
      const months = 180;
      const ear = 12;

      const totalInvested = pmt * months;
      const futureValue = independentAnnuityDueFV(pmt, months, ear);
      const roundedFV = Math.round(futureValue);
      const totalGain = roundedFV - totalInvested;

      expect(totalInvested).toBe(1800000);
      expect(roundedFV).toBe(4759314);
      expect(totalGain).toBe(2959314);
    });
  });

  describe('3.2 Future-Goal Article (how-much-should-you-save-for-a-future-goal.md)', () => {
    const target = 5000000;

    it('derives 15-year goal SIP at 12% EAR as ₹10,506/month', () => {
      const requiredSIP = independentRequiredSIP(target, 180, 12);
      expect(Math.round(requiredSIP)).toBe(10506);
    });

    it('derives 10-year goal SIP at 12% EAR as ₹22,318/month', () => {
      const requiredSIP = independentRequiredSIP(target, 120, 12);
      expect(Math.round(requiredSIP)).toBe(22318);
    });

    it('derives 5-year goal SIP at 10% EAR as ₹64,791/month', () => {
      const requiredSIP = independentRequiredSIP(target, 60, 10);
      expect(Math.round(requiredSIP)).toBe(64791);
    });
  });

  describe('3.3 Children Education Article (how-to-plan-for-your-childs-education.md)', () => {
    it('derives 15-year education inflation bounds as ₹63.4 Lakh to ₹83.5 Lakh from ₹20 Lakh', () => {
      const baseCost = 2000000; // ₹20 Lakh
      const horizonYears = 15;

      const costAt8Percent = independentCostInflation(baseCost, horizonYears, 8);
      const costAt10Percent = independentCostInflation(baseCost, horizonYears, 10);

      // Verify bounds in Lakhs (1 Lakh = 100,000)
      const costInLakhs8 = costAt8Percent / 100000;
      const costInLakhs10 = costAt10Percent / 100000;

      expect(costInLakhs8).toBeCloseTo(63.44, 1);
      expect(costInLakhs10).toBeCloseTo(83.54, 1);

      // Ensure rounded representation is exactly 63.4 to 83.5 Lakh
      expect((costInLakhs8).toFixed(1)).toBe('63.4');
      expect((costInLakhs10).toFixed(1)).toBe('83.5');
    });
  });
});
