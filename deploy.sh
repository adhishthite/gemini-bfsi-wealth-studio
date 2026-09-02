#!/usr/bin/env bash
# ==============================================================================
# Deploy Cymbal Premier — Private Wealth Studio to Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION] [SERVICE_NAME]
# ==============================================================================
set -euo pipefail

# 1. Project & Region Resolution
PROJECT="${1:-$(gcloud config get-value project 2>/dev/null || echo "")}"
REGION="${2:-asia-south1}"
SERVICE="${3:-gemini-bfsi-wealth-studio}"

if [ -z "$PROJECT" ]; then
  echo "❌ ERROR: No GCP project specified or found in active gcloud config."
  echo "Usage: ./deploy.sh [PROJECT_ID] [REGION] [SERVICE_NAME]"
  exit 1
fi

echo "================================================================================"
echo "✦ DEPLOYING CYMBAL PREMIER WEALTH STUDIO TO GOOGLE CLOUD RUN"
echo "================================================================================"
echo "  • GCP Project  : $PROJECT"
echo "  • Cloud Region : $REGION"
echo "  • Service Name : $SERVICE"
echo "  • Source Dir   : $(pwd)"
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
  --set-env-vars "GCP_PROJECT=${PROJECT},GCP_LOCATION=${REGION},BRAIN_LOCATION=global,BRAIN_MODEL=gemini-3.5-flash-lite,IMAGE_LOCATION=global,IMAGE_MODEL=gemini-3-pro-image,VTO_MODEL=gemini-3.1-flash-image,AVATAR_TRANSPORT=fallback,FALLBACK_TTS_VOICE=en-IN-Journey-F"

# 5. Fetch Deployed URL & Smoke Test
echo "▶ [4/4] Validating deployment..."
URL=$(gcloud run services describe "$SERVICE" \
  --project "$PROJECT" \
  --region "$REGION" \
  --format="value(status.url)")

# Ensure invoker access for authenticated account domain
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
