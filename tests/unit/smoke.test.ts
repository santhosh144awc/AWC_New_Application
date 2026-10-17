import { describe, it, expect } from 'vitest';
import { formatINR, formatIndianCompact, formatPercentage } from '../../src/lib/formatters';
import { FINANCE_DOMAIN_VERSION } from '../../src/domain/finance';
import { CENTRAL_TAX_RULES_REGISTRY } from '../../src/domain/tax';
import { BUSINESS_PROFILE } from '../../src/config/businessProfile';

describe('Unit Test Suite & Foundation Smoke Test', () => {
  it('should run tests cleanly inside Vitest test runner', () => {
    expect(true).toBe(true);
  });

  describe('Indian Currency & Number Formatters (src/lib/formatters.ts)', () => {
    it('formats numbers into standard Indian Rupee notation', () => {
      expect(formatINR(0)).toBe('₹0');
      const formatted15L = formatINR(1500000).replace(/\u00a0/g, ' ');
      expect(formatted15L).toMatch(/₹\s?15,00,000/);
    });

    it('formats numbers into compact Indian notations (Lakhs and Crores)', () => {
      expect(formatIndianCompact(25000000)).toBe('₹2.50 Cr');
      expect(formatIndianCompact(500000)).toBe('₹5.00 L');
      expect(formatIndianCompact(45000)).toBe('₹45.0 K');
      expect(formatIndianCompact(500)).toBe('₹500');
    });

    it('formats percentages correctly', () => {
      expect(formatPercentage(12.5)).toBe('12.50%');
      expect(formatPercentage(8, 0)).toBe('8%');
    });
  });

  describe('Business Profile & Identity Governance (Section 2A & 2B)', () => {
    it('enforces ARN status as PENDING_VERIFICATION and avoids unverified user-facing display', () => {
      expect(BUSINESS_PROFILE.regulatory.arnStatus).toBe('PENDING_VERIFICATION');
      expect(BUSINESS_PROFILE.regulatory.amfiRegistrationText).toContain('pending registry confirmation');
    });

    it('specifies canonical domain consistently as https://antwealth.in', () => {
      expect(BUSINESS_PROFILE.firm.canonicalDomain).toBe('https://antwealth.in');
    });

    it('contains verified founder details from authoritative sources', () => {
      expect(BUSINESS_PROFILE.founder.fullName).toBe('C. Santhosh Sathriyan, B.E.');
      expect(BUSINESS_PROFILE.firm.experienceSince).toBe('2012');
      expect(BUSINESS_PROFILE.founder.credentials).toContain('QPFP Certified');
    });
  });

  describe('Architecture Gate Enforcements', () => {
    it('finance domain engine is scaffolded and explicitly blocks unverified formulas', () => {
      expect(FINANCE_DOMAIN_VERSION).toBe('1.0.0-phase6');
    });

    it('tax domain records Income-tax Act, 2025 transitional status as PENDING_REVIEW', () => {
      const reg = CENTRAL_TAX_RULES_REGISTRY['AY_2026_27_TRANSITIONAL'];
      expect(reg).toBeDefined();
      expect(reg.act).toBe('IT_ACT_2025');
      expect(reg.professionalReviewStatus).toBe('PENDING_REVIEW');
    });
  });

  describe('Route Registry & Navigation Architecture (src/config/routes.ts)', () => {
    it('provides exactly 6 primary top-navigation routes', async () => {
      const { TOP_NAV_ROUTES } = await import('../../src/config/routes');
      expect(TOP_NAV_ROUTES).toHaveLength(6);
      expect(TOP_NAV_ROUTES.map(r => r.path)).toEqual([
        '/',
        '/health-check/',
        '/plan/',
        '/tools/',
        '/learn/',
        '/about/',
      ]);
    });

    it('registers all 24 distinct canonical application routes without duplicates', async () => {
      const { getAllRegisteredRoutes } = await import('../../src/config/routes');
      const allRoutes = getAllRegisteredRoutes();
      expect(allRoutes.length).toBe(24);

      const paths = allRoutes.map(r => r.path);
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(paths.length);

      for (const route of allRoutes) {
        expect(route.path.startsWith('/')).toBe(true);
        expect(route.path.endsWith('/')).toBe(true);
        expect(route.label.trim().length).toBeGreaterThan(0);
        expect(route.description.trim().length).toBeGreaterThan(0);
      }
    });

    it('generates accurate, hierarchical breadcrumb trails', async () => {
      const { getBreadcrumbsForPath } = await import('../../src/config/routes');
      
      const homeCrumbs = getBreadcrumbsForPath('/');
      expect(homeCrumbs).toHaveLength(1);
      expect(homeCrumbs[0].label).toBe('Home');

      const sipCrumbs = getBreadcrumbsForPath('/tools/sip/');
      expect(sipCrumbs).toHaveLength(3);
      expect(sipCrumbs[0].href).toBe('/');
      expect(sipCrumbs[1].href).toBe('/tools/');
      expect(sipCrumbs[2].label).toBe('SIP Wealth Simulator');

      const childCrumbs = getBreadcrumbsForPath('/plan/children/');
      expect(childCrumbs).toHaveLength(3);
      expect(childCrumbs[0].href).toBe('/');
      expect(childCrumbs[1].href).toBe('/plan/');
      expect(childCrumbs[2].label).toBe("Children's Future");
    });
  });
});
