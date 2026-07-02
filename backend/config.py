"""Central configuration for the Cymbal Direct Style Studio backend.

All settings are environment variables, loaded from a `.env` file at the project root
(see `.env.example`). Each AI capability can target a DIFFERENT GCP project/region:

  • Brain (text + tools) ....... BRAIN_PROJECT / BRAIN_LOCATION / BRAIN_MODEL   (Vertex)
  • Imagery + Virtual Try-On .... IMAGE_PROJECT / IMAGE_LOCATION / IMAGE_MODEL / VTO_MODEL
  • Live Avatar ................. LIVE_PROJECT  / LIVE_LOCATION  / LIVE_MODEL    (entitled project!)

Auth is Google ADC — no keys in code. Locally:  gcloud auth application-default login
On a GCP VM / Cloud Run: the attached service account is used automatically.
"""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except Exception:  # python-dotenv optional; env vars still work
    pass


def _env(key: str, default: str = "") -> str:
    return (os.environ.get(key, default) or "").strip().strip('"').strip("'")


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
ASSETS_DIR = BASE_DIR.parent / "frontend" / "public" / "assets"

# --- default project/region (used as fallback for the per-capability ones below) ---
GCP_PROJECT = _env("GCP_PROJECT", "")   # set in .env (see .env.example)
GCP_LOCATION = _env("GCP_LOCATION", "us-central1")

# --- conversational brain (standard Gemini, Vertex) ---
BRAIN_PROJECT = _env("BRAIN_PROJECT") or GCP_PROJECT
BRAIN_LOCATION = _env("BRAIN_LOCATION") or GCP_LOCATION
BRAIN_MODEL = _env("BRAIN_MODEL", "gemini-2.5-flash")

# --- imagery (build-time catalog) + Virtual Try-On (runtime) ---
IMAGE_PROJECT = _env("IMAGE_PROJECT") or GCP_PROJECT
IMAGE_LOCATION = _env("IMAGE_LOCATION", "global")
IMAGE_MODEL = _env("IMAGE_MODEL", "gemini-3-pro-image")      # high-fidelity catalog assets
VTO_MODEL = _env("VTO_MODEL", "gemini-3.1-flash-image")      # faster runtime try-on

# --- Live Avatar (Gemini 3.1 Live API, Private Preview) ---
# AVATAR_TRANSPORT: fallback (default, no Live API; portrait + standard brain)
#                 | live (raw Vertex BidiGenerateContent proxy; needs an entitled LIVE_PROJECT)
AVATAR_TRANSPORT = _env("AVATAR_TRANSPORT", "fallback").lower()
LIVE_PROJECT = _env("LIVE_PROJECT")                         # entitled project (set in .env); required for live
LIVE_LOCATION = _env("LIVE_LOCATION") or "us-central1"
LIVE_MODEL = _env("LIVE_MODEL", "gemini-3.1-flash-live-preview-04-2026")
AVATAR_NAME = _env("AVATAR_NAME", "Kira")                   # built-in: Jay, Paul, Sam, Ingrid, Kira, Vera, Ben, Kai, Leo, Carmen, Piper
AVATAR_VOICE = _env("AVATAR_VOICE", "Aoede")               # Puck, Aoede, Charon, Kore, Fenrir, Zephyr


def live_available() -> bool:
    return AVATAR_TRANSPORT == "live" and bool(LIVE_PROJECT)

# --- app ---
# The stylist's NAME is always the selected avatar's name (no separate persona name).
PORT = int(_env("PORT", "8000") or "8000")
