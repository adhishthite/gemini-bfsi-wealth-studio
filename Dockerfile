# ---- Stage 1: build the frontend ----
FROM node:20-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
# generated imagery lives in public/assets and is copied into the build
RUN npm run build

# ---- Stage 2: python runtime ----
FROM python:3.12-slim AS runtime
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install -r backend/requirements.txt

COPY backend/ ./backend/
# SPA build output + generated imagery
COPY --from=web /web/dist ./frontend/dist
COPY --from=web /web/public/assets ./frontend/public/assets

ENV AVATAR_TRANSPORT=fallback \
    GCP_LOCATION=us-central1 \
    PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
