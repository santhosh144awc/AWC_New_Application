/**
 * Ant Wealth Creation — Canonical Route & Navigation Registry
 * 
 * Single source of truth for all application routes, navigation items,
 * goal roadmaps, tool categories, and legal destinations.
 * 
 * Synchronized with:
 * - product-docs/route-audit/ROUTE_FEATURE_ENGINE_MATRIX.csv
 * - product-docs/route-audit/ROUTE_RECONCILIATION_REPORT.md
 */

export interface NavRoute {
  id: string;
  label: string;
  path: string;
  description: string;
  category?: 'core' | 'goal' | 'tool' | 'content' | 'legal' | 'contact';
  eyebrow?: string;
  statusBadge?: string;
}

export const TOP_NAV_ROUTES: NavRoute[] = [
  {
    id: 'nav-home',
    label: 'Home',
    path: '/',
    description: 'The Family Money Map Gateway and orientation portal.',
    category: 'core',
  },
  {
    id: 'nav-health-check',
    label: 'Financial Health',
    path: '/health-check/',
    description: '2-Minute 7-Pillar Family Financial Health Diagnostic.',
    category: 'core',
  },
  {
    id: 'nav-plan',
    label: 'Plan a Goal',
    path: '/plan/',
    description: 'Life milestone roadmaps for education, home, and retirement.',
    category: 'goal',
  },
  {
    id: 'nav-tools',
    label: 'Tools',
    path: '/tools/',
    description: 'Practical question-driven financial simulators and calculators.',
    category: 'tool',
  },
  {
    id: 'nav-learn',
    label: 'Learn',
    path: '/learn/',
    description: 'Jargon-free personal finance educational guides for Indian families.',
    category: 'content',
  },
  {
    id: 'nav-about',
    label: 'About',
    path: '/about/',
    description: 'Founder story, QPFP credentials, LIC heritage, and advisory philosophy.',
    category: 'core',
  },
];

export const GOAL_ROUTES: NavRoute[] = [
  {
    id: 'goal-children',
    label: "Children's Future",
    path: '/plan/children/',
    description: "Inflation-adjusted funding roadmap for your child's higher education and marriage.",
    category: 'goal',
    eyebrow: '10–18 Years Horizon',
    statusBadge: 'Shell Active • Math In Development',
  },
  {
    id: 'goal-home',
    label: 'Home Purchase',
    path: '/plan/home-purchase/',
    description: 'Plan your down payment accumulation, 10% acquisition buffer, and safe EMI limits.',
    category: 'goal',
    eyebrow: '3–8 Years Horizon',
    statusBadge: 'Shell Active • Tax Review Required',
  },
  {
    id: 'goal-retirement',
    label: 'Retirement Accumulation',
    path: '/plan/retirement/',
    description: 'Systematic roadmap to accumulate an inflation-protected lifelong retirement corpus.',
    category: 'goal',
    eyebrow: '15–30 Years Horizon',
    statusBadge: 'Shell Active • GATE-A Blocked',
  },
  {
    id: 'goal-retirement-income',
    label: 'Retirement Regular Income',
    path: '/plan/retirement-income/',
    description: 'Three-bucket post-retirement cash flow strategy (Liquidity, Safety, Growth).',
    category: 'goal',
    eyebrow: 'Post-Retirement Horizon',
    statusBadge: 'Shell Active • Distribution Spec Blocked',
  },
];

