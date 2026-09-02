#!/usr/bin/env bash
# ==============================================================================
# Deploy Cymbal Premier — Private Wealth Studio to Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION] [SERVICE_NAME]
# ==============================================================================
set -euo pipefail

# 1. Project & Region Resolution
if [ -f .env ]; then
  echo "▶ Loading configuration from .env..."
fi

# Resolve environment variables from .env or environment
ENV_VARS=$(python3 - <<'EOF'
import os

env_vars = {}
if os.path.exists(".env"):
    try:
        from dotenv import dotenv_values
        env_vars = dotenv_values(".env")
    except Exception:
        pass

def val(k, d=""):
    return os.environ.get(k) or env_vars.get(k) or d

project = os.environ.get("PROJECT") or val("GCP_PROJECT")
region = os.environ.get("REGION") or val("GCP_LOCATION", "asia-south1")
transport = val("AVATAR_TRANSPORT", "fallback").lower()
live_proj = val("LIVE_PROJECT", project if transport == "live" else "")
live_loc = val("LIVE_LOCATION", "us-central1")
live_model = val("LIVE_MODEL", "gemini-3.1-flash-live-preview-04-2026")
avatar_name = val("AVATAR_NAME", "Kira")
avatar_voice = val("AVATAR_VOICE", "Aoede")
brain_loc = val("BRAIN_LOCATION", "global")
brain_model = val("BRAIN_MODEL", "gemini-3.5-flash-lite")
brain_proj = val("BRAIN_PROJECT", project)
img_loc = val("IMAGE_LOCATION", "global")
img_model = val("IMAGE_MODEL", "gemini-3-pro-image")
img_proj = val("IMAGE_PROJECT", project)
vto_model = val("VTO_MODEL", "gemini-3.1-flash-image")
tts_voice = val("FALLBACK_TTS_VOICE", "en-IN-Journey-F")

cfg = {
    "GCP_PROJECT": project,
    "GCP_LOCATION": region,
    "BRAIN_PROJECT": brain_proj,
    "BRAIN_LOCATION": brain_loc,
    "BRAIN_MODEL": brain_model,
    "IMAGE_PROJECT": img_proj,
    "IMAGE_LOCATION": img_loc,
    "IMAGE_MODEL": img_model,
    "VTO_MODEL": vto_model,
    "AVATAR_TRANSPORT": transport,
    "LIVE_PROJECT": live_proj,
    "LIVE_LOCATION": live_loc,
    "LIVE_MODEL": live_model,
    "AVATAR_NAME": avatar_name,
    "AVATAR_VOICE": avatar_voice,
    "FALLBACK_TTS_VOICE": tts_voice,
}
print(",".join(f"{k}={v}" for k, v in cfg.items() if v))
EOF
)

PROJECT="${1:-$(echo "$ENV_VARS" | tr ',' '\n' | grep '^GCP_PROJECT=' | cut -d= -f2 || echo "")}"
if [ -z "$PROJECT" ]; then
  PROJECT="$(gcloud config get-value project 2>/dev/null || echo "")"
fi
REGION="${2:-$(echo "$ENV_VARS" | tr ',' '\n' | grep '^GCP_LOCATION=' | cut -d= -f2 || echo "asia-south1")}"
SERVICE="${3:-gemini-bfsi-wealth-studio}"

if [ -z "$PROJECT" ]; then
  echo "❌ ERROR: No GCP project specified or found in active gcloud config or .env."
  echo "Usage: ./deploy.sh [PROJECT_ID] [REGION] [SERVICE_NAME]"
  exit 1
fi

AVATAR_MODE=$(echo "$ENV_VARS" | tr ',' '\n' | grep '^AVATAR_TRANSPORT=' | cut -d= -f2 || echo "fallback")
LIVE_PROJ_VAL=$(echo "$ENV_VARS" | tr ',' '\n' | grep '^LIVE_PROJECT=' | cut -d= -f2 || echo "")
LIVE_MODEL_VAL=$(echo "$ENV_VARS" | tr ',' '\n' | grep '^LIVE_MODEL=' | cut -d= -f2 || echo "")

echo "================================================================================"
echo "✦ DEPLOYING CYMBAL PREMIER WEALTH STUDIO TO GOOGLE CLOUD RUN"
echo "================================================================================"
echo "  • GCP Project      : $PROJECT"
echo "  • Cloud Region     : $REGION"
echo "  • Service Name     : $SERVICE"
echo "  • Avatar Transport : $AVATAR_MODE"
if [ "$AVATAR_MODE" = "live" ]; then
  echo "    ↳ Live Project   : $LIVE_PROJ_VAL"
  echo "    ↳ Live Model     : $LIVE_MODEL_VAL"
fi
echo "  • Source Dir       : $(pwd)"
echo "================================================================================"

# 2. Verify required GCP APIs are enabled
echo "▶ [1/4] Verifying required GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com \
  texttospeech.googleapis.com \
  --project "$PROJECT"

# 3. Resolve Project Number for Compute Service Account IAM
echo "▶ [2/4] Verifying Service Account IAM permissions..."
PROJECT_NUM=$(gcloud projects describe "$PROJECT" --format="value(projectNumber)" 2>/dev/null || echo "")
if [ -n "$PROJECT_NUM" ]; then
  SA_EMAIL="${PROJECT_NUM}-compute@developer.gserviceaccount.com"
  echo "  • Default Service Account: $SA_EMAIL"
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/aiplatform.user" \
    --condition=None --quiet >/dev/null 2>&1 || true
fi

# 4. Deploy Unified Container to Cloud Run (Builds via Dockerfile on Cloud Build)
echo "▶ [3/4] Building container and deploying to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --source . \
  --project "$PROJECT" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 10 \
  --quiet \
  --set-env-vars "$ENV_VARS"

# 5. Fetch Deployed URL & Smoke Test
echo "▶ [4/4] Validating deployment..."
URL=$(gcloud run services describe "$SERVICE" \
  --project "$PROJECT" \
  --region "$REGION" \
  --format="value(status.url)")

# Ensure invoker access for public access and authenticated account domain
gcloud run services add-iam-policy-binding "$SERVICE" \
  --project "$PROJECT" \
  --region "$REGION" \
  --member="allUsers" \
  --role="roles/run.invoker" --quiet >/dev/null 2>&1 || true

ACTIVE_ACCOUNT=$(gcloud config get-value account 2>/dev/null || echo "")
ACCOUNT_DOMAIN="${ACTIVE_ACCOUNT#*@}"
if [ -n "$ACCOUNT_DOMAIN" ]; then
  gcloud run services add-iam-policy-binding "$SERVICE" \
    --project "$PROJECT" \
    --region "$REGION" \
    --member="domain:${ACCOUNT_DOMAIN}" \
    --role="roles/run.invoker" --quiet >/dev/null 2>&1 || true
fi

echo ""
echo "================================================================================"
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "================================================================================"
echo "  • Live Web App URL : $URL"
echo "  • API Healthcheck  : ${URL}/api/config"
echo "  • WebSocket Route  : wss://${URL#https://}/ws"
echo "================================================================================"
echo ""
echo "Smoke test response from live endpoint:"
AUTH_TOKEN=$(gcloud auth print-identity-token 2>/dev/null || echo "")
if [ -n "$AUTH_TOKEN" ]; then
  curl -s -H "Authorization: Bearer ${AUTH_TOKEN}" "${URL}/api/config" || true
else
  curl -s "${URL}/api/config" || true
fi
echo ""
