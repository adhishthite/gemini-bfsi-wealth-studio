#!/usr/bin/env python3
"""Test ADC, Vertex AI authentication, and Gemini model responsiveness."""

import os, sys, json
from pathlib import Path

# Add project root to sys.path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import google.auth
from google.auth.transport.requests import Request
from google.genai import Client


def check_adc():
    print("[1/3] Checking Application Default Credentials (ADC)...")
    try:
        credentials, project = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        credentials.refresh(Request())
        print(f"  ✅ ADC Loaded successfully.")
        print(
            f"  • Detected Project: {project or os.environ.get('GOOGLE_CLOUD_PROJECT', 'adhish-base-project-1')}"
        )
        print(f"  • Token Valid: {credentials.valid}")
        print(
            f"  • Service Account / User: {getattr(credentials, 'service_account_email', getattr(credentials, 'account', 'ADC User Account'))}"
        )
        return True, credentials, project
    except Exception as e:
        print(f"  ❌ ADC Error: {e}")
        return False, None, None


def test_gemini_models(project_id="adhish-base-project-1", location="global"):
    print("\n[2/3] Testing Gemini Model Endpoints via Vertex AI (google-genai SDK)...")
    from backend import config

    models_to_test = [
        (
            config.BRAIN_MODEL,
            config.BRAIN_LOCATION,
            "What is the recommended equity-debt asset allocation for a 38-year old with moderately aggressive risk profile in one sentence?",
        ),
        (
            "gemini-2.5-flash",
            "global",
            "Calculate the future value of ₹1 Lakh monthly SIP compounded at 12% for 15 years in one sentence.",
        ),
    ]

    results = {}

    for model_name, loc, prompt in models_to_test:
        target_loc = loc or location
        print(f"\n  Testing Model: '{model_name}' in region '{target_loc}'...")
        try:
            client = Client(vertexai=True, project=project_id, location=target_loc)
            resp = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            text = resp.text.strip() if resp.text else "No text returned"
            print(f"    ✅ Response received ({len(text)} chars):")
            print(f'    ↳ "{text[:120]}..."')
            results[model_name] = {"status": "HEALTHY", "response_sample": text[:100]}
        except Exception as e:
            print(f"    ❌ Model Call Failed: {e}")
            results[model_name] = {"status": f"FAILED: {e}"}

    return results


def test_function_calling(project_id="adhish-base-project-1", location="global"):
    print("\n[3/3] Testing Gemini Function Calling & Tool Handling...")
    from backend import config
    from backend.tools import TOOL, system_instruction
    from backend.session import WealthSession

    session = WealthSession()
    sys_inst = system_instruction(session.portfolio, name="Ananya")

    target_loc = config.BRAIN_LOCATION or location
    client = Client(vertexai=True, project=project_id, location=target_loc)
    try:
        from google.genai import types

        resp = client.models.generate_content(
            model=config.BRAIN_MODEL,
            contents="Hi Ananya, please simulate my portfolio with 65% equity, 20% debt, 10% gold, 5% liquid and ₹1 Lakh monthly SIP.",
            config=types.GenerateContentConfig(
                system_instruction=sys_inst,
                tools=[TOOL],
                temperature=0.2,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )

        has_tool_call = False
        tool_name = None
        tool_args = {}

        if resp.function_calls:
            has_tool_call = True
            tool_name = resp.function_calls[0].name
            tool_args = dict(resp.function_calls[0].args)

        print(f"  ✅ Tool-Calling Test Completed.")
        print(f"  • Function called by model: {tool_name or 'None (Text only)'}")
        print(f"  • Tool args: {tool_args}")
        return True, tool_name
    except Exception as e:
        print(f"  ❌ Tool-calling test failed: {e}")
        return False, str(e)


if __name__ == "__main__":
    from backend import config

    project = (
        config.GCP_PROJECT
        or os.environ.get("GOOGLE_CLOUD_PROJECT")
        or "adhish-base-project-1"
    )
    region = config.GCP_LOCATION or os.environ.get("GOOGLE_CLOUD_REGION") or "global"

    adc_ok, creds, detected_proj = check_adc()
    target_project = detected_proj or project

    if adc_ok:
        model_results = test_gemini_models(target_project, region)
        tool_ok, tool_res = test_function_calling(target_project, region)
    else:
        print("\nSkipping model tests due to ADC failure.")
