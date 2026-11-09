/**
 * Ant Wealth Creation — Single-Page Route & Anchor Configuration
 */

export interface NavItem {
  id: string;
  label: string;
  path: string;
}

export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

export const TOP_NAV_ROUTES: NavItem[] = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'about', label: 'About Santhosh', path: '/#about' },
  { id: 'services', label: 'Our Services', path: '/#services' },
  { id: 'journey', label: '6-Step Journey', path: '/#journey' },
  { id: 'testimonials', label: 'Client Reviews', path: '/#testimonials' },
  { id: 'contact', label: 'Contact', path: '/#contact' },
];

export const LEGAL_ROUTES: NavItem[] = [
  { id: 'disclaimer', label: 'Statutory Disclaimers', path: '/disclaimer/' },
  { id: 'commission-disclosure', label: 'Commission Disclosure', path: '/commission-disclosure/' },
  { id: 'privacy', label: 'Privacy Policy', path: '/privacy/' },
  { id: 'terms', label: 'Terms of Service', path: '/terms/' },
];

export function getBreadcrumbsForPath(path: string): BreadcrumbItem[] {
  const normalized = path.endsWith('/') ? path : `${path}/`;
  const legalMatch = LEGAL_ROUTES.find((r) => r.path === normalized);
  if (legalMatch) {
    return [
      { label: 'Home', href: '/' },
      { label: legalMatch.label, href: legalMatch.path, isCurrent: true },
    ];
  }
  return [{ label: 'Home', href: '/', isCurrent: true }];
}
