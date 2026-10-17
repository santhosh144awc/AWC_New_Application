/**
 * Ant Wealth Creation — Tax Domain Engine (Reserved)
 * 
 * ARCHITECTURAL CONTRACT:
 * 1. This folder contains PURE TypeScript tax rules versioned strictly by Tax Year and Act.
 * 2. Absolutely NO hardcoded one-line section substitutions throughout UI components.
 * 3. All statutory section numbers, rates, slabs, and thresholds must originate from this central module.
 * 
 * LEGISLATIVE CONTEXT (GATE-C):
 * - Income-tax Act, 1961: Historical reference (e.g. Section 24(b) home loan interest, Section 112A LTCG).
 * - Income-tax Act, 2025: Effective from 1 April 2026 (e.g. Section 22 deductions, Section 130 home loan interest, Section 198 LTCG).
 * - Transitional regime: Requires professional chartered accountant / legal review before active production use.
 * 
 * GATE STATUS:
 * - GATE-C (Tax Sections & Current-Law Versioning): BLOCKED. Awaiting professional tax review.
 * 
 * No tax calculations are implemented during Phase 3 (Foundation).
 */

export type TaxAct = 'IT_ACT_1961' | 'IT_ACT_2025';

export interface TaxRuleVersion {
  act: TaxAct;
  assessmentYear: string;
  effectiveDate: string;
  professionalReviewStatus: 'PENDING_REVIEW' | 'VERIFIED';
  reviewedBy?: string;
  reviewDate?: string;
  officialReferences: string[];
}

export const CENTRAL_TAX_RULES_REGISTRY: Record<string, TaxRuleVersion> = {
  'AY_2026_27_TRANSITIONAL': {
    act: 'IT_ACT_2025',
    assessmentYear: '2026-27',
    effectiveDate: '2026-04-01',
    professionalReviewStatus: 'PENDING_REVIEW',
    officialReferences: [
      'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2248005',
      'https://www.incometaxindia.gov.in/w/section-22-211',
      'https://wmstatic-prd.incometaxindia.gov.in/web/guest/w/section-130-90',
      'https://wmstatic-prd.incometaxindia.gov.in/web/guest/w/section-198-76',
      'https://www.incometaxindia.gov.in/documents/81799/11848482/FAQs-on-Interplay-and-Transition.pdf'
    ]
  }
};
