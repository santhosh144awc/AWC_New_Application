/**
 * Ant Wealth Creation — Central Business Profile & Compliance Configuration
 * 
 * Single authoritative source of business identity, contact details,
 * regulatory status, and de-risked legal copy.
 * 
 * GOVERNANCE RULES:
 * 1. Do NOT hardcode conflicting ARN numbers across UI components.
 * 2. ARN status is PENDING_VERIFICATION until confirmed against the official AMFI register.
 * 3. Never claim legal or regulatory approval; maintain neutral prototype notices.
 * 4. Zero fabricated testimonials or unverified customer counts.
 */

export interface BusinessProfile {
  firm: {
    name: string;
    tagline: string;
    foundingYear: string;
    experienceSince: string;
    headquarters: string;
    canonicalDomain: string;
  };
  founder: {
    fullName: string;
    shortName: string;
    credentials: string;
    designation: string;
    photoPath: string;
    quote: string;
    bio: string;
    heritage: string;
    foundingStory: string;
  };
  regulatory: {
    category: 'AMFI_REGISTERED_MFD';
    arnStatus: 'PENDING_VERIFICATION' | 'VERIFIED';
    /** 
     * ARN number is kept under PENDING_VERIFICATION internally.
     * Per Section 2A, do NOT display conflicting numbers in user-facing UI until verified.
     */
    arnNumberInternalReference: string;
    arnVerificationSourceUrl: string;
    amfiRegistrationText: string;
    sebiRIAStatusNotice: string;
    complianceReviewStatus: 'PENDING_LEGAL_REVIEW' | 'APPROVED';
  };
  contact: {
    phone: string;
    phoneDisplay: string;
    email: string;
    locationDisplay: string;
    whatsappUrl: string;
    portfolioLoginUrl: string;
  };
  disclosures: {
    mutualFundRisk: string;
    intermediaryStatement: string;
    simulationDisclaimer: string;
    prototypeNotice: string;
    copyrightText: string;
  };
}

export const BUSINESS_PROFILE: BusinessProfile = {
  firm: {
    name: "Ant Wealth Creation",
    tagline: "Make Better Money Decisions. Build a Better Future.",
    foundingYear: "2023",
    experienceSince: "2012",
    headquarters: "Dharmapuri, Tamil Nadu, India",
    canonicalDomain: "https://antwealth.in",
  },
  founder: {
    fullName: "C. Santhosh Sathriyan, B.E.",
    shortName: "Santhosh",
    credentials: "QPFP Certified | AMFI-Registered MFD",
    designation: "Founder & AMFI-Registered Mutual Fund Distributor",
    photoPath: "/assets/santhosh_photo.webp",
    quote: "My goal is simple — to help everyday Indian families make better financial decisions and build lasting wealth with peace of mind.",
    bio: "With experience in Indian financial markets since 2012, Santhosh helps families systematically plan for real-life milestones through disciplined, goal-oriented mutual fund investing, sensible risk protection, and debt management.",
    heritage: "Raised in a family with deep roots in financial protection through his father's decades of dedicated service at LIC, Santhosh witnessed firsthand how disciplined savings and risk cover protect families during life's most vulnerable transitions.",
    foundingStory: "In 2023, Santhosh formally established Ant Wealth Creation with a transparent, client-first philosophy: making personal financial planning approachable, simple, and devoid of opaque sales pressure or fear-based marketing."
  },
  regulatory: {
    category: 'AMFI_REGISTERED_MFD',
    arnStatus: 'PENDING_VERIFICATION',
    arnNumberInternalReference: 'ARN-266896', // Recorded from legacy docs, pending official AMFI lookup
    arnVerificationSourceUrl: 'https://www.amfiindia.com/locate-distributor',
    amfiRegistrationText: "AMFI-Registered Mutual Fund Distributor (ARN verification pending registry confirmation)",
    sebiRIAStatusNotice: "Ant Wealth Creation operates strictly as an AMFI-Registered Mutual Fund Distributor and does not offer fee-based investment advisory services under SEBI (Investment Advisers) Regulations.",
    complianceReviewStatus: 'PENDING_LEGAL_REVIEW'
  },
  contact: {
    phone: "+918087971566",
    phoneDisplay: "+91 80879 71566",
    email: "santhosh@antwealth.in",
    locationDisplay: "Dharmapuri, Tamil Nadu, India",
    whatsappUrl: "https://wa.me/918087971566?text=Hi%20Santhosh,%20I%20would%20like%20to%20discuss%20my%20family%20financial%20goals.",
    portfolioLoginUrl: "https://antwealth.themfbox.com/",
  },
  disclosures: {
    mutualFundRisk: "Mutual Fund investments are subject to market risks, read all scheme related documents carefully.",
    intermediaryStatement: "Ant Wealth Creation is an AMFI-Registered Mutual Fund Distributor. Information, calculators, and educational content on this website are provided for personal financial simulation and planning purposes only and do not constitute fee-based investment advice or guaranteed return forecasts under SEBI (Investment Advisers) Regulations. Commissions received from Asset Management Companies (AMCs) for mutual fund distribution are disclosed in accordance with regulatory requirements.",
    simulationDisclaimer: "All calculations, charts, and projections displayed are purely illustrative mathematical simulations based on user-entered inputs and assumed parameters. Projected values are not guaranteed and will fluctuate with market realities.",
    prototypeNotice: "Notice: This application is in staging development. All statutory registrations and legal copy are subject to professional compliance verification prior to production launch.",
    copyrightText: `© ${new Date().getFullYear()} Ant Wealth Creation. All Rights Reserved.`
  }
};
