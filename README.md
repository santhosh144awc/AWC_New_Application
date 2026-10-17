# Ant Wealth Creation — New Web Application (`new-app/`)

Clean technical foundation and modern static-first web architecture for **Ant Wealth Creation**, an AMFI-registered Mutual Fund Distributor founded by **C. Santhosh Sathriyan, B.E.** (QPFP Certified).

This application is scaffolded cleanly from scratch in `new-app/` and is strictly independent of the legacy reference application in `legacy-reference/AWC_Chatgpt/`.

---

## 1. Prerequisites

* **Node.js**: `v20.0.0` or higher (tested with `v24.19.0`)
* **npm**: `v10.0.0` or higher (tested with `v11.17.0`)
* **Operating System**: Cross-platform (Windows, macOS, Linux)

---

## 2. Verified Technology Stack & Exact Locked Versions

| Package | Locked Version (`package-lock.json`) | Role in Architecture |
| :--- | :--- | :--- |
| **astro** | `5.18.2` | Core static-first SSG and component layout framework |
| **react** | `19.0.0` | Client-side interactive islands and guided planners |
| **react-dom** | `19.0.0` | React DOM renderer |
| **@astrojs/react** | `4.2.1` | Astro official React island integration |
| **typescript** | `5.7.3` | Strict-mode type safety across all application code |
| **vitest** | `3.2.7` | Pure TypeScript calculation and unit test runner |
| **@playwright/test** | `1.51.0` | End-to-end browser regression and visual smoke runner |
| **eslint** | `9.21.0` | Code quality and linting (flat config) |
| **@astrojs/check** | `0.9.4` | Astro template type diagnostics |

---

## 3. Project Structure

```text
new-app/
├── public/
│   ├── assets/              # Approved active brand assets (provenance tracked below)
│   ├── favicon.svg          # Branded SVG favicon
│   └── robots.txt           # Pre-launch crawl prevention (switches to index at launch)
├── src/
│   ├── components/
│   │   ├── site/            # Site shell: Header.astro (accessible drawer), Footer.astro
│   │   └── ui/              # Reusable primitives: Breadcrumbs, PageIntro, StatusNotice, SectionHeader, PillarCard, GoalCard, ToolPreviewCard
│   ├── config/
│   │   ├── businessProfile.ts # Authoritative business identity & compliance disclosures
│   │   └── routes.ts        # Central route registry & navigation model (single source of truth)
│   ├── domain/
│   │   ├── finance/         # PURE TypeScript financial calculation engine (isolated from DOM/storage)
│   │   └── tax/             # Centralized tax-rules registry versioned by Act and Tax Year
│   ├── layouts/
│   │   └── BaseLayout.astro # Semantic HTML5 landmarks, OpenGraph, JSON-LD, WCAG skip link
│   ├── lib/
│   │   └── formatters.ts    # Indian numbering formatters (₹ Lakhs, Crores)
│   ├── pages/
│   │   ├── index.astro      # Polished, responsive Family Money Map homepage
│   │   ├── health-check/    # 7-Pillars diagnostic framework & REAL Statement shells
│   │   ├── plan/            # Goal planning roadmap shells (children, home, retirement, income)
│   │   ├── tools/           # 9 categorized interactive calculation simulator shells
│   │   ├── learn/           # Educational knowledge library with 5 structured guides
│   │   ├── about.astro      # Founder story, heritage, and practice principles
│   │   ├── contact.astro    # Direct contact channels & consultation expectations
│   │   ├── disclaimer.astro # Statutory disclosures, mutual fund risk & intermediary notice
│   │   ├── privacy.astro    # Privacy policy, local calculation isolation & DPDP Act
│   │   ├── terms.astro      # Terms of use and service boundaries
│   │   └── 404.astro        # Branded accessible 404 recovery page
│   └── styles/
│       ├── design-tokens.css # Authored CSS tokens with measured WCAG contrast calculations
│       └── global.css       # Accessible CSS reset and global typography rules
├── tests/
│   ├── e2e/                 # Playwright tests (navigation, mobile drawer, overflow, screenshots)
│   └── unit/                # Vitest unit test suite (formatters, routes registry, business profile)
├── astro.config.mjs         # Astro configuration with canonical site 'https://antwealth.in'
├── playwright.config.ts     # Cross-platform preview test configuration
└── package.json             # Independent package manifest
```

---

## 4. Development & Quality Commands

All commands run strictly inside `new-app/`:

```bash
# Start local development server
npm run dev

# Run unit tests (Vitest)
npm run test

# Run Astro template diagnostic type check
npm run check

# Run ESLint linter
npm run lint

# Build production static bundle (dist/)
npm run build

# Preview production build locally
npm run preview

# Run browser e2e smoke & visual tests (Playwright)
npm run test:e2e
```

---

## 5. Approved Asset Provenance

| New Path | Legacy Source Path | Relevance & Provenance |
| :--- | :--- | :--- |
| `public/assets/logo_awc.png` | `legacy-reference/AWC_Chatgpt/public/assets/logo_awc.png` | Official Ant Wealth Creation primary brand logo |
| `public/assets/logo_with_tagline.webp` | `legacy-reference/AWC_Chatgpt/public/assets/logo_with_tagline.webp` | Official primary brand logo with registered tagline |
| `public/assets/santhosh_photo.webp` | `legacy-reference/AWC_Chatgpt/public/assets/santhosh_photo.webp` | Verified photo of founder C. Santhosh Sathriyan, B.E. |
| `public/assets/homeScreenimage.webp` | `legacy-reference/AWC_Chatgpt/public/assets/homeScreenimage.webp` | Verified Family Money Map hero journey graphic |

---

## 6. Business Identity & Compliance Governance

* **Founder Identity:** C. Santhosh Sathriyan, B.E., QPFP Certified. Active in Indian financial markets since 2012.
* **AMFI Registration Status:** The firm is an AMFI-Registered Mutual Fund Distributor. While legacy documentation cites `ARN-266896`, the registration number is classified as `PENDING_VERIFICATION` in `src/config/businessProfile.ts` and withheld from public UI until confirmed against the official AMFI registry ([AMFI Locate Distributor](https://www.amfiindia.com/locate-distributor)).
* **Canonical Domain:** `https://antwealth.in` is the single authoritative canonical domain.
* **Staging Protection:** `public/robots.txt` disallows all crawlers during staging development to prevent premature search indexing.
* **Regulatory Distinction:** Operates strictly as a Mutual Fund Distributor (MFD) earning trailing commissions from AMCs. Explicitly disclaims fee-based investment advisory under SEBI (Investment Advisers) Regulations.
* **Zero Fabricated Testimonials:** Fictitious customer cards and unverified reviews are permanently suppressed.
