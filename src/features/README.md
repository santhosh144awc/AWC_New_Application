# Feature Modules
Reserved for later feature-specific interactive components (e.g. calculator widgets, planner wizard, health score inspector).
All financial formulas consumed by features must come from `@domain/finance/` and tax rules from `@domain/tax/`.
Features must not directly calculate or store unencrypted financial data in localStorage.
