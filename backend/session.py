"""WealthSession: per-connection demo state + tool handlers that drive the UI.

Each tool returns a JSON-able result for the model AND queues `ui_command` events
(in self.outbox) that the frontend reacts to.
"""
from __future__ import annotations
import json, asyncio, re
from pathlib import Path
from typing import Any, Callable, Optional

from . import config


def _load(name: str):
    return json.loads((config.DATA_DIR / name).read_text())


# Synonym keywords for financial search & category mapping
_FIN_SYNONYMS = {
    "equity": ["stock", "shares", "equity", "growth", "large cap", "mid cap", "small cap", "bluechip"],
    "debt": ["debt", "bonds", "fixed income", "fd", "gilt", "corporate bond", "liquid", "safe"],
    "gold": ["gold", "sgb", "silver", "commodity", "bullion", "precious metals"],
    "hybrid": ["hybrid", "balanced", "multi-asset", "dynamic", "baf", "all-weather"],
    "tax-saving": ["elss", "80c", "tax saver", "tax deduction"],
    "retirement": ["pension", "retirement", "2040", "swp", "corpus", "annuity"],
    "education": ["child", "education", "college", "tuition", "2032"],
    "tech": ["technology", "ai", "cloud", "us tech", "global tech", "nasdaq"],
}


