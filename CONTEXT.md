# Context: Cymbal Premier Wealth Studio

Domain terminology and concepts for the Private Wealth & Portfolio Advisory Studio.

## Personas

- **Advisor ("Ananya")**: Senior Private Wealth Relationship Manager and Financial Advisor. Empathic, data-driven, and opinionated. Guides clients on asset allocation, portfolio rebalancing, and goal achievement while upholding fiduciary and regulatory standards.
- **Investor ("Rahul Sharma")**: The primary demo client. A 38-year-old tech executive based in Bengaluru/Pune with ₹75 Lakh in existing AUM, seeking to optimize a skewed portfolio toward early retirement (2042) and children's higher education (2032).

## Domain Concepts

### Portfolio & Asset Allocation
- **AUM (Assets Under Management)**: Total market value of all investments held in the client's managed portfolio.
- **Asset Allocation**: Distribution of investments across major asset classes:
  - **Equity**: Capital appreciation instruments (Large Cap, Mid/Small Cap, Flexi Cap, International).
  - **Debt / Fixed Income**: Capital preservation and yield instruments (Corporate Bonds, Short Duration, Gilts, Liquid/Overnight).
  - **Commodities & Alternatives**: Inflation hedges and portfolio diversifiers (Sovereign Gold Bonds, Gold/Silver ETFs, REITs).
  - **Hybrid / Multi-Asset**: Blended risk funds (Balanced Advantage Funds, Multi-Asset Allocation).
- **Portfolio Rebalancing**: Shifting the current asset allocation weights to match the target strategic asset allocation according to the client's risk profile and market conditions.
- **Riskometer / Risk Profile**: Risk classification ranging from Low, Moderate, Moderately High, to Very High. Rahul Sharma is classified as **Moderately Aggressive**.

### Performance & Metrics
- **CAGR (Compound Annual Growth Rate)**: The annualized return of an investment over a multi-year horizon (1Y, 3Y, 5Y).
- **XIRR (Extended Internal Rate of Return)**: The annualized rate of return for irregular cash flows (SIPs, lump sums, withdrawals).
- **TER (Total Expense Ratio)**: Annual percentage fee charged by the fund management house.

### Transactions & Studio Actions
- **Product / Fund Explorer**: The searchable universe of mutual funds, ETFs, and fixed-income products, organized into focused horizontal carousel rails (High-Conviction, Equity, Debt, Multi-Asset), with 1-click toggles for full grid and dense matrix table views.
- **Portfolio Diagnostics & Health Canvas**: Deep audit view analyzing current vs strategic asset drift, concentration risks, and surplus cash deployment.
- **Goal Simulation Lab**: Interactive 15-year compounding growth visualizer modeling portfolio behavior under varying macroeconomic scenarios (Baseline, Bull Supercycle, Recession, Rate Cut, High Inflation).
- **Compounding Growth Cone**: Visual trajectory modeling corpus growth from ₹75L baseline to ₹5.82 Cr milestone across key target horizons (2032 Education, 2042 Retirement).
- **Advisory Basket**: The staging area containing proposed fund allocations, lump-sum investments, and monthly SIP/STP commitments prior to execution.
- **Advisory Mandate & Summary**: Formal proposal document detailing recommendations, asset shifts, return expectations, and statutory SEBI/regulatory disclaimers for client sign-off via e-NACH auto-debit.

### Studio Visual Theme Engine
- **Obsidian & Champagne Terminal (Dark Mode - Default)**: Deep obsidian slate baseline (`#060a12`), frosted glassmorphic containers (`rgba(15,23,42,0.65)`), champagne gold accents (`#E5C07B`), and emerald yield numerals.
- **Porcelain Executive (Light Mode)**: Crisp porcelain executive surfaces (`#F8F9FB`), high-contrast slate-900 typography, warm gold badges, and subtle elevation shadows.
- **Theme Persistence**: Instant 1-click toggle in the studio TopBar persisted to `localStorage` (`cymbal_theme`) and synced across sessions.

