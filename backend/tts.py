"""Google Cloud DeepMind Journey & Neural2 Text-to-Speech synthesizer.

Uses Application Default Credentials (ADC) to generate studio-quality,
conversational Indian English voice audio for fallback mode.
"""

from __future__ import annotations
import asyncio
import json
import re
import urllib.request
import google.auth
import google.auth.transport.requests

from . import config

_creds = None
_creds_lock = asyncio.Lock()


def _get_creds():
    global _creds
    if _creds is None:
        _creds, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
    if not _creds.valid:
        _creds.refresh(google.auth.transport.requests.Request())
    return _creds


FEMALE_AVATARS = {"Ananya", "Kira", "Vera", "Piper", "Ingrid", "Carmen"}
MALE_AVATARS = {"Jay", "Paul", "Sam", "Kai", "Ben", "Leo"}


def clean_text_for_speech(text: str) -> str:
    """Strip markdown formatting, symbols, and bullets for natural spoken audio."""
    if not text:
        return ""
    # Remove markdown links [text](url) -> text
    t = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    # Remove bold/italic markers
    t = re.sub(r"[*_~`#]", "", t)
    # Remove table delimiters and bullets
    t = re.sub(r"^[ \t]*[-•*]\s+", "", t, flags=re.MULTILINE)
    t = re.sub(r"\|", " ", t)
    # Clean whitespace
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _sync_synthesize(text: str, voice_name: str, project_id: str) -> str | None:
    try:
        creds = _get_creds()
        url = "https://texttospeech.googleapis.com/v1/text:synthesize"
        headers = {
            "Authorization": f"Bearer {creds.token}",
            "Content-Type": "application/json",
        }
        effective_proj = project_id or config.GCP_PROJECT
        if effective_proj:
            headers["X-Goog-User-Project"] = effective_proj
        lang = (
            "en-IN"
            if "en-IN" in voice_name
            else ("en-US" if "en-US" in voice_name else "en-IN")
        )
        data = {
            "input": {"text": text},
            "voice": {"languageCode": lang, "name": voice_name},
            "audioConfig": {"audioEncoding": "MP3", "speakingRate": 1.02},
        }
        req = urllib.request.Request(
            url, data=json.dumps(data).encode("utf-8"), headers=headers
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            return res.get("audioContent")
    except Exception as e:
        print(f"[tts] DeepMind Journey synthesis notice: {e}")
        return None


async def synthesize_speech(text: str, avatar: str = "") -> str | None:
    """Synthesize text into high-fidelity realistic MP3 base64 using DeepMind Journey voices."""
    clean = clean_text_for_speech(text)
    if not clean:
        return None

    persona = avatar or config.AVATAR_NAME or "Ananya"
    if persona in MALE_AVATARS:
        voice = config.FALLBACK_MALE_TTS_VOICE or "en-IN-Journey-D"
    else:
        voice = config.FALLBACK_TTS_VOICE or "en-IN-Journey-F"

    project_id = config.GCP_PROJECT
    return await asyncio.to_thread(_sync_synthesize, clean, voice, project_id)