export const TOOL_ROUTES: NavRoute[] = [
  {
    id: 'tool-sip',
    label: 'SIP Wealth Simulator',
    path: '/tools/sip/',
    description: 'Illustrate monthly mutual fund compounding and the power of annual step-ups.',
    category: 'tool',
    eyebrow: 'Investments',
    statusBadge: 'Interactive Calculator Active • Verified Math',
  },
  {
    id: 'tool-lumpsum',
    label: 'Lump Sum Investment Growth',
    path: '/tools/lumpsum/',
    description: 'Model one-time investment compounding across varying multi-year horizons.',
    category: 'tool',
    eyebrow: 'Investments',
    statusBadge: 'Shell Active • Engine In Development',
  },
  {
    id: 'tool-sip-growth',
    label: 'Advanced SIP Growth',
    path: '/tools/sip-growth/',
    description: 'Simulate multi-lump-sum inflows, capped step-ups, and extended holding periods.',
    category: 'tool',
    eyebrow: 'Advanced Investments',
    statusBadge: 'Shell Active • Spec Review',
  },
  {
    id: 'tool-swp',
    label: 'SWP Longevity Simulator',
    path: '/tools/swp/',
    description: '50-year monthly systematic withdrawal simulation with capital depletion alerts.',
    category: 'tool',
    eyebrow: 'Cash Flow & Retirement',
    statusBadge: 'Shell Active • Engine In Development',
  },
  {
    id: 'tool-home-foreclosure',
    label: 'Home Loan Foreclosure vs SIP',
    path: '/tools/home-loan-foreclosure/',
    description: 'Compare reducing-balance loan prepayment against parallel mutual fund SIP growth.',
    category: 'tool',
    eyebrow: 'Debt Strategy',
    statusBadge: 'Shell Active • Dual-Curve Math Review',
  },
  {
    id: 'tool-loan-recovery',
    label: 'Loan Interest Recovery SIP',
    path: '/tools/loan-sip-recovery/',
    description: 'Calculate the parallel monthly SIP required to recover 100% of your loan borrowing interest.',
    category: 'tool',
    eyebrow: 'Borrowing Strategy',
    statusBadge: 'Shell Active • Engine In Development',
  },
  {
    id: 'tool-loan-vs-invest',
    label: 'Loan vs Investment Trade-off',
    path: '/tools/loan-vs-invest/',
    description: 'Side-by-side trade-off analysis between mortgage prepayment and long-term equity investing.',
    category: 'tool',
    eyebrow: 'Trade-off Analysis',
    statusBadge: 'Shell Active • GATE-C Tax Review',
  },
  {
    id: 'tool-life-insurance',
    label: 'Life Insurance Needs Audit',
    path: '/tools/life-insurance/',
    description: '5-step Needs-Based Human Life Value (HLV) calculation to uncover true family protection gaps.',
    category: 'tool',
    eyebrow: 'Family Defense',
    statusBadge: 'Shell Active • HLV Engine Review',
  },
  {
    id: 'tool-net-worth',
    label: 'Productive Net Worth Balance Sheet',
    path: '/tools/net-worth/',
    description: 'Separate personal consumption assets from productive capital to evaluate true solvency.',
    category: 'tool',
    eyebrow: 'Solvency & Diagnostics',
    statusBadge: 'Shell Active • In-Memory Only',
  },
];

export const DIAGNOSTIC_ROUTES: NavRoute[] = [
  {
    id: 'diag-health-check',
    label: '7-Pillar Health Check',
    path: '/health-check/',
    description: '2-Minute product-neutral financial health assessment.',
    category: 'core',
  },
  {
    id: 'diag-real-statement',
    label: 'REAL Financial Statement',
    path: '/health-check/real-statement/',
    description: 'In-depth diagnostic mapping income, expenses, assets, debts, and productive net worth.',
    category: 'core',
    statusBadge: 'Shell Active • Zero Storage in Shell',
  },
];

export const LEGAL_ROUTES: NavRoute[] = [
  {
    id: 'legal-disclaimer',
    label: 'Statutory Disclaimers',
    path: '/disclaimer/',
    description: 'AMFI registration notices, mutual fund market risk warnings, and non-RIA disclosure.',
    category: 'legal',
  },
  {
    id: 'legal-privacy',
    label: 'Privacy Policy',
    path: '/privacy/',
    description: 'Our commitment to zero forced lead capture and client privacy protection.',
    category: 'legal',
  },
  {
    id: 'legal-terms',
    label: 'Terms of Service',
    path: '/terms/',
    description: 'Website terms of use, educational scope, and legal jurisdiction.',
    category: 'legal',
  },
];

export const CONTACT_ROUTE: NavRoute = {
  id: 'nav-contact',
  label: 'Contact & Guidance',
  path: '/contact/',
  description: 'Dharmapuri office details, direct WhatsApp link, and 3-step consultation expectations.',
  category: 'contact',
};

/**
 * Returns all registered application routes for automated validation.
 */
export function getAllRegisteredRoutes(): NavRoute[] {
  return [
    ...TOP_NAV_ROUTES,
    ...GOAL_ROUTES.filter(r => !TOP_NAV_ROUTES.some(t => t.path === r.path)),
    ...TOOL_ROUTES.filter(r => !TOP_NAV_ROUTES.some(t => t.path === r.path)),
    DIAGNOSTIC_ROUTES[1], // /health-check/real-statement/
    ...LEGAL_ROUTES,
    CONTACT_ROUTE,
  ];
}

/**
 * Helper to generate accessible breadcrumbs based on pathname.
 */
export function getBreadcrumbsForPath(pathname: string): { label: string; href: string }[] {
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const crumbs = [{ label: 'Home', href: '/' }];

  if (normalized === '/') {
    return crumbs;
  }

  const segments = normalized.split('/').filter(Boolean);
  let accumulated = '';

  for (const segment of segments) {
    accumulated += `/${segment}`;
    const targetPath = `${accumulated}/`;
    const match = getAllRegisteredRoutes().find(r => r.path === targetPath);
    if (match) {
      crumbs.push({ label: match.label, href: match.path });
    } else {
      const formatted = segment
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      crumbs.push({ label: formatted, href: targetPath });
    }
  }

  return crumbs;
}
