#!/usr/bin/env bash
# Deploy Cymbal Direct — Style Studio to Cloud Run.
# Usage: ./deploy.sh [PROJECT] [REGION]
set -euo pipefail

PROJECT="${1:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${2:-us-central1}"
SERVICE="cymbal-direct-stylist"

echo "▶ Deploying $SERVICE to project=$PROJECT region=$REGION"

gcloud run deploy "$SERVICE" \
  --source . \
  --project "$PROJECT" \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --concurrency 20 \
  --set-env-vars "AVATAR_TRANSPORT=live,LIVE_PROJECT=${LIVE_PROJECT:-$PROJECT},LIVE_LOCATION=us-central1,GCP_PROJECT=${PROJECT},GCP_LOCATION=us-central1,IMAGE_LOCATION=global,BRAIN_LOCATION=global,BRAIN_MODEL=gemini-3.5-flash-lite,VTO_MODEL=gemini-3.1-flash-image,IMAGE_MODEL=gemini-3-pro-image"

URL=$(gcloud run services list --project "$PROJECT" \
  --filter="metadata.name=${SERVICE}" --format="value(status.url)")
echo "✅ Deployed: $URL"
echo "   Smoke test:  curl -s ${URL}/api/config"
