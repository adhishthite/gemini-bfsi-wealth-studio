# ==============================================================================
# Cymbal Premier — Private Wealth Studio Root Cascading Makefile
# Coordinates Backend (FastAPI, Python 3.12+, uv) and Frontend (React, TS, Bun)
# ==============================================================================

SHELL := /bin/bash
VENV := .venv
PYTHON := $(VENV)/bin/python
BUN := bun

.PHONY: help install install-backend install-frontend \
        run start dev \
        build build-backend build-frontend \
        format format-backend format-frontend \
        lint lint-backend lint-frontend \
        test test-backend test-frontend \
        check clean clean-backend clean-frontend \
        deploy

# Default target
help:
	@echo "Cymbal Premier Wealth Studio — Cascading Makefile"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Services Orchestration:"
	@echo "  make dev / run / start  - Start BACKEND (:8000) & FRONTEND (:5173) concurrently"
	@echo ""
	@echo "Cascading Lifecycle Targets (Backend + Frontend):"
	@echo "  make install            - Install dependencies for both Backend (uv) and Frontend (bun)"
	@echo "  make build              - Generate fund catalog and compile frontend production bundle"
	@echo "  make format             - Format both Python and TypeScript codebases"
	@echo "  make lint               - Lint & typecheck both Python and Frontend codebases"
	@echo "  make test               - Run backend simulation tests & verify frontend build"
	@echo "  make check              - Run full verification pipeline (format + lint + test + build + format + lint)"
	@echo "  make clean              - Clean virtualenvs, node_modules, build outputs, and caches"

# ==============================================================================
# 1. Installation (Cascading)
# ==============================================================================
install: install-backend install-frontend
	@echo "==> ✅ Full stack dependencies installed successfully."

install-backend:
	@echo "==> [Backend] Initializing .venv with uv..."
	@if [ ! -d "$(VENV)" ]; then uv venv; fi
	@echo "==> [Backend] Installing Python dependencies..."
	@uv pip install --default-index https://pypi.org/simple -r backend/requirements.txt

install-frontend:
	@$(MAKE) -C frontend install

# ==============================================================================
# 2. Service Orchestration (Concurrently running Backend & Frontend)
# ==============================================================================
dev run start:
	@echo "==> Starting Cymbal Premier Wealth Studio (Backend + Frontend concurrently)..."
	@bunx concurrently \
		--kill-others \
		--prefix "[{name}]" \
		--names "BACKEND,FRONTEND" \
		--prefix-colors "blue.bold,cyan.bold" \
		"$(PYTHON) -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload" \
		"cd frontend && $(BUN) run dev"

# ==============================================================================
# 3. Build (Cascading)
# ==============================================================================
build: build-backend build-frontend
	@echo "==> ✅ Full stack build complete."

build-backend:
	@echo "==> [Backend] Building fund catalog data..."
	@$(PYTHON) scripts/build_funds.py

build-frontend:
	@$(MAKE) -C frontend build

# ==============================================================================
# 4. Code Quality: Format & Lint (Cascading)
# ==============================================================================
format: format-backend format-frontend

format-backend:
	@$(PYTHON) scripts/format_and_lint.py format

format-frontend:
	@$(MAKE) -C frontend format

lint: lint-backend lint-frontend

lint-backend:
	@$(PYTHON) scripts/format_and_lint.py lint

lint-frontend:
	@$(MAKE) -C frontend lint

# ==============================================================================
# 5. Test Suite (Cascading)
# ==============================================================================
test: test-backend test-frontend

test-backend:
	@echo "==> [Backend] Running 7-turn advisory simulation runbook..."
	@$(PYTHON) scripts/simulate_wealth_demo.py
	@echo "==> [Backend] Running ADC & Gemini model connectivity tests..."
	@$(PYTHON) scripts/test_adc_and_models.py

test-frontend:
	@$(MAKE) -C frontend test

# ==============================================================================
# 6. Verification Pipeline (format + lint + test + build + format + lint)
# ==============================================================================
check:
	@echo "==> [Pipeline 1/6] Formatting full stack..."
	@$(MAKE) format
	@echo "==> [Pipeline 2/6] Linting full stack..."
	@$(MAKE) lint
	@echo "==> [Pipeline 3/6] Running full test suites..."
	@$(MAKE) test
	@echo "==> [Pipeline 4/6] Building production artifacts..."
	@$(MAKE) build
	@echo "==> [Pipeline 5/6] Final format validation..."
	@$(MAKE) format
	@echo "==> [Pipeline 6/6] Final lint validation..."
	@$(MAKE) lint
	@echo "==> 🎉 Full cascading verification pipeline PASSED successfully!"

# ==============================================================================
# 7. Clean (Cascading)
# ==============================================================================
clean: clean-backend clean-frontend
	@echo "==> ✅ Full stack clean complete."

clean-backend:
	@echo "==> [Backend] Cleaning virtualenv, pycache, ruff, and test artifacts..."
	@rm -rf $(VENV) .ruff_cache .pytest_cache
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@rm -f assets/proposals/test_*.pdf

clean-frontend:
	@$(MAKE) -C frontend clean

# ==============================================================================
# 8. Deployment (Google Cloud Run)
# ==============================================================================
deploy:
	@./deploy.sh
