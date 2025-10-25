#!/usr/bin/env bash
set -euo pipefail

# Wrapper to run the Playwright bypass script against a deployed target.
# Usage:
#   TARGET_HOST=auditaai.vercel.app VERCEL_BYPASS_TOKEN=... bash scripts/run_e2e_deploy.sh

if [[ -z "${TARGET_HOST:-}" ]]; then
  echo "Usage: TARGET_HOST=auditaai.vercel.app VERCEL_BYPASS_TOKEN=... $0"
  exit 1
fi

echo "Running Playwright bypass script against $TARGET_HOST"

exec env TARGET_HOST="$TARGET_HOST" VERCEL_BYPASS_TOKEN="${VERCEL_BYPASS_TOKEN:-}" node backend/scripts/playwright_bypass.cjs "$@"
