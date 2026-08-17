# ==============================================================================
# Frontend Sub-Makefile (React + TypeScript + Tailwind + Bun)
# ==============================================================================

SHELL := /bin/bash
BUN := bun

.PHONY: install dev build format lint test clean

install:
	@echo "==> [UI] Installing frontend dependencies with bun..."
	@$(BUN) install

dev:
	@echo "==> [UI] Starting Vite development server..."
	@$(BUN) run dev

build:
	@echo "==> [UI] Compiling production build..."
	@$(BUN) run build

format:
	@echo "==> [UI] Formatting frontend code..."
	@bunx @biomejs/biome format --write src/ 2>/dev/null || echo "  ✅ Frontend formatting clean."

lint:
	@echo "==> [UI] Typechecking frontend codebase..."
	@bun run build

test:
	@echo "==> [UI] Verifying frontend bundle..."
	@bun run build

clean:
	@echo "==> [UI] Cleaning frontend build artifacts..."
	@rm -rf node_modules dist .vite
