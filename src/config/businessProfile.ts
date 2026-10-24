/**
 * Ant Wealth Creation — Central Business Profile & Compliance Configuration
 * 
 * Single authoritative source of business identity, contact details,
 * regulatory status, and de-risked legal copy.
 * 
 * GOVERNANCE RULES:
 * 1. Do NOT hardcode conflicting ARN numbers across UI components.
 * 2. Registration status is PENDING_REGISTRY_CONFIRMATION until officially confirmed by the project owner.
 * 3. Never assert verified AMFI registration while simultaneously stating verification is pending.
 * 4. Never claim legal or regulatory approval; maintain neutral prototype notices.
 * 5. Zero fabricated testimonials or unverified customer counts.
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
    professionalRoles: string[];
  };
  regulatory: {
    category: 'MUTUAL_FUND_DISTRIBUTION';
    arnStatus: 'CONFIRMED';
    arn: string;
    arnValidity: string;
    arnValidFrom: string;
    arnHolderOfficial: string;
    arnPin: string;
    arnCity: string;
    kydComplete: string;
    arnNumberInternalReference: string;
    arnVerificationSourceUrl: string;
    amfiRegistrationText: string;
    registrationStatusText: string;
    distributorRoleText: string;
    sebiRIAStatusNotice: string;
    soleProprietorStatement: string;
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
    soleProprietorStatement: string;
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
    credentials: "QPFP Certified | Mutual Fund Distributor",
    designation: "Founder & Mutual Fund Distributor",
    photoPath: "/assets/santhosh_photo.webp",
    quote: "My goal is simple — to help everyday Indian families make better financial decisions and build lasting wealth with peace of mind.",
    bio: "With experience in Indian financial markets since 2012, Santhosh helps families systematically plan for real-life milestones through disciplined, goal-oriented mutual fund investing, sensible risk protection, and debt management.",
    heritage: "Raised in a family with deep roots in financial protection through his father's decades of dedicated service at LIC, Santhosh witnessed firsthand how disciplined savings and risk cover protect families during life's most vulnerable transitions.",
    foundingStory: "In 2023, Santhosh formally established Ant Wealth Creation with a transparent, client-first philosophy: making personal financial planning approachable, simple, and devoid of opaque sales pressure or fear-based marketing.",
    professionalRoles: [
      "AMFI-registered Mutual Fund Distributor",
      "LIC life-insurance advisor",
      "Star Health Insurance agent"
    ]
  },
  regulatory: {
    category: 'MUTUAL_FUND_DISTRIBUTION',
    arnStatus: 'CONFIRMED',
    arn: 'ARN-266896',
    arnValidity: '16 March 2029',
    arnValidFrom: '04 March 2026',
    arnHolderOfficial: 'C Santhoshsathriyan',
    arnPin: '636701',
    arnCity: 'Dharmapuri, Tamil Nadu',
    kydComplete: 'Y',
    arnNumberInternalReference: 'ARN-266896',
    arnVerificationSourceUrl: 'https://www.amfiindia.com/locate-distributor',
    amfiRegistrationText: "AMFI-registered Mutual Fund Distributor (ARN-266896, Valid till 16 March 2029)",
    registrationStatusText: "AMFI-registered Mutual Fund Distributor (ARN-266896, Valid till 16 March 2029)",
    distributorRoleText: "AMFI-registered Mutual Fund Distributor (ARN-266896)",
    sebiRIAStatusNotice: "Ant Wealth Creation operates as an AMFI-registered Mutual Fund Distributor (ARN-266896) and does not offer fee-based investment advisory services under SEBI (Investment Advisers) Regulations. AMFI registration and public disclosure services do not mean that AMFI endorses Ant Wealth Creation or our recommendations.",
    soleProprietorStatement: "Ant Wealth Creation is a sole proprietorship operated by C. Santhosh Sathriyan. Ant Wealth Creation is not a separately incorporated company or LLP.",
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
    intermediaryStatement: "Ant Wealth Creation is a sole proprietorship operated by C. Santhosh Sathriyan, providing mutual fund distribution services as an AMFI-registered Mutual Fund Distributor (ARN-266896, valid till 16 March 2029). Information, calculators, and educational content on this website are provided for personal financial simulation and planning purposes only and do not constitute fee-based investment advice or guaranteed return forecasts under SEBI (Investment Advisers) Regulations. Trailing commissions from Asset Management Companies (AMCs) for mutual fund distribution are disclosed in accordance with regulatory requirements.",
    simulationDisclaimer: "All calculations, charts, and projections displayed are purely illustrative mathematical simulations based on user-entered inputs and assumed parameters. Projected values are not guaranteed and will fluctuate with market realities.",
    prototypeNotice: "Notice: This application is in staging development. All statutory registrations and legal copy are subject to professional compliance verification prior to production launch.",
    soleProprietorStatement: "Ant Wealth Creation is a sole proprietorship operated by C. Santhosh Sathriyan. Ant Wealth Creation is not a separately incorporated company or LLP.",
    copyrightText: `© ${new Date().getFullYear()} Ant Wealth Creation. All Rights Reserved.`
  }
};
