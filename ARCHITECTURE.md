# Ant Wealth Creation — System Architecture (`new-app/`)

## 1. Architectural Philosophy

The new **Ant Wealth Creation** application is engineered around four core tenets:
1. **Static-First Performance & SEO**: Content pages, articles, and marketing shells are statically rendered at build time using Astro 5, producing lightweight zero-JS HTML by default.
2. **Islands of Interactivity**: React 19 is leveraged exclusively for interactive financial widgets, sliders, calculators, and multistep goal wizards via Astro client directives (`client:load`, `client:idle`, `client:visible`).
3. **Pure Domain Isolation**: Financial calculations and tax formulas are kept strictly isolated from the presentation layer, browser storage, and UI framework.
4. **Regulatory Transparency & Versioning**: Tax and financial assumptions are treated as versioned statutory data structures with explicit effective dates, audit trails, and legal review gates.

---

## 2. Layered Architecture Overview

```mermaid
graph TD
    subgraph Presentation_Layer [Presentation Layer]
        AstroPages[Astro Pages src/pages/]
        SiteShell[Site Shell Header, Footer, Nav src/components/site/]
        UIPrimitives[UI Primitives src/components/ui/]
        ReactIslands[React Interactive Islands src/features/]
    end

    subgraph Domain_Layer [Pure Domain Layer - No DOM/React]
        FinanceDomain[Financial Domain Engine src/domain/finance/]
        TaxDomain[Central Tax Rules Registry src/domain/tax/]
    end

    subgraph Infrastructure_Layer [Utilities & Content]
        Formatters[Formatters & Helpers src/lib/]
        ContentCollections[Content Collections src/content/]
        Styles[Design Tokens & Authored CSS src/styles/]
    end

    AstroPages --> SiteShell
    AstroPages --> ReactIslands
    ReactIslands --> UIPrimitives
    ReactIslands --> FinanceDomain
    ReactIslands --> TaxDomain
    ReactIslands --> Formatters
    FinanceDomain --> Formatters
    AstroPages --> Styles
```

---

## 3. Layer Boundary Contracts

### A. Presentation Layer (`src/pages/`, `src/layouts/`, `src/components/`, `src/features/`)
- **Astro Components (`.astro`)**: Responsible for HTML document structure, OpenGraph meta tags, Schema.org JSON-LD structured data, responsive headers, navigation, footers, and static marketing copy.
- **React Components (`.tsx`)**: Responsible strictly for dynamic state (input slider updates, live charts, step transitions).
- **Styling**: Authored CSS referencing CSS custom properties defined in `src/styles/design-tokens.css`. No external heavy CSS frameworks or black-box component libraries.

### B. Pure Financial Domain Layer (`src/domain/finance/`)
- **Rules**:
  - Pure TypeScript functions and type definitions only.
  - Zero imports from `react`, `astro`, `window`, `document`, or `localStorage`.
  - Every calculation function must accept explicit input parameters (e.g. principal, annual rate, tenure, frequency) and return an immutable result object containing output numbers, calculation steps, and explicit assumption strings.
  - 100% test coverage with verifiable mathematical test vectors.

### C. Versioned Tax Rules Layer (`src/domain/tax/`)
- **Rules (Enforced under GATE-C)**:
  - Fixed statutory section numbers (e.g., Section 24(b) vs Section 130; Section 112A vs Section 198) must never be hardcoded into UI copy.
  - All tax slabs, indexation rules, deduction limits, and capital gains exemptions must reside in versioned modules keyed by **Tax Act** (`IT_ACT_1961` vs `IT_ACT_2025`) and **Assessment Year**.
  - Every rule entry maintains a `professionalReviewStatus` flag (`'PENDING_REVIEW' | 'VERIFIED'`) to prevent unverified statutory advice from entering production.

### D. Utility & Formatting Layer (`src/lib/`)
- Pure helper functions for Indian currency display (`formatINR`, `formatIndianCompact`), dates, and number parsing.

---

## 4. Privacy and State Persistence Policy (GATE-D)

1. **No Inherent "Encrypted localStorage"**: Browser `localStorage` is plaintext storage vulnerable to any script running in the same origin.
2. **Ephemeral by Default**: All calculator inputs in the new application are in-memory React state during active session usage.
3. **Future Persistence Requirements**:
   - Must require explicit user consent via an opt-in toggle (e.g., "Save my calculation progress on this device").
   - Sensitive financial values must never be appended into shareable URL query parameters without user confirmation.
   - Zero transmission of user financial inputs to any third-party tracking, analytics, or CRM scripts.
   - Provide a prominent, single-click "Clear Stored Data" action.

---

## 5. Testing & Quality Strategy

- **Unit Testing (Vitest)**: Tests all pure financial algorithms, tax registries, and formatting helpers. Runs in `< 1s` in Node.js environment without DOM overhead.
- **Diagnostic Type Check (`astro check`)**: Validates Astro component templates, frontmatter TypeScript types, and route parameters.
- **Linting (ESLint 9)**: Enforces code style, unused import removal, and syntax correctness.
- **End-to-End Testing (Playwright)**: Verifies real browser rendering, layout shift, interactive island mounting, console error absence, and responsive accessibility.
