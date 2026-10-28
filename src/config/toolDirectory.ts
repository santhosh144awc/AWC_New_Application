/**
 * Ant Wealth Creation — Situation-Based Tools Directory
 *
 * Presentation metadata layered on top of the canonical route registry
 * (`routes.ts`). Every entry points at an existing registry route id; the
 * directory never defines its own paths or titles, so a route can never be
 * advertised here that does not exist in the registry.
 *
 * Status vocabulary:
 * - active  : interactive and verified in the current build
 * - preview : specification preview (model still in review)
 * - blocked : calculations unavailable under a compliance gate
 *             (GATE-A retirement/SWP, GATE-C tax). Never rendered as interactive.
 */

import {
  DIAGNOSTIC_ROUTES,
  GOAL_ROUTES,
  TOOL_ROUTES,
  type NavRoute,
} from './routes';

export type ToolStatus = 'active' | 'preview' | 'blocked';
export type ToolIntentId = 'understand' | 'grow' | 'goal' | 'protect' | 'loan';
export type ToolTint = 'mint' | 'mist' | 'sand';

export interface ToolIntent {
  id: ToolIntentId;
  label: string;
  hint: string;
  icon: string;
}

export const TOOL_INTENTS: ToolIntent[] = [
  { id: 'understand', label: 'Understand my finances', hint: 'See where you stand today', icon: '◉' },
  { id: 'grow', label: 'Grow money', hint: 'Explore investing scenarios', icon: '↗' },
  { id: 'goal', label: 'Plan a family goal', hint: 'Education, home, retirement', icon: '◎' },
  { id: 'protect', label: 'Protect my family', hint: 'Cover and safety nets', icon: '⬡' },
  { id: 'loan', label: 'Understand a loan', hint: 'Prepayment and borrowing', icon: '⇣' },
];

export interface ToolDirectoryEntry {
  /** Id of an existing entry in TOOL_ROUTES, GOAL_ROUTES or DIAGNOSTIC_ROUTES. */
  routeId: string;
  intents: ToolIntentId[];
  /** Short plain-language "what it helps with" sentence. */
  summary: string;
  /** Question a visitor might be asking (also searchable). */
  question: string;
  /** Extra plain-language search terms. */
  keywords: string[];
  status: ToolStatus;
  /** Short truthful availability label shown on the card. */
  statusLabel: string;
  actionLabel: string;
  icon: string;
  tint: ToolTint;
}

