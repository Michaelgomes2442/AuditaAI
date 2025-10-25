#!/usr/bin/env bash
set -euo pipefail

echo "Auto-fix script starting"
git config user.email "actions@github.com"
git config user.name "GitHub Actions"

# Install deps if possible
if command -v pnpm >/dev/null 2>&1; then
  pnpm install --frozen-lockfile || true
fi

# Run eslint --fix if available
if command -v pnpm >/dev/null 2>&1 && pnpm -s exec -- eslint --version >/dev/null 2>&1; then
  echo "Running eslint --fix"
  pnpm -s exec eslint --fix . || true
fi

# Run prettier if available
if command -v pnpm >/dev/null 2>&1 && pnpm -s exec -- prettier --version >/dev/null 2>&1; then
  echo "Running prettier --write"
  pnpm -s exec prettier --write . || true
fi

# Optionally run other repo-specific fixers here

# If there are changes, commit them
if [ -n "$(git status --porcelain)" ]; then
  BRANCH="auto/fix-e2e-$(date +%s)"
  echo "Creating branch $BRANCH with fixes"
  git checkout -b "$BRANCH"
  git add -A
  git commit -m "chore(e2e): auto-fix lint/format from failing E2E"
  echo "Committed fixes to branch $BRANCH"
else
  echo "No fixes applied"
fi

echo "Auto-fix script finished"
