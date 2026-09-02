#!/usr/bin/env python3
"""Test different live models and modalities against Vertex Bidi WebSocket."""

import asyncio, json, ssl, sys, os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import certifi
import google.auth
import google.auth.transport.requests
import websockets

MODELS_TO_TRY = [
    ("gemini-3.1-flash-live-preview-04-2026", ["VIDEO"]),
    ("gemini-2.0-flash-exp", ["AUDIO"]),
    ("gemini-2.0-flash", ["AUDIO"]),
    ("gemini-2.5-flash", ["AUDIO"]),
]


async def probe_model(ws, project_id, loc, model_name, modalities):
    setup_msg = {
        "setup": {
            "model": f"projects/{project_id}/locations/{loc}/publishers/google/models/{model_name}",
            "generationConfig": {
                "responseModalities": modalities,
                "speechConfig": {
                    "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Aoede"}}
                },
            },
        }
    }
    await ws.send(json.dumps(setup_msg))
    resp_raw = await asyncio.wait_for(ws.recv(), timeout=6)
    return json.loads(resp_raw)


async def run_probes():
    creds, default_proj = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    creds.refresh(google.auth.transport.requests.Request())
    token = creds.token
    project_id = "adhish-base-project-1"
    loc = "us-central1"

    headers = [("Authorization", f"Bearer {token}")]
    ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    uri = f"wss://{loc}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent"

    print("Probing Vertex AI Bidi WebSocket Models on project:", project_id)

    for mname, modalities in MODELS_TO_TRY:
        print(f"\nTesting '{mname}' with modalities {modalities}...")
        try:
            async with websockets.connect(
                uri,
                additional_headers=headers,
                ssl=ssl_ctx,
                max_size=16 * 1024 * 1024,
                open_timeout=8,
            ) as ws:
                res = await probe_model(ws, project_id, loc, mname, modalities)
                print(f"  ✅ SUCCESS! Response: {res}")
        except websockets.exceptions.ConnectionClosedError as e:
            print(f"  ❌ Closed (code {e.code}): {e.reason}")
        except Exception as e:
            print(f"  ❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(run_probes())