class WealthSession:
    def __init__(self, send: Optional[Callable[[dict], Any]] = None):
        self.send = send
        self.funds: list[dict] = _load("funds.json")
        self.profiles: dict = _load("profiles.json")
        self.active_profile_key = "investor"
        self.profile = self.profiles[self.active_profile_key]

        # Demo session state
        self.basket: list[dict] = []
        self.outbox: list[dict] = []
        self.active_scenario: str = "baseline"
        self.mandate_status: str = "draft"
        self.portfolio = json.loads(json.dumps(self.profile))

    def set_sender(self, fn: Callable[[dict], Any]):
        self.send = fn

    def queue(self, cmd_type: str, **payload):
        """Queue a UI command to be pushed to the client."""
        cmd = {"type": cmd_type, **payload}
        self.outbox.append(cmd)

    def drain(self) -> list[dict]:
        cmds = list(self.outbox)
        self.outbox.clear()
        return cmds

    def drain_outbox(self) -> list[dict]:
        return self.drain()

    # ---------- Tool Handlers ----------

    def t_filter_products(self, category: str = None, sub_category: str = None,
                          risk_level: str = None, min_cagr_3y: float = None,
                          max_ter: float = None, rating: int = None,
                          tags: list[str] = None, query: str = None, **_) -> dict:
        results = []
        cat_lower = (category or "").lower()
        sub_lower = (sub_category or "").lower()
        risk_lower = (risk_level or "").lower()
        q_lower = (query or "").lower()
        tag_list = [t.lower() for t in (tags or [])]

        for fund in self.funds:
            score = 0
            # Category match
            if cat_lower:
                if cat_lower in fund["category"].lower():
                    score += 5
                else:
                    continue  # Strict category filter if specified

            # Sub-category match
            if sub_lower and sub_lower in fund["sub_category"].lower():
                score += 4

            # Risk level match
            if risk_lower and risk_lower in fund["risk_level"].lower():
                score += 3

            # CAGR threshold
            if min_cagr_3y and fund.get("cagr_3y", 0) < min_cagr_3y:
                continue

            # TER ceiling
            if max_ter and fund.get("ter", 1.0) > max_ter:
                continue

            # Rating threshold
            if rating and fund.get("rating", 0) < rating:
                continue

            # Tags match
            fund_tags = [t.lower() for t in fund.get("tags", [])]
            for t in tag_list:
                if any(t in ft for ft in fund_tags):
                    score += 3

            # Query text match
            if q_lower:
                txt = f"{fund['name']} {fund['description']} {' '.join(fund['top_holdings'])} {fund['sub_category']}".lower()
                if q_lower in txt:
                    score += 5
                for word in q_lower.split():
                    if len(word) > 2 and word in txt:
                        score += 2

            results.append((score, fund))

        # Sort by match score descending, then 3Y CAGR descending
        results.sort(key=lambda x: (x[0], x[1].get("cagr_3y", 0)), reverse=True)
        top_matches = [f for _, f in results][:12]

        self.queue("filter_catalog",
                   category=category,
                   sub_category=sub_category,
                   query=query,
                   results_count=len(top_matches),
                   fund_ids=[f["id"] for f in top_matches])

        return {
            "total_matches": len(results),
            "displayed": [
                {
                    "id": f["id"],
                    "name": f["name"],
                    "category": f["category"],
                    "sub_category": f["sub_category"],
                    "cagr_3y": f["cagr_3y"],
                    "ter": f["ter"],
                    "risk_level": f["risk_level"],
                    "rating": f["rating"]
                }
                for f in top_matches
            ]
        }

    def t_highlight_products(self, product_ids: list[str], **_) -> dict:
        valid_ids = [pid for pid in product_ids if any(f["id"] == pid for f in self.funds)]
        self.queue("highlight_products", product_ids=valid_ids)
        return {"highlighted": valid_ids}

    def t_get_portfolio_diagnostics(self, user_id: str = None, **_) -> dict:
        current_alloc = self.portfolio.get("current_allocation", {})
        holdings = self.portfolio.get("current_holdings", [])
        total_aum = self.portfolio.get("total_aum_inr", 7500000)

        diagnostics = {
            "client_name": self.portfolio.get("name"),
            "total_aum_inr": total_aum,
            "current_allocation": current_alloc,
            "concentration_risks": self.portfolio.get("portfolio_health_notes", []),
            "goals": self.portfolio.get("goals", []),
            "monthly_surplus_inr": self.portfolio.get("monthly_surplus_inr", 150000),
            "unallocated_surplus_inr": self.portfolio.get("monthly_surplus_inr", 150000) - self.portfolio.get("active_sip_inr", 60000),
        }

        self.queue("show_portfolio_diagnostics", diagnostics=diagnostics)
        return diagnostics

    def t_simulate_portfolio(self, equity_pct: float = None, debt_pct: float = None,
                             gold_pct: float = None, liquid_pct: float = None,
                             monthly_sip_inr: int = None, horizon_years: int = 15,
                             market_scenario: str = "baseline", **_) -> dict:
        # Default target weights if unspecified
        eq = equity_pct if equity_pct is not None else 65.0
        db = debt_pct if debt_pct is not None else 20.0
        gd = gold_pct if gold_pct is not None else 10.0
        lq = liquid_pct if liquid_pct is not None else 5.0
        sip = monthly_sip_inr if monthly_sip_inr is not None else 100000

        # Scenario return assumptions
        scenario_returns = {
            "baseline": {"equity": 0.14, "debt": 0.075, "gold": 0.10, "liquid": 0.06},
            "bull_expansion": {"equity": 0.18, "debt": 0.08, "gold": 0.08, "liquid": 0.065},
            "bear_recession": {"equity": 0.08, "debt": 0.09, "gold": 0.15, "liquid": 0.055},
            "rate_cut_cycle": {"equity": 0.16, "debt": 0.095, "gold": 0.12, "liquid": 0.05},
            "high_inflation": {"equity": 0.12, "debt": 0.06, "gold": 0.18, "liquid": 0.065},
        }
        rates = scenario_returns.get(market_scenario, scenario_returns["baseline"])

        blended_cagr = (
            (eq / 100) * rates["equity"] +
            (db / 100) * rates["debt"] +
            (gd / 100) * rates["gold"] +
            (lq / 100) * rates["liquid"]
        )

        current_aum = self.portfolio.get("total_aum_inr", 7500000)

        # Compound growth projection
        years = list(range(2026, 2026 + horizon_years + 1))
        corpus_trajectory = []
        compounded = float(current_aum)
        annual_sip = float(sip * 12)

        for yr in years:
            corpus_trajectory.append({
                "year": yr,
                "projected_corpus_inr": round(compounded),
                "education_goal_target": 5000000 if yr == 2032 else None,
                "retirement_goal_target": 50000000 if yr == 2042 else None,
            })
            compounded = (compounded + annual_sip) * (1 + blended_cagr)

        final_corpus = corpus_trajectory[-1]["projected_corpus_inr"]
        retirement_met = final_corpus >= 50000000

        simulation_result = {
            "scenario": market_scenario,
            "target_allocation": {"equity": eq, "debt": db, "gold": gd, "liquid": lq},
            "blended_expected_cagr_pct": round(blended_cagr * 100, 2),
            "monthly_sip_inr": sip,
            "horizon_years": horizon_years,
            "projected_final_corpus_inr": final_corpus,
            "goals_feasibility": {
                "education_2032_status": "Fully Funded (140% probability)",
                "retirement_2042_status": "Achieved (₹5.8 Cr projected vs ₹5.0 Cr target)" if retirement_met else "Shortfall",
            },
            "trajectory": corpus_trajectory[:10]  # First 10 milestones
        }

        self.queue("update_simulation", simulation=simulation_result)
        return simulation_result

    def t_add_to_basket(self, product_id: str, lumpsum_amount_inr: int = 0,
                         monthly_sip_amount_inr: int = 0, linked_goal: str = None, **_) -> dict:
        fund = next((f for f in self.funds if f["id"] == product_id), None)
        if not fund:
            return {"error": f"Fund {product_id} not found in catalog"}

        # Check if already in basket
        existing = next((b for b in self.basket if b["product_id"] == product_id), None)
        if existing:
            if lumpsum_amount_inr: existing["lumpsum_inr"] = lumpsum_amount_inr
            if monthly_sip_amount_inr: existing["monthly_sip_inr"] = monthly_sip_amount_inr
            if linked_goal: existing["linked_goal"] = linked_goal
        else:
            self.basket.append({
                "product_id": product_id,
                "name": fund["name"],
                "category": fund["category"],
                "sub_category": fund["sub_category"],
                "lumpsum_inr": lumpsum_amount_inr or 0,
                "monthly_sip_inr": monthly_sip_amount_inr or 0,
                "linked_goal": linked_goal or "Wealth Creation",
                "cagr_3y": fund.get("cagr_3y"),
                "ter": fund.get("ter"),
            })

        total_lumpsum = sum(item["lumpsum_inr"] for item in self.basket)
        total_sip = sum(item["monthly_sip_inr"] for item in self.basket)

        self.queue("update_basket", basket=self.basket, total_lumpsum=total_lumpsum, total_sip=total_sip)
        return {
            "status": "added",
            "basket_count": len(self.basket),
            "total_lumpsum_inr": total_lumpsum,
            "total_monthly_sip_inr": total_sip,
            "current_basket": self.basket
        }

    def t_remove_from_basket(self, product_id: str, **_) -> dict:
        self.basket = [b for b in self.basket if b["product_id"] != product_id]
        total_lumpsum = sum(item["lumpsum_inr"] for item in self.basket)
        total_sip = sum(item["monthly_sip_inr"] for item in self.basket)
        self.queue("update_basket", basket=self.basket, total_lumpsum=total_lumpsum, total_sip=total_sip)
        return {"status": "removed", "basket_count": len(self.basket)}

    def t_view_basket(self, **_) -> dict:
        total_lumpsum = sum(item["lumpsum_inr"] for item in self.basket)
        total_sip = sum(item["monthly_sip_inr"] for item in self.basket)
        self.queue("open_modal", modal="basket")
        return {
            "basket": self.basket,
            "total_lumpsum_inr": total_lumpsum,
            "total_monthly_sip_inr": total_sip
        }

    def t_generate_advisory_proposal(self, strategic_rationale: str = None, client_notes: str = None, **_) -> dict:
        import time
        from .proposal import generate_proposal_pdf

        proposal_id = f"CPW-PROP-{int(time.time() * 1000) % 100000:05d}"
        proposal = {
            "proposal_id": proposal_id,
            "client_name": self.portfolio.get("name", "Rahul Sharma"),
            "date": "2026-08-17",
            "strategic_rationale": strategic_rationale or "Rebalance large-cap concentration into high-alpha Flexi Cap and Multi-Asset diversification while mobilizing unallocated monthly surplus into goal-locked SIPs.",
            "client_notes": client_notes or "Portfolio trajectory upgraded to reach ₹5.8 Cr corpus by 2042.",
            "basket_items": self.basket,
            "total_lumpsum_inr": sum(b["lumpsum_inr"] for b in self.basket),
            "total_sip_inr": sum(b["monthly_sip_inr"] for b in self.basket),
            "download_url": f"/api/proposals/{proposal_id}.pdf"
        }

        # Generate the real PDF artifact on disk
        pdf_path = config.ASSETS_DIR / "proposals" / f"{proposal_id}.pdf"
        try:
            generate_proposal_pdf(proposal, pdf_path)
            proposal["pdf_generated"] = True
        except Exception as e:
            print(f"[proposal] error generating PDF: {e!r}")
            proposal["pdf_generated"] = False

        self.queue("proposal_ready", proposal=proposal)
        return proposal

    def t_request_mandate_authorization(self, **_) -> dict:
        self.queue("open_modal", modal="mandate_authorization")
        return {
            "status": "awaiting_otp",
            "auth_bank": self.portfolio.get("bank_account", {}).get("bank"),
            "account_last4": self.portfolio.get("bank_account", {}).get("account_number_last4"),
            "expected_otp": "7701",
            "message": "Mandate authorization dialog opened on client screen. Awaiting client OTP '7701'."
        }

    def t_execute_mandate(self, otp: str, **_) -> dict:
        import time
        if str(otp).strip() != "7701":
            return {"status": "error", "message": "Invalid OTP. Please enter the 4-digit code 7701."}

        self.mandate_status = "authorized"
        txn_id = f"CPW-TXN-{int(time.time() * 1000) % 100000:05d}"

        # Apply basket additions to mock portfolio holdings
        for item in self.basket:
            self.portfolio["current_holdings"].append({
                "id": item["product_id"],
                "name": item["name"],
                "category": item["category"],
                "invested_inr": item["lumpsum_inr"] or (item["monthly_sip_inr"] * 12),
                "current_value_inr": item["lumpsum_inr"] or (item["monthly_sip_inr"] * 12),
                "unrealized_gain_inr": 0,
                "xirr": item.get("cagr_3y", 15.0)
            })

        self.queue("mandate_executed",
                   transaction_id=txn_id,
                   status="success",
                   basket=self.basket,
                   portfolio=self.portfolio)

        return {
            "status": "success",
            "transaction_id": txn_id,
            "executed_items": len(self.basket),
            "message": f"Mandate {txn_id} successfully authorized via e-NACH auto-debit."
        }


# Mapping for function dispatcher
HANDLERS = {
    "filter_products": WealthSession.t_filter_products,
    "highlight_products": WealthSession.t_highlight_products,
    "get_portfolio_diagnostics": WealthSession.t_get_portfolio_diagnostics,
    "simulate_portfolio": WealthSession.t_simulate_portfolio,
    "add_to_basket": WealthSession.t_add_to_basket,
    "remove_from_basket": WealthSession.t_remove_from_basket,
    "view_basket": WealthSession.t_view_basket,
    "generate_advisory_proposal": WealthSession.t_generate_advisory_proposal,
    "request_mandate_authorization": WealthSession.t_request_mandate_authorization,
    "execute_mandate": WealthSession.t_execute_mandate,
}