export const TOOL_DIRECTORY: ToolDirectoryEntry[] = [
  {
    routeId: 'diag-health-check',
    intents: ['understand', 'protect'],
    summary: 'Answer seven short questions about cash flow, reserves, debt, protection, investing, goals and retirement.',
    question: 'How healthy are our family finances?',
    keywords: ['score', 'checkup', 'diagnostic', 'emergency fund', 'seven pillars', 'resilience'],
    status: 'active',
    statusLabel: 'Live diagnostic',
    actionLabel: 'Start the health check',
    icon: '◉',
    tint: 'mint',
  },
  {
    routeId: 'tool-net-worth',
    intents: ['understand'],
    summary: 'See what your family owns and owes, with personal-use assets shown apart from productive capital.',
    question: 'What is our real net worth?',
    keywords: ['assets', 'liabilities', 'balance sheet', 'solvency', 'wealth', 'owe'],
    status: 'active',
    statusLabel: 'Live diagnostic',
    actionLabel: 'Open balance sheet',
    icon: '▤',
    tint: 'mist',
  },
  {
    routeId: 'tool-personal-finance-statement',
    intents: ['understand'],
    summary: 'A deeper household statement covering income, expenses, assets, debts and productive net worth.',
    question: 'Where does our money actually go?',
    keywords: ['income', 'expenses', 'budget', 'statement', 'cash flow', 'household'],
    status: 'active',
    statusLabel: 'Live diagnostic',
    actionLabel: 'Open Personal Finance Statement',
    icon: '▥',
    tint: 'mint',
  },
  {
    routeId: 'tool-sip',
    intents: ['grow'],
    summary: 'Explore how a monthly investment could grow over time, with an optional yearly step-up.',
    question: 'What could a monthly SIP grow to?',
    keywords: ['sip', 'monthly', 'mutual fund', 'compounding', 'step up', 'invest'],
    status: 'active',
    statusLabel: 'Live calculator',
    actionLabel: 'Try a scenario',
    icon: '↗',
    tint: 'mint',
  },
  {
    routeId: 'tool-lumpsum',
    intents: ['grow'],
    summary: 'See a hypothetical future value for a one-time investment over a chosen number of years.',
    question: 'What could a one-time investment grow to?',
    keywords: ['lump sum', 'lumpsum', 'one time', 'bonus', 'compounding', 'invest'],
    status: 'active',
    statusLabel: 'Live calculator',
    actionLabel: 'Try a scenario',
    icon: '◉',
    tint: 'mist',
  },
  {
    routeId: 'tool-sip-growth',
    intents: ['grow'],
    summary: 'Combine a monthly SIP with extra lump sums and capped step-ups over a longer holding period.',
    question: 'What if I add lump sums and raise my SIP each year?',
    keywords: ['sip', 'step up', 'lump sum', 'advanced', 'increase', 'cap', 'holding period'],
    status: 'active',
    statusLabel: 'Live calculator',
    actionLabel: 'Compare scenarios',
    icon: '▥',
    tint: 'mist',
  },
  {
    routeId: 'goal-children',
    intents: ['goal'],
    summary: 'Model education and other milestones for your children with inflation and existing savings.',
    question: 'How much should we save for our child’s education?',
    keywords: ['children', 'child', 'education', 'college', 'school', 'marriage', 'inflation'],
    status: 'active',
    statusLabel: 'Live planner',
    actionLabel: 'Plan a milestone',
    icon: '⌂',
    tint: 'sand',
  },
  {
    routeId: 'goal-home',
    intents: ['goal'],
    summary: 'Estimate upfront cash, purchase costs and a comfortable EMI. Tax relief is not included.',
    question: 'Can we afford to buy a home?',
    keywords: ['house', 'home', 'down payment', 'emi', 'property', 'purchase', 'buy'],
    status: 'active',
    statusLabel: 'Live planner',
    actionLabel: 'Plan a purchase',
    icon: '⌂',
    tint: 'mint',
  },
  {
    routeId: 'goal-retirement',
    intents: ['goal'],
    summary: 'Systematic roadmap to model your family retirement corpus, progress against assets, and required SIP.',
    question: 'How much will we need to retire?',
    keywords: ['retire', 'retirement', 'corpus', 'pension', 'old age'],
    status: 'active',
    statusLabel: 'Live planner',
    actionLabel: 'Plan retirement',
    icon: '⟳',
    tint: 'mist',
  },
  {
    routeId: 'goal-retirement-income',
    intents: ['goal'],
    summary: 'Three-bucket retirement income framework partitioning capital into Liquidity, Safety, and Growth.',
    question: 'How could retirement savings pay a monthly income?',
    keywords: ['retirement income', 'buckets', 'withdrawals', 'pension', 'monthly income'],
    status: 'active',
    statusLabel: 'Live planner',
    actionLabel: 'Model cash flow',
    icon: '⇄',
    tint: 'sand',
  },
  {
    routeId: 'tool-swp',
    intents: ['goal'],
    summary: 'Model monthly systematic withdrawals, capital longevity, and balance depletion over 50 years.',
    question: 'How long could my savings last if I withdraw monthly?',
    keywords: ['swp', 'systematic withdrawal', 'retirement', 'longevity', 'withdrawals'],
    status: 'active',
    statusLabel: 'Live calculator',
    actionLabel: 'Simulate SWP',
    icon: '⇄',
    tint: 'mist',
  },
  {
    routeId: 'tool-life-insurance',
    intents: ['protect'],
    summary: 'A 4-step, needs-based estimate of family support, liabilities, milestones and a possible cover gap.',
    question: 'How much life cover does my family need?',
    keywords: ['life insurance', 'term cover', 'hlv', 'human life value', 'protection', 'cover gap'],
    status: 'active',
    statusLabel: 'Live planner',
    actionLabel: 'Estimate needs',
    icon: '⬡',
    tint: 'sand',
  },
  {
    routeId: 'tool-home-foreclosure',
    intents: ['loan'],
    summary: 'Compare paying a home loan down early with investing the same money through a parallel SIP.',
    question: 'Should I prepay my home loan or invest?',
    keywords: ['home loan', 'prepay', 'foreclose', 'foreclosure', 'emi', 'mortgage', 'interest'],
    status: 'active',
    statusLabel: 'Live calculator',
    actionLabel: 'Compare payments',
    icon: '⇣',
    tint: 'mist',
  },
  {
    routeId: 'tool-loan-recovery',
    intents: ['loan'],
    summary: 'Model how an illustrative parallel monthly SIP could offset home loan interest under assumed returns.',
    question: 'Could a parallel SIP offset the interest I pay on my loan?',
    keywords: ['loan interest', 'recover', 'offset', 'sip', 'mortgage', 'borrowing cost'],
    status: 'active',
    statusLabel: 'Live calculator',
    actionLabel: 'Calculate recovery',
    icon: '⇣',
    tint: 'mint',
  },
  {
    routeId: 'tool-loan-vs-invest',
    intents: ['loan'],
    summary: 'Compare prepaying your home loan against investing surplus capital into diversified equity.',
    question: 'Is it better to prepay a loan or invest?',
    keywords: ['prepay', 'invest', 'trade-off', 'loan', 'tax', 'mortgage'],
    status: 'active',
    statusLabel: 'Live calculator',
    actionLabel: 'Compare options',
    icon: '⚖',
    tint: 'sand',
  },
];

export interface ResolvedTool extends ToolDirectoryEntry {
  id: string;
  title: string;
  href: string;
  /** Lower-case haystack used for search (title + summary + question + keywords). */
  searchText: string;
}

function findRoute(routeId: string): NavRoute | undefined {
  return [...TOOL_ROUTES, ...GOAL_ROUTES, ...DIAGNOSTIC_ROUTES].find((r) => r.id === routeId);
}

/**
 * Resolves each directory entry against the canonical route registry.
 * Throws at build time if an entry references a route that does not exist, so a
 * broken or placeholder destination can never be rendered.
 */
export function getResolvedTools(): ResolvedTool[] {
  return TOOL_DIRECTORY.map((entry) => {
    const route = findRoute(entry.routeId);
    if (!route) {
      throw new Error(`Tool directory entry "${entry.routeId}" does not exist in the route registry.`);
    }
    const searchText = [route.label, entry.summary, entry.question, ...entry.keywords]
      .join(' ')
      .toLowerCase();
    return {
      ...entry,
      id: route.id,
      title: route.label,
      href: route.path,
      searchText,
    };
  });
}
