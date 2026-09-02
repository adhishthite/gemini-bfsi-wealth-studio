#!/usr/bin/env python3
"""Run automated multi-turn wealth advisory simulation test against WealthSession & tools.

  ./.venv/bin/python scripts/simulate_wealth_demo.py
"""
import sys, os
from pathlib import Path

# Add repo root to path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.session import WealthSession

DEMO_TURNS = [
    {
        "turn": 1,
        "name": "Portfolio Review & Diagnostics",
        "client": "Hi Ananya, can we do a quick review of my portfolio and check if I'm on track for my goals?",
        "action": lambda s: s.t_get_portfolio_diagnostics(),
        "verify": lambda r, cmds: "total_aum_inr" in r and any(c["type"] == "show_portfolio_diagnostics" for c in cmds)
    },
    {
        "turn": 2,
        "name": "Diversification & High Alpha Themes",
        "client": "I feel I'm missing out on flexi-caps and global tech AI themes. What funds do you recommend?",
        "action": lambda s: s.t_filter_products(category="Equity", tags=["Flexi Cap", "US Tech"], min_cagr_3y=18.0),
        "verify": lambda r, cmds: r.get("total_matches", 0) > 0 and any(c["type"] == "filter_catalog" for c in cmds)
    },
    {
        "turn": 3,
        "name": "All-Weather Downside Protection",
        "client": "I also want something that protects against market volatility and interest rate changes.",
        "action": lambda s: s.t_filter_products(category="Hybrid", tags=["All-Weather", "Auto-Rebalance"]),
        "verify": lambda r, cmds: len(r.get("displayed", [])) > 0
    },
    {
        "turn": 4,
        "name": "Portfolio Simulation & Milestone Projection",
        "client": "If we rebalance 65% Equity, 20% Debt, 10% Gold, 5% Liquid and bump my SIP to ₹1 Lakh/month, will I hit my ₹5 Cr retirement goal by 2042?",
        "action": lambda s: s.t_simulate_portfolio(equity_pct=65, debt_pct=20, gold_pct=10, liquid_pct=5, monthly_sip_inr=100000, horizon_years=15),
        "verify": lambda r, cmds: r.get("projected_final_corpus_inr", 0) > 50000000 and any(c["type"] == "update_simulation" for c in cmds)
    },
    {
        "turn": 5,
        "name": "Staging Advisory Basket",
        "client": "Let's add ₹35k in Flexi Cap, ₹25k in Multi-Asset, ₹20k in Target Maturity Debt, and ₹20k in Global Tech.",
        "action": lambda s: (
            s.t_add_to_basket("CPW-EQ-003", monthly_sip_amount_inr=35000, linked_goal="Retirement 2042"),
            s.t_add_to_basket("CPW-HB-002", monthly_sip_amount_inr=25000, linked_goal="Retirement 2042"),
            s.t_add_to_basket("CPW-DB-009", monthly_sip_amount_inr=20000, linked_goal="Education 2032"),
            s.t_add_to_basket("CPW-EQ-013", monthly_sip_amount_inr=20000, linked_goal="Global Hedge"),
            s.t_view_basket()
        )[-1],
        "verify": lambda r, cmds: len(r.get("basket", [])) == 4 and r.get("total_monthly_sip_inr") == 100000
    },
    {
        "turn": 6,
        "name": "Advisory Proposal PDF Generation",
        "client": "Can you generate a formal investment proposal document for my records?",
        "action": lambda s: s.t_generate_advisory_proposal(
            strategic_rationale="Rebalance large cap concentration into Flexi Cap & Multi-Asset strategies while mobilizing ₹90k unallocated monthly surplus into goal-locked SIPs."
        ),
        "verify": lambda r, cmds: r.get("pdf_generated") is True and any(c["type"] == "proposal_ready" for c in cmds)
    },
    {
        "turn": 7,
        "name": "Mandate Authorization & OTP Execution",
        "client": "Let's authorize the e-NACH mandate. My OTP is 7701.",
        "action": lambda s: (s.t_request_mandate_authorization(), s.t_execute_mandate(otp="7701"))[-1],
        "verify": lambda r, cmds: r.get("status") == "success" and any(c["type"] == "mandate_executed" for c in cmds)
    }
]


def run_simulation():
    session = WealthSession()
    print("=" * 70)
    print("CYMBAL PREMIER WEALTH STUDIO — 7-TURN ADVISORY RUNBOOK SIMULATION")
    print("=" * 70)

    passed = 0
    for step in DEMO_TURNS:
        turn_num = step["turn"]
        name = step["name"]
        client_text = step["client"]
        print(f"\n[Turn {turn_num}] {name}")
        print(f"  Client: \"{client_text}\"")

        res = step["action"](session)
        cmds = session.drain()

        ok = step["verify"](res, cmds)
        if ok:
            passed += 1
            print(f"  Result: ✅ PASS — Emitted {len(cmds)} UI command(s)")
            for c in cmds:
                print(f"    ↳ ui_command: {c['type']}")
        else:
            print(f"  Result: ❌ FAIL — Output: {res}")

    print("\n" + "=" * 70)
    print(f"SIMULATION SUMMARY: {passed}/{len(DEMO_TURNS)} TURNS PASSED")
    print("=" * 70)
    return passed == len(DEMO_TURNS)


if __name__ == "__main__":
    success = run_simulation()
    sys.exit(0 if success else 1)
