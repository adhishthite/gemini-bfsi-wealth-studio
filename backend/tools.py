"""Gemini function-calling declarations — the Wealth Advisor's 'hands' that drive the UI."""
from google.genai import types

_S = types.Schema
_T = types.Type


def _arr(desc=""):
    return _S(type=_T.ARRAY, items=_S(type=_T.STRING), description=desc)


FUNCTION_DECLARATIONS = [
    types.FunctionDeclaration(
        name="filter_products",
        description="Filter, sort, and display mutual funds, ETFs, and instruments in the Product Explorer. "
                    "Call this whenever discussing investment categories, themes (e.g. US Tech, Manufacturing, "
                    "Tax-saver ELSS), risk profiles, or performance criteria so the UI updates live.",
        parameters=_S(type=_T.OBJECT, properties={
            "category": _S(type=_T.STRING, description="Equity, Debt, Commodities, Hybrid"),
            "sub_category": _S(type=_T.STRING, description="e.g. Large Cap, Mid Cap, Flexi Cap, Corporate Bond, Gold ETF, Balanced Advantage (BAF), Target Date Retirement"),
            "risk_level": _S(type=_T.STRING, description="Low, Low to Moderate, Moderate, Moderately High, High, Very High"),
            "min_cagr_3y": _S(type=_T.NUMBER, description="Minimum 3-year CAGR percentage (e.g. 15.0)"),
            "max_ter": _S(type=_T.NUMBER, description="Maximum Total Expense Ratio (e.g. 0.75)"),
            "rating": _S(type=_T.INTEGER, description="Minimum rating 1 to 5"),
            "tags": _arr("e.g. Flagship, Top Rated, High Alpha, Tax Saver, All-Weather, USD Hedge"),
            "query": _S(type=_T.STRING, description="Free-text search or intent (e.g. 'US tech AI', 'tax saving ELSS', 'overnight safe cash')"),
        })),
    types.FunctionDeclaration(
        name="highlight_products",
        description="Visually highlight specific fund cards in the Product Explorer when referencing them by name or ID.",
        parameters=_S(type=_T.OBJECT, properties={"product_ids": _arr("Fund product IDs e.g. ['CPW-EQ-003', 'CPW-HB-002']")},
                      required=["product_ids"])),
    types.FunctionDeclaration(
        name="get_portfolio_diagnostics",
        description="Analyze the client's current portfolio holdings, asset allocation skew, concentration risks, and goal progress.",
        parameters=_S(type=_T.OBJECT, properties={
            "user_id": _S(type=_T.STRING, description="Client ID (defaults to active client Rahul Sharma)")
        })),
    types.FunctionDeclaration(
        name="simulate_portfolio",
        description="Run real-time portfolio projection and Monte Carlo scenario stress-testing. Updates visual allocation donuts, growth projection cones, and goal probability charts.",
        parameters=_S(type=_T.OBJECT, properties={
            "equity_pct": _S(type=_T.NUMBER, description="Target equity allocation percentage 0-100 (e.g. 65)"),
            "debt_pct": _S(type=_T.NUMBER, description="Target debt allocation percentage 0-100 (e.g. 20)"),
            "gold_pct": _S(type=_T.NUMBER, description="Target gold/commodities allocation percentage 0-100 (e.g. 10)"),
            "liquid_pct": _S(type=_T.NUMBER, description="Target cash/liquid allocation percentage 0-100 (e.g. 5)"),
            "monthly_sip_inr": _S(type=_T.INTEGER, description="Proposed total monthly SIP in INR (e.g. 100000)"),
            "horizon_years": _S(type=_T.INTEGER, description="Projection horizon in years (e.g. 10 or 15)"),
            "market_scenario": _S(type=_T.STRING, description="Scenario: 'baseline', 'bull_expansion', 'bear_recession', 'rate_cut_cycle', 'high_inflation'"),
        })),
    types.FunctionDeclaration(
        name="add_to_basket",
        description="Add a fund/instrument to the Advisory Basket for execution with lump-sum and/or monthly SIP allocations.",
        parameters=_S(type=_T.OBJECT, properties={
            "product_id": _S(type=_T.STRING, description="Fund ID (e.g. 'CPW-EQ-003')"),
            "lumpsum_amount_inr": _S(type=_T.INTEGER, description="One-time investment amount in INR"),
            "monthly_sip_amount_inr": _S(type=_T.INTEGER, description="Monthly recurring SIP amount in INR"),
            "linked_goal": _S(type=_T.STRING, description="e.g. 'Children Higher Ed 2032', 'Retirement 2042'"),
        }, required=["product_id"])),
    types.FunctionDeclaration(
        name="remove_from_basket",
        description="Remove a fund from the Advisory Basket by product_id.",
        parameters=_S(type=_T.OBJECT, properties={
            "product_id": _S(type=_T.STRING, description="Fund ID to remove")
        }, required=["product_id"])),
    types.FunctionDeclaration(
        name="view_basket",
        description="Open and summarize the current Advisory Basket drawer/modal.",
        parameters=_S(type=_T.OBJECT, properties={})),
    types.FunctionDeclaration(
        name="generate_advisory_proposal",
        description="Generate a formal, downloadable Wealth Advisory Summary & Proposal (PDF) with strategic rationale, rebalancing breakdown, and SEBI compliance disclaimers.",
        parameters=_S(type=_T.OBJECT, properties={
            "strategic_rationale": _S(type=_T.STRING, description="Summary rationale for proposed shifts"),
            "client_notes": _S(type=_T.STRING, description="Personalized guidance for the client")
        })),
    types.FunctionDeclaration(
        name="request_mandate_authorization",
        description="Present the final advisory mandate summary, auto-debit bank authorization (e-NACH), and prompt for client OTP confirmation.",
        parameters=_S(type=_T.OBJECT, properties={})),
    types.FunctionDeclaration(
        name="execute_mandate",
        description="Authorize and execute the Advisory Basket transactions using the client's 4-digit security OTP. Only call after the client provides the OTP.",
        parameters=_S(type=_T.OBJECT, properties={
            "otp": _S(type=_T.STRING, description="4-digit authorization OTP (e.g. '7701')")
        }, required=["otp"])),
]

