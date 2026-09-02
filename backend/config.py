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


def _detect_default_project() -> str:
    """Auto-detect GCP Project from env vars, ADC credentials, or gcloud active config."""
    for key in ("GCP_PROJECT", "GOOGLE_CLOUD_PROJECT", "GCLOUD_PROJECT", "PROJECT_ID"):
        val = _env(key)
        if val:
            return val
    try:
        import google.auth

        creds, proj = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        if proj:
            return proj.strip()
        quota_proj = getattr(creds, "quota_project_id", None)
        if quota_proj:
            return quota_proj.strip()
    except Exception:
        pass
    try:
        import subprocess

        res = subprocess.run(
            ["gcloud", "config", "get-value", "project"],
            capture_output=True,
            text=True,
            timeout=2,
        )
        if res.returncode == 0 and res.stdout.strip():
            val = res.stdout.strip()
            if val and val != "(unset)":
                return val
    except Exception:
        pass
    return ""


def _detect_default_location() -> str:
    """Auto-detect default GCP region from env vars or fallback to us-central1."""
    return (
        _env("GCP_LOCATION")
        or _env("GOOGLE_CLOUD_REGION")
        or _env("CLOUD_ML_REGION")
        or "us-central1"
    )


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
ASSETS_DIR = BASE_DIR.parent / "frontend" / "public" / "assets"

# --- default project/region (used as fallback for the per-capability ones below) ---
GCP_PROJECT = _env("GCP_PROJECT") or _detect_default_project()
GCP_LOCATION = _detect_default_location()

# --- conversational brain (standard Gemini, Vertex) ---
BRAIN_PROJECT = _env("BRAIN_PROJECT") or GCP_PROJECT
BRAIN_LOCATION = _env("BRAIN_LOCATION") or "global"
BRAIN_MODEL = _env("BRAIN_MODEL") or "gemini-3.5-flash-lite"

# --- imagery (build-time catalog) + Virtual Try-On (runtime) ---
IMAGE_PROJECT = _env("IMAGE_PROJECT") or GCP_PROJECT
IMAGE_LOCATION = _env("IMAGE_LOCATION") or "global"
IMAGE_MODEL = (
    _env("IMAGE_MODEL") or "gemini-3-pro-image"
)  # high-fidelity catalog assets
VTO_MODEL = _env("VTO_MODEL") or "gemini-3.1-flash-image"  # faster runtime try-on

# --- Live Avatar (Gemini 3.1 Live API, Private Preview) ---
# AVATAR_TRANSPORT: fallback (default, no Live API; portrait + standard brain)
#                 | live (raw Vertex BidiGenerateContent proxy; needs an entitled LIVE_PROJECT)
AVATAR_TRANSPORT = (_env("AVATAR_TRANSPORT") or "fallback").lower()
LIVE_PROJECT = _env("LIVE_PROJECT") or (
    GCP_PROJECT if AVATAR_TRANSPORT == "live" else ""
)
LIVE_LOCATION = _env("LIVE_LOCATION") or "us-central1"
LIVE_MODEL = _env("LIVE_MODEL") or "gemini-3.1-flash-live-preview"
AVATAR_NAME = (
    _env("AVATAR_NAME") or "Ananya"
)  # built-in: Ananya, Jay, Paul, Sam, Ingrid, Kira, Vera, Ben, Kai, Leo, Carmen, Piper
AVATAR_VOICE = (
    _env("AVATAR_VOICE") or "Aoede"
)  # Puck, Aoede, Charon, Kore, Fenrir, Zephyr

# --- Fallback High-Fidelity Realistic TTS (DeepMind Journey) ---
FALLBACK_TTS_VOICE = _env("FALLBACK_TTS_VOICE") or "en-IN-Journey-F"
FALLBACK_MALE_TTS_VOICE = _env("FALLBACK_MALE_TTS_VOICE") or "en-IN-Journey-D"


def live_available() -> bool:
    return AVATAR_TRANSPORT == "live" and bool(LIVE_PROJECT)


# --- app ---
PORT = int(_env("PORT") or "8000")


def log_startup_config() -> None:
    """Print clean formatted runtime configuration at application startup."""
    live_status = (
        "ENABLED (Vertex Bidi WebSocket)"
        if live_available()
        else f"FALLBACK ({'LIVE_PROJECT missing' if AVATAR_TRANSPORT == 'live' else 'standard brain mode'})"
    )
    banner = (
        "\n"
        "================================================================================\n"
        "✦ CYMBAL PREMIER WEALTH STUDIO — RUNTIME CONFIGURATION\n"
        "================================================================================\n"
        f"  • Global GCP Project : {GCP_PROJECT or '(ADC default / auto-detect)'}\n"
        f"  • Global Region      : {GCP_LOCATION}\n"
        f"  • Server Port        : {PORT}\n"
        "────────────────────────────────────────────────────────────────────────────────\n"
        f"  • Brain Model        : {BRAIN_MODEL}\n"
        f"    ↳ Brain Target     : project={BRAIN_PROJECT or GCP_PROJECT or '(default)'}, location={BRAIN_LOCATION}\n"
        "────────────────────────────────────────────────────────────────────────────────\n"
        f"  • Image Model        : {IMAGE_MODEL}\n"
        f"  • VTO Model          : {VTO_MODEL}\n"
        f"    ↳ Image Target     : project={IMAGE_PROJECT or GCP_PROJECT or '(default)'}, location={IMAGE_LOCATION}\n"
        "────────────────────────────────────────────────────────────────────────────────\n"
        f"  • Avatar Transport   : {AVATAR_TRANSPORT.upper()} [{live_status}]\n"
        f"  • Live Model         : {LIVE_MODEL}\n"
        f"    ↳ Live Target      : project={LIVE_PROJECT or '(not set)'}, location={LIVE_LOCATION}\n"
        f"  • Live Persona/Voice : {AVATAR_NAME or 'Ananya'} (Live API Voice: {AVATAR_VOICE or 'Aoede'})\n"
        f"  • Fallback Voice TTS : DeepMind Journey ({FALLBACK_TTS_VOICE})\n"
        "================================================================================\n"
    )
    print(banner, flush=True)
