#!/usr/bin/env bash
set -euo pipefail

# Lightweight diagnostic script to probe deployed backend endpoints and save JSON outputs.
# Usage:
#   TARGET_HOST=auditaai.vercel.app VERCEL_BYPASS_TOKEN=... bash scripts/diagnose_backend.sh

TARGET_HOST=${TARGET_HOST:-}
if [[ -z "$TARGET_HOST" ]]; then
  echo "Usage: TARGET_HOST=auditaai.vercel.app VERCEL_BYPASS_TOKEN=... $0"
  exit 1
fi

OUT_DIR="scripts/_outputs"
mkdir -p "$OUT_DIR"

BYPASS=""
if [[ -n "${VERCEL_BYPASS_TOKEN:-}" ]]; then
  BYPASS="?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${VERCEL_BYPASS_TOKEN}"
fi

URL="https://${TARGET_HOST}"

echo "Probing ${URL} (bypass=${BYPASS:+yes})"

echo "GET /health"
curl -sS --fail "${URL}/health${BYPASS}" -o "$OUT_DIR/health.json" || echo "health request failed (saved output if any)"
echo " -> saved $OUT_DIR/health.json"

echo "POST /api/auth/signup (test user: e2e+automation@example.com)"
signup_payload='{"email":"e2e+automation@example.com","password":"Test1234!","name":"Automation"}'
curl -sS -X POST "${URL}/api/auth/signup${BYPASS}" -H "Content-Type: application/json" -d "$signup_payload" -o "$OUT_DIR/signup.json" -w "\nHTTP_STATUS:%{http_code}\n" || echo "signup request failed (saved output if any)"
echo " -> saved $OUT_DIR/signup.json"

echo "POST /api/auth/login"
login_payload='{"email":"e2e+automation@example.com","password":"Test1234!"}'
curl -sS -X POST "${URL}/api/auth/login${BYPASS}" -H "Content-Type: application/json" -d "$login_payload" -o "$OUT_DIR/login.json" -w "\nHTTP_STATUS:%{http_code}\n" || echo "login request failed (saved output if any)"
echo " -> saved $OUT_DIR/login.json"

echo "Finished. Outputs saved in $OUT_DIR. Inspect login.json for DEBUG_LOGIN payload or stack traces."
