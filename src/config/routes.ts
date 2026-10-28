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
    label: 'Journey & Goals',
    path: '/plan/',
    description: 'Interactive financial journey and life-milestone planners for education, home, and retirement.',
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
    statusBadge: 'Interactive Planner Active • Multi-Goal Inflation',
  },
  {
    id: 'goal-home',
    label: 'Home Purchase',
    path: '/plan/home-purchase/',
    description: 'Estimate upfront purchase funds, possible acquisition costs, and loan affordability using your assumptions. Tax treatment is excluded.',
    category: 'goal',
    eyebrow: '3–8 Years Horizon',
    statusBadge: 'Interactive Planner Active • Tax Relief Excluded',
  },
  {
    id: 'goal-retirement',
    label: 'Retirement Accumulation',
    path: '/plan/retirement/',
    description: 'Systematic roadmap to accumulate an inflation-protected lifelong retirement corpus.',
    category: 'goal',
    eyebrow: '15–30 Years Horizon',
    statusBadge: 'Interactive Planner Active • 5-Step Accumulation Roadmap',
  },
  {
    id: 'goal-retirement-income',
    label: 'Retirement Regular Income',
    path: '/plan/retirement-income/',
    description: 'Three-bucket post-retirement cash flow strategy (Liquidity, Safety, Growth).',
    category: 'goal',
    eyebrow: 'Post-Retirement Horizon',
    statusBadge: 'Interactive Planner Active • 3-Bucket Cash Flow',
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
    statusBadge: 'Interactive Calculator Active • Verified Math',
  },
  {
    id: 'tool-sip-growth',
    label: 'Advanced SIP Growth',
    path: '/tools/sip-growth/',
    description: 'Simulate multi-lump-sum inflows, capped step-ups, and extended holding periods.',
    category: 'tool',
    eyebrow: 'Advanced Investments',
    statusBadge: 'Interactive Calculator Active • Verified Math',
  },
  {
    id: 'tool-swp',
    label: 'SWP Longevity Simulator',
    path: '/tools/swp/',
    description: 'Decumulation framework modeling monthly systematic withdrawals, capital depletion horizons, and sequence-of-returns risk.',
    category: 'tool',
    eyebrow: 'Cash Flow & Retirement',
    statusBadge: 'Interactive Calculator Active • 50-Year Simulation',
  },
  {
    id: 'tool-home-foreclosure',
    label: 'Home Loan Foreclosure vs SIP',
    path: '/tools/home-loan-foreclosure/',
    description: 'Compare reducing-balance loan prepayment against parallel mutual fund SIP growth.',
    category: 'tool',
    eyebrow: 'Debt Strategy',
    statusBadge: 'Interactive Calculator Active • Verified Math',
  },
  {
    id: 'tool-loan-recovery',
    label: 'Loan Interest Recovery SIP',
    path: '/tools/loan-sip-recovery/',
    description: 'Model illustrative parallel monthly SIP scenarios designed to offset cumulative mortgage borrowing costs under assumed returns.',
    category: 'tool',
    eyebrow: 'Borrowing Strategy',
    statusBadge: 'Interactive Calculator Active • Dual-Engine Model',
  },
  {
    id: 'tool-loan-vs-invest',
    label: 'Loan vs Investment Trade-off',
    path: '/tools/loan-vs-invest/',
    description: 'Side-by-side trade-off analysis between mortgage prepayment and long-term equity investing under compound interest modeling.',
    category: 'tool',
    eyebrow: 'Trade-off Analysis',
    statusBadge: 'Interactive Calculator Active • Arbitrage Analysis',
  },
  {
    id: 'tool-life-insurance',
    label: 'Life Insurance Needs Audit',
    path: '/tools/life-insurance/',
    description: '4-step Needs-Based Human Life Value (HLV) calculation to assess living expense support, liabilities, milestones, and net cover gaps.',
    category: 'tool',
    eyebrow: 'Family Defense',
    statusBadge: 'Interactive Planner Active • Needs-Based Model',
  },
  {
    id: 'tool-net-worth',
    label: 'Productive Net Worth Balance Sheet',
    path: '/tools/net-worth/',
    description: 'Separate personal consumption assets from productive capital to evaluate true solvency.',
    category: 'tool',
    eyebrow: 'Solvency & Diagnostics',
    statusBadge: 'Interactive Diagnostic Active • Productive Balance Sheet',
  },
  {
    id: 'tool-personal-finance-statement',
    label: 'Personal Finance Statement',
    path: '/tools/personal-finance-statement/',
    description: 'Household financial statement covering income, expenses, savings, assets, liabilities, and net worth with client-ready PDF.',
    category: 'tool',
    eyebrow: 'Household Diagnostic',
    statusBadge: 'Interactive Diagnostic Active • In-Memory Privacy',
  },
];

export const DIAGNOSTIC_ROUTES: NavRoute[] = [
  {
    id: 'diag-health-check',
    label: '7-Pillar Health Check',
    path: '/health-check/',
    description: '2-Minute product-neutral self-assessment evaluating resilience across 7 foundational pillars.',
    category: 'core',
    statusBadge: 'Interactive Diagnostic Active • 7-Pillar Resilience',
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
    id: 'legal-commission',
    label: 'Commission Disclosure',
    path: '/commission-disclosure/',
    description: 'Mutual fund distributor commission disclosure, AMC trail structures, and Regular Plan transparency.',
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
