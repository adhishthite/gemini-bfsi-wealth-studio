# Cymbal Premier — Private Wealth & Advisory Studio

An India-first, AI-powered **Private Wealth Management & Portfolio Advisory Studio** for *Cymbal Premier Wealth*. A photoreal AI Senior Relationship Manager, **Ananya**, converses in real time with high-net-worth clients, audits portfolio health, simulates 15-year goal compounding, stages advisory baskets, authorizes e-NACH mandates, and generates official SEBI-compliant Advisory Proposals — built on Google-native AI.

Realizes the Google Cloud BFSI GenAI Architecture. Designed for enterprise private banking and wealth management presales demonstrations.

---

## What's Google-Native Here

| Capability | Powered By | Role in Demo |
|---|---|---|
| **Conversational RM Brain + Tool Execution** | **Gemini** (`gemini-2.5-flash` on Vertex AI) | Real-time portfolio analysis, asset allocation steering, and tool orchestration |
| **Photoreal Live Video Advisor (Flag-Gated)** | **Gemini 3.1 Live API — Live Avatar** | Low-latency bidirectional audiovisual video stream with lip sync |
| **Portfolio Diagnostics & Drift Engine** | Vertex Function Calling (`get_portfolio_diagnostics`) | Audits Current (70/15/10/5) vs Strategic Target (65/20/10/5) asset allocation |
| **15-Year Goal Simulation Lab** | Vertex Function Calling (`simulate_portfolio`) | Macro scenario modeling (Supercycle, Recession, Inflation) & Compounding Growth Cone |
| **Statutory SEBI Proposal Generation** | Python `ReportLab` PDF Engine (`generate_proposal_pdf`) | Generates downloadable, tamper-evident private wealth advisory proposals |
| **Voice In / Voice Out (Fallback)** | Browser `SpeechRecognition` + `SpeechSynthesis` | Direct zero-friction voice interaction when Live Avatar transport is offline |

> **Live Avatar Status:** The real video avatar is wired via `backend/live_proxy.py` and gated behind `AVATAR_TRANSPORT`. The demo runs out-of-the-box on the standard Gemini brain with an interactive RM cockpit, and switches to the photoreal Live Avatar video stream with a single environment variable (`AVATAR_TRANSPORT=live`).

---

## Studio Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER STUDIO CLIENT                                │
│   React 18 • Vite • TypeScript • Tailwind CSS • ShadCN UI • Obsidian / Light     │
├──────────────────────────┬────────────────────────────┬──────────────────────────┤
│    Product Explorer      │   Portfolio Diagnostics    │   Goal Simulation Lab    │
│ (Carousel Rails / Matrix)│   (Asset Drift & Audit)    │  (15-Yr Compounding Cone)│
└────────────┬─────────────┴─────────────┬──────────────┴────────────┬─────────────┘
             │ WebSocket                 │ UI Commands               │ Direct Actions
             ▼                           ▼                           ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI ASYNCHRONOUS BACKEND                             │
│                  WebSocket Hub • Session Manager • Tool Dispatch                 │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│           Vertex AI Gemini 2.5         │      Gemini 3.1 Live Avatar Proxy       │
│  (Fiduciary Brain & Function Calling)  │     (BidiGenerateContent WebSocket)     │
├────────────────────────────────────────┼─────────────────────────────────────────┤
│       e-NACH Mandate Subsystem         │      ReportLab SEBI Proposal Engine     │
└────────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## Core Domain Concepts & Personas

- **Relationship Manager ("Ananya")**: Senior Private Wealth RM. Fiduciary-focused, data-driven, and proactive in identifying portfolio drift and concentration risks.
- **Client ("Rahul Sharma")**: 38-year-old tech executive based in Bengaluru/Pune with **₹75 Lakh in existing AUM**, targeting retirement by 2042 and children's higher education by 2032.
- **Curated Fund Universe**: 39 institutional-grade mutual funds, ETFs, Target Maturity Gilts, and Sovereign Gold instruments spanning Equity, Debt, Commodities, and Hybrid asset classes.

---

## Configuration (`.env`)

All settings live in `.env` at the repository root. Copy the template to start:

```bash
cp .env.example .env
```

