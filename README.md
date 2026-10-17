# Ant Wealth Creation — New Web Application (`new-app/`)

Clean technical foundation and modern static-first web architecture for **Ant Wealth Creation**, an AMFI-registered Mutual Fund Distributor (ARN-181534).

This application was scaffolded from scratch in `new-app/` and is strictly independent of the legacy reference application in `legacy-reference/AWC_Chatgpt/`.

---

## 1. Prerequisites

- **Node.js**: `v20.0.0` or higher (verified with `v24.19.0`)
- **npm**: `v10.0.0` or higher (verified with `v11.17.0`)
- **Operating System**: Cross-platform (Windows, macOS, Linux)

---

## 2. Verified Technology Stack & Installed Versions

| Technology / Tool | Version | Role in Architecture |
| :--- | :--- | :--- |
| **Astro** | `^5.4.2` | Core static site generator and page layout framework |
| **React** | `^19.0.0` | Client-side interactive islands and guided planners |
| **React DOM** | `^19.0.0` | React DOM renderer |
| **@astrojs/react** | `^4.2.1` | Astro official React island integration |
| **TypeScript** | `^5.7.3` | Strict-mode type safety across all application code |
| **Authored CSS** | Custom Tokens | Design tokens & CSS custom properties (`src/styles/`) |
| **Vitest** | `^3.0.7` | Blazing-fast unit and mathematical test runner |
| **Playwright** | `^1.51.0` | End-to-end browser smoke and regression testing |
| **ESLint** | `^9.21.0` | Code quality and linting |
| **@astrojs/check** | `^0.9.4` | Astro template diagnostic type checker |

---

## 3. Project Structure & Architecture

```text
new-app/
├── public/
│   ├── assets/              # Approved active brand assets (provenance tracked below)
│   ├── favicon.svg          # Branded SVG favicon
│   └── robots.txt           # Search crawler directive with canonical sitemap
├── src/
│   ├── components/
│   │   ├── site/            # Site shell: Header.astro, Footer.astro
│   │   └── ui/              # Small, accessible atomic UI primitives (future)
│   ├── domain/
│   │   ├── finance/         # PURE TypeScript financial calculation engine (isolated from DOM/storage)
│   │   └── tax/             # Centralized tax-rules registry versioned by Act and Tax Year
│   ├── features/            # Feature-specific interactive islands (future)
│   ├── layouts/
│   │   └── BaseLayout.astro # Base layout with semantic landmarks, OpenGraph & JSON-LD metadata
│   ├── lib/
│   │   └── formatters.ts    # Indian numbering formatters (₹ Lakhs, Crores)
│   ├── pages/
│   │   ├── index.astro      # Temporary foundation shell home page
│   │   └── 404.astro        # Branded accessible 404 Not Found page
│   └── styles/
│       ├── design-tokens.css # Pure CSS custom properties (colors, typography, spacing, shadows)
│       └── global.css       # Accessible CSS reset and global typography rules
├── tests/
│   ├── unit/                # Vitest unit test suite (pure functions, domain tests)
│   └── e2e/                 # Playwright browser smoke tests
├── astro.config.mjs         # Astro configuration with React integration
├── tsconfig.json            # Strict TypeScript configuration with @ aliases
├── vitest.config.ts         # Vitest unit test configuration
├── playwright.config.ts     # Playwright e2e configuration
├── eslint.config.js         # ESLint 9 flat configuration
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

# Run browser e2e smoke tests (Playwright)
npm run test:e2e
```

---

## 5. Approved Asset Provenance

Only verified, active brand assets were copied into `public/assets/`. Unreferenced concept drafts (~4.2 MB) in the legacy directory were excluded.

| New Path | Legacy Source Path | Relevance & Provenance |
| :--- | :--- | :--- |
| `public/assets/logo_awc.png` | `legacy-reference/AWC_Chatgpt/public/assets/logo_awc.png` | Official Ant Wealth Creation primary brand logo |
| `public/assets/logo_with_tagline.webp` | `legacy-reference/AWC_Chatgpt/public/assets/logo_with_tagline.webp` | Official primary brand logo with registered tagline |
| `public/assets/santhosh_photo.webp` | `legacy-reference/AWC_Chatgpt/public/assets/santhosh_photo.webp` | Verified photo of founder Santhosh Kumar (ARN-181534) |
| `public/assets/homeScreenimage.webp` | `legacy-reference/AWC_Chatgpt/public/assets/homeScreenimage.webp` | Verified hero imagery asset |

---

## 6. Pre-Scaffold Correction Gates Enforced

Per Prompt 3 governance:
- **GATE-A (Retirement Tax Treatment)**: "Annuity-Due + 12.5% LTCG flat haircut" is **BLOCKED**. Awaiting an independent domain calculation specification and mathematical test vectors.
- **GATE-B (Compounding Semantics)**: Annual return vs monthly rate convention (nominal $r/12$ vs geometric $(1+r)^{1/12}-1$) is recorded as an **unresolved domain decision**. Rates are strictly illustrative assumptions, not guaranteed benchmarks.
- **GATE-C (Tax Law Versioning)**: The Income-tax Act, 2025 took effect on 1 April 2026 (Sections 22, 130, 198). All future tax rules are versioned inside `src/domain/tax/` and marked as `PENDING_REVIEW` until certified by a professional tax consultant.
- **GATE-D (Privacy & LocalStorage)**: Retracted "encrypted localStorage" claim. No financial inputs or personal values are persisted in the foundation phase.
- **GATE-E (Inventory Reconciliation)**: An explicit inventory gate prevents premature calculator porting until legacy tool counts and routes are fully mapped.
- **GATE-F (Compliance Claims)**: Absolute certainty terms like "exact monthly investment required" are replaced with "estimated monthly amount under the assumptions entered". All statutory notices are preserved.
