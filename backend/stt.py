"""Multimodal Speech-to-Text transcription powered by Gemini on Vertex AI.

Handles audio in any format (WebM, WAV, MP3, OGG) with native support for
Indian English, Hindi, and Hinglish financial vocabulary.
"""

from __future__ import annotations
import asyncio
from google import genai
from google.genai import types

from . import config

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(
            vertexai=True,
            project=config.BRAIN_PROJECT or config.GCP_PROJECT,
            location=config.BRAIN_LOCATION,
        )
    return _client


def _sync_transcribe(audio_bytes: bytes, mime_type: str) -> str:
    try:
        client = _get_client()
        part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
        prompt = (
            "Listen to this audio carefully and transcribe exactly what the speaker said. "
            "The speaker is discussing private wealth management, mutual funds, investments, and SIPs in India. "
            "Preserve Indian English, Hindi, and financial terms (Lakhs, Crores, SIP, Flexi Cap, e-NACH, OTP digits). "
            "Output ONLY the transcribed text, with no preamble, quotes, or markdown explanation."
        )
        resp = client.models.generate_content(
            model=config.BRAIN_MODEL,
            contents=[part, prompt],
            config=types.GenerateContentConfig(
                temperature=0,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        return (resp.text or "").strip()
    except Exception as e:
        print(f"[stt] Transcription error: {e}")
        return ""


async def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    """Transcribe spoken audio bytes into text asynchronously."""
    if not audio_bytes:
        return ""
    return await asyncio.to_thread(_sync_transcribe, audio_bytes, mime_type)