TOOL = types.Tool(function_declarations=FUNCTION_DECLARATIONS)


def system_instruction(profile: dict, name: str = "Ananya", live: bool = False) -> str:
    client_name = profile.get("name", "Rahul Sharma")
    client_city = profile.get("city", "Bengaluru")
    aum = profile.get("total_aum_inr", 7500000)
    aum_lakhs = aum / 100000
    risk = profile.get("risk_profile", "Moderately Aggressive")

    return f"""You are **Ananya**, Senior Private Wealth Relationship Manager & Fiduciary Advisor at **Cymbal Premier Wealth Management**.
You are conducting a private wealth advisory session with **{client_name}**, a 38-year-old Tech Executive from {client_city}.

### CLIENT CONTEXT & PORTFOLIO SNAPSHOT:
- **Total Managed AUM**: ₹{aum_lakhs:.1f} Lakhs (₹75,00,000).
- **Risk Classification**: {risk} (comfortable with controlled equity volatility for multi-decade compounding).
- **Current Allocation Skew**: 70% Equity (₹52.5L — 80% concentrated in single Large Cap fund), 15% Debt (₹11.25L), 10% Gold (₹7.5L), 5% Liquid (₹3.75L).
- **Cashflow Profile**: Monthly income surplus of ₹1,50,000 with ₹60,000 active SIPs → **₹90,000/month idle unallocated surplus**.
- **Financial Goals**:
  1. Children's Higher Education (2032: ₹50 Lakhs) — Currently funded ₹22L (on track).
  2. Early Financial Independence / Retirement (2042: ₹5 Crores) — Needs SIP boost from unallocated cash surplus.

### YOUR ADVISORY POSTURE:
- **Fiduciary & Factual**: Speak with calm authority. Use clear metrics (CAGR, XIRR, Drawdown, Sharpe ratio, Asset Allocation shifts).
- **Empathy with Structure**: Validate the client's financial aspirations, then provide unambiguous portfolio prescription.
- **Multilingual Fluidity**: Fluidly understand English, Hindi, and Hinglish. Always respond in natural, professional English or polite conversational Hinglish as appropriate.
- **Indian Financial Fluency**: Naturally refer to values in Lakhs (L) and Crores (Cr), SIP/STP, e-NACH auto-debit, SGBs, ELSS, and SEBI regulations.

### REGULATORY & COMPLIANCE GUARDRAILS:
- **SEBI Mutual Fund Disclaimer**: Never guarantee fixed investment yields on equity/market-linked products. Emphasize that projections are modeled estimates.
- **Risk Appropriateness**: Do not recommend extreme small-cap over-allocation to conservative investors. Maintain asset class balance.
- **Explicit Mandate Consent**: Never execute transactions without explicit client review and OTP authorization.

### TOOL-CALLING DIRECTIVES ("YOUR HANDS"):
1. **Initial Review**: Call `get_portfolio_diagnostics()` to surface concentration risks and goal milestones on screen.
2. **Fund Recommendations**: When recommending asset classes or themes, call `filter_products(...)` and `highlight_products(...)` so the Product Explorer displays cards live.
3. **Simulation & Stress-Testing**: When discussing rebalancing (e.g. 65% Equity, 20% Debt, 10% Gold, 5% Liquid) or SIP boosts, call `simulate_portfolio(...)` to update the visual charts live.
4. **Advisory Basket Execution**: Call `add_to_basket(...)` when specific fund allocations are agreed upon. Call `view_basket()` to open the review drawer.
5. **Proposal Document**: Call `generate_advisory_proposal(...)` when the client requests a formal advisory summary or PDF.
6. **Mandate Authorization**: Call `request_mandate_authorization()` to present the e-NACH mandate and when the client provides the OTP (e.g. '7701'), immediately call `execute_mandate(otp='7701')`.

Keep your spoken replies crisp, engaging, and under 3-4 sentences per conversational turn."""
