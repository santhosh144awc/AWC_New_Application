/**
 * Ant Wealth Creation — Journey stage content (Concept C wording)
 *
 * Plain-language guidance only: no performance claims, no product advice.
 * Every link must be a canonical route from `routes.ts` (enforced by unit tests).
 * Retirement / SWP links are flagged `preview` — calculations stay unavailable
 * under GATE-A and are never presented as interactive.
 */

export interface JourneyLink {
  label: string;
  href: string;
  /** Present only for links to blocked planning-specification previews. */
  preview?: string;
}

export interface JourneyStage {
  id: string;
  /** Short label shown on the path. */
  label: string;
  title: string;
  /** One-line purpose. */
  purpose: string;
  /** Plain-language explanation. */
  explanation: string;
  actions: string[];
  links: JourneyLink[];
  /** Fallback stage emphasis shown beside the title. */
  icon: string;
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 'clear-picture',
    label: 'Start here',
    title: 'Get a clear picture',
    purpose: 'See how money moves through your family today.',
    explanation:
      'Before changing anything, it helps to know what comes in, what goes out, and what you own and owe. A rough picture is enough to begin.',
    actions: [
      'Map income and essential spending',
      'List savings, loans and cover',
      'Notice one pressure point',
    ],
    links: [
      { label: 'Personal Finance Statement', href: '/tools/personal-finance-statement/' },
      { label: 'Financial health check', href: '/health-check/' },
    ],
    icon: '◉',
  },
  {
    id: 'safety-net',
    label: 'Create room',
    title: 'Build a safety net',
    purpose: 'Make the unexpected less disruptive.',
    explanation:
      'A reserve you can reach quickly gives your family time to respond to a gap in income or a sudden bill, and can reduce the need to borrow or sell long-term investments at a bad moment.',
    actions: [
      'Estimate essential monthly costs',
      'Identify accessible reserves',
      'Set a realistic first milestone',
    ],
    links: [
      { label: 'Check the emergency-reserve pillar', href: '/health-check/' },
      { label: 'Read the learning library', href: '/learn/' },
    ],
    icon: '◈',
  },
  {
    id: 'protect-family',
    label: 'Protect',
    title: 'Protect the people who depend on you',
    purpose: 'Understand the financial commitments your family would need to meet.',
    explanation:
      'Protection is about the people who rely on your income. Listing debts and future costs shows how far existing cover may go, and where a gap could be.',
    actions: [
      'Review health and life cover',
      'List debts and future obligations',
      'Compare estimated needs with existing cover',
    ],
    links: [{ label: 'Life insurance needs audit', href: '/tools/life-insurance/' }],
    icon: '⬡',
  },
  {
    id: 'family-goals',
    label: 'Plan',
    title: 'Name the goals that matter',
    purpose: 'Turn education, a home or another family milestone into a dated plan.',
    explanation:
      'A goal with a cost and a date is easier to act on than a general intention. Costs usually rise over time, so the planners ask you to choose an inflation assumption.',
    actions: [
      'Choose one priority',
      'Estimate future cost',
      'Account for existing goal savings',
    ],
    links: [
      { label: 'Children’s future planner', href: '/plan/children/' },
      { label: 'Home purchase planner', href: '/plan/home-purchase/' },
      {
        label: 'Retirement accumulation',
        href: '/plan/retirement/',
      },
    ],
    icon: '◎',
  },
  {
    id: 'invest-with-purpose',
    label: 'Grow',
    title: 'Choose investments with purpose',
    purpose: 'Explore how regular investing could contribute to a goal under assumptions.',
    explanation:
      'Investing works best when it is tied to a goal and a time horizon. These calculators show scenarios under assumptions you choose. They do not predict or promise returns.',
    actions: [
      'Start with your time horizon',
      'Compare a fixed and a step-up contribution',
      'Understand the assumed return',
    ],
    links: [
      { label: 'SIP wealth simulator', href: '/tools/sip/' },
      { label: 'Lump sum growth', href: '/tools/lumpsum/' },
      { label: 'Advanced SIP growth', href: '/tools/sip-growth/' },
    ],
    icon: '↗',
  },
  {
    id: 'review-adjust',
    label: 'Keep going',
    title: 'Review, learn and adjust',
    purpose: 'Revisit decisions as income, family needs and goals change.',
    explanation:
      'Life changes, so plans should too. A short, regular check-in is easier to keep than a big yearly overhaul. Some decisions, such as tax, insurance suitability and retirement income, may need qualified professional help.',
    actions: [
      'Review progress periodically',
      'Update your assumptions',
      'Get qualified help for decisions that need it',
    ],
    links: [
      { label: 'Browse the learning library', href: '/learn/' },
      { label: 'Explore all tools', href: '/tools/' },
      {
        label: 'Retirement regular income',
        href: '/plan/retirement-income/',
      },
    ],
    icon: '⟳',
  },
];
