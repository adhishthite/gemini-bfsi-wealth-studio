# Cymbal Premier Wealth Studio · Demo & Test Runbook

A complete end-to-end presales demonstration runbook for Google Cloud BFSI / Wealth Management customer pitches.

Two validation layers:
- **Layer 1 (Automated CLI):** Run the 7-turn advisory flow through the automated simulator (`simulate_wealth_demo.py`).
- **Layer 2 (Live / Manual):** Drive the real-time React UI + Gemini Live Avatar via voice or text.

---

## 0. Quickstart Setup

```bash
# 1. Environment & Python setup
uv venv
source .venv/bin/activate
uv pip install --default-index https://pypi.org/simple -r backend/requirements.txt

# 2. Google Cloud ADC Authentication
gcloud auth application-default login
gcloud config set project <your-gcp-project>

# 3. Build & Run
# Backend (FastAPI on :8000)
./.venv/bin/python -m uvicorn backend.main:app --port 8000

# Frontend (Vite Dev Server on :5173)
cd frontend && bun install && bun run dev
```

---

## Layer 1 — Automated 7-Turn Runbook Test

```bash
./.venv/bin/python scripts/simulate_wealth_demo.py
```

**Expect:** 7/7 turns PASS with proper function execution and UI commands emitted.

---

## Layer 2 — 7-Turn Presales Demo Script

| Turn | Step | Spoken Client Utterance | Advisor Actions & Live UI Effects |
|---|---|---|---|
| **1** | **Portfolio Health Check** | *"Hi Ananya, can we do a quick review of my portfolio and check if I'm on track for my goals?"* | • Calls `get_portfolio_diagnostics()`<br/>• Opens **Diagnostics Dashboard**<br/>• Highlights **80% Large Cap concentration risk** & **₹90k unallocated monthly surplus** |
| **2** | **Theme & Alpha Exploration** | *"I feel I'm missing out on flexi-caps and global tech AI themes. What funds do you recommend?"* | • Calls `filter_products(category="Equity", tags=["Flexi Cap", "US Tech"])`<br/>• Product Explorer filters and highlights `CPW-EQ-003` (Flexi Cap 21.4% CAGR) and `CPW-EQ-013` (Global Tech 23.5% CAGR) |
| **3** | **Downside & Rate Protection** | *"I also want something that protects against market volatility and interest rate changes."* | • Calls `filter_products(category="Hybrid", tags=["All-Weather", "Auto-Rebalance"])`<br/>• Displays `CPW-HB-002` (Multi-Asset) & `CPW-DB-009` (CRISIL SDL 2030) |
| **4** | **Interactive Simulation** | *"If we rebalance 65% Equity, 20% Debt, 10% Gold, 5% Liquid and bump my SIP to ₹1 Lakh/month, will I hit my ₹5 Cr retirement goal by 2042?"* | • Calls `simulate_portfolio(...)`<br/>• Visualizes **Asset Allocation Donut** and **Monte Carlo Milestone Cone**<br/>• Confirms ₹5.82 Cr projected corpus (**116% Goal Achieved**) |
| **5** | **Advisory Basket Staging** | *"Let's add ₹35k in Flexi Cap, ₹25k in Multi-Asset, ₹20k in Target Maturity Debt, and ₹20k in Global Tech."* | • Calls `add_to_basket(...)` for 4 funds<br/>• Calls `view_basket()` to open **Advisory Basket Drawer** with ₹1,00,000/mo total SIP breakdown |
| **6** | **Advisory Proposal PDF** | *"Can you generate a formal investment proposal document for my records?"* | • Calls `generate_advisory_proposal()`<br/>• Generates branded 2-page PDF via ReportLab<br/>• Surfaces instant **Download Proposal PDF** card |
| **7** | **Mandate Authorization** | *"Let's authorize the e-NACH mandate. My OTP is 7701."* | • Calls `request_mandate_authorization()`<br/>• Calls `execute_mandate(otp="7701")`<br/>• Confirms e-NACH registration, generates Transaction ID `CPW-TXN-XXXXX`, updates live portfolio |

---

## Live Avatar (Real Video via Gemini 3.1 Live API)

To enable the real-time photoreal video avatar stream in `.env`:
```bash
AVATAR_TRANSPORT=live
LIVE_PROJECT=<your-preview-entitled-project>
LIVE_LOCATION=us-central1
AVATAR_NAME=Ananya
AVATAR_VOICE=Aoede
```
