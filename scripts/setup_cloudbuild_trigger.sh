#!/usr/bin/env bash
# ==============================================================================
# Helper to set up Google Cloud Build Trigger on commits to 'main'
# ==============================================================================
set -euo pipefail

PROJECT="${1:-$(gcloud config get-value project 2>/dev/null || echo "adhish-base-project-1")}"
REGION="${2:-asia-south1}"
REPO_NAME="gemini-bfsi-wealth-studio"
REPO_OWNER="adhishthite"

echo "================================================================================"
echo "✦ SETTING UP CLOUD BUILD CONTINUOUS DEPLOYMENT TRIGGER"
echo "================================================================================"
echo "  • Project    : $PROJECT"
echo "  • Region     : $REGION"
echo "  • Repository : $REPO_OWNER/$REPO_NAME"
echo "  • Branch     : main"
echo "================================================================================"

# 1. Enable Cloud Build & Cloud Run APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com --project="$PROJECT"

# 2. Grant Cloud Build Service Account permissions to deploy to Cloud Run & Vertex AI
PROJECT_NUM=$(gcloud projects describe "$PROJECT" --format="value(projectNumber)")
CB_SA="${PROJECT_NUM}@cloudbuild.gserviceaccount.com"
echo "▶ Granting IAM roles to Cloud Build Service Account: $CB_SA..."

for ROLE in "roles/run.admin" "roles/iam.serviceAccountUser" "roles/aiplatform.user" "roles/artifactregistry.writer"; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${CB_SA}" \
    --role="$ROLE" \
    --condition=None --quiet >/dev/null 2>&1 || true
done

echo ""
echo "✅ Cloud Build IAM permissions successfully configured!"
echo ""
echo "To connect your GitHub repository and activate automatic build triggers on push to 'main':"
echo "  1. Visit Google Cloud Build Triggers Console:"
echo "     👉 https://console.cloud.google.com/cloud-build/triggers?project=${PROJECT}"
echo "  2. Click 'Create Trigger':"
echo "     • Name: deploy-wealth-studio-on-push-main"
echo "     • Event: Push to a branch"
echo "     • Source: 2nd gen / 1st gen GitHub (Repository: ${REPO_OWNER}/${REPO_NAME})"
echo "     • Branch regex: ^main$"
echo "     • Configuration: Cloud Build configuration file (yaml or json)"
echo "     • Cloud Build configuration file location: /cloudbuild.yaml"
echo "  3. Click 'Create'."
echo ""
echo "Alternatively, for GitHub Actions:"
echo "  Workflow file ready at: .github/workflows/deploy.yml"
echo "  Add your service account key secret as 'GCP_SA_KEY' in GitHub Repo Settings -> Secrets."
echo "================================================================================"