### Key Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GCP_PROJECT` | *(Required)* | Primary Google Cloud Project ID for Vertex AI |
| `GCP_LOCATION` | `us-central1` | Default Vertex AI region |
| `BRAIN_MODEL` | `gemini-2.5-flash` | Conversational fiduciary brain model |
| `AVATAR_TRANSPORT` | `fallback` | Set to `live` to enable Gemini 3.1 Live Avatar streaming |
| `LIVE_PROJECT` | *(Optional)* | Allowlisted GCP Project ID for Gemini 3.1 Live API Private Preview |
| `LIVE_LOCATION` | `us-central1` | Region for Live Avatar WebSocket endpoint |
| `AVATAR_NAME` | `Aoede` | Selected avatar persona / voice |

---

## Authentication (Google Cloud ADC)

The studio authenticates to Vertex AI via **Application Default Credentials (ADC)** — no hardcoded API keys required:

```bash
# Authenticate local environment
gcloud auth application-default login
gcloud config set project <YOUR_GCP_PROJECT>
```

Verify authentication:
```bash
gcloud auth application-default print-access-token
```

---

## Quickstart & Local Development

The project is fully **Makefile-driven** utilizing `uv` for Python (3.12+) and `bun` for TypeScript/Frontend.

### 1. Install Full Stack Dependencies
```bash
make install
```

### 2. Start Services Concurrently
```bash
make dev
```
- **Backend API & WebSockets**: `http://localhost:8000`
- **Frontend Studio Canvas**: `http://localhost:5173`

### 3. Verification Pipeline
Run the 6-stage verification pipeline (formatting, linting, simulation tests, production builds):
```bash
make check
```

---

## 7-Turn Live Advisory Demo Script

| Turn | Investor Prompt | Studio Action & Visual Reaction |
|---|---|---|
| **1** | *"Review my ₹75L portfolio & goal progress"* | Ananya loads Rahul's profile, identifies ₹5L idle cash surplus, and opens **Portfolio Diagnostics**. |
| **2** | *"Audit my asset allocation drift"* | Canvas visualizes **70% Equity / 15% Debt / 10% Gold / 5% Cash** drift vs **65/20/10/5** Strategic Target. |
| **3** | *"Show me top Flexi Cap and US Tech funds"* | Product Explorer filters catalog into focused **Carousel Rails** highlighting top 5-star alpha engines. |
| **4** | *"Add Cymbal Flexi Cap and US Tech with ₹25k/mo SIP"* | Adds funds to **Advisory Basket**, updating monthly commitment total in real time. |
| **5** | *"Simulate ₹1 Lakh/month SIP for 2042 Retirement"* | Opens **Goal Simulation Lab**, rendering the **15-Year Compounding Growth Cone** to ₹5.82 Cr milestone. |
| **6** | *"Set up e-NACH auto-debit mandate"* | Opens **Mandate Modal** with HDFC Bank account verification, SEBI statutory consent, and 4-digit OTP authorization (`4242`). |
| **7** | *"Generate official Advisory Proposal PDF"* | Backend compiles and serves a formal, branded **SEBI Wealth Advisory Proposal PDF**. |

---

## Live Avatar Streaming (`AVATAR_TRANSPORT=live`)

The Gemini 3.1 Live Avatar is implemented via a bidirectional WebSocket proxy (`backend/live_proxy.py`):
1. Captures client microphone audio (16kHz PCM) and streams over WebSocket to Vertex `BidiGenerateContent`.
2. Receives fragmented MP4 video and 24kHz audio via Media Source Extensions (MSE) rendered directly onto an HTML5 `<canvas>`.
3. Dispatches fiduciary tool calls server-side, keeping the UI canvas and video stream synchronized.

---

## Deployment to Google Cloud Run

Deploy as a containerized serverless workload on Cloud Run:

```bash
./deploy.sh <YOUR_GCP_PROJECT> us-central1
```

The service runs under a dedicated Cloud Run Service Account with the `roles/aiplatform.user` IAM role.

---

## Verification & Testing Commands

```bash
make format       # Format Python (ruff) & Frontend (biome/prettier)
make lint         # Lint & typecheck (tsc, ruff)
make test         # Run 7-turn backend advisory simulation & ADC connectivity tests
make build        # Build fund catalog and production SPA bundle
make clean        # Clean caches, virtualenvs, and temporary files
```

