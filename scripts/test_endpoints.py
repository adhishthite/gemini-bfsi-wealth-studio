#!/usr/bin/env python3
"""Test Gemini model connectivity across global, India (asia-south1, asia-south2), and US endpoints."""

import os
import sys
import time
from pathlib import Path

# Add project root to sys.path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import google.auth
from google.auth.transport.requests import Request
from google.genai import Client
from backend import config

PROJECT_ID = config.GCP_PROJECT

REGIONS_TO_TEST = [
    ("global", "Global / Multi-region"),
    ("asia-south1", "Mumbai, India (asia-south1)"),
    ("asia-south2", "Delhi, India (asia-south2)"),
    ("us-central1", "Iowa, US (us-central1)"),
]

MODELS_TO_TEST = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-3-pro-image",
    "gemini-3.1-flash-image",
    "gemini-3.1-flash-live-preview-04-2026",
]


def main():
    print("=" * 80)
    print(f"✦ PROBING VERTEX AI ENDPOINTS & REGIONAL MODEL AVAILABILITY")
    print(f"  Target Project: {PROJECT_ID}")
    print("=" * 80)

    try:
        creds, detected_proj = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        creds.refresh(Request())
        target_project = PROJECT_ID or detected_proj
        print(
            f"✅ ADC Authenticated: {getattr(creds, 'service_account_email', getattr(creds, 'account', 'ADC Account'))}"
        )
        print(f"  Project: {target_project}\n")
    except Exception as e:
        print(f"❌ ADC Auth Failed: {e}")
        return

    test_prompt = "Say 'OK from {location}' in 3 words."
    summary = []

    for loc, desc in REGIONS_TO_TEST:
        print(
            f"\n────────────────────────────────────────────────────────────────────────"
        )
        print(f"📍 Region: {desc} [{loc}]")
        print(
            f"────────────────────────────────────────────────────────────────────────"
        )

        try:
            client = Client(vertexai=True, project=target_project, location=loc)
        except Exception as e:
            print(f"  ❌ Client init failed for region {loc}: {e}")
            continue

        for model in MODELS_TO_TEST:
            start_t = time.perf_counter()
            try:
                resp = client.models.generate_content(
                    model=model,
                    contents=test_prompt.format(location=loc),
                )
                latency_ms = (time.perf_counter() - start_t) * 1000
                text = (resp.text or "").strip().replace("\n", " ")
                print(
                    f"  ✅ {model:<38} | {latency_ms:6.1f} ms | Response: {text[:50]}"
                )
                summary.append(
                    (loc, model, "AVAILABLE", f"{latency_ms:.0f}ms", text[:40])
                )
            except Exception as e:
                latency_ms = (time.perf_counter() - start_t) * 1000
                err_str = str(e)
                if "404" in err_str or "NOT_FOUND" in err_str:
                    status = "NOT_FOUND (404)"
                elif "403" in err_str or "PERMISSION_DENIED" in err_str:
                    status = "PERMISSION_DENIED (403)"
                elif "1008" in err_str or "Publisher model" in err_str:
                    status = "NOT_ENTITLED (1008)"
                elif "RESOURCE_EXHAUSTED" in err_str or "429" in err_str:
                    status = "QUOTA_EXHAUSTED (429)"
                else:
                    status = f"ERROR: {err_str[:40]}"
                print(f"  ❌ {model:<38} | {latency_ms:6.1f} ms | Status: {status}")
                summary.append((loc, model, status, f"{latency_ms:.0f}ms", ""))

    print("\n" + "=" * 80)
    print("📊 REGIONAL AVAILABILITY MATRIX SUMMARY")
    print("=" * 80)
    print(f"{'Region':<15} | {'Model':<38} | {'Status':<25} | {'Latency'}")
    print("-" * 88)
    for loc, model, status, lat, _ in summary:
        print(f"{loc:<15} | {model:<38} | {status:<25} | {lat}")
    print("=" * 80)


if __name__ == "__main__":
    main()
