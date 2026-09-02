# ==============================================================================
# Multi-stage Dockerfile for Cymbal Premier Wealth Studio on Cloud Run
# Stage 1: Build React/Vite Frontend using Bun
# Stage 2: Production Python 3.12 Backend + Static SPA server
# ==============================================================================

# --- Stage 1: Frontend Build ---
FROM oven/bun:1-slim AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package.json ./
COPY frontend/bun.lock* ./
RUN bun install

# Copy frontend source code and compile production assets
COPY frontend/ ./
RUN bun run build

# --- Stage 2: Production Runtime ---
FROM python:3.12-slim AS runtime
WORKDIR /app

# Ensure Python doesn't buffer logs and doesn't write bytecode
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    PORT=8080

# Install system dependencies (ca-certificates & curl for health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast Python dependency installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN uv pip install --system --no-cache -r backend/requirements.txt

# Copy backend source & scripts
COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Copy public static assets & compiled frontend SPA bundle
COPY frontend/public/ ./frontend/public/
COPY --from=frontend-builder /app/frontend/dist/ ./frontend/dist/

# Ensure generated assets directory exists for PDF proposals
RUN mkdir -p frontend/public/assets/proposals

# Pre-generate curated funds dataset
RUN python scripts/build_funds.py

# Cloud Run injects PORT environment variable
EXPOSE 8080

# Healthcheck for container readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/api/config || exit 1

# Start FastAPI application via Uvicorn
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 2 --ws websockets"]
