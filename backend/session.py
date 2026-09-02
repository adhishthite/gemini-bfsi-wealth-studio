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
    "equity": [
        "stock",
        "shares",
        "equity",
        "growth",
        "large cap",
        "mid cap",
        "small cap",
        "bluechip",
    ],
    "debt": [
        "debt",
        "bonds",
        "fixed income",
        "fd",
        "gilt",
        "corporate bond",
        "liquid",
        "safe",
    ],
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

    def resolve_profile_key(self, key_or_query: str) -> str:
        if not key_or_query:
            return self.active_profile_key
        q = str(key_or_query).lower().strip()
        if q in self.profiles:
            return q
        for k, p in self.profiles.items():
            if (
                q in k.lower()
                or q in p.get("name", "").lower()
                or q in p.get("user_id", "").lower()
                or q in p.get("occupation", "").lower()
                or q in p.get("risk_profile", "").lower()
            ):
                return k
        return self.active_profile_key

    def switch_profile(self, profile_key: str) -> dict:
        key = self.resolve_profile_key(profile_key)
        self.active_profile_key = key
        self.profile = self.profiles[key]
        self.portfolio = json.loads(json.dumps(self.profile))
        self.basket = []
        self.mandate_status = "draft"
        self.queue(
            "profile_switched",
            profile_key=key,
            profile=self.profile,
            portfolio=self.portfolio,
        )
        return {
            "status": "success",
            "active_profile_key": key,
            "client_name": self.profile.get("name"),
            "total_aum_inr": self.profile.get("total_aum_inr"),
            "risk_profile": self.profile.get("risk_profile"),
        }

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

    def t_filter_products(
        self,
        category: str = None,
        sub_category: str = None,
        risk_level: str = None,
        min_cagr_3y: float = None,
        max_ter: float = None,
        rating: int = None,
        tags: list[str] = None,
        limit: int = None,
        product_ids: list[str] = None,
        query: str = None,
        **_,
    ) -> dict:
        # Explicit product ID filtering
        if product_ids:
            id_set = set(product_ids)
            matched = [f for f in self.funds if f["id"] in id_set]
            if limit and limit > 0:
                matched = matched[:limit]
            self.queue(
                "filter_catalog",
                category=category if category != "All" else None,
                sub_category=sub_category if sub_category != "All" else None,
                query=query,
                results_count=len(matched),
                fund_ids=[f["id"] for f in matched],
            )
            return {
                "total_matches": len(matched),
                "displayed": [
                    {
                        "id": f["id"],
                        "name": f["name"],
                        "category": f["category"],
                        "sub_category": f["sub_category"],
                        "cagr_3y": f["cagr_3y"],
                        "ter": f["ter"],
                        "risk_level": f["risk_level"],
                        "rating": f["rating"],
                    }
                    for f in matched
                ],
            }

        results = []
        cat_lower = (category or "").lower()
        if cat_lower == "all":
            cat_lower = ""
        sub_lower = (sub_category or "").lower()
        if sub_lower == "all":
            sub_lower = ""
        risk_lower = (risk_level or "").lower()
        if risk_lower == "all":
            risk_lower = ""
        q_lower = (query or "").lower()
        tag_list = [t.lower() for t in (tags or [])]

        # Auto-detect single fund intent from query string
        effective_limit = limit
        if q_lower and any(
            phrase in q_lower
            for phrase in [
                "only 1",
                "top 1",
                "single fund",
                "best 1",
                "just 1",
                "1 fund",
                "one fund",
            ]
        ):
            effective_limit = 1

        has_filter = bool(
            cat_lower
            or sub_lower
            or risk_lower
            or q_lower
            or tag_list
            or min_cagr_3y is not None
            or max_ter is not None
            or rating is not None
            or effective_limit is not None
        )

        if not has_filter:
            self.queue(
                "filter_catalog",
                category=None,
                sub_category=None,
                query=None,
                results_count=len(self.funds),
                fund_ids=None,
            )
            return {
                "total_matches": len(self.funds),
                "displayed": [
                    {
                        "id": f["id"],
                        "name": f["name"],
                        "category": f["category"],
                        "sub_category": f["sub_category"],
                        "cagr_3y": f["cagr_3y"],
                        "ter": f["ter"],
                        "rating": f["rating"],
                    }
                    for f in self.funds
                ],
            }

        has_specific_filter = bool(
            sub_lower
            or q_lower
            or tag_list
            or risk_lower
            or effective_limit is not None
        )

        for fund in self.funds:
            score = 0
            name = fund.get("name", "")
            subcat = fund.get("sub_category", "")
            cat = fund.get("category", "")
            desc = fund.get("description", "")
            holdings = " ".join(fund.get("top_holdings", []))
            ftags = " ".join(fund.get("tags", []))
            txt = f"{name} {subcat} {cat} {desc} {holdings} {ftags}".lower()

            # Category match
            if cat_lower:
                if cat_lower not in cat.lower():
                    continue
                score += 2

            # Sub-category match (handles single or multi-subcategory e.g. "Flexi Cap, Global Tech")
            if sub_lower:
                sub_terms = [
                    s.strip().lower()
                    for s in sub_lower.replace("&", ",").replace("and", ",").split(",")
                    if s.strip()
                ]
                sub_matched = any(
                    st in subcat.lower() or st in name.lower() or st in desc.lower()
                    for st in sub_terms
                )
                if sub_matched:
                    score += 20
                elif not q_lower and not tag_list:
                    continue

            # Risk level match
            if risk_lower and risk_lower in fund.get("risk_level", "").lower():
                score += 5

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
                    score += 10

            # Query text match with key financial theme phrase boosting
            if q_lower:
                phrases = [
                    "flexi cap",
                    "global tech",
                    "us tech",
                    "ai technology",
                    "manufacturing",
                    "capex",
                    "all-weather",
                    "balanced advantage",
                    "baf",
                    "elss",
                    "tax saver",
                    "corporate bond",
                    "gold",
                    "silver",
                    "small cap",
                    "mid cap",
                    "large cap",
                    "overnight",
                    "technology",
                    "nasdaq",
                ]
                for p in phrases:
                    if p in q_lower and (p in txt or p.replace("-", " ") in txt):
                        score += 25

                ignore_words = {
                    "the",
                    "and",
                    "for",
                    "top",
                    "fund",
                    "funds",
                    "show",
                    "cap",
                    "global",
                    "equity",
                    "only",
                    "that",
                    "should",
                    "use",
                }
                for word in q_lower.replace(",", " ").replace("&", " ").split():
                    if len(word) > 2 and word not in ignore_words:
                        if word in txt:
                            score += 5

            if has_specific_filter and score <= 2:
                continue

            results.append((score, fund))

        # Sort by match score descending, then 3Y CAGR descending
        results.sort(key=lambda x: (x[0], x[1].get("cagr_3y", 0)), reverse=True)
        default_count = 8 if has_specific_filter else 12
        slice_count = (
            effective_limit
            if (effective_limit and effective_limit > 0)
            else default_count
        )
        top_matches = [f for _, f in results][:slice_count]

        self.queue(
            "filter_catalog",
            category=category if category != "All" else None,
            sub_category=sub_category if sub_category != "All" else None,
            query=query,
            results_count=len(top_matches),
            fund_ids=[f["id"] for f in top_matches],
        )

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
                    "rating": f["rating"],
                }
                for f in top_matches
            ],
        }

    def t_highlight_products(self, product_ids: list[str], **_) -> dict:
        valid_ids = [
            pid for pid in product_ids if any(f["id"] == pid for f in self.funds)
        ]
        if valid_ids:
            self.queue(
                "filter_catalog",
                results_count=len(valid_ids),
                fund_ids=valid_ids,
            )
            self.queue("highlight_products", product_ids=valid_ids)
        return {"highlighted": valid_ids}

    def t_switch_client_profile(self, profile_key: str, **_) -> dict:
        return self.switch_profile(profile_key)

    def t_get_portfolio_diagnostics(self, user_id: str = None, **_) -> dict:
        if user_id and user_id != self.portfolio.get("user_id"):
            self.switch_profile(user_id)

        current_alloc = self.portfolio.get("current_allocation", {})
        holdings = self.portfolio.get("current_holdings", [])
        total_aum = self.portfolio.get("total_aum_inr", 7500000)
        surplus = self.portfolio.get("monthly_surplus_inr", 150000)
        sip = self.portfolio.get("active_sip_inr", 60000)

        diagnostics = {
            "client_name": self.portfolio.get("name"),
            "total_aum_inr": total_aum,
            "current_allocation": current_alloc,
            "concentration_risks": self.portfolio.get("portfolio_health_notes", []),
            "goals": self.portfolio.get("goals", []),
            "monthly_surplus_inr": surplus,
            "unallocated_surplus_inr": max(0, surplus - sip),
        }

        self.queue("show_portfolio_diagnostics", diagnostics=diagnostics)
        return diagnostics

    def t_simulate_portfolio(
        self,
        equity_pct: float = None,
        debt_pct: float = None,
        gold_pct: float = None,
        liquid_pct: float = None,
        monthly_sip_inr: int = None,
        horizon_years: int = 15,
        market_scenario: str = "baseline",
        **_,
    ) -> dict:
        # Default target weights if unspecified
        eq = equity_pct if equity_pct is not None else 65.0
        db = debt_pct if debt_pct is not None else 20.0
        gd = gold_pct if gold_pct is not None else 10.0
        lq = liquid_pct if liquid_pct is not None else 5.0
        sip = (
            monthly_sip_inr
            if monthly_sip_inr is not None
            else self.portfolio.get("monthly_surplus_inr", 100000)
        )

        # Scenario return assumptions
        scenario_returns = {
            "baseline": {"equity": 0.14, "debt": 0.075, "gold": 0.10, "liquid": 0.06},
            "bull_expansion": {
                "equity": 0.18,
                "debt": 0.08,
                "gold": 0.08,
                "liquid": 0.065,
            },
            "bear_recession": {
                "equity": 0.08,
                "debt": 0.09,
                "gold": 0.15,
                "liquid": 0.055,
            },
            "rate_cut_cycle": {
                "equity": 0.16,
                "debt": 0.095,
                "gold": 0.12,
                "liquid": 0.05,
            },
            "high_inflation": {
                "equity": 0.12,
                "debt": 0.06,
                "gold": 0.18,
                "liquid": 0.065,
            },
        }
        rates = scenario_returns.get(market_scenario, scenario_returns["baseline"])

        blended_cagr = (
            (eq / 100) * rates["equity"]
            + (db / 100) * rates["debt"]
            + (gd / 100) * rates["gold"]
            + (lq / 100) * rates["liquid"]
        )

        current_aum = self.portfolio.get("total_aum_inr", 7500000)
        client_goals = self.portfolio.get("goals", [])

        # Compound growth projection
        years = list(range(2026, 2026 + horizon_years + 1))
        corpus_trajectory = []
        compounded = float(current_aum)
        annual_sip = float(sip * 12)

        goals_by_year = {g.get("target_year"): g for g in client_goals}

        for yr in years:
            point = {
                "year": yr,
                "projected_corpus_inr": round(compounded),
            }
            if yr in goals_by_year:
                g = goals_by_year[yr]
                g_amt = g.get("target_amount_inr")
                if "education" in g.get("name", "").lower():
                    point["education_goal_target"] = g_amt
                elif (
                    "retire" in g.get("name", "").lower()
                    or "independence" in g.get("name", "").lower()
                    or "swp" in g.get("name", "").lower()
                ):
                    point["retirement_goal_target"] = g_amt
                else:
                    point["goal_target_inr"] = g_amt
                    point["retirement_goal_target"] = g_amt

            corpus_trajectory.append(point)
            compounded = (compounded + annual_sip) * (1 + blended_cagr)

        final_corpus = corpus_trajectory[-1]["projected_corpus_inr"]

        goals_feasibility = {}
        for idx, g in enumerate(client_goals):
            g_target = g.get("target_amount_inr", 1)
            g_yr = g.get("target_year", 2042)
            pt = next(
                (p for p in corpus_trajectory if p["year"] == g_yr),
                corpus_trajectory[-1],
            )
            proj = pt["projected_corpus_inr"]
            met = proj >= g_target
            g_key = f"goal_{idx + 1}_{g_yr}_status"
            if "education" in g.get("name", "").lower():
                g_key = (
                    "education_2032_status"
                    if g_yr == 2032
                    else f"education_{g_yr}_status"
                )
            elif (
                "retire" in g.get("name", "").lower()
                or "independence" in g.get("name", "").lower()
            ):
                g_key = (
                    "retirement_2042_status"
                    if g_yr == 2042
                    else f"retirement_{g_yr}_status"
                )

            p_str = (
                f"₹{proj / 10000000:.2f} Cr"
                if proj >= 10000000
                else f"₹{proj / 100000:.1f} L"
            )
            t_str = (
                f"₹{g_target / 10000000:.2f} Cr"
                if g_target >= 10000000
                else f"₹{g_target / 100000:.1f} L"
            )
            pct_met = round((proj / g_target) * 100)
            status_desc = (
                f"Achieved ({p_str} projected vs {t_str} target, {pct_met}%)"
                if met
                else f"Funded at {pct_met}% ({p_str} vs {t_str})"
            )
            goals_feasibility[g_key] = status_desc

        simulation_result = {
            "scenario": market_scenario,
            "target_allocation": {"equity": eq, "debt": db, "gold": gd, "liquid": lq},
            "blended_expected_cagr_pct": round(blended_cagr * 100, 2),
            "monthly_sip_inr": sip,
            "horizon_years": horizon_years,
            "projected_final_corpus_inr": final_corpus,
            "goals_feasibility": goals_feasibility,
            "trajectory": corpus_trajectory[:10],
        }

        self.queue("update_simulation", simulation=simulation_result)
        return simulation_result

    def t_add_to_basket(
        self,
        product_id: str,
        lumpsum_amount_inr: int = 0,
        monthly_sip_amount_inr: int = 0,
        linked_goal: str = None,
        **_,
    ) -> dict:
        fund = next((f for f in self.funds if f["id"] == product_id), None)
        if not fund:
            return {"error": f"Fund {product_id} not found in catalog"}

        # Check if already in basket
        existing = next((b for b in self.basket if b["product_id"] == product_id), None)
        if existing:
            if lumpsum_amount_inr:
                existing["lumpsum_inr"] = lumpsum_amount_inr
            if monthly_sip_amount_inr:
                existing["monthly_sip_inr"] = monthly_sip_amount_inr
            if linked_goal:
                existing["linked_goal"] = linked_goal
        else:
            self.basket.append(
                {
                    "product_id": product_id,
                    "name": fund["name"],
                    "category": fund["category"],
                    "sub_category": fund["sub_category"],
                    "lumpsum_inr": lumpsum_amount_inr or 0,
                    "monthly_sip_inr": monthly_sip_amount_inr or 0,
                    "linked_goal": linked_goal or "Wealth Creation",
                    "cagr_3y": fund.get("cagr_3y"),
                    "ter": fund.get("ter"),
                }
            )

        total_lumpsum = sum(item["lumpsum_inr"] for item in self.basket)
        total_sip = sum(item["monthly_sip_inr"] for item in self.basket)

        self.queue(
            "update_basket",
            basket=self.basket,
            total_lumpsum=total_lumpsum,
            total_sip=total_sip,
        )
        return {
            "status": "added",
            "basket_count": len(self.basket),
            "total_lumpsum_inr": total_lumpsum,
            "total_monthly_sip_inr": total_sip,
            "current_basket": self.basket,
        }

    def t_remove_from_basket(self, product_id: str, **_) -> dict:
        self.basket = [b for b in self.basket if b["product_id"] != product_id]
        total_lumpsum = sum(item["lumpsum_inr"] for item in self.basket)
        total_sip = sum(item["monthly_sip_inr"] for item in self.basket)
        self.queue(
            "update_basket",
            basket=self.basket,
            total_lumpsum=total_lumpsum,
            total_sip=total_sip,
        )
        return {"status": "removed", "basket_count": len(self.basket)}

    def t_view_basket(self, **_) -> dict:
        total_lumpsum = sum(item["lumpsum_inr"] for item in self.basket)
        total_sip = sum(item["monthly_sip_inr"] for item in self.basket)
        self.queue("open_modal", modal="basket")
        return {
            "basket": self.basket,
            "total_lumpsum_inr": total_lumpsum,
            "total_monthly_sip_inr": total_sip,
        }

    def t_generate_advisory_proposal(
        self, strategic_rationale: str = None, client_notes: str = None, **_
    ) -> dict:
        import time
        from .proposal import generate_proposal_pdf

        proposal_id = f"CPW-PROP-{int(time.time() * 1000) % 100000:05d}"
        client_name = self.portfolio.get("name", "Rahul Sharma")
        client_risk = self.portfolio.get("risk_profile", "Moderately Aggressive")
        client_aum = self.portfolio.get("total_aum_inr", 7500000)

        proposal = {
            "proposal_id": proposal_id,
            "client_name": client_name,
            "aum_inr": client_aum,
            "risk_profile": client_risk,
            "date": "2026-08-17",
            "strategic_rationale": strategic_rationale
            or f"Rebalance {client_name}'s asset allocation toward high-conviction strategies while mobilizing unallocated monthly surplus into goal-locked mandates.",
            "client_notes": client_notes
            or f"Portfolio trajectory aligned with stated goals under a {client_risk} mandate.",
            "basket_items": self.basket,
            "total_lumpsum_inr": sum(b["lumpsum_inr"] for b in self.basket),
            "total_sip_inr": sum(b["monthly_sip_inr"] for b in self.basket),
            "download_url": f"/api/proposals/{proposal_id}.pdf",
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
        expected_otp = self.portfolio.get("user_id", "U-IND-7701").split("-")[-1]
        self.queue("open_modal", modal="mandate_authorization")
        return {
            "status": "awaiting_otp",
            "auth_bank": self.portfolio.get("bank_account", {}).get("bank"),
            "account_last4": self.portfolio.get("bank_account", {}).get(
                "account_number_last4"
            ),
            "expected_otp": expected_otp,
            "message": f"Mandate authorization dialog opened on client screen. Awaiting client OTP '{expected_otp}'.",
        }

    def t_execute_mandate(self, otp: str, **_) -> dict:
        import time

        expected_otp = self.portfolio.get("user_id", "U-IND-7701").split("-")[-1]
        if str(otp).strip() != expected_otp:
            return {
                "status": "error",
                "message": f"Invalid OTP. Please enter the 4-digit code {expected_otp}.",
            }

        self.mandate_status = "authorized"
        txn_id = f"CPW-TXN-{int(time.time() * 1000) % 100000:05d}"

        # Apply basket additions to mock portfolio holdings
        for item in self.basket:
            self.portfolio["current_holdings"].append(
                {
                    "id": item["product_id"],
                    "name": item["name"],
                    "category": item["category"],
                    "invested_inr": item["lumpsum_inr"]
                    or (item["monthly_sip_inr"] * 12),
                    "current_value_inr": item["lumpsum_inr"]
                    or (item["monthly_sip_inr"] * 12),
                    "unrealized_gain_inr": 0,
                    "xirr": item.get("cagr_3y", 15.0),
                }
            )

        self.queue(
            "mandate_executed",
            transaction_id=txn_id,
            status="success",
            basket=self.basket,
            portfolio=self.portfolio,
        )

        return {
            "status": "success",
            "transaction_id": txn_id,
            "executed_items": len(self.basket),
            "message": f"Mandate {txn_id} successfully authorized via e-NACH auto-debit.",
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
    "switch_client_profile": WealthSession.t_switch_client_profile,
    "switch_profile": WealthSession.t_switch_client_profile,
}
